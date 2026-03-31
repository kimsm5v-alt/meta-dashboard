package com.vs.meta.common.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

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

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private static final String MAIL_API_PATH = "/api/v1/mails";
    private static final String FILE_API_PATH = "/api/v1/files";

    private final ObjectMapper objectMapper = new ObjectMapper();

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

    public void sendGroupInvitation(String toEmail, String groupName, String inviteCode) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String signature = makeSignature("POST", MAIL_API_PATH, timestamp);

        Map<String, Object> body = Map.of(
                "senderAddress", senderAddress,
                "senderName", "[학습심리검사]",
                "title", "[학습심리검사] 그룹 초대 - " + groupName,
                "body", buildInvitationHtml(groupName, inviteCode),
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
                .doOnSuccess(res -> log.info("그룹 초대 메일 발송 성공: to={}, group={}", toEmail, groupName))
                .doOnError(err -> log.error("그룹 초대 메일 발송 실패: to={}, group={}", toEmail, groupName, err))
                .block();
    }

    /**
     * NCP 파일 업로드 후 fileId 반환
     * @param fileData 파일 바이트 배열
     * @param fileName 파일명 (예: "result.pdf")
     * @return 업로드된 파일의 fileId
     */
    @SuppressWarnings("unchecked")
    public String uploadFile(byte[] fileData, String fileName) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String signature = makeSignature("POST", FILE_API_PATH, timestamp);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("fileList", new ByteArrayResource(fileData) {
            @Override
            public String getFilename() {
                return fileName;
            }
        }).contentType(MediaType.APPLICATION_OCTET_STREAM);

        String response = WebClient.create(mailUrl)
                .post()
                .uri(FILE_API_PATH)
                .header("x-ncp-apigw-timestamp", timestamp)
                .header("x-ncp-iam-access-key", accessKey)
                .header("x-ncp-apigw-signature-v2", signature)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(res -> log.info("NCP 파일 업로드 성공: fileName={}", fileName))
                .doOnError(err -> log.error("NCP 파일 업로드 실패: fileName={}", fileName, err))
                .block();

        try {
            Map<String, Object> result = objectMapper.readValue(response, Map.class);
            List<Map<String, Object>> files = (List<Map<String, Object>>) result.get("files");
            if (files != null && !files.isEmpty()) {
                return (String) files.get(0).get("fileId");
            }
            throw new RuntimeException("NCP 파일 업로드 응답에 fileId가 없습니다: " + response);
        } catch (Exception e) {
            throw new RuntimeException("NCP 파일 업로드 응답 파싱 실패", e);
        }
    }

    /**
     * 첨부파일 포함 메일 발송
     * @param toEmail 수신자 이메일
     * @param title 메일 제목
     * @param htmlBody 메일 본문 (HTML)
     * @param attachFileIds 첨부파일 ID 목록 (uploadFile로 얻은 fileId)
     */
    public void sendMailWithAttachment(String toEmail, String title, String htmlBody, List<String> attachFileIds) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String signature = makeSignature("POST", MAIL_API_PATH, timestamp);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("senderAddress", senderAddress);
        body.put("senderName", "[학습심리검사]");
        body.put("title", title);
        body.put("body", htmlBody);
        body.put("recipients", List.of(Map.of("address", toEmail, "type", "R")));
        body.put("individual", true);
        body.put("advertising", false);
        if (attachFileIds != null && !attachFileIds.isEmpty()) {
            body.put("attachFileIds", attachFileIds);
        }

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
                .doOnSuccess(res -> log.info("첨부파일 메일 발송 성공: to={}", toEmail))
                .doOnError(err -> log.error("첨부파일 메일 발송 실패: to={}", toEmail, err))
                .block();
    }

    /**
     * 검사 결과 PDF 메일 발송 (파일 업로드 + 메일 발송)
     * @param toEmail 수신자 이메일
     * @param studentName 학생 이름
     * @param pdfData PDF 바이트 배열
     */
    public void sendExamResultPdf(String toEmail, String studentName, byte[] pdfData) {
        sendExamResultPdf(toEmail, studentName, "학습심리검사", pdfData);
    }

    public void sendExamResultPdf(String toEmail, String studentName, String examTypeName, byte[] pdfData) {
        String fileId = null;
        try {
            fileId = uploadFile(pdfData, "학습심리검사_결과_" + studentName + ".pdf");
            String htmlBody = buildExamResultHtml(studentName, examTypeName);
            sendMailWithAttachment(toEmail, "[학습심리검사] " + examTypeName + " 결과 안내 - " + studentName, htmlBody, List.of(fileId));
        } finally {
            if (fileId != null) {
                try {
                    deleteFile(fileId);
                } catch (Exception e) {
                    log.error("NCP 첨부 파일 삭제 실패: fileId={}", fileId, e);
                }
            }
        }
    }

    public void deleteFile(String fileId) {
        String fileApiPath = FILE_API_PATH + "/" + fileId;
        String timestamp = String.valueOf(System.currentTimeMillis());
        String signature = makeSignature("DELETE", fileApiPath, timestamp);

        WebClient.create(mailUrl)
                .delete()
                .uri(fileApiPath)
                .header("x-ncp-apigw-timestamp", timestamp)
                .header("x-ncp-iam-access-key", accessKey)
                .header("x-ncp-apigw-signature-v2", signature)
                .retrieve()
                .bodyToMono(String.class)
                .doOnSuccess(res -> log.info("NCP 파일 삭제 성공: fileId={}", fileId))
                .doOnError(err -> log.error("NCP 파일 삭제 실패: fileId={}", fileId, err))
                .block();
    }

    private String buildExamResultHtml(String studentName, String examTypeName) {
        return "<div style='padding:20px;font-family:sans-serif'>"
                + "<h2>[학습심리검사] " + examTypeName + "</h2>"
                + "<p><strong>" + studentName + "</strong>님의 " + examTypeName + " 결과를 첨부파일로 보내드립니다.</p>"
                + "<p>첨부된 PDF 파일을 확인해 주세요.</p>"
                + "<p style='color:#999;margin-top:20px'>본 메일은 자동 발송되었습니다.</p>"
                + "</div>";
    }

    private String buildVerificationHtml(String code) {
        return "<div style='padding:20px;font-family:sans-serif'>"
                + "<h2>[학습심리검사] 이메일 인증</h2>"
                + "<p>아래 인증코드를 입력해 주세요.</p>"
                + "<h1 style='color:#4A90D9;letter-spacing:8px'>" + code + "</h1>"
                + "<p style='color:#999'>이 코드는 5분간 유효합니다.</p>"
                + "</div>";
    }

    private String buildInvitationHtml(String groupName, String inviteCode) {
        String joinUrl = frontendUrl + "/join/" + inviteCode;
        return "<div style='padding:20px;font-family:sans-serif'>"
                + "<h2>[학습심리검사] 그룹 초대</h2>"
                + "<p><strong>" + groupName + "</strong> 그룹에 초대되었습니다.</p>"
                + "<p>아래 링크를 클릭하거나 초대코드를 입력하여 참가하세요.</p>"
                + "<div style='margin:20px 0'>"
                + "<a href='" + joinUrl + "' style='display:inline-block;padding:12px 24px;background:#4A90D9;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold'>그룹 참가하기</a>"
                + "</div>"
                + "<p style='color:#666'>또는 초대코드를 직접 입력:</p>"
                + "<h1 style='color:#4A90D9;letter-spacing:8px'>" + inviteCode + "</h1>"
                + "</div>";
    }
}
