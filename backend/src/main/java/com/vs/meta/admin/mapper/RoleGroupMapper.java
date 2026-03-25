package com.vs.meta.admin.mapper;

import com.vs.meta.domain.RoleGroup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface RoleGroupMapper {

    List<RoleGroup> findAllOrderByLevelDesc();

    RoleGroup findByRoleCode(@Param("roleCode") String roleCode);

    int findLevelByRoleCode(@Param("roleCode") String roleCode);

    List<RoleGroup> findRolesPaged(@Param("limit") int limit, @Param("offset") int offset);

    long countRoles();

    void upsertRole(RoleGroup roleGroup);
}
