package com.vs.meta.common.utils;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootTest
@ActiveProfiles("local")
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
