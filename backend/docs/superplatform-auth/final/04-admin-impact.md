# 4. Admin 영역 영향도 분석 및 대응

> SSO 전환에 따른 Admin 기능별 영향 및 수정 방안

---

## 4.1 Admin 기능 전체 목록 및 영향도

| # | 기능 | 페이지 | 영향도 | 이유 |
|---|------|--------|:---:|------|
| 1 | Admin 로그인 | login.html | **Critical** | user → admin_account 테이블 이전 |
| 2 | 대시보드 | dashboard.html | 없음 | 카운트만 표시 |
| 3 | 회원 목록/검색 | users.html | 없음 | email/nickname/gender 컬럼 유지 |
| 4 | **회원 생성** | users.html | **High** | password 컬럼 제거 → 직접 생성 불가 |
| 5 | 역할 변경 | users.html | 없음 | |
| 6 | 상태 변경 | users.html | 경미 | refresh_token 삭제 로직 변경 필요 |
| 7 | **비밀번호 초기화** | users.html | **High** | password 컬럼 제거 → 일반 회원 대상 불가 |
| 8 | 역할 관리 | roles.html | 없음 | |
| 9 | 학교 관리/CSV임포트 | schools.html | 없음 | |
| 10 | 학교 매핑 | school-map.html | 없음 | email/nickname 컬럼 유지 |
| 11 | 그룹 목록/상세 | groups.html | 없음 | |
| 12 | **API 테스트** | api-test.html | **Critical** | JwtUtil 제거 → 자체 토큰 생성 불가 |

---

## 4.2 Critical 영향 — 상세 대응

### 4.2.1 Admin 로그인 → admin_account 테이블

**현행:**
```
AdminUserDetailsService.loadUserByUsername(email)
  → userMapper.findByEmailAndStatus(email, "ACTIVE")
  → user 테이블에서 조회 (role level >= 99 체크)
```

**변경:**
```
AdminUserDetailsService.loadUserByUsername(email)
  → adminAccountMapper.findByEmail(email)
  → admin_account 테이블에서 조회
```

**수정 파일:**
- `AdminUserDetailsService.java` — user 테이블 → admin_account 테이블
- `AdminAccountMapper.java` + `AdminAccountMapper.xml` — 신규

### 4.2.2 API 테스트 → 토큰 직접 입력 방식

**현행:**
```
/admin/api-test/bootstrap 호출
  → admin의 email, roleCode, tcId를 user 테이블에서 조회
  → JwtUtil.generateAccessToken() 으로 자체 JWT 생성
  → 이 토큰으로 모든 API 호출
```

**문제:** JwtUtil 제거 + API가 RS256 토큰 기대 → 자체 토큰 생성 불가

**변경:** 토큰 직접 입력 방식

```
API 테스트 페이지 상단에 토큰 입력 필드 추가:
┌──────────────────────────────────────────────┐
│  Access Token (Auth 서버에서 발급받은 토큰)     │
│  [                                          ] │
│  [붙여넣기]                                   │
│                                              │
│  토큰 정보: 홍길동 / TEACHER / 만료: 14:30     │
└──────────────────────────────────────────────┘
```

사용 방법:
1. Auth 서버에 테스트 계정으로 로그인 (별도 브라우저 탭)
2. 발급받은 Access Token 복사
3. API 테스트 페이지의 토큰 입력 필드에 붙여넣기
4. 이 토큰으로 API 테스트 수행

**수정 파일:**
- `api-test.html` — bootstrap 자동 토큰 발급 제거, 토큰 입력 필드 + JWT 디코딩 표시 추가
- `AdminController.java` — `/admin/api-test/bootstrap` 엔드포인트 제거 또는 수정

**제거:**
- JwtUtil 의존성 제거
- 자동 토큰 발급 로직 제거
- 교사 목록 자동 로딩은 유지 가능 (토큰 불필요, Admin 세션으로 조회)

---

## 4.3 High 영향 — 상세 대응

### 4.3.1 회원 생성 → 기능 제거

**현행:** Admin이 email + password + nickname + gender + roleCode 입력 → user INSERT

**문제:** password 컬럼 제거 → 비밀번호 설정 불가

**대응:** 회원 생성 기능 **제거**. 회원가입은 Auth 서버에서만 가능.

Admin에서 필요한 경우:
- Auth 서버에서 가입하도록 안내
- 또는 Auth 서버 Admin API(회원 생성)가 있다면 연동

**수정 파일:**
- `users.html` — 계정 등록 폼 제거
- `AdminController.java` — `POST /admin/users/create` 제거
- `AdminUserService.java` — `createUserByAdmin()` 제거

### 4.3.2 비밀번호 초기화 → 일반 회원 대상 제거, Admin 전용 유지

**현행:** 모든 사용자 대상 비밀번호 초기화 (오늘 구현한 기능)

**변경:**
- **일반 회원**: Auth 서버가 비밀번호 관리 → 학심정에서 초기화 불가 → 버튼 제거
- **Admin 계정**: admin_account 테이블에 password 있음 → Admin 전용 초기화는 유지 가능

**수정 파일:**
- `users.html` — 일반 회원 행에서 [비밀번호 초기화] 버튼 제거
- Admin 계정 관리 페이지를 별도로 만들면 거기서 Admin 비밀번호 초기화 유지

### 4.3.3 상태 변경 시 refresh_token 삭제

**현행:** 회원 정지/탈퇴 시 `refreshTokenMapper.deleteByUserNo(userNo)` → 강제 로그아웃

**변경:** refresh_token 테이블 DROP → 삭제 로직 제거

단, Auth 서버에서 해당 사용자의 세션을 무효화하는 API가 있다면 호출 가능. 없으면 학심정 측에서는 상태만 변경하고, 토큰 만료(15분) 후 자연 로그아웃.

---

## 4.4 수정 파일 요약

### 신규

| 파일 | 역할 |
|------|------|
| `admin/mapper/AdminAccountMapper.java` | admin_account CRUD |
| `mapper/admin/AdminAccountMapper.xml` | admin_account SQL |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `AdminUserDetailsService.java` | user 테이블 → admin_account 테이블 |
| `AdminController.java` | 회원 생성 제거, API 테스트 bootstrap 수정 |
| `AdminUserService.java` | createUserByAdmin 제거, resolveAdminUserNo를 admin_account 기반으로 변경 |
| `users.html` | 계정 등록 폼 제거, 비밀번호 초기화 버튼 제거 |
| `api-test.html` | 토큰 자동 발급 → 토큰 직접 입력 필드 |

### 제거

| 대상 | 이유 |
|------|------|
| `POST /admin/users/create` | Auth 서버에서 가입 |
| `POST /admin/users/reset-password` (일반 회원 대상) | Auth 서버가 비밀번호 관리 |
| `POST /admin/users/send-temp-password` (일반 회원 대상) | 동일 |
| `GET /admin/api-test/bootstrap`의 자체 JWT 발급 | JwtUtil 제거 |

---

## 4.5 api-test.html 변경 상세

### 제거

```javascript
// 제거: bootstrap에서 자동 JWT 생성
$.get('/admin/api-test/bootstrap', function(data) {
    accessToken = data.accessToken;  // ← 이 부분 제거
    // ...
});
```

### 추가

```html
<!-- 토큰 입력 영역 -->
<div class="card card-warning card-outline">
    <div class="card-header">
        <h3 class="card-title">Access Token</h3>
    </div>
    <div class="card-body">
        <p class="text-muted small">
            Auth 서버에서 로그인 후 발급받은 Access Token을 붙여넣으세요.
        </p>
        <div class="input-group">
            <input type="text" id="tokenInput" class="form-control"
                   placeholder="eyJhbGciOiJSUzI1NiJ9..." />
            <div class="input-group-append">
                <button class="btn btn-warning" onclick="applyToken()">적용</button>
            </div>
        </div>
        <div id="tokenInfo" class="mt-2 small text-muted" style="display:none">
            <!-- JWT 디코딩 결과 표시 -->
        </div>
    </div>
</div>
```

```javascript
var accessToken = null;

function applyToken() {
    var token = $('#tokenInput').val().trim();
    if (!token) return;

    // JWT payload 디코딩 (서명 검증은 안 함, 표시용)
    try {
        var payload = JSON.parse(atob(token.split('.')[1]));
        accessToken = token;
        $('#tokenInfo').show().html(
            '<strong>' + (payload.name || payload.sub) + '</strong>' +
            ' / ' + payload.userType +
            ' / 만료: ' + new Date(payload.exp * 1000).toLocaleTimeString()
        );
    } catch (e) {
        alert('유효하지 않은 토큰입니다.');
    }
}
```

### 유지

교사 목록, 그룹 목록, 멤버 목록 조회 등 **Admin 세션으로 호출하는 AJAX**는 그대로 유지:
```javascript
// 이것들은 Admin 세션 인증이므로 영향 없음
$.get('/admin/api-test/teacher-groups?teacherUserNo=' + userNo, ...);
$.get('/admin/api-test/group-members?claId=' + claId, ...);
```
