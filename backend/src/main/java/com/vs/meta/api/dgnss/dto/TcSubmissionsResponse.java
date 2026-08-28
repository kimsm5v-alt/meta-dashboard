package com.vs.meta.api.dgnss.dto;

import java.util.List;

/**
 * (교사) 학생 제출 현황 목록 응답. GET /api/dgnss/tc/submissions
 * 학생 이름은 FE 가 stdtId 로 Auth 조회 — 여기서는 식별자/제출정보만.
 */
public record TcSubmissionsResponse(List<Student> students) {

    public record Student(
            String stdtId,
            Integer memberNo,
            String submAt,   // Y / N
            String submDt    // ISO8601(+09:00), 미제출 시 null
    ) {}
}
