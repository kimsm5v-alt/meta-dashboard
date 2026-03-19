package com.vs.meta.api.member.mapper;

import com.vs.meta.domain.RefreshToken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RefreshTokenMapper {

    void insertRefreshToken(RefreshToken refreshToken);

    RefreshToken findByTokenHash(@Param("tokenHash") String tokenHash);

    void deleteByTokenHash(@Param("tokenHash") String tokenHash);

    void deleteByUserNo(@Param("userNo") Long userNo);

    void deleteExpired();
}
