package com.vs.meta.domain;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CounselingStudent {

    private Long id;
    private Long counselingId;
    private String stdtId;
    private String stdtName;
    private Integer stdtNumber;
    private String claId;
    private String useYn;
}
