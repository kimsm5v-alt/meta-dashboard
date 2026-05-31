-- ============================================================================
-- 02-pii-column-drop.sql
-- ============================================================================
-- 목적: Phase 4 — user / group_member / counseling_student PII 컬럼 DROP
-- 선행 조건:
--   1. Phase 2 Task 9 (01-guest-cleanup.sql) 적용 완료
--   2. Phase 4 Task 23 코드 정리 commit `86f4620` + `a68c2d0` 배포 완료
--   3. **운영은 반드시 mysqldump 백업 선행** (로컬 podman 은 컨테이너 영속이라 생략 가능)
-- 적용 대상: 학심정 master DB (`superplatform_meta`)
-- 작성일: 2026-05-23
-- 본 작업 spec: docs/user-info-from-idp/04-design.md §3.3~3.5
-- ============================================================================

-- ------------------------------------------------------------
-- Step 0: 사전 백업 (운영만)
-- ------------------------------------------------------------
-- 운영 백업 예시:
--   mysqldump --single-transaction --routines --triggers \
--     -h <host> -P <port> -u <user> -p superplatform_meta \
--     > backup_before_pii_drop_$(date +%Y%m%d_%H%M%S).sql


-- ------------------------------------------------------------
-- Step 1: 사전 상태 확인
-- ------------------------------------------------------------
SELECT 'BEFORE' AS phase;
SHOW COLUMNS FROM `user` LIKE 'email';
SHOW COLUMNS FROM `user` LIKE 'nickname';
SHOW COLUMNS FROM `user` LIKE 'gender';
SHOW COLUMNS FROM group_member LIKE 'nickname';
SHOW COLUMNS FROM group_member LIKE 'email';
SHOW COLUMNS FROM group_member LIKE 'gender';
SHOW COLUMNS FROM counseling_student LIKE 'stdt_name';

-- 인덱스 사전 확인 (DROP 대상)
SHOW INDEX FROM `user` WHERE Key_name = 'uk_user_email';
SHOW INDEX FROM group_member WHERE Key_name = 'idx_gm_email';


-- ------------------------------------------------------------
-- Step 2: user 테이블 PII 컬럼 DROP
-- ------------------------------------------------------------
-- 인덱스 먼저 제거 (uk_user_email 은 email 컬럼 의존)
ALTER TABLE `user` DROP INDEX uk_user_email;

ALTER TABLE `user`
  DROP COLUMN email,
  DROP COLUMN nickname,
  DROP COLUMN gender;


-- ------------------------------------------------------------
-- Step 3: group_member 테이블 PII 컬럼 DROP
-- ------------------------------------------------------------
ALTER TABLE group_member DROP INDEX idx_gm_email;

ALTER TABLE group_member
  DROP COLUMN nickname,
  DROP COLUMN email,
  DROP COLUMN gender;


-- ------------------------------------------------------------
-- Step 4: counseling_student.stdt_name DROP
-- ------------------------------------------------------------
ALTER TABLE counseling_student DROP COLUMN stdt_name;


-- ------------------------------------------------------------
-- Step 5: 검증
-- ------------------------------------------------------------
SELECT 'AFTER' AS phase;

-- PII 컬럼 잔재 확인 (group_invitation.email, admin_account.email/nickname 제외 시 0건이어야 함)
SELECT TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'superplatform_meta'
  AND COLUMN_NAME IN ('email', 'nickname', 'gender', 'stdt_name')
ORDER BY TABLE_NAME, COLUMN_NAME;
-- 기대: group_invitation.email, admin_account.email, admin_account.nickname 3건만 남음

-- 각 테이블 최종 스키마
DESCRIBE `user`;
DESCRIBE group_member;
DESCRIBE counseling_student;

-- 게스트 잔재 0건
SELECT COUNT(*) AS guest_remaining FROM group_member WHERE member_type = 'GUEST';
-- 기대: 0

-- group_invitation.email 보존 확인
SHOW COLUMNS FROM group_invitation LIKE 'email';
-- 기대: email 컬럼 그대로 존재
