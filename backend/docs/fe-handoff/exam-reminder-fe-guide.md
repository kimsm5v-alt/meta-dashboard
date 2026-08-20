# 미제출 학생 독려 알림 발송 (FE 연동 가이드)

> 대상: 프론트엔드 개발자
> 최종: 2026-08-12 · 상태: **백엔드 구현 완료**
> 관련 API: `POST /api/dgnss/tc/reminder`
> 용도: 홈 검사 현황 / 반별 검사관리 화면의 "미제출 학생 독려 알림" 버튼

---

## 1. 개요

`dgnssId`만 보내면, 백엔드가 **요청 시점 기준으로 미제출 학생을 재조회**해서 독려 알림을 발송합니다.
(FE가 대상 학생 목록을 넘기지 않습니다.)

- 발송 채널: **학심정 내부 알림** (알림함 저장 + SSE 실시간 push). 이메일/푸시/SSO/LMS는 발송하지 않습니다.
- 알림 문구(고정): **"아직 검사를 완료하지 않았어요. 지금 검사에 참여하고 마지막 제출까지 완료해 주세요."**
- 알림 클릭 시 이동 링크: `/student/exams` (백엔드가 지정)

---

## 2. 요청

```
POST /api/dgnss/tc/reminder
Authorization: Bearer <JWT>
Content-Type: application/json

{ "dgnssId": 123 }
```

| 필드 | 필수 | 설명 |
|---|:---:|---|
| `dgnssId` | ✅ | 검사 ID |

교사 식별은 **JWT에서만** 도출합니다(대상/교사 정보를 body로 받지 않음).

---

## 3. 응답

성공 예시 (`resultData`):

```json
{
  "code": "OK",
  "requestedCount": 8,
  "sentCount": 8,
  "failedCount": 0,
  "lastSentAt": "2026-08-13T14:30:00+09:00"
}
```

| 필드 | 설명 |
|---|---|
| `code` | 결과 코드 (아래 표) |
| `requestedCount` | 미제출 대상 학생 수 |
| `sentCount` | 발송(알림 생성)된 수 |
| `failedCount` | `requestedCount - sentCount` (내부 알림은 보통 0) |
| `lastSentAt` | 발송 시각(ISO8601, +09:00). 비발송 케이스는 `null` |

> `retryAvailableAt`은 제공하지 않습니다 — **재발송 제한은 FE에서 버튼 비활성화**로 처리하세요(권장 수 초).
> 서버는 쿨다운을 두지 않으며, 다시 호출하면 **그 시점에도 미제출인 학생에게만** 재발송합니다.

### 결과 코드

envelope는 항상 **HTTP 200**입니다. 아래 `code`로 분기하세요.

| `code` | 의미 | FE 처리 |
|---|---|---|
| `OK` | 발송 완료 | 성공 토스트 + `sentCount` 안내 |
| `NO_TARGET` | 미제출 학생 0명 | "발송할 미제출 학생이 없습니다" 안내 |
| `NOT_IN_PROGRESS` | 진행 중이 아닌 검사 | "진행 중인 검사만 발송 가능" 안내 |
| `NOT_OWNER` | 담당 교사가 아님 | 접근 오류 안내 |
| `NOT_FOUND` | 존재하지 않는 dgnssId | 오류 안내 |

`dgnssId` 누락/0 이하는 body-level 오류(`resultCode` 400)로 내려갑니다.

---

## 4. 발송 대상 규칙 (참고)

백엔드가 자동 적용하는 조건:

- **미제출자만**: 요청 시점에 제출(`subm_at='Y'`)한 학생 제외
- **탈퇴/미매핑 제외**: `ACTIVE` 상태 + 학심정 계정(user_no) 보유 학생만 대상
- 개인정보 제공 미동의(NOT_CONSENTED) 학생도 **내부 알림은 수신 가능**(문구에 PII 미포함)

---

## 5. FE 연동 체크리스트

1. 미제출 학생이 1명 이상일 때 버튼 활성화 (검사 현황 조회 결과 활용)
2. 클릭 시 `POST /api/dgnss/tc/reminder { dgnssId }` 호출
3. 요청 중 버튼 비활성화 + **수 초간 재클릭 차단**(중복 발송 방지)
4. 응답 `code`로 성공/사유 분기, `sentCount`로 결과 안내
