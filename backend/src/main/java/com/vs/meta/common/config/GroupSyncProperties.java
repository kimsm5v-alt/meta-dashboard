package com.vs.meta.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * IDP 그룹 동기화 설정 (group-sync.*) — group-from-idp.
 *
 * <p>기본 OFF — 운영/개발에서 ENV(GROUP_SYNC_ENABLED=true) 로 켠다. 안전한 점진 배포.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "group-sync")
public class GroupSyncProperties {

    /** 동기화 활성화 여부 (기본 false) */
    private boolean enabled = false;

    /** 부트스트랩/전체 재동기화 page size (IdP max 500) */
    private int snapshotLimit = 100;

    /** 변경 피드 page size (IdP max 1000) */
    private int feedLimit = 500;
}
