-- 관리자 계정 초기 생성
-- email: admin@visang.com / password: qwer1234!@#$
-- role: ADMIN (level 99)
-- 실행 전 role_group 테이블에 ADMIN 역할이 존재해야 합니다.

INSERT INTO `user` (
    password, email, nickname, role_code,
    tc_id, stdt_id, status,
    created_by, updated_by, created_at, updated_at
) VALUES (
    '$2a$10$3NlyJxHL1g1KeCdm8JlX7OIaqxDF3nhU1Ttd687cItwYB9Oj4KKY2',
    'admin@visang.com',
    '관리자',
    'ADMIN',
    CONCAT('viva-t-', LEFT(REPLACE(UUID(), '-', ''), 8)),
    NULL,
    'ACTIVE',
    0, 0, NOW(), NOW()
)
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    role_code = VALUES(role_code),
    status = VALUES(status),
    updated_at = NOW();
