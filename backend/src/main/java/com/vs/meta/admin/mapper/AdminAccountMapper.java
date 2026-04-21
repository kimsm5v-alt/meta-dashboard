package com.vs.meta.admin.mapper;

import com.vs.meta.domain.AdminAccount;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AdminAccountMapper {

    AdminAccount findByEmail(@Param("email") String email);

    AdminAccount findById(@Param("id") Long id);

    void updateLastLoginAt(@Param("id") Long id);

    void updatePassword(@Param("id") Long id,
                        @Param("password") String encodedPassword);
}
