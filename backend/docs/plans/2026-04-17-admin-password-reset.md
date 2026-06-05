# Admin 비밀번호 초기화 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin 회원 관리 페이지에서 특정 사용자의 비밀번호를 랜덤 임시 비밀번호로 초기화하고, 화면 표시 + 이메일 발송을 할 수 있게 한다.

**Architecture:** AdminController에 POST 엔드포인트 2개 추가 (초기화 + 이메일 발송), AdminUserService에 비즈니스 로직, UserMapper에 비밀번호 전용 UPDATE 쿼리, NcpMailSender에 메일 발송 메서드, users.html에 버튼 + 모달 UI.

**Tech Stack:** Spring Boot 2.7, Thymeleaf, AdminLTE 3.x, MyBatis, BCrypt, NCP Mail API

---

## File Map

| 파일 | 변경 유형 | 역할 |
|------|----------|------|
| `backend/src/main/resources/mapper/member/UserMapper.xml` | 수정 | `updatePassword` 전용 쿼리 추가 |
| `backend/src/main/java/com/vs/meta/api/member/mapper/UserMapper.java` | 수정 | `updatePassword` 매퍼 메서드 추가 |
| `backend/src/main/java/com/vs/meta/common/utils/NcpMailSender.java` | 수정 | `sendTempPassword` 메일 발송 메서드 추가 |
| `backend/src/main/java/com/vs/meta/admin/service/AdminUserService.java` | 수정 | `resetPassword`, `sendTempPasswordEmail` 메서드 추가 |
| `backend/src/main/java/com/vs/meta/admin/controller/AdminController.java` | 수정 | POST 엔드포인트 2개 추가 |
| `backend/src/main/resources/templates/admin/users.html` | 수정 | 초기화 버튼 + 결과 모달 UI |

---

### Task 1: UserMapper에 비밀번호 전용 UPDATE 쿼리 추가

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/api/member/mapper/UserMapper.java`
- Modify: `backend/src/main/resources/mapper/member/UserMapper.xml`

- [ ] **Step 1: UserMapper.java에 메서드 추가**

`UserMapper.java`에 아래 메서드를 추가한다:

```java
void updatePassword(@Param("userNo") Long userNo,
                    @Param("password") String encodedPassword,
                    @Param("updatedBy") Long updatedBy);
```

- [ ] **Step 2: UserMapper.xml에 쿼리 추가**

`UserMapper.xml`의 `</mapper>` 닫는 태그 바로 위에 추가:

```xml
<update id="updatePassword">
    /* UserMapper.updatePassword */
    UPDATE `user`
    SET password   = #{password},
        updated_by = #{updatedBy},
        updated_at = NOW()
    WHERE user_no = #{userNo}
</update>
```

- [ ] **Step 3: 컴파일 확인**

Run: `cd /d/workspace/meta-dashboard && ./gradlew :backend:compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/vs/meta/api/member/mapper/UserMapper.java backend/src/main/resources/mapper/member/UserMapper.xml
git commit -m "[BACKEND] feat: UserMapper에 updatePassword 전용 쿼리 추가"
```

---

### Task 2: NcpMailSender에 임시 비밀번호 메일 발송 메서드 추가

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/common/utils/NcpMailSender.java`

- [ ] **Step 1: sendTempPassword 메서드 추가**

`NcpMailSender.java`의 `sendGroupInvitation` 메서드 위에 추가:

```java
public void sendTempPassword(String toEmail, String tempPassword) {
    String timestamp = String.valueOf(System.currentTimeMillis());
    String signature = makeSignature("POST", MAIL_API_PATH, timestamp);

    Map<String, Object> body = Map.of(
            "senderAddress", senderAddress,
            "senderName", "[학습심리검사]",
            "title", "[학습심리검사] 비밀번호가 초기화되었습니다",
            "body", buildTempPasswordHtml(tempPassword),
            "recipients", List.of(Map.of("address", toEmail, "type", "R")),
            "individual", true,
            "advertising", false
    );

    WebClient.create(mailUrl)
            .post()
            .uri(MAIL_API_PATH)
            .contentType(MediaType.APPLICATION_JSON)
            .header("x-ncp-apigw-timestamp", timestamp)
            .header("x-ncp-iam-access-key", accessKey)
            .header("x-ncp-apigw-signature-v2", signature)
            .bodyValue(body)
            .retrieve()
            .bodyToMono(String.class)
            .doOnSuccess(res -> log.info("임시 비밀번호 메일 발송 성공: to={}", toEmail))
            .doOnError(err -> log.error("임시 비밀번호 메일 발송 실패: to={}", toEmail, err))
            .block();
}
```

- [ ] **Step 2: buildTempPasswordHtml 메서드 추가**

`NcpMailSender.java`의 private 메서드 영역(`buildInvitationHtml` 아래)에 추가:

```java
private String buildTempPasswordHtml(String tempPassword) {
    return "<div style='padding:20px;font-family:sans-serif;line-height:1.8'>"
            + "<h2>[학습심리검사] 비밀번호 초기화 안내</h2>"
            + "<p>안녕하세요.</p>"
            + "<p>관리자에 의해 비밀번호가 초기화되었습니다.</p>"
            + "<div style='margin:20px 0;padding:16px;background:#f5f5f5;border-radius:8px'>"
            + "<p style='margin:0 0 8px 0;color:#666'>임시 비밀번호</p>"
            + "<h1 style='margin:0;color:#4A90D9;letter-spacing:4px'>" + tempPassword + "</h1>"
            + "</div>"
            + "<p>위 비밀번호로 로그인해주세요.</p>"
            + "</div>";
}
```

- [ ] **Step 3: 컴파일 확인**

Run: `cd /d/workspace/meta-dashboard && ./gradlew :backend:compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/vs/meta/common/utils/NcpMailSender.java
git commit -m "[BACKEND] feat: NcpMailSender에 임시 비밀번호 메일 발송 추가"
```

---

### Task 3: AdminUserService에 비밀번호 초기화 로직 추가

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/admin/service/AdminUserService.java`

- [ ] **Step 1: import 추가**

`AdminUserService.java` 상단 import 영역에 추가 (이미 있는 것은 생략):

```java
import com.vs.meta.common.utils.NcpMailSender;
import java.security.SecureRandom;
```

- [ ] **Step 2: NcpMailSender 의존성 주입 추가**

`AdminUserService` 클래스의 필드 영역에 추가:

```java
private final NcpMailSender ncpMailSender;
```

`@RequiredArgsConstructor`가 이미 있으므로 생성자 자동 주입됨.

- [ ] **Step 3: generateTempPassword 메서드 추가**

`AdminUserService.java`에 private 메서드 추가:

```java
/**
 * 랜덤 임시 비밀번호 생성 (10자: 대문자2 + 소문자4 + 숫자2 + 특수문자2)
 * PasswordValidator 정책(10~64자, 2종류 이상) 충족 보장
 */
private String generateTempPassword() {
    SecureRandom random = new SecureRandom();
    String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    String lower = "abcdefghjkmnpqrstuvwxyz";
    String digits = "23456789";
    String special = "!@#$%&*";

    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < 2; i++) sb.append(upper.charAt(random.nextInt(upper.length())));
    for (int i = 0; i < 4; i++) sb.append(lower.charAt(random.nextInt(lower.length())));
    for (int i = 0; i < 2; i++) sb.append(digits.charAt(random.nextInt(digits.length())));
    for (int i = 0; i < 2; i++) sb.append(special.charAt(random.nextInt(special.length())));

    // Fisher-Yates 셔플
    char[] chars = sb.toString().toCharArray();
    for (int i = chars.length - 1; i > 0; i--) {
        int j = random.nextInt(i + 1);
        char tmp = chars[i];
        chars[i] = chars[j];
        chars[j] = tmp;
    }
    return new String(chars);
}
```

- [ ] **Step 4: resetPassword 메서드 추가**

```java
/**
 * 비밀번호 초기화: 랜덤 임시 비밀번호 생성 → BCrypt 저장 → refresh_token 삭제
 * @return 임시 비밀번호 (평문, 화면 표시용)
 */
@Transactional
public String resetPassword(Long userNo, Long adminUserNo) {
    User user = userMapper.findByUserNo(userNo);
    if (user == null) {
        throw new IllegalArgumentException("존재하지 않는 사용자입니다.");
    }

    String tempPassword = generateTempPassword();
    String encoded = passwordEncoder.encode(tempPassword);

    userMapper.updatePassword(userNo, encoded, adminUserNo);
    refreshTokenMapper.deleteByUserNo(userNo);

    log.info("비밀번호 초기화: userNo={}, adminUserNo={}", userNo, adminUserNo);
    return tempPassword;
}
```

- [ ] **Step 5: sendTempPasswordEmail 메서드 추가**

```java
/**
 * 임시 비밀번호 이메일 발송
 */
public void sendTempPasswordEmail(Long userNo, String tempPassword) {
    User user = userMapper.findByUserNo(userNo);
    if (user == null) {
        throw new IllegalArgumentException("존재하지 않는 사용자입니다.");
    }
    if (user.getEmail() == null || user.getEmail().isBlank()) {
        throw new IllegalArgumentException("이메일이 등록되지 않은 사용자입니다.");
    }

    ncpMailSender.sendTempPassword(user.getEmail(), tempPassword);
    log.info("임시 비밀번호 이메일 발송: userNo={}, email={}", userNo, user.getEmail());
}
```

- [ ] **Step 6: 컴파일 확인**

Run: `cd /d/workspace/meta-dashboard && ./gradlew :backend:compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/vs/meta/admin/service/AdminUserService.java
git commit -m "[BACKEND] feat: AdminUserService 비밀번호 초기화 + 이메일 발송"
```

---

### Task 4: AdminController에 엔드포인트 추가

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/admin/controller/AdminController.java`

- [ ] **Step 1: 비밀번호 초기화 엔드포인트 추가**

`AdminController.java`의 기존 `@PostMapping` 메서드들 아래에 추가:

```java
@PostMapping("/admin/users/reset-password")
@ResponseBody
public Map<String, Object> resetPassword(@RequestParam Long userNo,
                                          Authentication authentication) {
    Map<String, Object> result = new LinkedHashMap<>();
    try {
        Long adminUserNo = getAdminUserNo(authentication);
        String tempPassword = adminUserService.resetPassword(userNo, adminUserNo);
        result.put("success", true);
        result.put("tempPassword", tempPassword);
        result.put("message", "비밀번호가 초기화되었습니다.");
    } catch (Exception e) {
        result.put("success", false);
        result.put("message", e.getMessage());
    }
    return result;
}

@PostMapping("/admin/users/send-temp-password")
@ResponseBody
public Map<String, Object> sendTempPasswordEmail(@RequestParam Long userNo,
                                                  @RequestParam String tempPassword) {
    Map<String, Object> result = new LinkedHashMap<>();
    try {
        adminUserService.sendTempPasswordEmail(userNo, tempPassword);
        result.put("success", true);
        result.put("message", "이메일이 발송되었습니다.");
    } catch (Exception e) {
        result.put("success", false);
        result.put("message", e.getMessage());
    }
    return result;
}
```

- [ ] **Step 2: getAdminUserNo 헬퍼 메서드 확인**

`AdminController`에 이미 `getAdminUserNo(Authentication)` 같은 헬퍼가 있는지 확인. 없다면 아래 추가:

```java
private Long getAdminUserNo(Authentication authentication) {
    if (authentication == null || authentication.getName() == null) return 0L;
    try {
        User admin = adminUserService.findUserByEmail(authentication.getName());
        return admin != null ? admin.getUserNo() : 0L;
    } catch (Exception e) {
        return 0L;
    }
}
```

- [ ] **Step 3: 컴파일 확인**

Run: `cd /d/workspace/meta-dashboard && ./gradlew :backend:compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/vs/meta/admin/controller/AdminController.java
git commit -m "[BACKEND] feat: Admin 비밀번호 초기화/이메일 발송 엔드포인트"
```

---

### Task 5: users.html에 초기화 버튼 + 결과 모달 추가

**Files:**
- Modify: `backend/src/main/resources/templates/admin/users.html`

- [ ] **Step 1: 테이블 헤더에 컬럼 추가**

`users.html`의 `<thead>` 안, `<th>학교 매핑</th>` 뒤에 추가:

```html
<th>비밀번호</th>
```

- [ ] **Step 2: 테이블 바디에 초기화 버튼 추가**

`users.html`의 `<tbody>` 안, 학교 매핑 `<td>` 뒤(각 `<tr>` 내부)에 추가:

```html
<td>
    <button type="button" class="btn btn-outline-warning btn-xs"
            th:data-user-no="${user.userNo}"
            th:data-email="${user.email}"
            th:data-nickname="${user.nickname}"
            onclick="confirmResetPassword(this)">
        <i class="fas fa-key mr-1"></i>초기화
    </button>
</td>
```

빈 결과 행의 `colspan`도 `10`에서 `11`로 변경:

```html
<td colspan="11" class="text-center text-muted py-4">검색 결과가 없습니다</td>
```

- [ ] **Step 3: 결과 모달 HTML 추가**

`users.html`의 `</section>` 닫는 태그 바로 위에 모달 추가:

```html
<!-- 비밀번호 초기화 결과 모달 -->
<div class="modal fade" id="resetPasswordModal" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-sm" role="document">
        <div class="modal-content">
            <div class="modal-header bg-warning">
                <h5 class="modal-title">비밀번호 초기화 완료</h5>
                <button type="button" class="close" data-dismiss="modal">&times;</button>
            </div>
            <div class="modal-body text-center">
                <p class="mb-2">임시 비밀번호</p>
                <h3 id="tempPasswordDisplay" class="text-primary" style="letter-spacing:2px;user-select:all"></h3>
                <button type="button" class="btn btn-outline-secondary btn-sm mt-2" onclick="copyTempPassword()">
                    <i class="fas fa-copy mr-1"></i>복사
                </button>
            </div>
            <div class="modal-footer justify-content-between">
                <button type="button" class="btn btn-info btn-sm" id="sendEmailBtn" onclick="sendTempPasswordEmail()">
                    <i class="fas fa-envelope mr-1"></i>이메일로 발송
                </button>
                <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">닫기</button>
            </div>
        </div>
    </div>
</div>
```

- [ ] **Step 4: JavaScript 추가**

`users.html`의 `<th:block th:replace="admin/fragments :: js" />` 바로 아래에 추가:

```html
<script>
var _resetUserNo = null;
var _tempPassword = null;

function confirmResetPassword(btn) {
    var userNo = btn.getAttribute('data-user-no');
    var email = btn.getAttribute('data-email');
    var nickname = btn.getAttribute('data-nickname');
    if (!confirm(nickname + '(' + email + ') 비밀번호를 초기화하시겠습니까?')) return;

    _resetUserNo = userNo;
    $.post('/admin/users/reset-password', { userNo: userNo }, function(res) {
        if (res.success) {
            _tempPassword = res.tempPassword;
            $('#tempPasswordDisplay').text(res.tempPassword);
            $('#sendEmailBtn').prop('disabled', false).text(' 이메일로 발송').prepend('<i class="fas fa-envelope mr-1"></i>');
            $('#resetPasswordModal').modal('show');
        } else {
            alert('실패: ' + res.message);
        }
    }).fail(function() {
        alert('서버 오류가 발생했습니다.');
    });
}

function copyTempPassword() {
    if (!_tempPassword) return;
    navigator.clipboard.writeText(_tempPassword).then(function() {
        alert('복사되었습니다.');
    });
}

function sendTempPasswordEmail() {
    if (!_resetUserNo || !_tempPassword) return;
    var btn = $('#sendEmailBtn');
    btn.prop('disabled', true).text('발송 중...');

    $.post('/admin/users/send-temp-password', {
        userNo: _resetUserNo,
        tempPassword: _tempPassword
    }, function(res) {
        if (res.success) {
            btn.text('발송 완료').removeClass('btn-info').addClass('btn-success');
        } else {
            alert('발송 실패: ' + res.message);
            btn.prop('disabled', false).text(' 이메일로 발송').prepend('<i class="fas fa-envelope mr-1"></i>');
        }
    }).fail(function() {
        alert('서버 오류가 발생했습니다.');
        btn.prop('disabled', false).text(' 이메일로 발송').prepend('<i class="fas fa-envelope mr-1"></i>');
    });
}
</script>
```

- [ ] **Step 5: 컴파일 확인**

Run: `cd /d/workspace/meta-dashboard && ./gradlew :backend:compileJava`
Expected: BUILD SUCCESSFUL

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/resources/templates/admin/users.html
git commit -m "[BACKEND] feat: Admin 회원 목록에 비밀번호 초기화 버튼/모달 UI"
```

---

### Task 6: 통합 테스트

- [ ] **Step 1: 서버 실행**

Run: `cd /d/workspace/meta-dashboard && ./gradlew :backend:bootRun`

- [ ] **Step 2: Admin 로그인 → 회원 관리 진입**

브라우저에서 `http://localhost:8081/admin/login` → 로그인 → `/admin/users` 이동

- [ ] **Step 3: 비밀번호 초기화 테스트**

1. 테스트 대상 사용자의 [초기화] 버튼 클릭
2. 확인 다이얼로그 → "확인"
3. 모달에 임시 비밀번호 표시되는지 확인
4. [복사] 버튼 동작 확인
5. [이메일로 발송] 버튼 클릭 → "발송 완료" 표시 확인

- [ ] **Step 4: 임시 비밀번호로 로그인 테스트**

1. 모달에서 복사한 임시 비밀번호로 해당 사용자 로그인 시도
2. 정상 로그인 확인

- [ ] **Step 5: 기존 세션 무효화 확인**

1. 초기화 전에 해당 사용자가 로그인되어 있었다면 기존 토큰으로 API 호출 시 401 반환 확인
