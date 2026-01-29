/**
 * META 학습심리정서검사 - LPA 학생 유형 분류 알고리즘
 * 
 * @version 1.0
 * @date 2026-01-29
 * 
 * 사용법:
 * 1. lpa_profile_data.json 로드
 * 2. classifyStudent(학생T점수배열, 학교급, 프로파일데이터) 호출
 */

/**
 * Step 1: 로그 우도 계산 (Log-Likelihood)
 * 학생 데이터가 각 유형에서 나올 통계적 확률 계산
 * 
 * @param {number[]} studentScores - 학생의 38개 T점수
 * @param {number[]} profileMeans - 유형의 38개 중심값
 * @returns {number} 로그 우도 값
 */
function calculateLogLikelihood(studentScores, profileMeans) {
  let logLikelihood = 0;
  const variance = 100;  // T점수 분산 (SD=10의 제곱)
  const logConstant = Math.log(2 * Math.PI * variance);
  
  for (let i = 0; i < 38; i++) {
    const diff = studentScores[i] - profileMeans[i];
    const squaredError = (diff * diff) / variance;
    logLikelihood += -0.5 * (squaredError + logConstant);
  }
  
  return logLikelihood;
}

/**
 * Step 2: 사전확률 반영 (Apply Prior - Bayes)
 * 유형별 빈도 정보 반영하여 희귀 유형 과진단 방지
 * 
 * @param {Object} logLikelihoods - 유형별 로그 우도
 * @param {Object} priors - 유형별 사전확률
 * @returns {Object} 로그 사후확률
 */
function applyPrior(logLikelihoods, priors) {
  const logPosteriors = {};
  
  for (const [typeName, logLikelihood] of Object.entries(logLikelihoods)) {
    logPosteriors[typeName] = logLikelihood + Math.log(priors[typeName]);
  }
  
  return logPosteriors;
}

/**
 * Step 3: Log-Sum-Exp 정규화
 * 수치 안정성 확보 + 확률 합 = 100%
 * 
 * @param {Object} logPosteriors - 로그 사후확률
 * @returns {Object} 정규화된 확률 (%)
 */
function normalize(logPosteriors) {
  // 1. 최대값 찾기 (수치 안정성)
  const maxLogPosterior = Math.max(...Object.values(logPosteriors));
  
  // 2. 지수 계산
  const expPosteriors = {};
  for (const [typeName, logPost] of Object.entries(logPosteriors)) {
    expPosteriors[typeName] = Math.exp(logPost - maxLogPosterior);
  }
  
  // 3. 합 계산
  const sumExp = Object.values(expPosteriors).reduce((a, b) => a + b, 0);
  
  // 4. 확률 계산 (%)
  const probabilities = {};
  for (const [typeName, expPost] of Object.entries(expPosteriors)) {
    probabilities[typeName] = (expPost / sumExp) * 100;
  }
  
  return probabilities;
}

/**
 * Step 4: 최대값 선택
 * 
 * @param {Object} probabilities - 유형별 확률
 * @returns {Object} 예측 결과
 */
function selectPredictedType(probabilities) {
  const sorted = Object.entries(probabilities)
    .sort((a, b) => b[1] - a[1]);
  
  return {
    predictedType: sorted[0][0],
    confidence: Math.round(sorted[0][1] * 10) / 10,
    rank: sorted.map(([name, prob]) => ({
      typeName: name,
      probability: Math.round(prob * 10) / 10
    }))
  };
}

/**
 * 메인 분류 함수
 * 
 * @param {number[]} studentScores - 학생의 38개 T점수 배열
 * @param {string} schoolLevel - 학교급 ("초등" | "중등")
 * @param {Object} profileData - 프로파일 데이터 (JSON)
 * @returns {Object} 분류 결과
 * 
 * @example
 * const result = classifyStudent(scores, "초등", profileData);
 * // { predictedType: "자원소진형", confidence: 99.0, allProbabilities: {...}, rank: [...] }
 */
function classifyStudent(studentScores, schoolLevel, profileData) {
  // 입력 검증
  if (!studentScores || studentScores.length !== 38) {
    throw new Error('38개 T점수가 필요합니다. 현재: ' + (studentScores?.length || 0) + '개');
  }
  
  // 학교급 데이터 확인
  const schoolData = profileData[schoolLevel];
  if (!schoolData) {
    throw new Error(`'${schoolLevel}' 학교급 데이터가 없습니다. 사용 가능: ${Object.keys(profileData).filter(k => k !== 'factors' && k !== 'factorCategories' && k !== 'version' && k !== 'lastUpdated').join(', ')}`);
  }
  
  // 중심값 데이터 확인
  const hasValidMeans = schoolData.types.every(t => t.means && t.means.length === 38);
  if (!hasValidMeans) {
    throw new Error(`'${schoolLevel}' 프로파일의 중심값(means) 데이터가 없거나 불완전합니다.`);
  }
  
  // Step 1: 로그 우도 계산
  const logLikelihoods = {};
  for (const profile of schoolData.types) {
    logLikelihoods[profile.name] = calculateLogLikelihood(studentScores, profile.means);
  }
  
  // Step 2: 사전확률 반영
  const logPosteriors = applyPrior(logLikelihoods, schoolData.priors);
  
  // Step 3: 정규화
  const probabilities = normalize(logPosteriors);
  
  // Step 4: 최대값 선택
  const result = selectPredictedType(probabilities);
  
  return {
    schoolLevel,
    predictedType: result.predictedType,
    confidence: result.confidence,
    allProbabilities: probabilities,
    rank: result.rank
  };
}

/**
 * 유형별 특이점 추출
 * 학생의 T점수가 유형 평균과 가장 큰 차이를 보이는 요인 3개 추출
 * 
 * @param {number[]} studentScores - 학생의 38개 T점수
 * @param {string} typeName - 유형명
 * @param {string} schoolLevel - 학교급
 * @param {Object} profileData - 프로파일 데이터
 * @returns {Array} 특이점 배열 [{factor, diff, direction}, ...]
 */
function getTypeDeviations(studentScores, typeName, schoolLevel, profileData) {
  const schoolData = profileData[schoolLevel];
  const profile = schoolData.types.find(t => t.name === typeName);
  const factors = profileData.factors;
  
  if (!profile) {
    throw new Error(`'${typeName}' 유형을 찾을 수 없습니다.`);
  }
  
  const deviations = [];
  for (let i = 0; i < 38; i++) {
    const diff = studentScores[i] - profile.means[i];
    deviations.push({
      index: i,
      factor: factors[i],
      studentScore: studentScores[i],
      typeMean: Math.round(profile.means[i] * 10) / 10,
      diff: Math.round(diff * 10) / 10,
      absDiff: Math.abs(diff),
      direction: diff > 0 ? 'positive' : 'negative'  // positive: 학생이 유형 평균보다 높음
    });
  }
  
  // 절대값 기준 정렬 후 상위 3개
  return deviations
    .sort((a, b) => b.absDiff - a.absDiff)
    .slice(0, 3);
}

// Export for Node.js / ES Module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    classifyStudent,
    getTypeDeviations,
    calculateLogLikelihood,
    applyPrior,
    normalize,
    selectPredictedType
  };
}

// Export for browser
if (typeof window !== 'undefined') {
  window.LPAClassifier = {
    classifyStudent,
    getTypeDeviations
  };
}
