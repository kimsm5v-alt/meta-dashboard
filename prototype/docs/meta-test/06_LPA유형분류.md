# LPA 유형 분류 서비스 — 개발 가이드

> **버전**: 1.0
> **최종 수정**: 2026-03-23
> **연구 기반**: Mplus 8.11 LPA 3-class 모델 (초등 n=671, 중등 n=387)
> **검증**: Mplus 분류 결과와 100% 일치 확인 완료

---

## 1. 서비스 개요

### 1.1 이 서비스가 하는 일

META 학습종합검사의 **38개 학습심리요인 T점수**를 기반으로, 학생을 **3가지 학습 프로파일 유형** 중 하나로 자동 분류합니다. 분류 결과는 그래프DB에서 해당 유형에 맞는 코칭 콘텐츠를 조회하는 데 사용됩니다.

**초등 유형:**
- **자원소진형**: 학습소진·부담이 높고, 자아존중감·자기효능감이 낮은 유형
- **안전 균형형**: 전반적으로 평균 수준의 균형잡힌 유형
- **몰입자원 풍부형**: 학습몰입·자원이 풍부하고, 소진이 낮은 유형

**중등 유형:**
- **냉소적 무기력형**: 학습소진·부담이 높고, 자아존중감·자기효능감이 낮은 유형
- **정서조절 취약형**: 전반적으로 평균 수준이나 정서조절에 취약한 유형
- **자기주도 몰입형**: 학습몰입·자원이 풍부하고, 소진이 낮은 유형

### 1.2 전체 서비스 흐름

```
학생 검사 응답 (124문항)
    │
    ▼
[기존 서비스] 38개 요인 평균 계산 → T점수 변환
    │
    ▼
[이 문서의 범위] T점수 38개 + school_type → LPA 유형 분류
    │
    ├── predicted_type  (예: 초등 "자원소진형", 중등 "냉소적 무기력형")
    ├── probabilities   (각 유형별 사후확률)
    └── school_type     (예: "elementary")
    │
    ▼
[그래프DB 조회] school_type + predicted_type으로 해당 유형의 코칭 콘텐츠 조회
    │
    ▼
학생에게 맞춤 결과 제공
```

> T점수 변환과 그래프DB 조회는 이미 구현되어 있으므로, **이 문서는 T점수 입력 → LPA 유형 분류 부분만** 다룹니다.

---

## 2. 입출력 스펙

### 2.1 입력 (Request)

```json
{
  "school_type": "elementary",
  "scores": {
    "자아존중감": 52.01,
    "자기효능감": 50.91,
    "성장마인드셋": 50.68,
    "자기정서인식": 49.57,
    "자기정서조절": 47.60,
    "타인정서인식": 49.36,
    "타인공감능력": 46.98,
    "계획능력": 46.77,
    "점검능력": 45.49,
    "조절능력": 47.50,
    "공부환경": 47.44,
    "시간관리": 46.13,
    "수업태도": 48.09,
    "노트하기": 47.11,
    "시험준비": 50.14,
    "부모 의사소통": 49.36,
    "부모 학업지지": 50.02,
    "친구 정서지지": 49.43,
    "교사 정서지지": 49.19,
    "활기": 46.38,
    "몰두": 46.84,
    "의미감": 47.15,
    "자율성": 47.46,
    "유능성": 49.60,
    "관계성": 50.75,
    "성적부담": 49.28,
    "공부부담": 51.10,
    "수업부담": 50.50,
    "스마트폰 의존": 50.21,
    "게임 과몰입": 49.11,
    "부모 성적압력": 49.65,
    "부모 공부부담": 49.82,
    "친구 공부비교": 48.79,
    "교사 성적압력": 48.18,
    "교사 수업부담": 49.37,
    "고갈": 51.03,
    "무능감": 48.01,
    "반감-냉소": 51.73
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| school_type | string | O | `"elementary"` (초등) 또는 `"middle"` (중등) |
| scores | object | O | 38개 요인명을 key, T점수를 value로 하는 객체 |

### 2.2 출력 (Response)

```json
{
  "success": true,
  "data": {
    "predicted_type": "안전 균형형",
    "probabilities": {
      "자원소진형": 0.000036,
      "안전 균형형": 0.999961,
      "몰입자원 풍부형": 0.000003
    },
    "school_type": "elementary"
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| predicted_type | string | 가장 확률이 높은 유형명 |
| probabilities | object | 각 유형에 속할 사후확률 (합 = 1.0) |

### 2.3 유형 정의

| 학교급 | 유형명 | 사전확률 |
|--------|--------|----------|
| 초등 | 자원소진형 | 30.5% |
| 초등 | 안전 균형형 | 35.4% |
| 초등 | 몰입자원 풍부형 | 34.1% |
| 중등 | 냉소적 무기력형 | 35.4% |
| 중등 | 정서조절 취약형 | 26.6% |
| 중등 | 자기주도 몰입형 | 38.1% |

### 2.4 유형별 설명 (UI 툴팁용)

#### 초등

| 유형명 | 설명 |
|--------|------|
| 자원소진형 | 학습에 필요한 심리·정서적 자원이 상대적으로 낮고, 기대나 부담은 크게 느끼는 유형입니다. 먼저 부담을 낮추고 작은 성공 경험을 통해 학습 회복감을 키워주세요. |
| 안전 균형형 | 전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다. 계획·점검 습관을 함께 길러주세요. |
| 몰입자원 풍부형 | 긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 강점을 유지하면서 도전 목표와 깊이 있는 학습 경험으로 확장해주세요. |

#### 중등

| 유형명 | 설명 |
|--------|------|
| 냉소적 무기력형 | 심리·정서적 자원이 상대적으로 낮고, 성적과 공부 부담을 크게 느끼는 유형입니다. 먼저 부담을 낮추고 정서적 회복감과 작은 성취 경험을 만들어주세요. |
| 정서조절 취약형 | 학습 자원은 일정 수준 있으나, 성적 압박과 소진을 크게 느끼는 유형입니다. 학습 전략뿐 아니라 감정 조절과 부담 관리 방법을 함께 지원해주세요. |
| 자기주도 몰입형 | 심리·정서적 자원이 풍부하고 자기주도적 몰입 가능성이 높은 유형입니다. 현재의 강점을 유지하면서 도전 목표와 심화 학습 기회를 제공해주세요. |

### 2.4 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SCHOOL_TYPE",
    "message": "school_type은 'elementary' 또는 'middle'이어야 합니다."
  }
}
```

| 에러 코드 | 조건 |
|-----------|------|
| INVALID_SCHOOL_TYPE | school_type이 "elementary" / "middle"이 아님 |
| MISSING_SCORES | scores 필드 누락 |
| INVALID_SCORE_COUNT | scores의 key가 38개가 아님 |
| UNKNOWN_SCORE_KEY | 알 수 없는 요인명이 포함됨 |
| INVALID_SCORE_VALUE | 값이 숫자가 아님 |

---

## 3. 38개 요인 키 목록

scores 객체에 반드시 아래 38개 key가 모두 포함되어야 합니다.

```
자아존중감, 자기효능감, 성장마인드셋,
자기정서인식, 자기정서조절, 타인정서인식, 타인공감능력,
계획능력, 점검능력, 조절능력,
공부환경, 시간관리, 수업태도, 노트하기, 시험준비,
부모 의사소통, 부모 학업지지, 친구 정서지지, 교사 정서지지,
활기, 몰두, 의미감,
자율성, 유능성, 관계성,
성적부담, 공부부담, 수업부담,
스마트폰 의존, 게임 과몰입,
부모 성적압력, 부모 공부부담, 친구 공부비교, 교사 성적압력, 교사 수업부담,
고갈, 무능감, 반감-냉소
```

> JSON 파라미터 파일(`lpa_model_params.json`)의 `feature_order` 배열이 내부 처리 순서를 정의합니다. key-value 입력을 이 순서대로 배열로 변환한 뒤 알고리즘을 적용합니다.

---

## 4. 분류 알고리즘

Gaussian Mixture Model(GMM) 사후확률 계산입니다. Mplus LPA와 수학적으로 동일한 결과를 냅니다.

### 4.1 처리 흐름

```
① key-value 입력을 feature_order 순서대로 배열 [38]으로 변환
② 각 유형(3개)의 로그우도 계산
③ 사전확률을 더해 로그 사후확률 계산
④ Log-Sum-Exp로 정규화하여 확률로 변환
⑤ 가장 높은 확률의 유형 = 예측 결과
```

### 4.2 수학 공식

**Step 1 — 각 유형(k)의 로그우도:**

```
log_likelihood[k] = Σ(i=0~37) [ -0.5 × ( (score[i] - mean[k][i])² / variance[i] + ln(2π × variance[i]) ) ]
```

- `score[i]` : 학생의 i번째 요인 T점수
- `mean[k][i]` : 유형 k의 i번째 요인 평균 ← JSON에서 로드
- `variance[i]` : i번째 요인의 분산 ← JSON에서 로드, **모든 유형 공통**

**Step 2 — 로그 사후확률:**

```
log_posterior[k] = log_likelihood[k] + ln(prior[k])
```

**Step 3 — Log-Sum-Exp 정규화:**

```
max_val = max(log_posterior[0], log_posterior[1], log_posterior[2])
probability[k] = exp(log_posterior[k] - max_val) / Σ(j=0~2) exp(log_posterior[j] - max_val)
```

> ⚠️ **반드시 max_val을 빼고 exp를 취하세요.** 안 하면 exp() 언더플로우로 결과가 전부 0이 됩니다.

**Step 4 — 분류:**

```
predicted_type = argmax(probability)
```

### 4.3 의사코드 (Pseudocode)

```
function classify(scores_map, school_type):
    params = load_json("lpa_model_params.json")
    p = params[school_type]
    feature_order = params["feature_order"]  // string[38]

    // ① key-value → 배열 변환
    scores = []
    for name in feature_order:
        scores.push(scores_map[name])

    // ② ~ ③ 로그 사후확률 계산
    class_names = keys(p["means"])  // 초등: ["자원소진형","안전 균형형","몰입자원 풍부형"] / 중등: ["냉소적 무기력형","정서조절 취약형","자기주도 몰입형"]
    variances = p["variances"]      // float[38]
    log_posteriors = []

    for each class_name in class_names:
        means = p["means"][class_name]  // float[38]
        prior = p["priors"][class_name] // float

        log_lik = 0.0
        for i = 0 to 37:
            diff = scores[i] - means[i]
            log_lik += -0.5 * (diff * diff / variances[i] + ln(2 * PI * variances[i]))

        log_posteriors.push(log_lik + ln(prior))

    // ④ Log-Sum-Exp 정규화
    max_val = max(log_posteriors)
    exp_vals = [exp(lp - max_val) for lp in log_posteriors]
    sum_exp = sum(exp_vals)
    probabilities = [ev / sum_exp for ev in exp_vals]

    // ⑤ 분류
    best_idx = argmax(probabilities)

    return {
        predicted_type: class_names[best_idx],
        probabilities: { class_names[i]: probabilities[i] for i in 0..2 }
    }
```

---

## 5. 파라미터 파일 (`lpa_model_params.json`)

모든 모델 파라미터는 별도 JSON 파일에 저장합니다. **코드에 하드코딩하지 않습니다.**

### 5.1 구조

```json
{
  "elementary": {
    "means": {
      "자원소진형": [38.144, 37.897, ...],       // float[38]
      "안전 균형형": [52.013, 50.911, ...],       // float[38]
      "몰입자원 풍부형": [55.825, 56.081, ...]    // float[38]
    },
    ...
  },
  "middle": {
    "means": {
      "냉소적 무기력형": [...],
      "정서조절 취약형": [...],
      "자기주도 몰입형": [...]
    },
    "variances": [52.54, 48.15, ...],            // float[38], 유형 공통
    "priors": {
      "냉소적 무기력형": 0.3535,
      "자기주도 몰입형": 0.38088,
      "정서조절 취약형": 0.26562
    }
  },
  "feature_order": ["자아존중감", "자기효능감", ...]  // string[38]
}
```

- `means[유형명][i]` : 해당 유형의 i번째 요인 T점수 평균
- `variances[i]` : i번째 요인의 T점수 분산 (3개 유형 모두 동일)
- `priors[유형명]` : 해당 유형의 사전확률 (연구 표본에서의 비율)
- `feature_order[i]` : i번째 인덱스에 해당하는 요인명

> 실제 파라미터 값: 함께 첨부된 `lpa_model_params.json` 참조

### 5.2 학교급 추가 시

추후 고등 등 새 학교급을 추가하려면 JSON에 키를 추가하면 됩니다:

```json
{
  "elementary": { ... },
  "middle": { ... },
  "high": {
    "means": { ... },
    "variances": [ ... ],
    "priors": { ... }
  }
}
```

코드 수정 없이 파라미터 파일만 추가하면 새 학교급이 자동 지원됩니다.

---

## 6. 구현 예시

### 6.1 Python

```python
import json, math

def classify_student(scores_map: dict, school_type: str) -> dict:
    with open("lpa_model_params.json", "r", encoding="utf-8") as f:
        params = json.load(f)

    p = params[school_type]
    feature_order = params["feature_order"]

    # key-value → 배열
    scores = [scores_map[name] for name in feature_order]

    class_names = list(p["means"].keys())
    variances = p["variances"]

    log_posteriors = []
    for cls in class_names:
        means = p["means"][cls]
        prior = p["priors"][cls]
        log_lik = sum(
            -0.5 * ((scores[i] - means[i])**2 / variances[i] + math.log(2 * math.pi * variances[i]))
            for i in range(38)
        )
        log_posteriors.append(log_lik + math.log(prior))

    # Log-Sum-Exp
    max_val = max(log_posteriors)
    exp_vals = [math.exp(lp - max_val) for lp in log_posteriors]
    sum_exp = sum(exp_vals)
    probs = [ev / sum_exp for ev in exp_vals]

    best_idx = probs.index(max(probs))
    return {
        "predicted_type": class_names[best_idx],
        "probabilities": {class_names[i]: round(probs[i], 6) for i in range(3)},
    }
```

### 6.2 TypeScript

```typescript
interface ClassifyResult {
  predictedType: string;
  probabilities: Record<string, number>;
}

function classifyStudent(scoresMap: Record<string, number>, schoolType: string, params: any): ClassifyResult {
  const p = params[schoolType];
  const featureOrder: string[] = params.feature_order;

  // key-value → 배열
  const scores = featureOrder.map(name => scoresMap[name]);

  const classNames = Object.keys(p.means);
  const variances: number[] = p.variances;

  const logPosteriors: number[] = [];

  for (const cls of classNames) {
    const means: number[] = p.means[cls];
    const prior: number = p.priors[cls];

    let logLik = 0;
    for (let i = 0; i < 38; i++) {
      const diff = scores[i] - means[i];
      logLik += -0.5 * (diff * diff / variances[i] + Math.log(2 * Math.PI * variances[i]));
    }
    logPosteriors.push(logLik + Math.log(prior));
  }

  // Log-Sum-Exp
  const maxVal = Math.max(...logPosteriors);
  const expVals = logPosteriors.map(lp => Math.exp(lp - maxVal));
  const sumExp = expVals.reduce((a, b) => a + b, 0);
  const probs = expVals.map(ev => ev / sumExp);

  const bestIdx = probs.indexOf(Math.max(...probs));

  const probabilities: Record<string, number> = {};
  classNames.forEach((name, i) => { probabilities[name] = Math.round(probs[i] * 1e6) / 1e6; });

  return { predictedType: classNames[bestIdx], probabilities };
}
```

### 6.3 Java

```java
public Map<String, Object> classifyStudent(Map<String, Double> scoresMap, String schoolType) {
    // params = JSON 파싱 결과
    String[] featureOrder = getFeatureOrder();
    double[] scores = new double[38];
    for (int i = 0; i < 38; i++) {
        scores[i] = scoresMap.get(featureOrder[i]);
    }

    String[] classNames = getClassNames(schoolType);
    double[][] means = getMeans(schoolType);      // [3][38]
    double[] variances = getVariances(schoolType); // [38]
    double[] priors = getPriors(schoolType);       // [3]

    double[] logPosteriors = new double[3];
    for (int k = 0; k < 3; k++) {
        double logLik = 0.0;
        for (int i = 0; i < 38; i++) {
            double diff = scores[i] - means[k][i];
            logLik += -0.5 * (diff * diff / variances[i] + Math.log(2 * Math.PI * variances[i]));
        }
        logPosteriors[k] = logLik + Math.log(priors[k]);
    }

    // Log-Sum-Exp
    double maxVal = Arrays.stream(logPosteriors).max().orElse(0);
    double[] expVals = Arrays.stream(logPosteriors).map(lp -> Math.exp(lp - maxVal)).toArray();
    double sumExp = Arrays.stream(expVals).sum();
    double[] probs = Arrays.stream(expVals).map(ev -> ev / sumExp).toArray();

    int bestIdx = IntStream.range(0, 3)
        .reduce((a, b) -> probs[a] > probs[b] ? a : b).orElse(0);

    // return result
}
```

---

## 7. 중요 주의사항

### 7.1 분산(variance)은 변수마다 다릅니다

T점수 분산은 모든 변수가 동일하지 않습니다.

실제 T점수 분산 범위:
- 초등: **47.9 ~ 89.2** (변수에 따라 다름)
- 중등: **59.7 ~ 88.0** (시험준비 제외)

반드시 `lpa_model_params.json`의 변수별 분산을 사용하세요.

### 7.2 분산은 모든 유형에서 동일

같은 요인의 분산은 3개 유형 모두 동일합니다 (Mplus LPA 기본 설정). 따라서 `variances`는 유형별이 아닌 요인별로 38개만 있으면 됩니다.

### 7.3 중등 "시험준비" 분산 특이값

중등 모델에서 "시험준비"의 분산이 **10,000**으로 설정되어 있습니다. 이는 연구 데이터에서 해당 변수의 유형 간 차이가 거의 없어, 분류에 실질적으로 기여하지 않음을 의미합니다. 의도된 값이며 수정하면 안 됩니다.

### 7.4 Log-Sum-Exp 필수

38개 변수의 로그우도 합이 -200 ~ -400 범위가 됩니다. exp()를 직접 적용하면 언더플로우가 발생하므로, **반드시 max_val을 빼고 exp를 취해야** 합니다.

### 7.5 key 이름 정확히 일치해야 함

scores 객체의 key 이름이 `lpa_model_params.json`의 `feature_order`와 정확히 일치해야 합니다. 공백, 띄어쓰기 차이도 오류를 일으킵니다.

---

## 8. 테스트 케이스

### 8.1 초등 — 자원소진형

```json
{
  "school_type": "elementary",
  "scores": {
    "자아존중감": 38, "자기효능감": 38, "성장마인드셋": 37,
    "자기정서인식": 42, "자기정서조절": 43, "타인정서인식": 44, "타인공감능력": 41,
    "계획능력": 45, "점검능력": 44, "조절능력": 44,
    "공부환경": 45, "시간관리": 46, "수업태도": 42, "노트하기": 46, "시험준비": 49,
    "부모 의사소통": 43, "부모 학업지지": 42, "친구 정서지지": 43, "교사 정서지지": 43,
    "활기": 41, "몰두": 43, "의미감": 40,
    "자율성": 42, "유능성": 39, "관계성": 41,
    "성적부담": 59, "공부부담": 58, "수업부담": 59,
    "스마트폰 의존": 54, "게임 과몰입": 56,
    "부모 성적압력": 59, "부모 공부부담": 58, "친구 공부비교": 58, "교사 성적압력": 60, "교사 수업부담": 57,
    "고갈": 56, "무능감": 59, "반감-냉소": 57
  }
}
```

**기대 결과**: 자원소진형 (확률 ≈ 1.0)

### 8.2 초등 — 안전 균형형

```json
{
  "school_type": "elementary",
  "scores": {
    "자아존중감": 52, "자기효능감": 51, "성장마인드셋": 51,
    "자기정서인식": 50, "자기정서조절": 48, "타인정서인식": 49, "타인공감능력": 47,
    "계획능력": 47, "점검능력": 45, "조절능력": 48,
    "공부환경": 47, "시간관리": 46, "수업태도": 48, "노트하기": 47, "시험준비": 50,
    "부모 의사소통": 49, "부모 학업지지": 50, "친구 정서지지": 49, "교사 정서지지": 49,
    "활기": 46, "몰두": 47, "의미감": 47,
    "자율성": 47, "유능성": 50, "관계성": 51,
    "성적부담": 49, "공부부담": 51, "수업부담": 51,
    "스마트폰 의존": 50, "게임 과몰입": 49,
    "부모 성적압력": 50, "부모 공부부담": 50, "친구 공부비교": 49, "교사 성적압력": 48, "교사 수업부담": 49,
    "고갈": 51, "무능감": 48, "반감-냉소": 52
  }
}
```

**기대 결과**: 안전 균형형 (확률 ≈ 0.999)

### 8.3 중등 — 자기주도 몰입형

```json
{
  "school_type": "middle",
  "scores": {
    "자아존중감": 57, "자기효능감": 57, "성장마인드셋": 56,
    "자기정서인식": 56, "자기정서조절": 53, "타인정서인식": 52, "타인공감능력": 53,
    "계획능력": 54, "점검능력": 54, "조절능력": 55,
    "공부환경": 54, "시간관리": 53, "수업태도": 58, "노트하기": 55, "시험준비": 50,
    "부모 의사소통": 56, "부모 학업지지": 57, "친구 정서지지": 53, "교사 정서지지": 57,
    "활기": 58, "몰두": 57, "의미감": 57,
    "자율성": 55, "유능성": 57, "관계성": 55,
    "성적부담": 40, "공부부담": 39, "수업부담": 39,
    "스마트폰 의존": 45, "게임 과몰입": 44,
    "부모 성적압력": 44, "부모 공부부담": 44, "친구 공부비교": 44, "교사 성적압력": 43, "교사 수업부담": 42,
    "고갈": 43, "무능감": 40, "반감-냉소": 40
  }
}
```

**기대 결과**: 자기주도 몰입형 (확률 ≈ 1.0)

### 8.4 중등 — 냉소적 무기력형

```json
{
  "school_type": "middle",
  "scores": {
    "자아존중감": 44, "자기효능감": 42, "성장마인드셋": 44,
    "자기정서인식": 45, "자기정서조절": 44, "타인정서인식": 42, "타인공감능력": 43,
    "계획능력": 43, "점검능력": 42, "조절능력": 42,
    "공부환경": 42, "시간관리": 45, "수업태도": 44, "노트하기": 44, "시험준비": 50,
    "부모 의사소통": 44, "부모 학업지지": 43, "친구 정서지지": 41, "교사 정서지지": 46,
    "활기": 45, "몰두": 46, "의미감": 42,
    "자율성": 43, "유능성": 43, "관계성": 42,
    "성적부담": 48, "공부부담": 50, "수업부담": 51,
    "스마트폰 의존": 51, "게임 과몰입": 51,
    "부모 성적압력": 51, "부모 공부부담": 53, "친구 공부비교": 48, "교사 성적압력": 50, "교사 수업부담": 50,
    "고갈": 49, "무능감": 49, "반감-냉소": 52
  }
}
```

**기대 결과**: 냉소적 무기력형 (확률 ≈ 0.999)

### 8.5 중등 — 정서조절 취약형

```json
{
  "school_type": "middle",
  "scores": {
    "자아존중감": 51, "자기효능감": 51, "성장마인드셋": 52,
    "자기정서인식": 53, "자기정서조절": 49, "타인정서인식": 51, "타인공감능력": 53,
    "계획능력": 51, "점검능력": 51, "조절능력": 52,
    "공부환경": 50, "시간관리": 51, "수업태도": 53, "노트하기": 51, "시험준비": 50,
    "부모 의사소통": 51, "부모 학업지지": 50, "친구 정서지지": 51, "교사 정서지지": 53,
    "활기": 52, "몰두": 52, "의미감": 51,
    "자율성": 49, "유능성": 50, "관계성": 52,
    "성적부담": 55, "공부부담": 53, "수업부담": 49,
    "스마트폰 의존": 54, "게임 과몰입": 50,
    "부모 성적압력": 58, "부모 공부부담": 56, "친구 공부비교": 56, "교사 성적압력": 53, "교사 수업부담": 53,
    "고갈": 54, "무능감": 55, "반감-냉소": 52
  }
}
```

**기대 결과**: 정서조절 취약형 (확률 ≈ 0.999)

---

## 9. 첨부 파일

| 파일명 | 용도 |
|--------|------|
| `lpa_model_params.json` | **핵심** — 모든 모델 파라미터 |
| `lpa_service_final.py` | Python 레퍼런스 구현 |
| `lpa_classifier.ts` | TypeScript 레퍼런스 구현 |

---

## 10. FAQ

**Q: 성능은?**
38개 변수에 대한 단순 사칙연산이므로 1회 분류에 1ms 미만. 배치 처리도 문제없습니다.

**Q: 새 학교급 추가는?**
Mplus로 LPA 분석 → 동일 형식으로 JSON에 키 추가. 코드 변경 불필요.

**Q: 분류 정확도는?**
초등 Entropy=0.943, 중등 Entropy=0.935. (1.0이 완벽 분류)

**Q: 분산이 왜 변수마다 다른가요?**
T점수는 원점수의 선형 변환이므로, 원래 모델의 within-class variance가 T점수 공간에서도 변수별로 다른 값을 가집니다. `lpa_model_params.json`에 포함된 변수별 분산값을 그대로 사용하면 됩니다.
