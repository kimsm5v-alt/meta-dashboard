package com.vs.meta.common.vo;

import lombok.Data;

@Data
public class FileLogVO {
    private int logIdx;
    private int fileIdx;
    private String fileName;
    private String downloadDate;
    private String userId;
    private String accessIp;
    private String requestSource;
}
