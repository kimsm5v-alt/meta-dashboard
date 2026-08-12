package com.vs.meta.admin.service;

import com.vs.meta.admin.mapper.PaperPermissionAdminMapper;
import com.vs.meta.common.auth.PersonInfoClient;
import com.vs.meta.common.auth.UserInfo;
import com.vs.meta.common.auth.UserSearchResult;
import com.vs.meta.common.utils.PageUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 검사 유형 권한 admin 목록 조회.
 * <ul>
 *   <li>검색어 없음: 로컬 교사 계정을 idx(user_no) DESC 로 페이징 → 그 페이지 sp_user_id 로 Auth batch(이름/이메일).</li>
 *   <li>검색어 있음: Auth 검색(이름·이메일·닉네임 부분일치, 가입최신순) → 로컬 교사와 교집합 → Auth batch(이메일).</li>
 * </ul>
 * 권한(account_paper_permission)은 user_no 기준이라 항상 로컬 교사 계정으로 한정한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaperPermissionAdminService {

    private final PaperPermissionAdminMapper mapper;
    private final PersonInfoClient personInfoClient;

    /** 목록 조회 결과(뷰 렌더용). rows 는 template 이 읽는 map 리스트. */
    public record PageView(List<Map<String, Object>> rows, int page, int totalPages, long total) {}

    public PageView list(String keyword, int page, int pageSize) {
        return StringUtils.isBlank(keyword)
                ? listLocal(page, pageSize)
                : listSearch(keyword.trim(), page, pageSize);
    }

    /** 기본 목록 — 로컬 교사 계정 idx DESC 페이징. */
    private PageView listLocal(int page, int pageSize) {
        long total = mapper.countTeachers();
        int totalPages = PageUtil.totalPages(total, pageSize);
        page = PageUtil.clampPage(page, totalPages);

        List<Map<String, Object>> teachers =
                mapper.selectTeacherPage(pageSize, PageUtil.offsetOneIndexed(page, pageSize));

        List<String> spUserIds = teachers.stream()
                .map(t -> MapUtils.getString(t, "spUserId"))
                .filter(StringUtils::isNotBlank)
                .toList();
        Map<String, UserInfo> info = personInfoClient.getBatch(spUserIds);

        List<Map<String, Object>> rows = teachers.stream()
                .map(t -> toRow(t, info.get(MapUtils.getString(t, "spUserId"))))
                .toList();
        return new PageView(rows, page, totalPages, total);
    }

    /** 검색 모드 — Auth 검색(가입최신순) → 로컬 교사 교집합 → 이메일 batch. */
    private PageView listSearch(String keyword, int page, int pageSize) {
        int authPage = Math.max(0, page - 1); // Auth 검색은 0-based
        UserSearchResult sr = personInfoClient.search(keyword, "ACTIVE", authPage, pageSize);

        List<String> ids = sr.items().stream()
                .map(UserSearchResult.Item::publicUserId)
                .filter(StringUtils::isNotBlank)
                .toList();

        if (ids.isEmpty()) {
            return new PageView(List.of(), page, Math.max(sr.totalPages(), 1), sr.totalElements());
        }

        // 로컬 교사 교집합(권한 대상은 user_no 보유 교사만)
        Map<String, Map<String, Object>> localBySp = new HashMap<>();
        for (Map<String, Object> t : mapper.selectTeachersBySpUserIds(ids)) {
            localBySp.put(MapUtils.getString(t, "spUserId"), t);
        }
        // 이메일은 검색 응답에 없으므로 batch 로 보강
        Map<String, UserInfo> info = personInfoClient.getBatch(ids);

        List<Map<String, Object>> rows = new ArrayList<>();
        for (UserSearchResult.Item item : sr.items()) {   // 검색 순서(가입최신순) 유지
            Map<String, Object> local = localBySp.get(item.publicUserId());
            if (local == null) {
                continue; // 우리 시스템 교사(user_no) 아님 → 권한 관리 대상 아님
            }
            rows.add(toRow(local, info.get(item.publicUserId())));
        }
        // 검색 모드 페이징/총계는 Auth 기준(교집합 필터로 페이지 내 건수는 줄 수 있음)
        return new PageView(rows, page, Math.max(sr.totalPages(), 1), sr.totalElements());
    }

    /**
     * 로컬 교사 행 + Auth 회원정보(이름/이메일) 병합.
     * PII 미제공 시 사유별(미동의/탈퇴중/조회불가) 라벨·뱃지색을 함께 실어 준다.
     */
    private Map<String, Object> toRow(Map<String, Object> local, UserInfo info) {
        boolean piiAvailable = info != null && !info.placeholder()
                && "NONE".equalsIgnoreCase(info.maskedReason())
                && StringUtils.isNotBlank(info.name());

        String reason;
        if (piiAvailable) {
            reason = "NONE";
        } else if (info == null || info.placeholder()) {
            reason = "NOT_FOUND"; // notFound(다른 RP/삭제) 또는 호출 실패(장애 폴백)
        } else {
            String r = info.maskedReason();
            reason = (StringUtils.isNotBlank(r) && !"NONE".equalsIgnoreCase(r)) ? r.toUpperCase() : "NOT_FOUND";
        }

        Map<String, Object> row = new HashMap<>(local);
        row.put("piiAvailable", piiAvailable);
        row.put("name", piiAvailable ? info.name() : null);
        row.put("email", (piiAvailable && StringUtils.isNotBlank(info.email())) ? info.email() : null);
        row.put("maskedReason", reason);

        if (!piiAvailable) {
            String label, badge, tip;
            switch (reason) {
                case "NOT_CONSENTED" -> { label = "미동의";   badge = "badge-warning";   tip = "학심정 계정은 있으나 개인정보 제공에 미동의한 계정"; }
                case "WITHDRAWN"     -> { label = "탈퇴중";   badge = "badge-secondary"; tip = "탈퇴 grace(30일) 진행 중 — 개인정보 마스킹"; }
                default              -> { label = "조회불가"; badge = "badge-danger";    tip = "Auth 미조회(다른 RP/삭제) 또는 회원정보 서비스 일시 오류"; }
            }
            row.put("reasonLabel", label);
            row.put("reasonBadge", badge);
            row.put("reasonTip", tip);
        }
        return row;
    }
}
