package com.vs.meta.common.auth;

import java.util.List;

/**
 * Auth GET /api/v1/users/search 응답 모델 (이름·이메일·닉네임 부분일치, 가입최신순 고정).
 *
 * <p>주의 — 검색 응답에는 <b>이메일이 없다</b>(items 필드 5개). 이메일이 필요하면
 * publicUserId 목록으로 {@link PersonInfoClient#getBatch} 를 별도 호출한다.
 */
public record UserSearchResult(
        List<Item> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public record Item(
            String publicUserId,
            String name,
            String nickname,
            String userType,
            String status
    ) {}

    public static UserSearchResult empty(int page, int size) {
        return new UserSearchResult(List.of(), page, size, 0L, 0);
    }
}
