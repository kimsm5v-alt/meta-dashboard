package com.vs.meta.admin.controller;

import com.vs.meta.admin.mapper.AdminAccountMapper;
import com.vs.meta.admin.mapper.PaperPermissionAdminMapper;
import com.vs.meta.admin.service.PaperPermissionAdminService;
import com.vs.meta.domain.AdminAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * 검사 유형(paperIdx) 권한 admin — 교사 계정별 종합학습검사/자기조절 허용 여부 관리.
 * 목록은 SSO(superteacher_core.platform_user) 이름/이메일 cross-schema 조인, 권한 행 없으면 기본값 종합만.
 * 체크박스 변경 즉시 AJAX UPSERT (별도 저장 버튼/이력 없음).
 */
@Slf4j
@Controller
@RequestMapping("/admin/paper-permissions")
@RequiredArgsConstructor
public class PaperPermissionAdminController {

    private static final int PAGE_SIZE = 10;

    private final PaperPermissionAdminMapper mapper;
    private final PaperPermissionAdminService service;
    private final AdminAccountMapper adminAccountMapper;

    @GetMapping
    public String list(@RequestParam(defaultValue = "1") int page,
                       @RequestParam(required = false) String keyword,
                       Model model) {
        PaperPermissionAdminService.PageView view = service.list(keyword, page, PAGE_SIZE);
        model.addAttribute("rows", view.rows());
        model.addAttribute("page", view.page());
        model.addAttribute("totalPages", view.totalPages());
        model.addAttribute("total", view.total());
        model.addAttribute("keyword", keyword);
        model.addAttribute("searchMode", StringUtils.isNotBlank(keyword));
        model.addAttribute("params", buildParams(keyword));
        return "admin/paper-permissions";
    }

    /** 체크박스 즉시 반영: 종합/자기조절 두 플래그를 함께 UPSERT. AJAX(JSON). */
    @PostMapping("/{userNo}")
    @ResponseBody
    public Map<String, Object> update(@PathVariable long userNo,
                                      @RequestParam boolean comprehensive,
                                      @RequestParam boolean selfreg,
                                      Authentication auth) {
        Map<String, Object> res = new HashMap<>();
        try {
            long adminId = resolveAdminId(auth);
            mapper.upsertPaperPermission(userNo,
                    comprehensive ? "Y" : "N",
                    selfreg ? "Y" : "N",
                    adminId);
            res.put("success", true);
            res.put("userNo", userNo);
            res.put("comprehensive", comprehensive);
            res.put("selfreg", selfreg);
        } catch (Exception e) {
            log.error("검사 권한 수정 실패. userNo={}", userNo, e);
            res.put("success", false);
            res.put("message", e.getMessage());
        }
        return res;
    }

    private long resolveAdminId(Authentication auth) {
        AdminAccount admin = adminAccountMapper.findByEmail(auth.getName());
        if (admin == null) {
            throw new IllegalStateException("관리자 계정을 찾을 수 없습니다: " + auth.getName());
        }
        return admin.getId();
    }

    private String buildParams(String keyword) {
        if (StringUtils.isBlank(keyword)) {
            return "";
        }
        return "&keyword=" + URLEncoder.encode(keyword, StandardCharsets.UTF_8);
    }
}
