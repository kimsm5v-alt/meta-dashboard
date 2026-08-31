> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - ba460cd5

## 코드 복잡도 분석

**분석된 파일**: 4개 / 변경된 파일: 4개


### 정상 범위 (NONE)


**`schoolrecordagentapi.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.006

- 청크 수: 18개


**권장사항:**

- 복잡도 정상 범위


**`schoolrecordpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.009

- 청크 수: 29개


**권장사항:**

- 파일 크기가 큼 (29개 청크) - 파일 분리 검토


**`studentwritingsection.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 202개


**권장사항:**

- 파일 크기가 큼 (202개 청크) - 파일 분리 검토


**`bulkgeneratesection.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.003

- 청크 수: 82개


**권장사항:**

- 파일 크기가 큼 (82개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 생활기록부(생기부) AI 문구 생성 기능을 대폭 확장한 것입니다. 기존에는 단순히 생성 방식 선택과 공통 상황 입력만 가능했지만, 이번 변경으로 **일괄 생성(Bulk) 시 실시간 진행 상태 표시와 자동 저장**, 그리고 **개별 학생 작성 시 AI 문구 생성·편집·복원·복사** 기능이 추가되었습니다.

- **목적**: 생기부 문구 생성 UX 개선 — 일괄 생성 진행률/결과 표시, 개별 생성 시 스트리밍 토큰 표시, 이전 문구 복원, 편집/복사 기능 제공
- **도메인**: 프론트엔드 UI + 비즈니스 로직 (React/TypeScript, SSE 스트리밍 연동)
- **변경 방향**: 단순 폼 → 상태 머신(Phase: method/commonForm/progress/result) 기반의 다단계 생성 흐름으로 개선, SSE 이벤트를 실시간으로 반영

---

## [GOOD] 잘된 점

1. **SSE 종료 이벤트 처리 개선**: `receivedDone` → `receivedTerminalEvent`로 변경하여 `done`뿐 아니라 `error` 이벤트도 정상 종료로 인정함으로써, 에러 발생 시에도 "연결이 완료 전에 종료" 오류가 중복 발생하지 않도록 한 점이 적절합니다.

2. **일괄 생성의 상태 관리**: `states`/`results`를 `Record<studentId, ...>`로 관리하고 `updateState` 헬퍼로 캡슐화하여, 다수 학생의 진행 상태를 명확하게 추적합니다. `completedCount`/`savedCount`를 `useMemo`로 계산한 것도 좋습니다.

3. **AbortController 정리**: 컴포넌트 언마운트 시 `controllerRef.current?.abort()`를 호출하고, `finally`에서 참조를 해제하는 패턴이 일관되게 적용되어 리소스 누수를 방지합니다.

---

## 변경사항 요약

생기부 일괄 생성에 진행률/결과 화면과 자동 저장을 추가하고, 개별 작성 화면에 AI 문구 생성(스트리밍)·편집·복원·복사 기능을 도입했습니다. SSE 종료 판정을 `done`/`error` 모두로 확장했습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `BulkGenerateSection`의 `saveDraft` 직접 호출 시 캐시 무효화 누락**

`runBulk` 내부에서 `schoolRecordApi.saveDraft`를 직접 호출하고, 완료 후에만 `queryClient.invalidateQueries({ queryKey: schoolRecordKeys.classList(classData.id) })`를 한 번 수행합니다. 반면 `useSchoolRecordStudentData`의 `saveDraft` 래퍼는 `onSuccess: invalidate`로 **학생별 draft 캐시(`studentDraft`)와 반 리스트 캐시(`classList`)를 모두** 무효화합니다.

일괄 생성으로 저장된 학생의 `studentDraft` 캐시는 갱신되지 않아, 이후 해당 학생 상세 화면에서 이전(또는 빈) 데이터가 표시될 수 있습니다. `classList`만 무효화하고 `studentDraft`는 무효화하지 않는 불일치가 있습니다.

- **위치**: `BulkGenerateSection.tsx`의 `runBulk` 내 `saveDraft` 호출부 및 `invalidateQueries` 호출부
- **기존 코드**:
```typescript
await schoolRecordApi.saveDraft({ ... });
...
await queryClient.invalidateQueries({ queryKey: schoolRecordKeys.classList(classData.id) });
```
- **해결 방안**: 저장된 각 학생의 `studentDraft` 캐시도 함께 무효화합니다.
```typescript
// 저장 완료 후
await Promise.all([
  queryClient.invalidateQueries({ queryKey: schoolRecordKeys.classList(classData.id) }),
  ...students.map(({ student }) =>
    queryClient.invalidateQueries({ queryKey: schoolRecordKeys.studentDraft(student.id) }),
  ),
]);
```

### Medium (개선 권장)

**1. `StudentWritingSection`의 `runGenerate`에서 `previousResult` 복원 시 `generatedText`/`generationSignature` 미복원**

`runGenerate`의 `catch`에서 `setResult(previousResult)`로 결과 텍스트만 복원합니다. 하지만 `generatedText`와 `generationSignature`는 복원하지 않아, 실패 후 상태가 어긋날 수 있습니다. 예를 들어 재생성(`rewrite`) 실패 시 `generatedText`는 이전 값이 유지되지만 `result`는 이전 값으로 되돌아가므로, 이후 `handleSaveContent`에서 `generatedText || text` 로직이 예상과 다르게 동작할 여지가 있습니다.

- **위치**: `StudentWritingSection.tsx`의 `runGenerate` `catch` 블록
- **기존 코드**:
```typescript
} catch (error) {
  setResult(previousResult);
  ...
```
- **해결 방안**: 실패 시 `generatedText`와 `generationSignature`도 함께 복원합니다.
```typescript
} catch (error) {
  setResult(previousResult);
  setGeneratedText(previousResult?.text ?? '');
  setGenerationSignature(inputSignature(input));
  ...
```

**2. `stateLabel`의 `saving`/`generating` 상태에서 `Loader2` 스피너 애니메이션 중복 정의**

`StateLabel`의 `@keyframes school-record-spin`과 `StudentWritingSection`의 `SpinningLoader`에 동일한 `school-record-spin` 키프레임이 각각 정의되어 있습니다. 전역 CSS 키프레임 이름이 충돌할 가능성이 있으므로, 공통 스타일로 추출하거나 고유한 이름을 사용하는 것이 좋습니다.

---

## 주요 파일 분석

### frontend/src/features/school-record/api/schoolRecordAgentApi.ts

**변경 내용:**
SSE 종료 판정을 `done`/`error` 모두로 확장 (`receivedDone` → `receivedTerminalEvent`).

**개선 제안:**
`onclose`에서 `receivedTerminalEvent`가 false일 때만 오류를 던지는 로직은 적절합니다. 다만 `onerror`에서 `throw error` 후에도 `onclose`가 호출될 수 있는데, 이때 `receivedTerminalEvent`가 false면 이중 오류가 발생할 수 있습니다. `onerror`에서 이미 오류를 던졌다면 `onclose`의 오류는 중복이므로, 오류 발생 여부를 별도 플래그로 관리하는 것을 고려할 수 있습니다.

### frontend/src/widgets/school-record/BulkGenerateSection.tsx

**변경 내용:**
일괄 생성에 진행률/결과 화면과 자동 저장, 학생별 상태 추적을 추가.

**개선 제안:**
1. `saveDraft` 직접 호출 후 `studentDraft` 캐시 무효화 누락 (High 이슈 1 참조)
   - **위치**: `runBulk` 내 `saveDraft` 호출부
   - **기존 코드**:
     ```typescript
     await schoolRecordApi.saveDraft({ ... });
     ```
   - **해결 방안**: 저장된 학생의 `studentDraft` 캐시도 함께 무효화.

### frontend/src/widgets/school-record/StudentWritingSection.tsx

**변경 내용:**
개별 학생 AI 문구 생성(스트리밍)·편집·복원·복사 기능 추가.

**개선 제안:**
1. `runGenerate` 실패 시 `generatedText`/`generationSignature` 미복원 (Medium 이슈 1 참조)
   - **위치**: `runGenerate`의 `catch` 블록
   - **기존 코드**:
     ```typescript
     } catch (error) {
       setResult(previousResult);
     ```
   - **해결 방안**: `generatedText`와 `generationSignature`도 함께 복원.

---

## 최종 평가

**결론**: 
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전반적으로 잘 구조화된 기능 확장입니다. SSE 이벤트 처리와 상태 관리가 명확하며, AbortController 정리 패턴도 일관됩니다. 다만 일괄 생성 시 `studentDraft` 캐시 무효화 누락과 개별 생성 실패 시 상태 복원 불완전성은 데이터 일관성 측면에서 개선을 권장합니다. 이 두 가지를 보완하면 실무에서 바로 운영 가능한 수준입니다.