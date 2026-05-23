package com.vs.meta.api.member.mapper;

import com.vs.meta.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    User findByUserNo(@Param("userNo") Long userNo);

    User findBySpUserId(@Param("spUserId") String spUserId);

    void insertUser(User user);

    void updateUser(User user);
}
