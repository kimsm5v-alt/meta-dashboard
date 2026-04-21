# 5. 기존 회원 데이터 이관 계획

> 학심정 user 테이블 → Auth platform_user 이관 + sp_user_id 매핑

---

## 5.1 이관이 필요한 이유

동시 오픈 후 학심정 자체 로그인이 없어지므로, 기존 회원이 Auth 서버에서 로그인할 수 있어야 한다. 학심정 user 테이블의 회원 정보를 Auth `platform_user`에 넣어야 기존 비밀번호로 Auth 로그인 가능.

---

## 5.2 이관 대상

| 조건 | 비고 |
|------|------|
| `user.status = 'ACTIVE'` | 활성 회원만 |
| `user.role_code != 'ADMIN'` | Admin은 admin_account로 별도 이관 |
| `user.email IS NOT NULL` | 이메일 없는 회원 제외 |

---

## 5.3 필드 매핑

| 학심정 user | Auth platform_user | 변환 |
|------------|-------------------|------|
| (없음) | `public_user_id` | **UUID 신규 채번** |
| (없음) | `tenant_id` | `1` (기본값) |
| `email` | `email` | 그대로 |
| `password` | `password_hash` | **그대로 복사** (둘 다 BCrypt) |
| `nickname` | `name` | 그대로 |
| `gender` | `gender` | 그대로 |
| `role_code` | `user_type` | TEACHER→TEACHER, STUDENT→STUDENT |
| (없음) | `auth_provider` | `LOCAL` |
| (없음) | `status` | `ACTIVE` |
| `created_at` | `created_at` | 그대로 |
| `last_login_at` | `last_login_at` | 그대로 |

**핵심: BCrypt 호환**
- 학심정: `passwordEncoder.encode()` → BCrypt (`$2a$10$...`)
- Auth: `password_hash` BCrypt (`$2a$10$...`)
- **해시값 그대로 복사하면 기존 비밀번호로 Auth 로그인 가능**

---

## 5.4 이관 시나리오: 이메일 충돌 처리

다른 서비스(매쓰캔버스, 게임 등) 사용자가 같은 이메일로 Auth에 먼저 가입해있을 수 있다.

### 시나리오 A: Auth에 이메일 없음 (신규)

```
학심정 user (email: hong@test.com)
  → Auth platform_user에 해당 이메일 없음
  → INSERT (public_user_id=UUID 채번, password_hash=학심정 BCrypt 복사)
  → 학심정 user.sp_user_id = 새로 생성된 public_user_id
```

### 시나리오 B: Auth에 같은 이메일 이미 존재

```
학심정 user (email: hong@test.com, password: $2a$10$abc...)
Auth platform_user (email: hong@test.com, password_hash: $2a$10$xyz...)  ← 다른 서비스에서 가입

  → INSERT 하면 UNIQUE 제약 위반
  → 기존 Auth 회원의 public_user_id를 학심정 sp_user_id에 매핑만
  → 비밀번호는 Auth 쪽 기존값 유지 (덮어쓰지 않음)
  → 사용자는 Auth에 등록된 비밀번호로 로그인
```

**시나리오 B의 문제**: 사용자가 학심정에서 설정한 비밀번호와 Auth의 비밀번호가 다를 수 있음.

**대응 방안**:

| 방안 | 설명 | 장단점 |
|------|------|--------|
| **(1)** 기존 Auth 비밀번호 유지 | 학심정 비밀번호 무시 | 사용자 혼란 가능 (기존 비밀번호 안 됨) |
| **(2)** 학심정 비밀번호로 덮어쓰기 | Auth password_hash UPDATE | 다른 서비스에서 쓰던 비밀번호가 바뀜 |
| **(3)** 사용자에게 비밀번호 재설정 안내 | 이메일로 재설정 링크 발송 | 가장 안전, 사용자 액션 필요 |

**권장: (1) + 안내** — 기존 Auth 비밀번호 유지하되, 학심정 기존 회원에게 "통합 플랫폼 계정으로 전환되었습니다. 기존 비밀번호로 로그인이 안 되면 비밀번호 재설정을 해주세요" 안내 메일 발송.

---

## 5.5 이관 스크립트

### Step 1: 학심정 회원 추출

```sql
-- 이관 대상 추출 (학심정 DB)
SELECT 
    user_no,
    email,
    password,
    nickname,
    gender,
    role_code,
    created_at,
    last_login_at
FROM `user`
WHERE status = 'ACTIVE'
  AND role_code != 'ADMIN'
  AND email IS NOT NULL
ORDER BY user_no;
```

### Step 2: Auth DB에 INSERT (이메일 충돌 시 SKIP)

```sql
-- Auth DB에서 실행
-- 이메일이 이미 존재하면 INSERT 안 함 (IGNORE)

INSERT IGNORE INTO platform_user (
    public_user_id,
    tenant_id,
    email,
    password_hash,
    name,
    gender,
    user_type,
    auth_provider,
    status,
    failed_login_count,
    created_by,
    updated_by,
    created_at,
    updated_at
) VALUES (
    UUID(),          -- public_user_id 자동 채번
    1,               -- tenant_id 기본값
    ?,               -- 학심정 user.email
    ?,               -- 학심정 user.password (BCrypt 그대로)
    ?,               -- 학심정 user.nickname → Auth name
    ?,               -- 학심정 user.gender
    ?,               -- 학심정 role_code → user_type 매핑
    'LOCAL',         -- auth_provider
    'ACTIVE',        -- status
    0,               -- failed_login_count
    0,               -- created_by (system)
    0,               -- updated_by (system)
    ?,               -- 학심정 user.created_at
    NOW()            -- updated_at
);
```

**주의**: `INSERT IGNORE`는 이메일 중복 시 조용히 스킵. 이관 후 스킵된 건수를 확인하여 시나리오 B 해당 건을 파악해야 함.

### Step 3: 학심정 user.sp_user_id 매핑

```sql
-- 학심정 DB에서 실행
-- Auth에 INSERT된 회원의 public_user_id를 학심정에 매핑

UPDATE `user` u
INNER JOIN (
    -- Auth DB에서 조회한 매핑 데이터 (별도 추출 후 임포트)
    SELECT email, public_user_id
    FROM auth_db.platform_user
    WHERE tenant_id = 1
) auth ON u.email = auth.email
SET u.sp_user_id = auth.public_user_id
WHERE u.status = 'ACTIVE'
  AND u.role_code != 'ADMIN'
  AND u.sp_user_id IS NULL;
```

**DB 간 직접 JOIN이 불가능한 경우** (별도 서버):
1. Auth DB에서 `SELECT email, public_user_id` → CSV 추출
2. 학심정 DB에 임시 테이블로 로딩
3. UPDATE JOIN 실행
4. 임시 테이블 DROP

### Step 4: 이관 검증

```sql
-- 학심정 DB: 매핑 완료율 확인
SELECT 
    COUNT(*) AS total_active,
    SUM(CASE WHEN sp_user_id IS NOT NULL THEN 1 ELSE 0 END) AS mapped,
    SUM(CASE WHEN sp_user_id IS NULL THEN 1 ELSE 0 END) AS unmapped
FROM `user`
WHERE status = 'ACTIVE'
  AND role_code != 'ADMIN';
```

```sql
-- unmapped 건이 있다면 원인 확인
SELECT user_no, email, role_code
FROM `user`
WHERE status = 'ACTIVE'
  AND role_code != 'ADMIN'
  AND sp_user_id IS NULL;
-- → 이메일이 Auth에 이미 있는데 INSERT IGNORE로 스킵된 건
-- → Step 3에서 매핑이 안 된 건 (시나리오 B)
```

### Step 5: 학심정 user.password 컬럼 DROP

```sql
-- 이관 완료 + 검증 후 실행
ALTER TABLE `user` DROP COLUMN password;
```

---

## 5.6 TeacherProfile 이관 (선택)

Auth 서버에 `teacher_profile` 테이블이 있으므로, 학심정의 교사 관련 학교 정보도 이관 가능.

그러나 학심정의 교사 학교 정보는 **auth_school_map** 테이블(직책별 학교 접근 매핑)로 관리되고 있어서, Auth의 TeacherProfile과 구조가 다르다. 이 부분은 **별도 협의 후 결정**.

---

## 5.7 이관 타임라인

```
오픈 2주 전   이관 스크립트 작성 + 개발 DB에서 테스트
오픈 1주 전   스테이징 환경에서 리허설
오픈 당일     (서비스 점검 시간)
              1. Auth DB에 회원 INSERT (Step 2)
              2. 학심정 sp_user_id 매핑 (Step 3)
              3. 이관 검증 (Step 4)
              4. 학심정 password 컬럼 DROP (Step 5)
              5. SSO 인증 모드 활성화 (배포)
오픈          동시 오픈
```

---

## 5.8 이관 시 Auth 팀 협의 필요

| # | 질문 | 영향 |
|---|------|------|
| **M1** | Auth DB에 직접 INSERT 허용 여부 (또는 이관 API 제공 여부) | 이관 방식 결정 |
| **M2** | `INSERT IGNORE` 사용 시 이메일 충돌 건의 처리 정책 (Auth 팀과 합의) | 시나리오 B 대응 |
| **M3** | `public_user_id` 채번 방식 — `UUID()` 직접 생성 vs Auth 측 API로 채번 | 데이터 정합성 |
| **M4** | 이관 후 기존 회원에게 안내 메일 발송 여부 + 문구 | 사용자 경험 |
| **M5** | 이관 실행 시 Auth DB 접근 권한 (학심정팀 직접 vs Auth팀 대행) | 운영 절차 |

---

## 5.9 게스트 데이터 — 이관 불필요

게스트는 Auth에 계정이 없으므로 이관 대상이 아님.
- `group_member`의 게스트 데이터(stdt_id, email, nickname)는 학심정 DB에 그대로 유지
- 게스트가 나중에 SSO 회원가입 시 → 기존 guest_conversion_log 플로우로 매칭

---

## 5.10 롤백 계획

이관 실패 시 복원 방안:

```
1. 학심정 user.password 컬럼이 아직 DROP 전이라면:
   → SSO 모드 비활성화 (자체 인증으로 롤백)
   → user.sp_user_id = NULL 초기화

2. password 컬럼을 이미 DROP 했다면:
   → 이관 전 user 테이블 백업에서 password 컬럼 복원
   → ALTER TABLE user ADD COLUMN password ...
   → UPDATE user SET password = (백업에서)
```

**필수**: 이관 전 `mysqldump` 또는 `SELECT INTO OUTFILE`로 user 테이블 전체 백업.
