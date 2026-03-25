package com.vs.meta.admin.mapper;

import com.vs.meta.domain.AuthSchoolMap;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AuthSchoolMapMapper {

    List<AuthSchoolMap> findActiveByUserNo(@Param("userNo") Long userNo);

    void revokeAllByUserNo(@Param("userNo") Long userNo, @Param("updatedBy") Long updatedBy);

    void upsertAuthSchoolMap(AuthSchoolMap authSchoolMap);

    void revokeByUserNoAndSchoolCode(@Param("userNo") Long userNo,
                                      @Param("schoolCode") String schoolCode,
                                      @Param("updatedBy") Long updatedBy);
}
