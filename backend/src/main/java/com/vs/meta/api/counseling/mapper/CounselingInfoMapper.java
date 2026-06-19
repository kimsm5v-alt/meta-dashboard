package com.vs.meta.api.counseling.mapper;

import com.vs.meta.domain.CounselingInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CounselingInfoMapper {

    /** 본인이 작성한 전체 상담 일정 (tcId 필터). 기존 findAllCounselings 대체. */
    List<CounselingInfo> findByTcIdOrderByScheduledAtDesc(@Param("tcId") String tcId);

    /** 단건 조회 — tcId 검증은 호출자(Service)에서 수행. update/complete/cancel/delete 흐름과 공유. */
    CounselingInfo findCounselingById(@Param("id") Long id);

    List<CounselingInfo> findByClaIdOrderByScheduledAtDesc(@Param("claId") String claId,
                                                          @Param("tcId") String tcId);

    List<CounselingInfo> findByStatusOrderByScheduledAtDesc(@Param("status") String status,
                                                           @Param("tcId") String tcId);

    List<CounselingInfo> findCounselingsByIds(@Param("ids") List<Long> ids,
                                              @Param("tcId") String tcId);

    void insertCounseling(CounselingInfo counselingInfo);

    void updateCounseling(CounselingInfo counselingInfo);

    void deactivateCounselingById(@Param("id") Long id, @Param("updatedBy") Long updatedBy);
}
