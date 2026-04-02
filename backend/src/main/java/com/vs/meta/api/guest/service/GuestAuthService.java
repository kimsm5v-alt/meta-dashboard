package com.vs.meta.api.guest.service;

import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.group.mapper.GroupMemberMapper;
import com.vs.meta.api.member.mapper.RefreshTokenMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.member.service.EmailVerificationService;
import com.vs.meta.common.security.JwtUtil;
import com.vs.meta.domain.GroupInfo;
import com.vs.meta.domain.GroupMember;
import com.vs.meta.domain.RefreshToken;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GuestAuthService {

    private final GroupInfoMapper groupInfoMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final UserMapper userMapper;
    private final EmailVerificationService emailVerificationService;
    private final JwtUtil jwtUtil;

    @Value("${META_API_JWT_REFRESH_EXPIRATION_MS:1209600000}")
    private long refreshExpirationMs;

    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

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
        String timestamp = LocalDateTime.now().format(TS_FORMAT);

        String accessToken = jwtUtil.generateGuestAccessToken(stdtId, claId, email, timestamp);
        String refreshToken = jwtUtil.generateGuestRefreshToken(stdtId, claId, email, timestamp);

        // 기존 게스트 refreshToken 정리 후 새로 저장
        refreshTokenMapper.deleteByStdtId(stdtId);
        saveGuestRefreshToken(stdtId, refreshToken, deviceInfo, ipAddress);

        emailVerificationService.consumeVerification(email);

        log.info("게스트 재인증 완료: stdtId={}, claId={}", stdtId, claId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("stdtId", stdtId);
        result.put("claId", claId);
        result.put("groupNm", group.getGroupNm());
        result.put("email", email);
        result.put("accessToken", accessToken);
        result.put("refreshToken", refreshToken);
        return result;
    }

    public Map<String, Object> issueGuestTokens(String stdtId, String claId, String email,
                                                   String deviceInfo, String ipAddress) {
        String timestamp = LocalDateTime.now().format(TS_FORMAT);
        String accessToken = jwtUtil.generateGuestAccessToken(stdtId, claId, email, timestamp);
        String refreshToken = jwtUtil.generateGuestRefreshToken(stdtId, claId, email, timestamp);

        saveGuestRefreshToken(stdtId, refreshToken, deviceInfo, ipAddress);

        Map<String, Object> tokens = new LinkedHashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);
        return tokens;
    }

    private void saveGuestRefreshToken(String stdtId, String refreshToken,
                                        String deviceInfo, String ipAddress) {
        String tokenHash = hashToken(refreshToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000);

        RefreshToken entity = RefreshToken.builder()
                .userNo(null)
                .stdtId(stdtId)
                .tokenHash(tokenHash)
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .expiresAt(expiresAt)
                .createdAt(LocalDateTime.now())
                .build();
        refreshTokenMapper.insertRefreshToken(entity);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("토큰 해싱 실패", e);
        }
    }
}
