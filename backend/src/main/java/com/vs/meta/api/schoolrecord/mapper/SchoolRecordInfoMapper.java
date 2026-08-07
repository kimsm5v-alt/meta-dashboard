package com.vs.meta.api.schoolrecord.mapper;

import com.vs.meta.domain.SchoolRecordInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SchoolRecordInfoMapper {

    List<SchoolRecordInfo> findByStdtIdOrderByCreatedAtDesc(@Param("stdtId") String stdtId,
                                                            @Param("tcId") String tcId);

    /** 생기부 작성 고도화: 학생당 1건 작업본 UPSERT(수정 시 직전 문구를 previous_content 로 보존). */
    int upsertSchoolRecordDraft(SchoolRecordInfo record);

    /** 고도화 리스트 조회(학급 단위, 경량): 학생별 강점/보완 TOP3·상태·최근수정. observation_input 미포함. */
    List<Map<String, Object>> selectDraftListByClass(@Param("claId") String claId,
                                                     @Param("tcId") String tcId);

    /** 고도화 상세 조회(학생 1명): 작업본 전체(관찰입력·문구·이전문구 포함). */
    Map<String, Object> selectDraftByStudent(@Param("stdtId") String stdtId,
                                             @Param("tcId") String tcId);

    SchoolRecordInfo findSchoolRecordById(@Param("id") Long id);

    void insertSchoolRecord(SchoolRecordInfo info);

    void deactivateSchoolRecordById(@Param("id") Long id, @Param("updatedBy") Long updatedBy);
}
