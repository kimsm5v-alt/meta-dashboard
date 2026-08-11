> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 5cb433f5

## 코드 복잡도 분석

**분석된 파일**: 5개 / 변경된 파일: 7개


### 정상 범위 (NONE)


**`env.ts`** (config)

- 평균 복잡도: **0.006**

- 최대 복잡도: 0.006

- 청크 수: 1개


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`features.ts`** (config)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.011

- 청크 수: 6개


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`iav2toggle.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 13개


**권장사항:**

- 복잡도 정상 범위


**`mainlayout.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.008

- 청크 수: 137개


**권장사항:**

- 파일 크기가 큼 (137개 청크) - 파일 분리 검토


**`gnbheader.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.003

- 청크 수: 59개


**권장사항:**

- 파일 크기가 큼 (59개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 개발/스테이징 환경에서 기획자가 코드 수정 없이 v2 정보구조(IA_V2) 화면을 켜고 끄며 검수할 수 있도록 하는 개발 편의 기능을 추가합니다. `IaV2Toggle` 컴포넌트와 localStorage 오버라이드 메커니즘을 도입하고, `IS_DEV_MODE` 환경 플래그를 추가하여 운영 빌드에서는 토글이 노출되지 않도록 제어합니다.

- **목적**: 기획자 검수용 IA_V2 온오프 토글 제공 및 개발/스테이징 환경 판별
- **도메인**: UI (프론트엔드 개발 편의 기능)
- **변경 방향**: 정적 feature flag를 localStorage 오버라이드 가능한 동적 플래그로 확장하고, 환경별 노출 제어를 추가

## [GOOD] 잘된 점

- 개발 전용 기능을 `ENV.IS_DEV_MODE`로 감싸 운영 빌드에서 노출되지 않도록 안전하게 격리한 점이 좋습니다.
- `IaV2Toggle`을 별도 컴포넌트로 분리하여 재사용성을 확보했고, `$on` transient prop과 theme 토큰을 사용해 기존 스타일 컨벤션을 잘 따랐습니다.
- 새로고침 방식으로 9곳의 `FEATURES.IA_V2` 읽기 코드를 전부 리액티브하게 바꾸지 않아도 되도록 한 실용적인 접근이 좋습니다.

## 변경사항 요약

개발/스테이징 환경에서 IA_V2를 브라우저에서 직접 토글할 수 있는 `IaV2Toggle` 컴포넌트와 localStorage 오버라이드 키를 추가하고, `IS_DEV_MODE` 환경 플래그를 신설했습니다. `MainLayout`과 `GnbHeader` 두 헤더에 토글을 배치했습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

- **`IA_V2` 기본값이 주석과 불일치**: `features.ts`에서 `IA_V2_DEFAULT = true`로 설정되어 있으나, 주석에는 "점진 전환 완료 전까지 기본 비활성화"라고 명시되어 있습니다. 기존 코드는 `IA_V2: false`였는데 이번 커밋에서 기본값이 `true`로 변경되었습니다. 이는 의도된 변경인지 확인이 필요하며, 만약 실수라면 운영 환경에서 v2 화면이 기본 활성화되는 심각한 문제가 됩니다. 주석과 실제 기본값이 반드시 일치해야 합니다.

### Medium (개선 권장)

- **`IS_DEV_MODE` 판단 방식의 잠재적 위험**: `import.meta.env.MODE !== 'production'`은 `build:dev`뿐 아니라 `build:staging` 등 production이 아닌 모든 모드에서 true가 됩니다. 만약 스테이징 서버가 `--mode production`으로 빌드된다면 토글이 노출되지 않을 수 있고, 반대로 운영과 유사한 스테이징에서 노출될 수 있습니다. 환경별로 명시적인 모드 목록을 사용하는 것이 더 안전합니다.
- **`IaV2Toggle`의 `isOn`이 렌더 시점에만 평가**: `FEATURES.IA_V2`는 모듈 로드 시점에 결정되므로, 토글 클릭 후 새로고침 전까지는 상태가 반영되지 않습니다. 이는 의도된 설계(새로고침 반영)이지만, 토글 클릭 직후 화면이 즉시 바뀌지 않아 사용자가 반응이 없는 것으로 오해할 수 있습니다. 클릭 시 로딩 표시나 안내 문구를 추가하면 UX가 개선됩니다.
- **두 헤더에 중복 배치**: `MainLayout`(구형 헤더)과 `GnbHeader`(v2 헤더) 양쪽에 토글이 배치되어 있습니다. IA_V2가 켜진 상태에서는 v2 헤더만 보이므로 구형 헤더의 토글은 사실상 접근 불가능합니다. 이는 의도된 것일 수 있으나, 중복 코드가 늘어나므로 공통 헤더 액션 컴포넌트로 추출하는 것을 고려할 수 있습니다.

---

## 주요 파일 분석

### frontend/src/shared/config/features.ts

**변경 내용:**
`IA_V2` 기본값을 `false`에서 `true`로 변경하고, localStorage 오버라이드 로직(`readIaV2Override`)을 추가했습니다.

**개선 제안:**

1. 주석과 기본값 불일치 해소
   - **위치 (라인 번호)**: 17-18 (`IA_V2_DEFAULT = true`), 21-22 (`IA_V2` 주석)
   - **기존 코드**:
```typescript
const IA_V2_DEFAULT = true;

export const FEATURES = {
  /** v2 정보구조(GNB + scope LNB). 점진 전환 완료 전까지 기본 비활성화. 개발/스테이징에서는 IaV2Toggle로 localStorage 오버라이드 가능(IaV2Toggle.tsx 참고) */
  IA_V2: readIaV2Override() ?? IA_V2_DEFAULT,
```
   - **해결 방안 (수정 코드)**: 기본값을 `true`로 유지할 것인지 `false`로 유지할 것인지 명확히 결정하고, 주석을 실제 동작과 일치시켜야 합니다. 만약 기본 활성화가 의도라면 주석을 "기본 활성화"로 수정하고, 비활성화가 의도라면 `IA_V2_DEFAULT = false`로 되돌려야 합니다.
```typescript
const IA_V2_DEFAULT = true; // ← 의도 확인 필요. 주석과 불일치

export const FEATURES = {
  /** v2 정보구조(GNB + scope LNB). 기본 활성화. 개발/스테이징에서는 IaV2Toggle로 localStorage 오버라이드 가능(IaV2Toggle.tsx 참고) */
  IA_V2: readIaV2Override() ?? IA_V2_DEFAULT,
```

### frontend/src/shared/config/env.ts

**변경 내용:**
`IS_DEV_MODE` 플래그를 추가하여 `--mode development` 빌드에서도 개발 모드로 판별되도록 했습니다.

**개선 제안:**

1. 명시적 모드 목록 사용
   - **위치 (라인 번호)**: 18
   - **기존 코드**:
```typescript
IS_DEV_MODE: import.meta.env.MODE !== 'production',
```
   - **해결 방안 (수정 코드)**: production이 아닌 모든 모드가 아닌, 명시적으로 개발/스테이징 모드만 허용하는 방식이 더 안전합니다.
```typescript
IS_DEV_MODE: ['development', 'staging'].includes(import.meta.env.MODE),
```
   - 단, 이는 프로젝트의 실제 배포 모드 명명 규칙에 따라 조정이 필요하므로, 현재 사용 중인 모드 목록을 먼저 확인해야 합니다.

### frontend/src/shared/ui/IaV2Toggle.tsx

**변경 내용:**
IA_V2 온오프 토글 컴포넌트를 신규 추가했습니다.

**개선 제안:**

1. 클릭 직후 피드백 부족
   - **위치 (라인 번호)**: 44-47 (`handleToggle`)
   - **기존 코드**:
```typescript
const handleToggle = () => {
  window.localStorage.setItem(IA_V2_OVERRIDE_KEY, String(!isOn));
  window.location.reload();
};
```
   - **해결 방안 (수정 코드)**: 새로고침 전에 사용자에게 반영 예정임을 알리는 상태를 추가할 수 있습니다. 다만 이는 UX 개선 제안으로, 필수는 아닙니다.
```typescript
const [pending, setPending] = useState(false);
const handleToggle = () => {
  setPending(true);
  window.localStorage.setItem(IA_V2_OVERRIDE_KEY, String(!isOn));
  window.location.reload();
};
```

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**
전반적으로 개발 편의를 위한 실용적이고 잘 구조화된 변경입니다. 다만 `IA_V2` 기본값이 `false`에서 `true`로 변경된 점은 주석과 불일치하므로, 이 커밋의 의도(기본 활성화 여부)를 명확히 확인하고 주석을 정리하는 것을 권장합니다. `IS_DEV_MODE` 판단 방식도 배포 모드 명명 규칙에 맞게 검토가 필요합니다. 이 두 가지만 정리되면 승인 가능한 수준입니다.