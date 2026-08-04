package com.vs.meta.admin.controller;

import com.vs.meta.admin.mapper.AdminAccountMapper;
import com.vs.meta.admin.mapper.CoachingAdminMapper;
import com.vs.meta.admin.service.CoachingAdminService;
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
 * 성장코칭 admin — 개인화 강점/보완점 코칭 문구 편집.
 * RDB(coaching_strength/coaching_moderation) 기준 조회·수정, 수정 시 이력 스냅샷, 이력 조회·롤백.
 */
@Slf4j
@Controller
@RequestMapping("/admin/coaching")
@RequiredArgsConstructor
public class CoachingAdminController {

    private static final int PAGE_SIZE = 20;

    private final CoachingAdminMapper mapper;
    private final CoachingAdminService coachingAdminService;
    private final AdminAccountMapper adminAccountMapper;

    // ===================== 강점 =====================

    @GetMapping("/strength")
    public String strength(@RequestParam(defaultValue = "1") int page,
                           @RequestParam(required = false) String schoolLevel,
                           @RequestParam(required = false) String lpaClass,
                           @RequestParam(required = false) String factor,
                           Model model) {
        long total = mapper.countStrength(schoolLevel, lpaClass, factor);
        int totalPages = PageUtil.totalPages(total, PAGE_SIZE);
        page = PageUtil.clampPage(page, totalPages);

        model.addAttribute("rows", mapper.selectStrengthList(
                schoolLevel, lpaClass, factor, PAGE_SIZE, PageUtil.offsetOneIndexed(page, PAGE_SIZE)));
        model.addAttribute("classOptions", mapper.selectStrengthLpaClasses());
        model.addAttribute("page", page);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("total", total);
        model.addAttribute("schoolLevel", schoolLevel);
        model.addAttribute("lpaClass", lpaClass);
        model.addAttribute("factor", factor);
        model.addAttribute("params", buildStrengthParams(schoolLevel, lpaClass, factor));
        return "admin/coaching-strength";
    }

    @PostMapping("/strength/{id}")
    public String updateStrength(@PathVariable long id,
                                 @RequestParam String observation,
                                 @RequestParam(name = "line") String line,
                                 @RequestParam String question,
                                 @RequestParam(required = false) String backParams,
                                 Authentication auth,
                                 RedirectAttributes ra) {
        try {
            coachingAdminService.updateStrength(id, observation, line, question, resolveAdminId(auth));
            ra.addFlashAttribute("success", "강점 코칭 수정 완료: #" + id);
        } catch (Exception e) {
            log.error("강점 코칭 수정 실패. id={}", id, e);
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/coaching/strength" + firstPage(backParams);
    }

    @GetMapping("/strength/{id}/history")
    public String strengthHistory(@PathVariable long id, Model model) {
        model.addAttribute("item", mapper.selectStrengthById(id));
        model.addAttribute("history", mapper.selectStrengthHistory(id));
        model.addAttribute("type", "strength");
        return "admin/coaching-history";
    }

    @PostMapping("/strength/history/{historyId}/rollback")
    public String rollbackStrength(@PathVariable long historyId, Authentication auth, RedirectAttributes ra) {
        try {
            long id = coachingAdminService.rollbackStrength(historyId, resolveAdminId(auth));
            ra.addFlashAttribute("success", "강점 코칭 롤백 완료");
            return "redirect:/admin/coaching/strength/" + id + "/history";
        } catch (Exception e) {
            log.error("강점 코칭 롤백 실패. historyId={}", historyId, e);
            ra.addFlashAttribute("error", e.getMessage());
            return "redirect:/admin/coaching/strength";
        }
    }

    // ===================== 보완점 =====================

    @GetMapping("/moderation")
    public String moderation(@RequestParam(defaultValue = "1") int page,
                             @RequestParam(required = false) String schoolLevel,
                             @RequestParam(required = false) String lpaClass,
                             @RequestParam(required = false) String keyword,
                             Model model) {
        long total = mapper.countModeration(schoolLevel, lpaClass, keyword);
        int totalPages = PageUtil.totalPages(total, PAGE_SIZE);
        page = PageUtil.clampPage(page, totalPages);

        model.addAttribute("rows", mapper.selectModerationList(
                schoolLevel, lpaClass, keyword, PAGE_SIZE, PageUtil.offsetOneIndexed(page, PAGE_SIZE)));
        model.addAttribute("classOptions", mapper.selectModerationLpaClasses());
        model.addAttribute("page", page);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("total", total);
        model.addAttribute("schoolLevel", schoolLevel);
        model.addAttribute("lpaClass", lpaClass);
        model.addAttribute("keyword", keyword);
        model.addAttribute("params", buildModerationParams(schoolLevel, lpaClass, keyword));
        return "admin/coaching-moderation";
    }

    @PostMapping("/moderation/{id}")
    public String updateModeration(@PathVariable long id,
                                   @RequestParam String interpretation,
                                   @RequestParam String coaching1Method,
                                   @RequestParam String coaching1Line,
                                   @RequestParam String coaching2Action,
                                   @RequestParam String coaching2Line,
                                   @RequestParam(required = false) String backParams,
                                   Authentication auth,
                                   RedirectAttributes ra) {
        try {
            coachingAdminService.updateModeration(id, interpretation, coaching1Method, coaching1Line,
                    coaching2Action, coaching2Line, resolveAdminId(auth));
            ra.addFlashAttribute("success", "보완점 코칭 수정 완료: #" + id);
        } catch (Exception e) {
            log.error("보완점 코칭 수정 실패. id={}", id, e);
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/coaching/moderation" + firstPage(backParams);
    }

    @GetMapping("/moderation/{id}/history")
    public String moderationHistory(@PathVariable long id, Model model) {
        model.addAttribute("item", mapper.selectModerationById(id));
        model.addAttribute("history", mapper.selectModerationHistory(id));
        model.addAttribute("type", "moderation");
        return "admin/coaching-history";
    }

    @PostMapping("/moderation/history/{historyId}/rollback")
    public String rollbackModeration(@PathVariable long historyId, Authentication auth, RedirectAttributes ra) {
        try {
            long id = coachingAdminService.rollbackModeration(historyId, resolveAdminId(auth));
            ra.addFlashAttribute("success", "보완점 코칭 롤백 완료");
            return "redirect:/admin/coaching/moderation/" + id + "/history";
        } catch (Exception e) {
            log.error("보완점 코칭 롤백 실패. historyId={}", historyId, e);
            ra.addFlashAttribute("error", e.getMessage());
            return "redirect:/admin/coaching/moderation";
        }
    }

    // ===================== helpers =====================

    private long resolveAdminId(Authentication auth) {
        AdminAccount admin = adminAccountMapper.findByEmail(auth.getName());
        if (admin == null) {
            throw new IllegalStateException("관리자 계정을 찾을 수 없습니다: " + auth.getName());
        }
        return admin.getId();
    }

    /** 수정 후 필터 유지용: backParams("&k=v...") 를 그대로 붙여 목록으로 복귀(1페이지). */
    private String firstPage(String backParams) {
        return StringUtils.isBlank(backParams) ? "" : ("?page=1" + backParams);
    }

    private String buildStrengthParams(String schoolLevel, String lpaClass, String factor) {
        StringBuilder sb = new StringBuilder();
        appendParam(sb, "schoolLevel", schoolLevel);
        appendParam(sb, "lpaClass", lpaClass);
        appendParam(sb, "factor", factor);
        return sb.toString();
    }

    private String buildModerationParams(String schoolLevel, String lpaClass, String keyword) {
        StringBuilder sb = new StringBuilder();
        appendParam(sb, "schoolLevel", schoolLevel);
        appendParam(sb, "lpaClass", lpaClass);
        appendParam(sb, "keyword", keyword);
        return sb.toString();
    }

    private void appendParam(StringBuilder sb, String key, String value) {
        if (StringUtils.isNotBlank(value)) {
            sb.append('&').append(key).append('=')
              .append(URLEncoder.encode(value, StandardCharsets.UTF_8));
        }
    }
}
