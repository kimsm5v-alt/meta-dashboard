package com.vs.meta.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleGroup {

    private String roleCode;
    private String roleName;
    private Integer level;
    private String description;
    private Long createdBy;
    private LocalDateTime createdAt;
}
