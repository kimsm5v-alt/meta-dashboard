# 학습심리정서검사 일괄다운로드(2단계 방식) 변경 안내 — FE 연동 가이드

> **작성일**: 2026-05-27
> **대상**: 프론트엔드 개발자
> **관련 API**: `GET /api/dgnss/dgnss-download-all`, `GET /pfile-download`

---

## 1. 무엇이 바뀌었나

기존 `GET /api/dgnss/dgnss-download-all` 은 zip 파일을 **메모리에서 만들어 그대로 스트리밍**(octet-stream)했습니다. 이 방식은
- 학생 수가 많으면 zip 전체가 힙에 올라가 **OOM(Java heap space)** 위험
- zip 생성에 수 초가 걸려 그 사이 연결이 끊기면 **Broken pipe / `AsyncRequestNotUsableException`** 발생
- 다운로드 **이어받기 불가**

문제가 있었습니다.

이를 해결하기 위해 **2단계 방식**으로 변경했습니다.

| | 변경 전 | 변경 후 |
|---|---|---|
| 응답 형식 | `application/octet-stream` (zip 바이너리 스트림) | `application/json` (`ResponseDTO`) |
| 동작 | 매 호출마다 zip 생성 후 스트리밍 | zip 을 NAS 에 저장하고 **다운로드 URL** 반환 |
| 다운로드 | 이 API 응답이 곧 파일 | 반환된 URL 을 `/pfile-download` 로 별도 다운로드 |
| 이어받기 | 불가 | **가능** (`/pfile-download` 가 HTTP Range 지원) |

> 경로와 쿼리 파라미터(`jwtToken`, `dgnssId`, `type`)는 **그대로**입니다. **응답 형식만** 바뀌었습니다.

---

## 2. 새 연동 흐름 (2단계)

```
[1단계] GET /api/dgnss/dgnss-download-all?dgnssId=..&type=..&jwtToken=..
          → JSON 으로 zipFileUrl 수신 (zip 생성 또는 기존 것 재사용)

[2단계] GET /pfile-download?url=<zipFileUrl>&jwtToken=..
          → 실제 zip 파일 다운로드 (이어받기 지원)
```

### 2.1 1단계 — zip 생성 / URL 조회

**요청**
```
GET /api/dgnss/dgnss-download-all?dgnssId=184&type=1&jwtToken=<JWT>
```

| 파라미터 | 필수 | 설명 |
|---|:---:|---|
| `dgnssId` | O | 검사 ID |
| `type` | X (기본 `1`) | `1`: 상세 보고서 / `2`: 요약 보고서 / `3`: 상세+요약 폴더 압축 |
| `jwtToken` | O | 기존과 동일 |

**응답** (`200 OK`, `application/json`)
```json
{
  "result": {
    "code": "0",
    "message": "학습심리정서검사 일괄다운로드"
  },
  "body": {
    "data": {
      "zipFileUrl": "/{nas경로}/20260527/[1반]종합학습검사_1차(ab12...cd).zip"
    }
  }
}
```
> 실제 응답 래퍼(`ResponseDTO<CustomBody>`) 구조는 다른 API 와 동일합니다. **`data.zipFileUrl`** 값을 사용하세요.

**동작 특성 (캐싱)**
- 같은 `dgnssId` + `type` 에 대해 **이미 생성된 zip 이 있으면** 재생성 없이 그 URL 을 즉시 반환합니다(빠름).
- 없으면 zip 을 새로 만들어 NAS 에 저장 후 URL 을 반환합니다(학생 수에 따라 수 초 소요 가능).
- type 별로 URL 이 따로 관리됩니다(상세/요약/통합 각각 별도 컬럼).

### 2.2 2단계 — 실제 다운로드

1단계에서 받은 `zipFileUrl` 을 그대로 `url` 파라미터에 넣어 호출합니다.

**요청**
```
GET /pfile-download?url=<zipFileUrl>&jwtToken=<JWT>
```

**응답**
- `200 OK` + `Content-Disposition: attachment; filename*=UTF-8''...zip` → 파일 다운로드
- `Range` 헤더를 보내면 `206 Partial Content` 로 응답 → **이어받기 가능**

---

## 3. 이어받기(Resume) 사용

`/pfile-download` 는 NAS 의 고정 파일을 `Resource` 로 서빙하므로 HTTP Range 요청을 지원합니다.

- 일반 다운로드: `Range` 헤더 없이 호출 → 전체 다운로드(`200`).
- 이어받기: 받다 만 바이트 지점부터 `Range: bytes=<수신바이트>-` 로 재요청 → `206 Partial Content` + `Content-Range` 로 그 지점부터 수신.

> 브라우저 기본 다운로드는 네트워크 끊김 시 **자동 재개를 보장하지 않습니다.** 자동 이어받기가 필요하면 FE 에서 수신 바이트를 추적해 `Range` 로 재요청하는 로직을 구현하거나, 다운로드 매니저를 사용해야 합니다.

검증 예시(서버가 206 을 주는지 확인):
```bash
curl -s -D - -o /dev/null \
  -H "Range: bytes=0-1023" \
  "https://<host>/pfile-download?url=<zipFileUrl>&jwtToken=<JWT>"
# → HTTP/1.1 206 Partial Content / Accept-Ranges: bytes / Content-Range: bytes 0-1023/<total>
```

---

## 4. 에러 응답

1단계(`/api/dgnss/dgnss-download-all`)에서 발생 가능:

| 상황 | 처리 |
|---|---|
| 검사 정보 없음 | 예외 → 공통 에러 응답(메시지: "검사 정보가 없습니다") |
| 대상 파일 없음 | 예외 → "파일 정보가 없습니다" |
| 열람 권한 없음 | 예외 → "파일 열람 권한이 없습니다." |
| 미인증 | 예외 → 인증 오류 |

2단계(`/pfile-download`)는 기존 다운로드 API 와 동일한 에러 처리(`404`/`401`/`403`/`500` + JSON 메시지)를 따릅니다.

---

## 5. FE 마이그레이션 체크리스트

- [ ] `dgnss-download-all` 호출 결과를 **파일(blob)** 이 아니라 **JSON** 으로 파싱하도록 변경
- [ ] 응답에서 `data.zipFileUrl` 추출
- [ ] 추출한 URL 로 `/pfile-download?url=<zipFileUrl>&jwtToken=..` 를 호출해 실제 다운로드 트리거
- [ ] (선택) 큰 파일/불안정 네트워크 대비 이어받기(`Range`) 로직 적용 검토
- [ ] 1단계 응답이 느릴 수 있으므로(최초 생성 시) **로딩 표시** 추가 권장

---

## 6. 참고 (백엔드 동작 요약)

- zip 은 메모리가 아니라 **임시 파일로 스트리밍 생성** 후 NAS 로 이동 → OOM 방지
- 생성된 zip 은 일반 업로드 파일과 동일하게 등록(checksum 포함)되어 `/pfile-download` 로 서빙
- 생성 URL 은 `tb_dgnss_info` 의 type 별 컬럼(`detail_zip_file_url` / `summary_zip_file_url` / `full_zip_file_url`)에 저장되어 재호출 시 재사용

> 비고: 학생 PDF 가 재생성되거나 NAS 정리(TTL)로 zip 이 삭제되면 저장된 URL 이 무효가 될 수 있습니다. 이 경우 다운로드 실패 시 1단계를 다시 호출하는 처리(또는 백엔드의 캐시 무효화)가 필요합니다. — 후속 협의 항목
