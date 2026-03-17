# META 학습종합검사 API 데이터 모델

## 1. 개요

이 문서는 META 학습종합검사 API 개발을 위한 데이터 모델과 인터페이스를 정의합니다.

---

## 2. 핵심 엔티티

### 2.1 검사 구조

```typescript
// 측정 영역 (Depth 1~3)
interface MeasurementArea {
  code: string;                    // "SELF_STRENGTH", "POSITIVE_SELF", "SELF_ESTEEM"
  name: string;                    // "자아 강점", "긍정적 자아", "자아존중감"
  fullName: string;                // "자아 강점>긍정적 자아>자아존중감"
  depth: 1 | 2 | 3;
  factorType: 'positive' | 'negative';  // 정적/부적
  parentCode: string | null;       // 상위 영역 코드
  childCodes: string[];            // 하위 영역 코드 목록
}

// 문항
interface QuestionItem {
  questionId: number;              // 원래 문항번호
  displayOrder: number;            // 제시 순서 (셔플링 적용)
  depth1Code: string;              // 대분류 코드
  depth2Code: string;              // 중분류 코드
  depth3Code: string;              // 변인명 코드
  content: string;                 // 문항 내용
  factorType: 'positive' | 'negative';
  isReversed: boolean;             // 역채점 여부
  isReliabilityItem: boolean;      // 신뢰도 문항 여부
  reliabilityType?: 'socialDesirability' | 'responseConsistency';
  pairedQuestionId?: number;       // 반응일관성 쌍 문항 ID
}
```

### 2.2 기준 데이터 (Norm Data)

```typescript
// 학교급별 기준 데이터
interface NormData {
  schoolLevel: 'elementary' | 'middle' | 'high';
  version: string;                 // "2025.04"
  areas: {
    [areaCode: string]: {
      mean: number;                // 평균
      sd: number;                  // 표준편차
    };
  };
  reliabilityNorms: {
    socialDesirability: { mean: number; sd: number; };
    responseConsistency: {
      indicator1: { mean: number; sd: number; };
      indicator2: { mean: number; sd: number; };
      indicator3: { mean: number; sd: number; };
    };
  };
}
```

### 2.3 LPA 프로파일 데이터

```typescript
interface LPAProfileData {
  version: string;
  schoolLevel: 'elementary' | 'middle' | 'high';
  profiles: Array<{
    name: string;                  // "자원소진형"
    code: string;                  // "CLASS1"
    sampleSize: number;            // 205
    proportion: number;            // 0.30552
    means: number[];               // 38개 T점수 평균
  }>;
  variableOrder: string[];         // 38개 변인명 순서
}
```

---

## 3. 검사 응답 및 결과

### 3.1 검사 응답

```typescript
// 개별 문항 응답
interface QuestionResponse {
  questionId: number;
  displayOrder: number;
  response: 1 | 2 | 3 | 4 | 5;
  responseTime?: number;           // 응답 소요시간 (ms)
}

// 검사 응답 전체
interface TestResponse {
  testId: string;                  // 검사 세션 ID
  studentId: string;
  schoolLevel: 'elementary' | 'middle' | 'high';
  grade: number;                   // 학년
  classNumber: number;             // 반
  studentNumber: number;           // 번호
  testDate: string;                // ISO 8601 형식
  responses: QuestionResponse[];
  totalTime: number;               // 총 소요시간 (초)
  metadata?: {
    deviceType?: string;
    browserInfo?: string;
  };
}
```

### 3.2 점수 계산 결과

```typescript
// 변인별 점수 (Depth 3)
interface VariableScore {
  code: string;                    // 변인 코드
  name: string;                    // 변인명
  rawMean: number;                 // 원점수 평균
  tScore: number;                  // T점수 (정수)
  percentile: number;              // 백분위
  level: '매우낮음' | '낮음' | '보통' | '높음' | '매우높음';
  levelColor: string;              // 색상 코드
  questionIds: number[];           // 해당 문항 ID 목록
}

// 영역별 점수 (Depth 1, 2)
interface AreaScore {
  code: string;
  name: string;
  depth: 1 | 2;
  tScore: number;
  percentile: number;
  level: string;
  levelColor: string;
  childScores: VariableScore[] | AreaScore[];  // 하위 점수
}
```

### 3.3 신뢰도 지표 결과

```typescript
interface ReliabilityResult {
  socialDesirability: {
    rawMean: number;
    tScore: number;
    isWarning: boolean;
    status: '양호' | '주의';
    color: string;
  };
  responseConsistency: {
    indicators: [number, number, number];
    tScores: [number, number, number];
    averageTScore: number;
    isWarning: boolean;
    status: '양호' | '주의';
    color: string;
  };
  consecutiveSameResponse: {
    maxConsecutive: number;
    isWarning: boolean;
    result: '예' | '아니오';
    color: string;
  };
  overall: {
    isReliable: boolean;
    warningCount: number;
    excludeFromClassAverage: boolean;
    warningMessages: string[];
  };
}
```

### 3.4 LPA 분류 결과

```typescript
interface LPAClassificationResult {
  predictedType: string;           // "자원소진형"
  predictedTypeCode: string;       // "CLASS1"
  confidence: number;              // 99.0 (%)
  allProbabilities: {
    [typeName: string]: number;    // 각 유형별 확률
  };
  rank: Array<{
    typeName: string;
    typeCode: string;
    probability: number;
  }>;
  characteristics: string[];       // 유형별 특성 설명
  interventionStrategies: string[]; // 개입 전략
}
```

### 3.5 종합 검사 결과

```typescript
interface TestResult {
  // 기본 정보
  testId: string;
  studentId: string;
  studentName: string;
  schoolName: string;
  schoolLevel: 'elementary' | 'middle' | 'high';
  grade: number;
  classNumber: number;
  studentNumber: number;
  testDate: string;
  testOrder: number;               // 1차, 2차 등
  
  // 신뢰도
  reliability: ReliabilityResult;
  
  // 점수 결과
  scores: {
    depth1: AreaScore[];           // 5개 대분류
    depth2: AreaScore[];           // 11개 중분류
    depth3: VariableScore[];       // 38개 변인
  };
  
  // LPA 분류
  lpaClassification: LPAClassificationResult;
  
  // 해석 스크립트
  interpretations: {
    [areaCode: string]: {
      script: string;              // 해석 문구
      level: string;
      color: string;
    };
  };
  
  // 종합 해석
  summary: {
    strengths: string[];           // 강점 영역
    weaknesses: string[];          // 약점 영역
    recommendations: string[];     // 권장 사항
  };
  
  // 메타 정보
  generatedAt: string;
  version: string;
}
```

---

## 4. API 엔드포인트 설계

### 4.1 검사 관리

```
POST   /api/tests                    # 검사 응답 제출
GET    /api/tests/{testId}           # 검사 결과 조회
GET    /api/tests/{testId}/report    # 결과 보고서 조회
DELETE /api/tests/{testId}           # 검사 결과 삭제
```

### 4.2 학생/학급 관리

```
GET    /api/students/{studentId}/tests     # 학생별 검사 이력
GET    /api/classes/{classId}/tests        # 학급별 검사 결과
GET    /api/classes/{classId}/average      # 학급 평균 (신뢰도 미달 제외)
```

### 4.3 기준 데이터

```
GET    /api/norms/{schoolLevel}            # 학교급별 기준 데이터
GET    /api/lpa-profiles/{schoolLevel}     # LPA 프로파일 데이터
GET    /api/interpretation-scripts         # 해석 스크립트 목록
```

---

## 5. 점수 계산 로직

### 5.1 T점수 계산

```typescript
function calculateTScore(
  rawMean: number,
  normMean: number,
  normSD: number
): number {
  const zScore = (rawMean - normMean) / normSD;
  const tScore = zScore * 10 + 50;
  return Math.round(tScore);  // 반올림
}
```

### 5.2 등급 판정

```typescript
function getLevel(tScore: number): {
  level: string;
  colorTeacher: string;
  colorStudent: string;
} {
  if (tScore < 30) {
    return { level: '매우낮음', colorTeacher: '빨강', colorStudent: '빨강' };
  } else if (tScore < 40) {
    return { level: '낮음', colorTeacher: '노랑', colorStudent: '빨강' };
  } else if (tScore < 60) {
    return { level: '보통', colorTeacher: '', colorStudent: '초록' };
  } else if (tScore < 70) {
    return { level: '높음', colorTeacher: '', colorStudent: '파랑' };
  } else {
    return { level: '매우높음', colorTeacher: '', colorStudent: '파랑' };
  }
}
```

### 5.3 LPA 분류

```typescript
function classifyLPA(
  tScores38: number[],
  profileData: LPAProfileData
): LPAClassificationResult {
  // Step 1: 로그 우도 계산
  const logLikelihoods: { [name: string]: number } = {};
  for (const profile of profileData.profiles) {
    logLikelihoods[profile.name] = calculateLogLikelihood(tScores38, profile.means);
  }
  
  // Step 2: 사전확률 반영
  const logPosteriors: { [name: string]: number } = {};
  for (const profile of profileData.profiles) {
    logPosteriors[profile.name] = 
      logLikelihoods[profile.name] + Math.log(profile.proportion);
  }
  
  // Step 3: 정규화 (Log-Sum-Exp)
  const maxLogPost = Math.max(...Object.values(logPosteriors));
  const expPosteriors: { [name: string]: number } = {};
  for (const [name, logPost] of Object.entries(logPosteriors)) {
    expPosteriors[name] = Math.exp(logPost - maxLogPost);
  }
  const sumExp = Object.values(expPosteriors).reduce((a, b) => a + b, 0);
  
  const probabilities: { [name: string]: number } = {};
  for (const [name, expPost] of Object.entries(expPosteriors)) {
    probabilities[name] = (expPost / sumExp) * 100;
  }
  
  // Step 4: 결과 생성
  const sorted = Object.entries(probabilities)
    .sort((a, b) => b[1] - a[1]);
  
  return {
    predictedType: sorted[0][0],
    predictedTypeCode: profileData.profiles
      .find(p => p.name === sorted[0][0])?.code || '',
    confidence: Math.round(sorted[0][1] * 10) / 10,
    allProbabilities: probabilities,
    rank: sorted.map(([name, prob]) => ({
      typeName: name,
      typeCode: profileData.profiles.find(p => p.name === name)?.code || '',
      probability: Math.round(prob * 10) / 10
    })),
    characteristics: [],  // 별도 데이터에서 조회
    interventionStrategies: []
  };
}

function calculateLogLikelihood(
  studentScores: number[],
  profileMeans: number[]
): number {
  const variance = 100;  // T점수 분산
  const logConstant = Math.log(2 * Math.PI * variance);
  
  let logLikelihood = 0;
  for (let i = 0; i < 38; i++) {
    const diff = studentScores[i] - profileMeans[i];
    const squaredError = (diff * diff) / variance;
    logLikelihood += -0.5 * (squaredError + logConstant);
  }
  
  return logLikelihood;
}
```

---

## 6. 데이터베이스 스키마 (참고)

### 6.1 핵심 테이블

```sql
-- 검사 결과
CREATE TABLE test_results (
  test_id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  school_level VARCHAR(20) NOT NULL,
  grade INT NOT NULL,
  class_number INT NOT NULL,
  student_number INT NOT NULL,
  test_date DATE NOT NULL,
  test_order INT DEFAULT 1,
  is_reliable BOOLEAN DEFAULT TRUE,
  lpa_type VARCHAR(50),
  lpa_confidence DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 영역별 점수
CREATE TABLE test_scores (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  test_id VARCHAR(36) NOT NULL,
  area_code VARCHAR(50) NOT NULL,
  depth INT NOT NULL,
  raw_mean DECIMAL(5,3),
  t_score INT,
  percentile DECIMAL(5,2),
  level VARCHAR(20),
  FOREIGN KEY (test_id) REFERENCES test_results(test_id)
);

-- 문항별 응답
CREATE TABLE question_responses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  test_id VARCHAR(36) NOT NULL,
  question_id INT NOT NULL,
  display_order INT NOT NULL,
  response INT NOT NULL,
  response_time INT,
  FOREIGN KEY (test_id) REFERENCES test_results(test_id)
);
```

---

## 7. 코드 구분 체계

### 7.1 영역 코드

| Depth | 한글명 | 코드 |
|-------|--------|------|
| 1 | 자아 강점 | SELF_STRENGTH |
| 1 | 학습 디딤돌 | LEARNING_STEPPING |
| 1 | 학습 걸림돌 | LEARNING_OBSTACLE |
| 1 | 긍정적 공부마음 | POSITIVE_MIND |
| 1 | 부정적 공부마음 | NEGATIVE_MIND |
| 2 | 긍정적 자아 | POSITIVE_SELF |
| 2 | 대인관계능력 | INTERPERSONAL |
| 2 | 메타인지 | METACOGNITION |
| ... | ... | ... |

### 7.2 LPA 유형 코드

| 유형명 | 코드 |
|--------|------|
| 자원소진형 | CLASS1 |
| 안전균형형 | CLASS2 |
| 몰입자원풍부형 | CLASS3 |

### 7.3 등급 코드

| 등급 | 코드 |
|------|------|
| 매우 낮음 | VERY_LOW |
| 낮음 | LOW |
| 보통 | NORMAL |
| 높음 | HIGH |
| 매우 높음 | VERY_HIGH |

---

## 8. 구현 체크리스트

```
□ 기준 데이터 (Norm) 관리 API
□ 문항 데이터 관리 API
□ 검사 응답 제출 API
□ T점수 계산 로직
□ 등급 판정 로직
□ 신뢰도 지표 계산 로직
□ LPA 분류 알고리즘
□ 해석 스크립트 조회 로직
□ 결과 보고서 생성 로직
□ 학급 평균 계산 로직 (신뢰도 미달 제외)
□ PDF 결과지 생성
□ 데이터 내보내기 (Excel)
```
