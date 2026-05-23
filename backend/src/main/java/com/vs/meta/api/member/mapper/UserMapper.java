package com.vs.meta.api.member.mapper;

import com.vs.meta.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    User findByEmailAndStatus(@Param("email") String email, @Param("status") String status);

    User findByEmail(@Param("email") String email);

    User findByUserNo(@Param("userNo") Long userNo);

    User findBySpUserId(@Param("spUserId") String spUserId);

    void insertUser(User user);

    void updateUser(User user);
}
