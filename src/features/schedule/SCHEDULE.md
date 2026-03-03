# 상담일정 기능 구현 가이드

> 교사가 학생 상담을 계획하고 관리하며, 완료된 상담을 기록하는 기능

**경로**: `/schedule`

---

## 컴포넌트 구조

```
src/features/schedule/
├── pages/
│   └── SchedulePage.tsx             # 메인 페이지 (주간/월간 캘린더)
├── components/
│   ├── WeeklyCalendar.tsx           # 주간 캘린더 뷰
│   ├── MonthlyCalendar.tsx          # 월간 캘린더 뷰
│   ├── ScheduleModal.tsx            # 일정 추가/수정/완료 모달
│   ├── DateDetailPanel.tsx          # 날짜 상세 패널 (월간 뷰)
│   ├── ClassSummaryCards.tsx        # 학급별 요약 카드
│   ├── ScheduleStudentPicker.tsx    # 학생 선택 컴포넌트
│   ├── CalendarIntegrationModal.tsx # 캘린더 연동 (TODO)
│   └── index.ts
└── index.ts
```

---

## 핵심 타입

```typescript
// 상담 상태
type CounselingStatus = 'scheduled' | 'completed' | 'cancelled';

// 상담 유형
type ScheduleType = 'regular' | 'urgent' | 'follow-up' | 'initial';

// 상담 영역
type CounselingArea = 'academic' | 'career' | 'peer' | 'family' | 'emotion' | 'behavior' | 'health' | 'other';

// 상담 방법
type CounselingMethod = 'face-to-face' | 'phone' | 'video' | 'group';

// 상담 학생
interface CounselingStudent {
  id: string;
  name: string;
  number: number;
  classId: string;
}

// 통합 상담 기록
interface UnifiedCounselingRecord {
  id: string;
  students: CounselingStudent[];     // 1명 이상 지원
  classId: string;
  scheduledAt: string;               // 'YYYY-MM-DD HH:mm'
  duration?: number;                 // 상담 시간 (분)
  types: ScheduleType[];             // 복수 선택 가능
  areas: CounselingArea[];           // 복수 선택 가능
  methods: CounselingMethod[];       // 복수 선택 가능
  status: CounselingStatus;
  reason?: string;                   // 예정 시 메모
  summary?: string;                  // 완료 시 상담 기록
  nextSteps?: string;                // 후속 조치
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 라벨 상수

```typescript
// 상담유형 라벨
const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  regular: '정기상담',
  urgent: '긴급상담',
  'follow-up': '후속상담',
  initial: '초기상담',
};

// 상담영역 라벨
const COUNSELING_AREA_LABELS: Record<CounselingArea, string> = {
  academic: '학업',
  career: '진로',
  peer: '교우관계',
  family: '가정',
  emotion: '정서·심리',
  behavior: '행동',
  health: '건강',
  other: '기타',
};

// 상담방법 라벨
const COUNSELING_METHOD_LABELS: Record<CounselingMethod, string> = {
  'face-to-face': '대면상담',
  phone: '전화상담',
  video: '화상상담',
  group: '집단상담',
};
```

---

## 주요 기능

### 1. 주간/월간 캘린더 뷰

| 뷰 | 컴포넌트 | 특징 |
|----|----------|------|
| 주간 | `WeeklyCalendar` | 시간대별 일정 표시, 빈 슬롯 클릭 시 일정 추가 |
| 월간 | `MonthlyCalendar` | 날짜별 일정 요약, 날짜 클릭 시 상세 패널 |

**네비게이션**:
- 이전/다음 버튼: 주간(-7일/+7일), 월간(-1개월/+1개월)
- "오늘" 버튼: 현재 날짜로 이동

### 2. 반별 필터링

```typescript
// 학급 색상 코드
const CLASS_COLORS: Record<string, string> = {
  '2-3': '#3b82f6', // 파랑
  '2-5': '#8b5cf6', // 보라
  '3-1': '#10b981', // 초록
  '3-4': '#f59e0b', // 주황
};
```

- 전체 보기 또는 특정 반만 필터링
- 필터 선택 시 해당 반 색상으로 강조

### 3. 상담 일정 CRUD

**ScheduleModal 기능**:
- 학생 선택 (복수 가능)
- 날짜/시간 선택
- 상담 유형 복수 선택 (정기/긴급/후속/초기)
- 상담 영역 복수 선택 (8개 영역)
- 상담 방법 복수 선택 (대면/전화/화상/집단)
- 상담 내용/사유 입력

### 4. 상담 완료 처리

```typescript
// 수정 모드에서 "상담 완료" 버튼 클릭 시
const handleComplete = () => {
  onUpdate(editingSchedule.id, {
    status: 'completed',
    summary: summary.trim() || undefined,
  });
};
```

- 완료 시 상담 기록(summary) 작성 가능
- L3 학생 대시보드 상담 탭과 자동 동기화

---

## 통합 상담 서비스

`@/shared/services/unifiedCounselingService.ts`

```typescript
export const unifiedCounselingService = {
  // 전체 조회
  getAll: async (): Promise<UnifiedCounselingRecord[]>,

  // 학생별 조회 (L3 학생 대시보드용)
  getByStudentId: async (studentId: string): Promise<UnifiedCounselingRecord[]>,

  // 학급별 조회
  getByClassId: async (classId: string): Promise<UnifiedCounselingRecord[]>,

  // 상태별 조회
  getByStatus: async (status: CounselingStatus): Promise<UnifiedCounselingRecord[]>,

  // 생성
  create: async (input: CreateUnifiedCounselingInput): Promise<UnifiedCounselingRecord>,

  // 수정
  update: async (id: string, input: UpdateUnifiedCounselingInput): Promise<UnifiedCounselingRecord>,

  // 완료 처리
  complete: async (id: string, data: CompleteUnifiedCounselingInput): Promise<UnifiedCounselingRecord>,

  // 취소
  cancel: async (id: string): Promise<void>,

  // 삭제
  delete: async (id: string): Promise<void>,
};
```

**환경 변수**:
- `VITE_API_BASE_URL`: API 서버 주소

---

## 상태별 스타일

### 완료된 상담

```tsx
<button className="bg-gray-50 text-gray-500">
  <CheckCircle2 className="text-emerald-500" />
  {/* 학생명, 시간 등 */}
</button>
```

### 예정된 상담

```tsx
<button className="bg-white text-gray-900 hover:bg-gray-50">
  {isUrgent && <AlertCircle className="text-red-500" />}
  {/* 학생명, 시간 등 */}
</button>
```

### 긴급 표시

- `types.includes('urgent')` 시 빨간 아이콘 표시
- 예정된 상담에만 표시 (완료 시 제거)

---

## 페이지 레이아웃

```tsx
<div className="space-y-6">
  {/* 헤더 */}
  <div className="flex items-center justify-between">
    <div>
      <h1>상담일정</h1>
      <p>학생 상담 일정을 관리하고 캘린더에서 확인하세요</p>
    </div>
    <div className="flex items-center gap-3">
      <Button variant="secondary">캘린더 연동</Button>
      <Button>상담 일정 등록</Button>
    </div>
  </div>

  {/* 캘린더 컨트롤 */}
  <div className="flex items-center justify-between bg-white rounded-lg border p-4">
    {/* 좌측: 주간/월간 토글 */}
    {/* 중앙: 날짜 네비게이션 */}
    {/* 우측: 반별 필터 */}
  </div>

  {/* 캘린더 뷰 */}
  {viewMode === 'weekly' ? <WeeklyCalendar /> : <MonthlyCalendar />}

  {/* 학급별 요약 카드 */}
  <ClassSummaryCards />

  {/* 날짜 상세 패널 (월간 뷰, 날짜 선택 시) */}
  {viewMode === 'monthly' && selectedDate && <DateDetailPanel />}
</div>
```

---

## 모달 구조

### ScheduleModal

```tsx
<Modal title={isEditMode ? '상담 일정 상세' : '상담 일정 등록'} size="lg">
  {/* 학생 선택 */}
  <ScheduleStudentPicker />

  {/* 날짜/시간 */}
  <div className="grid grid-cols-2 gap-4">
    <input type="date" />
    <select>{/* TIME_OPTIONS */}</select>
  </div>

  {/* 상담 유형 (복수 선택) */}
  <MultiSelectButtonGroup items={SCHEDULE_TYPES} />

  {/* 상담 영역 (복수 선택) */}
  <MultiSelectButtonGroup items={COUNSELING_AREAS} />

  {/* 상담 방법 (복수 선택) */}
  <MultiSelectButtonGroup items={COUNSELING_METHODS} />

  {/* 상담 내용/사유 */}
  <textarea placeholder="상담 내용이나 사유를 입력하세요" />

  {/* 상담 기록 (수정 모드만) */}
  {isEditMode && <textarea placeholder="상담 후 기록을 작성하세요" />}

  {/* 하단 버튼 */}
  <div className="flex gap-3">
    {isEditMode && <Button variant="secondary">삭제</Button>}
    <Button variant="secondary">취소</Button>
    {isEditMode && !isCompleted && <Button>상담 완료</Button>}
    <Button>{isEditMode ? '수정하기' : '등록하기'}</Button>
  </div>
</Modal>
```

---

## 연동 포인트

### L3 학생 대시보드 상담 탭

- 동일한 `unifiedCounselingService` 사용
- `getByStudentId(studentId)`로 해당 학생 상담 기록 조회
- 상담 일정 페이지에서 수정/완료 시 자동 반영

### AI Room 컨텍스트

- `contextBuilder.ts`에서 상담 기록 RAG 컨텍스트에 포함
- 최근 5건 상담 기록 (상태, 유형, 영역, 방법, 요약)

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `@/shared/types/index.ts` | 상담 관련 타입 정의 |
| `@/shared/services/unifiedCounselingService.ts` | 통합 상담 서비스 |
| `@/shared/data/mockUnifiedCounseling.ts` | Mock 데이터 |
| `@/shared/data/counselingConstants.ts` | 상수 (TIME_OPTIONS, SCHEDULE_TYPES 등) |
| `@/shared/components/MultiSelectButtonGroup.tsx` | 복수 선택 버튼 그룹 |

---

**Last Updated**: 2026-03-03
