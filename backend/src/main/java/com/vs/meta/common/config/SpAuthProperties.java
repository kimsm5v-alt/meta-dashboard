package com.vs.meta.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * SuperPlatform Auth 서버 연동 설정.
 * application.yml의 superplatform.auth.* 프로퍼티를 바인딩한다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "superplatform.auth")
public class SpAuthProperties {

    /** Auth 서버 URL (예: http://localhost:8080) */
    private String serverUrl;

    /** OAuth2 클라이언트 ID (Auth 팀에서 발급) */
    private String clientId;

    /** OAuth2 클라이언트 Secret (Auth 팀에서 발급, 서버 측에서만 사용) */
    private String clientSecret;
}
