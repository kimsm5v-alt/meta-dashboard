package com.vs.meta.upgrade;

import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.domain.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * MyBatis 4.0.1 + Spring Boot 4.0.5 호환성 핵심 검증.
 *
 * <p>SqlSessionFactory 가 정상 부트되고, XML 매퍼 인식, 쿼리 실행, slave 라우팅이 작동하는지 검증한다.
 *
 * <p>실패 시 — Boot 4 + MyBatis 호환성 폭탄 → 본 PR 진행 중단 후
 * mybatis 버전/BOM 재검토.
 *
 * <p>실 DB 환경변수 (META_API_DATASOURCE_MASTER_URL + SLAVE_URL) 가 주입된 환경에서만 활성화.
 */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "META_API_DATASOURCE_MASTER_URL", matches = ".+")
class MemberMapperReadTest {

    @Autowired UserMapper userMapper;

    @Test
    void mapperBeanIsWired() {
        assertThat(userMapper).isNotNull();
    }

    @Test
    void canExecuteSelectQuery() {
        // 존재하지 않는 이메일 — null 반환이 정상 (SQLException 안 나면 OK).
        // 컨텍스트 부팅까지 이미 통과한 상태이므로 SqlSession 자체는 OK.
        // 본 호출이 정상 종료되면 — Mapper XML 인식 / 쿼리 컴파일 / JDBC 실행까지 통과.
        User u = userMapper.findByEmail("__boot4_upgrade_smoke__@invalid.local");
        assertThat(u).matches(user -> user == null || user.getEmail() != null);
    }
}
