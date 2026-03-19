package com.vs.meta.api.school.mapper;

import com.vs.meta.domain.SchoolInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SchoolInfoMapper {

    void upsertSchoolBatch(@Param("list") List<SchoolInfo> list);

    long countSchools();

    int closeSchoolsNotIn(@Param("schoolCodes") List<String> schoolCodes);

    List<SchoolInfo> findByKeyword(@Param("keyword") String keyword, @Param("schoolLevel") String schoolLevel);

    List<SchoolInfo> findSchoolsPaged(@Param("keyword") String keyword, @Param("schoolLevel") String schoolLevel,
                                     @Param("region") String region, @Param("limit") int limit, @Param("offset") int offset);

    long countSchoolsPaged(@Param("keyword") String keyword, @Param("schoolLevel") String schoolLevel,
                           @Param("region") String region);

    boolean existsBySchoolCode(@Param("schoolCode") String schoolCode);
}
