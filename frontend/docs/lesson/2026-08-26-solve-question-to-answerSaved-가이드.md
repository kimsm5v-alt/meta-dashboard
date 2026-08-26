# [가이드] kv-everyclass-viewer `solve-question` → Host `answerSaved` 전달

> 2026-08-26 · every-canvas-fe 구현 담당자 대상
> 이 문서는 **코드 패치가 아니라 구현 지시서**입니다. 아래 계약을 그대로 따라 구현하세요.
>
> 상위 요청:
> - `meta-dashboard/frontend/docs/lesson/2026-08-25-activity-join-답안저장-host-이관-요청.md`
> - `meta-dashboard/frontend/docs/lesson/2026-08-25-activity-join-answerSaved-요청.md`

---

## 0. 한 줄 요약

학생이 CBS 문항에 답을 입력·수정하면 `kv-everyclass-viewer`가 `solve-question`을 발행합니다.
every-canvas-fe는 그 이벤트를 **LMS API를 호출하지 않고**, 임베드 브리지 `answerSaved`로 Host(meta-dashboard)에 넘깁니다.
저장 API(`PATCH /api/v1/participations/{id}`) 호출·디바운스·재시도는 **Host 책임**입니다.

---

## 1. 디바운스는 어디서 하나 (결정)

**저장 API 디바운스는 meta-dashboard(Host)에서 합니다. every-canvas-fe(Frame)에서는 하지 마세요.**

| 층 | 디바운스 | 이유 |
| --- | --- | --- |
| Frame (`every-canvas-fe`) | **하지 않음** | `solve-question`이 올 때마다 `answerSaved`를 바로 보냄. 제출 직전 마지막 답이 타이머에 갇히면 유실됨 |
| Host (`meta-dashboard`) | **여기서 함** | PATCH 타이밍, 문항별 coalesce, 배치, 재시도, ETag/`If-Match`는 Host만 통제 가능 |

근거:

- 이관 요청의 목적 자체가 "저장 타이밍(디바운스/배치), 재시도, 동시성 제어를 Host가 통제"하는 것입니다.
- Host는 `participationId`·`activityItemId` 매핑·`gradingPolicy` 필터를 갖고 있고 Frame은 모릅니다.
- Host는 `submitted`를 받으면 "그때까지 받은 `answerSaved`를 반영한 뒤 submit"합니다. Frame이 길게 디바운스하면 마지막 답이 아직 안 도착한 채로 제출됩니다.
- 요청문의 "Frame 내부적으로 짧은 디바운스는 무방"은 **허용**이지 **필수**가 아닙니다. `solve-question`은 키입력마다가 아니라 문항 풀이/채점 시점(`question-solvecheck`)에 오므로 Frame 디바운스는 필요 없습니다.

금지:

- `useEveryclassViewer` 안에 debounce/throttle을 넣지 마세요. 이 훅은 교사 미리보기·학생 활동이 같이 씁니다.
- Frame에서 저장 API를 호출하지 마세요.
- `progress` 이벤트에 답안 본문을 실어 대체하지 마세요. `progress`는 텔레메트리, `answerSaved`는 쓰기 통지입니다.

---

## 2. 데이터 흐름 (이렇게 연결)

```
학생이 CBS 문항에 답 입력/수정
        |
        v
kv-everyclass-viewer
  CustomEvent 'solve-question'
  detail: { id, sub_id, subMitAnw, result }
        |
        v
useEveryclassViewer          <-- 리스너 부착, 콜백으로 올림 (shared)
        |
        v
CbsArticleViewer / CBSViewer <-- 학생 + activity-join 일 때만 상위로 전달
        |
        v
useEmbedViewerBridge.emitAnswerSaved(payload)
        |
        v
postMessage  { type: 'ec:event', event: 'answerSaved', payload }
        |
        v
Host (meta-dashboard)
  onAnswerSaved → (Host가 디바운스) → PATCH /participations
```

Frame은 fire-and-forget입니다. Host 응답을 기다리지 않습니다. `requestId`를 붙이지 마세요.

---

## 3. 이미 된 것 / 이번에 할 것

이미 되어 있습니다. 다시 만들지 마세요.

- 프로토콜 이벤트명 `answerSaved`, capability `activity.answerSync`
- Frame `useEmbedViewerBridge.emitAnswerSaved`
- Host SDK `<ActivityJoin onAnswerSaved>`

이번에 할 것:

1. `kv-everyclass-viewer`의 `solve-question`을 받는다.
2. `AnswerSavedPayload`로 매핑한다.
3. activity-join 학생 풀이에서만 `emitAnswerSaved`를 호출한다.

참고: `pages/embed/viewer/index.tsx`는 지금 `requestExit`만 꺼내 씁니다. `emitAnswerSaved`를 같은 훅에서 받아 호출부에 연결하세요.

---

## 4. `solve-question` 원본 (뷰어가 주는 값)

뷰어가 컨테이너(`kv-everyclass-viewer`)에 발행합니다. `detail`은 객체이거나 `JSON.stringify`된 문자열일 수 있습니다. 둘 다 파싱하세요. (`SmartBankSlide.tsx`와 동일)

```ts
interface SolveQuestionDetail {
  id: string;         // 아티클 아이디  → answerSaved.articleId
  sub_id: string;     // 아티클 서브 아이디 → answerSaved.sub_id (최상위 필드)
  subMitAnw: unknown; // 입력한 답안   → answerSaved.answer
  result: 'O' | 'M' | 'X'; // O 정답 / M 수동채점 / X 오답
}
```

`detail`이 없거나 `id`가 없으면 이벤트를 버리세요. 저장 API를 호출하지 마세요.

---

## 5. `answerSaved` 페이로드 (Host로 보낼 값)

이관 요청 정본을 따릅니다. **`participationId`는 넣지 마세요.** 참여 세션은 Host만 소유합니다.

```ts
interface AnswerSavedPayload {
  seq: number;         // 세트 슬라이드 중 몇 번째인지 (0부터). 알면 전달
  articleId: string;   // solve-question.id  (content.items[].lcmsArticleId 와 매칭)
  sub_id: string;      // solve-question.sub_id 그대로 (answer 안에 넣지 말 것)
  answer: unknown;     // solve-question.subMitAnw 그대로 (문자열로 감싸지 말 것)
  timeSpentMs: number; // 이 문항 누적 학습시간(ms). 세션 재진입분 포함
  evaluation?: {
    errata: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'UNGRADABLE';
    awardedScore?: number;
  };
}
```

현재 `protocol.ts` / `protocol.types.ts`의 `{ participationId, submission: {...} }` 형태는 이전 요청 잔재입니다. **이번 작업에서 위 평탄 형태로 맞추세요.** Host SDK `AnswerSavedPayload`와 Frame 미러 타입을 같이 고칩니다.

### 필드 매핑

| 출처 | Host `answerSaved` | 규칙 |
| --- | --- | --- |
| 현재 슬라이드 순번 | `seq` | **0부터** 센 세트 내 인덱스. activity-join은 슬라이드 목록이 있으므로 반드시 채운다 (`slides.findIndex` 또는 현재 인덱스). 알 수 없으면 필드를 생략한다 |
| `solve-question.id` | `articleId` | 문자열로 전달. Host가 `lcmsArticleId` → `activityItemId`로 매핑 |
| `solve-question.sub_id` | `sub_id` | **최상위 필드**. `answer` 객체 안에 넣지 말 것. 없으면 빈 문자열 `''` |
| `solve-question.subMitAnw` | `answer` | **그대로**. `JSON.stringify`하지 말 것. LMS는 자유 JSON |
| `solve-question.result` | `evaluation.errata` | 아래 표 |
| `useViewerStore` 해당 슬라이드 `learnTimeMs` | `timeSpentMs` | **0을 보내지 말 것**(LMS가 치환하므로 학습시간이 리셋됨). 슬라이드에 쌓인 누적 ms를 보낸다 |
| (뷰어에 없음) | `evaluation.awardedScore` | 모르면 생략 |

`result` → `errata`:

| `result` | `errata` |
| --- | --- |
| `O` | `CORRECT` |
| `X` | `INCORRECT` |
| `M` | `UNGRADABLE` (수동채점. Host/LMS가 나중에 채점) |
| 그 외 | `evaluation` 생략 |

`gradingPolicy`는 Frame이 모릅니다. 채점 가능하면 `evaluation`을 **항상** 붙이세요. LMS에 넣을지는 Host가 필터합니다.

---

## 6. 구현 지시 (어디를 어떻게)

공통 원칙: shared 훅은 이벤트만 올리고, **브리지 발행은 activity-join 경로에서만** 합니다.

### 6-1. `useEveryclassViewer` — `solve-question` 수신

파일: `frontend/src/shared/lib/everyclass-viewer/useEveryclassViewer.ts`

이렇게 하세요.

- 옵션에 `onSolveQuestion?: (detail: SolveQuestionDetail) => void`를 추가한다.
- `viewer-load-complete`와 같이 **append 전에** `el.addEventListener('solve-question', ...)`를 붙인다.
- `detail`이 string이면 `JSON.parse`, 객체면 그대로 쓴다. 파싱 실패는 로그 후 무시.
- 콜백만 호출한다. 디바운스·브리지·LMS 호출은 여기서 하지 않는다.
- `index.ts`에서 타입을 re-export한다.

선행 패턴: `SmartBankSlide.tsx`의 `solve-question` 리스너, `useAidtViewer`의 `onElementReady`.

### 6-2. `CbsArticleViewer` — 콜백 통과

파일: `frontend/src/features/template/components/CbsArticleViewer.tsx`

- prop으로 `onSolveQuestion`을 받아 `useEveryclassViewer`에 넘긴다.
- 훅 안에서 브리지를 직접 호출하지 않는다. (shared/template이 embed-bridge를 알 필요 없음)

### 6-3. `CBSViewer` — 학생일 때만 연결

파일: `frontend/src/features/template/components/CBSViewer.tsx`

- `isStudentMode === true`일 때만 `onSolveQuestion`을 넘긴다.
- 교사 미리보기/수업하기에서는 `answerSaved`를 발행하지 않는다.

브리지 발행 함수를 이 컴포넌트가 직접 import하기 어려우면, 기존 컨텍스트(`useSlideDispatchContext` 등)에 **optional 콜백**을 두거나 activity-join 셸에서 주입하세요. 중요한 것: **CBS 뷰어 shared 훅이 `sendEvent`를 직접 알지 않게** 하세요.

### 6-4. `useEmbedViewerBridge` — 이미 있는 `emitAnswerSaved` 사용

파일: `frontend/src/features/slide/hooks/useEmbedViewerBridge.ts`

- 새 send 함수를 만들지 말고 기존 `emitAnswerSaved`를 쓴다.
- payload 타입만 §5 평탄 형태로 맞춘다.
- `mode === 'activity-join'`이 아니면 호출부가 `emitAnswerSaved`를 호출하지 않게 한다. (capability는 이미 activity-join만 `activity.answerSync`를 광고함)

### 6-5. 임베드 셸에서 실제 호출

파일: `frontend/src/pages/embed/viewer/index.tsx` (activity-join이 이 셸을 재사용)

```ts
const { requestExit, emitAnswerSaved } = useEmbedViewerBridge({ slides, mode });
```

- `mode === 'activity-join'`이고 학생 풀이일 때만, `solve-question` 콜백에서 매핑 후 `emitAnswerSaved(payload)`를 호출한다.
- `seq`는 현재 슬라이드의 0-based 인덱스다. `slides` 배열에서 현재 `slideId`의 위치를 넣는다.
- `sub_id`는 뷰어 `detail.sub_id`를 최상위로 그대로 넣는다. `answer`에 섞지 않는다.
- `timeSpentMs`는 해당 슬라이드 `slideStateMap[slideId].learnTimeMs`를 읽는다.
- 같은 답 변경에서 `setSlideAnswer`로 로컬 상태도 갱신해 `progress`가 기존처럼 나가게 한다. (`progress`와 `answerSaved`는 둘 다 유지)

### 6-6. 프로토콜 타입 정리

아래를 §5 형태로 **같이** 수정하세요.

- `frontend/src/shared/embed-bridge/protocol.types.ts`
- `packages/embed/src/protocol.ts`
- `docs/02-design/addAPI/embed-bridge-protocol.md` §9.3 `answerSaved` 행
- `packages/embed-react`의 `ActivityJoin` / `onAnswerSaved` 주석

`participationId` 필드는 제거합니다.

---

## 7. 발화 조건

- 저장 버튼과 무관. `solve-question`이 오면 바로 `answerSaved`.
- activity-join + 학생 모드만.
- 같은 문항을 고치면 그때마다 다시 보낸다. 중복 제거는 Host가 `articleId` + `sub_id` 기준으로 한다.
- `progress`는 그대로 둔다. 답안 본문은 `answerSaved`에만 싣는다.

제출(`submitted`)과의 순서 (이관 요청 §4-2, 이번 범위와 맞닿음):

- Frame에 미전송 답이 있으면 **`submitted`보다 먼저** 해당 문항의 `answerSaved`를 보낸다.
- Frame 디바운스를 안 두므로, `solve-question`이 이미 왔다면 별도 flush는 필요 없다.
- 만약 제출 클릭 시점에 뷰어가 아직 `solve-question`을 안 보냈다면, 제출 핸들러에서 뷰어 답안을 한 번 읽어 `answerSaved`를 먼저 보내세요. (뷰어 API로 강제 수집이 가능하면)

---

## 8. 이번 범위 밖 (하지 말 것)

- Frame에서 `POST /participations`, `PATCH /participations`, submit API 호출
- Host의 PATCH 디바운스/재시도 구현 (meta-dashboard 작업)
- `ec:init.submission` 이어풀기 주입·답안 복원 (`writeInput`)
- `submitted` 의미를 "버튼 클릭 신호"로 바꾸는 작업 전체
- PickText 등 비-CBS 문항. (나중에 같은 `emitAnswerSaved`를 `setSlideAnswer` 지점에서 호출하면 됨. 이번 가이드는 CBS `solve-question`만)

---

## 9. 구현 후 확인

1. 학생 activity-join에서 CBS 문항 답을 바꾸면 Host가 `ec:event answerSaved`를 받는다. Frame 네트워크 탭에 LMS PATCH가 없다.
2. payload에 `participationId`가 없고, `seq`(0-based, 알 때) / `articleId` / `sub_id` / `answer` / `timeSpentMs`가 있다. `sub_id`는 `answer` 안이 아니라 최상위 필드다.
3. `result: 'O'`이면 `evaluation.errata === 'CORRECT'`. `'M'`이면 `UNGRADABLE`.
4. `answer`가 문자열로 이중 직렬화되지 않았다.
5. 교사 미리보기에서는 `answerSaved`가 나가지 않는다.
6. 답을 연속으로 바꿔도 Frame은 이벤트만 연속 발행한다. (디바운스는 Host)
7. `ec:ready.capabilities`에 activity-join이면 `activity.answerSync`가 있다. (이미 있음, 회귀만 확인)

---

## 10. 참고

- 브리지 정본: `docs/02-design/addAPI/embed-bridge-protocol.md` §9.3
- 뷰어 답안 수집: `docs/04-viewer/cbs-viewer-mode-contract.md` (`MATHCANVAS` → `solve-question`)
- 기존 리스너 예: `frontend/src/features/slide/ui/slides/SmartBankSlide.tsx`
- 뷰어 마운트: `frontend/src/shared/lib/everyclass-viewer/useEveryclassViewer.ts`
- 발행 함수: `frontend/src/features/slide/hooks/useEmbedViewerBridge.ts` (`emitAnswerSaved`)
- Host 수신(아직 미배선): `meta-dashboard/frontend/src/features/lesson/lib/useEveryCanvasEmbed.ts` 의 `KNOWN_EVENTS`에 `answerSaved` 없음 — Host 쪽 작업
