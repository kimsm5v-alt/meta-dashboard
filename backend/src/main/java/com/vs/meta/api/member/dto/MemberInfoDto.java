package com.vs.meta.api.member.dto;

import com.vs.meta.common.auth.HasUserInfo;
import lombok.Getter;
import lombok.Setter;

/**
 * GET /member/info 응답 DTO.
 *
 * <p>학심정 자체 서비스 데이터(userNo/roleCode/tcId/stdtId/status/lastLoginAt 등)는 user 테이블에서,
 * PII(nickname/email)는 {@link com.vs.meta.common.auth.UserInfoEnricher} 가 Auth 조회로 채운다.
 *
 * <p>응답 필드명은 기존 Map 응답과의 FE 호환성을 위해 그대로 유지 (`nickname` 키 보존).
 * Enricher 의 {@link #setName(String)} 은 Auth 의 name 을 학심정 응답 `nickname` 필드로 매핑.
 */
@Getter
@Setter
public class MemberInfoDto implements HasUserInfo {

    private Long userNo;
    private String spUserId;
    private String nickname;    // Enricher.setName(Auth.name) 으로 채움 — FE 호환성 위해 키 이름 유지
    private String email;       // Enricher.setEmail(Auth.email) 으로 채움
    private String roleCode;
    private String tcId;
    private String stdtId;
    private String status;
    private String lastLoginAt;
    private String createdAt;
    private String updatedAt;

    /** HasUserInfo: Auth name → nickname 필드 매핑 (응답 키 호환성). */
    @Override
    public void setName(String name) {
        this.nickname = name;
    }
}
