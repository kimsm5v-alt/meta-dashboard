package com.vs.meta.api.schoolrecord.mapper;

import com.vs.meta.domain.SchoolRecordInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SchoolRecordInfoMapper {

    List<SchoolRecordInfo> findByStdtIdOrderByCreatedAtDesc(@Param("stdtId") String stdtId,
                                                            @Param("tcId") String tcId);

    /** 생기부 작성 고도화: 학생당 1건 작업본 UPSERT(수정 시 직전 문구를 previous_content 로 보존). */
    int upsertSchoolRecordDraft(SchoolRecordInfo record);

    SchoolRecordInfo findSchoolRecordById(@Param("id") Long id);

    void insertSchoolRecord(SchoolRecordInfo info);

    void deactivateSchoolRecordById(@Param("id") Long id, @Param("updatedBy") Long updatedBy);
}
