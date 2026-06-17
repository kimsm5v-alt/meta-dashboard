-- ============================================================
-- group-from-idp migration 01: IDP 그룹 동기화 수신 준비
-- 설계: docs/group-from-idp/02-schema-and-mapping.md §2
-- 단계: P1 (롤백 가능 — 컬럼 추가/완화만, 기존 데이터 불변)
-- 적용 순서: local → dev → prod (각 환경 배포 직전)
-- ============================================================

-- 롤백:
-- ALTER TABLE group_info DROP INDEX uk_group_sp_group_id, DROP COLUMN sp_group_id, DROP COLUMN subject;
-- ALTER TABLE group_info MODIFY COLUMN invite_code VARCHAR(20) NOT NULL;
-- ALTER TABLE group_info MODIFY COLUMN grade VARCHAR(10) NOT NULL;
-- ALTER TABLE `user` DROP COLUMN provisioned;
-- ALTER TABLE sso_poll_cursor MODIFY COLUMN last_since DATETIME NOT NULL;
-- DELETE FROM sso_poll_cursor WHERE feed_type = 'GROUP_CHANGES';

-- ------------------------------------------------------------
-- 1) group_info — Auth 그룹 매핑 키 (동기화 upsert 키)
--    NULL = 학심정 자체 생성(레거시) 행. 동기화 로직은 NOT NULL 행만 취급.
-- ------------------------------------------------------------
ALTER TABLE group_info
    ADD COLUMN sp_group_id BIGINT NULL
        COMMENT 'Auth(IDP) group_info.id — 동기화 upsert 키. NULL=학심정 자체 생성(레거시)'
        AFTER cla_id,
    ADD UNIQUE KEY uk_group_sp_group_id (sp_group_id);

-- ------------------------------------------------------------
-- 2) group_info — invite_code 완화
--    Auth RP 응답에 inviteCode 미포함. 동기화 신규 그룹은 NULL (코드 합류는 mypage 책임).
-- ------------------------------------------------------------
ALTER TABLE group_info
    MODIFY COLUMN invite_code VARCHAR(20) NULL
        COMMENT '초대 코드 — IDP 이관 후 동기화 그룹은 NULL (코드 합류는 mypage). 레거시 그룹만 값 보유';

-- ------------------------------------------------------------
-- 3) group_info — Auth 신규 필드 (표시용)
-- ------------------------------------------------------------
ALTER TABLE group_info
    ADD COLUMN subject VARCHAR(50) NULL
        COMMENT '과목 (Auth 자유텍스트, 예: 수학)'
        AFTER class_number;

-- ------------------------------------------------------------
-- 4) group_info — grade 자유텍스트 수용
--    Auth grade 는 자유텍스트("3학년"). 숫자 추출 파싱 실패 시 원문 저장 — 길이 확장.
-- ------------------------------------------------------------
ALTER TABLE group_info
    MODIFY COLUMN grade VARCHAR(20) NOT NULL
        COMMENT '학년 — 숫자 문자열 권장. Auth 원문 파싱 실패 시 원문 저장 (표시용)';

-- ------------------------------------------------------------
-- 5) user — 프로비저닝 마커 (02-schema-and-mapping.md §7)
--    Y = 그룹 동기화가 선제 생성한 행 (학심정 미로그인, 보유 근거=그룹 멤버십)
--    N = 본인이 직접 로그인(동의)한 정식 사용자
--    라이프사이클: 첫 로그인 시 Y→N 전환 / 멤버십 소멸 시 일간 재동기화가 Y 행 삭제
-- ------------------------------------------------------------
ALTER TABLE `user`
    ADD COLUMN provisioned CHAR(1) NOT NULL DEFAULT 'N'
        COMMENT 'Y=그룹 동기화 선제 생성(미로그인, 근거=멤버십). 첫 로그인 시 N 전환, 멤버십 소멸 시 재동기화가 행 삭제';

-- ------------------------------------------------------------
-- 6) sso_poll_cursor — 그룹 변경 피드 커서
--    Auth group_change_log.created_at 이 DATETIME(6) — 커서도 마이크로초 정밀도로.
--    NULL 허용 = GROUP_CHANGES 의 "부트스트랩 미완료" 표식 (완료 시 첫 페이지 currentSince 기록).
-- ------------------------------------------------------------
ALTER TABLE sso_poll_cursor
    MODIFY COLUMN last_since DATETIME(6) NULL
        COMMENT '다음 폴링 호출의 since 파라미터 (cursor). GROUP_CHANGES 는 NULL=부트스트랩 미완료';

INSERT INTO sso_poll_cursor (feed_type, last_since, last_polled_at, last_item_count)
VALUES ('GROUP_CHANGES', NULL, NULL, 0)
ON DUPLICATE KEY UPDATE feed_type = feed_type;  -- 재실행 멱등 (기존 커서 보존)

-- ============================================================
-- 검증 쿼리
-- ============================================================
-- SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
--  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'group_info'
--    AND COLUMN_NAME IN ('sp_group_id','invite_code','subject','grade');
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
--  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'provisioned';
-- SELECT * FROM sso_poll_cursor;  -- GROUP_CHANGES 행 + last_since NULL 확인
