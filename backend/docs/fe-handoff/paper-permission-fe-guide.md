# 검사 유형(paperIdx) 권한 (FE 연동 가이드)

> 대상: 프론트엔드 개발자
> 최종: 2026-08-12 · 상태: **백엔드 구현 완료(배포됨)**
> 관련 API: `GET /api/dgnss/paper-permission/me`, `GET /api/dgnss/tc/info`, `GET /api/dgnss/tc/overview`, `POST /api/dgnss/tc/start`

---

## 1. 개요

계정(교사)별로 수행 가능한 **검사 유형**을 권한으로 관리합니다.

- `paperIdx=1` **종합학습검사**, `paperIdx=2` **자기조절**
- **독립 권한**: 종합/자기조절을 **각각** 부여할 수 있어, 계정이 **둘 다 가질 수도** 있습니다.
- **기본값**: 종합 허용 / 자기조절 비허용 (권한 미설정 계정은 종합만 가능)
- **"한 종류만 보기"는 FE 토글의 몫**입니다. 백엔드는 유형별 허용 여부만 알려주고, 배타(둘 중 하나만)를 강제하지 않습니다.
- 권한 부여/회수는 **관리자 어드민 페이지**에서 처리합니다(별도 화면, FE 무관).

FE가 할 일은 3가지입니다: **① 권한 조회 → ② 메뉴/토글 노출 결정 → ③ 검사 조회·생성 시 paperIdx 반영**.

---

## 2. 응답 공통 형식

모든 API는 아래 envelope로 감쌉니다(발췌).

| 필드 | 설명 |
|---|---|
| `success` | 성공 여부(boolean) |
| `resultCode` | 결과 코드(성공 200, 오류 시 해당 코드) — **HTTP 상태와 별개로 body에 담김** |
| `resultData` | 실제 데이터(성공) 또는 오류 상세(실패) |
| `resultMessage` | 메시지 |

> ⚠️ 오류도 **HTTP 200** 으로 내려오고, 실패 판별은 **`success`/`resultCode`/`resultData.name`** 으로 합니다(§5 참고).

---

## 3. API — 내 검사 유형 권한 조회

```
GET /api/dgnss/paper-permission/me
Authorization: Bearer <JWT>
```
현재 로그인 사용자의 권한을 반환합니다.

**응답 `resultData`**

| 필드 | 타입 | 설명 |
|---|---|---|
| `comprehensive` | boolean | 종합학습검사(paperIdx=1) 허용 |
| `selfreg` | boolean | 자기조절(paperIdx=2) 허용 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": { "comprehensive": true, "selfreg": false },
  "resultMessage": "검사 유형 권한 조회"
}
```

**권장**: 앱 부트스트랩 단계에서 1회 조회해 캐싱(권한은 자주 바뀌지 않음). 권한 변경은 관리자 조작 후 재로그인/새로고침 시점에 반영됩니다.

---

## 4. FE 노출 가이드 (메뉴/토글)

`comprehensive`·`selfreg` 조합으로 화면을 구성합니다.

| comprehensive | selfreg | FE 동작 | 활성 paperIdx |
|:---:|:---:|---|:---:|
| true | true | **토글 노출** — 종합/자기조절 중 한 유형씩 전환 표시 | 토글 선택값(1 또는 2) |
| true | false | **종합만** 표시(토글 숨김) — 기본 계정 | 1 |
| false | true | **자기조절만** 표시(토글 숨김) | 2 |
| false | false | 검사 접근 없음 — 안내 문구(관리자가 모두 회수한 예외) | — |

- 권한이 없는 유형의 메뉴/화면은 **숨김 처리**하세요.
- "현재 활성 paperIdx"(위 표의 마지막 열)를 아래 §5 검사 조회/생성 호출에 그대로 전달합니다.

---

## 5. 검사 조회 시 `paperIdx` 파라미터

교사용 검사 조회 API 2종이 **`paperIdx` 쿼리 파라미터**를 받습니다.

```
GET /api/dgnss/tc/info?paperIdx=1
GET /api/dgnss/tc/overview?paperIdx=1
```

| paperIdx | 동작 |
|:---:|---|
| `1` | 종합학습검사만 조회 |
| `2` | 자기조절만 조회 |
| **생략 / 빈값 / `0`** | **기존과 동일 — 1·2 전체 조회** |

- **하위호환**: 파라미터를 안 보내면 종전 동작(전체) 그대로라, 기존 호출을 깨지 않습니다.
- 토글이 있는 계정(둘 다 허용)은 **현재 선택된 유형의 값**을 넘겨 해당 유형만 보이게 하세요.
- 응답 스키마 자체는 변경 없습니다(필터만 적용).

---

## 6. 검사 생성 차단 — `tc/start` 403

미허용 유형으로 검사를 생성하면 백엔드가 차단합니다(FE 숨김 + 서버 차단 **이중 방어**).

```
POST /api/dgnss/tc/start
Body: { "claId": "...", "tcId": "...", "ordNo": ..., "grade": ..., "paperIdx": 2 }
```

권한이 없으면 아래처럼 내려옵니다. **HTTP는 200**, body에서 판별하세요.

```json
{
  "success": false,
  "resultCode": 403,
  "resultData": {
    "code": 403,
    "name": "PAPER_NOT_ALLOWED",
    "message": "해당 검사 유형에 대한 권한이 없습니다. paperIdx=2"
  },
  "resultMessage": "해당 검사 유형에 대한 권한이 없습니다. paperIdx=2"
}
```

**FE 처리 권장**
- 판별: `success === false && resultData?.name === 'PAPER_NOT_ALLOWED'` (또는 `resultCode === 403`).
- 정상 흐름에선 발생하지 않아야 합니다(§4에서 이미 숨김). 이 오류가 뜨면 **권한 캐시가 오래된 것**일 수 있으니, `/paper-permission/me` 재조회 후 메뉴를 갱신하도록 유도하세요.

---

## 7. 요약 체크리스트

1. 부트스트랩에서 `GET /paper-permission/me` 호출 → `{comprehensive, selfreg}` 캐싱
2. 조합에 따라 메뉴/토글 노출(§4), 현재 활성 `paperIdx` 결정
3. `tc/info`·`tc/overview` 호출 시 활성 `paperIdx` 전달(전체가 필요하면 생략)
4. `tc/start` 응답에서 `PAPER_NOT_ALLOWED` 방어 처리(권한 재조회 유도)
