# AI 에이전트 프롬프트 가이드

## 📁 프롬프트 목록

| 파일 | 용도 | 사용 시점 |
|------|------|----------|
| `system-prompt.md` | AI 에이전트 시스템 프롬프트 | 모든 AI 요청의 기본 |
| `preset-comprehensive.md` | 종합 분석 | 학생 전체 분석 요청 시 |
| `preset-parent-counseling.md` | 학부모 상담 준비 | 학부모 상담 전 |
| `preset-classroom-intervention.md` | 수업 중 개입 | 수업 전략 수립 시 |
| `preset-learning-path.md` | 학습 경로 추천 | 장기 개입 계획 시 |
| `preset-school-record.md` | 생활기록부 생성 | 학기말 생기부 작성 시 |

---

## 🔧 프롬프트 사용법

### 1. 시스템 프롬프트 적용
```typescript
const systemPrompt = await fetch('/prompts/system-prompt.md').then(r => r.text());

const response = await callAI({
  system: systemPrompt,
  messages: [{ role: 'user', content: userQuestion }]
});
```

### 2. 프리셋 프롬프트 적용
```typescript
import { maskStudentForAI } from '@/utils/piiMasking';

// 학생 데이터 마스킹
const safeData = maskStudentForAI(student);

// 프리셋 템플릿에 데이터 주입
const prompt = presetTemplate
  .replace('{{schoolLevel}}', safeData.schoolLevel)
  .replace('{{grade}}', safeData.grade)
  .replace('{{studentType}}', safeData.studentType)
  // ... 나머지 변수 치환
```

---

## 🔒 개인정보 보호 (PII 마스킹)

### 반드시 제외해야 할 정보
- ❌ 학생 이름
- ❌ 학번
- ❌ 생년월일
- ❌ 학교명
- ❌ 주소/연락처

### AI에 전송 가능한 정보
- ✅ 학교급 (초등/중등)
- ✅ 학년
- ✅ 유형명
- ✅ 확신도 (%)
- ✅ T점수 (38개)
- ✅ 강점/약점 요인

### 마스킹 함수 사용
```typescript
import { maskStudentForAI, generateAIPrompt } from '@/utils/piiMasking';

// 1. 학생 데이터 마스킹
const safeData = maskStudentForAI(student);

// 2. AI 프롬프트 생성
const prompt = generateAIPrompt(safeData, userQuestion, additionalContext);
```

---

## 📝 프롬프트 템플릿 변수

### 공통 변수
| 변수 | 설명 | 예시 |
|------|------|------|
| `{{schoolLevel}}` | 학교급 | "초등" |
| `{{grade}}` | 학년 | 6 |
| `{{studentType}}` | LPA 유형 | "자원소진형" |
| `{{typeConfidence}}` | 확신도 | 87 |

### 점수 관련
| 변수 | 설명 |
|------|------|
| `{{tScores[0]}}` ~ `{{tScores[37]}}` | 38개 T점수 |
| `{{strengths}}` | 강점 요인 배열 |
| `{{weaknesses}}` | 약점 요인 배열 |
| `{{subCategoryScores}}` | 11개 중분류 평균 |

### 차수 비교
| 변수 | 설명 |
|------|------|
| `{{round1Type}}` | 1차 유형 |
| `{{round2Type}}` | 2차 유형 |
| `{{significantChanges}}` | 유의미한 변화 |

---

## 🎨 프리셋 버튼 UI

```tsx
const PRESETS = [
  { id: 'comprehensive', label: '종합 분석', icon: '📊' },
  { id: 'parent', label: '학부모 상담', icon: '👨‍👩‍👧' },
  { id: 'classroom', label: '수업 개입', icon: '🏫' },
  { id: 'learning-path', label: '학습 경로', icon: '🛤️' },
];

// 사용
<div className="flex gap-2">
  {PRESETS.map(preset => (
    <button
      key={preset.id}
      onClick={() => handlePreset(preset.id)}
      className="btn-secondary"
    >
      {preset.icon} {preset.label}
    </button>
  ))}
</div>
```

---

## 🔄 프롬프트 커스터마이징

### 새 프리셋 추가
1. `prompts/preset-{name}.md` 파일 생성
2. 템플릿 변수 정의
3. 예상 응답 형식 명시
4. 사용 시점 문서화

### 기존 프리셋 수정
1. 해당 `.md` 파일 수정
2. 변수 추가/제거 시 코드도 함께 수정
3. 테스트 후 배포
