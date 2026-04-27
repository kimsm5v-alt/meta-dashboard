-- ============================================================
-- ShedLock 분산 락 테이블 DDL
-- Phase 2 운영 배포 시에만 필요 (BE 2대 이상 환경)
-- Phase 1 단일 인스턴스 환경에서는 불필요
-- ============================================================

-- 롤백:
-- DROP TABLE IF EXISTS shedlock;

CREATE TABLE IF NOT EXISTS shedlock (
    name       VARCHAR(64)  NOT NULL COMMENT '락 이름 (@SchedulerLock name)',
    lock_until TIMESTAMP(3) NOT NULL COMMENT '락 만료 시각',
    locked_at  TIMESTAMP(3) NOT NULL COMMENT '락 획득 시각',
    locked_by  VARCHAR(255) NOT NULL COMMENT '락 획득한 인스턴스 식별자',
    PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='ShedLock 분산 락';

-- 락 이름 규칙:
--   sendExamReminders         - T5/S2 리마인더 (매일 08:00)
--   cleanupOldNotifications   - 90일 알림 삭제 (매일 03:00)
