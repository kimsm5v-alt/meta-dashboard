-- ============================================================
-- tb_dgnss_result_info: NEIS 학교코드 컬럼 추가
-- 배경: 검사 시작(기본정보 입력)에서 학생이 NEIS 학교검색으로 학교를 선택하면
--       표준학교코드를 검사 결과에 저장(나이스 연동 등록). 검사쪽 전용 — group_info 불가침.
-- 적용: local → dev → prod (배포 직전 각 환경)
-- 롤백: ALTER TABLE tb_dgnss_result_info DROP COLUMN school_code;
-- ============================================================

ALTER TABLE tb_dgnss_result_info
    ADD COLUMN school_code VARCHAR(10) NULL
        COMMENT 'NEIS 표준학교코드 — 검사 시작 시 학생이 학교검색으로 선택(나이스 연동). NULL=미선택/그룹동기화 학교'
        AFTER school_name;

-- 검증:
-- SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
--  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tb_dgnss_result_info' AND COLUMN_NAME = 'school_code';
