package com.vs.meta.api.memo.mapper;

import com.vs.meta.domain.MemoInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MemoInfoMapper {

    List<MemoInfo> findByStdtIdOrderByMemoDateDesc(@Param("stdtId") String stdtId);

    MemoInfo findMemoById(@Param("id") Long id);

    void insertMemo(MemoInfo memoInfo);

    void updateMemo(MemoInfo memoInfo);

    void deactivateMemoById(@Param("id") Long id, @Param("updatedBy") Long updatedBy);
}
