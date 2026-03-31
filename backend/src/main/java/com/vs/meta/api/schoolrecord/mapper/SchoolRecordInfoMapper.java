package com.vs.meta.api.schoolrecord.mapper;

import com.vs.meta.domain.SchoolRecordInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SchoolRecordInfoMapper {

    List<SchoolRecordInfo> findByStdtIdOrderByCreatedAtDesc(@Param("stdtId") String stdtId);

    SchoolRecordInfo findSchoolRecordById(@Param("id") Long id);

    void insertSchoolRecord(SchoolRecordInfo info);

    void deactivateSchoolRecordById(@Param("id") Long id, @Param("updatedBy") Long updatedBy);
}
