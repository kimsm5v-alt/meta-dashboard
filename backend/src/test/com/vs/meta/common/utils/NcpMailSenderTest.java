package com.vs.meta.common.utils;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * 실 NCP Mail 발송 manual test — 개발자 본인 이메일 / 로컬 PDF 절대경로 하드코딩.
 * CI 또는 일반 ./gradlew test 에서는 skip. 명시적으로 -Dncp.mail.manual=true 시에만 실행.
 */
@SpringBootTest
@ActiveProfiles("local")
@EnabledIfSystemProperty(named = "ncp.mail.manual", matches = "true")
class NcpMailSenderTest {

    @Autowired
    private NcpMailSender ncpMailSender;

    @Test
    void sendTestMail() {
        ncpMailSender.sendVerificationCode("ohch1@visang.com", "999999");
    }

    @Test
    void sendMailWithPdfAttachment() throws Exception {
        byte[] pdfData = Files.readAllBytes(Path.of("C:/Users/user/Downloads/[교육] 민화배우기7_20260316.pdf"));
        ncpMailSender.sendExamResultPdf("ohch1@visang.com", "테스트", pdfData);
    }
}
