> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 587bc6b5

## 코드 복잡도 분석

**분석된 파일**: 4개 / 변경된 파일: 4개


### 정상 범위 (NONE)


**`dgnssmapper.xml`** (other)

- 평균 복잡도: **0.243**

- 최대 복잡도: 0.475

- 청크 수: 2개

- 평균 사용처: 7.0곳


**권장사항:**

- 복잡도 정상 범위


**`dgnsscontroller.java`** (other)

- 평균 복잡도: **0.194**

- 최대 복잡도: 0.470

- 청크 수: 27개

- 평균 사용처: 23.9곳


**권장사항:**

- 파일 크기가 큼 (27개 청크) - 파일 분리 검토


**`dgnssmapper.java`** (other)

- 평균 복잡도: **0.184**

- 최대 복잡도: 0.466

- 청크 수: 202개

- 평균 사용처: 27.5곳


**권장사항:**

- 파일 크기가 큼 (202개 청크) - 파일 분리 검토


**`dgnssservice.java`** (other)

- 평균 복잡도: **0.108**

- 최대 복잡도: 0.473

- 청크 수: 71개

- 평균 사용처: 12.4곳


**권장사항:**

- 파일 크기가 큼 (71개 청크) - 파일 분리 검토


---


## 변경 배경
- **목적**: 교사가 특정 심리검사(dgnssId)에 대해 학급 학생들의 제출 여부(submAt)와 제출 일시(submDt)를 한눈에 확인할 수 있는 조회 API를 신규 제공
- **도메인**: 비즈니스 로직 (학습심리정서검사 도메인, 교사용 API)
- **변경 방향**: 기존에는 제출 학생 목록(`selectSubmitStList`)과 미제출 학생 user_no 목록(`selectUnsubmittedStudentUserNoListByDgnssId`)이 분리되어 있었으나, 이번 변경으로 제출/미제출 상태를 하나의 목록으로 통합 조회할 수 있게 개선

## [GOOD] 잘된 점
- **API 계층 구조가 명확함**: Controller → Service → Mapper 3계층이 기존 프로젝트 패턴을 정확히 따르고 있어 유지보수성이 높음
- **적절한 검증 로직**: `dgnssId <= 0` 체크를 통해 잘못된 파라미터를 조기에 차단
- **ISO8601 날짜 포맷**: `DATE_FORMAT(b1.subm_dt, '%Y-%m-%dT%H:%i:%s+09:00')`으로 FE에서 바로 사용 가능한 형태로 변환하여 프론트엔드 파싱 부담을 제거
- **`@Transactional(readOnly = true)`**: 조회 전용 트랜잭션으로 성능 최적화를 고려한 점이 좋음

## 변경사항 요약
- `DgnssController.java`: `GET /api/dgnss/tc/submissions` 엔드포인트 추가
- `DgnssService.java`: `selectTcSubmissions()` 메서드 추가 (단순 매퍼 위임)
- `DgnssMapper.java`: `selectSubmissionsByDgnssId()` 매퍼 메서드 추가
- `DgnssMapper.xml`: 학급 학생 제출 현황 조회 쿼리 추가

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)
없음

### High (우선 수정 권장)

**1. INNER JOIN으로 인한 미제출 학생 누락 가능성**

`DgnssMapper.xml`의 `selectSubmissionsByDgnssId` 쿼리는 `tb_dgnss_result_info b1`을 INNER JOIN하고 있습니다. 그러나 이 쿼리의 목적은 "제출 현황 목록"으로, 미제출 학생도 `submAt='N'`으로 포함되어야 합니다.

기존 쿼리 `selectUnsubmittedStudentUserNoListByDgnssId`를 보면 `NOT EXISTS` 서브쿼리로 미제출 학생을 조회하고 있습니다. 이는 미제출 학생이 `tb_dgnss_result_info`에 행이 없을 수 있음을 의미합니다. INNER JOIN을 사용하면 이러한 미제출 학생이 결과에서 완전히 누락됩니다.

- **위치**: `backend/src/main/resources/mapper/dgnss/DgnssMapper.xml` (신규 쿼리, 약 690~704 라인)
- **기존 코드**:
```sql
SELECT b1.stdt_id AS stdtId
     , gm.member_no AS memberNo
     , b1.subm_at AS submAt
     , DATE_FORMAT(b1.subm_dt, '%Y-%m-%dT%H:%i:%s+09:00') AS submDt
FROM tb_dgnss_info a1
    INNER JOIN group_info gi ON a1.cla_id = gi.cla_id
    INNER JOIN group_member gm ON gi.group_id = gm.group_id
        AND gm.status = 'ACTIVE' AND gm.member_type = 'STUDENT'
    INNER JOIN tb_dgnss_result_info b1 ON a1.id = b1.dgnss_id AND b1.stdt_id = gm.stdt_id
WHERE a1.id = #{dgnssId}
ORDER BY gm.member_no
```
- **해결 방안 (수정 코드)**:
```sql
SELECT gm.stdt_id AS stdtId
     , gm.member_no AS memberNo
     , COALESCE(b1.subm_at, 'N') AS submAt
     , DATE_FORMAT(b1.subm_dt, '%Y-%m-%dT%H:%i:%s+09:00') AS submDt
FROM tb_dgnss_info a1
    INNER JOIN group_info gi ON a1.cla_id = gi.cla_id
    INNER JOIN group_member gm ON gi.group_id = gm.group_id
        AND gm.status = 'ACTIVE' AND gm.member_type = 'STUDENT'
    LEFT JOIN tb_dgnss_result_info b1 ON a1.id = b1.dgnss_id AND b1.stdt_id = gm.stdt_id
WHERE a1.id = #{dgnssId}
ORDER BY gm.member_no
```

LEFT JOIN으로 변경하고 `COALESCE(b1.subm_at, 'N')`으로 미제출 학생의 `submAt`을 'N'으로 기본값 처리하면, 미제출 학생도 목록에 포함됩니다. `submDt`는 LEFT JOIN 시 null이 되므로 API 설명에 명시된 "미제출 시 null"과 정확히 일치합니다.

### Medium (개선 권장)

**1. `member_no` null 가능성에 대한 고려**

`gm.member_no`가 null인 학생이 있을 경우 `ORDER BY gm.member_no`에서 정렬 순서가 데이터베이스에 따라 달라질 수 있습니다. `ORDER BY gm.member_no IS NULL, gm.member_no` 형태로 null을 명시적으로 처리하면 정렬 순서가 항상 일관됩니다.

**2. API 응답 구조 단순화 가능성**

`selectTcSubmissions` 서비스 메서드가 단순히 `result.put("students", ...)`만 수행하는데, 이 정도의 단순 위임은 서비스 계층 없이 Controller에서 직접 매퍼를 호출해도 무방합니다. 다만 기존 프로젝트 패턴(Controller → Service → Mapper)을 따르는 것이므로 이는 선택적 개선 사항입니다.

---

## 주요 파일 분석

### DgnssMapper.xml
**변경 내용:**
학급 학생 제출 현황 조회 쿼리 `selectSubmissionsByDgnssId` 추가

**개선 제안:**
1. INNER JOIN → LEFT JOIN + COALESCE로 변경하여 미제출 학생 포함 (위 High 이슈 참조)
2. `ORDER BY gm.member_no IS NULL, gm.member_no`로 null 정렬 명시

### DgnssController.java
**변경 내용:**
`GET /api/dgnss/tc/submissions` 엔드포인트 추가

**개선 제안:**
- 특별한 이슈 없음. 기존 컨트롤러 패턴을 정확히 따르고 있으며, `@Operation`과 `@Parameter` 어노테이션으로 API 문서화도 충실히 수행됨

### DgnssService.java
**변경 내용:**
`selectTcSubmissions()` 메서드 추가

**개선 제안:**
- 특별한 이슈 없음. `@Transactional(readOnly = true)`로 읽기 전용 트랜잭션을 명시한 점이 적절함

---

## 최종 평가

**결론**: 
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**
전체적인 구조와 코딩 패턴은 기존 프로젝트 컨벤션을 잘 따르고 있어 훌륭합니다. 다만 "제출 현황 목록"이라는 API의 핵심 목적을 고려할 때, INNER JOIN으로 인해 미제출 학생이 목록에서 누락되는 것은 기능적 결함입니다. LEFT JOIN으로 변경하면 미제출 학생도 `submAt='N'`으로 포함되어 API 설명과 정확히 일치하는 동작을 보장할 수 있습니다. 이 한 가지만 수정되면 바로 승인 가능한 수준의 좋은 커밋입니다.