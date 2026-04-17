package com.vs.meta.api.member.mapper;

import com.vs.meta.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserMapper {

    List<User> findAllUsers();

    List<User> findUsersPaged(@Param("keyword") String keyword, @Param("roleCode") String roleCode,
                              @Param("status") String status, @Param("limit") int limit, @Param("offset") int offset);

    long countUsersPaged(@Param("keyword") String keyword, @Param("roleCode") String roleCode,
                         @Param("status") String status);

    User findByEmailAndStatus(@Param("email") String email, @Param("status") String status);

    User findByEmail(@Param("email") String email);

    User findByUserNo(@Param("userNo") Long userNo);

    void insertUser(User user);

    void updateUser(User user);

    void updatePassword(@Param("userNo") Long userNo,
                        @Param("password") String encodedPassword,
                        @Param("updatedBy") Long updatedBy);
}
