package com.vs.meta.api.notification.scheduler;

import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import net.javacrumbs.shedlock.core.LockProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * Phase 2 — 스케줄러 분산 락 설정.
 *
 * <p>{@code notification.shedlock.enabled=true} 일 때만 활성화.
 * false 시에는 {@link net.javacrumbs.shedlock.spring.annotation.SchedulerLock} 어노테이션이
 * 무해한 마커로 남고 일반 {@link org.springframework.scheduling.annotation.Scheduled} 처럼 동작.
 *
 * <p>락 저장소: 기존 master MySQL 의 {@code shedlock} 테이블 (DDL: {@code shedlock.sql}).
 *
 * <p>다중 인스턴스 환경에서 cron 시각이 겹쳐도 한 인스턴스만 작업 수행.
 */
@Configuration
@ConditionalOnProperty(name = "notification.shedlock.enabled", havingValue = "true")
@EnableSchedulerLock(defaultLockAtMostFor = "PT10M")
public class NotificationShedLockConfig {

    /**
     * MySQL master DataSource 기반 LockProvider.
     * Routing DS 가 readOnly 트랜잭션을 slave 로 보내므로, 직접 master 빈을 명시 주입.
     */
    @Bean
    public LockProvider lockProvider(@Qualifier("masterDataSource") DataSource dataSource) {
        return new JdbcTemplateLockProvider(
                JdbcTemplateLockProvider.Configuration.builder()
                        .withJdbcTemplate(new JdbcTemplate(dataSource))
                        .usingDbTime()
                        .build()
        );
    }
}
