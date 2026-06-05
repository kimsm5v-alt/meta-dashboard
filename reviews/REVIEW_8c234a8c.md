# 코드 리뷰 - 8c234a8c

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`studentexamservice.ts`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.008

- 청크 수: 17개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 학생 검사 목록에서 결과 조회 가능 여부(`hasResult`)를 판단하는 조건을 수정합니다. 기존에는 `'completed'`(제출 완료) 상태에서도 결과 조회가 가능하다고 표시되었으나, 실제로는 진단 분석이 완료된 `'result_ready'` 상태에서만 결과를 조회할 수 있어야 합니다.

- **목적**: `hasResult` 필드의 조건을 비즈니스 요구사항에 맞게 정정
- **도메인**: 비즈니스 로직 (API 서비스 레이어)
- **변경 방향**: `'completed'` 상태를 조건에서 제외하여, 진단 분석이 완료된(`result_ready`) 경우에만 결과 조회가 가능하도록 정확하게 판단

---

## [GOOD] 잘된 점

**1. 비즈니스 로직 정합성 개선**

`mapExamStatus` 함수의 상태 정의를 분석해보면, 각 상태는 다음과 같은 조건으로 매핑됩니다:

```typescript
// frontend/src/features/student-exam/types.ts
export function mapExamStatus(dgnssAt: 'Y' | 'N', submAt: 'Y' | 'N', eakAt: 'Y' | 'N'): ExamStatus {
  if (dgnssAt === 'N') {
    return submAt === 'Y' ? 'result_ready' : 'not_submitted';
  }
  if (eakAt === 'Y') {
    return submAt === 'Y' ? 'completed' : 'in_progress';
  }
  return 'waiting';
}
```

여기서 중요한 점은 `'completed'` 상태가 `eakAt='Y'`(검사 시작) + `submAt='Y'`(제출 완료)이지만 `dgnssAt`이 아직 `'N'`인 상태라는 것입니다. 즉, 학생이 검사를 제출했지만 진단 분석(채점 및 결과 생성)이 완료되지 않아 결과를 볼 수 없는 상태입니다. 반면 `'result_ready'`는 `dgnssAt='N'` + `submAt='Y'` 조건으로, 진단 분석이 완료되어 결과 조회가 가능한 상태입니다.

변경 전 코드는 `hasResult: status === 'completed' || status === 'result_ready'`로 되어 있어, 제출만 완료되어도 결과 조회가 가능하다고 표시되었습니다. 이는 비즈니스 로직 관점에서 부정확했습니다. 변경 후 `hasResult: status === 'result_ready'`로 수정하여 이 문제를 해결했습니다.

**2. 주석 정리**

기존에 `HSJ-71` 관련 주석(3줄)을 깔끔하게 제거했습니다. 주석으로 설명할 내용이 코드 자체로 명확해졌으므로, 불필요한 주석을 제거한 것은 좋은 결정입니다.

**3. 변경 범위 최소화**

단 1줄의 조건식만 변경하여 영향 범위를 최소화했습니다. 이는 안전하고 집중된 리팩토링 방식입니다.

---

## 변경사항 요약

`mapToListItem` 함수에서 `hasResult` 필드의 조건을 `status === 'completed' || status === 'result_ready'`에서 `status === 'result_ready'`로 단순화했습니다. 이로 인해 `'completed'` 상태에서는 `hasResult`가 `false`가 되어, 진단 분석이 완료된 경우에만 결과 조회가 가능하도록 수정되었습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)
없음

### High (우선 수정 권장)
없음

### Medium (개선 권장)
없음

---

## 주요 파일 분석

### `frontend/src/features/student-exam/api/studentExamService.ts`

**변경 내용:**
`mapToListItem` 함수 내 `hasResult` 조건을 `status === 'result_ready'`로 단순화

**개선 제안:**
이 변경은 명확하고 올바른 수정입니다. 추가 개선이 필요하지 않습니다.

다만, `isFinished` 변수는 여전히 `status === 'completed' || status === 'result_ready'` 조건을 사용하고 있는데, 이는 `progress`와 `answeredCount`를 100%로 설정하는 용도로 사용됩니다. `'completed'` 상태에서도 진행률 100%와 전체 문항 수 응답은 표시되어야 하므로, 이 조건은 그대로 유지하는 것이 적절합니다. 즉, `isFinished`와 `hasResult`는 서로 다른 의미를 가지므로 분리된 조건을 유지한 현재 설계가 타당합니다.

---

## 최종 평가

**결론**:
- [X] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**
변경 범위가 매우 작고 명확하며, 비즈니스 로직 관점에서 올바른 수정입니다. `mapExamStatus` 함수의 상태 정의와 일관되게 `hasResult` 조건을 정리하여, `'completed'`(제출 완료, 분석 미완료)와 `'result_ready'`(분석 완료)를 명확히 구분한 점이 좋습니다. 추가 개선 사항 없이 바로 승인 가능한 커밋입니다.