# 코드 리뷰 - e094e49f

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`examguidestep.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.009

- 청크 수: 103개


**권장사항:**

- 파일 크기가 큼 (103개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 시험 안내(Exam Guide) 단계에서 학년(grade)과 반(classNumber) 필드의 null 체크 로직을 개선한 것입니다.

- **목적**: null/undefined 체크(`== null`)를 falsy 체크(`!`)로 변경하여, 빈 문자열이나 0과 같은 falsy 값도 필수 입력 표시(RequiredMark)가 나타나도록 처리
- **도메인**: UI / 비즈니스 로직 (React 컴포넌트)
- **변경 방향**: 엄격한 null 체크에서 더 포괄적인 falsy 체크로 변경하여, 값이 "비어있는" 모든 경우에 RequiredMark가 표시되도록 일관성 확보

## [GOOD] 잘된 점

- **일관된 패턴 적용**: `grade`와 `classNumber` 두 필드에 동일한 변경 패턴(`== null` -> `!`, `!= null` -> 조건식 직접 평가)을 일관되게 적용하여 코드의 통일성을 높였습니다.
- **의도 명확화**: "값이 없음"을 체크하는 의도를 `== null`보다 `!` 연산자로 더 직관적으로 표현했습니다. `number` 타입 컨텍스트에서 `0`은 유효하지 않은 값이므로 falsy 체크가 적절합니다.
- **변경 범위 최소화**: 필요한 부분만 정확히 수정하여 리스크를 최소화했습니다.

## 변경사항 요약

`ExamGuideStep.tsx`에서 학년(grade)과 반(classNumber) 필드의 조건부 렌더링 로직을 `== null` / `!= null`에서 `!` / 조건식 직접 평가 방식으로 변경했습니다. 총 4군데의 null 체크 패턴이 수정되었습니다.

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

### `frontend/src/features/exam/ui/ExamGuideStep.tsx`

**변경 내용:**
`grade`와 `classNumber`의 null 체크를 `== null` / `!= null`에서 `!` / 직접 평가 방식으로 변경 (라인 855, 856, 893, 895)

**변경 전 코드:**
```tsx
<FieldLabel>학년{grade == null && <RequiredMark>*</RequiredMark>}</FieldLabel>
{grade != null ? (
  // ... LockedFieldWrapper 렌더링
) : (
  // ... GradeSelect 렌더링
)}
```

**변경 후 코드:**
```tsx
<FieldLabel>학년{!grade && <RequiredMark>*</RequiredMark>}</FieldLabel>
{grade ? (
  // ... LockedFieldWrapper 렌더링
) : (
  // ... GradeSelect 렌더링
)}
```

**분석:**

이 변경의 안전성을 검증하기 위해 `grade`와 `classNumber`의 타입을 확인했습니다.

1. **Props 타입 정의 (13-14번 라인)**: `grade?: number;`, `classNumber?: number;` - `number | undefined` 타입
2. **formData 타입 (640-641번 라인)**: `grade?: string;`, `classNumber?: string;` - `string | undefined` 타입
3. **초기화 로직 (613-614번 라인)**: `grade: initialInfo?.grade || ''` - 빈 문자열(`''`)이 될 수 있음

변경 전 `== null`은 `null`과 `undefined`만 체크합니다. 변경 후 `!grade`는 `0`, `''`, `false`, `null`, `undefined`, `NaN`을 모두 체크합니다.

**안전성 판단:**
- `grade`가 `number` 타입일 때, 학년은 1~6(초등) 또는 1~3(중/고)이므로 `0`은 유효하지 않은 값입니다. 따라서 `!grade`로 변경해도 실제 동작에 문제가 없습니다.
- `classNumber`도 마찬가지로 `number` 타입이며, 반 번호는 1부터 시작하므로 `0`은 유효하지 않습니다.
- `formData`에서 `grade`와 `classNumber`가 `string` 타입으로 관리될 때, 빈 문자열(`''`)은 `!` 연산자에서 `true`로 평가되어 RequiredMark가 표시됩니다. 이는 기존 `== null` 체크에서는 잡히지 않던 케이스로, 이 변경으로 인해 더 정확한 필수 입력 표시가 가능해졌습니다.

**결론**: 이 변경은 현재 컨텍스트에서 안전하며, 오히려 기존보다 더 포괄적이고 정확한 필수 입력 표시를 가능하게 합니다.

---

## 최종 평가

**결론**:
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**
변경 범위가 작고 명확하며, `number` 타입(`grade`, `classNumber`)에서 `0`은 유효하지 않은 값이므로 falsy 체크(`!`)로의 변경은 적절합니다. 또한 `formData`에서 `string` 타입으로 관리될 때 빈 문자열 케이스까지 커버하게 되어 오히려 더 정확한 필수 입력 표시가 가능해졌습니다. 코드의 일관성과 가독성이 개선되었으며, 특별한 문제 없이 승인합니다.