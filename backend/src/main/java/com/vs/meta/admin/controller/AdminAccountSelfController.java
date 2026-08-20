package com.vs.meta.admin.controller;

import com.vs.meta.admin.mapper.AdminAccountMapper;
import com.vs.meta.domain.AdminAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * 관리자 본인 비밀번호 변경(모든 admin). 최초/초기화 후 강제변경의 대상 페이지.
 * 변경 성공 시 must_change_password='N' 으로 갱신되어 인터셉터 게이트가 해제된다.
 */
@Slf4j
@Controller
@RequestMapping("/admin/account")
@RequiredArgsConstructor
public class AdminAccountSelfController {

    private static final int MIN_LENGTH = 8;

    private final AdminAccountMapper adminAccountMapper;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/password")
    public String changeForm(Authentication auth, Model model) {
        AdminAccount me = adminAccountMapper.findByEmail(auth.getName());
        model.addAttribute("mustChange", me != null && "Y".equalsIgnoreCase(me.getMustChangePassword()));
        return "admin/account-password";
    }

    @PostMapping("/password")
    public String changeSubmit(@RequestParam String currentPassword,
                               @RequestParam String newPassword,
                               @RequestParam String confirmPassword,
                               Authentication auth,
                               RedirectAttributes ra) {
        try {
            AdminAccount me = adminAccountMapper.findByEmail(auth.getName());
            if (me == null) {
                throw new IllegalStateException("계정을 찾을 수 없습니다.");
            }
            if (!passwordEncoder.matches(currentPassword, me.getPassword())) {
                throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
            }
            validateNewPassword(currentPassword, newPassword, confirmPassword);

            adminAccountMapper.updatePasswordAndFlag(me.getId(), passwordEncoder.encode(newPassword), "N");
            log.info("[AdminAccount] 본인 비밀번호 변경: id={}", me.getId());
            ra.addFlashAttribute("success", "비밀번호가 변경되었습니다.");
            return "redirect:/admin/bug-reports";
        } catch (Exception e) {
            ra.addFlashAttribute("error", e.getMessage());
            return "redirect:/admin/account/password";
        }
    }

    private void validateNewPassword(String current, String newPw, String confirm) {
        if (StringUtils.isBlank(newPw)) {
            throw new IllegalArgumentException("새 비밀번호를 입력해 주세요.");
        }
        if (newPw.length() < MIN_LENGTH) {
            throw new IllegalArgumentException("비밀번호는 " + MIN_LENGTH + "자 이상이어야 합니다.");
        }
        if (!newPw.equals(confirm)) {
            throw new IllegalArgumentException("새 비밀번호가 일치하지 않습니다.");
        }
        if (newPw.equals(current)) {
            throw new IllegalArgumentException("현재 비밀번호와 다르게 설정해 주세요.");
        }
    }
}
