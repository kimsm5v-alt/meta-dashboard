package com.vs.meta.common.security;

import com.vs.meta.common.exception.AuthFailedException;
import com.vs.meta.common.exception.JwtExpiredException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class JwtUtil {

    @Value("${META_API_JWT_SECRET}")
    private String jwtSecret;

    @Value("${META_API_JWT_ACCESS_EXPIRATION_MS:1800000}")
    private long accessExpirationMs;

    @Value("${META_API_JWT_REFRESH_EXPIRATION_MS:1209600000}")
    private long refreshExpirationMs;

    private Key signingKey;

    @PostConstruct
    void init() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("META_API_JWT_SECRET is required.");
        }
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Long userNo, String email, String userSeCd, String timestamp) {
        return generateToken(userNo, email, userSeCd, timestamp, accessExpirationMs);
    }

    public String generateRefreshToken(Long userNo, String email, String userSeCd, String timestamp) {
        return generateToken(userNo, email, userSeCd, timestamp, refreshExpirationMs);
    }

    public Claims getAllClaimsFromToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (ExpiredJwtException e) {
            throw new JwtExpiredException("JWT token has expired.", e);
        } catch (JwtException | IllegalArgumentException e) {
            throw new AuthFailedException("JWT token validation failed.", e);
        }
    }

    public String generateGuestAccessToken(String stdtId, String claId, String email, String timestamp) {
        return generateGuestToken(stdtId, claId, email, timestamp, accessExpirationMs);
    }

    public String generateGuestRefreshToken(String stdtId, String claId, String email, String timestamp) {
        return generateGuestToken(stdtId, claId, email, timestamp, refreshExpirationMs);
    }

    private String generateToken(Long userNo, String email, String userSeCd, String timestamp, long expirationMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("tokenType", "MEMBER");
        claims.put("userNo", userNo);
        claims.put("email", email);
        claims.put("userSeCd", userSeCd);
        claims.put("timestamp", timestamp);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(String.valueOf(userNo))
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    private String generateGuestToken(String stdtId, String claId, String email, String timestamp, long expirationMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("tokenType", "GUEST");
        claims.put("stdtId", stdtId);
        claims.put("claId", claId);
        claims.put("email", email);
        claims.put("timestamp", timestamp);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(stdtId)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }
}
