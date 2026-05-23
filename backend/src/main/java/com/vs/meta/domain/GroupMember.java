package com.vs.meta.domain;

import com.vs.meta.common.auth.HasUserInfo;
import com.vs.meta.domain.enums.MemberStatus;
import com.vs.meta.domain.enums.MemberType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMember implements HasUserInfo {

    private Long id;
    private Long groupId;
    private Long userNo;
    /** JOIN으로 채워지는 transient 필드 — DB 컬럼 없음. Phase 3 enrich 진입점. */
    private String spUserId;
    private String stdtId;
    private String nickname;
    private String email;
    private MemberType memberType;
    private Integer memberNo;
    private MemberStatus status;
    private LocalDateTime joinedAt;
    private LocalDateTime leftAt;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** HasUserInfo — nickname 필드에 IDP에서 받은 이름을 채운다. */
    @Override
    public void setName(String name) {
        this.nickname = name;
    }

    public void updateStatus(MemberStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
        if (MemberStatus.LEFT == status || MemberStatus.KICKED == status) {
            this.leftAt = LocalDateTime.now();
        }
    }

    public void convertToStudent(Long userNo) {
        this.userNo = userNo;
        this.memberType = MemberType.STUDENT;
        this.updatedAt = LocalDateTime.now();
    }
}
