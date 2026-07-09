package com.vs.meta.admin.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 체험단(교사 18명) 모니터링 전용 매퍼 — 임시 기능.
 * 회원 이름/가입일은 SSO 스키마 {@code superteacher_core.platform_user}(cross-schema),
 * 앱 데이터는 {@code superplatform_meta}. 조인 키: platform_user.public_user_id = user.sp_user_id.
 * ②③④ 는 코호트 교사들의 user_no 목록(host_user_no)을 기준으로 조회한다.
 */
@Mapper
public interface TrialMonitorMapper {

    /**
     * ① 체험단 교사 계정(코호트) 조회.
     * 이름 IN + user_type='TEACHER' + created_at &gt;= signupFrom.
     * 교사 1명이 계정을 여러 개 만든 케이스가 있어 이름당 여러 행이 나올 수 있다.
     * user_no 가 NULL 이면 학심정(superplatform_meta) 미가입 계정.
     */
    List<Map<String, Object>> selectTrialTeacherAccounts(@Param("names") List<String> names,
                                                         @Param("signupFrom") String signupFrom);

    /** ② 교사(host_user_no)들이 생성한 그룹 목록 + 그룹별 학생 수. */
    List<Map<String, Object>> selectGroupsByHostUserNos(@Param("userNos") List<Long> userNos);

    /** ③ 그룹들의 검사(dgnss_info)별 진행 현황 — 총원/제출/이탈/PDF 생성·정상성. */
    List<Map<String, Object>> selectExamProgressByHostUserNos(@Param("userNos") List<Long> userNos);

    /** ④ 검사별 데이터 정합성 — 요인 완전성, LPA status(정상/미지원/누락), 신뢰도 주의. */
    List<Map<String, Object>> selectIntegrityByHostUserNos(@Param("userNos") List<Long> userNos);

    /** ④ LPA 유형 분포 (paperIdx=1 종합검사, COMPLETED 만). */
    List<Map<String, Object>> selectLpaTypeDistribution(@Param("userNos") List<Long> userNos);
}
