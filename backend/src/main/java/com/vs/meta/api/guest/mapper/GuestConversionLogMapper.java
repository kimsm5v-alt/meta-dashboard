package com.vs.meta.api.guest.mapper;

import com.vs.meta.domain.GuestConversionLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface GuestConversionLogMapper {

    void insertConversionLog(GuestConversionLog log);
}
