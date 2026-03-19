package com.vs.meta.api.member.mapper;

import com.vs.meta.domain.EmailVerification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface EmailVerificationMapper {

    EmailVerification findLatestByEmail(@Param("email") String email);

    void insertVerification(EmailVerification verification);

    void markVerified(@Param("email") String email);

    void deleteByEmail(@Param("email") String email);
}
