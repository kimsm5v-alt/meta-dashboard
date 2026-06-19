package com.vs.meta.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * QCH(Quality Coverage Hub) 외부 로그 적재 설정.
 * application.yml 의 qch.* 프로퍼티를 바인딩한다. 자세한 가이드는 backend/docs/doc-1444.md 참고.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "qch")
public class QchProperties {

    /** 적재 활성화 플래그. 운영팀 등록 완료 전에는 false 로 두어 호출 자체를 skip. */
    private boolean enabled = false;

    /** QCH ingest 베이스 URL (운영: https://qch.vsaidt.com, dev: https://t-qch.vsaidt.com) */
    private String baseUrl;

    /** QCH 운영팀에서 발급받은 serviceKey (영문 소문자/하이픈) */
    private String serviceKey;

    /** 환경 식별자 (DEV/STG/PROD/...). doc-1444 §2.2 env 필드. */
    private String env;

    /** WebClient connect timeout (ms) */
    private int connectTimeoutMs = 3_000;

    /** WebClient response timeout (ms) */
    private int responseTimeoutMs = 5_000;

    /** 적재 전용 비동기 스레드풀 설정 */
    private Async async = new Async();

    @Getter
    @Setter
    public static class Async {
        /** core pool size */
        private int corePoolSize = 2;
        /** max pool size */
        private int maxPoolSize = 8;
        /** queue capacity — 가득 차면 DiscardPolicy 로 silently drop (본 서비스 영향 차단) */
        private int queueCapacity = 500;
        private String threadNamePrefix = "qch-trace-";
    }
}
