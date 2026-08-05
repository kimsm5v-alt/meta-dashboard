> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 4ebd2720

## 코드 복잡도 분석

변경된 파일의 복잡도 정보를 찾을 수 없습니다.
(인덱스가 생성되지 않았거나 새로운 파일일 수 있습니다)

---



## 변경 배경

이 커밋은 v2 대시보드 아키텍처의 기반이 되는 **스코프(Scope) 시스템**을 프론트엔드에 이식하는 작업입니다. 사용자가 '전체', '반', '학생' 단위로 데이터 조회 범위를 선택하고, 메뉴 이동 시 해당 메뉴가 지원하는 스코프 레벨에 따라 자동으로 조정되도록 하는 핵심 도메인 로직입니다.

- **목적**: 메뉴별 지원 스코프 정의, 메뉴 이동 시 스코프 자동 조정, URL 쿼리 파라미터와 스코프 상태의 양방향 동기화
- **도메인**: 비즈니스 로직 (프론트엔드 상태 관리 / 라우팅 연동)
- **변경 방향**: 기존에는 스코프 개념이 산발적으로 각 컴포넌트에 분산되어 있었으나, 이 커밋으로 `shared/scope` 모듈에 일원화하여 재사용성과 일관성을 확보

---

## [GOOD] 잘된 점

1. **도메인 모델링이 명확함**: `ScopeLevel`, `Scope`, `ScopeMemory`, `MenuScopeConfig` 등 핵심 타입이 응집력 있게 정의되어 있습니다. 특히 `ScopeMemory`에 `lastStudentId`와 `lastClassId`를 분리하여, 메뉴 이동 시 이전 선택을 기억하는 요구사항을 정확히 반영했습니다.

2. **순수 함수와 React 훅의 분리가 적절함**: `scopeUtils.ts`는 순수 함수만 포함하고, `useScopeSync.ts`는 React 훅으로 분리되어 테스트 용이성과 관심사 분리가 잘 이루어졌습니다. `adjustScopeForMenu`는 사이드 이펙트 없이 입력에 따른 출력만 반환하므로 단위 테스트 작성이 용이합니다.

3. **메뉴 키 매칭 전략이 현실적임**: `getMenuKeyFromPath`에서 2-depth 우선 매칭 후 1-depth로 fallback하는 전략은 실제 라우팅 구조(예: `exam/result/detail` -> `exam/result`)를 고려한 실용적인 설계입니다.

---

## 변경사항 요약

`frontend/src/shared/scope/` 디렉토리에 3개 파일을 신규 생성: (1) `scopeConfig.ts` - 타입 정의와 메뉴별 스코프 매트릭스, (2) `scopeUtils.ts` - 스코프 조정/검증 순수 함수, (3) `useScopeSync.ts` - URL과 스코프 상태를 양방향 동기화하는 React 훅. 총 351라인 추가.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `adjustScopeForMenu`의 `class -> student` fallback 시 유효성 검증 누락**

- **파일**: `frontend/src/shared/scope/scopeUtils.ts`
- **위치**: 72-80라인
- **문제**: `level === 'class'`이고 `!menuConfig.class`일 때, `menuConfig.student && classId && scopeMemory.lastStudentId` 조건으로 student 레벨로 fallback합니다. 그런데 `scopeMemory.lastStudentId`는 이전 메뉴에서 저장된 studentId로, 현재 메뉴의 컨텍스트에서 유효한 studentId인지 검증하지 않습니다. 예를 들어, `coaching/individual`(class=false, student=true)에서 `exam/management`(class=true, student=false)로 이동했다가 다시 `coaching/individual`로 돌아오면, `lastStudentId`는 존재하지만 해당 학생이 현재 classId에 속하는지 보장할 수 없습니다.

- **개선 제안**: `isValidScope` 함수를 활용하거나, 최소한 `lastStudentId`가 `classId`와 연관된 유효한 ID인지 확인하는 로직을 추가하는 것이 안전합니다. 현재 구조에서는 유효하지 않은 student scope로 이동하여 API 호출 실패나 빈 데이터가 표시될 가능성이 있습니다.

```
// 현재 코드 (72-80라인)
if (menuConfig.student && classId && scopeMemory.lastStudentId) {
  adjustedScope = {
    level: 'student',
    classId,
    studentId: scopeMemory.lastStudentId,
  };
}

// 개선 제안: lastStudentId의 유효성을 검증할 수 있는 콜백 또는 검증 함수를 주입받는 구조 고려
// 또는 최소한 lastStudentId가 존재하는지만 확인하는 것이 아니라,
// 해당 classId에 속하는 학생인지 확인하는 단계가 필요
```

**2. `useScopeSync`의 `setTimeout` 기반 동기화 플래그 해제 방식**

- **파일**: `frontend/src/shared/scope/useScopeSync.ts`
- **위치**: 72-75라인
- **문제**: `updateURL` 함수 내에서 `navigate` 호출 직후 `setTimeout(() => { isSyncingRef.current = false; }, 0)`로 플래그를 해제합니다. 이 방식은 `navigate`가 완료되기 전에 플래그가 해제되어, 동기화 중에 발생한 다른 상태 변경이 무시되지 않고 다시 `updateURL`을 호출할 위험이 있습니다. React 18의 automatic batching과 `navigate`의 비동기 특성상, `setTimeout` 타이밍이 `navigate`로 인한 리렌더링보다 먼저 실행될 수 있습니다.

- **개선 제안**: `useEffect`의 cleanup 함수를 활용하거나, `navigate`의 Promise 완료 후 플래그를 해제하는 패턴이 더 안정적입니다.

```
// 현재 코드
setTimeout(() => {
  isSyncingRef.current = false;
}, 0);

// 개선 제안: navigate가 완료된 후 cleanup
// navigate는 Promise를 반환하지 않으므로, useEffect cleanup 패턴 사용
// 또는 isSyncingRef를 useEffect 의존성 배열에 포함시키는 구조 검토
```

### Medium (개선 권장)

**3. `parseScopeFromURL`의 불필요한 `useCallback` 재생성**

- **파일**: `frontend/src/shared/scope/useScopeSync.ts`
- **위치**: 37-48라인
- **문제**: `parseScopeFromURL`이 `useCallback`으로 정의되어 있지만, 의존성 배열에 `[searchParams]`가 포함되어 있습니다. `searchParams`는 `useSearchParams()`에서 반환되는 객체로, URL이 변경될 때마다 새로운 참조가 생성됩니다. 따라서 `parseScopeFromURL`도 매번 새로운 함수가 되어 `useCallback`의 메모이제이션 효과가 거의 없습니다. 또한 첫 번째 `useEffect`(55-61라인)의 의존성에 `parseScopeFromURL`이 포함되어 있어, 불필요한 effect 재실행이 발생합니다.

- **개선 제안**: `parseScopeFromURL`을 `useCallback` 없이 일반 함수로 선언하거나, `searchParams` 대신 `location.search`를 직접 파싱하는 방식으로 변경하면 의존성을 줄일 수 있습니다.

```
// 현재: useCallback + searchParams 의존성
const parseScopeFromURL = useCallback((): Scope => {
  const classId = searchParams.get('class');
  // ...
}, [searchParams]);

// 개선 제안 1: useCallback 제거 (내부에서 searchParams 직접 사용)
const parseScopeFromURL = (): Scope => {
  const classId = searchParams.get('class');
  // ...
};

// 개선 제안 2: location.search 기반으로 변경하여 의존성 최소화
const parseScopeFromURL = useCallback((): Scope => {
  const params = new URLSearchParams(location.search);
  const classId = params.get('class');
  // ...
}, [location.search]);
```

**4. `buildScopeQueryString`와 `parseScopeFromSearchParams`의 중복**

- **파일**: `frontend/src/shared/scope/useScopeSync.ts`
- **위치**: 113-133라인
- **문제**: `useScopeSync.ts` 파일 하단에 `buildScopeQueryString`와 `parseScopeFromSearchParams`라는 두 개의 독립 함수가 선언되어 있습니다. 이 함수들은 `scopeUtils.ts`에 위치하는 것이 더 적절해 보입니다. `useScopeSync.ts`는 React 훅을 위한 파일이므로, 순수 유틸리티 함수는 `scopeUtils.ts`로 이동하여 일관성을 유지하는 것이 좋습니다.

- **개선 제안**: `buildScopeQueryString`와 `parseScopeFromSearchParams`를 `scopeUtils.ts`로 이동하고, `useScopeSync.ts`에서는 import하여 사용하도록 리팩토링합니다.

---

## 주요 파일 분석

### scopeConfig.ts

**변경 내용**: Scope 타입, MenuScopeConfig, MENU_SCOPE_MATRIX 등 스코프 시스템의 핵심 설정 정의

**개선 제안**:
1. `MenuKey` 타입이 유니온 타입으로 정의되어 있어, 새로운 메뉴가 추가될 때마다 `MENU_SCOPE_MATRIX`와 `MenuKey`를 동시에 수정해야 합니다. `keyof typeof MENU_SCOPE_MATRIX`를 사용하면 하나의 소스 오브 트루스로 관리할 수 있습니다.

### scopeUtils.ts

**변경 내용**: 메뉴 이동 시 스코프 자동 조정, 유효성 검사, 비교 등 순수 유틸리티 함수

**개선 제안**:
1. `adjustScopeForMenu` 함수의 `class -> student` fallback 로직에 유효성 검증 추가 (High 이슈 #1 참조)
2. `isScopeEqual` 함수는 `Object.is` 또는 lodash의 `isEqual`로 대체 가능하나, 현재 구현도 충분히 명확하므로 유지해도 무방

### useScopeSync.ts

**변경 내용**: URL 쿼리 파라미터와 스코프 상태의 양방향 동기화 React 훅

**개선 제안**:
1. `setTimeout` 기반 동기화 플래그 해제 방식 개선 (High 이슈 #2 참조)
2. `parseScopeFromURL`의 `useCallback` 의존성 최적화 (Medium 이슈 #3 참조)
3. 순수 유틸리티 함수를 `scopeUtils.ts`로 이동 (Medium 이슈 #4 참조)

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**:
전반적으로 도메인 모델링과 관심사 분리가 잘 이루어진 좋은 코드입니다. 다만 `adjustScopeForMenu`의 `class -> student` fallback 시 `lastStudentId`의 유효성을 검증하지 않는 점과, `useScopeSync`의 `setTimeout` 기반 동기화 플래그 해제 방식은 실제 운영 환경에서 미묘한 버그를 유발할 가능성이 있습니다. 이 두 가지 High 이슈를 해결한 후 머지하는 것을 권장합니다. 특히 `adjustScopeForMenu`의 유효성 검증 누락은 사용자가 잘못된 student scope에서 데이터를 조회하게 되어 빈 화면이나 오류 상태를 경험할 수 있는 사용자 경험 문제로 이어질 수 있으므로, 우선적으로 개선이 필요합니다.