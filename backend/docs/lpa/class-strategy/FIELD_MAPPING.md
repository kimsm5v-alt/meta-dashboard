# LPA 학급 코칭 전략 - 백엔드 ↔ 프론트엔드 필드 매핑

## 1. API 응답 구조

백엔드에서 프론트로 전달할 최종 API 응답 형태입니다.

```typescript
// GET /api/coaching/class/{classId}
interface ClassCoachingResponse {
  lpaDistribution: ClassLPADistribution;
  dominantType: string;                    // "자원소진형" 등
  dominantTypeCharacteristics: string;     // 유형 특징 설명
  recommendedStrategy: LPATypeStrategy;    // STEP 1 (우세 유형)
  additionalStrategies: LPATypeStrategy[]; // STEP 2, 3 (나머지 유형)
}
```

---

## 2. 핵심 로직 (백엔드)

```python
# 1. 학급 내 유형별 인원 집계
counts = count_by_type(class_students)  # {"자원소진형": 9, "안전균형형": 8, ...}

# 2. 내림차순 정렬 → 1·2·3위
ranked = sorted(counts.items(), key=lambda x: (-x[1], TIE_BREAKER_ORDER.index(x[0])))

# 3. 0명 유형 제외
ranked = [(t, c) for t, c in ranked if c > 0]

# 4. STEP 매핑
step1_type = ranked[0][0]  # 1위 → STEP 1
step2_type = ranked[1][0] if len(ranked) > 1 else None  # 2위 → STEP 2
step3_type = ranked[2][0] if len(ranked) > 2 else None  # 3위 → STEP 3
```

### 동점 처리 (Tie Breaker)
인원이 같을 경우, **지원 필요도 순**으로 우선:
- 초등: `자원소진형 > 안전균형형 > 몰입자원풍부형`
- 중등: `무기력형 > 정서조절취약형 > 자기주도몰입형`

---

## 3. JSON DB → API 응답 필드 매핑

### 3.1 STEP 1 (학급 대표 전략 코칭 - 노란 카드)

| 프론트 필드 | JSON DB 필드 | 설명 |
|:---|:---|:---|
| `recommendedStrategy.type` | `elementary.E1.typeName` | 유형명 |
| `recommendedStrategy.characteristics` | `elementary.E1.typeCharacteristics` | 유형 특징 |
| `recommendedStrategy.strategyTitle` | `elementary.E1.mainStrategy.title` | 대표전략 제목 |
| `recommendedStrategy.strategyDescription` | `elementary.E1.mainStrategy.lead` | 대표전략 리드 |
| `recommendedStrategy.actionItems[]` | `elementary.E1.mainStrategy.steps[].content` | 단계 1,2,3 |
| `recommendedStrategy.successIndicators[]` | `elementary.E1.observationIndicators[]` | 관찰지표 3건 |
| `recommendedStrategy.noteForOtherTypes` | `elementary.E1.otherTypeImpact` | 타유형영향 |
| `recommendedStrategy.advancedStrategies[]` | `elementary.E1.advancedCoaching[]` | 심화코칭 1,2 |

### 3.2 STEP 2, 3 (추가 코칭 카드)

| 프론트 필드 | JSON DB 필드 | 노출 여부 |
|:---|:---|:---|
| `additionalStrategies[].type` | `typeName` | O |
| `additionalStrategies[].characteristics` | `typeCharacteristics` | **X (미노출)** |
| `additionalStrategies[].strategyTitle` | `mainStrategy.title` | O |
| `additionalStrategies[].strategyDescription` | `mainStrategy.lead` | **X (미노출)** |
| `additionalStrategies[].actionItems[]` | `mainStrategy.steps[].content` | O |
| `additionalStrategies[].successIndicators[]` | `observationIndicators[]` | **X (미노출)** |
| `additionalStrategies[].noteForOtherTypes` | `otherTypeImpact` | O |
| `additionalStrategies[].advancedStrategies[]` | `advancedCoaching[]` | **X (미노출)** |

---

## 4. 프론트 타입 정의 (현행)

```typescript
// types.ts

interface LPATypeStrategy {
  type: LPAType;
  characteristics: string;           // 유형 특징 (STEP 1만)
  strategyTitle: string;             // 대표전략 제목
  strategyDescription: string;       // 대표전략 리드 (STEP 1만)
  actionItems: string[];             // 단계 1,2,3
  successIndicators?: string[];      // 관찰지표 (STEP 1만)
  noteForOtherTypes?: string;        // 타유형영향
  advancedStrategies?: AdvancedStrategy[]; // 심화코칭 (STEP 1만)
}

interface AdvancedStrategy {
  title: string;
  description: string;   // lead
  actionItems: string[]; // steps
}

interface ClassCoachingData {
  lpaDistribution: ClassLPADistribution;
  dominantType: LPAType;
  dominantTypeCharacteristics: string;
  recommendedStrategy: LPATypeStrategy;      // STEP 1
  additionalStrategies: LPATypeStrategy[];   // STEP 2, 3
}
```

---

## 5. 백엔드 변환 로직 예시 (Java)

```java
public ClassCoachingResponse buildResponse(String classId, String schoolLevel) {
    // 1. 학급 학생들의 LPA 유형 집계
    Map<String, Long> counts = studentRepository.countByLpaType(classId);

    // 2. 랭킹 (동점 시 지원필요도 순)
    List<String> ranked = rankTypes(counts, schoolLevel);

    // 3. 유형별 콘텐츠 로드
    Map<String, LpaTypeContent> contentDb = loadContentDb(schoolLevel);

    // 4. STEP 1 (우세 유형) - 전체 필드
    String step1Type = ranked.get(0);
    LPATypeStrategy recommendedStrategy = buildFullStrategy(contentDb.get(step1Type));

    // 5. STEP 2, 3 (나머지) - 제한된 필드
    List<LPATypeStrategy> additionalStrategies = new ArrayList<>();
    for (int i = 1; i < ranked.size() && i <= 2; i++) {
        additionalStrategies.add(buildLimitedStrategy(contentDb.get(ranked.get(i))));
    }

    return ClassCoachingResponse.builder()
        .lpaDistribution(buildDistribution(counts))
        .dominantType(step1Type)
        .dominantTypeCharacteristics(contentDb.get(step1Type).getTypeCharacteristics())
        .recommendedStrategy(recommendedStrategy)
        .additionalStrategies(additionalStrategies)
        .build();
}

// STEP 1용 - 전체 필드
private LPATypeStrategy buildFullStrategy(LpaTypeContent content) {
    return LPATypeStrategy.builder()
        .type(content.getTypeName())
        .characteristics(content.getTypeCharacteristics())
        .strategyTitle(content.getMainStrategy().getTitle())
        .strategyDescription(content.getMainStrategy().getLead())
        .actionItems(content.getMainStrategy().getSteps().stream()
            .map(Step::getContent).toList())
        .successIndicators(content.getObservationIndicators())
        .noteForOtherTypes(content.getOtherTypeImpact())
        .advancedStrategies(content.getAdvancedCoaching().stream()
            .map(this::toAdvancedStrategy).toList())
        .build();
}

// STEP 2,3용 - 제한된 필드 (리드, 관찰지표, 심화코칭 제외)
private LPATypeStrategy buildLimitedStrategy(LpaTypeContent content) {
    return LPATypeStrategy.builder()
        .type(content.getTypeName())
        .characteristics(null)  // 미노출
        .strategyTitle(content.getMainStrategy().getTitle())
        .strategyDescription(null)  // 리드 미노출
        .actionItems(content.getMainStrategy().getSteps().stream()
            .map(Step::getContent).toList())
        .successIndicators(null)  // 관찰지표 미노출
        .noteForOtherTypes(content.getOtherTypeImpact())
        .advancedStrategies(null)  // 심화코칭 미노출
        .build();
}
```

---

## 6. 유형 ID ↔ 유형명 매핑

| School Level | Type ID | Type Name |
|:---|:---|:---|
| elementary | E1 | 자원소진형 |
| elementary | E2 | 안전균형형 |
| elementary | E3 | 몰입자원풍부형 |
| middle | M1 | 무기력형 |
| middle | M2 | 정서조절취약형 |
| middle | M3 | 자기주도몰입형 |

---

## 7. 엣지 케이스 처리

| 케이스 | 처리 방법 |
|:---|:---|
| 특정 유형 0명 | `additionalStrategies`에서 제외, STEP 번호 재부여 |
| 전원 단일 유형 | `additionalStrategies = []`, STEP 1만 노출 |
| 인원 동점 | Tie Breaker 순서 적용 |

---

## 8. 화면 렌더링 규칙 (프론트)

### 텍스트 데코레이션 (decorate 함수)
- **도입 구절 강조**: 단계 문장의 첫 쉼표 앞 구절(14자 이내) → 볼드
- **예시 보조 줄**: `(예: ...)` 패턴 → 본문 아래 회색 보조 줄
- **교사 대사 말풍선**: `— "대사"` 패턴 → 말풍선 칩
