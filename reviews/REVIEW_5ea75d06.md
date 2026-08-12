> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 5ea75d06

## 코드 복잡도 분석

**분석된 파일**: 2개 / 변경된 파일: 3개


### 정상 범위 (NONE)


**`queries.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.012

- 청크 수: 46개


**권장사항:**

- 파일 크기가 큼 (46개 청크) - 파일 분리 검토


**`useapidata.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.010

- 청크 수: 58개


**권장사항:**

- 파일 크기가 큼 (58개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 교사 사이드바(`useTeacherClassList`)에서 검사 상태를 조회하는 방식을 기존의 독자적인 `dgnssService.getDgnssList` API 호출에서, 검사 페이지(`AssessmentPage`)와 동일한 `examSlots` 쿼리 키를 공유하도록 리팩토링한 것입니다.

- **목적**: `/api/dgnss/tc/info` API의 중복 호출을 제거하고, React Query의 자동 중복 제거(dedupe)를 활용하여 네트워크 효율성 개선
- **도메인**: 비즈니스 로직 (프론트엔드 데이터 페칭 계층)
- **변경 방향**: 기존에는 `useTeacherClassList`가 `['group-dgnss-status']`라는 독자적인 queryKey로 `dgnssService.getDgnssList`를 직접 호출했으나, 이제 `useAssessmentSlotsQueries`를 통해 검사 페이지와 동일한 `assessmentKeys.examSlots(claId, userId)` 키를 사용하도록 통합. 이로 인해 mutation 후 무효화 로직도 단순화됨 (`['group-dgnss-status']` 키 무효화 제거)

## [GOOD] 잘된 점

1. **쿼리 키 통합으로 중복 호출 제거**: `useTeacherClassList`가 `useAssessmentSlotsQueries`를 사용하도록 변경하여, 검사 페이지와 사이드바가 동일한 queryKey/queryFn을 공유하게 되었습니다. React Query의 자동 dedupe 메커니즘에 의해 동일한 데이터에 대한 중복 API 호출이 방지됩니다.

2. **mutation 후 무효화 로직 단순화**: `useInvalidateAssessmentGroup`에서 `['group-dgnss-status']` 키에 대한 무효화를 제거하고 `assessmentKeys.examSlots(claId, userId)` 하나만 무효화하도록 변경했습니다. 이는 쿼리 키 통합의 자연스러운 결과로, 유지보수성이 향상되었습니다.

3. **`useMemo` 도입으로 불필요한 재계산 방지**: `useTeacherClassList`의 반환값(`classes`, `examStatus`)을 `useMemo`로 감싸서, `groups`나 `dataByClaId`가 실제로 변경되지 않으면 불필요한 재계산을 방지합니다.

4. **문서 업데이트 동반**: `CLAUDE.md`에서 mutation 후 무효화 예시에서 `['group-dgnss-status']` 키를 제거하고, `useProfileCheck`의 창 포커스 리페치 이슈를 알려진 이슈 섹션에 추가하여 문서와 코드의 일관성을 유지했습니다.

## 변경사항 요약

- `useTeacherClassList`에서 `dgnssService.getDgnssList` 기반의 독자적인 `useQuery` 호출을 제거하고, `useAssessmentSlotsQueries`로 대체하여 검사 페이지와 쿼리 키 공유
- `useInvalidateAssessmentGroup`에서 `['group-dgnss-status']` 키 무효화 제거
- `useMyGroups`에 `refetchOnWindowFocus: true` 추가
- `CLAUDE.md` 문서 업데이트 (알려진 이슈, mutation 무효화 예시)

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `useAssessmentSlotsQueries`의 `dataByClaId` 타입 추론이 불완전함**

`queries.ts`의 `useAssessmentSlotsQueries` 함수에서 `dataByClaId`의 타입을 `ReturnType<typeof getExamSlots> extends Promise<infer T> ? T : never`로 선언하고 있습니다. 이는 TypeScript의 조건부 타입을 사용한 추론으로, `getExamSlots`의 반환 타입이 `Promise<ExamSlotState[]>`이므로 `T`는 `ExamSlotState[]`로 추론됩니다.

그러나 `useQueries`의 타입 추론은 제네릭이 복잡하게 얽혀 있어, 실제로 `results[index]?.data`의 타입이 `ExamSlotState[] | undefined`로 정확히 추론되지 않을 가능성이 있습니다. 특히 `useQueries`는 `@tanstack/react-query` v5에서 타입 추론이 까다로운 API 중 하나입니다.

**위치**: `frontend/src/features/assessment/api/queries.ts`, 라인 27-28

**기존 코드**:
```typescript
const dataByClaId = new Map<
  string,
  ReturnType<typeof getExamSlots> extends Promise<infer T> ? T : never
>();
```

**해결 방안 (수정 코드)**:
```typescript
import type { ExamSlotState } from '../types';

// ... (중략)

const dataByClaId = new Map<string, ExamSlotState[]>();
```

> **이유**: `getExamSlots`의 반환 타입이 `Promise<ExamSlotState[]>`이므로, `Map<string, ExamSlotState[]>`로 명시하는 것이 더 직관적이고 타입 안정성이 높습니다. 조건부 타입을 사용한 추론은 불필요한 복잡성을 추가하며, TypeScript 컴파일러가 `results[index]?.data`의 타입을 정확히 추론하지 못할 경우 타입 에러가 발생할 수 있습니다. `ExamSlotState`는 이미 `../types`에서 import되고 있으므로 추가 import가 필요합니다.

---

**2. `useMyGroups`에 `refetchOnWindowFocus: true` 추가로 인한 불필요한 리페치 가능성**

`useMyGroups` 훅에 `refetchOnWindowFocus: true`가 추가되었습니다. `staleTime: 0`과 함께 사용되면, 사용자가 탭을 전환했다가 돌아올 때마다 항상 `getMyGroups` API가 호출됩니다. 이는 `useTeacherClassList`가 사이드바에서 사용된다는 점을 고려할 때, 사용자가 다른 탭에 갔다가 돌아올 때마다 그룹 목록 API가 호출되는 결과를 초래합니다.

**위치**: `frontend/src/features/api/useApiData.ts`, 라인 549

**기존 코드**:
```typescript
function useMyGroups(userId: string | undefined) {
  return useQuery<Group[]>({
    queryKey: ['my-groups', userId],
    queryFn: () => groupService.getMyGroups(userId!),
    enabled: !!userId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
```

**해결 방안 (수정 코드)**:
```typescript
function useMyGroups(userId: string | undefined) {
  return useQuery<Group[]>({
    queryKey: ['my-groups', userId],
    queryFn: () => groupService.getMyGroups(userId!),
    enabled: !!userId,
    staleTime: 30_000, // 30초: 탭 전환 직후에는 캐시 사용, 일정 시간 경과 후 리페치
    refetchOnWindowFocus: true,
  });
}
```

> **이유**: `staleTime: 0`은 데이터가 항상 stale 상태임을 의미하므로, `refetchOnWindowFocus: true`와 결합하면 탭 포커스 시 항상 API를 호출합니다. `staleTime`을 30초 정도로 설정하면, 사용자가 짧게 다른 탭에 갔다가 돌아왔을 때는 캐시된 데이터를 사용하고, 일정 시간이 지난 후에만 리페치하도록 할 수 있습니다. 그룹 목록은 자주 변경되는 데이터가 아니므로 이 정도면 충분합니다. 만약 실시간성이 중요하다면 `staleTime: 0`을 유지하되, `refetchOnWindowFocus`를 `false`로 설정하거나 `refetchInterval`을 별도로 고려할 수 있습니다.

---

### Medium (개선 권장)

**1. `dgnssService` import가 더 이상 `useTeacherClassList`에서 사용되지 않지만, 파일 상단에 import가 남아있음**

`useTeacherClassList` 함수에서 `dgnssService`를 더 이상 사용하지 않지만, `frontend/src/features/api/useApiData.ts` 파일 상단에 `import { dgnssService } from '@features/groups/api/dgnssService';`가 여전히 존재합니다. 이 import는 파일 내 다른 함수(라인 450)에서 사용되고 있으므로 제거할 수는 없지만, 향후 리팩토링 시 `dgnssService` 의존성을 완전히 제거할 수 있는지 검토할 가치가 있습니다.

**위치**: `frontend/src/features/api/useApiData.ts`, 라인 29

**제안**: 현재는 다른 함수에서 사용 중이므로 제거 불가. 향후 `useTeacherClassList` 외의 다른 함수들도 `useAssessmentSlotsQueries`로 마이그레이션할 때 함께 정리하는 것을 고려하세요.

---

**2. `useAssessmentSlotsQueries`의 `dataByClaId`가 `readonly Group[]`을 받지만 Map 키는 `string`으로 고정**

`useAssessmentSlotsQueries`의 시그니처는 `groups: readonly Group[]`을 받지만, `dataByClaId`의 키는 `group.claId`(string)로 고정되어 있습니다. `groups` 배열이 비어있거나 `claId`가 중복되는 경우에 대한 처리가 없습니다.

**위치**: `frontend/src/features/assessment/api/queries.ts`, 라인 14-40

**제안**: `groups` 배열이 비어있을 때 early return을 추가하거나, `claId` 중복 시 마지막 값으로 덮어쓰는 현재 동작을 명시적으로 문서화하는 것이 좋습니다. 현재는 `groups.forEach`로 순회하면서 동일한 `claId`가 여러 번 나오면 마지막 값으로 덮어쓰기 때문에, 중복 `claId`가 있는 경우 데이터 손실이 발생할 수 있습니다.

---

## 주요 파일 분석

### `frontend/src/features/assessment/api/queries.ts`

**변경 내용**: `useInvalidateAssessmentGroup`에서 `['group-dgnss-status']` 키 무효화 제거

**개선 제안**: 위 High 이슈 1번에서 언급한 `dataByClaId` 타입 추론 개선 적용

### `frontend/src/features/api/useApiData.ts`

**변경 내용**: `useTeacherClassList`에서 `dgnssService.getDgnssList` 기반의 독자적인 `useQuery`를 `useAssessmentSlotsQueries`로 대체하고, `useMemo` 도입

**개선 제안**: 위 High 이슈 2번에서 언급한 `staleTime` 조정 적용

### `frontend/CLAUDE.md`

**변경 내용**: mutation 후 무효화 예시 업데이트, 알려진 이슈에 `useProfileCheck` 창 포커스 리페치 추가

**평가**: 문서 업데이트가 정확하게 이루어졌습니다. `useProfileCheck`의 `refetchOnWindowFocus: true`와 `staleTime: 5분` 설정이 함께 명시되어 있어, 개발자가 이슈를 이해하는 데 충분한 정보를 제공합니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**: 전반적으로 변경 방향은 올바르며, 쿼리 키 통합과 mutation 무효화 단순화는 명확한 개선입니다. 다만 `dataByClaId`의 타입 추론 방식이 불필요하게 복잡하여 잠재적인 타입 안정성 문제가 있고, `useMyGroups`의 `staleTime: 0`과 `refetchOnWindowFocus: true` 조합은 불필요한 API 호출을 유발할 수 있습니다. 이 두 가지 High 이슈를 수정한 후 승인을 권장합니다.