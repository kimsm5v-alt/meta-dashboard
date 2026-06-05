-- ============================================================
-- 알림(Notification) 테이블 DDL
-- Phase 1: notification 테이블만 (Redis/ShedLock 없이)
-- Phase 2: shedlock.sql 추가 적용
-- ============================================================

-- 롤백:
-- DROP TABLE IF EXISTS notification;

CREATE TABLE IF NOT EXISTS notification (
    notification_id BIGINT        NOT NULL AUTO_INCREMENT COMMENT '알림 ID',
    user_no         BIGINT        NOT NULL                COMMENT '수신자 user_no (FK, 논리 참조)',
    category        VARCHAR(20)   NOT NULL                COMMENT 'EXAM | GROUP | NOTICE',
    event_code      VARCHAR(20)   NOT NULL                COMMENT 'T1, T3, S1 등 이벤트 식별 코드',
    content         VARCHAR(1000) NOT NULL                COMMENT '렌더링된 문구 (닉네임/그룹명 박제)',
    link            VARCHAR(500)  DEFAULT NULL            COMMENT '딥링크 경로 (쿼리스트링 가능)',
    read_at         DATETIME      DEFAULT NULL            COMMENT '읽은 시각. NULL = 미확인',
    created_at      DATETIME      NOT NULL                COMMENT '생성 시각',
    PRIMARY KEY (notification_id),
    INDEX idx_user_created (user_no, created_at DESC),
    INDEX idx_user_read    (user_no, read_at),
    INDEX idx_retention    (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='사용자별 알림 메시지';

-- ============================================================
-- 샘플 검증 쿼리 (적용 후 확인용)
-- ============================================================

-- 1. 샘플 insert (userNo 28 기준)
-- INSERT INTO notification (user_no, category, event_code, content, link, created_at)
-- VALUES
-- (28, 'GROUP', 'T1', '홍길동 학생이 ''2반'' 그룹에 참여했습니다.',   '/groups/abc-123', NOW()),
-- (28, 'EXAM',  'T3', '김영희 학생이 1차 학습심리정서검사를 제출했습니다.', '/assessment',    NOW()),
-- (28, 'EXAM',  'T4', '''2반'' 1차 검사 전원 제출이 완료되었습니다.',  '/assessment',    NOW());

-- 2. 최신 목록 조회 (cursor 페이징 시뮬레이션)
-- SELECT * FROM notification
-- WHERE user_no = 28
-- ORDER BY notification_id DESC
-- LIMIT 20;

-- 3. 미확인 카운트
-- SELECT COUNT(*) FROM notification
-- WHERE user_no = 28 AND read_at IS NULL;

-- 4. 개별 읽음 처리
-- UPDATE notification
-- SET read_at = NOW()
-- WHERE notification_id = ? AND user_no = 28 AND read_at IS NULL;

-- 5. 전체 읽음 처리
-- UPDATE notification SET read_at = NOW()
-- WHERE user_no = 28 AND read_at IS NULL;

-- 6. 90일 삭제 배치 (스케줄러에서 실행)
-- DELETE FROM notification
-- WHERE created_at < NOW() - INTERVAL 90 DAY;

-- 7. 카테고리별 최신 조회
-- SELECT * FROM notification
-- WHERE user_no = 28 AND category = 'EXAM'
-- ORDER BY notification_id DESC
-- LIMIT 20;
