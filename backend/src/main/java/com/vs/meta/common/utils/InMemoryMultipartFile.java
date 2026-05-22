package com.vs.meta.common.utils;

import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;

/**
 * Spring Framework 6 (Boot 3+) 에서 제거된 {@code CommonsMultipartFile} 대체용 인메모리 구현체.
 *
 * <p>byte[] → {@link MultipartFile} 변환이 필요한 곳에서 사용한다 (예: PDF 생성 후 업로드 직전).
 */
public class InMemoryMultipartFile implements MultipartFile {

    private final String name;
    private final String contentType;
    private final byte[] content;

    public InMemoryMultipartFile(String name, String contentType, byte[] content) {
        this.name = name;
        this.contentType = contentType;
        this.content = content == null ? new byte[0] : content;
    }

    @Override public String getName() { return name; }
    @Override public String getOriginalFilename() { return name; }
    @Override public String getContentType() { return contentType; }
    @Override public boolean isEmpty() { return content.length == 0; }
    @Override public long getSize() { return content.length; }
    @Override public byte[] getBytes() { return content; }
    @Override public InputStream getInputStream() { return new ByteArrayInputStream(content); }

    @Override
    public void transferTo(File dest) throws IOException {
        Files.write(dest.toPath(), content);
    }
}
