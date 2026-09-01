# 코드 리뷰 - 5fd3faf2

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`constants.ts`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.000

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 수업(lesson) 기능에서 사용하는 CMS 브랜드 ID를 21에서 18로 변경한 설정값 수정입니다. `CMS_BRAND_ID`는 meta-dashboard가 CMS 및 EveryCanvas embed에 전달하는 브랜드 식별자로, 자료실 세트 목록(`GET /api/sets`)과 createEmbed 기본값이 동일해야 한다는 제약이 주석에 명시되어 있습니다. 브랜드 ID가 18로 변경된 것은 CMS 측 브랜드 식별 체계 변경 또는 신규 브랜드 적용에 따른 것으로 판단됩니다.

- **목적**: 수업 기능에서 사용하는 CMS 브랜드 ID를 21에서 18로 갱신
- **도메인**: 비즈니스 로직 (CMS 연동 설정값)
- **변경 방향**: 외부 CMS 시스템의 브랜드 식별자 변경에 맞춘 상수 값 갱신

---

## [GOOD] 잘된 점

1. **단일 책임 원칙 준수**: 브랜드 ID를 상수로 분리하여 중앙 관리하고 있어, 값 변경 시 한 곳만 수정하면 되는 구조가 잘 갖춰져 있습니다.
2. **의도가 명확한 주석**: 상수 선언부에 "자료실 세트 목록과 createEmbed 기본값이 같아야 한다"는 제약 조건이 문서화되어 있어, 향후 유지보수 시 변경 영향 범위를 파악하기 쉽습니다.
3. **변경 범위 최소화**: 불필요한 리팩토링 없이 상수 값 하나만 변경하여 변경 리스크를 최소화했습니다.

---

## 변경사항 요약

`frontend/src/features/lesson/model/constants.ts` 파일에서 `CMS_BRAND_ID` 상수 값을 `21`에서 `18`로 변경한 단일 라인 수정입니다. 이 상수는 `useEveryCanvasEmbed.ts`에서 EveryCanvas embed 생성 시 기본 brandId로 사용됩니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

1. **하드코딩된 brandId와 상수 간 불일치 가능성**
   - **위치**: `frontend/src/features/lesson/api/queries.ts` (라인 48, 61-62)
   - **기존 코드**:
     ```typescript
     // import { CMS_BRAND_ID } from '../model/constants';
     ...
     brandId: 18,
     // brandId: CMS_BRAND_ID,
     ```
   - **문제**: `queries.ts`에서 `brandId: 18`이 하드코딩되어 있고, `CMS_BRAND_ID` import는 주석 처리되어 있습니다. 현재는 값이 우연히 일치하지만(둘 다 18), 향후 한쪽만 변경되면 자료실 세트 목록 조회와 embed 생성 간 브랜드 불일치가 발생할 수 있습니다.
   - **해결 방안 (수정 코드)**:
     ```typescript
     import { CMS_BRAND_ID } from '../model/constants';
     ...
     brandId: CMS_BRAND_ID,
     ```
   - **근거**: 주석에 명시된 "자료실 세트 목록(`GET /api/sets`)과 createEmbed 기본값이 같아야 한다"는 제약을 코드 레벨에서 강제하기 위해서는 단일 소스(상수)를 참조하는 것이 안전합니다. `queries.ts`의 실제 사용부를 확인한 결과, `brandId: 18` 하드코딩이 존재하며 이는 상수 변경 시 함께 수정되어야 하는 잠재적 위험입니다.

2. **브랜드 ID 변경의 영향 범위 문서화 부재**
   - 브랜드 ID 변경은 단순 상수 수정이지만, 실제로는 CMS 연동, 자료실 세트 조회, EveryCanvas embed 생성 등 여러 기능에 영향을 미칩니다. 커밋 메시지에 변경 사유(예: "브랜드 18로 전환")를 더 구체적으로 명시하면 추적성이 향상될 것입니다.

---

## 주요 파일 분석

### frontend/src/features/lesson/model/constants.ts

**변경 내용:**
`CMS_BRAND_ID` 상수 값을 21에서 18로 변경 (1라인 수정)

**개선 제안:**
1. `queries.ts`의 하드코딩된 `brandId: 18`을 `CMS_BRAND_ID` 상수로 대체하여 단일 소스 유지
   - **위치**: `frontend/src/features/lesson/api/queries.ts` 라인 61
   - **기존 코드**:
     ```typescript
     brandId: 18,
     ```
   - **해결 방안 (수정 코드)**:
     ```typescript
     brandId: CMS_BRAND_ID,
     ```
   - **부작용 확인**: `queries.ts` 라인 48의 주석 처리된 import를 활성화하고, 라인 62의 주석 처리된 `// brandId: CMS_BRAND_ID`를 삭제하면 됩니다. 현재 두 값이 모두 18로 동일하므로 런타임 동작 변화는 없습니다.

---

## 최종 평가

**결론**:
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**
단순한 설정값 변경으로, 명백한 오류나 위험 요소가 없어 승인 가능합니다. 다만 `queries.ts`에 하드코딩된 `brandId: 18`이 존재하므로, 향후 브랜드 ID가 다시 변경될 때를 대비해 상수 참조로 통일하는 리팩토링을 권장합니다. 이번 커밋 자체는 목적에 부합하며 안전한 변경입니다.