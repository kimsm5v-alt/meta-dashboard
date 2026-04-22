-- ============================================================
-- viva_meta → superplatform_meta 데이터 마이그레이션
-- ============================================================
-- 실행 환경: localhost:5006
-- 소스 DB: viva_meta
-- 대상 DB: superplatform_meta
-- ============================================================
-- 주의: 대상 DB에 DDL(meta_api_ddl_v4_sso_dev.sql)이 먼저 실행되어 있어야 함
-- 주의: FK 제약조건 때문에 순서대로 실행해야 함
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. role_group (권한 마스터) — DDL에서 이미 INSERT했으므로 중복 방지
-- ============================================================
INSERT IGNORE INTO superplatform_meta.role_group
SELECT * FROM viva_meta.role_group;

-- ============================================================
-- 2. school_info (학교 마스터)
-- ============================================================
INSERT INTO superplatform_meta.school_info
SELECT * FROM viva_meta.school_info;

-- ============================================================
-- 3. user (회원) — password 제거, sp_user_id는 NULL
-- ============================================================
INSERT INTO superplatform_meta.`user`
    (user_no, sp_user_id, email, nickname, gender, role_code, tc_id, stdt_id,
     status, last_login_at, created_by, updated_by, created_at, updated_at)
SELECT
    user_no, NULL, email, nickname, gender, role_code, tc_id, stdt_id,
    status, last_login_at, created_by, updated_by, created_at, updated_at
FROM viva_meta.`user`
WHERE role_code != 'ADMIN';

-- ============================================================
-- 4. admin_account (관리자 계정) — user에서 ADMIN 분리
-- ============================================================
INSERT INTO superplatform_meta.admin_account
    (email, password, nickname, status, last_login_at, created_at, updated_at)
SELECT
    email, password, nickname, status, last_login_at, created_at, updated_at
FROM viva_meta.`user`
WHERE role_code = 'ADMIN';

-- ============================================================
-- 5. group_info (그룹)
-- ============================================================
INSERT INTO superplatform_meta.group_info
SELECT * FROM viva_meta.group_info;

-- ============================================================
-- 6. auth_school_map (학교 매핑)
-- ============================================================
INSERT INTO superplatform_meta.auth_school_map
SELECT * FROM viva_meta.auth_school_map;

-- ============================================================
-- 7. group_member (그룹 멤버)
-- ============================================================
INSERT INTO superplatform_meta.group_member
SELECT * FROM viva_meta.group_member;

-- ============================================================
-- 8. guest_conversion_log (게스트 전환 이력)
-- ============================================================
INSERT INTO superplatform_meta.guest_conversion_log
SELECT * FROM viva_meta.guest_conversion_log;

-- ============================================================
-- 9. group_invitation (그룹 초대)
-- ============================================================
INSERT INTO superplatform_meta.group_invitation
SELECT * FROM viva_meta.group_invitation;

-- ============================================================
-- 10. email_verification (이메일 인증) — 임시 데이터이므로 비움
-- ============================================================
-- 이관하지 않음 (만료된 인증코드)

-- ============================================================
-- 11. memo_info (관찰 메모)
-- ============================================================
INSERT INTO superplatform_meta.memo_info
SELECT * FROM viva_meta.memo_info;

-- ============================================================
-- 12. counseling_info (상담 정보)
-- ============================================================
INSERT INTO superplatform_meta.counseling_info
SELECT * FROM viva_meta.counseling_info;

-- ============================================================
-- 13. counseling_student (상담-학생 매핑)
-- ============================================================
INSERT INTO superplatform_meta.counseling_student
SELECT * FROM viva_meta.counseling_student;

-- ============================================================
-- 14. school_record_info (생기부)
-- ============================================================
INSERT INTO superplatform_meta.school_record_info
SELECT * FROM viva_meta.school_record_info;

-- ============================================================
-- 15. file (파일 정보)
-- ============================================================
INSERT INTO superplatform_meta.file
SELECT * FROM viva_meta.file;

-- ============================================================
-- 16. file_download_log (파일 다운로드 로그)
-- ============================================================
INSERT INTO superplatform_meta.file_download_log
SELECT * FROM viva_meta.file_download_log;

-- ============================================================
-- 17. ai_conversation (AI 대화)
-- ============================================================
INSERT INTO superplatform_meta.ai_conversation
SELECT * FROM viva_meta.ai_conversation;

-- ============================================================
-- 18. ai_message (AI 메시지)
-- ============================================================
INSERT INTO superplatform_meta.ai_message
SELECT * FROM viva_meta.ai_message;

-- ============================================================
-- 19~28. tb_dgnss_* (진단검사 테이블)
-- ============================================================
INSERT INTO superplatform_meta.tb_dgnss_section SELECT * FROM viva_meta.tb_dgnss_section;
INSERT INTO superplatform_meta.tb_dgnss_snt SELECT * FROM viva_meta.tb_dgnss_snt;
INSERT INTO superplatform_meta.tb_dgnss_stats SELECT * FROM viva_meta.tb_dgnss_stats;
INSERT INTO superplatform_meta.tb_dgnss_stats_coch SELECT * FROM viva_meta.tb_dgnss_stats_coch;
INSERT INTO superplatform_meta.tb_dgnss_paper SELECT * FROM viva_meta.tb_dgnss_paper;
INSERT INTO superplatform_meta.tb_dgnss_paper_detail SELECT * FROM viva_meta.tb_dgnss_paper_detail;
INSERT INTO superplatform_meta.tb_dgnss_problem SELECT * FROM viva_meta.tb_dgnss_problem;
INSERT INTO superplatform_meta.tb_dgnss_script SELECT * FROM viva_meta.tb_dgnss_script;
INSERT INTO superplatform_meta.tb_dgnss_info SELECT * FROM viva_meta.tb_dgnss_info;
INSERT INTO superplatform_meta.tb_dgnss_omr SELECT * FROM viva_meta.tb_dgnss_omr;
INSERT INTO superplatform_meta.tb_dgnss_result_info SELECT * FROM viva_meta.tb_dgnss_result_info;
INSERT INTO superplatform_meta.tb_dgnss_answer SELECT * FROM viva_meta.tb_dgnss_answer;
INSERT INTO superplatform_meta.tb_dgnss_answer_report SELECT * FROM viva_meta.tb_dgnss_answer_report;
INSERT INTO superplatform_meta.tb_dgnss_lpa_result SELECT * FROM viva_meta.tb_dgnss_lpa_result;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 이관 검증
-- ============================================================
SELECT 'user' AS tbl, COUNT(*) AS cnt FROM superplatform_meta.`user`
UNION ALL SELECT 'admin_account', COUNT(*) FROM superplatform_meta.admin_account
UNION ALL SELECT 'group_info', COUNT(*) FROM superplatform_meta.group_info
UNION ALL SELECT 'group_member', COUNT(*) FROM superplatform_meta.group_member
UNION ALL SELECT 'school_info', COUNT(*) FROM superplatform_meta.school_info
UNION ALL SELECT 'tb_dgnss_info', COUNT(*) FROM superplatform_meta.tb_dgnss_info
UNION ALL SELECT 'tb_dgnss_answer', COUNT(*) FROM superplatform_meta.tb_dgnss_answer
UNION ALL SELECT 'ai_conversation', COUNT(*) FROM superplatform_meta.ai_conversation;

-- ============================================================
-- 이관하지 않는 테이블:
--   - refresh_token: 대상 DB에 테이블 없음 (Auth 서버가 관리)
--   - email_verification: 임시 데이터 (만료된 인증코드)
--
-- sp_user_id가 NULL인 회원:
--   - SSO 첫 로그인 시 email 기반 자동 매핑됨
--   - SsoUserService.findAndSyncUser()에서 처리
-- ============================================================
