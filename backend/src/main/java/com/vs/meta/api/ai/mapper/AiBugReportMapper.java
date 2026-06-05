package com.vs.meta.api.ai.mapper;

import com.vs.meta.domain.AiBugReport;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AiBugReportMapper {

    void insertBugReport(AiBugReport bugReport);

    AiBugReport selectBugReportById(@Param("id") Long id);

    AiBugReport selectBugReportDetail(@Param("id") Long id);

    List<AiBugReport> selectBugReportList(@Param("status") String status,
                                          @Param("errorType") String errorType,
                                          @Param("severity") String severity,
                                          @Param("limit") int limit,
                                          @Param("offset") int offset);

    long countBugReports(@Param("status") String status,
                         @Param("errorType") String errorType,
                         @Param("severity") String severity);

    int updateBugReportStatus(@Param("id") Long id,
                              @Param("status") String status,
                              @Param("resolutionNote") String resolutionNote,
                              @Param("resolvedBy") Long resolvedBy);

    List<AiBugReport> selectMyBugReportList(@Param("reportedBy") Long reportedBy,
                                            @Param("status") String status,
                                            @Param("limit") int limit,
                                            @Param("offset") int offset);

    long countMyBugReports(@Param("reportedBy") Long reportedBy,
                           @Param("status") String status);
}
