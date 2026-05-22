> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 5edabec1

## 코드 복잡도 분석

**분석된 파일**: 5개 / 변경된 파일: 5개


### 정상 범위 (NONE)


**`dgnssmapper.xml`** (other)

- 평균 복잡도: **0.244**

- 최대 복잡도: 0.476

- 청크 수: 2개

- 평균 사용처: 7.0곳


**권장사항:**

- 복잡도 정상 범위


**`drawpdfservice.java`** (other)

- 평균 복잡도: **0.235**

- 최대 복잡도: 0.470

- 청크 수: 16개

- 평균 사용처: 31.4곳


**권장사항:**

- 복잡도 정상 범위


**`pdfservice.java`** (other)

- 평균 복잡도: **0.214**

- 최대 복잡도: 0.468

- 청크 수: 11개

- 평균 사용처: 33.8곳


**권장사항:**

- 복잡도 정상 범위


**`dgnssmapper.java`** (other)

- 평균 복잡도: **0.192**

- 최대 복잡도: 0.466

- 청크 수: 194개

- 평균 사용처: 28.6곳


**권장사항:**

- 파일 크기가 큼 (194개 청크) - 파일 분리 검토


**`dgnssservice.java`** (other)

- 평균 복잡도: **0.129**

- 최대 복잡도: 0.473

- 청크 수: 59개

- 평균 사용처: 14.9곳


**권장사항:**

- 파일 크기가 큼 (59개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 진단검사(Dgnss) 도메인의 **1회차(ordNo=1) 출제 로직을 분리하고, 학생 분석 조회 시 claId 조건을 제거하여 학급 경계를 넘나드는 데이터 조회를 가능하게** 하는 변경입니다.

- **목적**: 1회차 출제 시에도 타학급 중복 응시를 차단하는 eligibility 검증 로직 추가, 학생 분석 데이터를 모든 학급 이력에서 조회하도록 개선, PDF 생성 성능 로깅 추가
- **도메인**: 비즈니스 로직 (진단검사 출제/분석/PDF 생성)
- **변경 방향**: 기존에는 2회차에만 eligibility 검증이 있었으나, 1회차에도 동일한 검증을 적용. 또한 학생 분석 시 특정 학급(claId)에 국한하지 않고 모든 그룹 이력을 조회하도록 확장

---

## [GOOD] 잘된 점

**1. 1회차 eligibility 검증 로직 추가**

기존에는 `insertTcDgnssStart` 메서드에서 `ordNo == 2`인 경우에만 `selectEligibleTargetStListForOrd2`를 호출하여 타학급 중복 응시를 차단했습니다. 이제 `ordNo == 1`인 경우에도 `selectEligibleTargetStListForOrd1`을 통해 동일한 검증을 수행합니다.

```java
// DgnssService.java - insertTcDgnssStart 메서드
List<String> targetStList;
if (ordNo == 1) {
    targetStList = dgnssMapper.selectEligibleTargetStListForOrd1(paramMap);
    if (CollectionUtils.isEmpty(targetStList)) {
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("result", "fail");
        resultMap.put("message", "모든 학생이 다른 학급에서 검사가 진행 중입니다.");
        return resultMap;
    }
} else if (ordNo == 2) {
    targetStList = dgnssMapper.selectEligibleTargetStListForOrd2(paramMap);
    // ...
} else {
    targetStList = dgnssMapper.selectTargetStList(paramMap);
}
```

이로 인해 1회차에서도 타학급에서 이미 검사를 진행 중인 학생이 있다면 출제가 차단되어, 데이터 무결성이 향상되었습니다.

**2. PDF 성능 로깅 도입**

`PdfService.java`의 `createDgnssAnalysisByTemplate`와 `createDgnssReportCoch` 메서드에 템플릿 로드, 페이지 렌더링, PDF 직렬화, 파일 업로드 각 단계별로 `System.currentTimeMillis()` 기반 로깅이 추가되었습니다.

```java
// PdfService.java - createDgnssAnalysisByTemplate
long templateStart = System.currentTimeMillis();
// ... 템플릿 로드 ...
log.info("[PDF 상세] 학생용 템플릿 로드: {}ms ({})", System.currentTimeMillis() - templateStart, dgnssType);

long renderStart = System.currentTimeMillis();
// ... 페이지 렌더링 ...
log.info("[PDF 상세] 학생용 페이지 렌더링: {}ms ({}페이지, 페이지당 {}ms)",
        System.currentTimeMillis() - renderStart, totalPages,
        (System.currentTimeMillis() - renderStart) / totalPages);
```

이를 통해 운영 환경에서 PDF 생성 성능 병목 지점을 정확히 파악할 수 있게 되었습니다. 특히 페이지당 평균 렌더링 시간을 로깅하여 페이지 수가 다른 DGNSS_10(23페이지)과 DGNSS_20(18페이지)의 성능을 비교할 수 있습니다.

**3. DrawPdfService 중복 코드 제거 (변수 Hoisting)**

`DrawPdfService.java`에서 `getColorByTScoreForStress` 호출을 각 분기 내부에서 루프 상단으로 끌어올려(hoisting) 중복을 제거했습니다. 변경 전에는 "학업스트레스", "학습 방해물", "학업관계 스트레스" 등 7개 분기에서 각각 동일한 호출이 있었으나, 변경 후에는 루프 시작 부분에서 한 번만 호출합니다.

```java
// 변경 전 (중복 호출)
} else if (StringUtils.equals("학업스트레스", sectionNm)) {
    Color stressColor = this.getColorByTScoreForStress(pioPdf, tScore);
    // ...
} else if (StringUtils.equals("학습 방해물", sectionNm)) {
    Color stressColor = this.getColorByTScoreForStress(pioPdf, tScore);
    // ...

// 변경 후 (루프 상단으로 이동)
Color stressColor = this.getColorByTScoreForStress(pioPdf, tScore);
// ...
} else if (StringUtils.equals("학업스트레스", sectionNm)) {
    // stressColor 재사용
```

---

## 변경사항 요약

| 파일 | 변경 내용 |
|------|----------|
| `DgnssMapper.java` | `selectEligibleTargetStListForOrd1` 메서드 시그니처 추가 |
| `DgnssMapper.xml` | 1회차 대상 학생 조회 쿼리 신규, 2회차 쿼리 조건 강화(타교사 학급 멤버십 차단), `selectTcDgnssStartPreview`에 ordNo 분기, `selectStInfo` claId 조건 제거 + LIMIT/ORDER BY, `selectStLernAnalysis` claId 조건 제거 |
| `DgnssService.java` | `insertTcDgnssStart`에 ordNo==1 분기, `selectUnifiedStAnalysis`에서 claId 파라미터 제거 |
| `DrawPdfService.java` | `stressColor` 변수 hoisting으로 중복 호출 제거 |
| `PdfService.java` | PDF 생성 전 구간 성능 로깅, `dgnssType` 지역변수 추출 |

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

**없음**

### High (우선 수정 권장)

**이슈 1: `selectStInfo` 쿼리에서 `LEFT JOIN group_member`로 변경 시 데이터 정합성 위험**

- **파일**: `backend/src/main/resources/mapper/dgnss/DgnssMapper.xml`
- **위치**: `selectStInfo` 쿼리 (라인 3038~3055)

**변경 전:**
```sql
INNER JOIN group_member gm ON gi.group_id = gm.group_id AND a1.stdt_id = gm.stdt_id
```

**변경 후:**
```sql
LEFT JOIN group_member gm ON gi.group_id = gm.group_id AND a1.stdt_id = gm.stdt_id
```

**문제 분석:**

`LEFT JOIN`으로 변경하면 `group_member` 테이블에 해당 학생이 존재하지 않아도 `tb_dgnss_result_info`의 데이터는 조회됩니다. 이로 인해 다음과 같은 문제가 발생할 수 있습니다:

1. **NPE 가능성**: `DgnssService.java`의 `selectUnifiedStAnalysis` 메서드에서 `stUserInfo` 맵에서 `claId`를 꺼내 사용하는 코드가 제거되었지만, 다른 호출자에서 `gm.nickname`, `gm.member_no` 등 `group_member` 컬럼을 사용한다면 null이 반환되어 NPE가 발생할 수 있습니다.

2. **최신 이력 식별 불가**: `ORDER BY a1.subm_dt DESC LIMIT 1`로 최신 이력 하나만 가져오는데, 이 경우 어떤 학급의 이력인지 식별할 수 없습니다. 이후 `selectStLernAnalysis`에서 `claId` 조건 없이 모든 그룹 이력을 조회하도록 변경되었으므로, 의도치 않은 데이터가 반환될 가능성이 있습니다.

**권장 조치:**
- `LEFT JOIN`이 불가피하다면, `gm.nickname` 등 `group_member` 의존 컬럼을 사용하는 Java 코드에서 null-safe 처리가 되어 있는지 반드시 확인하세요.
- 또는 `LEFT JOIN` 대신 `INNER JOIN`을 유지하되 `claId` 조건만 제거하는 방안을 검토하세요.
- **[수정 코드 제시 불가]** `selectStInfo`의 전체 컬럼과 Java 측 사용처를 모두 확인해야 정확한 판단이 가능합니다.

---

**이슈 2: `selectEligibleTargetStListForOrd2` 쿼리 성능 저하 가능성**

- **파일**: `backend/src/main/resources/mapper/dgnss/DgnssMapper.xml`
- **위치**: 라인 184~230

**변경된 쿼리 구조:**
```sql
SELECT gm.stdt_id
FROM group_info gi
    INNER JOIN group_member gm ON gi.group_id = gm.group_id
WHERE gi.cla_id = #{claId}
  /* 서브쿼리 1: 1회차 이력 존재 확인 */
  AND EXISTS (
      SELECT 1 FROM tb_dgnss_info tdi_any
          INNER JOIN tb_dgnss_result_info tdri_any ON tdri_any.dgnss_id = tdi_any.id
      WHERE tdi_any.ord_no = 1 AND tdi_any.paper_idx = #{paperIdx}
        AND tdri_any.stdt_id = gm.stdt_id
  )
  /* 서브쿼리 2: 타학급 2회차 이력 없음 확인 */
  AND NOT EXISTS (
      SELECT 1 FROM tb_dgnss_info tdi_other
          INNER JOIN tb_dgnss_result_info tdri_other ON tdri_other.dgnss_id = tdi_other.id
      WHERE tdi_other.ord_no = 2 AND tdi_other.paper_idx = #{paperIdx}
        AND tdi_other.cla_id != #{claId}
        AND tdri_other.stdt_id = gm.stdt_id
  )
  /* 서브쿼리 3: 타교사 학급 멤버십 차단 (신규) */
  AND NOT EXISTS (
      SELECT 1
      FROM tb_dgnss_info tdi_other1
          INNER JOIN tb_dgnss_result_info tdri_other1 ON tdri_other1.dgnss_id = tdi_other1.id
          INNER JOIN group_info gi_other ON gi_other.cla_id = tdi_other1.cla_id
          INNER JOIN group_member gm_other ON gi_other.group_id = gm_other.group_id
              AND gm_other.stdt_id = tdri_other1.stdt_id
      WHERE tdi_other1.ord_no = 1 AND tdi_other1.paper_idx = #{paperIdx}
        AND tdi_other1.cla_id != #{claId}
        AND gi_other.host_user_no != gi.host_user_no
        AND tdri_other1.stdt_id = gm.stdt_id
  )
```

**문제 분석:**

3개의 `EXISTS`/`NOT EXISTS` 서브쿼리가 중첩되어 있으며, 특히 세 번째 서브쿼리는 `group_info`와 `group_member`를 추가로 JOIN합니다. 총 4개 테이블(`tb_dgnss_info`, `tb_dgnss_result_info`, `group_info`, `group_member`)이 3중 서브쿼리로 중첩 조회됩니다.

- `group_member` 테이블은 메인 쿼리와 세 번째 서브쿼리에서 총 2번 조인됩니다.
- `group_info`의 `host_user_no`로 교사 식별을 수행하는데, 이 컬럼에 인덱스가 없다면 대규모 학급 데이터에서 성능 저하가 발생할 수 있습니다.
- `tb_dgnss_info`는 `ord_no`, `paper_idx`, `cla_id` 조건으로 필터링되는데, 이 컬럼들에 대한 복합 인덱스가 없다면 풀 테이블 스캔이 발생할 수 있습니다.

**권장 조치:**
- `tb_dgnss_info(cla_id, ord_no, paper_idx)` 복합 인덱스 확인
- `group_info(host_user_no)` 단일 인덱스 확인
- 실행 계획(EXPLAIN)을 통해 서브쿼리별 rows 수와 인덱스 사용 여부를 검증하세요.
- **[수정 코드 제시 불가]** 인덱스 현황과 데이터 분포를 확인해야 정확한 인덱스 전략 수립이 가능합니다.

---

### Medium (개선 권장)

**이슈 3: `selectTcDgnssStartPreview`에서 `ordNo` 파라미터 누락 가능성**

- **파일**: `backend/src/main/resources/mapper/dgnss/DgnssMapper.xml` (라인 205~)
- **내용**: `selectTcDgnssStartPreview` 쿼리는 `<choose><when test="ordNo == 1">` 분기를 통해 1회차와 그 외(2회차)의 status 계산 로직을 분리했습니다. 그런데 `ordNo` 파라미터가 전달되지 않거나 null인 경우 `<otherwise>` 분기(2회차 로직)로 fallback됩니다. 이 경우 의도치 않게 2회차 eligibility 로직이 1회차 preview에도 적용될 수 있습니다.
- **제안**: Java 서비스 레이어(`selectTcDgnssStartPreview`)에서 `ordNo` 파라미터가 없거나 유효하지 않은 경우에 대한 방어 로직을 추가하거나, MyBatis XML에서 `<when test="ordNo != null and ordNo == 1">`로 null 체크를 명시하는 것이 안전합니다.

---

**이슈 4: `PdfService.java`의 `dgnssType` 문자열 비교 시 NPE 가능성**

- **파일**: `backend/src/main/java/com/vs/meta/api/dgnss/service/PdfService.java`
- **위치**: 라인 155, 192, 278, 314

**변경 전:**
```java
if(userInfo.get("DGNSS_ID").toString().equals("DGNSS_10")) {
```

**변경 후:**
```java
if(dgnssType.equals("DGNSS_10")) {
```

`dgnssType` 지역변수 추출은 가독성 측면에서 좋은 변경입니다. 하지만 `dgnssType`이 null인 경우 NPE가 발생할 수 있습니다. `userInfo.get("DGNSS_ID")`가 null을 반환하면 `toString()`에서 NPE가 발생하므로, 변경 전후 모두 동일한 리스크가 존재합니다.

**권장 수정 코드:**
```java
if("DGNSS_10".equals(dgnssType)) {
```

상수를 앞에 두는 방식으로 변경하면 `dgnssType`이 null이어도 NPE 없이 false를 반환합니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - High 이슈 존재

**종합 의견:**

전반적으로 1회차 출제 로직 분리와 학생 분석 조회 범위 확장이라는 명확한 목적을 가진 좋은 변경입니다. PDF 성능 로깅과 중복 코드 제거도 긍정적입니다.

다만 다음 두 가지 High 이슈는 운영 환경에서 실제 문제로 이어질 수 있으므로, 배포 전에 반드시 확인하시길 권장합니다:

1. **`selectStInfo`의 `LEFT JOIN` 변경**: `group_member`에 존재하지 않는 학생의 데이터가 조회될 경우, Java 측에서 NPE가 발생할 수 있습니다. `group_member` 의존 컬럼 사용처를 모두 확인하고 null-safe 처리가 되어 있는지 검증하세요.

2. **`selectEligibleTargetStListForOrd2`의 3중 서브쿼리 성능**: `host_user_no`와 `cla_id`/`ord_no`/`paper_idx` 복합 인덱스가 없다면 대규모 데이터에서 성능 저하가 발생할 수 있습니다. 실행 계획을 확인하고 필요한 인덱스를 추가하세요.

이 두 가지 이슈만 해결되면 충분히 승인 가능한 수준의 커밋입니다.