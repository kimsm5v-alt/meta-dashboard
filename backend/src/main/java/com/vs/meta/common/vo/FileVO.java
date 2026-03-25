package com.vs.meta.common.vo;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class FileVO {
    private int fileIdx;
    private String fileName;
    private String saveFileName;
    private String filePath;
    private String fileExtension;
    private long fileSize;
    private String rgtr;
    private String regDt;
    private String requestSource;
    private String checksum;
    private String downloadAuthYn;
    private String delYn;
    private String delDt;
    private String prsInfoYn;
}
