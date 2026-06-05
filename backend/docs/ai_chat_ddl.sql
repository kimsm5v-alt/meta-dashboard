-- AI Conversation / Message DDL (MySQL 8+)
-- timestamp format policy: yyyy-MM-dd HH:mm:ss (KST display)

CREATE TABLE IF NOT EXISTS ai_conversation (
    id BIGINT NOT NULL AUTO_INCREMENT,
    owner_user_no BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    mode VARCHAR(20) NOT NULL COMMENT 'all|class|student',
    context_label VARCHAR(255) NOT NULL,
    use_yn CHAR(1) NOT NULL DEFAULT 'Y',
    created_by BIGINT NOT NULL,
    updated_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_ai_conversation_owner_last (owner_user_no, last_message_at DESC, id DESC),
    KEY idx_ai_conversation_owner_created (owner_user_no, created_at DESC),
    CONSTRAINT fk_ai_conversation_owner_user
        FOREIGN KEY (owner_user_no) REFERENCES `user`(user_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS ai_message (
    id BIGINT NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL COMMENT 'user|assistant|system',
    content TEXT NOT NULL,
    message_at DATETIME NOT NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ai_message_conversation_id (conversation_id, id),
    KEY idx_ai_message_conversation_message_at (conversation_id, message_at),
    CONSTRAINT fk_ai_message_conversation
        FOREIGN KEY (conversation_id) REFERENCES ai_conversation(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
