# 코드 리뷰 - e1a88df2

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`dashboardservice.ts`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.010

- 청크 수: 69개


**권장사항:**

- 파일 크기가 큼 (69개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 `convertToAssessment` 함수에서 LPA(잠재 프로파일 분석) 유형명(`predictedType`)과 확률(`typeProbabilities`)의 출처를 일치시키는 방어 로직을 추가한 것입니다. 기존에는 백엔드에서 내려온 `lpaTypeName`이 있으면 유형명은 API 값을, 확률은 프론트엔드 재분류값을 사용하는 등 출처가 섞여 도넛 차트·유형명·유형 설명 간 불일치가 발생할 수 있었습니다. 이번 변경은 API 데이터의 유효성을 검증한 후, 유효하지 않으면 전체를 프론트엔드 T점수 기반 재분류값으로 폴백시켜 일관성을 보장합니다.

- **목적**: LPA 유형명과 확률의 출처 불일치로 인한 UI(도넛 차트, 유형명, 설명) 간 불일치 방지
- **도메인**: 비즈니스 로직 (데이터 변환 서비스)
- **변경 방향**: API 데이터 신뢰성 검증 강화 → 조건부 사용 → 실패 시 전체 폴백

## [GOOD] 잘된 점

1. **출처 일관성 원칙이 명확함**: 유형명과 확률을 반드시 같은 출처(API 또는 프론트엔드 계산)에서 가져오도록 강제하여, UI 구성 요소 간 불일치 가능성을 원천 차단했습니다.
2. **방어적 검증이 체계적임**: `hasValidApiLpa` 조건이 유형명 존재 → 학제 유효성 → 확률 존재 → 유형명 확률 존재 → 전체 키 학제 유효성 순으로 단계적 검증을 수행하여, 부분 누락이나 잘못된 학제 데이터를 효과적으로 걸러냅니다.
3. **주석이 의도를 잘 설명함**: "유형명과 확률은 같은 출처를 사용한다"는 주석이 폴백 로직의 이유를 명확히 전달하여 유지보수성을 높였습니다.

## 변경사항 요약

`convertToAssessment` 함수에서 `hasValidApiLpa`라는 검증 플래그를 도입하여, 백엔드 `lpaTypeName`과 `apiTypeProbabilities`가 모두 유효한 경우에만 API 값을 사용하고, 그 외에는 `classifyStudent`의 프론트엔드 계산값으로 전체 폴백하도록 변경했습니다. `getTypeInfo`를 새로 import하여 학제별 유형명 유효성을 검증합니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

1. **`typeConfidence` 출처 불일치 잠재**
   - **위치**: `frontend/src/shared/services/dashboardService.ts` 라인 967
   - **기존 코드**:
     ```typescript
     return {
       id: `${studentId}-r${round}`,
       studentId,
       round,
       assessedAt: new Date(),
       tScores: safeTScores,
       predictedType,
       typeConfidence: classification.confidence,
       typeProbabilities,
       ...
     };
     ```
   - **문제**: `hasValidApiLpa`가 `true`일 때 `predictedType`과 `typeProbabilities`는 API 출처를 사용하지만, `typeConfidence`는 여전히 `classification.confidence`(프론트엔드 계산값)를 사용합니다. `typeConfidence`는 `contextBuilder.ts`(라인 460)와 `aiPrompts.ts`(라인 732, 747)에서 유형명과 함께 "확신도/신뢰도"로 표시되어 사용자에게 노출됩니다. 즉, 유형명은 API 값인데 신뢰도는 프론트엔드 계산값이 표시되는 불일치가 발생할 수 있습니다.
   - **해결 방안**: `hasValidApiLpa`가 `true`일 때 API 기반 confidence를 사용하거나, API에 confidence 값이 없다면 `typeConfidence`도 프론트엔드 계산값으로 명시적으로 폴백한다는 주석을 추가하는 것이 좋습니다. 다만 API 응답 구조에 confidence 필드가 있는지 확인이 필요하므로, 현재로서는 **[수정 코드 제시 불가 — 문맥 파악 불충분]** 으로 표시합니다. 최소한 이 불일치가 의도된 것인지 명시하는 주석 추가를 권장합니다.

2. **`Object.keys(apiTypeProbabilities).every(...)` 조건의 보수성**
   - **위치**: `frontend/src/shared/services/dashboardService.ts` 라인 947
   - **기존 코드**:
     ```typescript
     Object.keys(apiTypeProbabilities).every((typeName) => !!getTypeInfo(typeName, schoolLevel))
     ```
   - **문제**: 확률 객체에 현재 학제에 없는 유형명이 하나라도 포함되면 전체가 폴백됩니다. 이는 "불일치 방지" 목적에는 부합하지만, 백엔드가 확률 객체에 부가적인 키(예: 메타데이터, 버전 정보 등)를 포함하는 경우 의도치 않게 전체가 폴백될 수 있습니다. 다만 현재 API 계약상 확률 객체는 유형명-확률 쌍만 포함한다면 이 조건은 적절합니다.
   - **해결 방안**: 이 조건이 의도된 것인지 API 계약을 확인하고, 만약 확률 객체에 유형명 외 다른 키가 포함될 가능성이 있다면 `Object.keys(apiTypeProbabilities).filter((k) => k !== data.lpaTypeName).every(...)` 형태로 완화할 수 있습니다. 하지만 현재 API 계약상 문제가 없다면 유지해도 무방합니다.

---

## 주요 파일 분석

### frontend/src/shared/services/dashboardService.ts

**변경 내용:**
`convertToAssessment` 함수에서 API LPA 데이터 유효성 검증 로직(`hasValidApiLpa`)을 추가하고, 유효한 경우에만 API 유형명/확률을 사용하도록 변경.

**개선 제안:**
1. `typeConfidence`의 출처 불일치에 대한 명시적 처리 또는 주석 추가 (Medium 이슈 1 참조)
2. `hasValidApiLpa` 조건이 복잡하므로, 별도 함수로 추출하여 단위 테스트 가능성을 높이는 것도 고려할 수 있습니다. 예:
   ```typescript
   const isValidApiLpa = (
     lpaTypeName: string | null | undefined,
     apiTypeProbabilities: Record<string, number> | null | undefined,
     schoolLevel: SchoolLevel,
   ): boolean => {
     if (!lpaTypeName || !apiTypeProbabilities) return false;
     if (!getTypeInfo(lpaTypeName, schoolLevel)) return false;
     if (apiTypeProbabilities[lpaTypeName] === undefined) return false;
     return Object.keys(apiTypeProbabilities).every((typeName) => !!getTypeInfo(typeName, schoolLevel));
   };
   ```
   이렇게 분리하면 로직의 의도가 더 명확해지고, 각 조건에 대한 테스트 작성이 용이해집니다.

---

## 최종 평가

**결론**: 
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**
이번 변경은 LPA 유형명과 확률의 출처 일관성을 보장하는 실용적인 방어 로직으로, 기존에 발생할 수 있었던 UI 불일치 문제를 효과적으로 해결했습니다. `hasValidApiLpa`의 단계적 검증 구조가 견고하며, 폴백 시나리오도 명확합니다. `typeConfidence`의 출처 불일치(Medium)는 실제 사용자 노출 가능성이 있으므로 후속 커밋에서 검토를 권장하지만, 현재 변경의 핵심 목적(유형명-확률 일치)은 충분히 달성되었으므로 승인합니다.