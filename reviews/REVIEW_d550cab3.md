# 코드 리뷰 - d550cab3

## 코드 복잡도 분석

**분석된 파일**: 3개 / 변경된 파일: 3개


### 정상 범위 (NONE)


**`groupservice.ts`** (other)

- 평균 복잡도: **0.006**

- 최대 복잡도: 0.013

- 청크 수: 49개


**권장사항:**

- 파일 크기가 큼 (49개 청크) - 파일 분리 검토


**`myexamlistpage.tsx`** (component)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.005

- 청크 수: 79개


**권장사항:**

- 파일 크기가 큼 (79개 청크) - 파일 분리 검토


**`myresultpage.tsx`** (component)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.008

- 청크 수: 93개


**권장사항:**

- 파일 크기가 큼 (93개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 학생용 검사 목록 페이지(`MyExamListPage`)와 결과 페이지(`MyResultPage`)에서 그룹 목록을 조회할 때, 탈퇴하거나 방출된 그룹까지 포함하여 조회할 수 있도록 `getMyGroups` API 함수에 `includeInactive` 파라미터를 추가한 변경입니다.

- **목적**: 학생이 과거에 속했던 그룹(탈퇴/방출)의 검사 기록까지 조회할 수 있도록 하여, 학생이 이전 그룹에서 수행한 검사 결과가 누락되지 않도록 보장
- **도메인**: 비즈니스 로직 (API 서비스 레이어 + UI 페이지)
- **변경 방향**: 기존에는 항상 활성 그룹만 조회했으나, `includeInactive` 옵션을 통해 비활성 그룹 포함 여부를 호출자가 선택할 수 있도록 유연성 확보

## [GOOD] 잘된 점

1. **하위 호환성 유지**: `includeInactive` 파라미터에 기본값 `false`를 할당하여 기존 호출 코드(`getMyGroups(user.id)`)는 변경 없이 동일하게 동작합니다. 이는 기존 기능을 깨뜨리지 않으면서 새로운 기능을 추가하는 모범적인 패턴입니다.

2. **명확한 JSDoc 문서화**: `@param includeInactive true면 탈퇴/방출된 그룹도 포함`이라는 주석을 추가하여 API의 의미를 명확히 전달하고 있습니다. 다른 개발자가 이 함수를 사용할 때 파라미터의 의미를 즉시 이해할 수 있습니다.

3. **일관된 호출 패턴**: `MyExamListPage`와 `MyResultPage` 두 곳에서 동일한 방식(`getMyGroups(user.id, true)`)으로 호출하여 일관성을 유지하고 있습니다. 특히 `MyResultPage`에 `// MyExamListPage와 동일한 패턴 사용`이라는 주석을 남겨 의도적인 일관성임을 명시한 점이 좋습니다.

## 변경사항 요약

- `groupService.ts`: `getMyGroups` 함수에 `includeInactive` 파라미터(기본값 `false`) 추가. `true`일 경우 URL에 `?includeInactive=true` 쿼리 파라미터를 포함시킴
- `MyExamListPage.tsx`: `getMyGroups(user.id)` 호출을 `getMyGroups(user.id, true)`로 변경
- `MyResultPage.tsx`: `getMyGroups(user.id)` 호출을 `getMyGroups(user.id, true)`로 변경

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

**1. `_userId` 파라미터가 실제로 사용되지 않음**

`getMyGroups` 함수는 `_userId` 파라미터를 받지만 실제로는 사용하지 않고 있습니다. API 호출 시 `userId`를 전혀 보내지 않고 있으며, URL에만 `includeInactive` 쿼리 파라미터를 추가하고 있습니다.

- **위치**: `frontend/src/features/groups/api/groupService.ts`, 라인 209-216
- **기존 코드**:
```typescript
export const getMyGroups = async (
  _userId: string,
  includeInactive = false,
): Promise<Group[]> => {
  const url = includeInactive ? '/group/list?includeInactive=true' : '/group/list';
  const res = await apiClient.get<BackendGroupListItem[]>(url);
  return (res.resultData ?? []).map(toFrontendGroup);
};
```

- **해결 방안 (수정 코드)**:
  - **옵션 A (권장)**: `_userId` 파라미터를 제거하고, `includeInactive`만 받도록 시그니처를 단순화합니다. 단, 이 경우 `MyExamListPage`와 `MyResultPage`에서 `getMyGroups(user.id, true)` 호출을 `getMyGroups(true)`로 변경해야 합니다.
  - **옵션 B**: 백엔드 API가 `userId`를 필요로 한다면, 실제로 API 호출에 포함시킵니다.

  **옵션 A 적용 시 수정 코드**:
  ```typescript
  // groupService.ts
  export const getMyGroups = async (
    includeInactive = false,
  ): Promise<Group[]> => {
    const url = includeInactive ? '/group/list?includeInactive=true' : '/group/list';
    const res = await apiClient.get<BackendGroupListItem[]>(url);
    return (res.resultData ?? []).map(toFrontendGroup);
  };
  ```
  ```typescript
  // MyExamListPage.tsx (라인 415)
  const groups = await getMyGroups(true);
  ```
  ```typescript
  // MyResultPage.tsx (라인 426)
  const groups = await getMyGroups(true);
  ```

  **옵션 B 적용 시 수정 코드**:
  ```typescript
  export const getMyGroups = async (
    userId: string,
    includeInactive = false,
  ): Promise<Group[]> => {
    const params = new URLSearchParams({ userId });
    if (includeInactive) params.append('includeInactive', 'true');
    const res = await apiClient.get<BackendGroupListItem[]>(`/group/list?${params}`);
    return (res.resultData ?? []).map(toFrontendGroup);
  };
  ```

  > **참고**: `_userId`가 언더스코어 접두사(`_`)를 사용한 것은 의도적으로 사용하지 않는 파라미터임을 명시한 것입니다. 이는 TypeScript/JavaScript에서 흔히 사용되는 관례이지만, 함수 시그니처에 불필요한 파라미터를 유지하는 것은 코드를 읽는 다른 개발자에게 혼란을 줄 수 있습니다. 현재 `_userId`는 `MyExamListPage`와 `MyResultPage`에서 `user.id`를 전달하기 위해 호출부에서만 사용되고 있으며, 실제 API 호출에는 반영되지 않고 있습니다. 백엔드 API가 인증 토큰을 통해 사용자를 식별한다면 `_userId`를 제거하는 것이 더 깔끔합니다.

**2. `toFrontendGroup` 변환 함수에서 `myRole` 매핑 누락 가능성**

`toFrontendGroup` 함수(라인 107-120)에서 `myRole` 필드는 `item.myRole === 'HOST' ? 'owner' : 'member'`로 매핑됩니다. 그런데 `BackendGroupListItem` 인터페이스(라인 25-36)에서 `myRole`의 타입은 `'HOST' | 'STUDENT'`로 정의되어 있습니다.

비활성 그룹(탈퇴/방출된 그룹)의 경우 백엔드가 `myRole` 필드를 어떻게 반환하는지 확인이 필요합니다. 만약 비활성 그룹에 대해 `myRole`이 `null`이나 `undefined`로 반환된다면, `toFrontendGroup`에서 `'member'`로 잘못 매핑될 수 있습니다.

- **위치**: `frontend/src/features/groups/api/groupService.ts`, 라인 107-120
- **제안**: `includeInactive=true`로 조회한 그룹 목록에서 `myRole` 필드가 예상대로 `'HOST' | 'STUDENT'`로 반환되는지 백엔드 API 명세를 확인하고, 필요시 `toFrontendGroup` 함수에서 `null`/`undefined` 케이스를 처리하도록 개선하세요.

---

## 최종 평가

**결론**:
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**

이 커밋은 명확한 목적(비활성 그룹 포함 조회)을 가지고 있으며, 하위 호환성을 유지하면서 필요한 기능을 추가한 적절한 변경입니다. `includeInactive` 파라미터의 기본값을 `false`로 설정하여 기존 코드에 영향을 주지 않은 점, 두 페이지에서 일관된 패턴으로 호출한 점, JSDoc으로 의도를 문서화한 점이 좋습니다.

`_userId` 파라미터가 실제로 사용되지 않는 점은 개선할 수 있는 부분이지만, 현재 코드의 동작에 영향을 주지 않으며 명시적으로 사용하지 않음을 표시(`_` 접두사)했으므로 즉시 수정이 필요한 사항은 아닙니다. 추후 리팩토링 시 함께 고려하시면 좋겠습니다.