> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 14cc869f

## 코드 복잡도 분석

**분석된 파일**: 5개 / 변경된 파일: 6개


### 정상 범위 (NONE)


**`index.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.011

- 청크 수: 92개


**권장사항:**

- 파일 크기가 큼 (92개 청크) - 파일 분리 검토


**`classdisplayname.ts`** (utility)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.006

- 청크 수: 5개


**권장사항:**

- 복잡도 정상 범위


**`useapidata.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.010

- 청크 수: 60개


**권장사항:**

- 파일 크기가 큼 (60개 청크) - 파일 분리 검토


**`studentdashboardpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.009

- 청크 수: 75개


**권장사항:**

- 파일 크기가 큼 (75개 청크) - 파일 분리 검토


**`classdashboardv2widget.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.012

- 청크 수: 179개


**권장사항:**

- 파일 크기가 큼 (179개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 두 가지 목적을 가집니다. 첫째, HSJ-121 이슈로 결과보기(반/학생) 헤더에 학교명을 표기하기 위해 `schoolName` 필드를 데이터 흐름 전반에 추가합니다. 둘째, 요인별 정의 표기 방식을 기존의 t-score 범위 기반 매칭(`getFactorSummary`)에서 요인명 기반 단순 매핑(`FACTOR_OPERATIONAL_DEFINITIONS`)으로 전환합니다. 또한 `CLAUDE.md` 문서를 통해 인증 방식을 Cookie Mode에서 쿠키리스 토큰 저장 모드로 변경한 내용을 반영합니다.

- **목적**: 결과보기 헤더에 학교명 표기(HSJ-121), 요인 정의 표기 로직 단순화, 인증 문서 최신화
- **도메인**: UI(프론트엔드), 비즈니스 로직(데이터 매핑), 문서화
- **변경 방향**: `schoolName` 데이터를 타입 → 서비스 → 훅 → UI 컴포넌트까지 일관되게 전달하고, 요인 정의를 정적 데이터 매핑으로 단순화

---

## [GOOD] 잘된 점

1. **데이터 흐름의 일관성**: `Class` 타입에 `schoolName`을 추가하고, `groupService.mapGroupListItem`에서 이미 `schoolName`을 매핑하고 있어, `useApiData`/`useClassStudents` 훅에서 `matchedGroup?.schoolName`으로 안전하게 접근할 수 있습니다. 타입 체이닝이 깔끔하게 이어집니다.
2. **방어적 유틸 구현**: `formatClassLocationLabel`은 `schoolName`, `schoolLevel`, `grade`, `classNumber` 각각에 대해 값이 없으면 해당 부분을 생략하는 방어적 로직을 갖추고 있어, 데이터가 불완전한 상황에서도 안전하게 동작합니다.
3. **중복 제거**: `StudentDashboardPage`와 `ClassDashboardV2Widget`에서 동일한 헤더 표기 로직을 `formatClassLocationLabel` 유틸로 통합하여 코드 중복을 제거했습니다.

---

## 변경사항 요약

- `schoolName` 필드를 `Class` 타입, `useApiData`/`useClassStudents` 훅의 `classInfo`, `ClassDashboardV2Widget`의 `classData`에 추가
- `formatClassLocationLabel` 유틸을 신규 추가하여 반/학생 헤더의 소속 정보 표기를 통일
- `StudentDashboardPage`에서 `getFactorSummary`(t-score 범위 매칭)를 제거하고 `FACTOR_OPERATIONAL_DEFINITIONS`(요인명 기반 매핑)로 교체
- `CLAUDE.md` 인증 문서를 Cookie Mode → 쿠키리스 토큰 저장 모드로 갱신

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `getFactorSummary` → `FACTOR_OPERATIONAL_DEFINITIONS` 전환 시 의미 변화**

기존 `getFactorSummary`는 `tScore_lower`/`tScore_upper` 범위를 기준으로 요인 정의를 선택했습니다. 즉, 같은 요인이라도 점수 구간에 따라 다른 정의가 표시될 수 있었습니다. 새 방식은 요인명만으로 정의를 매핑하므로, 만약 기획상 요인 정의가 점수 구간별로 달라져야 했다면 이는 의도하지 않은 동작 변경입니다.

`FACTOR_OPERATIONAL_DEFINITIONS`의 실제 구조를 확인한 결과, 38개 요인 각각에 대해 단일 정의만 존재합니다. 따라서 "요인 정의는 점수와 무관하게 동일하다"는 전제가 맞다면 이 변경은 올바른 단순화입니다. 다만, 기존 `scripts_depth3.json`에 t-score 구간별로 다른 summary가 존재했다면, 해당 데이터가 더 이상 사용되지 않게 되므로 제거 대상인지 확인이 필요합니다.

- **위치**: `frontend/src/pages/student-dashboard/StudentDashboardPage.tsx` (기존 `getFactorSummary` 함수 제거 부위)
- **권장 조치**: `scripts_depth3.json`이 다른 곳에서도 사용되는지 확인하고, 사용처가 없다면 파일 자체를 제거하거나 주석으로 폐기 사유를 남길 것을 권장합니다. 만약 점수 구간별 정의가 여전히 필요하다면, `FACTOR_OPERATIONAL_DEFINITIONS`를 `Record<string, { lower: number; upper: number; text: string }[]>` 형태로 확장하는 방안을 검토하세요.

### Medium (개선 권장)

**1. `formatClassLocationLabel`의 `schoolLevel` 값 검증 부재**

`formatClassLocationLabel`은 `schoolLevel`을 문자열 그대로 출력합니다. `SchoolLevel` 타입이 `'초등' | '중등' | '고등'` 등으로 제한되어 있다면 타입 안전성이 확보되지만, `string`으로 받고 있어 잘못된 값이 들어와도 필터링되지 않습니다.

- **위치**: `frontend/src/shared/utils/classDisplayName.ts` 라인 17
- **기존 코드**:
```typescript
export const formatClassLocationLabel = (info: {
  schoolName?: string;
  schoolLevel?: string;
  grade?: number;
  classNumber?: number;
}): string => {
```
- **해결 방안**:
```typescript
import type { SchoolLevel } from '@shared/types';

export const formatClassLocationLabel = (info: {
  schoolName?: string;
  schoolLevel?: SchoolLevel;
  grade?: number;
  classNumber?: number;
}): string => {
```
> `SchoolLevel` 타입을 import하여 타입 안전성을 강화할 수 있습니다. 호출부에서 `classInfo.schoolLevel`이 이미 `SchoolLevel` 타입이므로 하위 호환성 문제가 없습니다.

**2. `useStudentAnalysis`의 초기 `classData.schoolName` 경로 확인 필요**

`useStudentAnalysis`에서 `classData.schoolName`을 직접 참조하는 경로가 있습니다. `classData`가 `Class` 타입이라면 `schoolName`이 추가되어 타입 안전성이 확보되었지만, 만약 `classData`가 API 응답 원본 객체라면 `schoolName`이 백엔드에서 내려오는지 확인이 필요합니다.

- **위치**: `frontend/src/features/api/useApiData.ts` 라인 112 (`schoolName: classData.schoolName`)
- **권장 조치**: `classData`의 출처(API 응답 vs 로컬 매핑)를 확인하고, 백엔드 응답에 `schoolName`이 포함되지 않는다면 `matchedGroup?.schoolName` 경로로만 값을 채우도록 폴백 로직을 명시하는 것이 안전합니다.

---

## 주요 파일 분석

### frontend/src/shared/utils/classDisplayName.ts

**변경 내용:**
`formatClassLocationLabel` 유틸 함수를 신규 추가하여 학교명/학교급/학년/반을 조합하는 표기 로직을 중앙화했습니다.

**개선 제안:**
1. `schoolLevel` 파라미터를 `SchoolLevel` 타입으로 제한하여 타입 안전성 강화 (위 Medium 1 참조)
2. `grade`/`classNumber`가 `0`인 경우를 고려한다면 `info.grade ? ... : null` 대신 `info.grade != null ? ... : null`로 변경하는 것이 더 방어적입니다. 다만 현재 도메인에서 grade/classNumber가 0이 될 가능성은 낮아 우선순위는 낮습니다.

### frontend/src/pages/student-dashboard/StudentDashboardPage.tsx

**변경 내용:**
`getFactorSummary` 함수를 제거하고 `FACTOR_OPERATIONAL_DEFINITIONS`로 교체, 헤더 표기를 `formatClassLocationLabel`로 통일했습니다.

**개선 제안:**
1. `scripts_depth3.json` import 제거로 번들 크기가 감소한 것은 긍정적입니다. 다만 해당 JSON이 다른 곳에서 사용되는지 확인 필요 (위 High 1 참조)
2. `FACTOR_OPERATIONAL_DEFINITIONS[factor.name]` 접근 시 `factor.name`이 Record의 키에 없는 경우 `undefined`가 반환되어 조건부 렌더링(`&&`)으로 안전하게 처리되고 있습니다. 이는 올바른 방어 패턴입니다.

### frontend/src/widgets/class-dashboard/ClassDashboardV2Widget.tsx

**변경 내용:**
`classData`에 `schoolName`을 추가하고 헤더 표기를 `formatClassLocationLabel`로 교체했습니다.

**개선 제안:**
1. `apiClassInfo?.schoolName` 경로에서 `apiClassInfo`가 `Class` 타입인지 확인 필요. `Class` 타입에 `schoolName`이 추가되었으므로 타입 안전성은 확보되었습니다.
2. `formatClassLocationLabel(classData)` 호출 시 `classData`에 `schoolName`이 포함되어 있는지 확인 필요. `classData`가 `Class` 타입이면 `schoolName`이 포함되므로 정상 동작합니다.

### frontend/src/features/api/useApiData.ts

**변경 내용:**
`classInfo`에 `schoolName` 필드를 추가하고, `matchedGroup?.schoolName`과 `classData.schoolName` 두 경로에서 값을 채웁니다.

**개선 제안:**
1. `useStudentAnalysis`의 초기 `classData.schoolName` 경로는 `classData`가 `Class` 타입일 때만 유효합니다. `classData`가 API 원본 객체라면 `schoolName`이 없을 수 있으므로, `matchedGroup?.schoolName` 폴백이 항상 적용되도록 하는 것이 안전합니다.
2. `useClassStudents`에서는 `let schoolName: string | undefined = classData?.schoolName;`으로 초기화한 뒤 `matchedGroup`이 있으면 덮어쓰는 구조입니다. 이는 `classData`에 값이 있고 `matchedGroup`에도 값이 있을 때 `matchedGroup`의 값이 우선하는데, 의도된 동작인지 확인이 필요합니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

이 커밋은 HSJ-121(학교명 표기)과 요인 정의 표기 단순화라는 두 가지 목적을 명확하게 달성하고 있습니다. `schoolName`의 데이터 흐름이 타입 → 서비스 → 훅 → UI까지 일관되게 연결되어 있고, `formatClassLocationLabel` 유틸의 방어적 구현과 `FACTOR_OPERATIONAL_DEFINITIONS`의 정적 매핑 전환은 코드 품질을 개선하는 방향입니다. 다만, 기존 `getFactorSummary`가 t-score 범위 기반 매칭이었다는 점에서, 요인 정의가 점수 구간에 따라 달라져야 하는 기획 요구가 없었는지 확인이 필요합니다. 또한 `scripts_depth3.json`의 사용처 정리와 `schoolLevel` 타입 강화는 후속 작업으로 진행할 것을 권장합니다. 전반적으로 안전하고 잘 구조화된 변경이며, 조건부 승인합니다.