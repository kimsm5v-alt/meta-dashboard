# [요청] activity-join 답안 자동저장 이벤트(`answerSaved`) 추가

> 2026-08-25 · everyCanvas SDK 개발 담당자 대상 · meta-dashboard(학심정) FE
> 관련 정본: [`embed-bridge-protocol.md`](../../../../every-canvas-fe/docs/02-design/addAPI/embed-bridge-protocol.md) §9.3 activity-join
> 관련 코드: `features/lesson/lib/useEveryCanvasEmbed.ts` · `features/lesson/ui/LessonActivityJoinEmbed.tsx` · `features/lesson/api/lmsActivityService.ts`
>
> ℹ️ 이번 요청은 **자동저장(답안 저장)만** 다룹니다. 참여 시작·제출 흐름은 이번 범위 밖이며 기존 방식 그대로 유지합니다.

---

## 0. 한 줄 요약

학생이 activity-join에서 답을 입력·수정할 때마다 Frame이 직접 학심정 LMS API를 호출하는 대신, **`answerSaved` 이벤트로 Host(meta-dashboard)에 알려주시면 저장 API 호출은 저희가 직접 수행**하겠습니다.

---

## 1. 요청 사항 — `answerSaved` 이벤트 신규 추가

기존 `exitRequested`·`startLessonRequested`·`saved`(editor)와 동일한 형태(단순 fire-and-forget 통지)로 추가 부탁드립니다.

```ts
interface AnswerSavedPayload {
  participationId: string;
  submission: {
    articleId: string;   // content.items[].lcmsArticleId 와 매칭
    answer: unknown;     // 학심정 LMS의 answer는 자유 JSON이므로 형태 그대로 전달
    timeSpentMs: number; // 이 문항에 쓴 누적 시간(밀리초) — 세션 재진입 포함 누적
    evaluation?: {
      errata: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'UNGRADABLE';
      awardedScore?: number;
    };
  };
}
```

이 이벤트를 받으면 저희 쪽에서 바로 `PATCH /api/v1/participations/{participationId}`를 호출해서 저장합니다.

### 발화 조건

- **자동 발화**: 학생이 별도로 '저장' 버튼을 조작하지 않아도, **문항에 답을 입력·수정할 때마다 자동으로** 발화해 주세요. Frame 내부적으로 짧은 디바운스를 두시는 건 무방합니다.
- `evaluation`: **채점 가능한 문항 타입(pickText 등)이면 `gradingPolicy`와 무관하게 항상 계산해서 보내주세요.** 이 값을 실제로 LMS에 전달할지는(`gradingPolicy === 'CLIENT_ALLOWED'` 여부) 저희(Host) 쪽에서 판단합니다. Frame은 이 정책을 몰라도 됩니다.
- `timeSpentMs`: **누적값**으로 보내주세요. 학심정 LMS는 이 값을 받으면 기존 값에 더하지 않고 **그대로 치환**합니다. 재진입(이어풀기) 이후에도 이전 세션의 누적 시간에 이어서 계산된 값을 보내주셔야, 저장된 학습시간이 중간에 줄어드는 문제가 없습니다.

---

## 2. 참고 — 학심정 LMS 저장 API 계약 (참고용, Host가 직접 호출)

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

---

## 3. 확인 필요 사항

1. **articleId 정합성**: activity-join의 슬라이드 식별자가 CBS `lcmsArticleId`와 항상 1:1인지 (뷰어 쪽에서 있었던 Platform slideId ↔ CBS setId 불일치 사례가 있어 재확인 요청)
2. **capability 협상**: `ec:ready.capabilities`에 `activity.answerSync` 같은 신규 capability를 추가해, 구버전 Frame과 구분할 수 있게 해주실 수 있는지
3. **저장 실패 통지**: Host의 PATCH가 실패(예: `409 ACTIVITY_CLOSED`, `409 ALREADY_SUBMITTED`)했을 때 Frame UI에 알릴 방법이 필요한지, 필요하다면 Host → Frame 커맨드(예: `answerSaveFailed`)를 추가할지
