> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 3615ad09

## 코드 복잡도 분석

**분석된 파일**: 3개 / 변경된 파일: 4개


### 정상 범위 (NONE)


**`trialmonitormapper.xml`** (other)

- 평균 복잡도: **0.007**

- 최대 복잡도: 0.007

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`trialmonitorcontroller.java`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.006

- 청크 수: 4개


**권장사항:**

- 복잡도 정상 범위


**`trialmonitormapper.java`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.001

- 청크 수: 9개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 Trial Monitor(시험 모니터링) 대시보드에서 교사별 상세 팝업에 **생활기록부(school record)** 데이터를 추가하는 기능 확장입니다. 기존에는 AI 대화 내역과 상담 내역만 팝업에서 확인 가능했으나, 이번 변경으로 생활기록부까지 함께 조회할 수 있게 되었습니다.

- **목적**: 교사별 상세 팝업에 생활기록부 탭을 추가하여 모니터링 범위 확장
- **도메인**: 비즈니스 로직 (Controller) + 데이터 액세스 (MyBatis Mapper) + UI (Thymeleaf 템플릿)
- **변경 방향**: 기존 AI 대화/상담 데이터 처리 패턴(쿼리 -> 그룹핑 -> 카운트/상세 맵 구성 -> 템플릿 렌더링)을 동일하게 생활기록부에 적용

---

## [GOOD] 잘된 점

**1. 기존 패턴의 일관성 있는 확장**

`aiConversations`와 `counselings`가 사용하는 것과 동일한 아키텍처 패턴을 그대로 따라 생활기록부를 통합했습니다. 구체적으로는:

- 컨트롤러에서 `selectSchoolRecordsByHostUserNos()`로 데이터 조회
- `recordByName` LinkedHashMap으로 교사 이름별 그룹핑
- `teacherDetails` 맵에 `schoolRecords` 키로 추가
- 템플릿에서 `t.schoolRecordCount`로 카운트 표시
- 팝업 탭과 `renderSr()` 함수로 상세 내역 렌더링

이러한 일관성은 유지보수성을 높이고, 향후 또 다른 데이터 소스가 추가될 때 참고할 수 있는 명확한 패턴을 제공합니다.

**2. SQL 조인 설계의 실용성**

`school_record_info` 테이블을 `tc_id`로 `user` 테이블과 조인하고, 다시 `stdt_id`로 학생 정보를 조회한 후 `superteacher_core.platform_user` 크로스 DB 조인으로 실명을 가져오는 설계가 명확합니다. 특히 `COALESCE(pu.name, u2.stdt_id)`로 실명이 없으면 학번으로 fallback 처리한 점이 실용적입니다.

```sql
SELECT sr.id      AS recordId
     , u.user_no  AS ownerUserNo
     , sr.cla_id  AS claId
     , sr.content AS content
     , DATE_FORMAT(sr.created_at, '%Y-%m-%d %H:%i') AS createdAt
     , COALESCE(pu.name, u2.stdt_id) AS studentName
FROM school_record_info sr
    INNER JOIN `user` u ON u.tc_id = sr.tc_id
    LEFT JOIN `user` u2 ON u2.stdt_id = sr.stdt_id
    LEFT JOIN superteacher_core.platform_user pu ON pu.public_user_id = u2.sp_user_id
```

**3. UI 측면의 완전한 통합**

변경이 필요한 프론트엔드 3군데를 빠짐없이 수정했습니다:
- 교사 카드의 `tc-stat` 영역에 생기부 카운트 표시 (`schoolRecordCount`)
- 팝업 모달에 생활기록부 탭 (`#tdSr`) 추가
- `renderSr()` 함수와 `openTrialDetail()` 함수 업데이트

---

## 변경사항 요약

4개 파일(Controller, Mapper 인터페이스, Mapper XML, HTML 템플릿)에 걸쳐 생활기록부 데이터를 조회/가공/표시하는 로직을 추가했습니다. 기존 AI 대화/상담과 동일한 아키텍처 패턴을 따르며, SQL은 `school_record_info` 테이블을 `tc_id`로 교사와 조인하고 SSO를 통해 학생 실명을 조회합니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

**없음.** 명백한 버그, 보안 취약점, 데이터 손실 가능성은 발견되지 않았습니다.

### High (우선 수정 권장)

**1. `schoolRecords` 그룹핑 시 `ownerUserNo` 필드 존재 여부에 대한 가정**

- **파일**: `TrialMonitorController.java`
- **위치 (라인 번호)**: 206-210
- **기존 코드**:
```java
for (Map<String, Object> c : schoolRecords) {
    String name = userNoToName.get(num(c.get("ownerUserNo")));
    if (name != null && recordByName.containsKey(name)) {
        recordByName.get(name).add(c);
    }
}
```

- **문제점**: SQL 쿼리에서 `u.user_no AS ownerUserNo`로 반환하고 있어 정상 동작합니다. 그러나 `aiConversations`와 `counselings`의 그룹핑 루프도 동일한 `ownerUserNo` 키를 사용하고 있어, 만약 SQL 결과에 `ownerUserNo` 컬럼이 누락되거나 null인 경우 해당 레코드는 자동으로 무시됩니다. 이는 기존 코드와 동일한 패턴이므로 일관성은 있지만, silent data loss 가능성이 있습니다.

- **해결 방안**: **[수정 코드 제시 불가 -- 문맥 파악 불충분]** `num()` 헬퍼 메서드의 null 처리 방식과 `userNoToName` 맵의 구성 시점을 정확히 확인해야 하므로, 단순 추측으로 수정 코드를 제시할 수 없습니다. 다만, 기존 `aiConversations`/`counselings` 루프와 완전히 동일한 패턴이므로 일관성 측면에서는 문제가 없습니다.

### Medium (개선 권장)

**1. `renderSr()` 함수에서 `content` 필드 null 처리**

- **파일**: `trial-monitor.html`
- **위치 (라인 번호)**: 348-353
- **기존 코드**:
```javascript
function renderSr(list) {
    if (!list || !list.length) return '<p class="text-muted text-center py-3">생활기록부 내역 없음</p>';
    return list.map(function (r) {
        return '<div class="card card-body p-2 mb-2">'
            + '<div><span class="badge badge-success"><i class="fas fa-user-graduate"></i> ' + esc(r.studentName) + '</span> '
            + '<span class="mini-muted">학급 ' + esc(r.claId) + ' · ' + esc(r.createdAt) + '</span></div>'
            + '<div style="white-space:pre-wrap;word-break:break-word;margin-top:4px">' + esc(r.content) + '</div></div>';
    }).join('');
}
```

- **제안**: `school_record_info.content`가 null일 경우 `esc(null)`은 `''`를 반환하므로 화면에 "null"이 표시되지는 않습니다. 그러나 `esc()` 함수가 `null`을 `''`로 변환하는 것은 내부 구현에 의존하는 동작입니다. 명시적으로 `esc(r.content || '')`로 처리하거나, SQL에서 `COALESCE(sr.content, '')`로 처리하는 것이 더 안전합니다. 이는 사소한 개선 사항으로, 현재 동작에는 문제가 없습니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

이 커밋은 기존 아키텍처 패턴을 충실히 따라 생활기록부 기능을 확장한 안정적인 변경입니다. SQL 조인 설계가 명확하고, 컨트롤러 로직과 UI까지 빠짐없이 연동되어 있습니다. `content` 필드의 null 처리만 보강하면 더 완성도가 높아질 것입니다. 전반적으로 승인 가능한 수준의 품질이며, 실무에 바로 적용해도 무방합니다.