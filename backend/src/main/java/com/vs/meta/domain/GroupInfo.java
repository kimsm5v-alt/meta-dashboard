package com.vs.meta.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupInfo {

    private Long groupId;
    private String claId;
    /** Auth(IDP) group_info.id — 동기화 upsert 키. NULL=학심정 자체 생성(레거시) (group-from-idp) */
    private Long spGroupId;
    private Long hostUserNo;
    private String groupNm;
    private String groupDesc;
    private String schoolLevel;
    private String grade;
    private Integer classNumber;
    /** 과목 (Auth 자유텍스트, 표시용) (group-from-idp) */
    private String subject;
    private String schoolCode;
    private String schoolName;
    private String inviteCode;
    private String inviteLinkToken;
    private Integer maxMemberCount;
    private String useYn;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void updateGroupInfo(String groupNm, String groupDesc, String schoolName) {
        if (groupNm != null && !groupNm.isBlank()) {
            this.groupNm = groupNm;
        }
        if (groupDesc != null) {
            this.groupDesc = groupDesc;
        }
        if (schoolName != null) {
            this.schoolName = schoolName;
        }
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.useYn = "N";
        this.updatedAt = LocalDateTime.now();
    }
}
