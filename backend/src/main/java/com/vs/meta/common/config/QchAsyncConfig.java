package com.vs.meta.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * QCH 적재 전용 비동기 스레드풀.
 *
 * <p>본 서비스 응답 스레드와 격리하여 QCH 호출이 본 서비스 응답 시간에 영향 주지 않도록 한다.
 * queue 가 가득 차면 {@link ThreadPoolExecutor.DiscardPolicy} 로 silently drop — 로그 1건의 손실은
 * 허용 가능, 본 서비스 응답이 막히는 것이 더 심각.
 */
@Slf4j
@Configuration
@EnableAsync
@RequiredArgsConstructor
public class QchAsyncConfig {

    public static final String QCH_TRACE_EXECUTOR = "qchTraceExecutor";

    private final QchProperties qch;

    @Bean(name = QCH_TRACE_EXECUTOR)
    public Executor qchTraceExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(qch.getAsync().getCorePoolSize());
        executor.setMaxPoolSize(qch.getAsync().getMaxPoolSize());
        executor.setQueueCapacity(qch.getAsync().getQueueCapacity());
        executor.setThreadNamePrefix(qch.getAsync().getThreadNamePrefix());
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(false);
        executor.initialize();
        log.info("[QCH] trace executor initialized: core={}, max={}, queue={}",
                qch.getAsync().getCorePoolSize(),
                qch.getAsync().getMaxPoolSize(),
                qch.getAsync().getQueueCapacity());
        return executor;
    }
}
