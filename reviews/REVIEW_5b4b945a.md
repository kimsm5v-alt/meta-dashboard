> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 5b4b945a

## 코드 복잡도 분석

**분석된 파일**: 3개 / 변경된 파일: 3개


### 정상 범위 (NONE)


**`dgnssmapper.xml`** (other)

- 평균 복잡도: **0.475**

- 최대 복잡도: 0.475

- 청크 수: 1개

- 평균 사용처: 14.0곳


**권장사항:**

- 복잡도 정상 범위


**`dgnssservice.java`** (other)

- 평균 복잡도: **0.465**

- 최대 복잡도: 0.473

- 청크 수: 16개

- 평균 사용처: 55.1곳


**권장사항:**

- 복잡도 정상 범위


**`dgnssmapper.java`** (other)

- 평균 복잡도: **0.460**

- 최대 복잡도: 0.467

- 청크 수: 81개

- 평균 사용처: 68.5곳


**권장사항:**

- 파일 크기가 큼 (81개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 "학심정(학생심리진단)" 기능에서 **다른 학급에 속한 학생의 심리검사 결과도 현재 학급의 담당 교사가 조회할 수 있도록** 하는 fallback 정책을 구현합니다. 기존에는 같은 학급(claId) 내에서만 데이터를 조회했으나, 학급 이동이나 전입 등의 사유로 다른 학급에서 진단을 응시한 학생이 현재 학급 명단에는 있으나 결과가 보이지 않는 문제를 해결합니다.

- **목적**: 현재 학급 그룹에 속하지만 다른 학급에서 진단을 응시한 학생의 결과를 fallback 조회하여 응답에 포함
- **도메인**: 비즈니스 로직 (진단/심리검사 API - DGnss)
- **변경 방향**: 기존 단일 학급 조회에서 -> "현재 학급 우선 + 타학급 fallback + source 필드로 출처 구분" 방식으로 개선

---

## [GOOD] 잘된 점

1. **추상화 수준이 적절함**: `applyStInfoListFallback`과 `dispatchStInfoFallback`으로 fallback 로직을 분리하여 `selectTcStInfoList` 메서드의 복잡도를 낮췄습니다. 기존 로직을 건드리지 않고 확장한 점이 좋습니다.

2. **source 필드 도입**: 각 row에 `IN_CLASS` / `OTHER_CLASS` source를 부여하여 FE에서 데이터 출처를 구분할 수 있도록 한 설계가 명확합니다. `applyStInfoListFallback` 메서드에서 기존 row에는 `IN_CLASS`, fallback으로 추가된 row에는 `OTHER_CLASS`를 부여합니다.

3. **중복 제거 로직**: `deduplicateByStdtId`를 통해 동일 학생이 IN_CLASS와 OTHER_CLASS 양쪽에 모두 존재할 경우 IN_CLASS(원본)를 우선하도록 처리한 점이 적절합니다. 이 메서드는 `LinkedHashMap`을 사용하여 첫 번째로 등장하는 row(즉, IN_CLASS)를 유지합니다.

4. **미제출 상태 노출**: `selectClassStudentsSubmStatusFromOtherClasses`를 통해 타학급에서 응시 중(subm_at='N')인 학생도 목록에 포함시켜 FE가 "다른 학급에서 응시 중(미제출)" 상태를 표시할 수 있도록 한 점이 세심합니다.

---

## 변경사항 요약

- `DgnssMapper.java`: 9개의 `*FromOtherClasses` 매퍼 메서드 + `selectClaIdByDgnssId`, `selectClassStudentsSubmStatusFromOtherClasses` 추가
- `DgnssService.java`: `applyStInfoListFallback`, `dispatchStInfoFallback` 메서드 추가 및 `selectTcStInfoList`, `selectTcDgnssDetailInfo`에 fallback 로직 통합
- `DgnssMapper.xml`: 9개의 `*FromOtherClasses` SQL + `selectClaIdByDgnssId`, `selectClassStudentsSubmStatusFromOtherClasses` 쿼리 추가 (약 440라인)

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

1. **`selectTcDgnssDetailInfo`에서 `missingStudents` 변수의 스코프 문제**

   `selectTcDgnssDetailInfo` 메서드의 for 루프 내부에서 `missingStudents`는 각 dgnssId(회차)별로 새로 선언되고 조회됩니다. 그런데 `studentLernList`를 구성하는 하단 로직에서 이 `missingStudents`를 사용하여 타학급 미제출 상태를 조회합니다. 이는 현재 dgnssId 기준으로 올바르게 동작합니다.

   그러나 `missingStudents`는 `selectClassStudentsWithoutResultInClassForOrd`로 조회된 "현재 학급 그룹에 속하지만 현재 학급의 진단 결과가 없는 학생" 목록입니다. 이 학생들이 **다른 학급에서도 전혀 응시하지 않은 경우**(어디에서도 result가 없는 경우)에는 `selectClassStudentsSubmStatusFromOtherClasses` 쿼리 결과에 포함되지 않아 무시됩니다. 이는 의도된 동작으로 보이나, 이런 학생들이 응답에서 완전히 누락된다는 점을 인지해야 합니다.

   **위치**: `DgnssService.java` 라인 1430-1470 (for 루프 내부)
   **판단**: 현재 로직은 정상 동작하나, `missingStudents`에 포함되었으나 타학급에서도 결과가 없는 학생에 대한 처리가 없으므로 FE와의 협의가 필요할 수 있습니다.

2. **`selectDgnssAnswerReliabilityFromOtherClasses` SQL에서 `a1.cla_id <> #{claId}` 조건의 인덱스 활용 가능성**

   `*FromOtherClasses` SQL들은 모두 `a1.cla_id <> #{claId}` 조건을 사용합니다. `<>` (부등호) 조건은 일반적으로 인덱스 범위 스캔의 효율이 떨어집니다. `tb_dgnss_info` 테이블에 `cla_id` 단일 컬럼 인덱스가 있다면 `=` 조건에 비해 성능이 저하될 수 있습니다.

   **위치**: `DgnssMapper.xml` - 모든 `*FromOtherClasses` select 쿼리 (약 9개)
   **제안**: `cla_id` + `paper_idx` + `ord_no` 복합 인덱스가 있다면 `<>` 조건에서도 어느 정도 커버되나, 데이터 양이 많을 경우 실행 계획을 확인해볼 필요가 있습니다.

### Medium (개선 권장)

1. **`ObjectMapper` 인스턴스 재사용**

   `selectTcDgnssDetailInfo` 메서드에서 `ObjectMapper lernJsonParser = new ObjectMapper();`가 메서드가 호출될 때마다 새로 생성됩니다. `ObjectMapper`는 생성 비용이 있는 무거운 객체이므로, static final 필드로 선언하여 재사용하는 것이 좋습니다.

   **위치**: `DgnssService.java` 라인 1414
   **기존 코드**:
   ```java
   ObjectMapper lernJsonParser = new ObjectMapper();
   ```
   **해결 방안**:
   ```java
   private static final ObjectMapper LERN_JSON_PARSER = new ObjectMapper();
   ```
   단, 이 변경은 `DgnssService` 클래스 전체에 영향을 주므로, 기존에 `ObjectMapper`를 사용하는 다른 곳과의 일관성을 고려해야 합니다. 이미 `@RequiredArgsConstructor`로 주입받는 `ObjectMapper`가 있다면 그것을 재사용하는 것이 더 좋습니다.

2. **`dispatchStInfoFallback`의 type=1 중복 매핑**

   `dispatchStInfoFallback` 메서드에서 `paperIdx == 1`과 `paperIdx != 1` 모두에서 `type == 1`일 때 `selectDgnssAnswerReliabilityFromOtherClasses`를 호출합니다. 즉, paperIdx에 관계없이 type=1은 항상 같은 매퍼가 호출됩니다. 이는 현재 요구사항에 맞는 구현이지만, 향후 paperIdx별로 type=1의 매퍼가 달라질 경우 수정이 필요함을 주석으로 남겨두면 좋습니다.

   **위치**: `DgnssService.java` 라인 785-798

3. **`selectClassStudentsSubmStatusFromOtherClasses` SQL에 `dgnss_at = 'N'` 조건**

   `selectClassStudentsSubmStatusFromOtherClasses` 쿼리에 `a1.dgnss_at = 'N'` 조건이 포함되어 있습니다. 이는 진단이 진행 중인(dgnss_at='N') 상태의 데이터만 조회하겠다는 의미입니다. 만약 진단이 종료된(dgnss_at='Y') 상태에서도 타학급 응시자를 조회해야 하는 요구사항이 생긴다면 이 조건을 재검토해야 합니다.

   **위치**: `DgnssMapper.xml` - `selectClassStudentsSubmStatusFromOtherClasses` 쿼리

---

## 주요 파일 분석

### DgnssService.java

**변경 내용:**
- `selectTcStInfoList` 메서드: 기존 type별 분기 로직 이후에 `applyStInfoListFallback` 호출 추가, `resultMap.put`을 fallback 이후로 이동
- `applyStInfoListFallback` 메서드 추가: 타학급 fallback 로직을 캡슐화
- `dispatchStInfoFallback` 메서드 추가: paperIdx+type 조합에 따른 9개 매퍼 디스패치
- `selectTcDgnssDetailInfo` 메서드: `lernReportByOrd` 응답 추가 (paperIdx=1인 경우에만)

**핵심 로직 흐름 (selectTcStInfoList):**

1. 기존 type별 분기로 `stInfoList` 조회 (현재 학급 데이터)
2. `applyStInfoListFallback(stInfoList, param, paperIdx, type)` 호출
3. 내부에서 `selectClaIdByDgnssId`로 현재 dgnssId의 claId 조회
4. `selectClassStudentsWithoutResultInClassForOrd`로 "현재 학급 그룹에 속하지만 현재 학급에서 결과가 없는 학생" 목록 조회
5. `dispatchStInfoFallback`으로 해당 학생들의 타학급 데이터 조회
6. 기존 row에는 `source=IN_CLASS`, fallback row에는 `source=OTHER_CLASS` 부여
7. `deduplicateByStdtId`로 중복 제거 (IN_CLASS 우선)

**핵심 로직 흐름 (selectTcDgnssDetailInfo):**

1. `targetDgnssIdList`를 순회하며 각 dgnssId(회차)별로 `selectClassTotalReport` 조회
2. `selectClassTotalReportFromOtherClasses`로 타학급 fallback 데이터 조회 및 `source` 부여
3. `lpaByOrd` 구성 (기존 LPA 데이터)
4. `lernReportByOrd` 구성 (paperIdx=1인 경우만): 각 학생의 `json` 컬럼을 파싱하여 `sectionScores` 구성, `source`와 `subm_at` 정보 포함
5. 타학급에서 미제출(subm_at='N')인 학생도 `selectClassStudentsSubmStatusFromOtherClasses`로 조회하여 `lernReportByOrd`에 추가

### DgnssMapper.xml

**변경 내용:**
- 9개의 `*FromOtherClasses` SQL 추가 (기존 `selectDgnssAnswerReliability`, `selectLernType2~6`, `selectDgnssAnswerReport(Motivate|Recognition|Behavior)`의 WHERE 조건만 변경한 형태)
- `selectClaIdByDgnssId` 쿼리 추가
- `selectClassStudentsSubmStatusFromOtherClasses` 쿼리 추가

**SQL 패턴 분석:**

모든 `*FromOtherClasses` SQL은 다음과 같은 공통 패턴을 가집니다:
- SELECT 절: 기존 쿼리와 동일 (ROW_NUMBER, stdtId, nickname, memberNo, reaction, desirable, repeatResponse, lpa 관련 컬럼, gender 등 + type별 T_SCORE 서브쿼리)
- FROM 절: `tb_dgnss_info a1 INNER JOIN tb_dgnss_result_info b1 ... INNER JOIN group_info gi ON gi.cla_id = #{claId} INNER JOIN group_member gm ON gi.group_id = gm.group_id AND b1.stdt_id = gm.stdt_id`
- WHERE 절: `a1.cla_id <> #{claId} AND a1.paper_idx = #{paperIdx} AND a1.ord_no = #{ordNo} AND a1.dgnss_at = 'N' AND b1.subm_at = 'Y' AND b1.stdt_id IN (...)`

핵심 차이는 기존 쿼리가 `a1.cla_id = #{claId}`로 현재 학급만 조회하는 반면, `*FromOtherClasses`는 `a1.cla_id <> #{claId}`로 다른 학급을 조회하면서도 `group_info` JOIN은 현재 학급의 `claId`로 고정하여 닉네임과 member_no를 현재 학급 기준으로 표시한다는 점입니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

이 커밋은 명확한 요구사항(타학급 응시자 결과 노출)을 체계적으로 구현했습니다. `applyStInfoListFallback`과 `dispatchStInfoFallback`으로 fallback 로직을 잘 추상화했고, source 필드와 `deduplicateByStdtId`로 데이터 정합성을 확보한 점이 인상적입니다. SQL 중복이 다소 있지만, 이는 기존 쿼리 구조를 유지하면서 안전하게 확장한 전략으로 이해할 수 있습니다. `ObjectMapper` 인스턴스 재사용과 `dgnssId` 타입 안전성은 향후 리팩토링 시 고려할 사항입니다. 전반적으로 안정적이고 실용적인 코드이며, 명백한 버그나 성능 저하 요소는 발견되지 않았습니다. 조건부 승인합니다.