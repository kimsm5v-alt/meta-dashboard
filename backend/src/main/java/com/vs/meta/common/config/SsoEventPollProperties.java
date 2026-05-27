package com.vs.meta.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * SSO 이벤트 폴링 설정 (sso.poll.*).
 *
 * <p>기본 OFF — 운영/개발에서 ENV(SSO_POLL_ENABLED=true) 로 켠다. 안전한 점진 배포.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "sso.poll")
public class SsoEventPollProperties {

    /** 폴링 활성화 여부 (기본 false) */
    private boolean enabled = false;

    /** 1회 호출 page size (IdP max 1000) */
    private int limit = 500;
}
