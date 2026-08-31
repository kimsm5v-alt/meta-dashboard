# [요청] activity-join 답안 저장/제출 API 호출 주체를 Frame → Host로 이관

> 2026-08-25 · everyCanvas SDK 개발 담당자 대상 · meta-dashboard(학심정) FE
> 관련 정본: [`embed-bridge-protocol.md`](../../../../every-canvas-fe/docs/02-design/addAPI/embed-bridge-protocol.md) §9.3 activity-join
> 관련 코드: `features/lesson/lib/useEveryCanvasEmbed.ts` · `features/lesson/ui/LessonActivityJoinEmbed.tsx` · `features/lesson/api/lmsActivityService.ts`

---

## 0. 한 줄 요약

현재 `activity-join` Frame이 내부에서 직접 호출하는 학심정 LMS(superplatform-lms) API 3종(참여 시작·자동저장·제출)을 **모두 제거**하고, 그 시점마다 Host(meta-dashboard)에 postMessage 이벤트로 알려주면 **Host가 대신 호출**하는 구조로 바꾸고 싶습니다. 신규 이벤트 `answerSaved` 1개, 기존 `submitted` 이벤트의 발화 주체 변경, 초기화 payload에 `submission` 필드 추가가 필요합니다. (참여 세션 `participationId`는 Host만 소유하며 Frame에는 전달하지 않습니다.)

---

## 1. 왜 바꾸나

- Frame이 `getSsoToken`으로 받은 SSO AT로 학심정 LMS API를 직접 호출하는 지금 구조는 **소비 서비스 전용 스키마(activityItemId, gradingPolicy, evaluation)에 Frame이 종속**되게 만들어 everyCanvas의 범용성을 해칩니다.
- LMS API CORS 허용 origin에 everyCanvas Frame origin까지 추가해야 해서 **보안 표면이 늘어납니다.**
- 저장 타이밍(디바운스/배치), 재시도, `If-Match`(ETag) 동시성 제어, `Idempotency-Key` 관리를 **Host가 전혀 통제할 수 없습니다.**
- Host(학심정)는 이미 자체 참여 API(`superplatform-lms`)의 세션·인증을 갖고 있으므로, 실제 쓰기 호출은 Host가 하는 게 자연스럽습니다.

---

## 2. AS-IS → TO-BE

| 시점 | AS-IS (현재) | TO-BE (요청) |
| --- | --- | --- |
| 참여 시작 | Frame이 `POST /api/v1/participations` 호출 | ❌ 제거. 참여 세션(`participationId`)은 **Host만 소유** — Frame은 몰라도 됩니다. 이어풀기에 필요한 이전 답안만 `submission`으로 전달 |
| 자동저장 | Frame이 `PATCH /api/v1/participations/{id}` 직접 호출 | ❌ 제거. Frame은 `answerSaved` 이벤트만 발행, Host가 PATCH 호출 |
| 제출 | Frame이 `POST /api/v1/participations/{id}/submit` 직접 호출 | ❌ 제거. Frame은 `submitted` 이벤트만 발행(제출 버튼 클릭 신호), Host가 submit 호출 |
| 재진입(이어풀기) | Frame이 자체적으로 이전 답안 조회 | Host가 embed 마운트 시 `submission` prop으로 이전 답안·누적시간을 주입 |

> ⚠️ 이미 Host(`LessonJoinPage.tsx`)가 embed 마운트 **전에** `POST /participations`를 호출해 `content.lcmsSetId`를 얻고 있습니다. 지금 Frame이 **별도로** 참여 세션을 또 시작하고 있다면(자체 `POST /participations` 호출) 그 호출을 완전히 제거해 주세요. `participationId`는 Host만 갖고 있으면 되고, embed에 전달하거나 Frame이 들고 있을 필요가 없습니다.

---

## 3. Frame이 받아야 할 것 (Host → Frame, `ec:init` 확장)

```ts
type ActivityJoinInit = {
  // 기존 필드(token, mode:'activity-join', theme, features, locale, slideId 등)에 추가
  submission: Array<{
    articleId: string;   // content.items[].lcmsArticleId
    answer: unknown;     // 직전 세션에서 저장된 답 (자유 JSON)
    timeSpentMs: number; // 직전 세션까지 누적된 학습시간 — 이어서 누적해 주세요(§4-1)
  }> | [];
};
```

- `submission`은 Host가 `POST /participations`(멱등 — 이어하기 시 200과 함께 `responses[]` 포함) 응답의 `responses[]`와 `content.items[]`를 `activityItemId` 기준으로 조인해 만듭니다. Frame이 별도 GET을 호출할 필요는 없습니다.
- **요청**: `submission[].timeSpentMs`를 문항별 누적 시간의 시작값으로 삼아 주세요. 재진입 시 0부터 새로 세지 마시고, 전달받은 값에 이번 세션에서 쓴 시간을 더한 **누적치**를 `answerSaved.timeSpentMs`로 보내주시면 됩니다. LMS의 `timeSpentMs`는 "누적값, 보내면 서버가 그 값으로 치환(합산하지 않음)" 정책이라, 중간에 누적이 끊기면 학습시간이 줄어든 것처럼 기록됩니다.

---

## 4. Frame이 보내야 할 것 (Frame → Host, `ec:event`)

### 4-1. `answerSaved` (신규)

기존 `exitRequested`·`startLessonRequested`·`saved`(editor)와 동일한 형태(단순 fire-and-forget 통지)로 추가 요청드립니다.

```ts
interface AnswerSavedPayload {
  articleId: string;   // content.items[].lcmsArticleId 와 매칭
  answer: unknown;     // 학심정 LMS의 answer는 자유 JSON이므로 형태 그대로 전달
  timeSpentMs: number; // 이 문항에 쓴 누적 시간(밀리초) — 세션 재진입 포함 누적
  evaluation?: {
    errata: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'UNGRADABLE';
    awardedScore?: number;
  };
}
```

- **자동 발화 요청**: 학생이 별도로 '저장' 버튼을 조작하지 않아도, **문항에 답을 입력·수정할 때마다 자동으로** 발화해 주세요. 제출 전에 학생이 이탈해도 최신 답이 Host에 반영돼 있어야 하기 때문입니다. Frame 내부적으로 짧은 디바운스를 두시는 건 무방합니다.
- 발화 시점: 학생이 답을 내거나 수정한 시점 (기존 `progress`의 `setSlideAnswer` 후킹 지점과 동일 — 다만 `progress`는 조회 텔레메트리 용도로 그대로 두고, 쓰기가 필요한 순간만 별도 이벤트로 분리 요청)
- `evaluation`: **채점 가능한 문항 타입(pickText 등)이면 `gradingPolicy`와 무관하게 항상 계산해서 보내주세요.** `content.gradingPolicy === 'CLIENT_ALLOWED'`인 경우에만 LMS로 넘길지 말지는 **Host가 필터링**합니다. Frame은 이 정책을 몰라도 됩니다.

### 4-2. `submitted` (기존 이벤트 재활용, 의미 변경)

기존에는 "Frame이 Result 서버에 자체 제출 성공 후 통지"였는데, 이제는 **"학생이 제출 버튼을 눌렀다"는 신호로만** 써주시면 됩니다. Frame은 이 시점에 어떤 API도 호출하지 않습니다.

```ts
// payload 없음 또는 최소 정보만
interface SubmittedPayload {
  activityId: string; // 기존 유지
}
```

**중요 — 순서 보장 요청**: 제출 버튼 클릭 시, 아직 Host에 반영 안 된 답이 있다면 **`submitted`를 보내기 전에 그 문항들의 `answerSaved`를 먼저 postMessage로 보내주세요.** Host는 `submitted` 수신 시 "그때까지 받은 `answerSaved`를 모두 반영 → 최종 `POST /submit` 호출" 순서로 동작하므로, 이 순서가 깨지면 마지막 답이 유실됩니다.

---

## 5. 남은 확인/협의 사항

1. **참여 세션 제거 확인**: Frame이 지금 자체적으로 `POST /participations`를 호출해 별도 참여 세션을 만들고 있는지 확인 부탁드립니다 — 그렇다면 완전히 제거해 주세요. `participationId`는 Host만 소유하면 되고 Frame에 전달할 필요가 없습니다.
2. **articleId 정합성**: activity-join의 슬라이드 식별자가 CBS `lcmsArticleId`와 항상 1:1인지 (뷰어 쪽에서 있었던 Platform slideId ↔ CBS setId 불일치 사례가 있어 재확인 요청)
3. **capability 협상**: `ec:ready.capabilities`에 `activity.answerSync` 같은 신규 capability를 추가해, 구버전 Frame과 구분할 수 있게 해주실 수 있는지
4. **저장 실패 통지**: Host의 PATCH/submit이 실패(예: `409 ACTIVITY_CLOSED`, `409 ALREADY_SUBMITTED`)했을 때 Frame UI에 알릴 방법이 필요한지, 필요하다면 Host → Frame 커맨드(예: `answerSaveFailed`)를 추가할지

---

## 6. 참고 — 학심정 LMS 저장 API 계약 (참고용, Host가 직접 호출)

```jsonc
// PATCH /api/v1/participations/{participationId}
{
  "responses": [
    {
      "activityItemId": "3fa85f64-5717-4562-b3fc-2c963f66afa6", // Host가 articleId→activityItemId로 매핑
      "answer": "string",
      "timeSpentMs": 42000,
      "evaluation": { "errata": "CORRECT", "awardedScore": 0 } // gradingPolicy=CLIENT_ALLOWED일 때만
    }
  ]
}
```

- 보낸 문항만 갱신(부분 업데이트), 최대 1,000개/요청
- `answer`는 형태 제약 없음(문자열·배열·객체 모두 가능) — Frame이 보낸 값을 그대로 전달
- `timeSpentMs` 미전송 시 기존 값 유지(0/null로 덮지 않음)
