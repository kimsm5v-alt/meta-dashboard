> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 546bc8e3

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`studentdashboardpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.006

- 청크 수: 39개


**권장사항:**

- 파일 크기가 큼 (39개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 교사용 학생 대시보드에서 "4단계 해석" 탭 버튼을 UI에서 제거하기 위한 변경입니다. 커밋 메시지(HSJ-31)에 따르면 해당 기능 탭 삭제 요청에 의해 진행되었습니다.

- **목적**: 학생 대시보드의 "4단계 해석" 탭 버튼 제거
- **도메인**: UI (프론트엔드)
- **변경 방향**: 버튼을 주석 처리하여 기능을 일시적으로 숨김

## [GOOD] 잘된 점

- **변경 범위 최소화**: 단일 버튼만 주석 처리하여 영향도를 파악하기 쉬움
- **복원 가능성 유지**: 주석 처리로 남겨두어 향후 재활성화가 용이함
- **트래킹 명확**: 커밋 메시지에 Jira 티켓 번호(HSJ-31)가 명확히 기재되어 있어 변경 이력 추적이 용이함

## 변경사항 요약

`StudentDashboardPage.tsx`에서 "4단계 해석" 모드 전환 버튼(`ChartModeButton`) 1개를 주석 처리하였습니다. 버튼만 숨기고 관련 로직, 상태 타입, import는 그대로 유지했습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. 불완전한 제거로 인한 데드 코드(Dead Code) 잔존**

버튼만 주석 처리하고 관련 조건문, 상태 타입, import가 그대로 남아 있어 불필요한 코드가 존재합니다. 이는 번들 크기 증가와 유지보수성을 저하시킵니다.

구체적으로 확인된 잔존 데드 코드는 다음과 같습니다:

**1-1. `SHOW_FOUR_STEP` 상수 (라인 38)**
```
const SHOW_FOUR_STEP = true;
```
버튼이 주석 처리되어 사용자가 `'fourStep'` 모드로 전환할 수 없음에도 이 상수는 여전히 `true`로 선언되어 있습니다. 이 상수는 555번째 줄과 580번째 줄에서 조건문으로 사용되고 있으나, 실제로 `'fourStep'` 모드에 도달할 방법이 없습니다.

**1-2. `chartViewMode` 상태 타입 (라인 390)**
```
const [chartViewMode, setChartViewMode] = useState<'midCategory' | 'fourStep'>('midCategory');
```
`'fourStep'` 타입이 여전히 포함되어 있으나, 해당 모드로 전환할 UI가 제거되었습니다.

**1-3. 조건부 렌더링 분기 (라인 580-586)**
```
{SHOW_FOUR_STEP && chartViewMode === 'fourStep' ? (
  <FourStepInterpretation
    tScores={current.tScores}
    prevTScores={isCompare && r1 ? r1.tScores : undefined}
    midCategoryScores={current.midCategoryScores}
    prevMidCategoryScores={isCompare && r1 ? r1.midCategoryScores : undefined}
    studentName={student.name}
  />
) : (
  <FactorHeatmapSection domainData={domainData} prevDomainData={prevDomainData} />
)}
```
사용자가 `'fourStep'` 모드로 전환할 수 없으므로 `FourStepInterpretation` 분기는 영원히 실행되지 않습니다.

**1-4. 불필요한 import (라인 26)**
```
FourStepInterpretation,
```
사용되지 않는 컴포넌트가 import되어 번들에 포함됩니다.

**해결 방안**: `SHOW_FOUR_STEP` 플래그를 `false`로 변경하거나, 더 나아가 관련 조건문과 import를 완전히 제거하여 코드를 깔끔하게 정리하는 것을 권장합니다.

**기존 코드 (라인 38)**:
```
const SHOW_FOUR_STEP = true;
```

**수정 코드**:
```
// HSJ-31: 4단계 해석 탭 제거로 인해 항상 중분류 요인 차트만 표시
const SHOW_FOUR_STEP = false;
```

**기존 코드 (라인 390)**:
```
const [chartViewMode, setChartViewMode] = useState<'midCategory' | 'fourStep'>('midCategory');
```

**수정 코드**:
```
const [chartViewMode, setChartViewMode] = useState<'midCategory'>('midCategory');
```

**기존 코드 (라인 580-586)**:
```
{SHOW_FOUR_STEP && chartViewMode === 'fourStep' ? (
  <FourStepInterpretation
    tScores={current.tScores}
    prevTScores={isCompare && r1 ? r1.tScores : undefined}
    midCategoryScores={current.midCategoryScores}
    prevMidCategoryScores={isCompare && r1 ? r1.midCategoryScores : undefined}
    studentName={student.name}
  />
) : (
  <FactorHeatmapSection domainData={domainData} prevDomainData={prevDomainData} />
)}
```

**수정 코드**:
```
<FactorHeatmapSection domainData={domainData} prevDomainData={prevDomainData} />
```

**기존 코드 (라인 26)**:
```
import {
  DiagnosisSummary,
  FourStepInterpretation,
  TypeClassification,
  TypeDeviations,
  CoachingStrategy,
  RightPanel,
  DataHelperChatbot,
  type PanelTab,
} from '@features/student-dashboard/ui';
```

**수정 코드**:
```
import {
  DiagnosisSummary,
  TypeClassification,
  TypeDeviations,
  CoachingStrategy,
  RightPanel,
  DataHelperChatbot,
  type PanelTab,
} from '@features/student-dashboard/ui';
```

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

버튼만 주석 처리하고 관련 조건문, 상태 타입, import를 그대로 방치하면 데드 코드가 되어 유지보수성을 저하시키고 번들 크기에 영향을 줍니다. `SHOW_FOUR_STEP` 플래그를 `false`로 변경하거나, 더 나아가 관련 조건문과 import를 완전히 제거하여 코드를 깔끔하게 정리하는 것을 권장합니다. 기능을 일시적으로 숨기는 것인지 영구 제거하는 것인지 명확히 결정한 후 후속 작업을 진행해주세요.