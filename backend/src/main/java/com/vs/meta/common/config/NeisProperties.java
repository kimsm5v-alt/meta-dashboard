package com.vs.meta.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * NEIS 학교기본정보 Open API 설정 (neis.*).
 *
 * <p>검사 기본정보 입력의 학교 검색 모달이 프록시 호출에 사용. api-key 는 시크릿이라
 * 하드코딩 금지 — 개발/운영 env(NEIS_API_KEY)로 주입.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "neis")
public class NeisProperties {

    /** NEIS Open API base URL (예: https://open.neis.go.kr) */
    private String baseUrl;

    /** NEIS 인증키 — env(NEIS_API_KEY) 주입. 미설정 시 검색은 빈 결과. */
    private String apiKey;
}
