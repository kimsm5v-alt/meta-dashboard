package com.vs.meta.api.sso.mapper;

import com.vs.meta.domain.SsoPollCursor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface SsoPollCursorMapper {

    /** feed_type 으로 커서 조회. 없으면 null (DDL 초기 INSERT 가 안 된 경우). */
    SsoPollCursor findByFeedType(@Param("feedType") String feedType);

    /** 폴링 성공 후 커서 전진 — last_since 갱신 + 모니터링 메타 기록. */
    int updateCursor(@Param("feedType") String feedType,
                     @Param("lastSince") LocalDateTime lastSince,
                     @Param("lastPolledAt") LocalDateTime lastPolledAt,
                     @Param("lastItemCount") int lastItemCount);
}
