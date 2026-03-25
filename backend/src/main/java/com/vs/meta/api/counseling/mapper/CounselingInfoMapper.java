package com.vs.meta.api.counseling.mapper;

import com.vs.meta.domain.CounselingInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CounselingInfoMapper {

    List<CounselingInfo> findAllCounselings();

    CounselingInfo findCounselingById(@Param("id") Long id);

    List<CounselingInfo> findByClaIdOrderByScheduledAtDesc(@Param("claId") String claId);

    List<CounselingInfo> findByStatusOrderByScheduledAtDesc(@Param("status") String status);

    List<CounselingInfo> findCounselingsByIds(@Param("ids") List<Long> ids);

    void insertCounseling(CounselingInfo counselingInfo);

    void updateCounseling(CounselingInfo counselingInfo);

    void deactivateCounselingById(@Param("id") Long id, @Param("updatedBy") Long updatedBy);
}
