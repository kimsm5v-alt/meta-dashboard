# META 자기조절학습 — 이어하기 진입 정보 API (FE 가이드)

작성일: 2026-06-01

## 배경

학생이 심리검사(META 자기조절학습)를 진행하다가 **중간에 종료**한 뒤 다시 **이어하기**로 진입할 때,
프론트가 "어느 페이지로 들어가야 하는지"를 알 수 없는 문제가 있었습니다.

기존 시작 API(`POST /api/dgnss/st/start`)는 **프론트가 보낸 `page`를 그대로 사용**할 뿐
마지막 진행 위치를 계산해주지 않기 때문입니다.

이를 위해 **이어하기 진입 정보 API**(`GET /api/dgnss/st/resume`)를 신규 추가했습니다.
이 API가 내려준 `page`로 기존 `start` API를 호출하면 학생이 마지막으로 풀던 페이지로 복귀합니다.

---

## 1. 이어하기 진입 정보 API

### Request

| 항목 | 내용 |
|---|---|
| Method | `GET` |
| URL | `/api/dgnss/st/resume` |

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `dgnssResultId` | int | ✅ | 심리검사 상세 ID |
| `paperIdx` | int | ✅ | 심리검사 종류 — `1`:학습종합, `2`:META자기조절 (기본값 2) |

#### 예시
```
GET /api/dgnss/st/resume?dgnssResultId=2161&paperIdx=2
```

### Response

공통 응답 envelope(`CustomBody`)로 감싸지며, **실제 데이터는 `resultData`** 안에 있습니다.

#### resultData 필드
| 필드 | 타입 | 설명 |
|---|---|---|
| `lastAnsweredNo` | int | 응답이 있는 **최대 문항번호**. 미응답이면 `0` |
| `stAnsCnt` | int | 응답한 문항 개수 (`start` API와 동일 필드명) |
| `page` | int | 진입해야 할 페이지 (**0-base, 첫 페이지=0**) |
| `size` | int | 페이지 크기 (고정 `20`) |
| `omrIdx` | int | OMR 식별자 |

#### ✅ 성공 — 풀던 중 (예: 47번까지 응답)
```json
{
  "success": true,
  "resultMessage": "(학생)META 자기조절학습 이어하기 진입 정보",
  "resultCode": 200,
  "paramData": {
    "dgnssResultId": "2161",
    "paperIdx": "2"
  },
  "resultData": {
    "lastAnsweredNo": 47,
    "stAnsCnt": 45,
    "page": 2,
    "size": 20,
    "omrIdx": 1234
  }
}
```

#### ✅ 성공 — 아직 한 문제도 안 푼 경우
```json
{
  "success": true,
  "resultCode": 200,
  "resultData": {
    "lastAnsweredNo": 0,
    "stAnsCnt": 0,
    "page": 0,
    "size": 20,
    "omrIdx": 1234
  }
}
```

#### ⚠️ 데이터 오류 — 잘못된 ID / 취소된 시험지
OMR이 없으면(교사가 취소한 시험지로 응시 등) `resultData.success = "error"` 가 내려옵니다.

> **주의:** 이 경우에도 HTTP/envelope의 `success`는 `true` 입니다.
> 반드시 `resultData` 안의 값으로 분기하세요. (기존 `/api/dgnss/st/start`와 동일한 규약)

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": {
    "success": "error"
  }
}
```

---

## 2. 연동 흐름

```
1) 학생이 "이어하기" 클릭
   → GET /api/dgnss/st/resume?dgnssResultId=2161&paperIdx=2
   → resultData.page = 2  (0-base)

2) 받은 page 로 시작 API 호출 (page 그대로 전달, 변환 불필요)
   → POST /api/dgnss/st/start
      body: { "dgnssResultId": 2161, "paperIdx": 2, "page": 2, "size": 20 }
```

### 핵심 포인트
- `resume.page`는 **0-base**이고, `start`의 `page`도 **0-base**이므로 **변환 없이 그대로** 넣으면 됩니다.
  - 첫 페이지 = `page: 0`
- `resultData.success === "error"`면 정상 진입 불가 → 재진입/안내 등 별도 처리가 필요합니다.

---

## 3. 페이지 매핑 규칙 (참고)

페이지당 20문항(`size=20`) 기준이며, 서버가 "응답이 있는 최대 문항번호"를 기준으로 `page`를 계산합니다.

| 마지막 응답 문항(NO) | 반환 `page` |
|---|---|
| 미응답 | `0` |
| 1 ~ 20 | `0` |
| 21 ~ 40 | `1` |
| 41 ~ 60 | `2` |
| 61 ~ 80 | `3` |
| 81 ~ 100 | `4` |
| 101 ~ 119 | `5` |
| **학습종합 추가문항 120 ~ 124** | `6` |
| **META자기조절 추가문항 73 ~ 77** | `4` |

> 추가 문항(학습종합 120~124 / META자기조절 73~77)은 시험지 마지막 페이지에 별도로 붙으므로,
> 단순 `(NO-1)/20` 이 아니라 위 표처럼 고정 페이지로 매핑됩니다.

### 검사 종류별 구성
| paperIdx | 종류 | 정규 문항 | 추가 문항 | 마지막 페이지 |
|---|---|---|---|---|
| 1 | 학습종합 | 119문항 | 120 ~ 124 | page 6 |
| 2 | META자기조절 | ~72문항 | 73 ~ 77 | page 4 |

---

## 4. 참고 (서버 구현)

- 신규 쿼리 없이 기존 OMR 조회(`selectStDgnssOmr`)를 재사용합니다. (단건 PK 조회라 성능 영향 없음)
- 컨트롤러: `DgnssController.stMetaResume` (`GET /api/dgnss/st/resume`)
- 서비스: `DgnssService.selectStDgnssResume`
