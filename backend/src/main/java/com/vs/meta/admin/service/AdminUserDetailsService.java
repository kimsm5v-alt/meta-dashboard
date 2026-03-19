package com.vs.meta.admin.service;

import com.vs.meta.admin.mapper.RoleGroupMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.UserStatus;
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

    private final UserMapper userMapper;
    private final RoleGroupMapper roleGroupMapper;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userMapper.findByEmailAndStatus(email, UserStatus.ACTIVE.name());
        if (user == null) {
            throw new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + email);
        }

        // ADMIN 역할만 접근 허용 (level >= 99)
        int level = 0;
        try {
            level = roleGroupMapper.findLevelByRoleCode(user.getRoleCode());
        } catch (Exception ignored) {
        }

        if (level < 99) {
            throw new UsernameNotFoundException("관리자 권한이 없습니다: " + email);
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }
}
