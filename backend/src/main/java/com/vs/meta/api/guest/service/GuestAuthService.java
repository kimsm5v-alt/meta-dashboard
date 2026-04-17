package com.vs.meta.api.guest.service;

import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.group.mapper.GroupMemberMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.member.service.EmailVerificationService;
import com.vs.meta.common.config.SpAuthProperties;
import com.vs.meta.domain.GroupInfo;
import com.vs.meta.domain.GroupMember;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 게스트 인증 서비스 (SSO 전환 후).
 *
 * <p>변경 사항:
 * <ul>
 *   <li>자체 Guest JWT 발급 → Auth 서버 게스트 토큰 프록시 경유</li>
 *   <li>자체 refresh_token 저장 제거 → Auth 서버가 관리 (게스트는 RT 없음, 2시간 만료)</li>
 * </ul>
 *
 * <p>유지 사항:
 * <ul>
 *   <li>초대코드 검증, 이메일 인증 — 학심정 자체 유지</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GuestAuthService {

    private final GroupInfoMapper groupInfoMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final UserMapper userMapper;
    private final EmailVerificationService emailVerificationService;
    private final SpAuthProperties spAuth;

    @Transactional(readOnly = true)
    public Map<String, Object> checkGuestExists(String inviteCode, String email) {
        if (inviteCode == null || inviteCode.isBlank()) {
            throw new IllegalArgumentException("inviteCode는 필수입니다.");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email은 필수입니다.");
        }

        User existingUser = userMapper.findByEmail(email);
        if (existingUser != null) {
            throw new IllegalArgumentException("이미 가입된 회원 이메일입니다. 회원으로 로그인하여 그룹에 참가해주세요.");
        }

        GroupInfo group = groupInfoMapper.findByInviteCodeAndUseYn(inviteCode.toUpperCase(), "Y");
        if (group == null) {
            throw new IllegalArgumentException("유효한 초대코드가 아닙니다.");
        }

        GroupMember guest = groupMemberMapper.findActiveGuestByGroupIdAndEmail(group.getGroupId(), email);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("exists", guest != null);
        result.put("groupNm", group.getGroupNm());
        result.put("claId", group.getClaId());
        return result;
    }

    @Transactional
    public Map<String, Object> authenticateGuest(String inviteCode, String email,
                                                   String deviceInfo, String ipAddress) {
        if (inviteCode == null || inviteCode.isBlank()) {
            throw new IllegalArgumentException("inviteCode는 필수입니다.");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email은 필수입니다.");
        }
        if (!emailVerificationService.isVerified(email)) {
            throw new IllegalArgumentException("이메일 인증이 필요합니다.");
        }

        GroupInfo group = groupInfoMapper.findByInviteCodeAndUseYn(inviteCode.toUpperCase(), "Y");
        if (group == null) {
            throw new IllegalArgumentException("유효한 초대코드가 아닙니다.");
        }

        GroupMember guest = groupMemberMapper.findActiveGuestByGroupIdAndEmail(group.getGroupId(), email);
        if (guest == null) {
            throw new IllegalArgumentException("해당 그룹에 참가한 게스트 기록이 없습니다.");
        }

        String stdtId = guest.getStdtId();
        String claId = group.getClaId();
        String nickname = guest.getNickname();

        // Auth 서버 게스트 토큰 발급 (프록시 경유 대신 직접 호출)
        Map<String, Object> guestToken = requestGuestToken(nickname);
        String accessToken = (String) guestToken.get("accessToken");
        String guestId = (String) guestToken.get("guestId");

        emailVerificationService.consumeVerification(email);

        log.info("게스트 인증 완료: stdtId={}, claId={}, guestId={}", stdtId, claId, guestId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("stdtId", stdtId);
        result.put("claId", claId);
        result.put("groupNm", group.getGroupNm());
        result.put("email", email);
        result.put("accessToken", accessToken);
        result.put("guestId", guestId);
        // refreshToken 없음 — Auth 게스트 토큰은 2시간 만료, RT 미발급
        return result;
    }

    /**
     * Auth 서버에 게스트 토큰 발급 요청.
     * AuthProxyController를 거치지 않고 직접 호출 (서버 내부 호출이므로 client_secret 포함).
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> requestGuestToken(String name) {
        return WebClient.create(spAuth.getServerUrl())
                .post()
                .uri("/oauth2/guest-token")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                        "clientId", spAuth.getClientId(),
                        "clientSecret", spAuth.getClientSecret(),
                        "name", name != null ? name : ""
                ))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }
}
