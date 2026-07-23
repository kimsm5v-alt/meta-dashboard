package com.vs.meta.common.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Service에서 호출하는 유일한 진입점.
 * 단건/다건/중첩 모두 enrich() 호출 한 줄로 통일.
 */
@Component
@RequiredArgsConstructor
public class UserInfoEnricher {

    private final PersonInfoClient personInfoClient;
    private final PersonInfoRequestCache requestCache;

    /**
     * 단건 enrich — 내부적으로 batch 1건 호출로 통일 (캐시/디버깅 일관성).
     * 단건 전용 API(getOne) 분기 의도적 미사용.
     */
    public <T extends HasUserInfo> void enrich(T item) {
        if (item == null || item.getSpUserId() == null) return;
        enrich(List.of(item));
    }

    /** 배치 enrich — sp_user_id 모아서 Auth /batch 호출 1회 (요청 캐시 거쳐서) */
    public <T extends HasUserInfo> void enrich(List<T> items) {
        if (items == null || items.isEmpty()) return;

        List<String> ids = items.stream()
                .map(HasUserInfo::getSpUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) return;

        Map<String, UserInfo> infos = requestCache.getBatchOrLoad(ids, personInfoClient::getBatch);

        items.forEach(item -> {
            if (item.getSpUserId() == null) return;
            UserInfo info = infos.getOrDefault(item.getSpUserId(), UserInfo.placeholder(item.getSpUserId()));
            item.setName(info.name());
            item.setEmail(info.email());
            item.setMaskedReason(info.maskedReason());
        });
    }
}
