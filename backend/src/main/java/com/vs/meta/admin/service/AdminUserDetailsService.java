package com.vs.meta.admin.service;

import com.vs.meta.admin.mapper.AdminAccountMapper;
import com.vs.meta.domain.AdminAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminAccountMapper adminAccountMapper;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AdminAccount admin = adminAccountMapper.findByEmail(email);
        if (admin == null) {
            throw new UsernameNotFoundException("관리자 계정을 찾을 수 없습니다: " + email);
        }

        // role 컬럼 기반 권한 부여 (미설정 시 ADMIN). SUPER_ADMIN > ADMIN 계층은 SecurityConfig 의 RoleHierarchy 로 처리.
        String role = admin.getRole();
        if (role == null || role.isBlank()) {
            role = "ADMIN";
        }
        return new org.springframework.security.core.userdetails.User(
                admin.getEmail(),
                admin.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }
}
