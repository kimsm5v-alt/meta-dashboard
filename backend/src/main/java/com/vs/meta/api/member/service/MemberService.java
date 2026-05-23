package com.vs.meta.api.member.service;

import com.vs.meta.api.member.dto.MemberInfoDto;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.common.auth.UserInfoEnricher;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 회원 서비스 (SSO 전환 후).
 *
 * <p>SSO 전환으로 제거된 기능:
 * <ul>
 *   <li>createUser — Auth 서버에서 가입</li>
 *   <li>login — Auth 서버 SSO 로그인</li>
 *   <li>refreshToken — Auth 프록시에서 처리</li>
 *   <li>logout — Auth 프록시에서 처리</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {

    private final UserMapper userMapper;
    private final UserInfoEnricher userInfoEnricher;

    @Transactional(readOnly = true)
    public MemberInfoDto findMemberInfo(Long userNo) throws Exception {
        if (userNo == null) {
            throw new IllegalArgumentException("사용자 번호는 필수입니다.");
        }
        User user = userMapper.findByUserNo(userNo);
        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: userNo=" + userNo);
        }

        MemberInfoDto dto = new MemberInfoDto();
        dto.setUserNo(user.getUserNo());
        dto.setSpUserId(user.getSpUserId());
        // name/email은 Enricher가 채움 — DB에서 읽지 않음
        dto.setRoleCode(user.getRoleCode());
        dto.setTcId(user.getTcId());
        dto.setStdtId(user.getStdtId());
        dto.setStatus(user.getStatus().name());
        dto.setLastLoginAt(user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null);

        // Auth에서 name/email 조회
        userInfoEnricher.enrich(dto);

        return dto;
    }

    @Transactional(readOnly = true)
    public User findUserByUserNo(Long userNo) {
        return userMapper.findByUserNo(userNo);
    }

    @Transactional(readOnly = true)
    public User findUserByEmail(String email) {
        return userMapper.findByEmailAndStatus(email, UserStatus.ACTIVE.name());
    }

    /**
     * MemberInfoDto에 Auth 회원정보(name/email) 주입.
     * 단건 조회용 Enricher 호출.
     */
    public void enrichMemberInfo(MemberInfoDto dto) {
        userInfoEnricher.enrich(dto);
    }
}
