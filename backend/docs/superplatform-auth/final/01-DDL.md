# 1. DDL — 최종 스키마 + 마이그레이션

> 동시 오픈 기준, Auth 인증 + 학심정 서비스 데이터 분리

---

## 1.1 원칙

- 인증(로그인/비밀번호/토큰) → Auth 서버
- 개인정보(이름/이메일/성별) → 학심정 DB에도 저장 (Auth JWT에서 동기화)
- 서비스 데이터(그룹/상담/검사 등) → 학심정 DB
- Admin 계정 → 별도 admin_account 테이블 (자체 세션 인증)

---

## 1.2 user 테이블 — 변경

### 현행

```sql
CREATE TABLE `user` (
    user_no         BIGINT NOT NULL AUTO_INCREMENT,
    email           VARCHAR(100) NOT NULL,      -- 유지
    password        VARCHAR(255) NOT NULL,      -- ★ 제거
    nickname        VARCHAR(50) NOT NULL,       -- 유지
    gender          VARCHAR(10) NULL,           -- 유지
    role_code       VARCHAR(20) NOT NULL,
    tc_id           VARCHAR(64) NULL,
    stdt_id         VARCHAR(64) NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login_at   DATETIME NULL,
    created_by      BIGINT NOT NULL DEFAULT 0,
    updated_by      BIGINT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_no),
    UNIQUE KEY uk_user_email (email),
    UNIQUE KEY uk_user_tc_id (tc_id),
    UNIQUE KEY uk_user_stdt_id (stdt_id),
    INDEX idx_user_role (role_code),
    CONSTRAINT fk_user_role FOREIGN KEY (role_code) REFERENCES role_group (role_code)
);
```

### 변경 DDL (마이그레이션)

```sql
-- 1) sp_user_id 컬럼 추가 (Auth 서버 publicUserId)
ALTER TABLE `user`
  ADD COLUMN sp_user_id VARCHAR(64) NULL
    COMMENT '슈퍼플랫폼 publicUserId (UUID)' AFTER user_no,
  ADD UNIQUE KEY uk_user_sp_user_id (sp_user_id);

-- 2) auth_provider 컬럼 추가 (인증 제공자 구분)
ALTER TABLE `user`
  ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'SSO'
    COMMENT '인증 제공자 (SSO)' AFTER sp_user_id;

-- 3) password 컬럼 제거 (Auth 서버가 관리)
ALTER TABLE `user`
  DROP COLUMN password;
```

### 변경 후 최종 상태

```sql
CREATE TABLE `user` (
    user_no         BIGINT NOT NULL AUTO_INCREMENT  COMMENT '회원 번호 (PK)',
    sp_user_id      VARCHAR(64) NULL                COMMENT '슈퍼플랫폼 publicUserId (UUID)',
    auth_provider   VARCHAR(20) NOT NULL DEFAULT 'SSO' COMMENT '인증 제공자 (SSO)',
    email           VARCHAR(100) NOT NULL           COMMENT '이메일 (Auth JWT에서 동기화)',
    nickname        VARCHAR(50) NOT NULL            COMMENT '닉네임 (Auth JWT에서 동기화)',
    gender          VARCHAR(10) NULL                COMMENT '성별 (Auth JWT에서 동기화)',
    role_code       VARCHAR(20) NOT NULL            COMMENT '권한 코드',
    tc_id           VARCHAR(64) NULL                COMMENT '교사 ID',
    stdt_id         VARCHAR(64) NULL                COMMENT '학생 ID',
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login_at   DATETIME NULL,
    created_by      BIGINT NOT NULL DEFAULT 0,
    updated_by      BIGINT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_no),
    UNIQUE KEY uk_user_sp_user_id (sp_user_id),
    UNIQUE KEY uk_user_email (email),
    UNIQUE KEY uk_user_tc_id (tc_id),
    UNIQUE KEY uk_user_stdt_id (stdt_id),
    INDEX idx_user_role (role_code),
    CONSTRAINT fk_user_role FOREIGN KEY (role_code) REFERENCES role_group (role_code)
);
```

**변경 요약**: +sp_user_id, +auth_provider, -password

---

## 1.3 admin_account 테이블 — 신규

기존 user 테이블에서 ADMIN 역할을 분리하여 별도 관리.

```sql
CREATE TABLE admin_account (
    id              BIGINT NOT NULL AUTO_INCREMENT  COMMENT 'Admin ID (PK)',
    email           VARCHAR(100) NOT NULL           COMMENT '로그인 이메일',
    password        VARCHAR(255) NOT NULL           COMMENT '비밀번호 (BCrypt)',
    nickname        VARCHAR(50) NOT NULL            COMMENT '관리자 이름',
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/SUSPENDED',
    last_login_at   DATETIME NULL                   COMMENT '마지막 로그인',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='관리자 계정 (SSO 미적용, 자체 세션 인증)';

-- 기존 ADMIN 데이터 이관
INSERT INTO admin_account (email, password, nickname, status, last_login_at, created_at)
SELECT email, password, nickname, status, last_login_at, created_at
FROM `user`
WHERE role_code = 'ADMIN';
```

---

## 1.4 제거 대상 테이블

```sql
-- Auth 서버가 담당하므로 학심정 DB에서 제거
DROP TABLE IF EXISTS email_verification;
DROP TABLE IF EXISTS refresh_token;
```

---

## 1.5 group_member 테이블 — 변경 없음

개인정보(nickname, gender, email)를 학심정 DB에 유지하기로 했으므로 **변경 없음**.

---

## 1.6 기타 테이블 — 변경 없음

| 테이블 | 상태 |
|--------|------|
| role_group | 변경 없음 |
| school_info | 변경 없음 |
| group_info | 변경 없음 |
| group_member | 변경 없음 (nickname/gender/email 유지) |
| counseling_info | 변경 없음 |
| counseling_student | 변경 없음 (stdt_name 유지) |
| memo_info | 변경 없음 |
| school_record_info | 변경 없음 |
| group_invitation | 변경 없음 |
| guest_conversion_log | 변경 없음 |

---

## 1.7 마이그레이션 실행 순서

```sql
-- Step 1: admin_account 테이블 생성 + ADMIN 데이터 이관
CREATE TABLE admin_account (...);
INSERT INTO admin_account SELECT ... FROM user WHERE role_code = 'ADMIN';

-- Step 2: user 테이블 변경
ALTER TABLE `user` ADD COLUMN sp_user_id ...;
ALTER TABLE `user` ADD COLUMN auth_provider ...;
ALTER TABLE `user` DROP COLUMN password;

-- Step 3: 제거 대상 테이블 DROP
DROP TABLE IF EXISTS email_verification;
DROP TABLE IF EXISTS refresh_token;

-- Step 4: user 테이블에서 ADMIN 행 제거 (admin_account로 이관 완료 후)
-- ※ 기존 그룹/상담 등에서 ADMIN user_no를 FK로 참조하는 경우 확인 후 실행
-- DELETE FROM `user` WHERE role_code = 'ADMIN';
```
