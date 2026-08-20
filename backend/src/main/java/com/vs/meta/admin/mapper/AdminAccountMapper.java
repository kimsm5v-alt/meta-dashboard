package com.vs.meta.admin.mapper;

import com.vs.meta.domain.AdminAccount;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminAccountMapper {

    AdminAccount findByEmail(@Param("email") String email);

    AdminAccount findById(@Param("id") Long id);

    void updateLastLoginAt(@Param("id") Long id);

    void updatePassword(@Param("id") Long id,
                        @Param("password") String encodedPassword);

    // ===== 계정 관리(SUPER_ADMIN) =====

    /** 아이디(email 컬럼) 중복 체크 — 상태 무관 전체. */
    int countByEmail(@Param("email") String email);

    /** 계정 수(이름/아이디 검색). */
    long countAccounts(@Param("keyword") String keyword);

    /** 계정 목록(이름/아이디 검색, id DESC, 페이징). */
    List<AdminAccount> selectAccounts(@Param("keyword") String keyword,
                                      @Param("limit") int limit,
                                      @Param("offset") int offset);

    /** 계정 생성. */
    void insert(AdminAccount account);

    /** 상태 변경(ACTIVE/SUSPENDED). */
    void updateStatus(@Param("id") Long id, @Param("status") String status);

    /** 권한 변경(SUPER_ADMIN/ADMIN). */
    void updateRole(@Param("id") Long id, @Param("role") String role);

    /** 비밀번호 + 변경필요 플래그 동시 갱신(초기화/변경용). */
    void updatePasswordAndFlag(@Param("id") Long id,
                               @Param("password") String encodedPassword,
                               @Param("mustChangePassword") String mustChangePassword);
}
