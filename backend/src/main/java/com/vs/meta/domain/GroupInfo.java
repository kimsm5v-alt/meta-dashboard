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
    private Long hostUserNo;
    private String groupNm;
    private String groupDesc;
    private String schoolLevel;
    private String grade;
    private Integer classNumber;
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
