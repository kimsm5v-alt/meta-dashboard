package com.vs.meta.domain;

import com.vs.meta.domain.enums.MemberStatus;
import com.vs.meta.domain.enums.MemberType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMember {

    private Long id;
    private Long groupId;
    private Long userNo;
    private String stdtId;
    private String nickname;
    private String gender;
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
