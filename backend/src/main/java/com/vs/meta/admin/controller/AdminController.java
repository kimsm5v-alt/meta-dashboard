package com.vs.meta.admin.controller;

import com.vs.meta.admin.service.AdminUserService;
import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.school.mapper.SchoolInfoMapper;
import com.vs.meta.api.school.service.SchoolSyncService;
import com.vs.meta.api.school.service.SchoolSyncService.SchoolImportResult;
import com.vs.meta.common.utils.PageUtil;
import com.vs.meta.domain.AuthSchoolMap;
import com.vs.meta.domain.RoleGroup;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminUserService adminUserService;
    private final SchoolInfoMapper schoolInfoMapper;
    private final SchoolSyncService schoolSyncService;
    private final GroupInfoMapper groupInfoMapper;

    private static final int PAGE_SIZE = 20;

    // ===== 로그인 =====

    @GetMapping("/login")
    public String loginPage() {
        return "admin/login";
    }

    // ===== 대시보드 =====

    @GetMapping("/dashboard")
    public String dashboard(Model model, Authentication auth) {
        model.addAttribute("adminId", auth.getName());
        model.addAttribute("userCount", adminUserService.countUsers(null, null, null));
        model.addAttribute("roleCount", adminUserService.countRoles());
        model.addAttribute("schoolCount", schoolInfoMapper.countSchools());
        model.addAttribute("groupCount", groupInfoMapper.countActiveGroups());
        return "admin/dashboard";
    }

    // ===== 사용자 관리 =====

    @GetMapping("/users")
    public String users(@RequestParam(defaultValue = "1") int page,
                        @RequestParam(required = false) String keyword,
                        @RequestParam(required = false) String roleCode,
                        @RequestParam(required = false) String status,
                        Model model) {
        long total = adminUserService.countUsers(keyword, roleCode, status);
        int totalPages = PageUtil.totalPages(total, PAGE_SIZE);
        page = PageUtil.clampPage(page, totalPages);

        model.addAttribute("users", adminUserService.findUsersPaged(keyword, roleCode, status, page, PAGE_SIZE));
        model.addAttribute("roles", adminUserService.findAllRoles());
        model.addAttribute("page", page);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("total", total);
        model.addAttribute("keyword", keyword);
        model.addAttribute("roleCode", roleCode);
        model.addAttribute("status", status);
        return "admin/users";
    }

    @PostMapping("/users/create")
    public String createUser(@RequestParam String email,
                             @RequestParam String password,
                             @RequestParam String nickname,
                             @RequestParam String roleCode,
                             Authentication auth,
                             RedirectAttributes ra) {
        try {
            Long adminUserNo = adminUserService.resolveAdminUserNo(auth.getName());
            adminUserService.createUserByAdmin(password, email, nickname, roleCode, adminUserNo);
            ra.addFlashAttribute("success", "계정 등록 완료: " + email);
        } catch (Exception e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/users";
    }

    @PostMapping("/users/role")
    public String updateRole(@RequestParam Long userNo,
                             @RequestParam String roleCode,
                             Authentication auth,
                             RedirectAttributes ra) {
        try {
            Long adminUserNo = adminUserService.resolveAdminUserNo(auth.getName());
            adminUserService.updateUserRole(userNo, roleCode, adminUserNo);
            ra.addFlashAttribute("success", "역할 변경 완료: userNo=" + userNo + " → " + roleCode);
        } catch (Exception e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/users";
    }

    @PostMapping("/users/status")
    public String updateStatus(@RequestParam Long userNo,
                               @RequestParam String status,
                               Authentication auth,
                               RedirectAttributes ra) {
        try {
            Long adminUserNo = adminUserService.resolveAdminUserNo(auth.getName());
            adminUserService.updateUserStatus(userNo, status, adminUserNo);
            ra.addFlashAttribute("success", "상태 변경 완료: userNo=" + userNo + " → " + status);
        } catch (Exception e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/users";
    }

    // ===== 역할 관리 =====

    @GetMapping("/roles")
    public String roles(@RequestParam(defaultValue = "1") int page, Model model) {
        long total = adminUserService.countRoles();
        int totalPages = PageUtil.totalPages(total, PAGE_SIZE);
        page = PageUtil.clampPage(page, totalPages);

        model.addAttribute("roles", adminUserService.findRolesPaged(page, PAGE_SIZE));
        model.addAttribute("allRoles", adminUserService.findAllRoles());
        model.addAttribute("page", page);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("total", total);
        return "admin/roles";
    }

    @PostMapping("/roles/upsert")
    public String upsertRole(@RequestParam String roleCode,
                              @RequestParam String roleName,
                              @RequestParam int level,
                              @RequestParam(required = false) String description,
                              Authentication auth,
                              RedirectAttributes ra) {
        try {
            Long adminUserNo = adminUserService.resolveAdminUserNo(auth.getName());
            RoleGroup role = RoleGroup.builder()
                    .roleCode(roleCode)
                    .roleName(roleName)
                    .level(level)
                    .description(description)
                    .createdBy(adminUserNo)
                    .build();
            adminUserService.upsertRole(role);
            ra.addFlashAttribute("success", "역할 저장 완료: " + roleCode);
        } catch (Exception e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/roles";
    }

    // ===== 학교 매핑 =====

    @GetMapping("/school-map")
    public String schoolMap(@RequestParam(required = false) Long userNo,
                            @RequestParam(defaultValue = "1") int page,
                            @RequestParam(required = false) String schoolKeyword,
                            @RequestParam(required = false) String schoolLevel,
                            @RequestParam(required = false) String schoolRegion,
                            Model model) {
        // 좌측: 사용자 + 매핑 목록
        List<String> mappedSchoolCodes = List.of();
        if (userNo != null) {
            User user = adminUserService.findUserByUserNo(userNo);
            model.addAttribute("targetUser", user);
            if (user != null) {
                List<AuthSchoolMap> mappings = adminUserService.findSchoolMappings(userNo);
                model.addAttribute("mappings", mappings);
                mappedSchoolCodes = mappings.stream()
                        .map(AuthSchoolMap::getSchoolCode)
                        .collect(Collectors.toList());
            }
        }
        model.addAttribute("searchUserNo", userNo);
        model.addAttribute("mappedSchoolCodes", mappedSchoolCodes);

        // 우측: 학교 페이징 목록
        long total = schoolInfoMapper.countSchoolsPaged(schoolKeyword, schoolLevel, schoolRegion);
        int totalPages = PageUtil.totalPages(total, PAGE_SIZE);
        page = PageUtil.clampPage(page, totalPages);

        model.addAttribute("schools", schoolInfoMapper.findSchoolsPaged(
                schoolKeyword, schoolLevel, schoolRegion,
                PAGE_SIZE, PageUtil.offsetOneIndexed(page, PAGE_SIZE)));
        model.addAttribute("page", page);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("total", total);
        model.addAttribute("schoolKeyword", schoolKeyword);
        model.addAttribute("schoolLevel", schoolLevel);
        model.addAttribute("schoolRegion", schoolRegion);

        return "admin/school-map";
    }

    @PostMapping("/school-map/assign")
    public String assignSchool(@RequestParam Long userNo,
                                @RequestParam("schoolCodes") List<String> schoolCodes,
                                Authentication auth,
                                RedirectAttributes ra) {
        try {
            Long adminUserNo = adminUserService.resolveAdminUserNo(auth.getName());
            int count = adminUserService.assignSchools(userNo, schoolCodes, adminUserNo);
            ra.addFlashAttribute("success", "학교 매핑 완료: userNo=" + userNo + " → " + count + "건");
        } catch (Exception e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/school-map?userNo=" + userNo;
    }

    @PostMapping("/school-map/revoke")
    public String revokeSchoolMappings(@RequestParam Long userNo,
                                        Authentication auth,
                                        RedirectAttributes ra) {
        try {
            Long adminUserNo = adminUserService.resolveAdminUserNo(auth.getName());
            adminUserService.revokeAllSchoolMappings(userNo, adminUserNo);
            ra.addFlashAttribute("success", "학교 매핑 전체 해제: userNo=" + userNo);
        } catch (Exception e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/school-map?userNo=" + userNo;
    }

    @PostMapping("/school-map/revoke-one")
    public String revokeOneSchoolMapping(@RequestParam Long userNo,
                                          @RequestParam String schoolCode,
                                          Authentication auth,
                                          RedirectAttributes ra) {
        try {
            Long adminUserNo = adminUserService.resolveAdminUserNo(auth.getName());
            adminUserService.revokeSchoolMapping(userNo, schoolCode, adminUserNo);
            ra.addFlashAttribute("success", "학교 매핑 해제: " + schoolCode);
        } catch (Exception e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/admin/school-map?userNo=" + userNo;
    }

    // ===== API 기능 테스트 =====

    @GetMapping("/api-test")
    public String apiTest() {
        return "admin/api-test";
    }

    /**
     * 학교명 자동완성 검색 (JSON 응답)
     */
    @GetMapping("/schools/search")
    @ResponseBody
    public List<Map<String, String>> searchSchools(@RequestParam String keyword,
                                                    @RequestParam(required = false) String schoolLevel) {
        return schoolInfoMapper.findByKeyword(keyword, schoolLevel).stream()
                .limit(20)
                .map(s -> {
                    Map<String, String> m = new LinkedHashMap<>();
                    m.put("schoolCode", s.getSchoolCode());
                    m.put("schoolName", s.getSchoolName());
                    m.put("schoolLevel", s.getSchoolLevel() != null ? s.getSchoolLevel() : "");
                    m.put("region", s.getRegion() != null ? s.getRegion() : "");
                    return m;
                })
                .collect(Collectors.toList());
    }

    // ===== 학교 관리 (목록 + CSV 업로드) =====

    @GetMapping("/schools")
    public String schools(@RequestParam(defaultValue = "1") int page,
                          @RequestParam(required = false) String keyword,
                          @RequestParam(required = false) String schoolLevel,
                          @RequestParam(required = false) String region,
                          Model model) {
        long total = schoolInfoMapper.countSchoolsPaged(keyword, schoolLevel, region);
        int totalPages = PageUtil.totalPages(total, PAGE_SIZE);
        page = PageUtil.clampPage(page, totalPages);

        model.addAttribute("schools", schoolInfoMapper.findSchoolsPaged(keyword, schoolLevel, region, PAGE_SIZE, PageUtil.offsetOneIndexed(page, PAGE_SIZE)));
        model.addAttribute("page", page);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("total", total);
        model.addAttribute("keyword", keyword);
        model.addAttribute("schoolLevel", schoolLevel);
        model.addAttribute("region", region);
        return "admin/schools";
    }

    @GetMapping("/school-import")
    public String schoolImport(Model model) {
        model.addAttribute("totalSchools", schoolInfoMapper.countSchools());
        return "admin/school-import";
    }

    @PostMapping("/school-import/upload")
    public String uploadSchoolCsv(@RequestParam("file") MultipartFile file,
                                   RedirectAttributes ra) {
        try {
            SchoolImportResult result = schoolSyncService.importSchools(file);
            ra.addFlashAttribute("success",
                    String.format("업로드 완료 — 파일 데이터: %d건, 반영: %d건, 필터링(초중고 외): %d건, 전체 등록 학교: %d건",
                            result.getReadCount(), result.getUpsertedCount(), result.getFilteredCount(), result.getTotalSchoolCount()));
            if (result.getErrors() != null && !result.getErrors().isEmpty()) {
                ra.addFlashAttribute("importErrors", result.getErrors());
            }
        } catch (Exception e) {
            ra.addFlashAttribute("error", "업로드 실패: " + e.getMessage());
        }
        return "redirect:/admin/school-import";
    }
}
