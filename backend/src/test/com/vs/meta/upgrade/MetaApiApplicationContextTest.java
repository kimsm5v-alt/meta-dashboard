package com.vs.meta.upgrade;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Spring 컨텍스트 전체 부팅 검증 (Boot 4.0.5 호환성 1차 폭탄 탐지).
 *
 * <p>log4j2 / MyBatis SqlSessionFactory / Caffeine / ShedLock / Redis / OAuth2 RS
 * Bean wiring 을 동시에 검증한다.
 *
 * <p>실 DB 환경변수 (META_API_DATASOURCE_MASTER_URL) 가 주입된 환경에서만 활성화.
 * CI/로컬 기본 환경에서는 skip 되어 ./gradlew test 가 깨지지 않는다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@EnabledIfEnvironmentVariable(named = "META_API_DATASOURCE_MASTER_URL", matches = ".+")
class MetaApiApplicationContextTest {

    @Test
    void contextLoads() {
        // Spring 이 모든 빈을 정상 와이어링하면 통과.
        // 부팅 실패 = Boot 4 / MyBatis 4.0.1 / ShedLock 7.7.0 등의 호환성 폭탄.
    }
}
