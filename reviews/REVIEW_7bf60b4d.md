> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 7bf60b4d

## 코드 복잡도 분석

**분석된 파일**: 3개 / 변경된 파일: 3개


### 정상 범위 (NONE)


**`dashboardservice.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.009

- 청크 수: 59개


**권장사항:**

- 파일 크기가 큼 (59개 청크) - 파일 분리 검토


**`studentdashboardpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 49개


**권장사항:**

- 파일 크기가 큼 (49개 청크) - 파일 분리 검토


**`coachingstrategy.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.008

- 청크 수: 73개


**권장사항:**

- 파일 크기가 큼 (73개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 학생 대시보드의 **코칭 전략(CoachingStrategy)** 컴포넌트를 확장하여, 기존의 아코디언 형태의 코칭 경로 목록 위에 **강점(Strength) / 보완점(Weakness) 요인 카드**를 함께 표시하도록 개선합니다.

- **목적**: 학생의 강점/보완점 요인을 시각적으로 먼저 제시한 후, 해당 요인과 연계된 코칭 경로를 아코디언으로 제공하여 사용자 경험(UX)을 향상
- **도메인**: UI / 비즈니스 로직 (학생 대시보드 프론트엔드)
- **변경 방향**: 기존에는 `TypeDeviations` 컴포넌트(별도 카드)로 강점/약점을 분리 표시하고, `CoachingStrategy`는 코칭 경로만 아코디언으로 제공했으나, 이제 `CoachingStrategy` 내부에 강점/보완점 카드와 코칭 경로 아코디언을 통합하여 일관된 UI/UX 제공

---

## [GOOD] 잘된 점

1. **컴포넌트 통합 방향이 적절함**: 기존에 `TypeDeviations` 컴포넌트로 별도 분리되어 있던 강점/약점 정보를 `CoachingStrategy` 내부로 통합한 것은, "강점/보완점 요인 -> 연관 코칭 경로"라는 사용자 흐름을 자연스럽게 연결해줍니다. `StudentDashboardPage.tsx`에서 `TypeDeviations`를 제거하고 `CoachingStrategy`에 `strengths`/`weaknesses` props를 전달하는 방식으로 리팩토링한 점이 깔끔합니다.

2. **데이터 기반 요인 요약 활용**: `scripts_depth3.json`의 T점수 구간별 `summary`를 `getFactorSummary()` 함수로 조회하여 요인 카드에 표시하는 방식은, 정적인 설명 대신 실제 학생 점수에 맞춘 동적 요약을 제공하므로 개인화된 경험을 제공합니다.

3. **카테고리별 색상 매핑**: `CATEGORY_COLOR_MAP`을 통해 대분류(자아강점, 학습디딤돌 등)별로 해시태그 색상을 지정하여 시각적 구분을 명확히 한 점이 좋습니다.

---

## 변경사항 요약

- `CoachingStrategy.tsx`: 강점/보완점 요인 카드 영역 추가, 아코디언 레이블을 `category` 기반으로 변경, `SubSectionWrapper`로 해석/전략 영역을 50:50 분할 레이아웃으로 개선
- `StudentDashboardPage.tsx`: `TypeDeviations` 컴포넌트 제거, `CoachingStrategy`에 `strengths`/`weaknesses` props 전달
- `dashboardService.ts`: `ModerationPath` 인터페이스에 `category`와 `zFactorType` 필드 추가

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `getFactorSummary()`의 `tScore_lower`/`tScore_upper` null 처리 시 경계값 중복 가능성**

- **위치**: `CoachingStrategy.tsx` 라인 44-47
- **기존 코드**:
```typescript
const lower = s.tScore_lower ?? -Infinity;
const upper = s.tScore_upper ?? Infinity;
return tScore >= lower && tScore <= upper;
```
- **문제점**: `scripts_depth3.json`을 보면 첫 번째 구간(`매우 낮음`)은 `tScore_lower: null, tScore_upper: 29`이고, 마지막 구간(`매우높음`)은 `tScore_lower: 70, tScore_upper: 100`입니다. `null`을 `-Infinity`와 `Infinity`로 대체하는 방식은 논리적으로는 문제가 없으나, **T점수 범위가 0~100으로 제한**되어 있으므로 `-Infinity`/`Infinity`는 과도한 값입니다. 또한 `tScore_upper`가 `null`인 구간이 추가될 경우(예: `tScore_lower: 100, tScore_upper: null`) `Infinity`로 처리되어 의도치 않은 매칭이 발생할 수 있습니다.

- **해결 방안 (수정 코드)**:
```typescript
const lower = s.tScore_lower ?? 0;
const upper = s.tScore_upper ?? 100;
return tScore >= lower && tScore <= upper;
```
  > **수정 코드 제시 근거**: `scripts_depth3.json`의 T점수는 0~100 범위로 제한되어 있으며, `read_file`로 확인한 결과 `tScore_lower`가 `null`인 경우는 첫 구간(0~29), `tScore_upper`가 `null`인 경우는 마지막 구간(70~100)뿐입니다. 따라서 `-Infinity`/`Infinity` 대신 `0`/`100`을 사용하는 것이 더 직관적이고 안전합니다.

**2. `moderationPaths`의 `category` 필드가 `undefined`일 때의 fallback 처리 부재**

- **위치**: `CoachingStrategy.tsx` 라인 404-405 (아코디언 렌더링 부분)
- **기존 코드**:
```typescript
const isStrength = path.category === 'strength';
const factorName = isStrength ? strength?.factorName : weakness?.factorName;
const label = isStrength
  ? `강점 코칭 ${factorName ?? ''}`
  : `보완점 코칭 ${factorName ?? ''}`;
```
- **문제점**: `ModerationPath.category`는 `dashboardService.ts`에서 `string` 타입으로 정의되어 있고, `'강점' | '보완점'`이라는 주석이 있지만 실제로는 `'strength'` 문자열과 비교하고 있습니다. `category`가 `undefined`이거나 예상치 못한 값일 경우 `isStrength`는 `false`가 되어 모든 경로가 "보완점 코칭"으로 표시됩니다. 또한 `factorName`이 `undefined`일 때 라벨이 "강점 코칭 " 또는 "보완점 코칭 "으로 빈 공간이 생깁니다.

- **해결 방안 (수정 코드)**:
```typescript
const isStrength = path.category === 'strength';
const factorName = isStrength ? strength?.factorName : weakness?.factorName;
const label = isStrength
  ? `강점 코칭${factorName ? ` ${factorName}` : ''}`
  : `보완점 코칭${factorName ? ` ${factorName}` : ''}`;
```
  > **수정 코드 제시 근거**: `read_file`로 `CoachingStrategy.tsx` 전체(473줄)를 확인했으며, `label` 변수는 아코디언 헤더의 `AccordionLabel`에만 사용되고 다른 로직에 영향을 주지 않습니다. 조건부 렌더링으로 변경해도 부작용이 없습니다.

### Medium (개선 권장)

**1. `console.log`로 디버깅 코드가 남아 있음**

- **위치**: `CoachingStrategy.tsx` 라인 340-347
- **기존 코드**:
```typescript
console.log('Received props:', {
  moderationPaths,
  strengths,
  weaknesses,
  typeName,
  typeColor,
  isLoading,
});
```
- **제안**: 개발 중 디버깅용으로 추가된 `console.log`는 프로덕션 코드에서 제거하는 것이 좋습니다. 불필요한 콘솔 출력은 성능에 미미한 영향을 줄 수 있고, 사용자 브라우저 콘솔을 오염시킵니다.

**2. `strengths[0]` / `weaknesses[0]`만 사용하는 구조적 제약**

- **위치**: `CoachingStrategy.tsx` 라인 349-350
- **기존 코드**:
```typescript
const strength = strengths[0];
const weakness = weaknesses[0];
```
- **제안**: 현재는 배열의 첫 번째 요소만 사용하고 있습니다. `Strength`와 `Weakness` 인터페이스가 배열로 정의되어 있어 향후 여러 개의 강점/보완점을 표시해야 할 경우 확장이 필요합니다. 지금은 단일 항목만 표시하므로 `strength`/`weakness`를 `Strength | undefined` / `Weakness | undefined` 타입의 단일 props로 변경하는 것도 고려해볼 수 있습니다. 다만 이는 API 응답 구조와의 정합성 문제가 있으므로, 현재 구조를 유지하되 향후 확장을 염두에 두는 것이 좋습니다.

---

## 주요 파일 분석

### CoachingStrategy.tsx
**변경 내용:** 강점/보완점 요인 카드 영역 추가, 아코디언 레이블 및 레이아웃 개선, 불필요한 `TypeBadge`/`Formula`/`XVar`/`YVar` 스타일 제거

**개선 제안:**
1. 위 High 이슈에서 언급한 `getFactorSummary()`의 경계값 처리 개선
2. `console.log` 디버깅 코드 제거
3. `path.category` fallback 처리 강화

### StudentDashboardPage.tsx
**변경 내용:** `TypeDeviations` 컴포넌트 제거, `CoachingStrategy`에 `strengths`/`weaknesses` props 전달

**개선 제안:**
- 특별한 이슈 없음. 깔끔하게 리팩토링되었습니다.

### dashboardService.ts
**변경 내용:** `ModerationPath` 인터페이스에 `category`와 `zFactorType` 필드 추가

**개선 제안:**
- `category` 필드의 타입을 `string` 대신 `'strength' | 'weakness'` 유니온 타입으로 좁히는 것이 타입 안전성 측면에서 더 좋습니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**
전반적으로 컴포넌트 통합 방향과 UI 개선이 잘 이루어졌습니다. 다만 `getFactorSummary()`의 경계값 처리에서 `-Infinity`/`Infinity` 대신 실제 T점수 범위(0~100)에 맞는 값을 사용하는 것이 더 안전하며, `path.category`의 fallback 처리가 누락되어 예상치 못한 값이 들어올 경우 모든 경로가 "보완점 코칭"으로 잘못 표시될 가능성이 있습니다. 위 두 가지 High 이슈만 수정되면 바로 승인 가능한 수준입니다.