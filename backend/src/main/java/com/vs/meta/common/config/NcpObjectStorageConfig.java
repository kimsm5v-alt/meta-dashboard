package com.vs.meta.common.config;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * NCP Object Storage 설정
 * AWS S3 호환 API를 사용하여 NCP Object Storage에 연결합니다.
 */
@Slf4j
@Configuration
public class NcpObjectStorageConfig {

    /** endpoint 미설정(로컬 등) 시 사용할 기본 엔드포인트. 빈이 생성되지 않아 앱이 기동 실패하는 것을 방지한다. */
    private static final String DEFAULT_ENDPOINT = "https://kr.object.gov-ncloudstorage.com";

    @Value("${cloud.aws.s3.endpoint:https://kr.object.gov-ncloudstorage.com}")
    private String endpoint;

    @Value("${cloud.aws.region.static:ap-northeast-2}")
    private String region;

    @Value("${cloud.aws.credentials.accessKey:}")
    private String accessKey;

    @Value("${cloud.aws.credentials.secretKey:}")
    private String secretKey;

    /**
     * 운영/개발 등 비(非)-local 프로파일: 설정된 endpoint 를 그대로 사용한다.
     * endpoint 가 비어 있으면 기존과 동일하게 기동 단계에서 실패한다(설정 누락을 조기에 드러내기 위함).
     */
    @Bean(name = "amazonS3Client")
    @Profile("!local")
    public AmazonS3 amazonS3Client() {
        return buildClient(endpoint);
    }

    /**
     * local 프로파일 전용: endpoint 미설정 시 기본 엔드포인트로 폴백하여
     * NCP 미연결 환경에서도 앱이 기동되도록 한다. (실제 S3 기능은 동작하지 않음)
     */
    @Bean(name = "amazonS3Client")
    @Profile("local")
    public AmazonS3 amazonS3ClientLocal() {
        String resolvedEndpoint = StringUtils.isBlank(endpoint) ? DEFAULT_ENDPOINT : endpoint;
        if (StringUtils.isBlank(endpoint)) {
            log.warn("[local] NCP Object Storage endpoint 미설정 → 기본값({})으로 대체합니다. 실제 S3 기능은 동작하지 않습니다.",
                    DEFAULT_ENDPOINT);
        }
        return buildClient(resolvedEndpoint);
    }

    private AmazonS3 buildClient(String resolvedEndpoint) {
        return AmazonS3ClientBuilder.standard()
                .withEndpointConfiguration(
                        new AwsClientBuilder.EndpointConfiguration(resolvedEndpoint, region))
                .withCredentials(
                        new AWSStaticCredentialsProvider(
                                new BasicAWSCredentials(accessKey, secretKey)))
                .build();
    }
}
