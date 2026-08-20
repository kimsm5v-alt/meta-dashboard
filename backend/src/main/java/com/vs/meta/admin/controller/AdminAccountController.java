package com.vs.meta.admin.controller;

import com.vs.meta.admin.mapper.AdminAccountMapper;
import com.vs.meta.admin.service.AdminAccountService;
import com.vs.meta.common.utils.PageUtil;
import com.vs.meta.domain.AdminAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 관리자 계정 관리 페이지(SUPER_ADMIN 전용 — SecurityConfig 에서 /admin/accounts/** 경로 제한).
 * 목록/생성/비밀번호 초기화/상태·권한 변경.
 */
@Slf4j
@Controller
@RequestMapping("/admin/accounts")
@RequiredArgsConstructor
public class AdminAccountController {

    private static final int PAGE_SIZE = 10;

    private final AdminAccountMapper mapper;
    private final AdminAccountService service;

    @GetMapping
    public String list(@RequestParam(defaultValue = "1") int page,
                       @RequestParam(required = false) String keyword,
                       Authentication auth,
                       Model model) {
        long total = mapper.countAccounts(keyword);
        int totalPages = PageUtil.totalPages(total, PAGE_SIZE);
        page = PageUtil.clampPage(page, totalPages);

        model.addAttribute("rows", mapper.selectAccounts(keyword, PAGE_SIZE, PageUtil.offsetOneIndexed(page, PAGE_SIZE)));
        model.addAttribute("page", page);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("total", total);
        model.addAttribute("keyword", keyword);
        model.addAttribute("params", buildParams(keyword));
        model.addAttribute("currentAdminId", actorId(auth));
        return "admin/accounts";
    }

    @PostMapping
    public String create(@RequestParam String loginId,
                         @RequestParam String nickname,
                         @RequestParam String role,
                         RedirectAttributes ra) {
        try {
            service.create(loginId, nickname, role);
            ra.addFlashAttribute("success",
                    "계정 생성 완료: " + loginId + " (임시비밀번호: " + AdminAccountService.tempPasswordOf(loginId) + " · 최초 로그인 시 변경 필요)");
        } catch (Exception e) {
            log.warn("관리자 계정 생성 실패. loginId={}", loginId, e);
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/accounts";
    }

    @PostMapping("/{id}/reset-password")
    public String resetPassword(@PathVariable Long id, RedirectAttributes ra) {
        try {
            String tempPassword = service.resetPassword(id);
            ra.addFlashAttribute("success", "비밀번호 초기화 완료. 임시비밀번호: " + tempPassword + " (최초 로그인 시 변경 필요)");
        } catch (Exception e) {
            log.warn("관리자 비밀번호 초기화 실패. id={}", id, e);
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/accounts";
    }

    @PostMapping("/{id}/status")
    public String updateStatus(@PathVariable Long id, @RequestParam String status,
                               Authentication auth, RedirectAttributes ra) {
        try {
            service.updateStatus(id, status, actorId(auth));
            ra.addFlashAttribute("success", "상태 변경 완료");
        } catch (Exception e) {
            log.warn("관리자 상태 변경 실패. id={}", id, e);
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/accounts";
    }

    @PostMapping("/{id}/role")
    public String updateRole(@PathVariable Long id, @RequestParam String role,
                             Authentication auth, RedirectAttributes ra) {
        try {
            service.updateRole(id, role, actorId(auth));
            ra.addFlashAttribute("success", "권한 변경 완료");
        } catch (Exception e) {
            log.warn("관리자 권한 변경 실패. id={}", id, e);
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/accounts";
    }

    private Long actorId(Authentication auth) {
        AdminAccount me = mapper.findByEmail(auth.getName());
        return me != null ? me.getId() : null;
    }

    private String buildParams(String keyword) {
        if (StringUtils.isBlank(keyword)) {
            return "";
        }
        return "&keyword=" + URLEncoder.encode(keyword, StandardCharsets.UTF_8);
    }
}
