-- ============================================================================
-- 01-guest-cleanup.sql
-- ============================================================================
-- 목적: 게스트 영역 폐기 — 데이터 삭제 + 테이블 DROP
-- 선행 조건: 백엔드 게스트 코드 폐기 배포 완료 (Task 6 commit 99e9457, Task 7 commit 81bf69c)
-- 적용 대상: 학심정 master DB (`superplatform_meta`)
-- 작성일: 2026-05-23
-- 본 작업 spec: docs/user-info-from-idp/04-design.md §3.2 Step 1
-- ============================================================================

-- ------------------------------------------------------------
-- Step 0: 사전 백업 (운영 DB는 별도 mysqldump 필수)
-- 로컬 podman MySQL은 컨테이너 자체가 영속이라 백업 생략 가능
-- ------------------------------------------------------------
-- 운영 백업 예시 (실제 실행 환경의 별도 셸에서):
--   mysqldump --single-transaction --routines --triggers \
--     -h <host> -P <port> -u <user> -p superplatform_meta \
--     > backup_before_guest_cleanup_$(date +%Y%m%d_%H%M%S).sql


-- ------------------------------------------------------------
-- Step 1: 사전 영향도 측정 (실행 전 row 수 확인)
-- ------------------------------------------------------------
SELECT 'BEFORE' AS phase,
       (SELECT COUNT(*) FROM group_member WHERE member_type = 'GUEST') AS guest_member_rows,
       (SELECT COUNT(*) FROM guest_conversion_log) AS guest_conversion_rows,
       (SELECT COUNT(*) FROM email_verification) AS email_verification_rows;
-- 예상: 환경별 다름. 적용 후 동일 쿼리(AFTER)와 비교.


-- ------------------------------------------------------------
-- Step 2: 게스트 그룹 멤버 row 삭제
-- ------------------------------------------------------------
-- 게스트는 Auth에 계정이 없으므로 sp_user_id 매핑 불가 — clean cut 정책.
-- member_type='GUEST' row만 삭제. STUDENT/TEACHER 등 회원 row는 영향 없음.
DELETE FROM group_member WHERE member_type = 'GUEST';


-- ------------------------------------------------------------
-- Step 3: 게스트 전환 이력 테이블 DROP
-- ------------------------------------------------------------
-- 게스트→회원 전환 감사 로그 테이블. 게스트 폐기로 의미 상실.
DROP TABLE IF EXISTS guest_conversion_log;


-- ------------------------------------------------------------
-- Step 4: 게스트 이메일 인증 테이블 DROP
-- ------------------------------------------------------------
-- 회원가입은 Auth 서버가 처리. 학심정 자체 이메일 인증은 게스트 흐름 전용이었으므로 함께 폐기.
DROP TABLE IF EXISTS email_verification;


-- ------------------------------------------------------------
-- Step 5: 검증 (실행 후 row 수 확인)
-- ------------------------------------------------------------
SELECT 'AFTER' AS phase,
       (SELECT COUNT(*) FROM group_member WHERE member_type = 'GUEST') AS guest_member_rows_remaining;
-- 예상: guest_member_rows_remaining = 0

-- 테이블 부재 확인 (둘 다 빈 결과여야 함)
SHOW TABLES LIKE 'guest_conversion_log';
SHOW TABLES LIKE 'email_verification';

-- 영향 안 받은 회원 멤버 row 정상 보존 확인
SELECT member_type, COUNT(*) AS row_count
FROM group_member
GROUP BY member_type
ORDER BY member_type;
-- 예상: STUDENT/TEACHER 등 회원 row는 그대로 (사전 측정값과 동일)


-- ------------------------------------------------------------
-- 실행 이력 기록 (운영 적용 시 docs/user-info-from-idp/06-progress.md 에 기록)
-- ------------------------------------------------------------
-- | 환경       | 실행 일시           | 실행자  | guest_member 삭제 | 비고 |
-- |:----------|:--------------------|:--------|:-----------------|:-----|
-- | 로컬       | YYYY-MM-DD HH:MM    | -       | N 건             | -    |
-- | dev       | YYYY-MM-DD HH:MM    | -       | N 건             | -    |
-- | prod      | YYYY-MM-DD HH:MM    | -       | N 건             | 백업 파일: ... |
