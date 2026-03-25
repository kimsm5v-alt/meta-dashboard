package com.vs.meta.api.counseling.mapper;

import com.vs.meta.domain.CounselingStudent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CounselingStudentMapper {

    List<Long> findCounselingIdsByStdtId(@Param("stdtId") String stdtId);

    List<CounselingStudent> findByCounselingId(@Param("counselingId") Long counselingId);

    List<CounselingStudent> findByCounselingIds(@Param("counselingIds") List<Long> counselingIds);

    void insertCounselingStudents(@Param("list") List<CounselingStudent> students);

    void deactivateByCounselingId(@Param("counselingId") Long counselingId);
}
