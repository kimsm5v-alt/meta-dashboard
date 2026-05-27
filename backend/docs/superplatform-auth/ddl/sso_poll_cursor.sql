-- ============================================================
-- SSO 이벤트 폴링 커서 테이블 DDL
-- IdP(superplatform-auth) RP Event Feed 폴링 시 since 커서 영속화.
--   - GET /api/v1/events/revocations  (RP 연결끊기, 즉시)
--   - GET /api/v1/events/deletions    (통합 회원 hard purge, 탈퇴신청 +30일)
-- 폴링 잡: SsoEventPollingScheduler / SsoEventPollService
-- 분산 락: 기존 shedlock 테이블 공용 (락 이름 pollSsoEvents)
-- ============================================================

-- 롤백:
-- DROP TABLE IF EXISTS sso_poll_cursor;

CREATE TABLE IF NOT EXISTS sso_poll_cursor (
    feed_type       VARCHAR(20) NOT NULL                COMMENT '피드 종류 (REVOCATION | DELETION)',
    last_since      DATETIME    NOT NULL                COMMENT '다음 폴링 호출의 since 파라미터 (cursor)',
    last_polled_at  DATETIME    DEFAULT NULL            COMMENT '마지막 폴링 성공 시각',
    last_item_count INT         NOT NULL DEFAULT 0      COMMENT '마지막 응답 item 수 (운영 모니터링용)',
    updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (feed_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='SSO 이벤트 폴링 커서 (revocations/deletions)';

-- ============================================================
-- 초기 커서 INSERT
-- last_since = 운영 SSO 전환일. 그 이후 누적된 모든 탈퇴/연결끊기를 첫 폴링에 catch-up.
-- ⚠️ 아래 날짜는 placeholder — 운영/개발 배포 직전 실제 SSO 전환일로 교체할 것.
--    (DELETION 은 탈퇴신청 +30일 노출이라 전환일보다 더 과거로 잡아도 무방)
-- ============================================================
INSERT INTO sso_poll_cursor (feed_type, last_since, last_polled_at, last_item_count) VALUES
    ('REVOCATION', '2026-05-19 00:00:00', NULL, 0),
    ('DELETION',   '2026-05-19 00:00:00', NULL, 0)
ON DUPLICATE KEY UPDATE feed_type = feed_type;  -- 재실행 멱등 (기존 커서 보존)
