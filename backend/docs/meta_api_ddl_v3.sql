-- ============================================================
-- viva_meta Database DDL (v3) — email 로그인 전환
-- 학습심리정서검사 플랫폼 회원 DB
-- 설계 방식: user_id(계정명) 제거, user_no(BIGINT PK) + email(로그인 식별자)
-- 변경 사유: 기존 userId(계정명) 폐지, email을 로그인 식별자로 전환
-- 테이블 수: 14개
-- 최종 업데이트: 2026-03-25
-- 상태: 설계 검토 중
-- 기술 스택: Spring Boot 2.7.17, MyBatis 3.5.13, MySQL 8.3.0
-- ============================================================
-- 테이블 목록:
--   1. role_group          — 권한 그룹 마스터
--   2. school_info         — 학교 마스터
--   3. user                — 통합 회원 (★ PK: user_no BIGINT)
--   4. group_info          — 그룹(방/학급)
--   5. auth_school_map     — 직책별 학교 접근 매핑
--   6. group_member        — 그룹 멤버
--   7. guest_conversion_log — 게스트 회원전환 이력
--   8. group_invitation    — 그룹 이메일 초대
--   9. email_verification  — 이메일 인증코드
--  10. memo_info           — 관찰 메모
--  11. counseling_info     — 상담 정보
--  12. counseling_student  — 상담-학생 매핑
--  13. refresh_token       — Refresh Token 관리
--  14. school_record_info  — 생기부 (생활기록부)
-- ============================================================
-- v2 → v3 변경 요약:
--   - user 테이블: user_id(VARCHAR PK) 제거 → user_no(BIGINT AUTO_INCREMENT PK)
--   - email이 로그인 식별자 (UNIQUE KEY)
--   - FK 컬럼명 통일: *_user_no (BIGINT → user.user_no 참조)
--   - audit 컬럼 (created_by, updated_by): VARCHAR(64) → BIGINT (user.user_no, 0=system)
--   - 비밀번호 정책: email 포함 금지로 변경
-- ============================================================

-- ------------------------------------------------------------
-- 0. 데이터베이스 생성
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS viva_meta
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_general_ci;

USE viva_meta;

-- ------------------------------------------------------------
-- 기존 테이블 삭제 (FK 의존순서 역순)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS refresh_token;
DROP TABLE IF EXISTS counseling_student;
DROP TABLE IF EXISTS counseling_info;
DROP TABLE IF EXISTS memo_info;
DROP TABLE IF EXISTS email_verification;
DROP TABLE IF EXISTS group_invitation;
DROP TABLE IF EXISTS guest_conversion_log;
DROP TABLE IF EXISTS group_member;
DROP TABLE IF EXISTS auth_school_map;
DROP TABLE IF EXISTS group_info;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS school_info;
DROP TABLE IF EXISTS role_group;

-- ============================================================
-- 1. 권한 그룹 마스터 테이블
-- ============================================================
CREATE TABLE role_group (
    role_code       VARCHAR(20)     NOT NULL    COMMENT '권한 코드 (PK)',
    role_name       VARCHAR(50)     NOT NULL    COMMENT '권한명 (한글)',
    level           INT             NOT NULL    COMMENT '권한 수준 (높을수록 상위)',
    description     VARCHAR(200)    NULL        COMMENT '설명',
    created_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '등록자 (user_no, 0=system)',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_code),
    UNIQUE KEY uk_role_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='권한 그룹 마스터';

-- 초기 데이터
INSERT INTO role_group (role_code, role_name, level, description) VALUES
    ('STUDENT',         '학생',   1,  '그룹 참가, 검사 응시'),
    ('TEACHER',         '교사',   2,  '그룹 생성, 검사 관리'),
    ('PRINCIPAL',       '교장',   3,  '학교 내 전체 그룹 조회'),
    ('SUPERINTENDENT',  '장학사', 4,  '관할 학교 전체 조회'),
    ('ADMIN',           '관리자', 99, '시스템 관리');

-- ============================================================
-- 2. 학교 마스터 테이블
-- ============================================================
CREATE TABLE school_info (
    school_code     VARCHAR(20)     NOT NULL    COMMENT '학교 고유 코드 (PK)',
    school_name     VARCHAR(200)    NOT NULL    COMMENT '학교명',
    school_level    VARCHAR(20)     NULL        COMMENT '학교급 (elementary/middle/high)',
    region          VARCHAR(100)    NULL        COMMENT '시/도',
    district        VARCHAR(100)    NULL        COMMENT '교육지원청',
    status          VARCHAR(20)     NOT NULL    DEFAULT 'ACTIVE'    COMMENT 'ACTIVE/CLOSED',
    created_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '등록자 (user_no, 0=system)',
    updated_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '수정자 (user_no, 0=system)',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (school_code),
    INDEX idx_school_name (school_name),
    INDEX idx_school_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='학교 마스터';

-- ============================================================
-- 3. 통합 회원 테이블   ★ v3 핵심 변경
-- ============================================================
-- PK      : user_no (BIGINT AUTO_INCREMENT) — 내부 식별자
-- 로그인   : email (UNIQUE) — 로그인 식별자
-- user_id : 제거 (기존 계정명 개념 폐지)
-- tc_id   : TEACHER/PRINCIPAL/SUPERINTENDENT/ADMIN 가입 시 즉시 채번 (UUID 32자리, 하이픈 제거)
-- stdt_id : STUDENT 가입 시 즉시 채번 (UUID 32자리, 하이픈 제거)
-- password: BCrypt 암호화 저장
-- 비밀번호 정책: 10~64자, 2종류 이상 문자조합, 동일문자 4연속 금지, email 포함 금지
-- ============================================================
CREATE TABLE `user` (
    user_no         BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '회원 번호 (PK)',
    email           VARCHAR(100)    NOT NULL    COMMENT '이메일 (로그인 식별자)',
    password        VARCHAR(255)    NOT NULL    COMMENT '비밀번호 (BCrypt 암호화)',
    nickname        VARCHAR(50)     NOT NULL    COMMENT '닉네임',
    gender          VARCHAR(10)     NULL        COMMENT '성별 (M/F)',
    role_code       VARCHAR(20)     NOT NULL    COMMENT '권한 코드 (FK → role_group)',
    tc_id           VARCHAR(64)     NULL        COMMENT '교사 ID (TEACHER 계열 가입 시 채번)',
    stdt_id         VARCHAR(64)     NULL        COMMENT '학생 ID (STUDENT 가입 시 채번)',
    status          VARCHAR(20)     NOT NULL    DEFAULT 'ACTIVE'    COMMENT 'ACTIVE/WITHDRAWN/SUSPENDED',
    last_login_at   DATETIME        NULL        COMMENT '마지막 로그인 일시',
    created_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '등록자 (user_no, 0=system)',
    updated_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '수정자 (user_no, 0=system)',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_no),
    UNIQUE KEY uk_user_email (email),
    UNIQUE KEY uk_user_tc_id (tc_id),
    UNIQUE KEY uk_user_stdt_id (stdt_id),
    INDEX idx_user_role (role_code),
    CONSTRAINT fk_user_role FOREIGN KEY (role_code) REFERENCES role_group (role_code) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='통합 회원';

-- ============================================================
-- 4. 그룹(방/학급) 테이블
-- ============================================================
CREATE TABLE group_info (
    group_id            BIGINT          NOT NULL    AUTO_INCREMENT,
    cla_id              VARCHAR(64)     NOT NULL    COMMENT '레거시 API용 학급 ID (UUID)',
    host_user_no        BIGINT          NOT NULL    COMMENT '방장 회원 번호 (FK → user.user_no)',
    group_nm            VARCHAR(100)    NOT NULL    COMMENT '그룹 이름',
    group_desc          VARCHAR(500)    NULL        COMMENT '그룹 설명',
    school_level        VARCHAR(20)     NOT NULL    COMMENT '학교급 (elementary/middle/high)',
    grade               VARCHAR(10)     NOT NULL    COMMENT '학년 (숫자 문자열, 예: 1~6)',
    class_number        INT             NOT NULL    COMMENT '반 번호',
    school_code         VARCHAR(20)     NULL        COMMENT '학교 코드 (FK → school_info)',
    school_name         VARCHAR(200)    NULL        COMMENT '학교명 (표시용 비정규화)',
    invite_code         VARCHAR(20)     NOT NULL    COMMENT '초대 코드 (6자리, 자동생성)',
    invite_link_token   VARCHAR(128)    NULL        COMMENT '초대 링크 토큰',
    max_member_count    INT             NOT NULL    DEFAULT 40  COMMENT '최대 멤버 수',
    use_yn              CHAR(1)         NOT NULL    DEFAULT 'Y'     COMMENT '사용 여부 (Y/N, 삭제 시 N)',
    created_by          BIGINT          NOT NULL    DEFAULT 0       COMMENT '등록자 (user_no)',
    updated_by          BIGINT          NOT NULL    DEFAULT 0       COMMENT '수정자 (user_no)',
    created_at          DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id),
    UNIQUE KEY uk_group_cla_id (cla_id),
    UNIQUE KEY uk_group_invite_code (invite_code),
    INDEX idx_group_host (host_user_no),
    INDEX idx_group_school (school_code),
    CONSTRAINT fk_group_host FOREIGN KEY (host_user_no) REFERENCES `user` (user_no) ON UPDATE CASCADE,
    CONSTRAINT fk_group_school FOREIGN KEY (school_code) REFERENCES school_info (school_code) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='그룹(방/학급)';

-- ============================================================
-- 5. 직책별 학교 접근 매핑 테이블
-- ============================================================
CREATE TABLE auth_school_map (
    id              BIGINT          NOT NULL    AUTO_INCREMENT,
    user_no         BIGINT          NOT NULL    COMMENT '사용자 번호 (FK → user.user_no)',
    school_code     VARCHAR(20)     NOT NULL    COMMENT '학교 코드 (FK → school_info)',
    granted_by      BIGINT          NULL        COMMENT '권한 부여한 관리자 (user_no)',
    status          VARCHAR(20)     NOT NULL    DEFAULT 'ACTIVE'    COMMENT 'ACTIVE/REVOKED',
    created_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '등록자 (user_no)',
    updated_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '수정자 (user_no)',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_asm_user_school (user_no, school_code),
    INDEX idx_asm_school (school_code),
    CONSTRAINT fk_asm_user FOREIGN KEY (user_no) REFERENCES `user` (user_no) ON UPDATE CASCADE,
    CONSTRAINT fk_asm_school FOREIGN KEY (school_code) REFERENCES school_info (school_code) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='직책별 학교 접근 매핑';

-- ============================================================
-- 6. 그룹 멤버 테이블
-- ============================================================
-- STUDENT: user_no NOT NULL, stdt_id = user.stdt_id 복사
-- GUEST  : user_no = NULL, stdt_id = 참가마다 새 채번
-- ============================================================
CREATE TABLE group_member (
    id              BIGINT          NOT NULL    AUTO_INCREMENT,
    group_id        BIGINT          NOT NULL    COMMENT '그룹 ID (FK → group_info)',
    user_no         BIGINT          NULL        COMMENT '회원 번호 (FK → user.user_no, 게스트는 NULL)',
    stdt_id         VARCHAR(64)     NOT NULL    COMMENT '학생 ID (레거시 API용)',
    nickname        VARCHAR(50)     NOT NULL    COMMENT '닉네임',
    gender          VARCHAR(10)     NULL        COMMENT '성별 (M/F)',
    email           VARCHAR(255)    NULL        COMMENT '게스트 이메일 (회원전환 매칭용)',
    member_type     VARCHAR(10)     NOT NULL    COMMENT 'STUDENT/GUEST',
    member_no       INT             NULL        COMMENT '순번 (출석번호)',
    status          VARCHAR(20)     NOT NULL    DEFAULT 'ACTIVE'    COMMENT 'ACTIVE/LEFT/KICKED/ARCHIVED',
    joined_at       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    left_at         DATETIME        NULL        COMMENT '탈퇴/강퇴 일시',
    created_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '등록자 (user_no)',
    updated_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '수정자 (user_no)',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_gm_stdt_id (stdt_id),
    UNIQUE KEY uk_gm_group_user (group_id, user_no),
    INDEX idx_gm_email (email),
    INDEX idx_gm_user (user_no),
    CONSTRAINT fk_gm_group FOREIGN KEY (group_id) REFERENCES group_info (group_id) ON UPDATE CASCADE,
    CONSTRAINT fk_gm_user FOREIGN KEY (user_no) REFERENCES `user` (user_no) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='그룹 멤버';

-- ============================================================
-- 7. 게스트 회원전환 이력 테이블
-- ============================================================
CREATE TABLE guest_conversion_log (
    id                      BIGINT          NOT NULL    AUTO_INCREMENT,
    member_id               BIGINT          NOT NULL    COMMENT '그룹 멤버 ID (FK → group_member)',
    guest_email             VARCHAR(255)    NOT NULL    COMMENT '게스트 이메일',
    converted_user_no       BIGINT          NOT NULL    COMMENT '전환된 회원 번호 (FK → user.user_no)',
    merge_yn                CHAR(1)         NOT NULL    DEFAULT 'N'     COMMENT '결과 합산 여부 (Y/N)',
    converted_at            DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_gcl_member (member_id),
    CONSTRAINT fk_gcl_member FOREIGN KEY (member_id) REFERENCES group_member (id) ON UPDATE CASCADE,
    CONSTRAINT fk_gcl_user FOREIGN KEY (converted_user_no) REFERENCES `user` (user_no) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='게스트 회원전환 이력';

-- ============================================================
-- 8. 그룹 이메일 초대 테이블
-- ============================================================
CREATE TABLE group_invitation (
    id              BIGINT          NOT NULL    AUTO_INCREMENT,
    group_id        BIGINT          NOT NULL    COMMENT '그룹 ID (FK → group_info)',
    email           VARCHAR(255)    NOT NULL    COMMENT '초대 대상 이메일',
    invite_code     VARCHAR(20)     NOT NULL    COMMENT '그룹 초대코드 (group_info.invite_code 복사)',
    status          VARCHAR(20)     NOT NULL    DEFAULT 'SENT'  COMMENT 'SENT/ACCEPTED/CANCELLED/EXPIRED',
    sent_by         BIGINT          NOT NULL    COMMENT '발송자 (user_no)',
    sent_at         DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME        NOT NULL    COMMENT '만료 일시 (발송 후 7일)',
    created_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '등록자 (user_no)',
    updated_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '수정자 (user_no)',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_gi_group (group_id),
    INDEX idx_gi_email (email),
    CONSTRAINT fk_gi_group FOREIGN KEY (group_id) REFERENCES group_info (group_id) ON UPDATE CASCADE,
    CONSTRAINT fk_gi_sent_by FOREIGN KEY (sent_by) REFERENCES `user` (user_no) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='그룹 이메일 초대';

-- ============================================================
-- 9. 이메일 인증코드 테이블
-- ============================================================
CREATE TABLE email_verification (
    id              BIGINT          NOT NULL    AUTO_INCREMENT,
    email           VARCHAR(255)    NOT NULL    COMMENT '이메일',
    code            VARCHAR(6)      NOT NULL    COMMENT '인증코드 (6자리)',
    verified        TINYINT(1)      NOT NULL    DEFAULT 0   COMMENT '인증완료 여부 (0=미인증, 1=인증완료)',
    expires_at      DATETIME        NOT NULL    COMMENT '만료 일시 (발송 후 5분)',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ev_email (email),
    INDEX idx_ev_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='이메일 인증코드';

-- ============================================================
-- 9. 관찰 메모 테이블
-- ============================================================
CREATE TABLE memo_info (
    id                  BIGINT          NOT NULL    AUTO_INCREMENT,
    stdt_id             VARCHAR(64)     NOT NULL    COMMENT '대상 학생 ID',
    cla_id              VARCHAR(64)     NOT NULL    COMMENT '학급 ID',
    tc_id               VARCHAR(64)     NOT NULL    COMMENT '교사 ID (user.tc_id)',
    memo_date           DATE            NOT NULL    COMMENT '관찰 날짜',
    category            VARCHAR(20)     NOT NULL    COMMENT 'behavior/academic/social/emotion/other',
    content             TEXT            NOT NULL    COMMENT '메모 내용',
    is_important        TINYINT(1)      NOT NULL    DEFAULT 0   COMMENT '중요 표시 (0=일반, 1=중요)',
    use_yn              CHAR(1)         NOT NULL    DEFAULT 'Y'     COMMENT '사용 여부 (Y/N, 삭제 시 N)',
    created_by          BIGINT          NOT NULL    DEFAULT 0       COMMENT '등록자 (user_no)',
    updated_by          BIGINT          NOT NULL    DEFAULT 0       COMMENT '수정자 (user_no)',
    created_at          DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_memo_stdt (stdt_id),
    INDEX idx_memo_cla (cla_id),
    INDEX idx_memo_tc (tc_id),
    INDEX idx_memo_date (memo_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='관찰 메모';

-- ============================================================
-- 10. 상담 정보 테이블
-- ============================================================
CREATE TABLE counseling_info (
    id              BIGINT          NOT NULL    AUTO_INCREMENT,
    cla_id          VARCHAR(64)     NOT NULL    COMMENT '학급 ID',
    tc_id           VARCHAR(64)     NOT NULL    COMMENT '교사 ID (user.tc_id)',
    scheduled_at    DATETIME        NOT NULL    COMMENT '상담 예정 일시',
    duration        INT             NULL        COMMENT '소요 시간(분), 완료 시 필수',
    types           JSON            NOT NULL    COMMENT '상담 유형 (JSON배열)',
    areas           JSON            NOT NULL    COMMENT '상담 영역 (JSON배열)',
    methods         JSON            NOT NULL    COMMENT '상담 방법 (JSON배열)',
    status          VARCHAR(20)     NOT NULL    DEFAULT 'scheduled' COMMENT 'scheduled/completed/cancelled',
    reason          TEXT            NULL        COMMENT '상담 사유',
    summary         TEXT            NULL        COMMENT '상담 내용 (완료 시 필수)',
    next_steps      TEXT            NULL        COMMENT '후속 조치',
    use_yn          CHAR(1)         NOT NULL    DEFAULT 'Y'     COMMENT '사용 여부 (Y/N, 삭제 시 N)',
    created_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '등록자 (user_no)',
    updated_by      BIGINT          NOT NULL    DEFAULT 0       COMMENT '수정자 (user_no)',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_counsel_cla (cla_id),
    INDEX idx_counsel_tc (tc_id),
    INDEX idx_counsel_status (status),
    INDEX idx_counsel_scheduled (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='상담 정보';

-- ============================================================
-- 11. 상담-학생 매핑 테이블
-- ============================================================
CREATE TABLE counseling_student (
    id              BIGINT          NOT NULL    AUTO_INCREMENT,
    counseling_id   BIGINT          NOT NULL    COMMENT '상담 ID (FK → counseling_info)',
    stdt_id         VARCHAR(64)     NOT NULL    COMMENT '학생 ID',
    stdt_name       VARCHAR(50)     NOT NULL    COMMENT '학생 이름',
    stdt_number     INT             NOT NULL    COMMENT '학생 번호 (출석번호)',
    cla_id          VARCHAR(64)     NOT NULL    COMMENT '학급 ID',
    use_yn          CHAR(1)         NOT NULL    DEFAULT 'Y'     COMMENT '사용 여부 (Y/N)',
    PRIMARY KEY (id),
    INDEX idx_cs_counseling (counseling_id),
    INDEX idx_cs_stdt (stdt_id),
    CONSTRAINT fk_cs_counseling FOREIGN KEY (counseling_id) REFERENCES counseling_info (id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='상담-학생 매핑';

-- ============================================================
-- 12. Refresh Token 관리 테이블
-- ============================================================
CREATE TABLE refresh_token (
    id              BIGINT          NOT NULL    AUTO_INCREMENT,
    user_no         BIGINT          NULL        COMMENT '회원 번호 (회원 토큰 시 사용, 게스트는 NULL)',
    stdt_id         VARCHAR(64)     NULL        COMMENT '게스트 학생 ID (게스트 토큰 시 사용)',
    token_hash      VARCHAR(128)    NOT NULL    COMMENT 'refreshToken SHA-256 해시',
    device_info     VARCHAR(200)    NULL        COMMENT '기기 정보 (User-Agent 요약)',
    ip_address      VARCHAR(45)     NULL        COMMENT '발급 시 IP',
    expires_at      DATETIME        NOT NULL    COMMENT '만료 일시',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_rt_token_hash (token_hash),
    INDEX idx_rt_user (user_no),
    INDEX idx_rt_stdt (stdt_id),
    INDEX idx_rt_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Refresh Token 관리';

-- ============================================================
-- 14. 생기부 (생활기록부) 테이블
-- ============================================================
CREATE TABLE school_record_info (
    id                  BIGINT          NOT NULL    AUTO_INCREMENT,
    stdt_id             VARCHAR(64)     NOT NULL    COMMENT '대상 학생 ID',
    cla_id              VARCHAR(64)     NOT NULL    COMMENT '학급 ID',
    tc_id               VARCHAR(64)     NOT NULL    COMMENT '교사 ID (user.tc_id)',
    category            VARCHAR(50)     NOT NULL    COMMENT 'comprehensive/learning/personality/socialSkills/selfManagement',
    content             TEXT            NOT NULL    COMMENT '생기부 내용',
    use_yn              CHAR(1)         NOT NULL    DEFAULT 'Y'     COMMENT '사용 여부 (Y/N, 삭제 시 N)',
    created_by          BIGINT          NOT NULL    DEFAULT 0       COMMENT '등록자 (user_no)',
    updated_by          BIGINT          NOT NULL    DEFAULT 0       COMMENT '수정자 (user_no)',
    created_at          DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_sr_stdt (stdt_id),
    INDEX idx_sr_cla (cla_id),
    INDEX idx_sr_tc (tc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='생기부 (생활기록부)';

-- ============================================================
-- ERD 관계 요약
-- ============================================================
-- role_group (1) ←── (N) user            : user.role_code → role_group.role_code
-- user (1) ←── (N) group_info            : group_info.host_user_no → user.user_no
-- school_info (1) ←── (N) group_info     : group_info.school_code → school_info.school_code
-- user (1) ←── (N) auth_school_map       : auth_school_map.user_no → user.user_no
-- school_info (1) ←── (N) auth_school_map: auth_school_map.school_code → school_info.school_code
-- group_info (1) ←── (N) group_member    : group_member.group_id → group_info.group_id
-- user (1) ←── (N) group_member          : group_member.user_no → user.user_no (NULL 허용)
-- group_member (1) ←── (N) guest_conversion_log : guest_conversion_log.member_id → group_member.id
-- user (1) ←── (N) guest_conversion_log  : guest_conversion_log.converted_user_no → user.user_no
-- counseling_info (1) ←── (N) counseling_student : counseling_student.counseling_id → counseling_info.id
-- user (1) ←── (N) refresh_token         : refresh_token.user_no → user.user_no (CASCADE DELETE)
-- school_record_info                     : stdt_id, cla_id, tc_id 기반 (FK 없음, 논리적 참조)
-- ============================================================
