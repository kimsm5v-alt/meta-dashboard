package com.vs.meta.domain;

import com.vs.meta.common.auth.HasUserInfo;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CounselingStudent implements HasUserInfo {

    private Long id;
    private Long counselingId;
    private String stdtId;
    /** Transient — DB 컬럼 없음 (Phase 4 DROP). UserInfoEnricher가 IDP에서 채운다. */
    private transient String stdtName;
    private Integer stdtNumber;
    private String claId;
    /** JOIN으로 채워지는 transient 필드 — DB 컬럼 없음. Phase 3 enrich 진입점. */
    private String spUserId;
    private String useYn;

    /** HasUserInfo — transient stdtName 필드에 IDP에서 받은 이름을 채운다. */
    @Override
    public void setName(String name) {
        this.stdtName = name;
    }

    @Override
    public void setEmail(String email) {
        // no-op — counseling student response doesn't need email
    }
}
