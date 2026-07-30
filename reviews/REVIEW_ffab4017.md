> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - ffab4017

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 3개


### 정상 범위 (NONE)


**`mysql_tools.py`** (other)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.011

- 청크 수: 7개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 Agent 시스템이 학급/교사 단위의 검사 데이터와 상담 데이터를 더 정밀하게 조회할 수 있도록 MySQL Tool 세트를 확장하고, 그에 맞춰 LLM 프롬프트 정책 문서를 업데이트한 변경입니다.

- **목적**: 기존에는 학습종합검사(LPA/38요인)의 최신 회차만 조회 가능했으나, 회차 간 비교, 11개 중분류 반 평균 T점수, 상담 건수 집계, 검사 캠페인(자기조절학습검사 포함) 목록 조회 등 새로운 질의 유형을 지원하기 위해 Tool을 추가/개선함. 또한 `paper_idx` 필터 미적용 시 발생할 수 있는 데이터 이중 집계 버그를 수정함.
- **도메인**: 비즈니스 로직 (Agent Tool Layer / MySQL 데이터 조회)
- **변경 방향**: 단순 최신 회차 조회에서 벗어나 회차 지정/비교가 가능한 방향으로 확장. 상담 관련 기능도 단순 목록 조회에서 기간 지정 및 집계 기능으로 고도화. 프롬프트 정책 문서도 Tool 변경사항과 동기화하여 LLM이 올바른 Tool을 선택하도록 유도.

## [GOOD] 잘된 점

1. **데이터 정합성에 대한 깊은 이해를 바탕으로 한 `paper_idx` 필터 도입**: `tb_dgnss_info`의 UNIQUE KEY가 `(cla_id, paper_idx, ord_no)` 조합이라는 점을 실제 DB 검증을 통해 파악하고, 학습종합검사 전용 Tool들에 `_LEARNING_PAPER_IDX = "1"` 필터를 일괄 적용한 것은 매우 적절합니다. 이로 인해 자기조절학습검사 데이터가 섞여 최신 회차가 잘못 선택되거나 응시 인원이 이중 집계되는 문제를 원천 차단했습니다. 특히 `query_class_roster`와 `query_teacher_classes_overview`에서 서브쿼리와 메인쿼리 양쪽에 `paper_idx`를 적용한 점이 꼼꼼합니다.

2. **`query_counseling_summary` 신규 Tool의 설계 방향성**: 상담 건수 집계를 DB 레벨의 `COUNT`/`SUM`으로 처리하도록 분리한 것은 LLM이 목록을 직접 세는 것보다 정확하고 효율적입니다. `types` 컬럼에서 `"urgent"`/`"follow-up"`을 `LIKE` 패턴 매칭으로 집계하는 방식도 프론트의 ScheduleType과 일관성을 유지하고 있습니다. docstring에 "건수만 필요하면 query_counseling_history 대신 query_counseling_summary를 사용하라"고 명시한 것도 LLM의 Tool 선택 오류를 줄이는 좋은 설계입니다.

3. **프롬프트 정책 문서와 Tool 구현의 동기화**: `tool_policy_class.md`와 `tool_policy_teacher.md`에 새로운 Tool 사용법, 회차 비교 절차, 기간 지정 규칙, 자기조절학습검사의 조회 가능 범위 한계를 명확히 문서화했습니다. 특히 "아직 데이터로 확인할 수 없다"고 안내하라는 지침과 "이미지 판독 결과를 DB로 검증된 것처럼 답하지 마십시오"라는 경고는 LLM의 환각(hallucination)을 방지하는 중요한 장치입니다.

## 변경사항 요약

- `mysql_tools.py`: `query_class_midcategory_scores`, `query_counseling_summary`, `query_class_exam_campaigns` 3개의 신규 Tool 추가. 기존 Tool들에 `ord_no`/`start_date`/`end_date` 파라미터 추가 및 `paper_idx` 필터 일괄 적용. `query_teacher_classes_overview`에 `invite_code` 컬럼 추가.
- `tool_policy_class.md` / `tool_policy_teacher.md`: 신규 Tool 매핑 테이블 추가, 회차 비교/기간 지정/자기조절학습검사 한계에 대한 사용 지침 명시.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `query_counseling_summary`의 `LIKE` 패턴 매칭이 `types` JSON 배열에서 의도치 않은 부분 매칭을 일으킬 가능성**

- **위치**: `agent/app/tools/mysql_tools.py`, `query_counseling_summary` 함수 내 SQL
- **기존 코드**:
```sql
SUM(ci.types LIKE '%%"urgent"%%') AS urgent_count,
SUM(ci.types LIKE '%%"follow-up"%%') AS follow_up_count
```
- **문제 분석**: `types` 컬럼이 `["urgent","regular"]`와 같은 JSON 배열 문자열이라고 가정할 때, `%"urgent"%` 패턴은 정상 동작합니다. 그러나 `types` 값이 `["not_urgent","follow-up-request"]`처럼 의도치 않은 부분 문자열을 포함할 경우 오탐(false positive)이 발생할 수 있습니다. 예를 들어 `"not_urgent"`는 `%"urgent"%`에 매칭되지만 실제로는 긴급 상담이 아닙니다. 현재 프론트 ScheduleType이 `"urgent"`/`"follow-up"`/`"regular"` 3가지로 제한되어 있다면 문제가 없지만, 향후 타입이 추가될 때를 대비해 JSON 정규 파싱 또는 정확한 값 매칭을 고려해야 합니다.
- **해결 방안 (수정 코드)**: MySQL 8.0 이상을 사용 중이라면 `JSON_CONTAINS` 함수를 사용하는 것이 더 정확합니다.
```sql
SUM(JSON_CONTAINS(ci.types, '"urgent"')) AS urgent_count,
SUM(JSON_CONTAINS(ci.types, '"follow-up"')) AS follow_up_count
```
만약 MySQL 5.7이라면 현재 `LIKE` 방식이 최선이므로, 이 경우에는 `types` 컬럼의 값 포맷이 항상 정확한 JSON 배열임을 보장하는 애플리케이션 레벨의 제약이 필요합니다.

**2. `query_class_exam_campaigns`에서 `tc_id` 서브쿼리 패턴의 비효율성**

- **위치**: `agent/app/tools/mysql_tools.py`, `query_class_exam_campaigns` 함수, tc_id 분기
- **기존 코드**:
```python
select_body.format(scope_clause="gi.cla_id IN (SELECT gi2.cla_id FROM group_info gi2 "
                                 "JOIN user u ON u.user_no = gi2.host_user_no WHERE u.tc_id = %s)")
```
- **문제 분석**: `tc_id`로 조회할 때 `group_info`를 두 번 참조하는 서브쿼리 패턴을 사용하고 있습니다. `query_teacher_classes_overview`는 동일한 목적을 `JOIN user`로 직접 처리하는데, 여기서는 서브쿼리를 사용해 일관성이 깨집니다. 대규모 데이터에서 서브쿼리보다 `JOIN`이 더 효율적인 플랜을 탈 가능성이 높습니다. 또한 `select_body`를 `format()`으로 동적 생성하는 방식은 SQL 템플릿의 가독성을 떨어뜨립니다.
- **해결 방안 (수정 코드)**: `cla_id`와 `tc_id` 분기를 완전히 분리하거나, `JOIN` 기반의 단일 쿼리로 통일하는 것이 좋습니다.
```python
# tc_id 분기
return await _execute_query(
    """
    SELECT gi.cla_id, gi.invite_code,
           di.paper_idx,
           CASE di.paper_idx
               WHEN '1' THEN '학습종합검사'
               WHEN '2' THEN '자기조절학습검사'
               ELSE di.paper_idx
           END AS paper_name,
           di.ord_no,
           CASE di.dgnss_at
               WHEN 'Y' THEN '진행중'
               WHEN 'N' THEN '완료'
               ELSE di.dgnss_at
           END AS campaign_status,
           di.dgnss_st_dt AS st_dt, di.dgnss_ed_dt AS ed_dt,
           SUM(ri.eak_stts_cd = 1) AS not_submitted,
           SUM(ri.eak_stts_cd = 2) AS in_progress_students,
           SUM(ri.eak_stts_cd = 3) AS completed_students,
           COUNT(ri.id) AS total_students
    FROM group_info gi
    JOIN user u ON u.user_no = gi.host_user_no
    JOIN tb_dgnss_info di ON di.cla_id = gi.cla_id
    LEFT JOIN tb_dgnss_result_info ri ON ri.dgnss_id = di.id
    WHERE u.tc_id = %s AND gi.use_yn = 'Y'
    GROUP BY gi.cla_id, gi.invite_code, di.id, di.paper_idx, di.ord_no,
             di.dgnss_at, di.dgnss_st_dt, di.dgnss_ed_dt
    ORDER BY gi.cla_id, di.paper_idx, di.ord_no
    """,
    (tc_id,),
)
```

### Medium (개선 권장)

**1. `query_class_midcategory_scores`에서 최신 회차 조회 로직 중복**

- **위치**: `agent/app/tools/mysql_tools.py`, `query_class_midcategory_scores` 함수, 약 310-320번 라인
- **내용**: `ord_no`가 `None`일 때 `SELECT MAX(ord_no)`를 별도 쿼리로 실행하고 있습니다. `query_class_dgnss_overview`는 동일한 목적을 `sessions` 쿼리에서 `ORDER BY ord_no DESC LIMIT 1`로 자연스럽게 해결합니다. 두 Tool이 동일한 `(cla_id, paper_idx)` 범위에서 최신 회차를 구하는 로직을 각각 구현하고 있어, 향후 회차 결정 로직이 변경될 경우 불일치가 발생할 수 있습니다. 별도의 헬퍼 함수(예: `_resolve_latest_ord_no(cla_id)`)로 추출하는 것을 고려해볼 수 있습니다.

**2. `query_counseling_history`에서 `stdt_id` + `cla_id` 분기와 `cla_id` 단독 분기 간 반환 컬럼 불일치**

- **위치**: `agent/app/tools/mysql_tools.py`, `query_counseling_history` 함수
- **내용**: `stdt_id + cla_id` 분기는 `ci.next_steps`를 SELECT에 포함하지만, `cla_id` 단독 분기와 `tc_id` 분기에서는 `ci.summary`까지만 포함하고 `next_steps`를 제외합니다. 이는 의도된 설계일 수 있으나(학생 특정 시에만 다음 단계가 의미 있음), API 일관성 측면에서 설명이 필요합니다. 최소한 docstring에 이 차이를 명시적으로 기록하는 것이 좋습니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**:
전반적으로 데이터 모델에 대한 깊은 이해와 실제 DB 검증을 바탕으로 한 견고한 변경입니다. `paper_idx` 필터 도입과 상담 집계 Tool 분리는 특히 잘 설계되었습니다. 다만 `query_counseling_summary`의 `LIKE` 패턴 매칭은 `types` 컬럼 값의 변화에 따라 오탐 가능성이 있고, `query_class_exam_campaigns`의 서브쿼리 패턴은 성능과 일관성 측면에서 개선이 필요합니다. 위 High 이슈 2건을 검토 후 반영해주시면 승인하겠습니다.