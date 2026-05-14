package com.vs.meta.common.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.DeleteObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * NCP Object Storage 파일 업로드/삭제 서비스
 * 버그리포트 스크린샷 등 단순 이미지 저장에 사용합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NcpStorageService {

    private final AmazonS3 amazonS3Client;

    @Value("${cloud.aws.s3.bucket:t-superplatform}")
    private String bucket;

    @Value("${cloud.aws.s3.url:https://t-superplatform.vsaidt.com}")
    private String storageUrl;

    @Value("${cloud.aws.s3.path:/public/}")
    private String basePath;

    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList(
            "jpg", "jpeg", "png", "gif", "webp"
    );

    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * 범용 이미지 업로드 메서드
     *
     * @param file       업로드할 이미지 파일
     * @param pathPrefix 경로 접두어 (예: "bug-report", "profile", "counseling")
     * @return 저장된 파일의 URL
     */
    public String uploadImage(MultipartFile file, String pathPrefix) throws IOException {
        validateImageFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String savedFileName = generateFileName(extension);

        // 경로: {basePath}/{pathPrefix}/YYYYMMDD/uuid.ext
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String objectKey = basePath + pathPrefix + "/" + datePath + "/" + savedFileName;

        log.info("[NCP Storage] 업로드 시작 - bucket: {}, basePath: {}, pathPrefix: {}", bucket, basePath, pathPrefix);
        log.info("[NCP Storage] objectKey: {}", objectKey);

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentType(file.getContentType());
        metadata.setContentLength(file.getSize());

        try (InputStream inputStream = file.getInputStream()) {
            PutObjectRequest putRequest = new PutObjectRequest(bucket, objectKey, inputStream, metadata)
                    .withCannedAcl(CannedAccessControlList.PublicRead);
            amazonS3Client.putObject(putRequest);
        }

        // URL: {storageUrl}{basePath}{pathPrefix}/YYYYMMDD/uuid.ext
        String fileUrl = storageUrl + basePath + pathPrefix + "/" + datePath + "/" + savedFileName;
        log.info("[NCP Storage] 업로드 완료 - storageUrl: {}, fileUrl: {}", storageUrl, fileUrl);

        return fileUrl;
    }

    /**
     * 버그리포트 스크린샷 업로드
     *
     * @param file 업로드할 이미지 파일
     * @return 저장된 파일의 URL
     */
    public String uploadBugReportImage(MultipartFile file) throws IOException {
        return uploadImage(file, "meta-dashboard/bug-report");
    }

    /**
     * 파일 삭제
     *
     * @param fileUrl 삭제할 파일의 URL
     */
    public void deleteFile(String fileUrl) {
        try {
            String objectKey = extractObjectKey(fileUrl);
            if (objectKey != null) {
                amazonS3Client.deleteObject(new DeleteObjectRequest(bucket, objectKey));
                log.info("NCP Storage 파일 삭제 완료: {}", objectKey);
            }
        } catch (Exception e) {
            log.error("NCP Storage 파일 삭제 실패: {}", fileUrl, e);
        }
    }

    /**
     * 이미지 파일 유효성 검사
     */
    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("파일 크기가 10MB를 초과합니다.");
        }

        String extension = getFileExtension(file.getOriginalFilename());
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("허용되지 않는 이미지 형식입니다. (허용: jpg, jpeg, png, gif, webp)");
        }
    }

    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * 고유 파일명 생성
     */
    private String generateFileName(String extension) {
        return UUID.randomUUID().toString().replace("-", "") + "." + extension;
    }

    /**
     * URL에서 object key 추출
     */
    private String extractObjectKey(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return null;
        }
        // URL 형식: https://con.aidtclass.com/files/dev/bug-report/20260513/uuid.ext
        // Object Key: /files/dev/bug-report/20260513/uuid.ext
        if (fileUrl.startsWith(storageUrl)) {
            return fileUrl.substring(storageUrl.length());
        }
        return null;
    }
}
