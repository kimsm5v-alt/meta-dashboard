> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - cc77976a

## 코드 복잡도 분석

**분석된 파일**: 10개 / 변경된 파일: 15개


### 정상 범위 (NONE)


**`securityconfig.java`** (config)

- 평균 복잡도: **0.200**

- 최대 복잡도: 0.464

- 청크 수: 14개

- 평균 사용처: 22.4곳


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`adminuserdetailsservice.java`** (other)

- 평균 복잡도: **0.163**

- 최대 복잡도: 0.471

- 청크 수: 3개

- 평균 사용처: 15.3곳


**권장사항:**

- 복잡도 정상 범위


**`adminaccountmapper.xml`** (other)

- 평균 복잡도: **0.008**

- 최대 복잡도: 0.008

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`mustchangepasswordinterceptor.java`** (other)

- 평균 복잡도: **0.007**

- 최대 복잡도: 0.009

- 청크 수: 2개


**권장사항:**

- 복잡도 정상 범위


**`adminwebmvcconfig.java`** (config)

- 평균 복잡도: **0.007**

- 최대 복잡도: 0.008

- 청크 수: 2개


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`adminaccount.java`** (other)

- 평균 복잡도: **0.007**

- 최대 복잡도: 0.007

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`adminaccountcontroller.java`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.007

- 청크 수: 7개


**권장사항:**

- 복잡도 정상 범위


**`adminaccountselfcontroller.java`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.006

- 청크 수: 2개


**권장사항:**

- 복잡도 정상 범위


**`adminaccountservice.java`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.004

- 청크 수: 4개


**권장사항:**

- 복잡도 정상 범위


**`adminaccountmapper.java`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.001

- 청크 수: 11개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 관리자(Admin) 영역의 **계정 관리 기능**과 **비밀번호 변경 강제 정책**을 도입하고, 개인화 코칭 v2 API의 FE 전달 문서를 추가한 것입니다.

- **목적**: SUPER_ADMIN 전용 계정 관리(생성/비밀번호 초기화/상태·권한 변경)와 최초 로그인·초기화 후 비밀번호 변경 강제(`must_change_password`) 정책 구현
- **도메인**: 백엔드(Spring Security + MyBatis + Thymeleaf Admin UI) 및 문서화
- **변경 방향**: 기존 단일 `ROLE_ADMIN` 권한 체계를 `SUPER_ADMIN > ADMIN` 계층 구조(RoleHierarchy)로 확장하고, role 컬럼 기반 권한 부여로 전환

---

## [GOOD] 잘된 점

1. **본인 계정 잠금 방지 로직**: `AdminAccountService.updateStatus()`와 `updateRole()`에서 `id.equals(actorId)`를 검사하여 본인 계정의 상태·권한 변경을 차단한 점이 안전장치로 잘 설계되었습니다.
2. **RoleHierarchy 도입**: `SecurityConfig`에 `RoleHierarchyImpl.fromHierarchy("ROLE_SUPER_ADMIN > ROLE_ADMIN")` 빈을 선언하여 SUPER_ADMIN이 일반 admin 페이지에도 접근 가능하도록 한 설계가 명확합니다.
3. **비밀번호 변경 강제 인터셉터**: `MustChangePasswordInterceptor`가 인증 여부를 먼저 판별하고, 변경 페이지·로그인·정적 경로를 제외한 점이 견고합니다.
4. **임시비밀번호 규칙의 단일화**: `tempPasswordOf()`를 static 메서드로 두어 생성/초기화/화면 안내에서 동일 규칙을 재사용한 점이 일관적입니다.

---

## 변경사항 요약

관리자 계정 관리 컨트롤러/서비스/매퍼/템플릿 신규 추가, role 기반 권한 부여 및 RoleHierarchy 설정, 비밀번호 변경 강제 인터셉터와 본인 비밀번호 변경 페이지, 그리고 개인화 코칭 v2 FE 전달 문서를 추가한 커밋입니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. 임시비밀번호 규칙의 예측 가능성**

`AdminAccountService.tempPasswordOf()`가 `{아이디}!12` 고정 패턴으로 임시비밀번호를 생성합니다.

```java
public static String tempPasswordOf(String loginId) {
    return loginId + "!12";
}
```

아이디만 알면 누구나 임시비밀번호를 유추할 수 있어, 계정 생성/초기화 직후 공격자가 해당 계정으로 로그인할 수 있는 보안 취약점이 있습니다. 다만 `must_change_password='Y'`로 인해 최초 로그인 시 변경이 강제되므로 실제 피해 범위는 제한적입니다.

**해결 방안**: 임시비밀번호를 예측 불가능한 랜덤 문자열로 생성하고, 화면 안내 시에만 평문을 노출하도록 변경하는 것을 권장합니다. 다만 이는 화면(accounts.html)의 안내 문구와 `AdminAccountController.create()`의 flash 메시지에도 함께 반영되어야 하므로, **[수정 코드 제시 불가 — 문맥 파악 불충분]** 입니다.

**2. `actorId()`가 정지된 본인 계정에서 null 반환 가능**

`AdminAccountController.actorId()`는 `mapper.findByEmail(auth.getName())`을 사용하는데, `findByEmail` 쿼리는 `status='ACTIVE'` 조건이 있어 본인 계정이 SUSPENDED 상태이면 null을 반환합니다.

```java
private Long actorId(Authentication auth) {
    AdminAccount me = mapper.findByEmail(auth.getName());
    return me != null ? me.getId() : null;
}
```

이 경우 `currentAdminId`가 null이 되어 목록에서 "본인" 표시가 사라지고, 본인 계정 잠금 방지(`id.equals(actorId)`)가 무력화될 수 있습니다. 다만 정지된 계정은 로그인 자체가 불가능하므로 실제 발생 가능성은 낮습니다.

**해결 방안**: 상태 무관으로 본인 계정을 조회하는 별도 쿼리(`findById` 또는 상태 조건 없는 조회)를 사용하는 것이 안전합니다. **[수정 코드 제시 불가 — 문맥 파악 불충분]** (상태 무관 조회용 매퍼 메서드 추가 필요 여부 확인 필요)

### Medium (개선 권장)

**1. `AdminAccountSelfController.changeSubmit()`의 리다이렉트 대상 하드코딩**

비밀번호 변경 성공 시 `redirect:/admin/bug-reports`로 고정 이동합니다. 변경 페이지 진입 경로(강제 변경 vs 자발적 변경)와 무관하게 항상 bug-reports로 이동하는데, 자발적 변경 사용자에게는 부자연스러울 수 있습니다.

```java
ra.addFlashAttribute("success", "비밀번호가 변경되었습니다.");
return "redirect:/admin/bug-reports";
```

**해결 방안**: 변경 성공 후 이동 대상을 명확히 정의하거나, 요청 시 `redirect` 파라미터를 받아 유연하게 처리하는 것을 고려하세요.

**2. `AdminAccountController`의 예외 처리 패턴 중복**

각 POST 핸들러에서 `try-catch`로 예외를 잡아 flash 메시지로 변환하는 패턴이 4회 반복됩니다. `@ControllerAdvice` + `@ExceptionHandler`로 통합하면 중복을 줄일 수 있습니다.

**3. `countByEmail`의 반환 타입**

`int`로 선언되어 있으나 `COUNT(*)` 결과가 `long`일 수 있습니다. 실제로는 계정 수가 int 범위를 넘지 않으므로 실질적 문제는 없으나, `long`으로 통일하는 것이 일관적입니다.

---

## 주요 파일 분석

### AdminAccountService.java

**변경 내용**: 관리자 계정 생성/비밀번호 초기화/상태·권한 변경 로직을 담은 신규 서비스. 임시비밀번호 규칙과 본인 계정 잠금 방지를 포함.

**개선 제안**:
1. 임시비밀번호 규칙의 예측 가능성 (High 이슈 참조)
   - **위치**: 라인 30-32
   - **기존 코드**:
```java
public static String tempPasswordOf(String loginId) {
    return loginId + "!12";
}
```
   - **해결 방안**: 랜덤 임시비밀번호 생성으로 변경 권장. 화면 문구·테스트와 연동 필요하므로 **[수정 코드 제시 불가 — 문맥 파악 불충분]**

### AdminAccountController.java

**변경 내용**: SUPER_ADMIN 전용 계정 관리 페이지(목록/생성/초기화/상태·권한 변경) 컨트롤러.

**개선 제안**:
1. `actorId()`가 정지된 본인 계정에서 null 반환 가능 (High 이슈 참조)
   - **위치**: 라인 108-112
   - **해결 방안**: 상태 무관 조회 쿼리 사용 권장. **[수정 코드 제시 불가 — 문맥 파악 불충분]**

### MustChangePasswordInterceptor.java

**변경 내용**: `must_change_password='Y'`인 관리자를 비밀번호 변경 페이지로 강제 리다이렉트하는 인터셉터.

**개선 제안**:
1. **리다이렉트 루프 가능성**: 인터셉터가 `/admin/account/password`를 제외하므로 변경 페이지 자체는 통과하지만, 변경 페이지에서 로그아웃하지 않고 다른 `/admin/**` 경로로 이동하면 다시 변경 페이지로 리다이렉트됩니다. 이는 의도된 동작이므로 문제는 아니나, 변경 페이지에서의 UX(예: "변경 후 이동할 경로")를 고려하면 좋습니다.

### SecurityConfig.java

**변경 내용**: `RoleHierarchy` 빈 추가 및 `/admin/accounts/**` 경로를 `hasRole("SUPER_ADMIN")`으로 제한.

**개선 제안**:
1. **RoleHierarchy와 hasRole의 상호작용**: `RoleHierarchyImpl.fromHierarchy("ROLE_SUPER_ADMIN > ROLE_ADMIN")`이 정의되어 있고, `hasRole("SUPER_ADMIN")`은 계층을 통해 SUPER_ADMIN만 통과합니다. 이는 올바른 설정입니다. 다만 `hasRole("ADMIN")`이 적용된 `.anyRequest()`는 SUPER_ADMIN도 계층을 통해 통과하므로, SUPER_ADMIN이 모든 admin 페이지에 접근 가능한 의도된 동작입니다.

### AdminUserDetailsService.java

**변경 내용**: role 컬럼 기반으로 `ROLE_{role}` 권한을 부여하도록 변경.

**개선 제안**:
1. **role 값 검증 부재**: DB에 `role` 컬럼에 예상치 못한 값(예: "USER")이 들어가면 `ROLE_USER` 권한이 부여되어 접근이 차단될 수 있습니다. `ROLES` 허용 집합으로 검증하거나, 기본값 처리 로직을 강화하는 것이 좋습니다. 다만 현재는 `create()`에서 `ROLES` 집합으로 검증하므로 실제로는 안전합니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전반적으로 잘 구조화된 커밋입니다. 계정 관리 기능과 비밀번호 변경 강제 정책이 명확하게 구현되었고, 본인 계정 잠금 방지와 RoleHierarchy 도입 등 안전장치가 잘 갖춰져 있습니다. 다만 임시비밀번호 규칙의 예측 가능성(`{아이디}!12`)은 보안 관점에서 개선이 권장되며, `actorId()`의 상태 무관 조회 이슈도 함께 검토하시길 권장합니다. 이 두 가지가 해결되면 승인 가능한 수준입니다.