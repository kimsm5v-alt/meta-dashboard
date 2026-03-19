package com.vs.meta.api.member.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class NcpMailSender {

    @Value("${ncp.mail.url}")
    private String mailUrl;

    @Value("${ncp.mail.access-key}")
    private String accessKey;

    @Value("${ncp.mail.secret-key}")
    private String secretKey;

    @Value("${ncp.mail.sender}")
    private String senderAddress;

    private static final String MAIL_API_PATH = "/api/v1/mails";

    public void sendVerificationCode(String toEmail, String code) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String signature = makeSignature("POST", MAIL_API_PATH, timestamp);

        Map<String, Object> body = Map.of(
                "senderAddress", senderAddress,
                "senderName", "[학습심리검사]",
                "title", "[학습심리검사] 인증 요청",
                "body", buildVerificationHtml(code),
                "recipients", List.of(Map.of("address", toEmail, "type", "R")),
                "individual", true,
                "advertising", false
        );

        WebClient.create(mailUrl)
                .post()
                .uri(MAIL_API_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .header("x-ncp-apigw-timestamp", timestamp)
                .header("x-ncp-iam-access-key", accessKey)
                .header("x-ncp-apigw-signature-v2", signature)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(res -> log.info("NCP 메일 발송 성공: to={}", toEmail))
                .doOnError(err -> log.error("NCP 메일 발송 실패: to={}", toEmail, err))
                .block();
    }

    private String makeSignature(String method, String url, String timestamp) {
        String message = method + " " + url + "\n" + timestamp + "\n" + accessKey;
        try {
            SecretKeySpec signingKey = new SecretKeySpec(
                    secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(signingKey);
            byte[] rawHmac = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new RuntimeException("NCP 서명 생성 실패", e);
        }
    }

    private String buildVerificationHtml(String code) {
        return "<div style='padding:20px;font-family:sans-serif'>"
                + "<h2>[학습심리검사] 이메일 인증</h2>"
                + "<p>아래 인증코드를 입력해 주세요.</p>"
                + "<h1 style='color:#4A90D9;letter-spacing:8px'>" + code + "</h1>"
                + "<p style='color:#999'>이 코드는 5분간 유효합니다.</p>"
                + "</div>";
    }
}
