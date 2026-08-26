# 코드 리뷰 - d18d1dc6

## 코드 복잡도 분석

변경된 파일의 복잡도 정보를 찾을 수 없습니다.
(인덱스가 생성되지 않았거나 새로운 파일일 수 있습니다)

---



## 변경 배경

이 커밋은 `frontend/docs/lesson/2026-08-25-activity-join-answerSaved-요청.md` 문서 파일 하나를 신규 추가한 것입니다. 실제 코드 변경은 없으며, everyCanvas SDK 개발 담당자에게 `answerSaved` 이벤트 신규 추가를 요청하는 명세 문서입니다.

- **목적**: 학생이 activity-join에서 답을 입력·수정할 때마다 Frame이 직접 LMS API를 호출하는 대신, `answerSaved` 이벤트로 Host(meta-dashboard)에 통지하고 저장 API 호출은 Host가 직접 수행하도록 하는 아키텍처 변경 요청
- **도메인**: 프론트엔드 문서화 / SDK 연동 프로토콜 (비즈니스 로직 아님)
- **변경 방향**: 기존 `exitRequested`·`startLessonRequested`·`saved`(editor)와 동일한 fire-and-forget 통지 패턴을 activity-join에도 확장 적용

---

## [GOOD] 잘된 점

1. **범위 명시가 명확함**: 문서 서두에 "이번 요청은 자동저장(답안 저장)만 다룹니다. 참여 시작·제출 흐름은 이번 범위 밖이며 기존 방식 그대로 유지합니다."라고 명시하여, SDK 담당자가 작업 범위를 오해할 여지를 제거했습니다.
2. **Payload 인터페이스가 구체적**: `AnswerSavedPayload`에 `participationId`, `submission.articleId`, `answer`, `timeSpentMs`, `evaluation`까지 필드 단위로 정의하고, 각 필드의 의미와 출처(`content.items[].lcmsArticleId`와 매칭)를 주석으로 설명하여 구현 시 모호함이 없습니다.
3. **발화 조건이 상세함**: 자동 발화 조건, `evaluation` 계산 정책(`gradingPolicy`와 무관하게 항상 계산), `timeSpentMs` 누적값 전달 요구사항을 명확히 기술하여 SDK 측에서 재질문할 가능성을 줄였습니다.
4. **참고용 API 계약 포함**: Host가 직접 호출할 `PATCH /api/v1/participations/{participationId}`의 요청/응답 예시를 포함하여, SDK 담당자가 전체 맥락을 이해할 수 있게 했습니다.

---

## 변경사항 요약

`answerSaved` 이벤트 신규 추가를 요청하는 명세 문서 1건 추가. 문서는 Payload 인터페이스, 발화 조건, 참고용 LMS API 계약, 확인 필요 사항 3가지로 구성되어 있습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

1. **`answer` 필드의 타입 안전성 부재**
   - **위치**: 문서 §1 `AnswerSavedPayload.submission.answer`
   - **기존 코드**:
     ```
     answer: unknown; // 학심정 LMS의 answer는 자유 JSON이므로 형태 그대로 전달
     ```
   - **개선 제안**: `unknown` 타입은 SDK 구현자에게 충분한 가이드가 되지 않습니다. 실제로 어떤 형태의 값이 오는지(문자열, 배열, 객체)에 대한 예시를 추가하거나, 최소한 `string | number | boolean | Array<unknown> | Record<string, unknown>` 정도의 유니온 타입으로 제한하는 것이 좋습니다. 또한 `answer`가 비어 있는 경우(빈 문자열, 빈 배열)에도 이벤트를 발화할지 여부를 명시하면, Host 측에서 불필요한 PATCH 호출을 줄일 수 있습니다.
   - **수정 코드 제시 불가 — 문맥 파악 불충분**: 실제 학심정 LMS의 answer 데이터 형태를 확인할 수 없어 구체적인 타입 정의를 제시할 수 없습니다. 다만 문서에 예시 값 1~2개를 추가하는 것을 권장합니다.

2. **`evaluation.errata`의 `UNGRADABLE` 값에 대한 처리 기준 미정의**
   - **위치**: 문서 §1 `AnswerSavedPayload.submission.evaluation.errata`
   - **기존 코드**:
     ```
     evaluation?: {
       errata: 'CORRECT' | 'INCORRECT' | 'PARTIAL' | 'UNGRADABLE';
       awardedScore?: number;
     };
     ```
   - **개선 제안**: `UNGRADABLE`(채점 불가) 상태에서 `awardedScore`를 보낼지 말지, 그리고 Host가 `UNGRADABLE`을 받았을 때 LMS에 `evaluation`을 전달할지(`gradingPolicy === 'CLIENT_ALLOWED'`여도)에 대한 기준이 문서에 없습니다. 이 부분이 명확하지 않으면 SDK 구현자와 Host 구현자 간에 해석 차이가 발생할 수 있습니다.

3. **`timeSpentMs`의 세션 재진입 시나리오에 대한 구체적 예시 부재**
   - **위치**: 문서 §1 발화 조건 `timeSpentMs` 설명
   - **기존 코드**:
     ```
     timeSpentMs: number; // 이 문항에 쓴 누적 시간(밀리초) — 세션 재진입 포함 누적
     ```
   - **개선 제안**: "세션 재진입 포함 누적"이라는 요구사항은 명확하지만, SDK가 이를 어떻게 구현해야 하는지(예: 로컬 스토리지에 문항별 누적 시간을 저장하고 재진입 시 복원)에 대한 가이드가 없습니다. SDK 담당자가 구현 방식을 결정할 때 참고할 수 있도록, 재진입 시나리오의 예시(예: 1차 세션에서 30초, 재진입 후 20초 추가 → 총 50초 전송)를 추가하면 좋습니다.

4. **확인 필요 사항 3번(저장 실패 통지)의 우선순위 미정**
   - **위치**: 문서 §3 확인 필요 사항 3
   - **기존 코드**:
     ```
     3. **저장 실패 통지**: Host의 PATCH가 실패(예: `409 ACTIVITY_CLOSED`, `409 ALREADY_SUBMITTED`)했을 때 Frame UI에 알릴 방법이 필요한지, 필요하다면 Host → Frame 커맨드(예: `answerSaveFailed`)를 추가할지
     ```
   - **개선 제안**: 이 항목은 "확인 필요"로 남겨두지 말고, 문서에 기본 방침(예: "저장 실패 시 Frame UI에 알리지 않고, Host가 내부적으로 로그만 남긴다. 단, `409 ALREADY_SUBMITTED`의 경우에만 사용자에게 안내가 필요할 수 있으므로 별도 논의")을 명시하는 것이 좋습니다. 확인 필요 사항이 많아지면 SDK 담당자가 작업을 시작하기 어렵습니다.

---

## 주요 파일 분석

### `frontend/docs/lesson/2026-08-25-activity-join-answerSaved-요청.md` (신규 추가)

**변경 내용:**
`answerSaved` 이벤트 신규 추가를 요청하는 명세 문서. Payload 인터페이스, 발화 조건, 참고용 LMS API 계약, 확인 필요 사항 3가지로 구성.

**개선 제안:**
1. `answer` 필드에 실제 예시 값 추가 (문자열/배열/객체 각각 1개씩)
2. `UNGRADABLE` 상태에서의 `awardedScore` 처리 기준 명시
3. `timeSpentMs` 재진입 시나리오의 구체적 예시 추가
4. 확인 필요 사항 3번에 기본 방침 명시

---

## 최종 평가

**결론**:
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**

이 커밋은 실제 코드 변경이 아닌 요청 명세 문서 추가로, 문서의 품질이 높고 현재 코드베이스(`useEveryCanvasEmbed.ts`의 `KNOWN_EVENTS`, `LessonActivityJoinEmbed.tsx`의 핸들러 등록, `lmsActivityService.ts`의 `PARTICIPATIONS_BASE`)와의 정합성도 확인되었습니다. 문서에서 요청한 `answerSaved` 이벤트는 현재 `KNOWN_EVENTS`에 등록되어 있지 않아 요청의 타당성이 입증되며, 문서가 언급한 `PATCH /api/v1/participations/{participationId}` 저장 API도 아직 구현되지 않아 "저장 API 호출은 저희가 직접 수행"이라는 계획과 일치합니다.

다만, 문서가 SDK 담당자에게 전달되는 명세인 만큼, `answer` 필드의 예시 값, `UNGRADABLE` 처리 기준, `timeSpentMs` 재진입 시나리오 예시 등 구현 시 해석 차이가 발생할 수 있는 부분을 보강하면 더 완성도 높은 문서가 될 것입니다. 이는 후속 커밋에서 반영할 수 있는 수준의 개선 사항이며, 현재 문서만으로도 SDK 담당자가 작업을 시작하는 데 충분한 정보를 제공합니다.