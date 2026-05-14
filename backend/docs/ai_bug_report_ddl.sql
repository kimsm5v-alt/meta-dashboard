-- AI Bug Report DDL (MySQL 8+)
-- 버그리포트 기능: AI 대화 이상 응답 신고 + 컨텍스트 데이터 저장

-- ============================================================
-- 1. ai_conversation 테이블에 context_data 컬럼 추가
-- ============================================================
ALTER TABLE ai_conversation
    ADD COLUMN context_data JSON NULL COMMENT 'RAG 컨텍스트 데이터 (첫 메시지 시점 저장)' AFTER context_label;


-- ============================================================
-- 2. ai_bug_report 테이블 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_bug_report (
    id BIGINT NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL COMMENT '대화방 ID (ai_conversation.id)',

    -- 오류 유형: hallucination(환각), data_mismatch(데이터 불일치), missing_info(정보 누락),
    --           sensitive(민감 정보), ui_bug(UI 버그), other(기타)
    error_type VARCHAR(30) NOT NULL COMMENT '오류 유형',

    -- 심각도: critical, high, medium, low
    severity VARCHAR(20) NOT NULL COMMENT '심각도',

    -- 설명
    description TEXT NULL COMMENT '버그 상세 설명',

    -- 스크린샷 URL (NCP Object Storage)
    screenshot_url VARCHAR(500) NULL COMMENT '스크린샷 이미지 URL',

    -- 처리 상태: pending(대기), reviewing(검토중), resolved(해결), dismissed(기각)
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '처리 상태',

    -- 신고자 정보
    reported_by BIGINT NOT NULL COMMENT '신고자 user_no',
    reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신고 일시',

    -- 처리자 정보
    resolved_by BIGINT NULL COMMENT '처리자 user_no',
    resolved_at DATETIME NULL COMMENT '처리 일시',
    resolution_note TEXT NULL COMMENT '처리 메모',

    PRIMARY KEY (id),
    KEY idx_bug_report_conversation (conversation_id),
    KEY idx_bug_report_status_reported (status, reported_at DESC),
    KEY idx_bug_report_severity (severity, status),
    KEY idx_bug_report_error_type (error_type, status),
    KEY idx_bug_report_reported_by (reported_by, reported_at DESC),

    CONSTRAINT fk_bug_report_conversation
        FOREIGN KEY (conversation_id) REFERENCES ai_conversation(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bug_report_reporter
        FOREIGN KEY (reported_by) REFERENCES `user`(user_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='AI 버그리포트';


-- ============================================================
-- 참고: 오류 유형 및 심각도 값
-- ============================================================
-- error_type:
--   hallucination  : 환각 (사실과 다른 정보 생성)
--   data_mismatch  : 데이터 불일치 (제공된 데이터와 다른 응답)
--   missing_info   : 정보 누락 (필요한 정보를 제공하지 않음)
--   sensitive      : 민감 정보 (개인정보, 부적절한 내용)
--   ui_bug         : UI 버그 (화면 표시 오류)
--   other          : 기타
--
-- severity:
--   critical : 심각 (즉시 대응 필요)
--   high     : 높음 (빠른 대응 필요)
--   medium   : 보통 (일반 대응)
--   low      : 낮음 (개선 사항)
--
-- status:
--   pending   : 대기 (신고 접수됨)
--   reviewing : 검토중 (담당자 확인 중)
--   resolved  : 해결 (처리 완료)
--   dismissed : 기각 (유효하지 않은 신고)


-- ============================================================
-- 3. ai_bug_report 테이블에 message_id 컬럼 추가
-- ============================================================
ALTER TABLE ai_bug_report
    ADD COLUMN message_id BIGINT NULL COMMENT '문제된 AI 메시지 ID (ai_message.id)' AFTER conversation_id,
    ADD KEY idx_bug_report_message (message_id),
    ADD CONSTRAINT fk_bug_report_message
        FOREIGN KEY (message_id) REFERENCES ai_message(id)
        ON DELETE SET NULL;
