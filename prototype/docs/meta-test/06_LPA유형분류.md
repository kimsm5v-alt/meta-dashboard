# LPA 유형 분류 알고리즘

## 1. 개요

### 1.1 LPA란?
**LPA (Latent Profile Analysis)**는 잠재 프로파일 분석으로, 학생들의 38개 T점수 패턴을 분석하여 유사한 특성을 가진 그룹(유형)으로 분류하는 통계적 방법입니다.

### 1.2 분류 목적
- 학생의 심리·학습 특성 패턴을 종합적으로 파악
- 유형별 맞춤 개입 전략 수립
- 개인화된 학습 코칭 제공

---

## 2. 유형 정의 (초등학생)

### 2.1 3가지 유형

| 유형 | 명칭 | 표본 수 | 비율 | 핵심 특징 |
|------|------|---------|------|-----------|
| Class 1 | **자원소진형** | 205명 | 30.6% | 자기효능감·정서조절 모두 낮아 내적 동기 부족 |
| Class 2 | **안전균형형** | 238명 | 35.5% | 자기효능감·자아존중감 양호, 정서조절 안정적 |
| Class 3 | **몰입자원풍부형** | 228명 | 34.0% | 자기효능감, 자아존중감, 의미감 등 내적 동기 모두 높음 |

### 2.2 사전확률 (Prior Probability) - 초등

```json
{
  "자원소진형": 0.30552,
  "안전균형형": 0.35469,
  "몰입자원풍부형": 0.33979
}
```

---

## 3. 유형 정의 (중학생)

### 3.1 3가지 유형

| 유형 | 명칭 | 비율 | 핵심 특징 |
|------|------|------|-----------|
| Class 1 | **무기력형** | 35.4% | 전반적인 동기 저하, 학업에 대한 의욕과 에너지 부족 |
| Class 2 | **정서조절 취약형** | 38.0% | 자기효능감은 있으나 정서조절에 어려움, 스트레스에 민감 |
| Class 3 | **자기주도 몰입형** | 26.6% | 자기주도적 학습 능력 높음, 내재적 동기와 몰입도 우수 |

### 3.2 사전확률 (Prior Probability) - 중등

```json
{
  "무기력형": 0.354,
  "정서조절취약형": 0.380,
  "자기주도몰입형": 0.266
}
```

### 3.3 유형별 특성 요약

#### 무기력형 (Class 1)
```
긍정적 요인: 전반적으로 낮음
부정적 요인: 높음
특징: 학업 의욕 저하, 무력감, 목표 설정 어려움
```

#### 정서조절 취약형
```
긍정적 요인: 평균 수준
부정적 요인: 평균~높음
특징: 스트레스 관리 미흡, 감정 기복, 불안 경향
```

#### 자기주도 몰입형
```
긍정적 요인: 높음
부정적 요인: 낮음
특징: 자율적 학습, 높은 성취동기, 효과적 시간관리
```

---

## 4. 유형별 프로파일 (38개 T점수 평균) - 초등

### 4.1 자원소진형 (Class 1)

```
긍정적 요인: 전반적으로 낮음 (38~46)
부정적 요인: 높음 (56~63)
학업소진: 높음 (56~58)
```

| No | 변인명 | T점수 평균 |
|----|--------|-----------|
| 1 | 자아존중감 | 38.14 |
| 2 | 자기효능감 | 37.90 |
| 3 | 성장마인드셋 | 37.23 |
| 4 | 자기정서인식 | 41.69 |
| 5 | 자기정서조절 | 42.93 |
| 6 | 타인정서인식 | 43.90 |
| 7 | 타인공감능력 | 41.06 |
| 8 | 계획능력 | 45.10 |
| 9 | 점검능력 | 44.32 |
| 10 | 조절능력 | 44.49 |
| 11 | 공부환경 | 45.41 |
| 12 | 시간관리 | 46.20 |
| 13 | 수업태도 | 41.72 |
| 14 | 노트하기 | 45.68 |
| 15 | 시험준비 | 49.34 |
| 16 | 부모의사소통 | 42.81 |
| 17 | 부모학업지지 | 42.46 |
| 18 | 친구정서지지 | 42.50 |
| 19 | 교사정서지지 | 43.11 |
| 20 | 활기 | 52.71 |
| 21 | 몰두 | 52.01 |
| 22 | 의미감 | 58.82 |
| 23 | 자율성 | 53.31 |
| 24 | 유능성 | 59.82 |
| 25 | 관계성 | 58.07 |
| 26 | 성적부담 | 56.97 |
| 27 | 공부부담 | 60.13 |
| 28 | 수업부담 | 63.02 |
| 29 | 스마트폰의존 | 57.45 |
| 30 | 게임과몰입 | 41.53 |
| 31 | 부모성적압력 | 49.96 |
| 32 | 부모공부부담 | 44.27 |
| 33 | 친구공부비교 | 42.98 |
| 34 | 교사성적압력 | 35.82 |
| 35 | 교사수업부담 | 38.66 |
| 36 | 고갈 | 56.18 |
| 37 | 무능감 | 58.68 |
| 38 | 반감냉소 | 57.10 |

### 4.2 안전균형형 (Class 2)

```
긍정적 요인: 평균 수준 (47~52)
부정적 요인: 평균~약간 높음 (47~54)
학업소진: 평균 수준 (48~52)
```

### 4.3 몰입자원풍부형 (Class 3)

```
긍정적 요인: 높음 (54~76)
부정적 요인: 낮음 (44~47)
학업소진: 낮음 (43~45)
```

---

## 5. 분류 알고리즘

### 5.1 전체 흐름

```
입력: 학생 38개 T점수
  ↓
Step 1: 로그 우도 계산 (각 유형과의 통계적 거리)
  ↓
Step 2: 사전확률 반영 (베이즈 정리)
  ↓
Step 3: 정규화 (Log-Sum-Exp)
  ↓
Step 4: 최대값 선택
  ↓
출력: 예측 유형 + 신뢰도(%)
```

### 5.2 입출력 명세

```typescript
// 입력
interface LPAInput {
  scores: number[];  // 정확히 38개 T점수 (20~80 범위)
}

// 출력
interface LPAOutput {
  predictedType: string;  // "자원소진형" | "안전균형형" | "몰입자원풍부형"
  confidence: number;     // 해당 유형의 확률 (0-100%)
}
```

### 5.3 Step 1: 로그 우도 계산

**목적**: 학생 데이터가 각 유형에서 나올 통계적 확률 계산

**공식**:
```
log L(유형|학생) = Σ[i=1 to 38] -0.5 × [(학생[i] - 유형평균[i])² / 100 + log(2π×100)]
```

**구현**:
```javascript
function calculateLogLikelihood(studentScores, profileMeans) {
  let logLikelihood = 0;
  const variance = 100;  // T점수 분산 (SD=10)
  const logConstant = Math.log(2 * Math.PI * variance);
  
  for (let i = 0; i < 38; i++) {
    const diff = studentScores[i] - profileMeans[i];
    const squaredError = (diff * diff) / variance;
    logLikelihood += -0.5 * (squaredError + logConstant);
  }
  
  return logLikelihood;
}
```

### 5.4 Step 2: 사전확률 반영

**목적**: 유형별 빈도 정보 반영 (희귀 유형 과진단 방지)

**공식**:
```
log P(유형|학생) = log L(학생|유형) + log P(유형)
```

**구현**:
```javascript
function applyPrior(logLikelihoods, priors) {
  const logPosteriors = {};
  
  for (const [typeName, logLikelihood] of Object.entries(logLikelihoods)) {
    logPosteriors[typeName] = logLikelihood + Math.log(priors[typeName]);
  }
  
  return logPosteriors;
}
```

### 5.5 Step 3: 정규화 (Log-Sum-Exp)

**목적**: 수치 안정성 확보 + 확률 합 = 100%

**공식**:
```
1. max = max(모든 log_posterior)
2. exp_values[i] = exp(log_posterior[i] - max)
3. sum = Σ exp_values
4. probability[i] = (exp_values[i] / sum) × 100
```

**구현**:
```javascript
function normalize(logPosteriors) {
  const maxLogPosterior = Math.max(...Object.values(logPosteriors));
  
  const expPosteriors = {};
  for (const [typeName, logPost] of Object.entries(logPosteriors)) {
    expPosteriors[typeName] = Math.exp(logPost - maxLogPosterior);
  }
  
  const sumExp = Object.values(expPosteriors).reduce((a, b) => a + b, 0);
  
  const probabilities = {};
  for (const [typeName, expPost] of Object.entries(expPosteriors)) {
    probabilities[typeName] = (expPost / sumExp) * 100;
  }
  
  return probabilities;
}
```

### 5.6 Step 4: 최대값 선택

```javascript
function selectPredictedType(probabilities) {
  const sorted = Object.entries(probabilities)
    .sort((a, b) => b[1] - a[1]);
  
  return {
    predictedType: sorted[0][0],
    confidence: sorted[0][1]
  };
}
```

---

## 6. 전체 구현 코드

```javascript
// 프로파일 데이터 구조
const profileData = {
  profiles: [
    {
      name: "자원소진형",
      means: [38.14, 37.90, 37.23, /* ... 38개 */]
    },
    {
      name: "안전균형형",
      means: [52.01, 50.91, 50.68, /* ... 38개 */]
    },
    {
      name: "몰입자원풍부형",
      means: [55.82, 56.08, 54.19, /* ... 38개 */]
    }
  ],
  priors: {
    "자원소진형": 0.30552,
    "안전균형형": 0.35469,
    "몰입자원풍부형": 0.33979
  }
};

// 메인 분류 함수
function classifyStudent(studentScores, profileData) {
  // 입력 검증
  if (studentScores.length !== 38) {
    throw new Error('38개 T점수가 필요합니다.');
  }
  
  // Step 1: 로그 우도 계산
  const logLikelihoods = {};
  for (const profile of profileData.profiles) {
    logLikelihoods[profile.name] = 
      calculateLogLikelihood(studentScores, profile.means);
  }
  
  // Step 2: 사전확률 반영
  const logPosteriors = applyPrior(logLikelihoods, profileData.priors);
  
  // Step 3: 정규화
  const probabilities = normalize(logPosteriors);
  
  // Step 4: 최대값 선택
  const result = selectPredictedType(probabilities);
  
  return result;
}

// 사용 예시
const studentScores = [
  35, 41, 38, 37, 41, 49, 34, 44, 48, 41,
  43, 46, 46, 44, 48, 42, 49, 50, 46, 54,
  54, 63, 50, 64, 54, 55, 63, 59, 57, 39,
  49, 36, 38, 34, 42, 55, 59, 59
];

const result = classifyStudent(studentScores, profileData);
console.log(result);
// { predictedType: "자원소진형", confidence: 99.0 }
```

---

## 7. 유형별 특성 및 개입 전략 (초등)

### 7.1 자원소진형

**특성**:
- 자기효능감·정서조절 모두 낮아 내적 동기 부족
- 학습 목표 설정·전략 실행력 미흡 → 계획 실행의 어려움
- 학습 의지는 있으나 시간관리 효율성 낮음

**개입 전략**:
1. **순차적 개입**: 자기효능감과 자아존중감을 동시에 높이지 말고, 먼저 작은 성공 경험 제공
2. **과정 피드백**: 결과(점수)가 아닌 노력 과정을 구체적으로 인정
3. **자기비교 유도**: 또래 비교가 아닌 "한 달 전 나"와의 비교

### 7.2 안전균형형

**특성**:
- 자기효능감·자아존중감 양호, 정서조절 안정적
- 전반적으로 균형 잡힌 상태
- 추가적인 성장 가능성 있음

**개입 전략**:
1. 현재 강점 유지 및 강화
2. 약한 영역 점진적 개선
3. 목표 설정을 통한 동기 부여

### 7.3 몰입자원풍부형

**특성**:
- 자기효능감, 자아존중감, 의미감 등 내적 동기 모두 높음
- 학습 자원이 풍부함
- 높은 학업 성취 가능성

**개입 전략**:
1. 자율적 학습 환경 제공
2. 심화 학습 기회 제공
3. 리더십 역할 부여

---

## 8. 유형별 특성 및 개입 전략 (중등)

### 7.1 무기력형

**특성**:
- 학업에 대한 전반적인 동기와 의욕 저하
- 목표 설정 및 계획 수립 능력 부족
- 학습된 무기력 상태 가능성
- 자기효능감과 자아존중감 모두 낮음

**개입 전략**:
1. **관계 형성 우선**: 신뢰 관계 구축 후 학습 개입
2. **아주 작은 목표부터**: 달성 가능한 미니 목표 설정으로 성공 경험 축적
3. **무조건적 지지**: 결과와 관계없이 노력 자체를 인정
4. **선택권 부여**: 학습 내용/방법에 대한 자율성 제공으로 주인의식 회복

### 7.2 정서조절 취약형

**특성**:
- 기본적인 능력은 있으나 정서적 안정성 부족
- 스트레스 상황에서 감정 조절 어려움
- 시험 불안, 성적 압박에 민감
- 감정 기복이 학습에 영향

**개입 전략**:
1. **정서 조절 기술 훈련**: 호흡법, 마인드풀니스 등 구체적 기법 안내
2. **스트레스 원인 파악**: 학업관계스트레스 원인 탐색 및 해소
3. **안전한 표현 기회**: 감정을 표현할 수 있는 안전한 공간 마련
4. **단계적 노출**: 스트레스 상황에 점진적으로 적응할 수 있도록 지원

### 7.3 자기주도 몰입형

**특성**:
- 내재적 동기와 자기 주도성이 높음
- 효과적인 학습 전략 보유
- 시간 관리 및 계획 능력 우수
- 학업 성취도 높음

**개입 전략**:
1. **자율성 극대화**: 학습 방향과 속도를 스스로 결정하도록 지원
2. **심화 과제 제공**: 도전적인 과제로 성장 기회 제공
3. **멘토링 역할**: 또래 멘토로서의 역할 부여
4. **진로 탐색 지원**: 관심 분야에 대한 심층 탐구 기회 제공

---

## 9. 학교급별 유형 비교

| 구분 | 초등 | 중등 |
|------|------|------|
| 유형 1 | 자원소진형 (30.6%) | 무기력형 (35.4%) |
| 유형 2 | 안전균형형 (35.5%) | 정서조절 취약형 (38.0%) |
| 유형 3 | 몰입자원풍부형 (34.0%) | 자기주도 몰입형 (26.6%) |
| **특징** | 심리적 자원의 소진 정도에 초점 | 동기 및 정서조절 능력에 초점 |

---

## 10. API 데이터 모델

### 10.1 프로파일 데이터 (JSON)

```json
{
  "version": "1.0",
  "schoolLevel": "elementary",
  "profiles": [
    {
      "name": "자원소진형",
      "code": "CLASS1",
      "sampleSize": 205,
      "proportion": 0.30552,
      "means": [38.14, 37.90, 37.23, ...]
    },
    ...
  ],
  "variableOrder": [
    "자아존중감", "자기효능감", "성장마인드셋", ...
  ]
}
```

### 10.2 분류 결과 (TypeScript)

```typescript
interface LPAClassificationResult {
  studentId: string;
  predictedType: string;
  predictedTypeCode: string;
  confidence: number;
  allProbabilities: {
    [typeName: string]: number;
  };
  rank: Array<{
    typeName: string;
    probability: number;
  }>;
  timestamp: string;
}
```

---

## 11. 성능 참고

```
시간 복잡도: O(N × M)
- N = 요인 개수 (38)
- M = 유형 개수 (3)
→ O(114) = 상수 시간

예상 실행 시간:
- 학생 1명: 0.1-0.5ms
- 학생 1000명: 100-500ms
```

---

## 12. 유형별 조절효과 (개입 전략의 핵심)

### 12.1 자원소진형 → 긍정완충 효과

```
자기효능감 × 자아존중감 → 학업성취도
효과: 긍정완충 (둘 다 높이면 오히려 효과 감소)
전략: 순차적 개입 - 효능감 먼저, 자존감은 나중에
이유: 동시 강화 시 심리적 부하 증가
```

### 12.2 안전균형형 → 긍정강화 효과

```
시간관리 × 계획능력 → 학업성취도
효과: 긍정강화 (둘 다 높이면 시너지)
전략: 동시 개입 - 플래너 활용, 시간 블록 설계
이유: 계획과 시간관리가 결합되면 실행력 극대화
```

### 12.3 몰입자원풍부형 → 직접효과

```
시험준비 → 학업성취도
효과: 직접효과 (조절변수 없이 직접 영향)
전략: 시험 전략 명시적 지도, 도전과제 제공
이유: 내적 동기는 높은데 시험 기술만 부족
```
