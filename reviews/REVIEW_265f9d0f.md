> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 265f9d0f

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`groupupsertservice.java`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.009

- 청크 수: 12개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 Auth(IDP)에서 전달받은 그룹 정보를 학심정 시스템에 동기화하는 `GroupUpsertService`에서, DB 제약 조건(NOT NULL) 위반을 방지하기 위한 방어 로직을 추가합니다.

- **목적**: `group_info.group_nm`과 `group_info.max_member_count`의 NOT NULL 제약 조건을 보호하고, Auth에서 null 값이 전달되어도 시스템이 정상 동작하도록 함
- **도메인**: 비즈니스 로직 (SSO 그룹 동기화)
- **변경 방향**: null 안전성 강화, 기존 `createGroup`과의 일관성 확보

## [GOOD] 잘된 점

- **null 방어 패턴 도입**: `safeGroupNm()` 정적 메서드를 별도로 분리하여 `groupNm` null 처리 로직을 명확하게 캡슐화했습니다. 이는 `insertGroup`과 `applyGroupFields` 양쪽에서 재사용 가능한 구조입니다.
- **멱등성 유지**: `applyGroupFields`에서 `rp.groupName() != null` 조건으로 null이 들어와도 기존 값을 보존하도록 처리하여, 멱등성 원칙을 잘 지켰습니다.
- **createGroup과의 일관성**: `maxMemberCount` 기본값을 100으로 설정하여 기존 `GroupService.createGroup`과 동일한 정책을 유지했습니다. `GroupService.createGroup`(라인 87)에서도 `maxMemberCount != null ? maxMemberCount : 100`으로 동일한 기본값을 사용하고 있음을 확인했습니다.

## 변경사항 요약

1. `safeGroupNm()` 정적 메서드 추가 - null/blank 방어
2. `insertGroup()`에서 `groupNm`과 `maxMemberCount`에 방어 로직 적용
3. `applyGroupFields()`에서 `groupName` null 체크 추가로 기존 값 보존

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `applyGroupFields`에서 `maxMemberCount` 변경 누락 가능성**

- **위치**: `GroupUpsertService.java`, `applyGroupFields()` 메서드 (라인 157~172)
- **문제 분석**:
  - `insertGroup`(라인 142)에서는 `maxMemberCount(100)`으로 명시적으로 설정합니다.
  - `applyGroupFields`(라인 157~172)에서는 `maxMemberCount`를 전혀 변경하지 않습니다.
  - `GroupInfoMapper.xml`의 UPDATE 쿼리(라인 85~98)에는 `max_member_count = #{maxMemberCount}`가 포함되어 있습니다.
  - `GroupInfo` 엔티티의 `maxMemberCount` 필드는 `Integer` 타입(nullable)입니다.
  - 따라서 `applyGroupFields`를 거친 후 `groupInfoMapper.updateGroupInfo(g)`가 호출되면, `maxMemberCount`가 null인 상태로 UPDATE가 실행될 가능성이 있습니다. 이는 DB의 NOT NULL 제약 조건 위반을 초래할 수 있습니다.

- **해결 방안**: `applyGroupFields`에서 `maxMemberCount`가 null인 경우 100으로 보정하는 로직을 추가해야 합니다.

```
   - **기존 코드** (applyGroupFields 메서드, 라인 157~172):
     private boolean applyGroupFields(GroupInfo g, RpGroupDto rp) {
         boolean dirty = false;
         if (rp.groupName() != null) {
             dirty |= setIfChanged(g.getGroupNm(), rp.groupName(), g::setGroupNm);
         }
         dirty |= setIfChanged(g.getSchoolLevel(), mapSchoolLevel(rp.schoolLevel()), g::setSchoolLevel);
         dirty |= setIfChanged(g.getGrade(), parseGrade(rp.grade()), g::setGrade);
         Integer classNo = parseClassNo(rp.classNo());
         if (!classNo.equals(g.getClassNumber())) {
             g.setClassNumber(classNo);
             dirty = true;
         }
         dirty |= setIfChanged(g.getSubject(), rp.subject(), g::setSubject);
         dirty |= setIfChanged(g.getSchoolCode(), fkSafeSchoolCode(rp.schoolCode()), g::setSchoolCode);
         dirty |= setIfChanged(g.getSchoolName(), rp.schoolName(), g::setSchoolName);
         if (!"Y".equals(g.getUseYn())) {
             g.setUseYn("Y");
             dirty = true;
         }
         return dirty;
     }

   - **해결 방안 (수정 코드)**: 
     private boolean applyGroupFields(GroupInfo g, RpGroupDto rp) {
         boolean dirty = false;
         if (rp.groupName() != null) {
             dirty |= setIfChanged(g.getGroupNm(), rp.groupName(), g::setGroupNm);
         }
         // max_member_count NOT NULL 방어 — insertGroup과 동일한 기본값
         if (g.getMaxMemberCount() == null) {
             g.setMaxMemberCount(100);
             dirty = true;
         }
         dirty |= setIfChanged(g.getSchoolLevel(), mapSchoolLevel(rp.schoolLevel()), g::setSchoolLevel);
         dirty |= setIfChanged(g.getGrade(), parseGrade(rp.grade()), g::setGrade);
         Integer classNo = parseClassNo(rp.classNo());
         if (!classNo.equals(g.getClassNumber())) {
             g.setClassNumber(classNo);
             dirty = true;
         }
         dirty |= setIfChanged(g.getSubject(), rp.subject(), g::setSubject);
         dirty |= setIfChanged(g.getSchoolCode(), fkSafeSchoolCode(rp.schoolCode()), g::setSchoolCode);
         dirty |= setIfChanged(g.getSchoolName(), rp.schoolName(), g::setSchoolName);
         if (!"Y".equals(g.getUseYn())) {
             g.setUseYn("Y");
             dirty = true;
         }
         return dirty;
     }
```

### Medium (개선 권장)

**1. `safeGroupNm` 메서드의 표시값 상수화**

- **위치**: `GroupUpsertService.java`, 라인 300
- **문제**: `"(이름 없는 그룹)"`이라는 문자열이 매직 리터럴로 하드코딩되어 있습니다. 동일한 문자열이 다른 곳에서도 사용될 가능성이 있고, 국제화(i18n)나 정책 변경 시 일괄 수정이 어렵습니다.
- **제안**: 클래스 상수로 추출하여 관리성을 높이는 것을 권장합니다.

```
   - **기존 코드**:
     static String safeGroupNm(String groupName) {
         return (groupName == null || groupName.isBlank()) ? "(이름 없는 그룹)" : groupName;
     }

   - **해결 방안 (수정 코드)**: 
     private static final String DEFAULT_GROUP_NAME = "(이름 없는 그룹)";

     static String safeGroupNm(String groupName) {
         return (groupName == null || groupName.isBlank()) ? DEFAULT_GROUP_NAME : groupName;
     }
```

---

## 주요 파일 분석

### GroupUpsertService.java
**변경 내용:** null 안전성 강화 및 NOT NULL 제약 조건 방어 로직 추가

**개선 제안:**
1. `applyGroupFields`에서 `maxMemberCount` null 방어 추가 (High 이슈 - 위 상세 참조)
2. `safeGroupNm` 표시값 상수화 (Medium 이슈 - 위 상세 참조)

---

## 최종 평가

**결론**: 
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전반적으로 null 안전성을 강화하는 방향성은 적절하며, `safeGroupNm` 메서드 분리와 `applyGroupFields`의 null 체크 추가는 좋은 개선입니다. 특히 `insertGroup`에서 `maxMemberCount`를 100으로 설정하여 `createGroup`과 일관성을 맞춘 점은 긍정적입니다.

다만 `applyGroupFields`에서 `maxMemberCount`가 null로 전달될 경우 UPDATE 시 NOT NULL 제약 조건 위반이 발생할 수 있는 경로가 존재합니다. `GroupInfoMapper.xml`의 UPDATE 쿼리에는 `max_member_count = #{maxMemberCount}`가 포함되어 있으므로, `GroupInfo` 객체의 `maxMemberCount`가 null이면 DB 제약 조건 위반이 발생합니다. 이에 대한 방어 로직을 `applyGroupFields`에 추가하는 것을 권장합니다.

이 한 가지만 보완되면 승인 가능한 수준입니다.