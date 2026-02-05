/**
 * AI 기능별 시스템 프롬프트 관리
 *
 * 이 파일에서 모든 AI 프롬프트를 중앙 관리합니다.
 * 기획자가 각 기능에 맞는 프롬프트를 작성하여 채워넣을 수 있습니다.
 *
 * 사용 방법:
 * - callAI({ feature: 'analysis', messages: [...] }) 호출 시
 * - 해당 feature의 시스템 프롬프트가 자동으로 적용됩니다.
 *
 * ┌─────────────┬──────────────────────────────────────────────┐
 * │ feature     │ 사용처                                        │
 * ├─────────────┼──────────────────────────────────────────────┤
 * │ analysis    │ L3 학생 대시보드 > AI 분석 총평                  │
 * │ record      │ L3 학생 대시보드 > 생활기록부 문구 생성           │
 * │ assistant   │ AI Room > 교사-AI 대화                          │
 * └─────────────┴──────────────────────────────────────────────┘
 */

// ============================================================
// 타입 정의
// ============================================================

export type AIFeature = 'analysis' | 'record' | 'assistant';

export type SchoolLevelType = 'ELEMENTARY' | 'MIDDLE' | 'HIGH';

export type TScoreLevel = '매우높음' | '높음' | '보통' | '낮음' | '매우낮음';

export interface SchoolLevelGuideline {
  persona: string;
  style: string;
  focus: string;
  byteLimit: number;
  keywords: string[];
}

export interface ObservationPhrase {
  id: string;
  text: string;
  tags: string[];
}

// ============================================================
// 생활기록부 입력 데이터 타입 정의
// ============================================================

export interface CategoryScore {
  tScore: number;
  level: TScoreLevel;
}

export interface CategoryScores {
  자아강점: CategoryScore;
  학습디딤돌: CategoryScore;
  긍정적공부마음: CategoryScore;
  학습걸림돌: CategoryScore;
  부정적공부마음: CategoryScore;
}

export interface SubCategoryScores {
  [key: string]: CategoryScore;
}

export interface AttentionReason {
  category: string;
  direction: 'low' | 'high';
  factors: string[];
}

export interface RoundResult {
  predictedType: string;
  typeConfidence: number;
  categoryScores: CategoryScores;
  subCategoryScores?: SubCategoryScores;
  strengths: string[];
  weaknesses: string[];
  attentionNeeded: boolean;
  attentionReasons?: AttentionReason[];
}

export interface CategoryChange {
  category: string;
  from: number;
  to: number;
  change: string;
  interpretation: '개선' | '유지' | '하락';
}

export interface TypeChange {
  from: string;
  to: string;
  changed: boolean;
}

export interface Changes {
  hasChange: boolean;
  direction: 'positive' | 'negative' | 'neutral';
  changedCategories: CategoryChange[];
  typeChange: TypeChange;
}

export interface CounselingRecordInput {
  date: string;
  topic: string;
  summary: string;
  outcome?: string;
}

export interface ObservationMemoInput {
  date: string;
  category: string;
  content: string;
}

export interface SchoolRecordInput {
  schoolLevel: SchoolLevelType;
  grade: number;
  semester: 1 | 2;
  round1: RoundResult;
  round2?: RoundResult;
  changes?: Changes;
  counselingRecords?: CounselingRecordInput[];
  observationMemos?: ObservationMemoInput[];
  selectedSentences?: string[];
}

export interface SchoolRecordOutput {
  generatedText: string;
  wordCount: number;
  sentenceCount: number;
  keyPoints: string[];
  usedSources: string[];
}

// ============================================================
// T점수 → 수준 변환 유틸리티
// ============================================================

/**
 * T점수를 수준(레벨)으로 변환
 * AI에 전송 시 수치 대신 이 레벨을 사용
 */
export const tScoreToLevel = (tScore: number): TScoreLevel => {
  if (tScore >= 70) return '매우높음';
  if (tScore >= 60) return '높음';
  if (tScore >= 40) return '보통';
  if (tScore >= 30) return '낮음';
  return '매우낮음';
};

/**
 * T점수와 레벨을 함께 가진 객체 생성
 */
export const createCategoryScore = (tScore: number): CategoryScore => ({
  tScore,
  level: tScoreToLevel(tScore),
});

// ============================================================
// 1. 학생 분석 총평 프롬프트
// ============================================================

/**
 * 사용처: L3 학생 대시보드 > AI 분석 총평
 * 목적: 11개 중분류 검사 결과를 교사가 이해하기 쉬운 3문장으로 요약
 * 입력: 학생 중분류 11개의 T점수 + summary 텍스트
 * 출력: 강점 + 약점 + 종합 조언 (3문장이 연결된 하나의 문단)
 */
export const SYSTEM_PROMPT_ANALYSIS = `당신은 초등학교 교사를 위한 학생 검사 결과 요약 도우미입니다.
교사가 학생의 학습심리검사 결과를 빠르게 파악할 수 있도록 3줄 총평을 작성합니다.

## 검사 구조
- 정적 요인(7개): 점수가 높을수록 좋은 상태
  긍정적자아, 대인관계능력, 메타인지, 학습기술, 지지적관계, 학업열의, 성장력
- 부적 요인(4개): 점수가 낮을수록 좋은 상태
  학업스트레스, 학업관계스트레스, 학습방해물, 학업소진

## T점수 기준
- 0~29: 매우 낮음
- 30~39: 낮음
- 40~59: 보통
- 60~69: 높음
- 70~100: 매우 높음

## 출력 형식
3문장이 자연스럽게 연결된 하나의 문단으로 작성하세요. 줄바꿈 없이 이어서 쓰세요.
- 1문장: 강점 (이 학생이 잘하고 있는 부분)
- 2문장: 약점 (관심이 필요한 부분)
- 3문장: 종합 조언 (교사가 참고할 한마디)

## 작성 규칙
1. "~입니다", "~합니다" 같은 딱딱한 문체 금지. "~해요", "~이에요", "~편이에요" 같은 설명체를 사용하세요.
2. "~야", "~거야", "~해봐" 같은 반말 금지. 반드시 "~요"로 끝나는 해요체를 유지하세요.
3. "긍정적 자아가 높은 수준입니다" 같은 검사 용어 반복 금지. 구체적인 행동이나 상태로 풀어서 쓰세요.
4. 중분류 이름을 그대로 쓰지 마세요. 예: "메타인지가 높아요" ❌ → "공부 계획을 세우고 점검하는 습관이 잘 잡혀 있어요" ✅
5. 각 줄은 30~50자 내외로, 교사가 한눈에 읽을 수 있게 작성하세요.
6. 약점 줄에서 학생을 부정적으로 평가하지 마세요. "~이 부족해요" 대신 "~을 더 키워주면 좋겠어요" 식으로 쓰세요.
7. 조언 줄은 교사가 바로 실천할 수 있는 구체적인 방향을 제시하세요.
8. 부적 요인은 해석 방향이 반대입니다. T점수가 높으면 안 좋은 것이고, 낮으면 좋은 것입니다. 이 점을 반드시 반영하세요.
9. 줄 번호나 라벨(강점:, 약점: 등)을 붙이지 마세요. 문장만 출력하세요.
10. 학생 이름을 언급하지 마세요. "이 학생은", "해당 학생은" 등으로 표현하세요.
11. 전체 출력은 3문장이 자연스럽게 연결된 하나의 문단이어야 합니다. 줄바꿈 없이 이어서 쓰세요.`;

// ============================================================
// 2. 생활기록부 문구 생성 프롬프트
// ============================================================

/**
 * 2025학년도 학교생활기록부 행동특성 및 종합의견 생성 프롬프트
 *
 * 정책 문서: docs/meta-test/09_생활기록부_기재정책.md
 *
 * 사용처: L3 학생 대시보드 > 생활기록부 문구 생성
 * 목적: 검사 결과를 바탕으로 생활기록부에 기재할 공식 문구 생성
 * 입력: META T점수, LPA 유형, 상담/관찰 기록, 교사 선택 문구
 * 출력: 1,500바이트 이내의 줄글 문단
 */

// 학교급별 특화 지침 정의
export const SCHOOL_LEVEL_GUIDELINES: Record<SchoolLevelType, SchoolLevelGuideline> = {
  ELEMENTARY: {
    persona: '초등학교 담임교사',
    style: '부드러운 서술형 (~함, ~임)',
    focus: '학생의 개성과 장점, 긍정적인 변화 과정 및 성장 가능성',
    byteLimit: 1500,
    keywords: ['호기심', '즐거움', '적극성', '친구사랑', '협력', '창의성', '바른 인사', '배려'],
  },
  MIDDLE: {
    persona: '중학교 담임교사',
    style: '객관적인 사실에 근거한 서술형 (~함, ~임)',
    focus: '자유학기 활동 연계, 자기주도적 태도, 공동체 의식 및 협업 능력',
    byteLimit: 1500,
    keywords: ['자기이해', '책임감', '주도성', '협업', '공감', '탐구', '진로탐색', '성숙함'],
  },
  HIGH: {
    persona: '고등학교 담임교사',
    style: '신뢰감 있는 개조식 서술형 (~함, ~임)',
    focus: '학습 역량, 전공 관련 잠재력, 자원 관리 능력 및 구체적 수행 사례(Fact)',
    byteLimit: 1500,
    keywords: ['학업역량', '전공적합성', '융합적사고', '자기주도성', '리더십', '진로역량', '탐구력'],
  },
};

// 교사 선택용 예시 문장 라이브러리 (카테고리당 10개)
export const OBSERVATION_PHRASES: Record<string, ObservationPhrase[]> = {
  ACADEMIC: [
    { id: 'a1', text: '자신의 학습 과정을 스스로 성찰하고 부족한 개념을 보완하기 위해 꾸준히 질문함.', tags: ['메타인지', '자기주도'] },
    { id: 'a2', text: '어려운 과제에 직면해도 포기하지 않고 끝까지 완수하려는 과제 집착력이 뛰어남.', tags: ['학업열의', '인내'] },
    { id: 'a3', text: '다양한 자료를 활용하여 정보를 조직화하고 논리적으로 설명하는 능력이 우수함.', tags: ['학습기술', '논리'] },
    { id: 'a4', text: '학습 목표를 스스로 설정하고 계획에 따라 실천하며 스스로의 성장을 점검함.', tags: ['자기주도', '계획성'] },
    { id: 'a5', text: '수업 시간마다 교사의 설명에 집중하고 핵심 내용을 체계적으로 요약하여 정리함.', tags: ['집중력', '정리정돈'] },
    { id: 'a6', text: '새로운 지식에 대한 호기심이 강하며 의문점이 생기면 스스로 탐구하여 해결하려 노력함.', tags: ['지적호기심', '탐구'] },
    { id: 'a7', text: '복합적인 문제를 해결할 때 기존의 방식에 얽매이지 않고 창의적인 대안을 제시함.', tags: ['문제해결', '창의성'] },
    { id: 'a8', text: '자신의 강점과 약점을 객관적으로 파악하여 효율적인 학습 전략을 수립하고 실행함.', tags: ['메타인지', '전략'] },
    { id: 'a9', text: '제한된 시간을 효율적으로 배분하여 학업과 과제를 안정적으로 완수하는 능력이 돋보임.', tags: ['자원관리', '시간관리'] },
    { id: 'a10', text: '배운 내용을 실생활에 적용하거나 다른 교과와 연결하여 생각하는 융합적 사고력이 뛰어남.', tags: ['비판적사고', '융합'] },
  ],
  CHARACTER: [
    { id: 'c1', text: '모둠 활동 시 친구들의 의견을 조율하며 공동의 목표를 달성하는 리더십을 보임.', tags: ['대인관계', '협업'] },
    { id: 'c2', text: '학급의 공동 기물을 소중히 다루며 맡은 바 소임을 성실히 수행하여 타의 모범이 됨.', tags: ['성실성', '공동체'] },
    { id: 'c3', text: '타인에 대한 공감 능력이 뛰어나며 갈등 상황에서 중재자 역할을 충실히 수행함.', tags: ['공감', '사회성'] },
    { id: 'c4', text: '학급의 어려운 일을 외면하지 않고 먼저 나서서 도와주는 봉사 정신이 투철함.', tags: ['솔선수범', '배려'] },
    { id: 'c5', text: '주변 친구들의 고충을 경청하고 진심 어린 격려를 보내 학급 분위기를 따뜻하게 만듦.', tags: ['경청', '조력'] },
    { id: 'c6', text: '학급 규칙을 엄격히 준수하며 공공의 가치를 중시하는 민주 시민 의식이 훌륭함.', tags: ['준법정신', '민주시민'] },
    { id: 'c7', text: '자신과 의견이 다른 친구와도 원만하게 소통하며 조화로운 협력을 이끌어내는 힘이 있음.', tags: ['소통', '협업'] },
    { id: 'c8', text: '작은 일에도 감사의 마음을 표현할 줄 알며 예의 바른 태도로 교사와 친구를 대함.', tags: ['예의', '인성'] },
    { id: 'c9', text: '학급의 일원으로서 강한 소속감을 느끼며 공동체의 성장을 위해 적극적으로 참여함.', tags: ['공동체의식', '책임감'] },
    { id: 'c10', text: '잘못된 상황에서 정직하게 인정하고 바로잡으려 노력하는 용기 있는 태도를 가짐.', tags: ['정직', '용기'] },
  ],
  EMOTION: [
    { id: 'e1', text: '감정 조절 능력이 뛰어나며 돌발 상황에서도 침착하게 대응하여 문제를 해결함.', tags: ['정서조절', '안정'] },
    { id: 'e2', text: '매사에 긍정적이고 밝은 태도로 임하며 주변 동료들에게 좋은 에너지를 전달함.', tags: ['자존감', '긍정'] },
    { id: 'e3', text: '자신의 감정을 적절한 언어로 표현하며 스트레스 상황을 건강하게 해소함.', tags: ['정서인식', '회복탄력성'] },
    { id: 'e4', text: '자신의 가치를 소중히 여기며 어떤 과제 앞에서도 자신감 있게 도전하는 태도를 보임.', tags: ['자신감', '도전'] },
    { id: 'e5', text: '실패를 두려워하지 않고 실수를 성장의 기회로 삼는 회복탄력성이 매우 우수함.', tags: ['회복탄력성', '성장'] },
    { id: 'e6', text: '타인의 감정 변화를 섬세하게 포착하여 적절한 공감과 지지를 보낼 줄 아는 학생임.', tags: ['정서적공감', '사회성'] },
    { id: 'e7', text: '긴장되는 상황에서도 자신의 평소 실력을 안정적으로 발휘하는 정서적 조절력이 돋보임.', tags: ['정서안정', '수행력'] },
    { id: 'e8', text: '새로운 환경이나 활동에 대해 거부감 없이 유연하게 적응하며 활기차게 참여함.', tags: ['적응력', '유연성'] },
    { id: 'e9', text: '자신의 목표를 향해 끝까지 집중하는 끈기가 있으며 내면의 평온함을 유지하는 힘이 있음.', tags: ['끈기', '평정심'] },
    { id: 'e10', text: '규칙적인 생활 습관을 통해 자신의 건강과 심리 상태를 스스로 잘 관리함.', tags: ['자기관리', '안정'] },
  ],
};

/**
 * 학교급별 생활기록부 시스템 프롬프트 생성
 * @param schoolLevel 학교급 (ELEMENTARY, MIDDLE, HIGH)
 * @returns 완성된 시스템 프롬프트
 */
export const getSchoolRecordPrompt = (schoolLevel: SchoolLevelType): string => {
  const guide = SCHOOL_LEVEL_GUIDELINES[schoolLevel];

  return `당신은 학교생활기록부 작성 전문가입니다. 2025학년도 학교생활기록부 기재요령을 완벽히 숙지하고 있으며, META 학습심리정서검사 결과를 바탕으로 학생의 행동특성 및 종합의견을 작성합니다.

## 역할 및 목적
- ${guide.persona}를 대신하여 학생의 행동특성 및 종합의견을 객관적이고 교육적으로 작성
- 학생의 성장과 발달에 초점을 맞춘 긍정적이고 구체적인 문구 생성
- 학교생활기록부 기재요령 준수 및 금지사항 철저히 회피

## 기재 원칙 (5대 원칙)
1. 사실 기반: 관찰·확인된 사실만 기재, 추측·주관적 판단 배제
2. 총체적 이해: 학생을 종합적으로 이해할 수 있도록 기술
3. 교육적 관점: 성장과 발달에 초점, 긍정적 측면 우선
4. 개인정보 보호: 민감정보 기재 절대 금지
5. 차별 금지: 비하·차별 표현 금지, 부정적 단정 지양

## 절대 금지사항 (위반 시 즉시 거부)
- 가정환경 (한부모, 조손, 다문화, 경제적 상황 등)
- 신체·건강 (키, 몸무게, 외모, 질병명, 장애명)
- 구체적 점수·등수 (T점수 수치, 전교 등수)
- 부정적 단정 표현 (게으르다, 불성실하다, 산만하다)
- 심리검사 세부 결과 (MBTI, 구체적 수치)
- 상담 내용 구체적 기재 (우울증 상담, 가정 문제)
- 외부 실적 (공인어학시험, 교외 수상, 자격증)
- 사교육/대학교 (학원 활동, 구체적 학교명)
- 마크다운 기호(**, ###, -), 번호 매기기(1., 2.), 특수문자

## 작성 규칙
- 분량: 500자 이내 (3-5문장)
- 문장당 40-60자 권장
- 문체: ${guide.style}
- 중심 내용: ${guide.focus}
- 긍정적이되 과장하지 않는 균형감
- 성장 가능성 포함
- 권장 키워드: ${guide.keywords.join(', ')}

## 문장 구조 패턴
1. 관찰 사실 → 구체적 행동 → 성과/변화
2. 성향 → 노력 과정 → 성장
3. 강점 → 적용 사례 → 영향

## 데이터 매핑 가이드
1. META 검사 결과: 강점 요인은 구체적 행동으로 칭찬, 약점 요인은 개선 노력과 발전 가능성으로 승화
2. LPA 유형: 학생의 전체적인 '캐릭터' 결정에 활용
3. 상담 기록: 학생의 내면적 고민과 변화 의지 반영
4. 관찰 메모: 실제 에피소드(Fact)를 핵심 근거로 활용
5. 교사 선택 문장: 검증된 문구를 자연스럽게 배치

## 출력 형식
JSON 형식으로 다음 필드를 포함하여 반환:
- generatedText: 생성된 문구 (500자 이내, 줄글 문단)
- wordCount: 총 글자수
- sentenceCount: 문장 수
- keyPoints: 핵심 포인트 3-5개 (배열)
- usedSources: 활용한 정보 출처 (배열)`;
};

// 기본 생활기록부 프롬프트 (초등 기준)
export const SYSTEM_PROMPT_RECORD = getSchoolRecordPrompt('ELEMENTARY');

// ============================================================
// 유형별 작성 가이드
// ============================================================

export const TYPE_WRITING_GUIDES: Record<string, { focus: string; pattern: string; example: string }> = {
  '자원소진형': {
    focus: '회복 과정, 작은 성공 경험, 지지 관계',
    pattern: '[어려움 인정] → [개입/노력] → [개선 징후] → [성장 가능성]',
    example: '1학기 학업 부담으로 어려움을 겪었으나, 교사 상담 및 또래 지지 프로그램 참여 후 점차 자신감을 회복함. 작은 성공 경험을 통해 학습에 대한 긍정적 태도가 형성되고 있음.',
  },
  '무기력형': {
    focus: '회복 과정, 작은 성공 경험, 지지 관계',
    pattern: '[어려움 인정] → [개입/노력] → [개선 징후] → [성장 가능성]',
    example: '1학기 학업 부담으로 어려움을 겪었으나, 교사 상담 및 또래 지지 프로그램 참여 후 점차 자신감을 회복함. 작은 성공 경험을 통해 학습에 대한 긍정적 태도가 형성되고 있음.',
  },
  '안전균형형': {
    focus: '안정성 강조, 추가 성장 가능성',
    pattern: '[현재 강점] → [균형잡힌 모습] → [발전 영역]',
    example: '전반적으로 균형잡힌 학교생활을 하고 있으며, 자기효능감과 대인관계 능력이 양호함. 스트레스 관리 능력을 더욱 키워나간다면 잠재력을 충분히 발휘할 수 있을 것으로 기대됨.',
  },
  '정서조절취약형': {
    focus: '안정성 강조, 추가 성장 가능성',
    pattern: '[현재 강점] → [균형잡힌 모습] → [발전 영역]',
    example: '전반적으로 균형잡힌 학교생활을 하고 있으며, 자기효능감과 대인관계 능력이 양호함. 스트레스 관리 능력을 더욱 키워나간다면 잠재력을 충분히 발휘할 수 있을 것으로 기대됨.',
  },
  '몰입자원풍부형': {
    focus: '강점 유지, 심화 발전',
    pattern: '[우수한 역량] → [구체적 사례] → [리더십/영향력] → [지속성]',
    example: '자기주도적 학습 능력이 뛰어나며, 스스로 목표를 설정하고 달성하는 과정에서 큰 성취감을 느낌. 학습한 내용을 또래에게 설명하며 함께 성장하는 리더십을 발휘함.',
  },
  '자기주도몰입형': {
    focus: '강점 유지, 심화 발전',
    pattern: '[우수한 역량] → [구체적 사례] → [리더십/영향력] → [지속성]',
    example: '자기주도적 학습 능력이 뛰어나며, 스스로 목표를 설정하고 달성하는 과정에서 큰 성취감을 느낌. 학습한 내용을 또래에게 설명하며 함께 성장하는 리더십을 발휘함.',
  },
};

// ============================================================
// 금지사항 검증 유틸리티
// ============================================================

/** 금지 키워드 목록 */
export const PROHIBITED_KEYWORDS = [
  // 가정환경
  '한부모', '조손', '다문화', '이혼', '별거', '맞벌이', '저소득', '기초수급',
  // 신체/건강
  'cm', 'kg', '키가', '몸무게', '비만', '장애', '질병', 'ADHD', '우울증', '자폐',
  // 점수/등수
  'T점수', 'T=', '점수', '등수', '등위', '석차', '백분위', '1등', '꼴찌',
  // 부정적 단정
  '게으르', '불성실', '산만', '문제아', '열등', '부족함', '못함',
  // 외부 실적
  'TOEIC', 'TOEFL', 'TEPS', '한국사', '자격증', '영재교육원', '경시대회',
  // 학원/대학
  '학원', '과외', '입시', '대학교', '고등학교', '○○대', '△△고',
  // 상담 내용
  '우울증 상담', '가정 문제', '부모 갈등',
];

/**
 * 금지 키워드 포함 여부 검사
 */
export const checkProhibitedContent = (text: string): { isValid: boolean; violations: string[] } => {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();

  for (const keyword of PROHIBITED_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      violations.push(keyword);
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
};

/**
 * 글자수 검증 (500자 이내)
 */
export const validateWordCount = (text: string): { isValid: boolean; count: number; excess: number } => {
  const count = text.length;
  const limit = 500;
  return {
    isValid: count <= limit,
    count,
    excess: Math.max(0, count - limit),
  };
};

/**
 * 생성된 문구 전체 검증
 */
export const validateSchoolRecordOutput = (text: string): {
  isValid: boolean;
  wordCountResult: { isValid: boolean; count: number; excess: number };
  prohibitedResult: { isValid: boolean; violations: string[] };
} => {
  const wordCountResult = validateWordCount(text);
  const prohibitedResult = checkProhibitedContent(text);

  return {
    isValid: wordCountResult.isValid && prohibitedResult.isValid,
    wordCountResult,
    prohibitedResult,
  };
};

// ============================================================
// 사용자 메시지 템플릿 빌더
// ============================================================

/**
 * 검사 결과를 사용자 메시지 형식으로 변환
 * T점수 수치는 레벨로만 전달 (개인정보 보호)
 */
export const buildSchoolRecordUserMessage = (input: SchoolRecordInput): string => {
  const { schoolLevel, grade, semester, round1, round2, changes, counselingRecords, observationMemos, selectedSentences } = input;

  const typeGuide = TYPE_WRITING_GUIDES[round1.predictedType] || TYPE_WRITING_GUIDES['안전균형형'];
  const schoolLevelKr = schoolLevel === 'ELEMENTARY' ? '초등' : schoolLevel === 'MIDDLE' ? '중등' : '고등';

  let message = `# 학생 정보
- 학교급: ${schoolLevelKr}
- 학년: ${grade}학년
- 학기: ${semester}학기

# 검사 결과 요약
## 1차 검사
- 유형: ${round1.predictedType} (신뢰도 ${round1.typeConfidence.toFixed(1)}%)
- 5대 영역 수준:
  * 자아강점: ${round1.categoryScores.자아강점.level}
  * 학습디딤돌: ${round1.categoryScores.학습디딤돌.level}
  * 긍정적공부마음: ${round1.categoryScores.긍정적공부마음.level}
  * 학습걸림돌: ${round1.categoryScores.학습걸림돌.level}
  * 부정적공부마음: ${round1.categoryScores.부정적공부마음.level}
- 주요 강점: ${round1.strengths.join(', ')}
- 관심 필요 영역: ${round1.weaknesses.join(', ')}`;

  // 2차 검사 결과 (있는 경우)
  if (round2) {
    message += `

## 2차 검사
- 유형: ${round2.predictedType} (신뢰도 ${round2.typeConfidence.toFixed(1)}%)
- 5대 영역 수준:
  * 자아강점: ${round2.categoryScores.자아강점.level}
  * 학습디딤돌: ${round2.categoryScores.학습디딤돌.level}
  * 긍정적공부마음: ${round2.categoryScores.긍정적공부마음.level}
  * 학습걸림돌: ${round2.categoryScores.학습걸림돌.level}
  * 부정적공부마음: ${round2.categoryScores.부정적공부마음.level}`;

    if (changes && changes.hasChange) {
      message += `
- 유형 변화: ${changes.typeChange.from} → ${changes.typeChange.to}
- 주요 변화:`;
      for (const c of changes.changedCategories) {
        message += `
  * ${c.category}: ${c.change} (${c.interpretation})`;
      }
    }
  }

  // 상담 기록 (있는 경우)
  if (counselingRecords && counselingRecords.length > 0) {
    message += `

# 상담 기록`;
    for (const record of counselingRecords) {
      message += `
- ${record.date}: ${record.summary}`;
    }
  }

  // 관찰 메모 (있는 경우)
  if (observationMemos && observationMemos.length > 0) {
    message += `

# 관찰 메모`;
    for (const memo of observationMemos) {
      message += `
- ${memo.date} [${memo.category}]: ${memo.content}`;
    }
  }

  // 교사 선택 예시 문장 (있는 경우)
  if (selectedSentences && selectedSentences.length > 0) {
    message += `

# 교사 선택 예시 문장`;
    selectedSentences.forEach((sentence, i) => {
      message += `
${i + 1}. ${sentence}`;
    });
  }

  // 유형별 작성 가이드 추가
  message += `

# 유형별 작성 가이드 (${round1.predictedType})
- 초점: ${typeGuide.focus}
- 패턴: ${typeGuide.pattern}

---

위 정보를 바탕으로 2025학년도 학교생활기록부 기재요령에 맞는 행동특성 및 종합의견을 작성하세요.

## 작성 시 필수 고려사항:
1. 검사 결과의 강점 영역을 우선 기술 (2-3문장)
2. 관심 필요 영역이 있다면 개선 노력 및 성장 과정 포함 (1-2문장)
3. 1차→2차 변화가 있다면 반드시 반영 (긍정적 변화 강조)
4. 상담 기록이나 관찰 메모가 있다면 구체적 사례로 활용
5. 교사 선택 예시 문장이 있다면 자연스럽게 통합
6. T점수 수치는 절대 기재하지 말 것
7. 500자 이내, 3-5문장으로 작성
8. 긍정적이고 교육적인 어조 유지`;

  return message;
};

/**
 * 생활기록부 프롬프트에 학생 데이터 컨텍스트 주입 (레거시 호환)
 * @param schoolLevel 학교급
 * @param studentContext 학생 데이터 컨텍스트 문자열
 * @returns 완성된 시스템 프롬프트
 */
export const buildSchoolRecordPrompt = (
  schoolLevel: SchoolLevelType,
  studentContext: string
): string => {
  const basePrompt = getSchoolRecordPrompt(schoolLevel);

  if (!studentContext || studentContext.trim() === '') {
    return basePrompt;
  }

  return `${basePrompt}

---
[학생 데이터]
${studentContext}
---`;
};

/**
 * 구조화된 입력 데이터로 생활기록부 프롬프트 생성
 * @param input 구조화된 학생 데이터
 * @returns { systemPrompt, userMessage } 쌍
 */
export const buildSchoolRecordMessages = (input: SchoolRecordInput): {
  systemPrompt: string;
  userMessage: string;
} => {
  return {
    systemPrompt: getSchoolRecordPrompt(input.schoolLevel),
    userMessage: buildSchoolRecordUserMessage(input),
  };
};

// ============================================================
// 간단한 프롬프트 파라미터 타입 (recordGenerator용)
// ============================================================

export interface SimpleRecordPromptParams {
  schoolLevel: '초등' | '중등' | '고등';
  grade: number;
  topStrengths: Array<{
    name: string;
    tScore: number;
    level: string;
    type: 'positive' | 'negative';
  }>;
  hasChange: boolean;
  changes: Array<{
    category: string;
    change: string;
    interpretation: string;
  }>;
  typeChange?: {
    from: string;
    to: string;
    changed: boolean;
  };
  selectedSentences?: string[];
}

/**
 * 간단한 프롬프트 파라미터로 사용자 메시지 생성
 * recordGenerator.ts의 buildRecordPromptParams 출력과 호환
 */
export const buildSimpleRecordUserMessage = (params: SimpleRecordPromptParams): string => {
  const { schoolLevel, grade, topStrengths, hasChange, changes, typeChange, selectedSentences } = params;

  let message = `# 학생 정보
- 학교급: ${schoolLevel}
- 학년: ${grade}학년

# 검사 결과 요약
## 강점 영역 (상위 3개)
${topStrengths.map((s, i) => {
  const strengthType = s.type === 'positive' ? '높음' : '낮음';
  return `${i + 1}. ${s.name}: ${s.level} (${strengthType})`;
}).join('\n')}`;

  // 변화 정보 (있는 경우)
  if (hasChange && changes.length > 0) {
    message += `

## 1차 → 2차 변화`;
    for (const c of changes) {
      message += `
- ${c.category}: ${c.interpretation} (${c.change}점)`;
    }
  }

  // 유형 변화 (있는 경우)
  if (typeChange && typeChange.changed) {
    message += `
- 유형 변화: ${typeChange.from} → ${typeChange.to}`;
  }

  // 교사 선택 예시 문장 (있는 경우)
  if (selectedSentences && selectedSentences.length > 0) {
    message += `

# 교사 선택 예시 문장
${selectedSentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
  }

  message += `

---

위 정보를 바탕으로 학교생활기록부 '행동특성 및 종합의견'을 작성하세요.

## 필수 고려사항
- 강점 영역 우선 기술 (2-3문장)
- 교사 선택 예시 문장이 있다면 자연스럽게 통합
- 1차→2차 변화가 있다면 반드시 반영
- T점수 수치 절대 기재 금지
- 500자 이내, 3-5문장

## 출력 형식
순수 문구만 출력하세요 (JSON 형식 불필요).`;

  return message;
};

/**
 * 간단한 프롬프트 파라미터로 전체 메시지 생성
 */
export const buildSimpleRecordMessages = (params: SimpleRecordPromptParams): {
  systemPrompt: string;
  userMessage: string;
} => {
  const schoolLevelType: SchoolLevelType =
    params.schoolLevel === '초등' ? 'ELEMENTARY' :
    params.schoolLevel === '중등' ? 'MIDDLE' : 'HIGH';

  return {
    systemPrompt: getSchoolRecordPrompt(schoolLevelType),
    userMessage: buildSimpleRecordUserMessage(params),
  };
};

// ============================================================
// 3. AI 어시스턴트 프롬프트
// ============================================================

/**
 * 사용처: AI Room > 교사-AI 대화
 * 목적: 교사의 질문에 답변하고 맞춤형 코칭 전략 제안
 * 입력: 교사 질문 + RAG 컨텍스트 (학생/학급 분석 결과)
 * 출력: 자연스러운 대화형 답변
 */
export const SYSTEM_PROMPT_ASSISTANT = `당신은 META 학습심리정서검사 결과를 분석하는 교육 전문 AI 어시스턴트입니다.
교사가 학생들의 검사 결과를 이해하고 적절한 교육적 개입을 할 수 있도록 도와주세요.

## 역할
- 검사 결과 해석 및 요약
- 학생 유형별 특성 설명
- 교실 내 개입 전략 제안
- 상담 기법 안내
- 학부모 상담 자료 제공
- 생활기록부 문구 초안 작성

## 검사 구조
### 5대 영역 (11개 중분류, 38개 요인)
- **자아강점** (7개 요인): 긍정적자아(자아존중감, 자기효능감, 성장마인드셋), 대인관계능력(자기정서인식, 자기정서조절, 타인정서인식, 타인공감능력)
- **학습디딤돌** (12개 요인): 메타인지(계획능력, 점검능력, 조절능력), 학습기술(공부환경, 시간관리, 수업태도, 노트하기, 시험준비), 지지적관계(부모의사소통, 부모학업지지, 친구정서지지, 교사정서지지)
- **긍정적공부마음** (6개 요인): 학업열의(활기, 몰두, 의미감), 성장력(자율성, 유능성, 관계성)
- **학습걸림돌** (10개 요인): 학업스트레스(성적부담, 공부부담, 수업부담), 학습방해물(스마트폰의존, 게임과몰입), 학업관계스트레스(부모성적압력, 부모공부부담, 친구공부비교, 교사성적압력, 교사수업부담)
- **부정적공부마음** (3개 요인): 학업소진(고갈, 무능감, 반감냉소)

### 요인 유형
- **정적 요인** (25개): 자아강점, 학습디딤돌, 긍정적공부마음 → 점수가 높을수록 좋음
- **부적 요인** (13개): 학습걸림돌, 부정적공부마음 → 점수가 낮을수록 좋음

## T점수 기준
- **매우높음** (70~100): 상위 2.3%
- **높음** (60~69): 상위 15.9%
- **보통** (40~59): 중간 68.2%
- **낮음** (30~39): 하위 15.9%
- **매우 낮음** (~29): 하위 2.3%

## 학생 유형 (LPA 분류)
### 초등학교
| 유형 | 비율 | 특징 | 지도 포인트 |
|------|------|------|-------------|
| 자원소진형 | 30.55% | 심리자원 낮음, 스트레스 높음 | 정서적 안정, 성공 경험 제공 |
| 안전균형형 | 35.47% | 전반적 균형, 점검능력 보완 필요 | 메타인지 훈련, 자기 점검 습관 |
| 몰입자원풍부형 | 33.98% | 동기 높음, 시험전략 보완 필요 | 시험 준비 전략, 불안 관리 |

### 중학교
| 유형 | 비율 | 특징 | 지도 포인트 |
|------|------|------|-------------|
| 무기력형 | 35.4% | 동기 저하, 목표 설정 어려움 | 작은 목표, 성취 경험, 관계 형성 |
| 정서조절취약형 | 38.0% | 스트레스 관리 미흡, 감정 기복 | 감정 조절 훈련, 스트레스 해소법 |
| 자기주도몰입형 | 26.6% | 자율적 학습, 높은 성취동기 | 도전 기회, 리더십 역할 |

## 응답 지침
1. **쉬운 설명**: 전문 용어를 풀어서 교사가 바로 이해할 수 있게 설명하세요.
2. **구체적 조언**: "관심을 가져주세요" 같은 추상적 조언 대신 구체적인 행동을 제안하세요.
3. **강점 우선**: 학생의 강점을 먼저 언급하고, 개선점을 부드럽게 제안하세요.
4. **별칭 사용**: 학생 이름 대신 별칭(student_A, student_B)을 그대로 사용하세요.
5. **균형 잡힌 시각**: 검사 결과는 참고 자료이며, 실제 학생 관찰과 함께 종합적으로 판단하도록 안내하세요.
6. **실천 가능성**: 교사가 교실에서 바로 적용할 수 있는 팁을 제공하세요.
7. **해요체 사용**: "~입니다", "~합니다" 대신 "~해요", "~이에요" 같은 부드러운 문체를 사용하세요.

## 컨텍스트 활용
아래에 제공되는 컨텍스트는 학생의 검사 결과와 전문가 해석 텍스트(T_SCRIPT)를 기반으로 생성되었습니다.
이 정보를 참고하여 정확하고 일관된 답변을 제공하세요.

---
{RAG_CONTEXT}
---`;

/**
 * RAG 컨텍스트를 포함한 어시스턴트 프롬프트 생성
 * @param ragContext RAG 컨텍스트 문자열
 * @returns 완성된 시스템 프롬프트
 */
export const buildAssistantPrompt = (ragContext: string): string => {
  if (!ragContext || ragContext.trim() === '') {
    return SYSTEM_PROMPT_ASSISTANT.replace(
      '---\n{RAG_CONTEXT}\n---',
      '(선택된 학생/학급 정보가 없습니다. 일반적인 질문에 답변해주세요.)'
    );
  }
  return SYSTEM_PROMPT_ASSISTANT.replace('{RAG_CONTEXT}', ragContext);
};

// ============================================================
// 프롬프트 선택 함수
// ============================================================

/**
 * 기능에 따라 해당 시스템 프롬프트 반환
 *
 * @param feature - 기능 타입
 * @returns 시스템 프롬프트 (미설정 시 빈 문자열)
 */
export const getSystemPrompt = (feature: AIFeature): string => {
  const prompts: Record<AIFeature, string> = {
    analysis: SYSTEM_PROMPT_ANALYSIS,
    record: SYSTEM_PROMPT_RECORD,
    assistant: SYSTEM_PROMPT_ASSISTANT,
  };
  return prompts[feature] || '';
};

/**
 * 특정 기능의 프롬프트가 설정되어 있는지 확인
 */
export const isPromptConfigured = (feature: AIFeature): boolean => {
  return getSystemPrompt(feature).trim().length > 0;
};

/**
 * 모든 프롬프트 설정 상태 반환
 */
export const getPromptStatus = () => ({
  analysis: isPromptConfigured('analysis'),
  record: isPromptConfigured('record'),
  assistant: isPromptConfigured('assistant'),
});

export default {
  // 프롬프트 상수
  SYSTEM_PROMPT_ANALYSIS,
  SYSTEM_PROMPT_RECORD,
  SYSTEM_PROMPT_ASSISTANT,
  // 가이드라인
  SCHOOL_LEVEL_GUIDELINES,
  OBSERVATION_PHRASES,
  TYPE_WRITING_GUIDES,
  PROHIBITED_KEYWORDS,
  // 프롬프트 선택
  getSystemPrompt,
  isPromptConfigured,
  getPromptStatus,
  // 어시스턴트 프롬프트
  buildAssistantPrompt,
  // 생활기록부 프롬프트 (복잡한 입력용)
  getSchoolRecordPrompt,
  buildSchoolRecordPrompt,
  buildSchoolRecordUserMessage,
  buildSchoolRecordMessages,
  // 생활기록부 프롬프트 (간단한 입력용 - recordGenerator 호환)
  buildSimpleRecordUserMessage,
  buildSimpleRecordMessages,
  // 유틸리티
  tScoreToLevel,
  createCategoryScore,
  checkProhibitedContent,
  validateWordCount,
  validateSchoolRecordOutput,
};
