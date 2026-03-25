# AI Room 구현 가이드

> AI 어시스턴트 기능 - 교사가 학생 검사 결과를 AI와 대화하며 분석

**경로**: `/ai-room`

---

## 컴포넌트 구조

```
src/features/ai-room/
├── pages/
│   └── AIRoomPage.tsx              # 메인 페이지
├── components/
│   ├── ChatArea.tsx                # 채팅 메시지 영역
│   ├── ConversationSidebar.tsx     # 대화 목록 사이드바
│   ├── QuickPrompts.tsx            # 빠른 질문 사이드바
│   ├── StudentPickerModal.tsx      # 학생 선택 모달
│   ├── ClassPickerModal.tsx        # 반 선택 모달
│   ├── ContextModeSelector.tsx     # 컨텍스트 모드 선택
│   └── index.ts
├── hooks/
│   ├── useConversations.ts         # 대화 CRUD 훅
│   └── useContextMode.ts           # 컨텍스트 모드 관리 훅
├── services/
│   ├── assistantService.ts         # AI 호출 서비스
│   └── contextBuilder.ts           # RAG 컨텍스트 빌더
├── types.ts                        # 타입 정의
└── index.ts
```

---

## 핵심 타입

```typescript
// 컨텍스트 모드: 전체 / 반별 / 개별
type ContextMode = 'all' | 'class' | 'student';

// 채팅 메시지
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 대화 기록
interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  mode: ContextMode;
  contextLabel?: string; // "6-2반", "학생 3명" 등
}

// 학생 별칭 맵 (개인정보 보호)
interface StudentAliasMap {
  [alias: string]: string; // { "student_A": "김민준" }
}
```

---

## 주요 기능

### 1. 컨텍스트 모드 선택

| 모드 | 설명 | 필수 선택 |
|------|------|-----------|
| `all` | 담당 학급 전체 분석 | 없음 |
| `class` | 특정 반 선택 후 분석 | 반 선택 |
| `student` | 1명 또는 다수 학생 선택 | 학생 선택 |

**useContextMode 훅**:
- `mode`, `setMode`: 현재 모드
- `selectedClass`: 선택된 반
- `selectedStudents`: 선택된 학생 목록
- `isPromptDisabled`: 입력 비활성화 여부 (반/학생 미선택 시)
- `resetSelections()`: 새 대화 시 선택 초기화

### 2. 대화 기록 관리

**useConversations 훅**:
- `conversations`: 전체 대화 목록
- `activeConversationId`: 현재 대화 ID
- `messages`: 현재 대화 메시지
- `aliasMap`: 학생 별칭 맵 (응답 복원용)
- `handleNewConversation()`: 새 대화 생성
- `handleDeleteConversation(id)`: 대화 삭제
- `handleSend()`: 메시지 전송
- `handleQuickPrompt(prompt)`: 빠른 질문 입력

### 3. 학생 별칭 시스템

개인정보 보호를 위해 AI 전송 시 학생 이름을 마스킹합니다.

```typescript
// contextBuilder.ts
export const createAliasMap = (names: string[]): StudentAliasMap => {
  // ["김민준", "이서연"] → { "student_A": "김민준", "student_B": "이서연" }
};

export const applyAliases = (text: string, aliasMap: StudentAliasMap): string => {
  // "김민준 학생은..." → "student_A 학생은..."
};

export const restoreNames = (text: string, aliasMap: StudentAliasMap): string => {
  // AI 응답 "student_A는..." → "김민준은..."
};
```

---

## RAG 컨텍스트 데이터 소스

`contextBuilder.ts`가 모드별로 수집하여 AI 시스템 프롬프트에 주입합니다.

### Student 모드 (개별)

| 데이터 | 소스 | 설명 |
|--------|------|------|
| 38개 T점수 전체 | `Assessment.tScores` | 5대 영역별 그룹 포맷팅 |
| 1차→2차 변화 | `Assessment` (round 1,2) | T±5 이상 변화 요인 추출 |
| 4단계 진단 | `calculate4StepDiagnosis()` | 공부마음/자원/기술 + 8유형 + 코칭전략 |
| 상담 기록 | `unifiedCounselingService` | 최근 5건 (상태, 유형, 영역, 방법, 요약) |
| 관찰 메모 | `memoService` | 최근 5건 (카테고리, 중요도, 내용) |
| 생활기록부 | `schoolRecordService` | 저장된 AI 생성 문구 |
| LPA 유형 | `Assessment.predictedType` | 유형 + 확신도 + 신뢰도/관심 배지 |

### Class 모드 (반별)

| 데이터 | 소스 | 설명 |
|--------|------|------|
| 학급 프로필 | `computeClassProfile()` | 강점/약점 TOP 3 (해설문 + 대표 요인) |
| 위험군 학생 | `AttentionResult` | 긴급 관심 / 관찰 필요 2단 분류 |
| 상담 현황 | `unifiedCounselingService` | 완료/예정 건수 |
| 유형 분포 | `Assessment.predictedType` | 유형별 인원수 |

### All 모드 (전체)

| 데이터 | 소스 | 설명 |
|--------|------|------|
| 반별 프로필 요약 | `computeClassProfile()` | 각 반 강점/약점 + 유형 분포 |
| 전체 상담 현황 | `unifiedCounselingService` | 완료/예정 건수 |
| 관심 필요 학생 수 | `AttentionResult` | 전체 합산 |

---

## 데이터 흐름

```
AIRoomPage
  └── handleSend()
       └── callAssistant(request)  // assistantService.ts
            ├── buildRAGContext({ mode, classes, selectedClass, selectedStudents })
            │    └── 모드별 컨텍스트 빌더 (async)
            │         ├── 검사 결과: Assessment.tScores, predictedType
            │         ├── 4단계 진단: calculate4StepDiagnosis(tScores)
            │         ├── 학급 프로필: computeClassProfile(classData)
            │         ├── 상담 기록: await unifiedCounselingService.getByStudentId()
            │         ├── 관찰 메모: await memoService.getByStudentId()
            │         └── 생활기록부: await schoolRecordService.getSavedByStudentId()
            ├── buildAssistantPrompt(ragContext)  // {RAG_CONTEXT} 치환
            ├── callAI({ messages, maskPII: false })  // 별칭 처리 완료
            └── restoreNames(response, aliasMap)  // 별칭 → 실명 복원
```

---

## 빠른 질문 (QuickPrompts)

모드별로 다른 프롬프트 세트를 제공합니다.

### all (전체)
| 아이콘 | 라벨 | 설명 |
|--------|------|------|
| 📊 | 전체 현황 | 검사 완료율, 유형 분포 요약 |
| 🎯 | 관심 학생 | 주의가 필요한 학생 파악 |
| 📈 | 반별 비교 | 학급 간 유형 분포 차이 |
| 💡 | 개입 전략 | 전체 적용 가능한 방법 |
| 📉 | 변화 추이 | 1차→2차 변화 분석 |
| 🏫 | 학급 운영 팁 | 효과적인 운영 노하우 |
| 📅 | 월별 활동 제안 | 유형별 맞춤 활동 계획 |

### class (반별)
| 아이콘 | 라벨 | 설명 |
|--------|------|------|
| 📊 | 반 분석 | 해당 반 종합 결과 |
| 🎯 | 유형 분포 | 유형별 학생 현황 |
| 👥 | 그룹 활동 | 반 특성 맞춤 활동 |
| ⚠️ | 주의 학생 | 특별 관심 필요 학생 |
| 🪑 | 좌석 배치 | 유형 고려 자리 배치 |
| 📚 | 수업 전략 | 효과적 교수법 제안 |
| 🤝 | 또래 매칭 | 상호 도움 짝꿍 추천 |

### single (개별 1명)
| 아이콘 | 라벨 | 설명 |
|--------|------|------|
| 📋 | 결과 요약 | 검사 결과 핵심 정리 |
| 💬 | 상담 기법 | 효과적 대화 방법 |
| 📝 | 생기부 문구 | 기록용 문장 생성 |
| 🛠️ | 개입 방법 | 교실 내 지도 전략 |
| 💪 | 강점 활용 | 장점 살리는 역할 |
| 🏠 | 가정연계 | 학부모 안내 사항 |
| 🎯 | 목표 설정 | 성장 목표 제안 |

### multiple (개별 다수)
| 아이콘 | 라벨 | 설명 |
|--------|------|------|
| 🔗 | 관계성 분석 | 학생 간 상호작용 |
| 📊 | 결과 비교 | 검사 결과 대조 |
| 👥 | 그룹 상담 | 소그룹 상담 방법 |
| 🔍 | 공통점/차이점 | 특성 비교 분석 |
| 🎮 | 협동 활동 | 함께하는 활동 추천 |
| 📐 | 모둠 구성 | 효과적 그룹 편성 |
| 🌱 | 성장 포인트 | 개별 핵심 성장점 |

---

## 스타일 가이드

### 대화 기록 배지 색상

```typescript
const modeBadgeColors = {
  all: 'bg-gray-100 text-gray-600',
  class: 'bg-blue-100 text-blue-600',
  student: 'bg-green-100 text-green-600',
};
```

### 메시지 스타일

```tsx
// AI 메시지
<div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
  <div className="flex items-center gap-1 mb-2 text-xs text-primary-500 font-medium">
    <Sparkles className="w-3 h-3" />
    <span>AI 분석</span>
  </div>
  {/* 내용 */}
</div>

// 사용자 메시지
<div className="bg-primary-500 text-white rounded-2xl rounded-tr-sm p-4">
  {/* 내용 */}
</div>
```

### 레이아웃

```tsx
// 전체 구조
<div className="h-[calc(100vh-7rem)] flex flex-col">
  {/* 헤더: 로고 + 컨텍스트 모드 버튼 + 선택된 학생 태그 */}
  <div className="mb-4 flex items-center gap-4">...</div>

  {/* 메인 영역 */}
  <div className="flex-1 flex gap-4 min-h-0">
    {/* 좌측: 대화 기록 사이드바 */}
    <ConversationSidebar />

    {/* 중앙: 채팅 영역 */}
    <Card className="flex-1 flex flex-col">
      <ChatArea />
      {/* 입력 영역 */}
    </Card>

    {/* 우측: 빠른 질문 사이드바 (w-72) */}
    <QuickPrompts />
  </div>
</div>
```

---

## 관련 서비스

| 서비스 | 파일 | 역할 |
|--------|------|------|
| AI 호출 | `@/shared/services/ai.ts` | Gemini API 호출 |
| 시스템 프롬프트 | `@/shared/data/aiPrompts.ts` | `buildAssistantPrompt()` |
| 상담 기록 | `@/shared/services/unifiedCounselingService.ts` | 상담 데이터 조회 |
| 관찰 메모 | `@/shared/services/memoService.ts` | 메모 데이터 조회 |
| 생활기록부 | `@/shared/services/schoolRecordService.ts` | 생기부 문구 조회 |
| 학급 프로필 | `@/features/class-dashboard/hooks/useClassProfile.ts` | `computeClassProfile()` |
| 4단계 진단 | `@/shared/utils/calculate4StepDiagnosis.ts` | 진단 계산 |

---

**Last Updated**: 2026-03-03
