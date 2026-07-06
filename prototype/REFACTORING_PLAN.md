# Prototype 폴더 리팩토링 계획

## 현황 요약

| 항목 | 수치 |
|------|------|
| 전체 TSX 파일 | 173개 |
| Feature 폴더 | 20개 |
| 미사용 레거시 파일 | 31개 (~130KB) |
| 중복 정의 파일 | 5개 |

---

## 우선순위별 작업 목록

### P0: 즉시 제거 (영향도 없음)

**1. assessment 폴더 전체 삭제**
- 경로: `src/features/assessment/`
- 파일 수: 13개
- 이유: routes.tsx에서 assessment-v2만 사용 중
- 영향: 없음

**2. class-dashboard 폴더 전체 삭제**
- 경로: `src/features/class-dashboard/`
- 파일 수: 18개
- 이유: routes.tsx에서 class-dashboard-v2만 사용 중
- 영향: 없음

---

### P1: 중복 코드 통합 (코드 품질 개선)

**1. LPA 상수 중복 제거**

현재 TYPE_COLORS가 3곳에 정의됨:
- `shared/data/lpaProfiles.ts` (6개 유형)
- `class-dashboard-v2/utils/typeUtils.ts` (6개 유형 + '미실시')

작업:
- [ ] `shared/data/lpaProfiles.ts`에 '미실시' 색상 추가
- [ ] `class-dashboard-v2/utils/typeUtils.ts`에서 TYPE_COLORS import로 변경

**2. LPA 유형 설명 중복 제거**

현재 LPA_TYPE_DESCRIPTIONS가 3곳에 정의됨:
- `teacher-dashboard/components/LPAComparisonSection.tsx`
- `class-dashboard-v2/components/tabs/CoreSummaryTab.tsx`
- `student-dashboard/pages/StudentDashboardPage.tsx`

작업:
- [ ] `shared/data/lpaProfiles.ts`에 LPA_TYPE_DESCRIPTIONS 추가
- [ ] 3개 파일에서 import로 변경

**3. LPA 툴팁 메시지 중복 제거**

현재 LPA_TOOLTIP_LINES가 3곳에 정의됨 (위와 동일 파일)

작업:
- [ ] `shared/data/lpaProfiles.ts`에 LPA_TOOLTIP_LINES 추가
- [ ] 3개 파일에서 import로 변경

---

### P2: 타입 시스템 정리

**1. SchoolLevel 타입 통일**

현재 상태:
- `shared/types/index.ts`: `type SchoolLevel = '초등' | '중등'`
- `student-exam/pre-exam-flow/types.ts`: `type SchoolLevel = 'elementary' | 'middle' | 'high'`

작업:
- [ ] `student-exam/pre-exam-flow/types.ts`의 SchoolLevel을 SchoolLevelCode로 이름 변경
- [ ] 또는 shared에서 import하여 사용

**2. Props 타입 정리**

현재 상태: 각 컴포넌트에서 로컬로 Props 정의

작업:
- [ ] `student-dashboard/components/types.ts` 생성
- [ ] 공통 Props 타입 이동 (선택적)

---

### P3: 데이터/상수 정리

**1. 요인 정의 통합**

현재 상태:
- `factors.ts`: FACTOR_DEFINITIONS (배열)
- `factorDefinitions.ts`: FACTOR_DEFINITIONS_MAP (객체)

작업:
- [ ] 두 파일 통합하여 단일 source of truth 생성
- [ ] 필요한 형식으로 export 함수 제공

**2. 색상 상수 문서화**

현재 분산된 색상 정의:
- `lpaProfiles.ts`: DOMAIN_COLORS, CATEGORY_COLORS, TYPE_COLORS
- `selfregFactors.ts`: SELFREG_DOMAIN_COLORS
- `shared/types/index.ts`: CLASS_COLORS

작업:
- [ ] 색상 상수 위치 문서화 (현재 위치 유지)
- [ ] 또는 `shared/data/colors.ts`로 통합

---

### P4: 코드 품질 개선 (선택적)

**1. AI 프롬프트 모듈화**

현재 상태: `aiPrompts.ts` 1863줄 단일 파일

작업:
- [ ] 기능별 분리 (analysis, record, assistant, classAnalysis, dataHelper)

**2. 대형 컴포넌트 분해**

대상:
- `CoachingStrategyModal.tsx` (283줄)
- `FactorHeatmapSection.tsx` (322줄)

작업:
- [ ] 서브 컴포넌트로 분해

---

## 작업 순서 권장

```
Phase 1: 레거시 제거 (P0)
├── assessment 폴더 삭제
└── class-dashboard 폴더 삭제

Phase 2: 중복 통합 (P1)
├── TYPE_COLORS 통합
├── LPA_TYPE_DESCRIPTIONS 통합
└── LPA_TOOLTIP_LINES 통합

Phase 3: 타입 정리 (P2)
├── SchoolLevel 통일
└── Props 타입 정리 (선택)

Phase 4: 추가 개선 (P3-P4)
├── 요인 정의 통합
├── 색상 상수 정리
└── 코드 품질 개선
```

---

## 예상 효과

| 항목 | Before | After |
|------|--------|-------|
| 파일 수 | 173개 | ~142개 (-31) |
| 중복 상수 | 9개 | 3개 |
| 레거시 코드 | ~130KB | 0KB |
| 타입 불일치 | 있음 | 해결 |

---

## 주의사항

1. **테스트 필수**: 각 Phase 완료 후 개발 서버에서 기능 테스트
2. **커밋 분리**: Phase별로 별도 커밋
3. **백업**: 삭제 전 git stash 또는 브랜치 백업 권장
