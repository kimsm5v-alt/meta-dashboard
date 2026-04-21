-- ============================================================
-- superplatform-meta Database DDL (v4) — SSO 통합 인증 전환
-- 학습심리정서검사 플랫폼 회원 DB
-- ============================================================
-- 설계 방식: Auth 서버(슈퍼플랫폼) SSO 인증 + 학심정 서비스 데이터 분리
-- 변경 사유: 슈퍼플랫폼 통합 인증 전환, ISMS 대응
-- 인증 주체: 슈퍼플랫폼 Auth 서버 (OAuth2 + PKCE, RS256 JWT)
-- 학심정 DB: 서비스 데이터 + 개인정보 동기화 사본 (Auth JWT에서)
-- ============================================================
-- v3 → v4 변경 요약:
--   - user 테이블: +sp_user_id, -password
--   - admin_account 테이블 신규 (Admin 전용, 자체 세션 인증)
--   - email_verification 테이블 DROP (Auth 서버가 처리)
--   - refresh_token 테이블 DROP (Auth 서버가 관리)
--   - 나머지 테이블 변경 없음
-- ============================================================
-- 테이블 목록 (13개):
--   1.  role_group          — 권한 그룹 마스터
--   2.  school_info         — 학교 마스터
--   3.  user                — 통합 회원 (★ v4: -password, +sp_user_id)
--   4.  admin_account       — ★ 신규: 관리자 계정 (자체 세션 인증)
--   5.  group_info          — 그룹(방/학급)
--   6.  auth_school_map     — 직책별 학교 접근 매핑
--   7.  group_member        — 그룹 멤버
--   8.  guest_conversion_log — 게스트 회원전환 이력
--   9.  group_invitation    — 그룹 이메일 초대
--  10.  memo_info           — 관찰 메모
--  11.  counseling_info     — 상담 정보
--  12.  counseling_student  — 상담-학생 매핑
--  13.  school_record_info  — 생기부 (생활기록부)
-- ============================================================
-- 삭제된 테이블 (v3 대비):
--   - refresh_token        — Auth 서버가 토큰 관리
-- 유지된 테이블 (v3에서 유지):
--   - email_verification   — 게스트 이메일 인증용으로 유지
-- ============================================================

-- ------------------------------------------------------------
-- 0. 데이터베이스 생성
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS superplatform_meta
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_general_ci;

USE superplatform_meta;

-- ------------------------------------------------------------
-- 기존 테이블 삭제 (FK 의존순서 역순)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS counseling_student;
DROP TABLE IF EXISTS counseling_info;
DROP TABLE IF EXISTS memo_info;
DROP TABLE IF EXISTS group_invitation;
DROP TABLE IF EXISTS guest_conversion_log;
DROP TABLE IF EXISTS group_member;
DROP TABLE IF EXISTS auth_school_map;
DROP TABLE IF EXISTS group_info;
DROP TABLE IF EXISTS admin_account;
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
-- 3. 통합 회원 테이블   ★ v4 SSO 전환
-- ============================================================
-- PK       : user_no (BIGINT AUTO_INCREMENT) — 내부 식별자
-- SSO 연결 : sp_user_id (Auth 서버 publicUserId, UUID)
-- 인증     : Auth 서버 SSO (password 컬럼 없음)
-- 개인정보 : Auth JWT에서 동기화 (email, nickname, gender)
-- tc_id    : TEACHER/PRINCIPAL/SUPERINTENDENT/ADMIN 가입 시 즉시 채번
-- stdt_id  : STUDENT 가입 시 즉시 채번
-- ============================================================
CREATE TABLE `user` (
    user_no         BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT '회원 번호 (PK)',
    sp_user_id      VARCHAR(64)     NULL        COMMENT '슈퍼플랫폼 publicUserId (UUID)',
    email           VARCHAR(100)    NOT NULL    COMMENT '이메일 (Auth JWT에서 동기화)',
    nickname        VARCHAR(50)     NOT NULL    COMMENT '닉네임 (Auth JWT name에서 동기화)',
    gender          VARCHAR(10)     NULL        COMMENT '성별 (M/F, 최초 로그인 시 추가 입력)',
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
    UNIQUE KEY uk_user_sp_user_id (sp_user_id),
    UNIQUE KEY uk_user_email (email),
    UNIQUE KEY uk_user_tc_id (tc_id),
    UNIQUE KEY uk_user_stdt_id (stdt_id),
    INDEX idx_user_role (role_code),
    CONSTRAINT fk_user_role FOREIGN KEY (role_code) REFERENCES role_group (role_code) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='통합 회원 (v4: SSO 인증, password 제거)';

-- ============================================================
-- 4. 관리자 계정 테이블   ★ v4 신규
-- ============================================================
-- Admin 전용 계정 (SSO 미적용, 자체 세션 인증)
-- user 테이블과 분리하여 ISMS 감사 범위 명확화
-- ============================================================
CREATE TABLE admin_account (
    id              BIGINT          NOT NULL    AUTO_INCREMENT  COMMENT 'Admin ID (PK)',
    email           VARCHAR(100)    NOT NULL    COMMENT '로그인 이메일',
    password        VARCHAR(255)    NOT NULL    COMMENT '비밀번호 (BCrypt)',
    nickname        VARCHAR(50)     NOT NULL    COMMENT '관리자 이름',
    status          VARCHAR(20)     NOT NULL    DEFAULT 'ACTIVE'    COMMENT 'ACTIVE/SUSPENDED',
    last_login_at   DATETIME        NULL        COMMENT '마지막 로그인',
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='관리자 계정 (SSO 미적용, 자체 세션 인증)';

-- 관리자 초기 계정
-- email: admin@visang.com / password: qwer1234!@#$
INSERT INTO admin_account (email, password, nickname, status, created_at, updated_at)
VALUES (
    'admin@visang.com',
    '$2a$10$3NlyJxHL1g1KeCdm8JlX7OIaqxDF3nhU1Ttd687cItwYB9Oj4KKY2',
    '관리자',
    'ACTIVE',
    NOW(), NOW()
);

-- ============================================================
-- 5. 이메일 인증코드 테이블 (게스트용 유지)
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
  COMMENT='이메일 인증코드 (게스트 이메일 인증용)';

-- ============================================================
-- 6. 그룹(방/학급) 테이블
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
-- 6. 직책별 학교 접근 매핑 테이블
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
-- 7. 그룹 멤버 테이블
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
-- 8. 게스트 회원전환 이력 테이블
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
-- 9. 그룹 이메일 초대 테이블
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
-- 10. 관찰 메모 테이블
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
-- 11. 상담 정보 테이블
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
-- 12. 상담-학생 매핑 테이블
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
-- 13. 생기부 (생활기록부) 테이블
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
-- 14. 진단검사 마스터 테이블 (DGNSS)
-- ============================================================
CREATE TABLE `tb_dgnss_info` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '진단검사 ID',
  `cla_id` varchar(32) NOT NULL COMMENT '학급ID',
  `paper_idx` char(1) DEFAULT '2' COMMENT '진단 종류(1: 종합검사, 2: 자기조절학습검사)',
  `tc_id` varchar(255) NOT NULL,
  `ord_no` int NOT NULL COMMENT '진단 회차',
  `dgnss_at` char(1) NOT NULL DEFAULT 'Y' COMMENT '진단 상태(Y: 진단중, N: 진단종료)',
  `dgnss_st_dt` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '진단시작일시',
  `dgnss_ed_dt` datetime DEFAULT NULL COMMENT '진단종료일시',
  `file_url` varchar(200) DEFAULT NULL,
  `rgtr` varchar(255) NOT NULL DEFAULT 'system',
  `reg_dt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  `mdfr` varchar(255) NOT NULL DEFAULT 'system',
  `mdfy_dt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정일시',
  `dgnss_text` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tb_dgnss_info` (`cla_id`,`paper_idx`,`ord_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='META자기조절학습 마스터';

-- ============================================================
-- 15. 진단검사 결과 상세 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_result_info` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '진단검사 상세 ID',
  `dgnss_id` int NOT NULL COMMENT '진단검사 ID',
  `omr_id` int DEFAULT NULL,
  `stdt_id` varchar(255) NOT NULL,
  `eak_stts_cd` int NOT NULL DEFAULT '1' COMMENT '응시상태 1:응시전, 2:응시중, 3:제출완료, 4:채점중, 5:채점완료',
  `eak_at` char(1) NOT NULL DEFAULT 'N' COMMENT '응시여부',
  `subm_at` char(1) NOT NULL DEFAULT 'N' COMMENT '제출여부',
  `subm_dt` datetime DEFAULT NULL COMMENT '제출일자',
  `eak_st_dt` datetime DEFAULT NULL COMMENT '응시시작일시',
  `eak_ed_dt` datetime DEFAULT NULL COMMENT '응시종료일시',
  `file_url` varchar(200) DEFAULT NULL,
  `summary_file_url` varchar(200) DEFAULT NULL,
  `rgtr` varchar(255) NOT NULL DEFAULT 'system',
  `reg_dt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  `mdfr` varchar(255) NOT NULL DEFAULT 'system',
  `mdfy_dt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (`id`),
  KEY `idx_dgnss_result_dgnss_id` (`dgnss_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='META자기조절학습 상세';

-- ============================================================
-- 16. OMR 기록지 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_omr` (
  `OMR_IDX` int NOT NULL AUTO_INCREMENT,
  `MEM_ID` varchar(255) DEFAULT NULL,
  `CLASS_NO` varchar(32) DEFAULT NULL,
  `RSPNS_DT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `PAPER_IDX` int DEFAULT '6',
  `1` varchar(1) DEFAULT NULL, `2` varchar(1) DEFAULT NULL, `3` varchar(1) DEFAULT NULL, `4` varchar(1) DEFAULT NULL, `5` varchar(1) DEFAULT NULL,
  `6` varchar(1) DEFAULT NULL, `7` varchar(1) DEFAULT NULL, `8` varchar(1) DEFAULT NULL, `9` varchar(1) DEFAULT NULL, `10` varchar(1) DEFAULT NULL,
  `11` varchar(1) DEFAULT NULL, `12` varchar(1) DEFAULT NULL, `13` varchar(1) DEFAULT NULL, `14` varchar(1) DEFAULT NULL, `15` varchar(1) DEFAULT NULL,
  `16` varchar(10) DEFAULT NULL, `17` varchar(10) DEFAULT NULL, `18` varchar(10) DEFAULT NULL, `19` varchar(10) DEFAULT NULL, `20` varchar(10) DEFAULT NULL,
  `21` varchar(10) DEFAULT NULL, `22` varchar(10) DEFAULT NULL, `23` varchar(10) DEFAULT NULL, `24` varchar(10) DEFAULT NULL, `25` varchar(10) DEFAULT NULL,
  `26` varchar(10) DEFAULT NULL, `27` varchar(10) DEFAULT NULL, `28` varchar(10) DEFAULT NULL, `29` varchar(10) DEFAULT NULL, `30` varchar(10) DEFAULT NULL,
  `31` varchar(10) DEFAULT NULL, `32` varchar(10) DEFAULT NULL, `33` varchar(10) DEFAULT NULL, `34` varchar(10) DEFAULT NULL, `35` varchar(10) DEFAULT NULL,
  `36` varchar(10) DEFAULT NULL, `37` varchar(10) DEFAULT NULL, `38` varchar(10) DEFAULT NULL, `39` varchar(10) DEFAULT NULL, `40` varchar(10) DEFAULT NULL,
  `41` varchar(10) DEFAULT NULL, `42` varchar(10) DEFAULT NULL, `43` varchar(10) DEFAULT NULL, `44` varchar(10) DEFAULT NULL, `45` varchar(10) DEFAULT NULL,
  `46` varchar(10) DEFAULT NULL, `47` varchar(10) DEFAULT NULL, `48` varchar(10) DEFAULT NULL, `49` varchar(10) DEFAULT NULL, `50` varchar(10) DEFAULT NULL,
  `51` varchar(10) DEFAULT NULL, `52` varchar(10) DEFAULT NULL, `53` varchar(10) DEFAULT NULL, `54` varchar(10) DEFAULT NULL, `55` varchar(10) DEFAULT NULL,
  `56` varchar(10) DEFAULT NULL, `57` varchar(10) DEFAULT NULL, `58` varchar(10) DEFAULT NULL, `59` varchar(10) DEFAULT NULL, `60` varchar(10) DEFAULT NULL,
  `61` varchar(10) DEFAULT NULL, `62` varchar(10) DEFAULT NULL, `63` varchar(10) DEFAULT NULL, `64` varchar(10) DEFAULT NULL, `65` varchar(10) DEFAULT NULL,
  `66` varchar(10) DEFAULT NULL, `67` varchar(10) DEFAULT NULL, `68` varchar(10) DEFAULT NULL, `69` varchar(10) DEFAULT NULL, `70` varchar(10) DEFAULT NULL,
  `71` varchar(10) DEFAULT NULL, `72` varchar(10) DEFAULT NULL, `73` varchar(10) DEFAULT NULL, `74` varchar(10) DEFAULT NULL, `75` varchar(10) DEFAULT NULL,
  `76` varchar(10) DEFAULT NULL, `77` varchar(10) DEFAULT NULL, `78` varchar(10) DEFAULT NULL, `79` varchar(10) DEFAULT NULL, `80` varchar(10) DEFAULT NULL,
  `81` varchar(10) DEFAULT NULL, `82` varchar(10) DEFAULT NULL, `83` varchar(10) DEFAULT NULL, `84` varchar(10) DEFAULT NULL, `85` varchar(10) DEFAULT NULL,
  `86` varchar(10) DEFAULT NULL, `87` varchar(10) DEFAULT NULL, `88` varchar(10) DEFAULT NULL, `89` varchar(10) DEFAULT NULL, `90` varchar(10) DEFAULT NULL,
  `91` varchar(10) DEFAULT NULL, `92` varchar(10) DEFAULT NULL, `93` varchar(10) DEFAULT NULL, `94` varchar(10) DEFAULT NULL, `95` varchar(10) DEFAULT NULL,
  `96` varchar(10) DEFAULT NULL, `97` varchar(10) DEFAULT NULL, `98` varchar(10) DEFAULT NULL, `99` varchar(10) DEFAULT NULL, `100` varchar(10) DEFAULT NULL,
  `101` varchar(10) DEFAULT NULL, `102` varchar(10) DEFAULT NULL, `103` varchar(10) DEFAULT NULL, `104` varchar(10) DEFAULT NULL, `105` varchar(10) DEFAULT NULL,
  `106` varchar(10) DEFAULT NULL, `107` varchar(10) DEFAULT NULL, `108` varchar(10) DEFAULT NULL, `109` varchar(10) DEFAULT NULL, `110` varchar(10) DEFAULT NULL,
  `111` varchar(10) DEFAULT NULL, `112` varchar(10) DEFAULT NULL, `113` varchar(10) DEFAULT NULL, `114` varchar(10) DEFAULT NULL, `115` varchar(10) DEFAULT NULL,
  `116` varchar(10) DEFAULT NULL, `117` varchar(10) DEFAULT NULL, `118` varchar(10) DEFAULT NULL, `119` varchar(10) DEFAULT NULL, `120` varchar(10) DEFAULT NULL,
  `121` varchar(10) DEFAULT NULL, `122` varchar(10) DEFAULT NULL, `123` varchar(10) DEFAULT NULL, `124` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`OMR_IDX`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='OMR 기록지';

-- ============================================================
-- 17. 진단 응답지 마스터 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_answer` (
  `ANSWER_IDX` int NOT NULL AUTO_INCREMENT COMMENT '진단 답안지 인덱스',
  `MEM_ID` varchar(255) DEFAULT NULL,
  `TEST_IDX` int DEFAULT NULL COMMENT '시험인덱스',
  `DGNSS_RESULT_ID` int DEFAULT NULL COMMENT '진단 상세 아이디',
  `DGNSS_ID` varchar(20) DEFAULT 'DGNSS_20',
  `DGNSS_ORD` int NOT NULL DEFAULT '1' COMMENT '회원, 진단명별 회차',
  `PAPER_IDX` int DEFAULT '6' COMMENT '진단시험지아이디',
  `SCH_GRADE` varchar(20) DEFAULT NULL,
  `DGNSS_ASIGN_MEM_IDX` int DEFAULT NULL,
  `DGNSS_CNTNTS_CD` varchar(20) DEFAULT NULL,
  `MEM_IDX` int DEFAULT NULL,
  `GRP_IDX` int DEFAULT NULL,
  `ASIGN_DT` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '배정일',
  `RSPNS_DT` datetime DEFAULT NULL COMMENT '응답일시',
  `SUBMIT_YN` varchar(1) DEFAULT NULL,
  `ANSWERS` json DEFAULT NULL COMMENT '응답지',
  `LS_ANS01` varchar(1) DEFAULT NULL, `LS_ANS02` varchar(1) DEFAULT NULL,
  `LS_ANS03` varchar(1) DEFAULT NULL, `LS_ANS04` varchar(1) DEFAULT NULL,
  `LS_ANS05` varchar(1) DEFAULT NULL,
  `REPEATED_RESPONSE_YN` char(1) DEFAULT 'N' COMMENT '연속 동일 반응 여부',
  `TOTAL_NO` int DEFAULT NULL COMMENT '문항수',
  `NO_ANS_CNT` int DEFAULT '0' COMMENT '무응답수',
  `SCORE` int DEFAULT NULL COMMENT '총점',
  `M_VALUE` decimal(5,2) DEFAULT NULL COMMENT '평균',
  `COCH_DGNSS_QESITM01_SCORE` decimal(5,1) DEFAULT NULL,
  `COCH_DGNSS_QESITM01_MARK` varchar(10) DEFAULT NULL,
  `COCH_DGNSS_QESITM02_SCORE` decimal(5,1) DEFAULT NULL,
  `COCH_DGNSS_QESITM02_MARK` varchar(10) DEFAULT NULL,
  `COCH_DGNSS_QESITM03_SCORE` decimal(5,2) DEFAULT NULL,
  `COCH_DGNSS_QESITM03_MARK` varchar(10) DEFAULT NULL,
  `COCH_DGNSS_QESITM04_SCORE` decimal(5,2) DEFAULT NULL,
  `COCH_DGNSS_QESITM04_MARK` varchar(10) DEFAULT NULL,
  `PDF_YN` varchar(1) DEFAULT NULL,
  `REGIST_DT` datetime DEFAULT NULL, `RGSTR_ID` varchar(20) DEFAULT NULL,
  `RGSTR_IP` varchar(50) DEFAULT NULL, `REGIST_MODULE_ID` varchar(50) DEFAULT NULL,
  `UPDT_DT` datetime DEFAULT NULL, `UPDUSR_ID` varchar(20) DEFAULT NULL,
  `UPDUSR_IP` varchar(50) DEFAULT NULL, `UPDT_MODULE_ID` varchar(50) DEFAULT NULL,
  `LPA_TYPE` char(1) DEFAULT NULL,
  PRIMARY KEY (`ANSWER_IDX`),
  KEY `idx_dgnss_answer_result_id` (`DGNSS_RESULT_ID`),
  KEY `idx_dgnss_answer_test_idx` (`TEST_IDX`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단응답지 마스터';

-- ============================================================
-- 18. 진단 응답 유형별 통계 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_answer_report` (
  `ANSWER_REPORT_IDX` int NOT NULL AUTO_INCREMENT COMMENT '진단 결과 보고서 인덱스',
  `ANSWER_IDX` int DEFAULT NULL COMMENT '진단 답안지 인덱스',
  `SECTION_ID` varchar(20) DEFAULT NULL,
  `DEPTH` int DEFAULT NULL COMMENT '유형 뎁스',
  `M_VALUE` decimal(3,2) DEFAULT NULL COMMENT '평균결과점수',
  `T_SCORE` decimal(3,1) DEFAULT NULL COMMENT 'T점수',
  `T_RANK` varchar(20) DEFAULT NULL,
  `T_SCRIPT` varchar(1000) DEFAULT NULL,
  `P_RANK` decimal(5,2) DEFAULT NULL COMMENT '백분위등수',
  `RANK_TOTAL` int DEFAULT NULL COMMENT '종합순위',
  `REGIST_DT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
  PRIMARY KEY (`ANSWER_REPORT_IDX`),
  UNIQUE KEY `ANSWER_IDX_DGNSS_SECTION_ID` (`ANSWER_IDX`,`SECTION_ID`),
  KEY `ix_report_answer_section_score` (`ANSWER_IDX`,`SECTION_ID`,`T_SCORE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단 응답 유형별 통계';

-- ============================================================
-- 19. LPA 유형 분류 결과 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_lpa_result` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'PK',
  `answer_idx` int NOT NULL COMMENT 'tb_dgnss_answer.ANSWER_IDX',
  `dgnss_result_id` int NOT NULL COMMENT 'tb_dgnss_result_info.id',
  `test_idx` int NOT NULL COMMENT 'tb_dgnss_info.id',
  `mem_id` varchar(255) NOT NULL COMMENT '학생 ID',
  `school_level` varchar(20) NOT NULL COMMENT 'elementary, middle, high',
  `class_id` varchar(20) NOT NULL COMMENT 'Class1 ~ Class6',
  `type_name` varchar(100) NOT NULL COMMENT 'LPA 유형명',
  `confidence` decimal(5,2) NOT NULL COMMENT '예측 확률(%)',
  `model_version` varchar(50) NOT NULL COMMENT '모델 버전',
  `profile_version` varchar(50) NOT NULL COMMENT '프로파일 데이터 버전',
  `input_scores_json` json NOT NULL COMMENT '입력 38개 T점수 snapshot',
  `probabilities_json` json DEFAULT NULL COMMENT '유형별 확률 분포',
  `status` varchar(20) NOT NULL DEFAULT 'COMPLETED' COMMENT 'COMPLETED, UNSUPPORTED, FAILED',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_answer_idx` (`answer_idx`),
  KEY `idx_mem_id` (`mem_id`),
  KEY `idx_test_idx` (`test_idx`),
  KEY `idx_dgnss_result_id` (`dgnss_result_id`),
  CONSTRAINT `fk_dgnss_lpa_result_answer_idx` FOREIGN KEY (`answer_idx`) REFERENCES `tb_dgnss_answer` (`ANSWER_IDX`),
  CONSTRAINT `fk_dgnss_lpa_result_result_id` FOREIGN KEY (`dgnss_result_id`) REFERENCES `tb_dgnss_result_info` (`id`),
  CONSTRAINT `fk_dgnss_lpa_result_test_idx` FOREIGN KEY (`test_idx`) REFERENCES `tb_dgnss_info` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='DGNSS LPA 유형 분류 결과';

-- ============================================================
-- 20. 진단평가 문제지 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_paper` (
  `PAPER_IDX` int NOT NULL AUTO_INCREMENT COMMENT '진단 문제지인덱스',
  `PAPER_NM` varchar(50) DEFAULT NULL,
  `DGNSS_ID` varchar(50) DEFAULT NULL,
  `PAPER_DC` varchar(50) DEFAULT NULL,
  `REGIST_DT` datetime DEFAULT NULL, `RGSTR_ID` varchar(20) DEFAULT NULL,
  `RGSTR_IP` varchar(20) DEFAULT NULL, `REGIST_MODULE_ID` varchar(100) DEFAULT NULL,
  `UPDT_DT` datetime DEFAULT NULL, `UPDUSR_ID` varchar(20) DEFAULT NULL,
  `UPDUSR_IP` varchar(20) DEFAULT NULL, `UPDT_MODULE_ID` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`PAPER_IDX`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단평가 문제지';

-- ============================================================
-- 21. 진단평가 문제지 문항 정보 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_paper_detail` (
  `PAPER_IDX` int NOT NULL COMMENT '시험지인덱스',
  `NO` int NOT NULL COMMENT '문항번호',
  `PROBLEM_IDX` int DEFAULT NULL COMMENT '진단 문항인덱스',
  `SPARE_YN` varchar(1) DEFAULT NULL,
  `REGIST_DT` datetime DEFAULT NULL, `RGSTR_ID` varchar(20) DEFAULT NULL,
  `RGSTR_IP` varchar(20) DEFAULT NULL, `REGIST_MODULE_ID` varchar(100) DEFAULT NULL,
  `UPDT_DT` datetime DEFAULT NULL, `UPDUSR_ID` varchar(20) DEFAULT NULL,
  `UPDUSR_IP` varchar(20) DEFAULT NULL, `UPDT_MODULE_ID` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`PAPER_IDX`,`NO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단평가 문제지 문항 정보';

-- ============================================================
-- 22. 진단평가 문항 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_problem` (
  `PROBLEM_IDX` int NOT NULL COMMENT '진단 문항인덱스',
  `SECTION_ID` varchar(20) DEFAULT NULL,
  `DGNSS_CNTNTS_CD` varchar(20) DEFAULT NULL,
  `DGNSS_TY_CD` varchar(20) DEFAULT NULL,
  `QESITM_TY_CD` varchar(20) DEFAULT NULL,
  `QESITM_TY_DETL_CD` varchar(20) DEFAULT NULL,
  `QESITM_TY_SEQ` int NOT NULL COMMENT '문항 유형 순번',
  `QESITM_NM` varchar(1000) DEFAULT NULL,
  `INSTC_QESITM_YN` varchar(1) DEFAULT NULL,
  `COCH_DGNSS_QESITM` varchar(20) DEFAULT NULL,
  `ROOT_PROBLEM_IDX` int DEFAULT NULL COMMENT '동일 문항일 경우 원문항인덱스',
  `TOTAL_COUNT` int DEFAULT NULL, `TOTAL_SCORE` int DEFAULT NULL,
  `M_VALUE` decimal(20,6) DEFAULT NULL, `SD_VALUE` decimal(20,6) DEFAULT NULL,
  `TOTAL_COUNT_E` int DEFAULT NULL, `TOTAL_SCORE_E` int DEFAULT NULL,
  `M_VALUE_E` decimal(20,6) DEFAULT NULL, `SD_VALUE_E` decimal(20,6) DEFAULT NULL,
  `TOTAL_COUNT_M` int DEFAULT NULL, `TOTAL_SCORE_M` int DEFAULT NULL,
  `M_VALUE_M` decimal(20,6) DEFAULT NULL, `SD_VALUE_M` decimal(20,6) DEFAULT NULL,
  `TOTAL_COUNT_H` int DEFAULT NULL, `TOTAL_SCORE_H` int DEFAULT NULL,
  `M_VALUE_H` decimal(20,6) DEFAULT NULL, `SD_VALUE_H` decimal(20,6) DEFAULT NULL,
  `REGIST_DT` datetime DEFAULT NULL, `RGSTR_ID` varchar(20) DEFAULT NULL,
  `RGSTR_IP` varchar(20) DEFAULT NULL, `REGIST_MODULE_ID` varchar(100) DEFAULT NULL,
  `UPDT_DT` datetime DEFAULT NULL, `UPDUSR_ID` varchar(20) DEFAULT NULL,
  `UPDUSR_IP` varchar(20) DEFAULT NULL, `UPDT_MODULE_ID` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`PROBLEM_IDX`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단평가 문항';

-- ============================================================
-- 23. 진단평가 분류표 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_section` (
  `SECTION_ID` varchar(20) NOT NULL,
  `SECTION_ID_NEW` varchar(20) DEFAULT NULL,
  `CLASS1` varchar(2) DEFAULT NULL, `CLASS2` varchar(2) DEFAULT NULL,
  `CLASS3` varchar(2) DEFAULT NULL, `CLASS4` varchar(2) DEFAULT NULL,
  `CLASS5` varchar(2) DEFAULT NULL, `CLASS6` varchar(2) DEFAULT NULL,
  `DEPTH` int DEFAULT NULL COMMENT '뎁스',
  `SECTION_NM` varchar(50) DEFAULT NULL,
  `SECTION_NM_FULL` varchar(100) DEFAULT NULL,
  `OP_DEFINITION` varchar(100) DEFAULT NULL,
  `HABIT` varchar(100) DEFAULT NULL,
  `FACTOR` varchar(10) DEFAULT NULL,
  `STUDY` varchar(10) DEFAULT NULL,
  `USE_YN` varchar(1) DEFAULT NULL,
  `DGNSS_TY_CD` varchar(20) DEFAULT NULL,
  `QESITM_TY_CD` varchar(20) DEFAULT NULL,
  `QESITM_TY_DETL_CD` varchar(20) DEFAULT NULL,
  `M_VALUE` float DEFAULT NULL, `SD_VALUE` float DEFAULT NULL,
  `M_VALUE_E` float DEFAULT NULL, `SD_VALUE_E` float DEFAULT NULL,
  `M_VALUE_M` float DEFAULT NULL, `SD_VALUE_M` float DEFAULT NULL,
  `M_VALUE_H` float DEFAULT NULL, `SD_VALUE_H` float DEFAULT NULL,
  `M_VALUE_REAL` float DEFAULT NULL, `SD_VALUE_REAL` float DEFAULT NULL,
  `M_VALUE_E_REAL` float DEFAULT NULL, `SD_VALUE_E_REAL` float DEFAULT NULL,
  `M_VALUE_M_REAL` float DEFAULT NULL, `SD_VALUE_M_REAL` float DEFAULT NULL,
  `M_VALUE_H_REAL` float DEFAULT NULL, `SD_VALUE_H_REAL` float DEFAULT NULL,
  `PRIORITY` int DEFAULT NULL COMMENT '순위 우선순위',
  `REGIST_DT` datetime DEFAULT NULL, `RGSTR_ID` varchar(20) DEFAULT NULL,
  `RGSTR_IP` varchar(50) DEFAULT NULL, `REGIST_MODULE_ID` varchar(50) DEFAULT NULL,
  `UPDT_DT` datetime DEFAULT NULL, `UPDUSR_ID` varchar(20) DEFAULT NULL,
  `UPDUSR_IP` varchar(50) DEFAULT NULL, `UPDT_MODULE_ID` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`SECTION_ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단평가 분류표';

-- ============================================================
-- 24. 진단평가 스크립트 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_script` (
  `SCRIPT_IDX` int NOT NULL AUTO_INCREMENT COMMENT '진단스크립트인덱스',
  `SECTION_ID` varchar(20) DEFAULT NULL,
  `SECTION_DEPTH` int DEFAULT NULL COMMENT '유형 뎁스(3:대분류 4:중분류 5:변인명)',
  `DGNSS_TY_CD` varchar(20) DEFAULT NULL,
  `QESITM_TY_CD` varchar(20) DEFAULT NULL,
  `QESITM_TY_DETL_CD` varchar(20) DEFAULT NULL,
  `T_LWLT` int DEFAULT NULL COMMENT 'T하한값',
  `T_UPLMT` int DEFAULT NULL COMMENT 'T상한값',
  `T_RANK` varchar(20) DEFAULT NULL,
  `T_SCRIPT` varchar(1000) DEFAULT NULL,
  `REGIST_DT` datetime DEFAULT NULL, `RGSTR_ID` varchar(20) DEFAULT NULL,
  `RGSTR_IP` varchar(50) DEFAULT NULL, `REGIST_MODULE_ID` varchar(50) DEFAULT NULL,
  `UPDT_DT` datetime DEFAULT NULL, `UPDUSR_ID` varchar(20) DEFAULT NULL,
  `UPDUSR_IP` varchar(50) DEFAULT NULL, `UPDT_MODULE_ID` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`SCRIPT_IDX`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단평가 유형별 스크립트(T점수 기준)';

-- ============================================================
-- 25. 표준정규분포표 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_snt` (
  `Z_SCORE` decimal(3,2) NOT NULL COMMENT 'Z 점수',
  `T_SCORE` decimal(3,1) DEFAULT NULL COMMENT 'T 점수',
  `P_VALUE` decimal(6,5) DEFAULT NULL COMMENT '낮은 점수 확률값',
  `P_RANK` decimal(5,3) DEFAULT NULL COMMENT '백분위등수',
  PRIMARY KEY (`Z_SCORE`),
  UNIQUE KEY `IX_DGNSS_SNT_T_SCORE` (`T_SCORE`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단평가 표준정규분포표';

-- ============================================================
-- 26. 진단평가 통계 자료 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_stats` (
  `DGNSS_STATS_IDX` int NOT NULL AUTO_INCREMENT COMMENT '진단평가 통계 인덱스',
  `SECTION_ID` varchar(20) DEFAULT NULL,
  `DGNSS_TY_CD` varchar(20) DEFAULT NULL,
  `QESITM_TY_CD` varchar(20) DEFAULT NULL,
  `QESITM_TY_DETL_CD` varchar(20) DEFAULT NULL,
  `QESITM_TY_DETL_STDR` varchar(200) DEFAULT NULL,
  `M_VALUE` float DEFAULT NULL, `SD_VALUE` float DEFAULT NULL,
  `M_VALUE_E` float DEFAULT NULL, `SD_VALUE_E` float DEFAULT NULL,
  `M_VALUE_M` float DEFAULT NULL, `SD_VALUE_M` float DEFAULT NULL,
  `M_VALUE_H` float DEFAULT NULL, `SD_VALUE_H` float DEFAULT NULL,
  `M_VALUE_REAL` float DEFAULT NULL, `SD_VALUE_REAL` float DEFAULT NULL,
  `M_VALUE_E_REAL` float DEFAULT NULL, `SD_VALUE_E_REAL` float DEFAULT NULL,
  `M_VALUE_M_REAL` float DEFAULT NULL, `SD_VALUE_M_REAL` float DEFAULT NULL,
  `M_VALUE_H_REAL` float DEFAULT NULL, `SD_VALUE_H_REAL` float DEFAULT NULL,
  `REGIST_DT` datetime DEFAULT NULL, `RGSTR_ID` varchar(20) DEFAULT NULL,
  `RGSTR_IP` varchar(50) DEFAULT NULL, `REGIST_MODULE_ID` varchar(50) DEFAULT NULL,
  `UPDT_DT` datetime DEFAULT NULL, `UPDUSR_ID` varchar(20) DEFAULT NULL,
  `UPDUSR_IP` varchar(50) DEFAULT NULL, `UPDT_MODULE_ID` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`DGNSS_STATS_IDX`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단평가 통계 자료';

-- ============================================================
-- 27. 진단평가 통계 자료 (관리용) 테이블
-- ============================================================
CREATE TABLE `tb_dgnss_stats_coch` (
  `DGNSS_STATS_COCH_IDX` int NOT NULL AUTO_INCREMENT COMMENT '진단평가 통계 인덱스',
  `DGNSS_ID` varchar(20) DEFAULT NULL,
  `COCH_DGNSS_QESITM` varchar(20) DEFAULT NULL,
  `PAPER_IDX` int DEFAULT NULL,
  `M_VALUE` float DEFAULT NULL, `SD_VALUE` float DEFAULT NULL,
  `M_VALUE_E` float DEFAULT NULL, `SD_VALUE_E` float DEFAULT NULL,
  `M_VALUE_M` float DEFAULT NULL, `SD_VALUE_M` float DEFAULT NULL,
  `M_VALUE_H` float DEFAULT NULL, `SD_VALUE_H` float DEFAULT NULL,
  `M_VALUE_REAL` float DEFAULT NULL, `SD_VALUE_REAL` float DEFAULT NULL,
  `M_VALUE_E_REAL` float DEFAULT NULL, `SD_VALUE_E_REAL` float DEFAULT NULL,
  `M_VALUE_M_REAL` float DEFAULT NULL, `SD_VALUE_M_REAL` float DEFAULT NULL,
  `M_VALUE_H_REAL` float DEFAULT NULL, `SD_VALUE_H_REAL` float DEFAULT NULL,
  `REGIST_DT` datetime DEFAULT NULL, `RGSTR_ID` varchar(20) DEFAULT NULL,
  `RGSTR_IP` varchar(50) DEFAULT NULL, `REGIST_MODULE_ID` varchar(50) DEFAULT NULL,
  `UPDT_DT` datetime DEFAULT NULL, `UPDUSR_ID` varchar(20) DEFAULT NULL,
  `UPDUSR_IP` varchar(50) DEFAULT NULL, `UPDT_MODULE_ID` varchar(50) DEFAULT NULL,
  `NO` int DEFAULT NULL,
  PRIMARY KEY (`DGNSS_STATS_COCH_IDX`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단평가 통계 자료(관리용)';

-- ============================================================
-- 28. 파일 정보 테이블
-- ============================================================
CREATE TABLE `file` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'idx',
  `file_name` varchar(255) NOT NULL COMMENT '원본 파일명',
  `save_file_name` varchar(255) NOT NULL COMMENT '저장된 파일명',
  `file_path` varchar(255) NOT NULL COMMENT '파일 저장 경로',
  `file_extension` varchar(10) DEFAULT NULL COMMENT '파일 확장자',
  `file_size` bigint NOT NULL COMMENT '파일 크기',
  `rgtr` varchar(255) NOT NULL COMMENT '등록자',
  `reg_dt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
  `request_source` varchar(255) DEFAULT NULL COMMENT '요청 출처',
  `checksum` varchar(255) NOT NULL DEFAULT '' COMMENT '체크섬',
  `del_yn` varchar(10) DEFAULT 'N' COMMENT '삭제 여부',
  `del_dt` timestamp NULL DEFAULT NULL COMMENT '삭제일',
  `prsinfo_yn` varchar(10) DEFAULT 'N' COMMENT '개인정보 여부',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='파일 정보';

-- ============================================================
-- 25. 파일 다운로드 로그 테이블
-- ============================================================
CREATE TABLE `file_download_log` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'idx',
  `file_idx` int DEFAULT NULL COMMENT '파일 idx',
  `file_name` varchar(255) DEFAULT NULL COMMENT '원본 파일명',
  `user_id` varchar(255) NOT NULL COMMENT '사용자 id',
  `download_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '다운로드 시간',
  `access_ip` varchar(255) NOT NULL COMMENT '접근 ip',
  `request_source` varchar(255) DEFAULT NULL COMMENT '요청 경로',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='파일 다운로드 로그';

-- ============================================================
-- 26. AI 대화 테이블
-- ============================================================
CREATE TABLE ai_conversation (
    id BIGINT NOT NULL AUTO_INCREMENT,
    owner_user_no BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    mode VARCHAR(20) NOT NULL COMMENT 'all|class|student',
    context_label VARCHAR(255) NOT NULL,
    use_yn CHAR(1) NOT NULL DEFAULT 'Y',
    created_by BIGINT NOT NULL,
    updated_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_ai_conversation_owner_last (owner_user_no, last_message_at DESC, id DESC),
    KEY idx_ai_conversation_owner_created (owner_user_no, created_at DESC),
    KEY idx_ai_conversation_owner_use_last (owner_user_no, use_yn, last_message_at DESC, id DESC),
    CONSTRAINT fk_ai_conversation_owner_user FOREIGN KEY (owner_user_no) REFERENCES `user`(user_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- 27. AI 메시지 테이블
-- ============================================================
CREATE TABLE ai_message (
    id BIGINT NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL COMMENT 'user|assistant|system',
    content TEXT NOT NULL,
    message_at DATETIME NOT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ai_message_conversation_id (conversation_id, id),
    KEY idx_ai_message_conversation_message_at (conversation_id, message_at),
    CONSTRAINT fk_ai_message_conversation FOREIGN KEY (conversation_id) REFERENCES ai_conversation(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- school_record_info                     : stdt_id, cla_id, tc_id 기반 (FK 없음, 논리적 참조)
-- admin_account                          : user 테이블과 FK 없음 (독립 관리)
-- ============================================================
-- v3 대비 삭제된 관계:
-- user (1) ←── (N) refresh_token         : 삭제 (Auth 서버가 관리)
-- email_verification                     : 삭제 (Auth 서버가 처리)
-- ============================================================
