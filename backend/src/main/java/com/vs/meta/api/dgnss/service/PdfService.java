package com.vs.meta.api.dgnss.service;

import com.vs.meta.api.dgnss.vo.PioPdfVO;
import com.vs.meta.common.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.commons.CommonsMultipartFile;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfService {
    private final DrawPdfService drawPdfService;
    private final FileService fileService;

    // PDF 템플릿 캐시
    private final Map<String, byte[]> templateCache = new ConcurrentHashMap<>();

    // 폰트 캐시
    private final Map<String, byte[]> fontCache = new ConcurrentHashMap<>();

    // 이미지 캐시
    private final Map<String, byte[]> imageCache = new ConcurrentHashMap<>();

    @PostConstruct
    public void initializeCache() {
        log.info("PDF 템플릿, 폰트, 이미지 캐싱 시작");
        try {
            // PDF 템플릿 캐싱
            cacheTemplate("./assets/imgs/dgnss/template/template_10.pdf");
            cacheTemplate("./assets/imgs/dgnss/template/template_20_1st.pdf");
            cacheTemplate("./assets/imgs/dgnss/template/template_20_nst.pdf");
            cacheTemplate("./assets/imgs/dgnss/template/template_10_coch_30.pdf");
            cacheTemplate("./assets/imgs/dgnss/template/template_20_coch_30.pdf");
            // PDF 요약본 캐싱
            cacheTemplate("./assets/imgs/dgnss/template/template_10_summary.pdf");
            cacheTemplate("./assets/imgs/dgnss/template/template_20_summary.pdf");

            // 폰트 캐싱
            cacheFont("./assets/fonts/Pretendard-Regular.ttf");
            cacheFont("./assets/fonts/Pretendard-Bold.ttf");
            cacheFont("./assets/fonts/Pretendard-SemiBold.ttf");
            cacheFont("./assets/fonts/Pretendard-Medium.ttf");

            // 이미지 캐싱 - 모든 이미지 폴더 스캔
            cacheAllImages("./assets/imgs/dgnss");

            log.info("캐싱 완료 - 템플릿: {}, 폰트: {}, 이미지: {}", templateCache.size(), fontCache.size(), imageCache.size());
        } catch (Exception e) {
            log.error("캐싱 실패: {}", e.getMessage(), e);
        }
    }

    private void cacheAllImages(String basePath) {
        File baseDir = new File(basePath);
        if (!baseDir.exists()) {
            log.warn("이미지 폴더를 찾을 수 없음: {}", basePath);
            return;
        }
        cacheImagesRecursively(baseDir);
    }

    private void cacheImagesRecursively(File dir) {
        File[] files = dir.listFiles();
        if (files == null) return;

        for (File file : files) {
            if (file.isDirectory()) {
                cacheImagesRecursively(file);
            } else {
                String name = file.getName().toLowerCase();
                if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
                    try {
                        byte[] bytes = Files.readAllBytes(file.toPath());
                        // 상대 경로로 키 저장 (./assets/imgs/dgnss/... 형식)
                        String relativePath = file.getPath().replace("\\", "/");
                        if (!relativePath.startsWith("./")) {
                            relativePath = "./" + relativePath;
                        }
                        imageCache.put(relativePath, bytes);
                    } catch (IOException e) {
                        log.warn("이미지 캐싱 실패: {}", file.getAbsolutePath());
                    }
                }
            }
        }
    }

    private void cacheTemplate(String templatePath) {
        try {
            File file = new File(templatePath);
            if (file.exists()) {
                byte[] fileBytes = Files.readAllBytes(file.toPath());
                templateCache.put(templatePath, fileBytes);
                log.debug("PDF 템플릿 캐시 완료: {}", templatePath);
            } else {
                log.warn("PDF 템플릿 파일을 찾을 수 없음: {}", templatePath);
            }
        } catch (IOException e) {
            log.error("PDF 템플릿 캐싱 실패: {}", templatePath, e);
        }
    }

    private void cacheFont(String fontPath) {
        try {
            File file = new File(fontPath);
            if (file.exists()) {
                byte[] fileBytes = Files.readAllBytes(file.toPath());
                fontCache.put(fontPath, fileBytes);
                log.debug("폰트 캐시 완료: {}", fontPath);
            } else {
                log.warn("폰트 파일을 찾을 수 없음: {}", fontPath);
            }
        } catch (IOException e) {
            log.error("폰트 캐싱 실패: {}", fontPath, e);
        }
    }

    @Value("${cloud.aws.nas.path}")
    private String nasPath;

    @Value("${spring.profiles.active}")
    private String activeProfile;

    public String createDgnssAnalysisByTemplate(File file, Map<String, Object> dgnssData, HttpServletRequest request) throws Exception {
            String templateFileName = null;

            PioPdfVO pioPdfVO = new PioPdfVO();

            int currentPage= 1;

            Map<String, Object> userInfo = (HashMap)dgnssData.get("userInfo");
            String dgnssType = userInfo.get("DGNSS_ID").toString();
            int totalPages = 0;

            long templateStart = System.currentTimeMillis();

            // 종합평가일 경우
            if(dgnssType.equals("DGNSS_10")) {

                templateFileName = "./assets/imgs/dgnss/template/template_10.pdf";

                // 종합평가의 경우 대분류 통계값 없음
                List<Map<String, Object>> dgnssReport4 = (List<Map<String, Object>>)dgnssData.get("dgnssReport4");
                List<Map<String, Object>> dgnssReport5 = (List<Map<String, Object>>)dgnssData.get("dgnssReport5");

                List<Map<String, Object>> dgnssReportStudy = (List<Map<String, Object>>)dgnssData.get("dgnssReportStudy");

                try {
                    // 캐시된 템플릿 사용
                    byte[] cachedTemplate = getCachedTemplate(templateFileName);
                    if (cachedTemplate != null) {
                        pioPdfVO.loadDocFromCache(cachedTemplate, fontCache, imageCache);
                    } else {
                        log.warn("캐시된 템플릿을 찾을 수 없음, 파일에서 직접 로드: {}", templateFileName);
                        pioPdfVO.loadDoc(templateFileName);
                    }
                    log.info("[PDF 상세] 학생용 템플릿 로드: {}ms ({})", System.currentTimeMillis() - templateStart, dgnssType);

                    long renderStart = System.currentTimeMillis();
                    currentPage = 1;
                    totalPages = 23;
                    for (int i = 1; i < 24; i++) {
                        pioPdfVO.movePage(currentPage);
                        drawPdfService.addDgnssPage_DGNSS10(pioPdfVO, pioPdfVO.pdDoc, pioPdfVO.pdStream,  i, userInfo, null, dgnssReport4, dgnssReport5,dgnssReportStudy);
                        currentPage++;
                    }
                    log.info("[PDF 상세] 학생용 페이지 렌더링: {}ms ({}페이지, 페이지당 {}ms)",
                            System.currentTimeMillis() - renderStart, totalPages,
                            (System.currentTimeMillis() - renderStart) / totalPages);
                } catch(IOException e){
                    throw new RuntimeException(e);
                }

            }
            // 자기조절일 경우
            else if(dgnssType.equals("DGNSS_20")){

                if(userInfo.get("DGNSS_ORD").toString().equals("1"))
                    templateFileName = "./assets/imgs/dgnss/template/template_20_1st.pdf";
                else
                    templateFileName = "./assets/imgs/dgnss/template/template_20_nst.pdf";

                List<Map<String, Object>> dgnssReport3 = (List<Map<String, Object>>) dgnssData.get("dgnssReport3");
                List<Map<String, Object>> dgnssReport4 = (List<Map<String, Object>>)dgnssData.get("dgnssReport4");
                List<Map<String, Object>> dgnssReport5 = (List<Map<String, Object>>)dgnssData.get("dgnssReport5");

                try {
                    // 캐시된 템플릿 사용
                    byte[] cachedTemplate = getCachedTemplate(templateFileName);
                    if (cachedTemplate != null) {
                        pioPdfVO.loadDocFromCache(cachedTemplate, fontCache, imageCache);
                    } else {
                        log.warn("캐시된 템플릿을 찾을 수 없음, 파일에서 직접 로드: {}", templateFileName);
                        pioPdfVO.loadDoc(templateFileName);
                    }
                    log.info("[PDF 상세] 학생용 템플릿 로드: {}ms ({})", System.currentTimeMillis() - templateStart, dgnssType);

                    long renderStart = System.currentTimeMillis();
                    currentPage = 1;
                    totalPages = 18;
                    for (int i = 1; i < 19; i++) {
                        pioPdfVO.movePage(currentPage);
                        drawPdfService.addDgnssPage_DGNSS20(pioPdfVO, pioPdfVO.pdDoc, pioPdfVO.pdStream,  i, userInfo, dgnssReport3, dgnssReport4, dgnssReport5);
                        currentPage++;
                    }
                    log.info("[PDF 상세] 학생용 페이지 렌더링: {}ms ({}페이지, 페이지당 {}ms)",
                            System.currentTimeMillis() - renderStart, totalPages,
                            (System.currentTimeMillis() - renderStart) / totalPages);
                } catch(IOException e){
                    throw new RuntimeException(e);
                }
            }
            if ("local".equals(activeProfile)) {
                return savePdfToLocal(pioPdfVO, file);
            }

            byte[] pdfBytes;

            long serializeStart = System.currentTimeMillis();
            // 초기 버퍼 크기 2MB - 버퍼 재할당 최소화
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream(2 * 1024 * 1024)) {
                pioPdfVO.saveDoc(outputStream);
                pdfBytes = outputStream.toByteArray();
            }
            log.info("[PDF 상세] 학생용 PDF 직렬화: {}ms ({}KB)", System.currentTimeMillis() - serializeStart, pdfBytes.length / 1024);

            FileItem fileItem = new DiskFileItem("file", "application/pdf", true, file.getName(), pdfBytes.length, null);

            // 아래의 메서드가 파일 연결을 유지하고 있어 삭제할 수 없기에 try로 따로 관리
            try (OutputStream os = fileItem.getOutputStream()) {
                os.write(pdfBytes);
                os.flush();
            }

            MultipartFile mFile = new CommonsMultipartFile(fileItem);

            long uploadStart = System.currentTimeMillis();
            String url = fileUpload(mFile, request);
            log.info("[PDF 상세] 학생용 파일 업로드: {}ms", System.currentTimeMillis() - uploadStart);

            return url;
    //        return "";
        }

    // 교사용 시작
    public String createDgnssReportCoch(File file, Map<String, Object> dgnssData, HttpServletRequest request) throws Exception {

        String templateFileName = null;

        PioPdfVO pioPdfVO = new PioPdfVO();

        int currentPage= 1;
        int totalPages = 0;

        Map<String, Object> testInfo = (HashMap)dgnssData.get("testInfo");
        String dgnssType = testInfo.get("DGNSS_ID").toString();

        long templateStart = System.currentTimeMillis();

        // 종합평가일 경우
        if(dgnssType.equals("DGNSS_10")) {

            templateFileName = "./assets/imgs/dgnss/template/template_10_coch_30.pdf";

            List<Map<String, Object>> dgnssReportLS = (List<Map<String, Object>>)dgnssData.get("dgnssReportLS");
            List<Map<String, Object>> dgnssReportSection = (List<Map<String, Object>>)dgnssData.get("dgnssReportSection");
            List<Map<String, Object>> dgnssReportValidity = (List<Map<String, Object>>)dgnssData.get("dgnssReportValidity");
            List<Map<String, Object>> dgnssReportMem = (List<Map<String, Object>>)dgnssData.get("dgnssReportMem");
            List<Map<String, Object>> dgnssReportStat3 = (List<Map<String, Object>>)dgnssData.get("dgnssReportStat3");
            List<Map<String, Object>> dgnssReportStat5 = (List<Map<String, Object>>)dgnssData.get("dgnssReportStat5");

            try {
                // 캐시된 템플릿 사용
                byte[] cachedTemplate = getCachedTemplate(templateFileName);
                if (cachedTemplate != null) {
                    pioPdfVO.loadDocFromCache(cachedTemplate, fontCache, imageCache);
                } else {
                    log.warn("캐시된 템플릿을 찾을 수 없음, 파일에서 직접 로드: {}", templateFileName);
                    pioPdfVO.loadDoc(templateFileName);
                }
                log.info("[PDF 상세] 교사용 템플릿 로드: {}ms ({})", System.currentTimeMillis() - templateStart, dgnssType);

                long renderStart = System.currentTimeMillis();
                currentPage = 1;
                totalPages = 18;
                for (int i = 1; i < 19; i++) {
                    log.debug("now page : {}" , i);
                    pioPdfVO.movePage(currentPage);

                    drawPdfService.addDgnssPage_DGNSS10_COCH(pioPdfVO, pioPdfVO.pdDoc, pioPdfVO.pdStream,  i, testInfo,  dgnssReportLS, dgnssReportSection, dgnssReportValidity,dgnssReportMem, dgnssReportStat3, dgnssReportStat5);

                    currentPage++;

                }
                log.info("[PDF 상세] 교사용 페이지 렌더링: {}ms ({}페이지, 페이지당 {}ms)",
                        System.currentTimeMillis() - renderStart, totalPages,
                        (System.currentTimeMillis() - renderStart) / totalPages);
            } catch(IOException e){
                throw new RuntimeException(e);
            }
        }
        // 자기조절일 경우
        else if(dgnssType.equals("DGNSS_20")){

            templateFileName = "./assets/imgs/dgnss/template/template_20_coch_30.pdf";

            List<Map<String, Object>> dgnssReportLS = (List<Map<String, Object>>)dgnssData.get("dgnssReportLS");
            List<Map<String, Object>> dgnssReportSection = (List<Map<String, Object>>)dgnssData.get("dgnssReportSection");
            List<Map<String, Object>> dgnssReportValidity = (List<Map<String, Object>>)dgnssData.get("dgnssReportValidity");
            List<Map<String, Object>> dgnssReportMem = (List<Map<String, Object>>)dgnssData.get("dgnssReportMem");
            List<Map<String, Object>> dgnssReportStat3 = (List<Map<String, Object>>)dgnssData.get("dgnssReportStat3");
            List<Map<String, Object>> dgnssReportStat5 = (List<Map<String, Object>>)dgnssData.get("dgnssReportStat5");

            try {
                // 캐시된 템플릿 사용
                byte[] cachedTemplate = getCachedTemplate(templateFileName);
                if (cachedTemplate != null) {
                    pioPdfVO.loadDocFromCache(cachedTemplate, fontCache, imageCache);
                } else {
                    log.warn("캐시된 템플릿을 찾을 수 없음, 파일에서 직접 로드: {}", templateFileName);
                    pioPdfVO.loadDoc(templateFileName);
                }
                log.info("[PDF 상세] 교사용 템플릿 로드: {}ms ({})", System.currentTimeMillis() - templateStart, dgnssType);

                long renderStart = System.currentTimeMillis();
                currentPage = 1;
                totalPages = 11;
                for (int i = 1; i < 12; i++) {
                    //log.debug("now page : {}" , i);
                    pioPdfVO.movePage(currentPage);

                    drawPdfService.addDgnssPage_DGNSS20_COCH(pioPdfVO, pioPdfVO.pdDoc, pioPdfVO.pdStream,  i, testInfo,  dgnssReportLS, dgnssReportSection, dgnssReportValidity,dgnssReportMem, dgnssReportStat3, dgnssReportStat5);

                    currentPage++;

                }
                log.info("[PDF 상세] 교사용 페이지 렌더링: {}ms ({}페이지, 페이지당 {}ms)",
                        System.currentTimeMillis() - renderStart, totalPages,
                        (System.currentTimeMillis() - renderStart) / totalPages);
            } catch(IOException e){
                throw new RuntimeException(e);
            }

        }
        if ("local".equals(activeProfile)) {
            return savePdfToLocal(pioPdfVO, file);
        }

        byte[] pdfBytes;

        long serializeStart = System.currentTimeMillis();
        // 초기 버퍼 크기 2MB - 버퍼 재할당 최소화
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream(2 * 1024 * 1024)) {
            pioPdfVO.saveDoc(outputStream);
            pdfBytes = outputStream.toByteArray();
        }
        log.info("[PDF 상세] 교사용 PDF 직렬화: {}ms ({}KB)", System.currentTimeMillis() - serializeStart, pdfBytes.length / 1024);

        FileItem fileItem = new DiskFileItem("file", "application/pdf", true, file.getName(), pdfBytes.length, null);

        try (OutputStream os = fileItem.getOutputStream()) {
            os.write(pdfBytes);
            os.flush();
        }

        MultipartFile mFile = new CommonsMultipartFile(fileItem);

        long uploadStart = System.currentTimeMillis();
        String url = fileUpload(mFile, request);
        log.info("[PDF 상세] 교사용 파일 업로드: {}ms", System.currentTimeMillis() - uploadStart);

        return url;
        //return "";
    }

    public String fileUpload(MultipartFile file, HttpServletRequest request) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
        String datePath = LocalDate.now().format(formatter);

        // nasPath 가 트레일링 슬래시로 끝나지 않을 때 대비 — 항상 정확히 한 개의 '/' 로 결합
        String nasRoot = nasPath.endsWith("/") ? nasPath.substring(0, nasPath.length() - 1) : nasPath;

        // 로컬 환경에서는 직접 파일 저장
        if ("local".equals(activeProfile)) {
            try {
                String dirPath = nasRoot + "/" + datePath;
                File dir = new File(dirPath);
                if (!dir.exists()) {
                    dir.mkdirs();
                }

                String originalFilename = file.getOriginalFilename();
                String ext = originalFilename != null && originalFilename.contains(".")
                        ? originalFilename.substring(originalFilename.lastIndexOf("."))
                        : ".pdf";
                String saveFileName = UUID.randomUUID().toString().replace("-", "") + ext;

                File saveFile = new File(dirPath + "/" + saveFileName);
                file.transferTo(saveFile);

                log.info("PDF 로컬 저장 완료: {}", saveFile.getAbsolutePath());
                return dirPath + "/" + saveFileName;
            } catch (Exception e) {
                log.error("PDF 로컬 저장 실패: {}", e.getMessage(), e);
                throw new RuntimeException("파일 저장 실패", e);
            }
        }

        // 서버 환경에서는 FileService 사용
        List<MultipartFile> fileList = new ArrayList<>();
        fileList.add(file);
        String filePath = nasRoot + "/" + datePath;
        List<LinkedHashMap<String, Object>> url = fileService.uploadFile(fileList, filePath, "Y", request);

        return url.get(0).get("url").toString();
    }

    // PDF 요약본
    public String createDgnssSummaryByTemplate(File file, Map<String, Object> dgnssData, HttpServletRequest request) throws Exception {

        String templateFileName = null;

        PioPdfVO pioPdf = new PioPdfVO();

        Map<String, Object> userInfo = (Map<String, Object>)dgnssData.get("userInfo");
        int paperIdx = MapUtils.getInteger(userInfo, "paperIdx", 0);

        if (paperIdx == 1) {
            templateFileName = "./assets/imgs/dgnss/template/template_10_summary.pdf";

            try {
                // 캐시된 템플릿 사용
                byte[] cachedTemplate = getCachedTemplate(templateFileName);
                if (cachedTemplate != null) {
                    pioPdf.loadDocFromCache(cachedTemplate, fontCache, imageCache);
                } else {
                    log.warn("캐시된 템플릿을 찾을 수 없음, 파일에서 직접 로드: {}", templateFileName);
                    pioPdf.loadDoc(templateFileName);
                }
                pioPdf.movePage(1);
                drawPdfService.drawDgnssSummary_DGNSS10(pioPdf, pioPdf.pdDoc, pioPdf.pdStream, dgnssData);

            } catch(IOException e){
                throw new RuntimeException(e);
            }
        } else if (paperIdx == 2) {
            templateFileName = "./assets/imgs/dgnss/template/template_20_summary.pdf";

            try {
                // 캐시된 템플릿 사용
                byte[] cachedTemplate = getCachedTemplate(templateFileName);
                if (cachedTemplate != null) {
                    pioPdf.loadDocFromCache(cachedTemplate, fontCache, imageCache);
                } else {
                    log.warn("캐시된 템플릿을 찾을 수 없음, 파일에서 직접 로드: {}", templateFileName);
                    pioPdf.loadDoc(templateFileName);
                }
                pioPdf.movePage(1);
                drawPdfService.drawDgnssSummary_DGNSS20(pioPdf, pioPdf.pdDoc, pioPdf.pdStream, dgnssData);

            } catch(IOException e){
                throw new RuntimeException(e);
            }
        }
        if ("local".equals(activeProfile)) {
            return savePdfToLocal(pioPdf, file);
        }

        byte[] pdfBytes;

        // 초기 버퍼 크기 1MB - 요약본은 1페이지
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream(1024 * 1024)) {
            pioPdf.saveDoc(outputStream);
            pdfBytes = outputStream.toByteArray();
        }

        FileItem fileItem = new DiskFileItem("file", "application/pdf", true, file.getName(), pdfBytes.length, null);

        // 아래의 메서드가 파일 연결을 유지하고 있어 삭제할 수 없기에 try로 따로 관리
        try (OutputStream os = fileItem.getOutputStream()) {
            os.write(pdfBytes);
            os.flush();
        }

        MultipartFile mFile = new CommonsMultipartFile(fileItem);

        return fileUpload(mFile, request);
//        return "";
    }

    public byte[] getCachedTemplate(String templatePath) {
        return templateCache.get(templatePath);
    }

    public byte[] getCachedFont(String fontPath) {
        return fontCache.get(fontPath);
    }

    private String savePdfToLocal(PioPdfVO pioPdfVO, File file) throws Exception {
        File localFile = file.getAbsoluteFile();
        File parentDir = localFile.getParentFile();
        if (parentDir != null && !parentDir.exists() && !parentDir.mkdirs()) {
            throw new IOException("로컬 PDF 저장 디렉터리를 생성할 수 없습니다: " + parentDir.getAbsolutePath());
        }

        pioPdfVO.saveDoc(localFile);
        log.info("PDF 로컬 저장 완료: {}", localFile.getAbsolutePath());
        return localFile.getAbsolutePath().replace("\\", "/");
    }
}
