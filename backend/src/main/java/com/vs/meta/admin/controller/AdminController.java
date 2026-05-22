package com.vs.meta.admin.controller;

import com.vs.meta.admin.mapper.AdminAccountMapper;
import com.vs.meta.api.ai.mapper.AiBugReportMapper;
import com.vs.meta.common.utils.PageUtil;
import com.vs.meta.domain.AdminAccount;
import com.vs.meta.domain.AiBugReport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * Admin Thymeleaf UI — AI 버그리포트 관리 전용.
 * c9b5afe(2026-05-21)에서 전체 admin 폐기 후, 버그리포트 운영 기능만 부활시킨 슬림 버전.
 */
@Slf4j
@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private static final int PAGE_SIZE = 20;

    private final AiBugReportMapper aiBugReportMapper;
    private final AdminAccountMapper adminAccountMapper;

    @GetMapping("/bug-reports")
    public String bugReports(@RequestParam(defaultValue = "1") int page,
                             @RequestParam(required = false) String status,
                             @RequestParam(required = false) String errorType,
                             @RequestParam(required = false) String severity,
                             Model model) {
        long total = aiBugReportMapper.countBugReports(status, errorType, severity);
        int totalPages = PageUtil.totalPages(total, PAGE_SIZE);
        page = PageUtil.clampPage(page, totalPages);

        model.addAttribute("reports", aiBugReportMapper.selectBugReportList(
                status, errorType, severity, PAGE_SIZE, PageUtil.offsetOneIndexed(page, PAGE_SIZE)));
        model.addAttribute("page", page);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("total", total);
        model.addAttribute("status", status);
        model.addAttribute("errorType", errorType);
        model.addAttribute("severity", severity);
        return "admin/bug-reports";
    }

    @GetMapping("/bug-reports/{id}")
    public String bugReportDetail(@PathVariable Long id, Model model) {
        AiBugReport report = aiBugReportMapper.selectBugReportDetail(id);
        if (report == null) {
            return "redirect:/admin/bug-reports";
        }
        model.addAttribute("report", report);
        return "admin/bug-report-detail";
    }

    @PostMapping("/bug-reports/{id}/status")
    public String updateBugReportStatus(@PathVariable Long id,
                                        @RequestParam String status,
                                        @RequestParam(required = false) String resolutionNote,
                                        Authentication auth,
                                        RedirectAttributes ra) {
        try {
            AdminAccount admin = adminAccountMapper.findByEmail(auth.getName());
            if (admin == null) {
                throw new IllegalStateException("관리자 계정을 찾을 수 없습니다: " + auth.getName());
            }
            int affected = aiBugReportMapper.updateBugReportStatus(id, status, resolutionNote, admin.getId());
            if (affected > 0) {
                ra.addFlashAttribute("success", "버그리포트 상태 변경 완료: #" + id + " → " + status);
            } else {
                ra.addFlashAttribute("error", "버그리포트를 찾을 수 없습니다: #" + id);
            }
        } catch (Exception e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/bug-reports/" + id;
    }
}
