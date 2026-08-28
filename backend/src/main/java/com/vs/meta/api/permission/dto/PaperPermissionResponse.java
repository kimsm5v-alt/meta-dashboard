package com.vs.meta.api.permission.dto;

/**
 * (내) 검사 유형 권한 응답. GET /api/dgnss/paper-permission/me
 * 행 없으면 기본값(종합 허용/자기조절 비허용).
 */
public record PaperPermissionResponse(
        boolean comprehensive,  // paperIdx=1 종합학습검사 허용
        boolean selfreg         // paperIdx=2 자기조절 허용
) {}
