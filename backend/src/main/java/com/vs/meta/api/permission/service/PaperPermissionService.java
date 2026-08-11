package com.vs.meta.api.permission.service;

import com.vs.meta.api.permission.mapper.PaperPermissionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 계정별 검사 유형(paperIdx) 권한 서비스.
 * <ul>
 *   <li>paperIdx=1 종합학습검사 / paperIdx=2 자기조절</li>
 *   <li>독립 권한(둘 다 부여 가능). 기본값: 종합 허용, 자기조절 비허용</li>
 *   <li>account_paper_permission 행이 없으면 기본값으로 간주</li>
 * </ul>
 * "한 종류만 표시"는 FE 토글의 몫이며, 여기서는 유형별 허용 여부만 판정한다(배타 강제 없음).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaperPermissionService {

    public static final String PAPER_COMPREHENSIVE = "1";
    public static final String PAPER_SELFREG = "2";

    private final PaperPermissionMapper paperPermissionMapper;

    /** 계정 권한 조회. @return {comprehensive:boolean, selfreg:boolean} (행 없으면 기본값 적용). */
    @Transactional(readOnly = true)
    public Map<String, Object> getPermissions(long userNo) {
        Map<String, Object> row = paperPermissionMapper.selectByUserNo(userNo);
        // 행 없음 → 기본값(종합 Y, 자기조절 N)
        boolean comprehensive = (row == null) || "Y".equalsIgnoreCase(MapUtils.getString(row, "comprehensiveYn", "Y"));
        boolean selfreg = (row != null) && "Y".equalsIgnoreCase(MapUtils.getString(row, "selfregYn", "N"));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("comprehensive", comprehensive);
        result.put("selfreg", selfreg);
        return result;
    }

    /** 해당 paperIdx 검사 허용 여부. (Phase 2 강제 지점에서 사용) */
    @Transactional(readOnly = true)
    public boolean isAllowed(long userNo, String paperIdx) {
        Map<String, Object> perm = getPermissions(userNo);
        if (PAPER_COMPREHENSIVE.equals(paperIdx)) {
            return Boolean.TRUE.equals(perm.get("comprehensive"));
        }
        if (PAPER_SELFREG.equals(paperIdx)) {
            return Boolean.TRUE.equals(perm.get("selfreg"));
        }
        return false;
    }
}
