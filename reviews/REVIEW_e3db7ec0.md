> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - e3db7ec0

## 코드 복잡도 분석

**분석된 파일**: 5개 / 변경된 파일: 5개


### 정상 범위 (NONE)


**`dgnssmapper.xml`** (other)

- 평균 복잡도: **0.243**

- 최대 복잡도: 0.474

- 청크 수: 2개

- 평균 사용처: 7.0곳


**권장사항:**

- 복잡도 정상 범위


**`dgnsscontroller.java`** (other)

- 평균 복잡도: **0.227**

- 최대 복잡도: 0.470

- 청크 수: 23개

- 평균 사용처: 28.1곳


**권장사항:**

- 파일 크기가 큼 (23개 청크) - 파일 분리 검토


**`dgnssmapper.java`** (other)

- 평균 복잡도: **0.191**

- 최대 복잡도: 0.466

- 청크 수: 195개

- 평균 사용처: 28.5곳


**권장사항:**

- 파일 크기가 큼 (195개 청크) - 파일 분리 검토


**`dgnsslpaservice.java`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.007

- 청크 수: 20개


**권장사항:**

- 복잡도 정상 범위


**`pdfdownloadservice.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.009

- 청크 수: 18개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 두 가지 주요 기능 변경을 포함합니다. 첫째, LPA(잠재프로파일분석) 유형 분류 결과를 검사(dgnssId) 단위로 일괄 재분류할 수 있는 관리자 API를 추가합니다. 둘째, ZIP 파일 다운로드 방식을 2단계(URL 조회 후 프록시 다운로드)로 개선하여 NAS 파일 접근을 통합된 보안 채널로 처리합니다.

- **목적**: (1) 관리자가 기존 T점수를 기반으로 LPA 유형을 재분류할 수 있는 배치성 API 제공, (2) ZIP 다운로드 시 NAS 파일 경로를 `/pfile-download` 프록시를 통해 안전하게 다운로드하도록 개선
- **도메인**: 백엔드 API(관리자 기능) + 프론트엔드 서비스 로직
- **변경 방향**: (백엔드) `Map<String, Integer>`에서 `Map<String, Double>`로 타입 정밀도 향상, SQL에서 `ROUND(T_SCORE)` 제거로 원시값 보존, 건별 격리 처리로 장애 영향 최소화. (프론트엔드) ZIP 생성 요청과 실제 다운로드를 분리하여 책임 명확화

---

## [GOOD] 잘된 점

1. **건별 격리(Exception isolation) 처리**: `reprocessByDgnssId`에서 각 `answerIdx`별로 try-catch로 감싸 한 학생의 실패가 전체 재분류를 중단시키지 않도록 설계한 점이 우수합니다. 실패 목록을 `failedAnswerIdx`로 반환하여 사후 확인도 가능합니다.

2. **T점수 타입 정밀도 향상**: `Map<String, Integer>`에서 `Map<String, Double>`로 변경하고 SQL에서 `ROUND(T_SCORE)`를 제거하여, LPA 분류에 사용되는 점수의 정밀도를 유지했습니다. 분류 알고리즘(로그 우도 계산)에서 소수점 정보가 중요한 점을 고려할 때 적절한 개선입니다.

3. **프론트엔드 ZIP 다운로드 2단계 분리**: 기존에는 `/api/dgnss/dgnss-download-all`이 직접 blob을 반환했다면, 이제 JSON으로 `zipFileUrl`을 먼저 받고 `/files/pfile-download` 프록시를 통해 실제 다운로드하도록 변경하여, NAS 파일 접근을 통합된 보안 채널로 처리하게 된 점이 좋습니다.

---

## 변경사항 요약

- `DgnssLpaService`에 `reprocessByDgnssId(int)` 메서드 추가 (검사 단위 LPA 재분류)
- `DgnssMapper`/XML에 `selectLpaTargetAnswerIdxByDgnssId` 쿼리 추가
- SQL `selectLpaFactorScores`에서 `ROUND(T_SCORE)` 제거, Java 측 타입 `Integer`→`Double` 변경
- `DgnssController`에 `POST /api/dgnss/lpa/reprocess` 엔드포인트 추가
- `pdfDownloadService.ts` ZIP 다운로드 로직을 2단계(URL 조회 → 프록시 다운로드)로 변경

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `selectLpaTargetAnswerIdxByDgnssId` 쿼리에서 `tb_dgnss_answer` 테이블 조인 조건 검증 필요**

- **파일**: `backend/src/main/resources/mapper/dgnss/DgnssMapper.xml` (라인 3686-3694)
- **기존 코드**:
```xml
<select id="selectLpaTargetAnswerIdxByDgnssId" parameterType="int" resultType="int">
    /* DgnssMapper.selectLpaTargetAnswerIdxByDgnssId */
    SELECT da.ANSWER_IDX
    FROM tb_dgnss_answer da
        INNER JOIN tb_dgnss_result_info dri ON da.DGNSS_RESULT_ID = dri.id
    WHERE dri.dgnss_id = #{dgnssId}
      AND dri.subm_at = 'Y'
    ORDER BY da.ANSWER_IDX
</select>
```

- **문제점**: `tb_dgnss_answer` 테이블에 `DGNSS_RESULT_ID` 컬럼이 실제로 존재하는지, 그리고 이 관계가 올바른지 확인이 필요합니다. 기존 `selectStUserInfo` 쿼리(라인 1889)를 분석한 결과, 해당 쿼리에서는 `tb_dgnss_answer`(별칭 `DA`)와 `tb_dgnss_result_info`(별칭 `DRI`)를 `ANSWER_IDX`로 조인하지 않고 별도로 조회하는 패턴을 사용하고 있습니다. 만약 `tb_dgnss_answer`에 `DGNSS_RESULT_ID` 컬럼이 없거나 다른 컬럼명(예: `RESULT_ID`)이라면, 이 쿼리는 크로스 조인에 가깝게 동작하거나 빈 결과를 반환할 수 있습니다.

- **해결 방안**: `tb_dgnss_answer` 테이블의 실제 컬럼 구조를 DB에서 확인하고, 필요하다면 `tb_dgnss_result_info`의 `ANSWER_IDX`로 직접 조인하는 방식으로 변경하는 것이 안전합니다. 예를 들어:
```sql
SELECT da.ANSWER_IDX
FROM tb_dgnss_answer da
    INNER JOIN tb_dgnss_result_info dri ON da.ANSWER_IDX = dri.answer_idx
WHERE dri.dgnss_id = #{dgnssId}
  AND dri.subm_at = 'Y'
ORDER BY da.ANSWER_IDX
```

> **수정 코드 제시 불가 -- 문맥 파악 불충분**: `tb_dgnss_answer`와 `tb_dgnss_result_info`의 실제 스키마 관계를 DB에서 직접 확인해야 정확한 조인 조건을 제시할 수 있습니다. `selectStUserInfo` 쿼리에서는 `tb_dgnss_answer`와 `tb_dgnss_result_info`가 `ANSWER_IDX`로 조인되지 않고 별도로 조회되는 패턴을 사용하고 있어, 현재 제시된 조인 조건이 의도한 대로 동작하는지 검증이 필요합니다.

### Medium (개선 권장)

**1. `pdfDownloadService.ts` - JWT 토큰이 URL 파라미터와 Authorization 헤더에 중복 전달**

- **파일**: `frontend/src/shared/services/pdfDownloadService.ts` (라인 131-135)
- **기존 코드**:
```typescript
const downloadUrl = `${ENV.API_URL}/files/pfile-download?url=${encodeURIComponent(zipFileUrl)}&jwtToken=${jwtToken}`;
const response = await axios.get(downloadUrl, {
    headers: { Authorization: `Bearer ${jwtToken}` },
    responseType: 'blob',
});
```

- **문제점**: ZIP 다운로드 URL에 `jwtToken`이 쿼리 파라미터로 포함되고(`&jwtToken=${jwtToken}`), 동시에 `Authorization: Bearer` 헤더로도 전달됩니다. URL 쿼리 파라미터에 JWT 토큰을 포함하면 서버 로그에 토큰이 평문으로 기록될 위험이 있습니다.

- **해결 방안**: 백엔드 `/files/pfile-download` 엔드포인트의 인증 방식을 확인하여, `Authorization` 헤더만으로 인증이 충분하다면 URL 쿼리 파라미터의 `jwtToken`을 제거하는 것이 보안상 더 안전합니다.

---

## 주요 파일 분석

### `DgnssLpaService.java`

**변경 내용:** LPA 재분류 배치 메서드 `reprocessByDgnssId` 추가, 점수 타입 `Integer`→`Double` 변경

**분석:**
- `reprocessByDgnssId` 메서드는 `selectLpaTargetAnswerIdxByDgnssId`로 대상 학생 목록을 조회한 후, 각 `answerIdx`에 대해 `processAndSave`를 호출합니다.
- `processAndSave`는 내부적으로 `selectStUserInfo` → `selectLpaFactorScores` → `buildOrderedScores` → `classify` → `upsertDgnssLpaResult`의 파이프라인으로 동작합니다.
- 각 학생별로 try-catch로 격리되어 있어, 한 학생의 실패가 전체를 중단시키지 않습니다.
- `buildOrderedScores` 메서드의 시그니처가 `Map<String, Double>`로 변경되어, `scoreBySectionId.get(sectionId)`가 `Double`을 반환하도록 일관성이 유지되었습니다.

### `DgnssMapper.xml`

**변경 내용:** `selectLpaTargetAnswerIdxByDgnssId` 쿼리 추가, `selectLpaFactorScores`에서 `ROUND(T_SCORE)` 제거

**분석:**
- `selectLpaFactorScores`에서 `ROUND(T_SCORE)`를 제거한 변경은 LPA 분류 알고리즘의 정밀도 향상을 위한 의도된 변경입니다. `calculateLogLikelihood` 메서드에서 `diff = orderedScores.get(i) - means.get(i)` 계산 시 소수점 정보가 유지되어야 정확한 로그 우도값을 계산할 수 있습니다.
- `selectLpaTargetAnswerIdxByDgnssId`는 `tb_dgnss_answer`와 `tb_dgnss_result_info`를 조인하여 제출 완료(`subm_at = 'Y'`)된 학생의 `ANSWER_IDX` 목록을 반환합니다.

### `pdfDownloadService.ts`

**변경 내용:** ZIP 다운로드 로직을 2단계(URL 조회 → 프록시 다운로드)로 분리

**분석:**
- Step 3-1: `axiosInstance.get('/api/dgnss/dgnss-download-all')`로 ZIP 파일 URL을 JSON 응답으로 먼저 받습니다.
- Step 3-2: 받은 `zipFileUrl`을 `/files/pfile-download` 프록시 URL에 포함시켜 실제 ZIP 파일을 blob으로 다운로드합니다.
- `content-disposition` 헤더 파싱 로직이 간결하게 리팩토링되었습니다. RFC 5987 형식(`filename*=UTF-8''...`)과 일반 형식(`filename=...`)을 모두 처리합니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전반적으로 변경의 방향성과 코드 품질은 양호합니다. 특히 건별 격리 처리와 타입 정밀도 향상은 실무적으로 중요한 개선입니다. 다만 `selectLpaTargetAnswerIdxByDgnssId` 쿼리의 조인 조건(`da.DGNSS_RESULT_ID = dri.id`)이 실제 테이블 스키마와 일치하는지 반드시 확인이 필요합니다. 이는 데이터 무결성에 직접 영향을 미칠 수 있는 사항으로, 배포 전에 DB 스키마를 검증하거나 기존 유사 쿼리(`selectStUserInfo` 등)의 조인 패턴과 일관성을 확인하시기 바랍니다. 이 부분만 확인되면 즉시 승인 가능한 수준의 커밋입니다.