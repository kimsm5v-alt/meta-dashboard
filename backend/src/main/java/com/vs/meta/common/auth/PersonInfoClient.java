package com.vs.meta.common.auth;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface PersonInfoClient {

    /** 단건 조회. 404/탈퇴 시 UserInfo.placeholder() 반환. */
    UserInfo getOne(String publicUserId);

    /**
     * 배치 조회 — sp_user_id 100건 초과 시 자동 chunking.
     * notFound 는 placeholder 로 채워서 반환 (입력 ID 전체에 대해 응답 보장).
     */
    Map<String, UserInfo> getBatch(List<String> publicUserIds);

    /** 이메일 → publicUserId 매핑 (service AT 전용). 미등록 시 Optional.empty(). */
    Optional<UserInfo> lookupByEmail(String email);

    /**
     * 이름·이메일·닉네임 부분일치 검색 (service AT 전용, 가입최신순 고정).
     * keyword 는 비우지 말 것(빈 값이면 전체 목록 우회). 응답에는 이메일이 없다 — 필요 시 {@link #getBatch}.
     * 실패 시 빈 결과 반환.
     */
    UserSearchResult search(String keyword, String status, int page, int size);
}
