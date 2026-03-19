package com.vs.meta.common.utils;

import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Resolves the authenticated teacher's tcId and userNo, writes them into request params.
 * Shared by memo and counseling endpoints.
 */
@Component
@RequiredArgsConstructor
public class AuthTcIdResolver {

    private final UserMapper userMapper;

    /**
     * Reads the authenticated userNo from the security context and forces tcId/userNo into paramData.
     * Throws if the user is missing or has not created a teacher group yet.
     */
    public void enforceAuthTcId(Map<String, Object> paramData) {
        Long authUserNo = SecurityUtil.requireCurrentUserNo();
        User user = userMapper.findByUserNo(authUserNo);
        if (user == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }
        if (user.getTcId() == null) {
            throw new IllegalArgumentException("교사 ID가 없습니다. 그룹을 먼저 생성해주세요.");
        }
        paramData.put("tcId", user.getTcId());
        paramData.put("userNo", authUserNo);
    }
}
