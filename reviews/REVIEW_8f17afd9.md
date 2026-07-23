> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 8f17afd9

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`mysql_tools.py`** (other)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.011

- 청크 수: 8개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 `agent/app/tools/mysql_tools.py` 모듈에 대한 코드리뷰 피드백을 반영한 수정입니다. 기존 코드에서 발견된 세 가지 주요 문제를 해결합니다: (1) 두 개의 Tool 함수가 각자 다른 방식으로 "최신 회차"를 판단하던 일관성 문제, (2) 상담 유형(types) 필드가 JSON 배열임에도 `LIKE`로 부분 매칭하던 정확성 문제, (3) 검사 캠페인 조회에서 tc_id 분기가 다른 Tool들과 다른 쿼리 패턴(서브쿼리)을 사용하던 통일성 문제입니다.

- **목적**: 최신 회차 조회 로직 통일, 상담 유형 판정 정확도 개선, 검사 캠페인 조회 쿼리 패턴 통일, 상담 이력 반환 컬럼 일관성 확보
- **도메인**: 비즈니스 로직 (MySQL 데이터 조회 Tool)
- **변경 방향**: 중복 코드 제거 및 헬퍼 함수 추출, LIKE 기반 문자열 매칭에서 JSON_CONTAINS로 전환, 서브쿼리 패턴에서 JOIN 패턴으로 통일, 누락 컬럼 추가

---

## [STATUS] 심각도별 이슈 요약

### Critical (즉시 수정 필요)
- 없음

### High (우선 수정 권장)
- 없음

### Medium (개선 권장)
1. `query_class_dgnss_overview`에서 `_resolve_latest_ord_no` 호출 후 `resolved_ord_no`가 `None`이어도 distribution 쿼리가 실행됨

### Low (참고 사항)
1. `query_class_dgnss_overview`에서 `ord_no` 미지정 시 중복 DB 조회 발생 가능

---

## 변경사항 요약

1. **`_resolve_latest_ord_no` 헬퍼 함수 신규 추가**: `cla_id` + `paper_idx` 조합의 `MAX(ord_no)`를 조회하는 로직을 별도 함수로 분리하여 `query_class_dgnss_overview`와 `query_class_midcategory_scores`에서 재사용
2. **`query_class_dgnss_overview` 최신 회차 로직 변경**: 기존 `sessions[0]["ord_no"]` 방식에서 `_resolve_latest_ord_no` 호출 방식으로 변경
3. **`query_class_midcategory_scores` 최신 회차 로직 변경**: 인라인 SQL에서 `_resolve_latest_ord_no` 호출로 변경
4. **`query_counseling_history` 반환 컬럼 통일**: 3개 분기(학생/학급/교사) 모두 `next_steps` 컬럼을 포함하도록 수정
5. **`query_counseling_summary` 상담 유형 판정 방식 변경**: `LIKE '%"urgent"%'`에서 `JSON_CONTAINS(ci.types, '"urgent"')`로 전환
6. **`query_class_exam_campaigns` 쿼리 구조 리팩토링**: `str.format()` 기반 동적 쿼리에서 정적 쿼리 + 조기 return 패턴으로 변경, tc_id 분기를 서브쿼리에서 JOIN 패턴으로 통일

---

## 파일별 상세 분석

### `agent/app/tools/mysql_tools.py`

**변경 내용:** 6개 함수에 걸쳐 총 68줄 추가, 20줄 삭제.

---

**[PROBLEM] 발견된 문제:**

**1. [Medium] `query_class_dgnss_overview`에서 `resolved_ord_no`가 `None`일 때 distribution 쿼리 실행 가능성**

- **위치 (라인 번호)**: Diff 기준 라인 280-294 (실제 파일 라인 293-305)
- **기존 코드**:
```python
    if ord_no is not None:
        resolved_ord_no = ord_no
    else:
        latest = await _resolve_latest_ord_no(cla_id)
        if latest and latest[0].get("error"):
            return {"error": latest[0]["error"], "message": latest[0]["message"]}
        resolved_ord_no = latest[0]["ord_no"] if latest else None
```
- **해결 방안 (수정 코드)**:
```python
    if ord_no is not None:
        resolved_ord_no = ord_no
    else:
        latest = await _resolve_latest_ord_no(cla_id)
        if latest and latest[0].get("error"):
            return {"error": latest[0]["error"], "message": latest[0]["message"]}
        if not latest or latest[0]["ord_no"] is None:
            return {"sessions": sessions, "ord_no": None, "distribution": []}
        resolved_ord_no = latest[0]["ord_no"]
```
- **위험도**: Medium
- **영향**: `_resolve_latest_ord_no`가 `[{"ord_no": None}]`을 반환하는 경우(예: `tb_dgnss_info`에 해당 `cla_id` + `paper_idx` 조합의 레코드가 없는 경우), `resolved_ord_no`가 `None`인 상태로 distribution 쿼리(`WHERE di.ord_no = %s`에 `None` 바인딩)가 실행됩니다. MySQL에서 `ord_no = NULL` 비교는 항상 FALSE이므로 distribution은 빈 리스트(`[]`)가 반환되지만, 불필요한 DB 쿼리가 발생합니다. `query_class_midcategory_scores`에서는 동일한 상황을 `if not latest or latest[0]["ord_no"] is None: return {"ord_no": None, "scores": []}`로 명시적으로 처리하고 있어 두 함수 간 일관성이 깨집니다.

---

**2. [Low] `query_class_dgnss_overview`의 기존 로직과 신규 로직 간 미묘한 동작 차이**

- **위치 (라인 번호)**: Diff 기준 라인 280-294
- **설명**: 기존 코드는 `sessions[0]["ord_no"]`를 사용했습니다. `sessions`는 `ORDER BY di.ord_no DESC`로 정렬되므로 `sessions[0]`은 가장 큰 `ord_no`를 가진 세션입니다. 이는 `MAX(ord_no)`와 동일한 값을 반환합니다. 그러나 `sessions` 쿼리와 `_resolve_latest_ord_no` 쿼리가 동일한 `tb_dgnss_info` 테이블을 중복 조회하게 되어 불필요한 DB 라운드트립이 발생합니다. `sessions` 결과에서 이미 `ord_no`를 알 수 있으므로, `ord_no`가 주어지지 않은 경우 `sessions[0]["ord_no"]`를 그대로 사용하는 것이 더 효율적일 수 있습니다.
- **위험도**: Low (참고)
- **영향**: 기능적 차이는 없으나, 불필요한 DB 조회 1회 발생

---

**[GOOD] 잘된 점:**

1. **`_resolve_latest_ord_no` 헬퍼 함수 추출**: "최신 회차" 정의를 단일 함수로 통일한 것은 유지보수성 측면에서 탁월한 결정입니다. 향후 최신 회차 정의가 `MAX(ord_no)`에서 `dgnss_ed_dt` 기준 등으로 변경되어도 한 곳만 수정하면 됩니다. Docstring에도 "향후 정의가 바뀔 때 서로 어긋나는 것을 방지한다"고 명시되어 있어 설계 의도가 명확합니다.

2. **`JSON_CONTAINS` 전환**: `LIKE '%"urgent"%'`는 `"urgent_extra"` 같은 값을 가진 JSON에서도 매칭되는 오탐 가능성이 있었습니다. `JSON_CONTAINS(ci.types, '"urgent"')`는 JSON 배열 내 정확한 문자열 매칭을 보장하므로 올바른 수정입니다. `types` 컬럼이 JSON 배열(`["urgent","regular"]`)임을 고려할 때, `JSON_CONTAINS`는 배열 멤버십을 정확히 검사합니다.

3. **`query_class_exam_campaigns`의 `str.format()` 제거**: 기존 코드는 `select_body.format(scope_clause=...)` 패턴을 사용했는데, 이는 SQL 템플릿에 문자열을 동적으로 삽입하는 방식입니다. SQL Injection은 아니지만(파라미터가 아닌 WHERE 절 구조 자체를 삽입), 코드 분석과 정적 검증을 어렵게 했습니다. 정적 SQL 문자열로 분리한 것은 가독성과 안전성 측면에서 개선입니다.

4. **`query_counseling_history`의 `next_steps` 컬럼 추가**: 3개 분기(학생/학급/교사) 중 2개 분기(학급 단위, 교사 단위)에서만 `next_steps`가 누락되어 있었습니다. 이를 모두 포함시켜 API 응답 일관성을 확보했습니다. Docstring에도 `next_steps`가 반환값에 포함되어 있으므로, 코드와 문서의 일치도 개선되었습니다.

5. **tc_id 분기의 JOIN 패턴 통일**: 기존 서브쿼리(`gi.cla_id IN (SELECT gi2.cla_id FROM group_info gi2 JOIN user u ON ...)`)를 `FROM group_info gi JOIN user u ON u.user_no = gi.host_user_no`로 변경하여 다른 Tool들과 동일한 JOIN 패턴을 사용하게 되었습니다. 이는 쿼리 실행 계획 최적화에도 유리하며, MySQL 옵티마이저가 서브쿼리보다 JOIN을 더 효율적으로 최적화하는 경우가 많습니다.

---

## 보안 분석

**발견된 보안 취약점:** 없음

**보안 체크리스트:**
- [x] 인증/인가 검증 - 변경 없음 (기존 신뢰 모델 유지)
- [x] 입력 검증 및 Sanitization - 모든 쿼리는 파라미터 바인딩 사용, SQL Injection 방어 유지
- [x] 민감 정보 보호 - 변경 없음
- [x] HTTPS/암호화 사용 - 해당 없음 (DB 내부 통신)

---

## 버그 가능성 분석

**잠재적 버그:**

1. **[Medium] `query_class_dgnss_overview`에서 `resolved_ord_no`가 `None`일 때 distribution 쿼리 실행**
   - **재현 조건**: `cla_id`에 해당하는 `tb_dgnss_info` 레코드가 없고 `ord_no` 파라미터가 주어지지 않은 경우
   - **예상 결과**: `resolved_ord_no = None` 상태로 distribution 쿼리 실행 -> `WHERE di.ord_no = NULL`은 항상 FALSE -> 빈 distribution 반환. 기능적으로는 문제없지만 불필요한 DB 쿼리 발생
   - **수정 방법**: `_resolve_latest_ord_no` 결과가 `None`이면 `query_class_midcategory_scores`처럼 조기 return 처리

2. **[Low] `query_class_exam_campaigns` tc_id 분기에서 `gi.use_yn = 'Y'` 조건**
   - **재현 조건**: `group_info` 테이블에서 `use_yn = 'N'`인 학급이 있고, 해당 학급의 `tb_dgnss_info`에 활성 캠페인이 있는 경우
   - **예상 결과**: `group_info`가 `use_yn = 'N'`이면 학급 자체가 비활성 상태이므로 캠페인도 조회되지 않아야 함. 현재 로직은 `gi.use_yn = 'Y'`로 필터링하므로 올바름
   - **수정 방법**: 불필요 (정상 동작)

**Edge Case 검증:**
- [x] Null/Undefined 처리 - `_resolve_latest_ord_no`의 `None` 반환 케이스 일부 미흡 (위 이슈 #1 참고)
- [x] 빈 배열/객체 처리 - sessions가 빈 경우 early return 처리됨
- [x] 경계값 (0, 음수, 최대값) - `ord_no`는 양의 정수이므로 문제 없음
- [x] 동시성 문제 - 읽기 전용 쿼리이므로 영향 없음

---

## 성능 분석

**성능 이슈:**

1. **[Low] `query_class_dgnss_overview`에서 `ord_no` 미지정 시 중복 쿼리 발생**
   - **영향**: `sessions` 쿼리(라인 260-275)에서 이미 `tb_dgnss_info`의 모든 `ord_no`를 조회했음에도, `_resolve_latest_ord_no`가 동일 테이블을 다시 조회함. 불필요한 DB 라운드트립 1회 발생
   - **개선 방법**: `sessions[0]["ord_no"]`를 그대로 사용하거나, `sessions` 결과에서 `MAX(ord_no)`를 Python 레벨에서 계산

**성능 체크리스트:**
- [x] 불필요한 연산 제거 - 위 이슈 외에는 양호
- [ ] 캐싱 활용 - 해당 없음 (읽기 전용 실시간 데이터)
- [x] 비동기 처리 - 모든 쿼리 `async/await` 사용
- [x] 메모리 효율성 - LIMIT 절 사용으로 페이징 처리

---

## 코드 품질 평가

- **가독성**: 8/10 - 헬퍼 함수 추출로 가독성 개선, `str.format()` 제거로 쿼리 구조 명확해짐
- **유지보수성**: 9/10 - "최신 회차" 정의를 단일 함수로 통일한 점이 가장 큰 개선점
- **테스트 커버리지**: 평가 불가 - 테스트 파일이 제공되지 않음
- **문서화**: 9/10 - Docstring이 상세하고, 함수의 목적과 반환값이 명확히 기술됨

---

## 개선 제안 (우선순위별)

### 필수 (Must Fix)
1. `query_class_dgnss_overview`에서 `_resolve_latest_ord_no` 결과가 `None` 또는 `ord_no`가 `None`인 경우 조기 return 처리 (query_class_midcategory_scores와 일관성 유지)

### 권장 (Should Fix)
1. `query_class_dgnss_overview`에서 `ord_no` 미지정 시 `sessions[0]["ord_no"]`를 재사용하여 중복 DB 조회 제거 (선택적 최적화)

### 선택 (Nice to Have)
1. `_resolve_latest_ord_no`의 반환 타입을 `Optional[int]`로 변경하여 호출부에서 에러 처리 단순화 (현재는 `List[Dict]` 반환)

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - 문제 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - 경미한 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - 중요 이슈 수정 후 재검토
- [ ] [REJECT] **거부 (Rejected)** - 치명적 이슈로 인한 병합 불가

**핵심 코멘트:**

전반적으로 이 커밋은 코드 품질을 실질적으로 개선하는 방향성 있는 수정입니다. 특히 `_resolve_latest_ord_no` 헬퍼 함수 추출, `JSON_CONTAINS` 전환, `str.format()` 제거는 모두 올바른 결정입니다.

다만 `query_class_dgnss_overview`에서 `_resolve_latest_ord_no` 결과가 `None`일 때의 처리가 `query_class_midcategory_scores`와 일관되지 않습니다. 동일한 커밋에서 "최신 회차 판단 로직을 헬퍼 함수 하나로 통일"했다고 명시했으면서, 정작 그 헬퍼 함수의 결과를 처리하는 방식이 두 함수 간에 다릅니다. `query_class_midcategory_scores`는 `if not latest or latest[0]["ord_no"] is None: return ...`으로 조기 return하는 반면, `query_class_dgnss_overview`는 `resolved_ord_no = latest[0]["ord_no"] if latest else None`으로 `None`을 허용한 후 distribution 쿼리를 실행합니다.

이 한 가지만 수정되면 승인 가능한 수준의 커밋입니다.

**리뷰어 노트:**
- 검토 시간: 약 15분
- 우선 수정 항목:
  1. `query_class_dgnss_overview`의 `resolved_ord_no` None 처리 일관성 확보
  2. (선택) `query_class_dgnss_overview`의 중복 DB 조회 최적화
  3. (선택) `_resolve_latest_ord_no` 반환 타입 개선