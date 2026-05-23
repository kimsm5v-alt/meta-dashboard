package com.vs.meta.api.member.dto;

import com.vs.meta.common.auth.HasUserInfo;
import lombok.Getter;
import lombok.Setter;

/**
 * GET /member/info 응답 DTO.
 *
 * <p>학심정 자체 서비스 데이터(userNo/roleCode/tcId/stdtId/status)는 user 테이블에서,
 * PII(name/email)는 {@link com.vs.meta.common.auth.UserInfoEnricher} 가 Auth 조회로 채운다.
 */
@Getter
@Setter
public class MemberInfoDto implements HasUserInfo {

    private Long userNo;
    private String spUserId;
    private String name;        // Enricher 채움
    private String email;       // Enricher 채움
    private String roleCode;
    private String tcId;
    private String stdtId;
    private String status;
    private String lastLoginAt;

    @Override
    public String getSpUserId() {
        return spUserId;
    }
}
