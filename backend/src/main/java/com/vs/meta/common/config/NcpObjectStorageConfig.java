package com.vs.meta.common.config;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * NCP Object Storage 설정
 * AWS S3 호환 API를 사용하여 NCP Object Storage에 연결합니다.
 */
@Configuration
public class NcpObjectStorageConfig {

    @Value("${cloud.aws.s3.endpoint:https://kr.object.gov-ncloudstorage.com}")
    private String endpoint;

    @Value("${cloud.aws.region.static:ap-northeast-2}")
    private String region;

    @Value("${cloud.aws.credentials.accessKey:}")
    private String accessKey;

    @Value("${cloud.aws.credentials.secretKey:}")
    private String secretKey;

    @Bean
    public AmazonS3 amazonS3Client() {
        return AmazonS3ClientBuilder.standard()
                .withEndpointConfiguration(
                        new AwsClientBuilder.EndpointConfiguration(endpoint, region))
                .withCredentials(
                        new AWSStaticCredentialsProvider(
                                new BasicAWSCredentials(accessKey, secretKey)))
                .build();
    }
}
