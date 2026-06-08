-- ============================================================================
-- 03-pii-rename-safe-deploy.sql
-- ============================================================================
-- 목적: PII 컬럼(user/group_member/counseling_student) 을 즉시 DROP 하지 않고
--       이름 변경(_legacy_20260530) + NULLABLE 화로 "은퇴" 시킨다.
--       코드 배포 후 데이터 보존 + 한 명령으로 롤백 가능한 안전 모드.
--
-- 선행 조건:
--   1. 백엔드 코드 배포 완료 — `feature/sso-pii-integration` HEAD `e99da29` 이상.
--      (DgnssMapper gender 제거 + DrawPdfService null-safe 까지 포함)
--   2. 운영 DB `mysqldump --single-transaction --no-tablespaces` 백업 완료.
--   3. 인덱스 이름 환경별 확인 — 이 파일은 dev 기준(uk_user_email, idx_gm_email).
--      `SHOW INDEX FROM <table> WHERE Column_name = 'email'` 로 미리 확인.
--
-- 정책:
--   - 본 SQL 적용 후 1~수주간 안정화 모니터링.
--   - 문제 없으면 → `02-pii-column-drop.sql` 의 진짜 DROP 으로 별도 일정에 마무리.
--     (이때 본 파일이 만든 *_legacy_20260530 컬럼들이 DROP 대상)
--   - 문제 있으면 → 본 파일 하단의 ROLLBACK 섹션으로 즉시 복구 (적용 직후 한정).
--
-- 적용 일자: 2026-05-30
-- 본 작업 spec: docs/superpowers/specs/2026-05-27-sso-pii-integration-design.md
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Step 1: 사전 백업 (운영 셸에서 별도 실행 — 본 SQL 안에 포함 안 함)
-- ----------------------------------------------------------------------------
-- mysqldump --single-transaction --no-tablespaces \
--   -h <host> -P <port> -u <user> -p <db-name> \
--   > backup_pre_pii_rename_$(date +%Y%m%d_%H%M%S).sql


-- ----------------------------------------------------------------------------
-- Step 2: 사전 확인 (실행만, 결과 보고 인덱스 이름이 다르면 Step 3 SQL 수정)
-- ----------------------------------------------------------------------------
SHOW INDEX FROM `user` WHERE Column_name = 'email';
-- 기대: Key_name = uk_user_email (UNIQUE, Non_unique=0)

SHOW INDEX FROM group_member WHERE Column_name = 'email';
-- 기대: Key_name = idx_gm_email (일반, Non_unique=1)

SHOW COLUMNS FROM `user` WHERE Field IN ('email','nickname','gender');
SHOW COLUMNS FROM group_member WHERE Field IN ('nickname','email','gender');
SHOW COLUMNS FROM counseling_student WHERE Field = 'stdt_name';


-- ----------------------------------------------------------------------------
-- Step 3: rename + NULLABLE + DROP INDEX (본 작업)
-- ----------------------------------------------------------------------------
-- 주의: DROP INDEX 를 CHANGE COLUMN 앞에 둔다 (UNIQUE 인덱스 의존 컬럼 먼저 해제).

ALTER TABLE `user`
  DROP INDEX uk_user_email,
  CHANGE COLUMN email    email_legacy_20260530    VARCHAR(100) NULL,
  CHANGE COLUMN nickname nickname_legacy_20260530 VARCHAR(50)  NULL,
  CHANGE COLUMN gender   gender_legacy_20260530   VARCHAR(10)  NULL;

ALTER TABLE group_member
  DROP INDEX idx_gm_email,
  CHANGE COLUMN nickname nickname_legacy_20260530 VARCHAR(50)  NULL,
  CHANGE COLUMN email    email_legacy_20260530    VARCHAR(255) NULL,
  CHANGE COLUMN gender   gender_legacy_20260530   VARCHAR(10)  NULL;

ALTER TABLE counseling_student
  CHANGE COLUMN stdt_name stdt_name_legacy_20260530 VARCHAR(50) NULL;


-- ----------------------------------------------------------------------------
-- Step 4: 적용 직후 검증
-- ----------------------------------------------------------------------------
-- ① legacy 컬럼만 있고 옛 이름은 없어야
SHOW COLUMNS FROM `user`               WHERE Field LIKE 'email%' OR Field LIKE 'nickname%' OR Field LIKE 'gender%';
SHOW COLUMNS FROM group_member         WHERE Field LIKE 'email%' OR Field LIKE 'nickname%' OR Field LIKE 'gender%';
SHOW COLUMNS FROM counseling_student   WHERE Field LIKE 'stdt_name%';
-- 기대: *_legacy_20260530 만 존재, 옛 이름(email/nickname/gender/stdt_name) 0건

-- ② 인덱스 정리 확인 (uk_user_email/idx_gm_email 가 없어야)
SHOW INDEX FROM `user`         WHERE Column_name LIKE 'email%';
SHOW INDEX FROM group_member   WHERE Column_name LIKE 'email%';
-- 기대: 결과 0 행

-- ③ 데이터 보존 확인 (기존 행의 값은 그대로 유지됨)
SELECT
    COUNT(*)                                       AS total_users,
    SUM(email_legacy_20260530    IS NOT NULL)      AS email_kept,
    SUM(nickname_legacy_20260530 IS NOT NULL)      AS nickname_kept
FROM `user`;

SELECT
    COUNT(*)                                       AS total_members,
    SUM(nickname_legacy_20260530 IS NOT NULL)      AS nickname_kept,
    SUM(email_legacy_20260530    IS NOT NULL)      AS email_kept
FROM group_member;

SELECT
    COUNT(*)                                       AS total_counseling_students,
    SUM(stdt_name_legacy_20260530 IS NOT NULL)     AS stdt_name_kept
FROM counseling_student;
-- 기대: kept 값이 기존 데이터 수와 일치 (적용 전 NOT NULL 이었으므로 100% 보존)


-- ----------------------------------------------------------------------------
-- Step 5: 안정화 후 — 진짜 DROP 으로 마무리 (별도 일정)
-- ----------------------------------------------------------------------------
-- 본 SQL 적용 후 1~수주간 dev/staging 에서 모니터링하여 문제 없음 확인되면,
-- `02-pii-column-drop.sql` 의 DROP 문법을 *_legacy_20260530 컬럼 이름으로 바꿔서
-- 다음과 같이 실행한다 (별도 PR/일정):
--
--   ALTER TABLE `user`
--     DROP COLUMN email_legacy_20260530,
--     DROP COLUMN nickname_legacy_20260530,
--     DROP COLUMN gender_legacy_20260530;
--   ALTER TABLE group_member
--     DROP COLUMN nickname_legacy_20260530,
--     DROP COLUMN email_legacy_20260530,
--     DROP COLUMN gender_legacy_20260530;
--   ALTER TABLE counseling_student
--     DROP COLUMN stdt_name_legacy_20260530;


-- ============================================================================
-- ROLLBACK SQL (적용 직후 한정 — 새 INSERT 누적되면 NOT NULL 복귀 실패)
-- ============================================================================
-- 본 Step 3 가 만든 *_legacy_20260530 에 NULL 행이 없을 때만 안전.
-- 안정화 기간 동안 새 회원 가입 시 코드가 legacy 컬럼에 값을 안 넣으므로
-- 새 행은 legacy 컬럼이 NULL 로 채워짐 → 시간이 지나면 NOT NULL 복귀 ALTER 실패.
-- 따라서 롤백은 **적용 직후 짧은 시간 안에만** 가능.
--
-- 시간이 지난 후 롤백이 필요하면 `UPDATE ... SET <legacy>='placeholder' WHERE
-- <legacy> IS NULL` 같이 빈 행을 임시값으로 먼저 채운 뒤 NOT NULL 복귀해야 한다.

-- ALTER TABLE `user`
--   CHANGE COLUMN email_legacy_20260530    email    VARCHAR(100) NOT NULL,
--   CHANGE COLUMN nickname_legacy_20260530 nickname VARCHAR(50)  NOT NULL,
--   CHANGE COLUMN gender_legacy_20260530   gender   VARCHAR(10)  NULL,
--   ADD UNIQUE KEY uk_user_email (email);
--
-- ALTER TABLE group_member
--   CHANGE COLUMN nickname_legacy_20260530 nickname VARCHAR(50)  NOT NULL,
--   CHANGE COLUMN email_legacy_20260530    email    VARCHAR(255) NULL,
--   CHANGE COLUMN gender_legacy_20260530   gender   VARCHAR(10)  NULL,
--   ADD KEY idx_gm_email (email);
--
-- ALTER TABLE counseling_student
--   CHANGE COLUMN stdt_name_legacy_20260530 stdt_name VARCHAR(50) NOT NULL;


-- ----------------------------------------------------------------------------
-- 적용 이력 (환경별로 결과 기록)
-- ----------------------------------------------------------------------------
-- | 환경  | 적용 일시           | 실행자  | 결과 | 비고 |
-- |:------|:--------------------|:--------|:----|:-----|
-- | dev   | YYYY-MM-DD HH:MM    | -       | OK  | 백업 파일: ... |
-- | prod  | YYYY-MM-DD HH:MM    | -       | -   | 사용자가 직접, 안정화 후 |
