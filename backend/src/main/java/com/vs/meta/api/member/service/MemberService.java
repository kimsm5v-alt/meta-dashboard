package com.vs.meta.api.member.service;

import com.vs.meta.common.exception.AuthFailedException;
import com.vs.meta.common.exception.JwtExpiredException;
import com.vs.meta.common.security.JwtUtil;
import com.vs.meta.api.member.mapper.RefreshTokenMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.vs.meta.common.utils.IdGenerator;
import com.vs.meta.common.utils.LoginRateLimiter;
import com.vs.meta.common.utils.PasswordValidator;
import com.vs.meta.domain.RefreshToken;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.UserStatus;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
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
public class MemberService {

    private final UserMapper userMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailVerificationService emailVerificationService;
    private final LoginRateLimiter loginRateLimiter;

    @Value("${META_API_JWT_REFRESH_EXPIRATION_MS:1209600000}")
    private long refreshExpirationMs;

    /** Rotation Grace Period: 최근 교체된 refreshToken → 새 토큰 매핑 (10초 TTL) */
    private final Cache<String, Map<String, Object>> rotationCache = Caffeine.newBuilder()
            .expireAfterWrite(java.time.Duration.ofSeconds(10))
            .maximumSize(1_000)
            .build();

    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    @Transactional
    public Object createUser(Map<String, Object> paramData) throws Exception {
        String email = (String) paramData.get("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("이메일은 필수입니다.");
        }
        if (!emailVerificationService.isVerified(email)) {
            throw new IllegalArgumentException("이메일 인증이 필요합니다.");
        }

        String nickname = (String) paramData.get("nickname");
        if (nickname == null || nickname.isBlank()) {
            throw new IllegalArgumentException("닉네임은 필수입니다.");
        }

        String gender = (String) paramData.get("gender");
        if (gender == null || gender.isBlank()) {
            throw new IllegalArgumentException("성별은 필수입니다.");
        }
        if (!"M".equals(gender) && !"F".equals(gender)) {
            throw new IllegalArgumentException("성별은 M 또는 F만 허용됩니다.");
        }

        // 이메일 중복 체크
        User existingByEmail = userMapper.findByEmail(email);
        if (existingByEmail != null) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        String rawPassword = (String) paramData.get("password");
        PasswordValidator.validate(rawPassword, email);

        String roleCode = (String) paramData.get("roleCode");
        if (roleCode == null || roleCode.isBlank()) {
            roleCode = "TEACHER";
        }

        String tcId = null;
        String stdtId = null;
        if (IdGenerator.isTeacherRole(roleCode)) {
            tcId = IdGenerator.generateTcId();
        } else if ("STUDENT".equals(roleCode)) {
            stdtId = IdGenerator.generateStdtId();
        }

        User user = User.builder()
                .password(passwordEncoder.encode(rawPassword))
                .email(email)
                .nickname(nickname)
                .gender(gender)
                .roleCode(roleCode)
                .tcId(tcId)
                .stdtId(stdtId)
                .status(UserStatus.ACTIVE)
                .createdBy(0L)
                .updatedBy(0L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        userMapper.insertUser(user);
        emailVerificationService.consumeVerification(email);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userNo", user.getUserNo());
        result.put("email", email);
        result.put("nickname", nickname);
        result.put("gender", gender);
        result.put("roleCode", roleCode);
        return result;
    }

    @Transactional
    public Map<String, Object> login(String email, String rawPassword,
                                      String deviceInfo, String ipAddress) throws Exception {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("이메일은 필수입니다.");
        }
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("비밀번호는 필수입니다.");
        }

        if (loginRateLimiter.isBlocked(ipAddress, email)) {
            throw new IllegalArgumentException("로그인 시도 횟수를 초과했습니다. " + loginRateLimiter.getBlockMinutes() + "분 후 다시 시도해주세요.");
        }

        User user = userMapper.findByEmailAndStatus(email, UserStatus.ACTIVE.name());
        if (user == null) {
            loginRateLimiter.recordFailure(ipAddress, email);
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            loginRateLimiter.recordFailure(ipAddress, email);
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        loginRateLimiter.clearAttempts(ipAddress, email);
        user.updateLastLogin();
        userMapper.updateUser(user);

        // 자체 JWT 발급
        String timestamp = LocalDateTime.now().format(TS_FORMAT);
        String userSeCd = user.getTcId() != null ? "T" : "S";
        String accessToken = jwtUtil.generateAccessToken(user.getUserNo(), user.getEmail(), userSeCd, timestamp);
        String refreshToken = jwtUtil.generateRefreshToken(user.getUserNo(), user.getEmail(), userSeCd, timestamp);

        // refreshToken DB 저장
        saveRefreshToken(user.getUserNo(), refreshToken, deviceInfo, ipAddress);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userNo", user.getUserNo());
        result.put("email", user.getEmail());
        result.put("nickname", user.getNickname());
        result.put("gender", user.getGender());
        result.put("roleCode", user.getRoleCode());
        result.put("tcId", user.getTcId());
        result.put("stdtId", user.getStdtId());
        result.put("accessToken", accessToken);
        result.put("refreshToken", refreshToken);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> findMemberInfo(Long userNo) throws Exception {
        if (userNo == null) {
            throw new IllegalArgumentException("사용자 번호는 필수입니다.");
        }
        User user = userMapper.findByUserNo(userNo);
        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: userNo=" + userNo);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userNo", user.getUserNo());
        result.put("email", user.getEmail());
        result.put("nickname", user.getNickname());
        result.put("gender", user.getGender());
        result.put("roleCode", user.getRoleCode());
        result.put("tcId", user.getTcId());
        result.put("stdtId", user.getStdtId());
        result.put("status", user.getStatus());
        result.put("lastLoginAt", user.getLastLoginAt());
        result.put("createdAt", user.getCreatedAt());
        result.put("updatedAt", user.getUpdatedAt());
        return result;
    }

    @Transactional
    public Map<String, Object> refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("refreshToken은 필수입니다.");
        }

        try {
            // Grace Period: 최근 교체된 토큰이면 캐시된 결과 반환
            String tokenHash = hashToken(refreshToken);
            Map<String, Object> cached = rotationCache.getIfPresent(tokenHash);
            if (cached != null) {
                return cached;
            }

            // JWT 서명/만료 검증
            Claims claims = jwtUtil.getAllClaimsFromToken(refreshToken);
            Object userNoObj = claims.get("userNo");
            String userSeCd = claims.get("userSeCd", String.class);

            if (userNoObj == null) {
                throw new AuthFailedException("유효하지 않은 토큰입니다.");
            }
            Long userNo;
            try {
                userNo = Long.valueOf(String.valueOf(userNoObj));
            } catch (NumberFormatException e) {
                throw new AuthFailedException("유효하지 않은 토큰입니다: userNo 형식 오류");
            }

            // DB에 존재하는지 확인 (계정 정지 시 삭제되어 없음)
            RefreshToken stored = refreshTokenMapper.findByTokenHash(tokenHash);
            if (stored == null) {
                throw new AuthFailedException("유효하지 않은 refreshToken입니다. 다시 로그인해주세요.");
            }

            User user = userMapper.findByUserNo(userNo);
            if (user == null || user.getStatus() != UserStatus.ACTIVE) {
                refreshTokenMapper.deleteByUserNo(userNo);
                throw new AuthFailedException("사용자를 찾을 수 없습니다.");
            }

            // 기존 refreshToken 폐기
            refreshTokenMapper.deleteByTokenHash(tokenHash);

            // 새 토큰 발급 (Rotation)
            String timestamp = LocalDateTime.now().format(TS_FORMAT);
            String newAccessToken = jwtUtil.generateAccessToken(userNo, user.getEmail(), userSeCd, timestamp);
            String newRefreshToken = jwtUtil.generateRefreshToken(userNo, user.getEmail(), userSeCd, timestamp);

            // 새 refreshToken DB 저장
            saveRefreshToken(userNo, newRefreshToken, stored.getDeviceInfo(), stored.getIpAddress());

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("accessToken", newAccessToken);
            result.put("refreshToken", newRefreshToken);

            // Grace Period 캐시에 저장 (10초간 동일 토큰 재요청 시 같은 결과 반환)
            rotationCache.put(tokenHash, result);

            return result;

        } catch (JwtExpiredException e) {
            // 만료된 토큰 DB에서도 정리
            try {
                String tokenHash = hashToken(refreshToken);
                refreshTokenMapper.deleteByTokenHash(tokenHash);
            } catch (Exception ex) {
                log.warn("만료 토큰 정리 실패: {}", ex.getMessage());
            }
            throw new AuthFailedException("refreshToken이 만료되었습니다. 다시 로그인해주세요.");
        } catch (AuthFailedException e) {
            throw e;
        } catch (Exception e) {
            throw new AuthFailedException("토큰 갱신에 실패했습니다.");
        }
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        String tokenHash = hashToken(refreshToken);
        refreshTokenMapper.deleteByTokenHash(tokenHash);
        log.info("로그아웃: refreshToken 삭제");
    }

    @Transactional
    public void revokeAllTokens(Long userNo) {
        refreshTokenMapper.deleteByUserNo(userNo);
        log.info("전체 토큰 삭제: userNo={}", userNo);
    }

    private void saveRefreshToken(Long userNo, String refreshToken,
                                   String deviceInfo, String ipAddress) {
        String tokenHash = hashToken(refreshToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000);

        RefreshToken entity = RefreshToken.builder()
                .userNo(userNo)
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

    @Transactional(readOnly = true)
    public User findUserByUserNo(Long userNo) {
        return userMapper.findByUserNo(userNo);
    }

    @Transactional(readOnly = true)
    public User findUserByEmail(String email) {
        return userMapper.findByEmailAndStatus(email, UserStatus.ACTIVE.name());
    }

}
