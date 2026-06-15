# [FEATURE] 고등학교 LPA 유형 숨김 처리 구현

## 📋 개요

고등학교는 LPA(학습잠재력지수) 유형 분류가 없으므로, 학교급에 따라 LPA 관련 UI를 자동으로 숨기도록 구현했습니다.

## 🎯 정책

### 학교급별 LPA 표시 규칙

| 검사 유형 | 초등 | 중등 | 고등 |
|:---:|:---:|:---:|:---:|
| **학습종합검사** | LPA 유형 3개 ✅ | LPA 유형 3개 ✅ | **LPA 없음 ❌** |
| **자기조절검사** | LPA 없음 | LPA 없음 | LPA 없음 |

- **초등**: 자원소진형 / 안전 균형형 / 몰입자원 풍부형
- **중등**: 냉소적 무기력형 / 정서조절 취약형 / 자기주도 몰입형
- **고등**: 영역별 강점/약점만 표시 (유형 분류 없음)

## 📝 수정된 파일 목록

### 1. `prototype/src/features/student-dashboard/pages/StudentDashboardPage.tsx`
**변경 내용:**
- 학습 유형 분류 섹션에 고등학교 필터링 조건 추가
- 유형별 특이점 섹션에 고등학교 필터링 조건 추가

```typescript
// 기존
{testId === 'comprehensive' && (
  <div>학습 유형 분류...</div>
)}

// 변경 후
{testId === 'comprehensive' && student.schoolLevel !== '고등' && (
  <div>학습 유형 분류...</div>
)}
```

**영향받는 UI:**
- 학습 유형 분류 섹션: LPA 도넛 차트 및 유형 설명 전체 숨김
- 유형별 특이점 섹션: 같은 유형 학생들과의 비교 분석 숨김
- 추천 코칭 전략 섹션: LPA 유형 기반 전략이므로 전체 숨김

---

### 2. `prototype/src/features/class-dashboard-v2/pages/ClassDashboardPage.tsx`
**변경 내용:**
- 학교급에 따라 `hasLPA`를 동적으로 계산하도록 수정
- 검사 유형이 `comprehensive`이고 학교급이 `'고등'`이면 `hasLPA: false` 처리

```typescript
// 기존
const testMeta = TEST_META[testId];

// 변경 후
const testMeta = useMemo(() => {
  const baseMeta = TEST_META[testId];
  if (testId === 'comprehensive' && classData?.schoolLevel === '고등') {
    return { ...baseMeta, hasLPA: false };
  }
  return baseMeta;
}, [testId, classData?.schoolLevel]);
```

**영향받는 UI:**
- KPI 카드 2번째: "우세 유형" → "대표 강점"으로 전환
- CoreSummaryTab: 유형 분포 도넛 차트 숨김
- StudentListTab: LPA 유형 배지 → 강점/관심 요인 태그로 전환

---

### 2. `prototype/src/features/teacher-dashboard/pages/TeacherDashboardPage.tsx`
**변경 내용:**
- LPA 비교 섹션에 고등학교 필터링 조건 추가

```typescript
// 기존
{testMeta.hasLPA && (
  <LPAComparisonSection ... />
)}

// 변경 후
{testMeta.hasLPA && !classes.some(c => c.schoolLevel === '고등') && (
  <LPAComparisonSection ... />
)}
```

**영향받는 UI:**
- 담당 학급 중 하나라도 고등학교가 있으면 LPA 비교 섹션 전체 숨김

---

### 3. `prototype/src/features/teacher-dashboard/components/OverviewSummaryPanel.tsx`
**변경 내용:**
- 우측 패널 유형 분포 계산 시 학교급 조건 추가

```typescript
// 기존
const hasLPA = testId === 'comprehensive' && typeDistribution;

// 변경 후
const hasLPA = testId === 'comprehensive' && typeDistribution && selectedClass.schoolLevel !== '고등';
```

**영향받는 UI:**
- 반 클릭 시 우측에 나오는 유형 분포 바 차트 및 리스트 숨김

---

### 4. `prototype/src/features/teacher-dashboard/components/LPAComparisonSection.tsx`
**변경 내용:**
- 컴포넌트 진입 시 고등학교 체크하여 조기 반환

```typescript
// 기존
if (classes.length === 0) return null;
// TODO 주석만 있었음

// 변경 후
if (classes.length === 0) return null;
if (classes.some(c => c.schoolLevel === '고등')) return null;
```

**영향받는 UI:**
- LPA 비교 섹션 자체가 렌더링되지 않음

---

## 🎨 UI 변화 예시

### 학생 대시보드 (StudentDashboardPage)

#### 초등/중등
```
[AI 총평]
...

[38개 요인 분석]
...

[학습 유형 분류] ✅
- LPA 도넛 차트
- 유형 설명 및 특성

[유형별 특이점] ✅
- 같은 유형 학생들과 비교

[추천 코칭 전략] ✅
- LPA 유형 기반 맞춤 전략
```

#### 고등
```
[AI 총평]
...

[38개 요인 분석]
...

[학습 유형 분류] ❌ (전체 섹션 숨김)

[유형별 특이점] ❌ (전체 섹션 숨김)

[추천 코칭 전략] ❌ (전체 섹션 숨김)
```

### 학급 대시보드 (ClassDashboardPage)

#### 초등/중등
```
┌─────────────────┬─────────────────┐
│ 학급 평균 T점수  │ 우세 유형        │
│ 52              │ 몰입자원 풍부형  │ ← LPA 유형 표시
└─────────────────┴─────────────────┘

[핵심 요약 탭]
- 유형 분포 도넛 차트 ✅

[학생 목록 탭]
- 1차: [몰입자원 풍부형] ✅
- 2차: [안전 균형형] ✅
```

#### 고등
```
┌─────────────────┬─────────────────┐
│ 학급 평균 T점수  │ 대표 강점        │
│ 52              │ 자아강점         │ ← 영역명 표시
└─────────────────┴─────────────────┘

[핵심 요약 탭]
- 유형 분포 도넛 차트 ❌ (숨김)

[학생 목록 탭]
- 강점: [자아존중감] [성장마인드셋] ✅
- 관심: [학습부담] [학습회피] ✅
```

### 전체 반 대시보드 (TeacherDashboardPage)

#### 우측 패널 (OverviewSummaryPanel)

**초등/중등:**
```
┌─ 3학년 1반 분석 요약 ──────┐
│ 평균 T점수: 52            │
│ 관심 필요: 3명            │
│                          │
│ [유형 분포]               │
│ ████████████████         │ ← 유형 분포 바 차트
│ • 자원소진형: 5명         │
│ • 안전 균형형: 12명       │
│ • 몰입자원 풍부형: 8명    │
└──────────────────────────┘
```

**고등:**
```
┌─ 1학년 1반 분석 요약 ──────┐
│ 평균 T점수: 52            │
│ 관심 필요: 3명            │
│                          │
│ [관심 영역]               │
│ • 학습걸림돌              │ ← 유형 분포 대신
│ • 부정적공부마음          │    관심 영역만 표시
└──────────────────────────┘
```

#### LPA 비교 섹션

**초등/중등만:**
- LPA 비교 섹션 표시 ✅

**고등 포함:**
- LPA 비교 섹션 전체 숨김 ❌

---

## ✅ 테스트 체크리스트

### 학급 대시보드
- [ ] 초등 학습종합검사: LPA 유형 3개 표시
- [ ] 중등 학습종합검사: LPA 유형 3개 표시
- [ ] 고등 학습종합검사: 강점/관심 요인 표시, 유형 분포 차트 숨김
- [ ] 자기조절검사 (모든 학교급): 강점/관심 요인 표시

### 전체 반 대시보드
- [ ] 초등/중등만 있을 때: LPA 비교 섹션 표시
- [ ] 고등 포함 시: LPA 비교 섹션 숨김
- [ ] 반 클릭 시 우측 패널: 고등은 유형 분포 숨김

### 데이터 케이스
- [ ] 1차만 있는 경우
- [ ] 2차만 있는 경우
- [ ] 1차, 2차 모두 있는 경우
- [ ] 신뢰도 주의 학생 포함된 경우

---

## 🔍 참고 사항

### 타입 정의
현재 `SchoolLevel` 타입은 `'초등' | '중등' | '고등'`으로 정의되어 있습니다.

```typescript
// prototype/src/shared/types/index.ts
export type SchoolLevelKr = '초등' | '중등' | '고등';
```

### 기존 데이터 호환성
기존 목 데이터는 대부분 초등/중등이므로, 고등 데이터는 실제 API 연동 시점에 테스트 필요합니다.

### HSJ_Dashboard 참고
이번 구현은 `prototype/HSJ_Dashboard/handoff/` 폴더의 디자인 핸드오프를 참고했습니다.
- `data.js`: `hasLPAType: true` 플래그 사용
- `page-comp-class.jsx`: `lpaOn` props로 조건부 렌더링
- `SPEC.md`: LPA ON/OFF 정책 명시

---

## 📌 추가 작업 필요 시

만약 추가로 LPA 표시/숨김이 필요한 컴포넌트가 있다면:

1. `hasLPA` props를 받거나 계산
2. 조건부 렌더링 적용: `{hasLPA && <LPA관련UI />}`
3. LPA 없을 때 대체 UI 제공: `{!hasLPA && <강점약점UI />}`

---

**작성일**: 2026-06-12
**작성자**: Backend Team
**참고 문서**: `prototype/HSJ_Dashboard/handoff/SPEC.md`
