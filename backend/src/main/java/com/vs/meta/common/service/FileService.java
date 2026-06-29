package com.vs.meta.common.service;

import com.vs.meta.common.auth.UserInfoEnricher;
import com.vs.meta.common.auth.UserSlot;
import com.vs.meta.common.exception.AuthFailedException;
import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.common.utils.SecurityUtil;
import com.vs.meta.common.vo.FileVO;
import com.vs.meta.common.vo.FileLogVO;
import com.vs.meta.common.mapper.FileMapper;
import com.vs.meta.common.utils.FileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.dao.DataAccessException;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.SQLException;
import java.time.DateTimeException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    @Value("${cloud.aws.nas.path}")
    private String nasPath;

    /** 트레일링 슬래시를 제거한 NAS 루트. 경로 결합 시 항상 단일 '/' 보장 위해 사용. */
    private String nasRoot() {
        return nasPath.endsWith("/") ? nasPath.substring(0, nasPath.length() - 1) : nasPath;
    }

    private long MAX_FILE_SIZE = 1000 * 1024 * 1024; // 1000mb

    private final FileMapper fileMapper;
    private final UserInfoEnricher userInfoEnricher;

    @Value("${spring.profiles.active}")
    private String serverEnv;

    @Value("${key.salt.main}")
    private String keySaltMain;

    /**
     * 파일 업로드
     *
     * @param files
     * @param uploadPath
     * @param request
     * @return
     */
    @Transactional(rollbackFor = Exception.class)
    public List<LinkedHashMap<String, Object>> uploadFile(List<MultipartFile> files, String uploadPath, HttpServletRequest request) {
        return uploadFile(files, uploadPath, null, request);
    }

    /**
     * 개인정보 파일 업로드
     *
     * @param files
     * @param uploadPath
     * @param request
     * @return
     */
    @Transactional(rollbackFor = Exception.class)
    public List<LinkedHashMap<String, Object>> uploadFile(List<MultipartFile> files, String uploadPath, String prsInfoYn, HttpServletRequest request) {

        if (StringUtils.startsWith(uploadPath, "/") == false) {
            uploadPath = "/" + uploadPath;
        }

        List<LinkedHashMap<String, Object>> urls = new ArrayList<>();

        String resultMsg = "파일 업로드 성공";
        File tempFile = null; // 임시 파일 저장용
        File movedFile = null; // 이동된 파일 저장용
        String userId = null;

        try {
            // SecurityContext에서 인증된 사용자 정보 추출 (Spring Security JWT 검증 완료 상태)
            SpAuthenticatedUser spUser = SecurityUtil.getCurrentSpUser();
            if (spUser == null) {
                log.error("인증된 사용자 정보가 없습니다.");
                throw new AuthFailedException("인증된 사용자 정보가 없습니다.");
            }
            userId = spUser.spUserId();
            if (userId == null) {
                log.error("사용자 ID가 누락되었습니다.");
                throw new AuthFailedException("사용자 ID가 누락되었습니다.");
            }

            String requestSource = request.getHeader("Referer"); // 요청 출처를 헤더에서 추출
            if (requestSource == null) {
                requestSource = "";  // 기본 값 설정
            }

            for (MultipartFile file : files) {
                validateFile(file);

                // 업로드 경로 지정
                uploadPath = FileUtil.normalizeUploadPath(uploadPath);
                String tempPath = nasRoot() + "/temp/";  // 임시저장

                // 파일 경로 생성 (temp + 최종 업로드 경로 모두 보장)
                FileUtil.mkdirs(tempPath);
                FileUtil.mkdirs(uploadPath);

                // 파일명 생성
                String saveFileName = FileUtil.getSaveFileName(file.getOriginalFilename());

                // 파일 저장
                tempFile = new File(tempPath + saveFileName);
                file.transferTo(tempFile);

                // 파일 이동
                String copyPath = uploadPath;
                String copyFile = copyPath + "/" + saveFileName;
                movedFile = FileUtil.moveFile(tempFile, copyFile);

                // DB 저장
                FileVO fileVO = setFileVO(file, saveFileName, copyPath + "/", userId, requestSource, prsInfoYn);
                fileMapper.insertUploadFile(fileVO);

                // 파일 저장 후 tempFile 참조를 null로 설정
                tempFile = null;
                movedFile = null;

                LinkedHashMap<String, Object> fileMap = new LinkedHashMap<>();
                String storedUrl = fileVO.getFilePath() + fileVO.getFileName();
                // 업로드 직후 실제 저장 경로 추적용 — filePath/fileName 분리값과 결합 url 을 [] 로 감싸 기록
                log.info("[파일 업로드 성공] filePath=[{}], fileName=[{}], url=[{}]",
                        fileVO.getFilePath(), fileVO.getFileName(), storedUrl);
                fileMap.put("url", storedUrl);
                urls.add(fileMap);
            }
        } catch (AuthFailedException e) {
            resultMsg = "인증 실패: " + e.getMessage();
            logUploadError("Authentication failed", e, tempFile, movedFile, userId, uploadPath);
            cleanupUploadFiles(tempFile, movedFile);
        } catch (IllegalArgumentException e) {
            resultMsg = "파일 업로드 실패: 잘못된 파라미터";
            logUploadError("Invalid argument error", e, tempFile, movedFile, userId, uploadPath);
            cleanupUploadFiles(tempFile, movedFile);
        } catch (NullPointerException e) {
            resultMsg = "파일 업로드 실패: 필수 데이터 누락";
            logUploadError("Null pointer error", e, tempFile, movedFile, userId, uploadPath);
            cleanupUploadFiles(tempFile, movedFile);
        } catch (IOException e) {
            resultMsg = "파일 업로드 실패: 파일 입출력 오류";
            logUploadError("IO error", e, tempFile, movedFile, userId, uploadPath);
            cleanupUploadFiles(tempFile, movedFile);
        } catch (SecurityException e) {
            resultMsg = "파일 업로드 실패: 보안 오류";
            logUploadError("Security error", e, tempFile, movedFile, userId, uploadPath);
            cleanupUploadFiles(tempFile, movedFile);
        } catch (DataAccessException e) {
            resultMsg = "파일 업로드 실패: 데이터베이스 오류";
            logUploadError("Database access error", e, tempFile, movedFile, userId, uploadPath);
            cleanupUploadFiles(tempFile, movedFile);
        } catch (SQLException e) {
            resultMsg = "파일 업로드 실패: 데이터베이스 쿼리 오류";
            logUploadError("SQL error", e, tempFile, movedFile, userId, uploadPath);
            cleanupUploadFiles(tempFile, movedFile);
        } catch (MultipartException e) {
            resultMsg = "파일 업로드 실패: 멀티파트 파일 처리 오류";
            logUploadError("Multipart error", e, tempFile, movedFile, userId, uploadPath);
            cleanupUploadFiles(tempFile, movedFile);
        } catch (UnsupportedOperationException e) {
            resultMsg = "파일 업로드 실패: 지원하지 않는 작업";
            logUploadError("Unsupported operation error", e, tempFile, movedFile, userId, uploadPath);
            cleanupUploadFiles(tempFile, movedFile);
        } catch (RuntimeException e) {
            resultMsg = "파일 업로드 실패: 런타임 오류";
            logUploadError("Runtime error", e, tempFile, movedFile, userId, uploadPath);
            cleanupUploadFiles(tempFile, movedFile);
        } catch (Exception e) {
            resultMsg = "파일 업로드 실패: 예상치 못한 오류";
            logUploadError("Unexpected error", e, tempFile, movedFile, userId, uploadPath);
            cleanupUploadFiles(tempFile, movedFile);
        }

        // 실패 시(urls 비어있음) 원인 분류 요약 한 줄 — 권한/인증 vs 파일 입출력 vs 보안 vs DB 구분.
        // (세부 스택트레이스는 위 logUploadError 의 'File upload - ...' 로그 참조)
        if (urls.isEmpty()) {
            log.warn("[파일 업로드 결과 없음] 원인={} (uploadPath={}, userId={}) — 호출 측 file_url 저장은 생략됩니다.",
                    resultMsg, uploadPath, userId);
        }

        return urls;
    }

    private void logUploadError(String errorType, Exception e, File tempFile, File movedFile, String userId, String uploadPath) {
        log.error("File upload - {}: userId={}, uploadPath={}, tempFile={}, movedFile={}, message={}",
                errorType,
                userId,
                uploadPath,
                tempFile != null ? tempFile.getAbsolutePath() : "null",
                movedFile != null ? movedFile.getAbsolutePath() : "null",
                e.getMessage(),
                e);
    }

    private void cleanupUploadFiles(File tempFile, File movedFile) {
        if (tempFile != null) {
            log.info("업로드 실패 후 temp 파일 정리 시도: path={}, exists={}",
                    tempFile.getAbsolutePath(), tempFile.exists());
            FileUtil.deleteFile(tempFile);
        }
        if (movedFile != null) {
            log.info("업로드 실패 후 moved 파일 정리 시도: path={}, exists={}",
                    movedFile.getAbsolutePath(), movedFile.exists());
            FileUtil.deleteFile(movedFile);
        }
    }

    /**
     * 개인정보 포함 파일 다운로드
     * @param url
     * @param jwtToken
     * @param request
     * @param isAuth
     * @param pionadaYn
     * @return
     * @throws Exception
     */
    public ResponseEntity<Object> downloadFile(String url, String jwtToken, HttpServletRequest request, boolean isAuth, String pionadaYn) throws Exception {
        Map<String, String> response = new HashMap<>();
        String userId = null;
        try {
            // SecurityContext에서 인증된 사용자 정보 추출
            SpAuthenticatedUser spUser = SecurityUtil.getCurrentSpUser();
            if (spUser != null) {
                userId = spUser.spUserId();
            }
            // jwtToken 파라미터가 있으면 fallback (레거시 호환)
            if (StringUtils.isEmpty(userId) && StringUtils.isNotEmpty(jwtToken)) {
                log.warn("SecurityContext에 사용자 없음, jwtToken 파라미터 무시 (SSO 전환 후)");
            }
            if (StringUtils.isEmpty(userId)) {
                throw new AuthFailedException("사용자 정보가 없습니다.");
            }

            String requestSource = request.getHeader("Referer");
            if (requestSource == null) {
                requestSource = "";
            }

            String fileUrl = StringUtils.substringBeforeLast(url, "/");
            String fileName = StringUtils.substringAfterLast(url, "/");

            FileVO paramFileVO = new FileVO();
            if (isAuth) {
                paramFileVO.setRgtr(userId);
            }
            paramFileVO.setFilePath(fileUrl + "/");
            paramFileVO.setFileName(fileName);

            log.info("[pfile-download] req userId={}, pionadaYn={}, isAuth={}, filePath={}, fileName={}",
                    userId, pionadaYn, isAuth, paramFileVO.getFilePath(), fileName);

            FileVO fileVO = null;

            // 피어나다의 경우 학생 파일을 교사가 생성할 수 있음
            if (StringUtils.equals(pionadaYn, "Y")) {
                fileVO = fileMapper.selectFileInfoWithPionada(paramFileVO);

                Map<String, Object> authChkMap = new HashMap<>();
                authChkMap.put("creator", fileVO.getRgtr());
                authChkMap.put("reader", userId);
                String sameCase = StringUtils.equals(userId, fileVO.getRgtr()) ? "Y" : "N";

                if (sameCase.equals("N")) {
                    List<String> tcList = fileMapper.selectTcListFromCreator(authChkMap);
                    String stdtId = fileMapper.selectFileAuthStudent(authChkMap);
                    if (CollectionUtils.isNotEmpty(tcList) || StringUtils.equals(userId, stdtId)) {
                        String authchk = tcList.contains(userId) || StringUtils.equals(userId, stdtId) ? "Y" : "N";
                        fileVO.setDownloadAuthYn(authchk);
                    }
                } else {
                    fileVO.setDownloadAuthYn("Y");
                }

            } else {
                fileVO = fileMapper.selectFileInfo(paramFileVO);
            }

            if (fileVO == null) {
                log.warn("[pfile-download] 거부(파일정보없음): userId={}, filePath={}, fileName={}",
                        userId, paramFileVO.getFilePath(), fileName);
                response.put("message", "파일 다운로드 실패: 파일 정보가 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response);
            }

            log.info("[pfile-download] file 조회: fileIdx={}, creator(rgtr)={}, downloadAuthYn={}, delYn={}, prsInfoYn={}",
                    fileVO.getFileIdx(), fileVO.getRgtr(),
                    fileVO.getDownloadAuthYn(), fileVO.getDelYn(), fileVO.getPrsInfoYn());

            if (isAuth && ObjectUtils.defaultIfNull(fileVO.getDownloadAuthYn(), "N").equals("N")) {
                log.warn("[pfile-download] 거부(권한없음): userId={}, creator(rgtr)={}, fileIdx={}, pionadaYn={}",
                        userId, fileVO.getRgtr(), fileVO.getFileIdx(), pionadaYn);
                response.put("message", "파일 다운로드 실패: 파일 열람 권한이 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response);
            }

            if ("Y".equals(fileVO.getDelYn()) && "Y".equals(fileVO.getPrsInfoYn())) {
                log.warn("[pfile-download] 거부(개인정보 삭제됨): userId={}, fileIdx={}",
                        userId, fileVO.getFileIdx());
                response.put("message", "파일 다운로드 실패: 개인정보 처리방침에 의해 삭제된 파일 입니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response);
            }

            // 다운로드 로그
            FileLogVO fileLogVO = setFileLogVO(fileVO, FileUtil.getRemoteIP(request), requestSource);
            fileLogVO.setUserId(userId);
            fileMapper.insertDownloadLog(fileLogVO);

            String saveFileName = fileVO.getSaveFileName();
            String originalFileName = fileVO.getFileName();

            String filePath = fileVO.getFilePath() + saveFileName;
            Path safePath = resolveSafePath(filePath);

            Resource resource = new UrlResource(safePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                String checksum = fileVO.getChecksum();
                if (StringUtils.isEmpty(checksum)) {
                    throw new IOException("파일 다운로드 실패: checksum 정보가 누락되었습니다.");
                }

                String fileChecksum = FileUtil.getHmacSHA256Checksum(filePath, keySaltMain);
                if (!StringUtils.equals(checksum, fileChecksum)) {
                    throw new IOException("파일 다운로드 실패: 파일이 손상되었습니다.");
                }

                // 저장 고유성용 UUID 접미사 "(32 hex)"는 사용자 노출 파일명에서 제거 (저장 파일명은 그대로 유지)
                String downloadFileName = stripUploadUuidSuffix(originalFileName);
                String encodedFileName = URLEncoder.encode(downloadFileName, "UTF-8").replace("+", "%20");
                String contentDisposition = "attachment; filename*=UTF-8''" + encodedFileName;

                HttpHeaders headers = new HttpHeaders();
                headers.add(HttpHeaders.CONTENT_DISPOSITION, contentDisposition);
                headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE);

                return new ResponseEntity<>(resource, headers, HttpStatus.OK);
            } else {
                response.put("message", "파일 다운로드 실패: 파일을 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response);
            }
        } catch (AuthFailedException e) {
            log.error("File download - Authentication failed: userId={}, url={}, message={}",
                    userId, url, e.getMessage(), e);
            response.put("message", "파일 다운로드 실패: 인증 오류");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (IOException e) {
            log.error("File download - IO error: userId={}, url={}, message={}",
                    userId, url, e.getMessage(), e);
            response.put("message", "파일 다운로드 실패: 파일 입출력 오류");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (SecurityException e) {
            log.error("File download - Security error: userId={}, url={}, message={}",
                    userId, url, e.getMessage(), e);
            response.put("message", "파일 다운로드 실패: 보안 오류");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            log.error("File download - Unexpected error: userId={}, url={}, message={}",
                    userId, url, e.getMessage(), e);
            response.put("message", "파일 다운로드 실패: 예상치 못한 오류");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        }
    }

    public byte[] loadFileBytesForMail(String url) throws Exception {
        FileVO fileVO = resolveFileInfoByUrl(url);
        if (fileVO == null) {
            if ("local".equals(serverEnv)) {
                Path localPath = Paths.get(url).toAbsolutePath().normalize();
                if (!Files.exists(localPath)) {
                    throw new FileNotFoundException("로컬 메일 첨부 파일을 찾을 수 없습니다: " + url);
                }
                return Files.readAllBytes(localPath);
            }
            throw new FileNotFoundException("메일 첨부용 파일 정보를 찾을 수 없습니다.");
        }
        if ("Y".equals(fileVO.getDelYn()) && "Y".equals(fileVO.getPrsInfoYn())) {
            throw new FileNotFoundException("개인정보 처리방침에 의해 삭제된 파일입니다.");
        }

        String filePath = fileVO.getFilePath() + fileVO.getSaveFileName();
        Path safePath = resolveSafePath(filePath);
        validateChecksum(fileVO, safePath.toString());

        return Files.readAllBytes(safePath);
    }

    public Map<String, Object> deleteFiles() {
        Map<String, Object> resultMap = new HashMap<>();
        List<FileVO> deletedFiles = new ArrayList<>();
        List<FileVO> failedFiles = new ArrayList<>();
        List<FileVO> fileVOList = fileMapper.selectFileInfoList();

        try {
            if (fileVOList != null && !fileVOList.isEmpty()) {
                for (FileVO fileVO : fileVOList) {
                    try {
                        String filePath = fileVO.getFilePath();
                        Path safePath = resolveSafePath(filePath); // 안전 경로 변환
                        boolean result = FileUtil.deleteFileReturn(safePath.toFile());

                        if (result) {
                            LocalDateTime now = LocalDateTime.now();
                            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                            String delTime = now.format(formatter);

                            fileVO.setDelYn("Y");
                            fileVO.setDelDt(delTime);
                            deletedFiles.add(fileVO);
                        } else {
                            failedFiles.add(fileVO);
                        }
                    } catch (SecurityException e) {
                        log.error("deleteFiles - Security error for file {}: {}", fileVO.getFileName(), e.getMessage());
                        failedFiles.add(fileVO);
                    } catch (IOException e) {
                        log.error("deleteFiles - IO error for file {}: {}", fileVO.getFileName(), e.getMessage());
                        failedFiles.add(fileVO);
                    } catch (IllegalArgumentException e) {
                        log.error("deleteFiles - Invalid argument error for file {}: {}", fileVO.getFileName(), e.getMessage());
                        failedFiles.add(fileVO);
                    } catch (NullPointerException e) {
                        log.error("deleteFiles - Null pointer error for file {}: {}", fileVO.getFileName(), e.getMessage());
                        failedFiles.add(fileVO);
                    } catch (DateTimeException e) {
                        log.error("deleteFiles - DateTime error for file {}: {}", fileVO.getFileName(), e.getMessage());
                        failedFiles.add(fileVO);
                    } catch (RuntimeException e) {
                        log.error("deleteFiles - Runtime error for file {}: {}", fileVO.getFileName(), e.getMessage());
                        failedFiles.add(fileVO);
                    } catch (Exception e) {
                        log.error("deleteFiles - Unexpected error for file {}: {}", fileVO.getFileName(), e.getMessage());
                        failedFiles.add(fileVO);
                    }
                }
            }
            resultMap.put("failDc", "success=" + deletedFiles.size() + ",fail=" + failedFiles.size());
        } catch (DataAccessException e) {
            log.error("deleteFiles - Database access error: {}", e.getMessage());
            resultMap.put("failDc", "데이터베이스 접근 오류: " + e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            log.error("deleteFiles - Invalid argument error: {}", e.getMessage());
            resultMap.put("failDc", "잘못된 파라미터: " + e.getMessage());
            throw e;
        } catch (NullPointerException e) {
            log.error("deleteFiles - Null pointer error: {}", e.getMessage());
            resultMap.put("failDc", "필수 데이터 누락: " + e.getMessage());
            throw e;
        } catch (RuntimeException e) {
            log.error("deleteFiles - Runtime error: {}", e.getMessage());
            resultMap.put("failDc", "런타임 오류: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("deleteFiles - Unexpected error: {}", e.getMessage());
            resultMap.put("failDc", "예상치 못한 오류: " + e.getMessage());
            throw e;
        } finally {
            if (!deletedFiles.isEmpty()) {
                fileMapper.updateFileInfoList(deletedFiles);
            }

            log.info("파일 삭제 성공 cnt : {} / 파일 삭제 실패 cnt : {}", deletedFiles.size(), failedFiles.size());
        }

        resultMap.put("resultOk", true);
        resultMap.put("btchExcnRsltCnt", deletedFiles.size());

        return resultMap;
    }

    /**
     * 파일 객체 세팅
     *
     * @param file
     * @param saveFileName
     * @param filePath
     * @param regId
     * @param requestSource
     * @return
     */
    private FileVO setFileVO(MultipartFile file, String saveFileName, String filePath, String regId, String requestSource, String prsInfoYn) throws Exception {

        if (StringUtils.startsWith(nasPath, "/") == false && StringUtils.startsWith(filePath, "/")) {
            filePath = StringUtils.removeStart(filePath, "/");
        }
        if (prsInfoYn == null || "".equals(prsInfoYn)) {
            prsInfoYn = "N";
        }
        String originFileName = file.getOriginalFilename();
        String ext = FileUtil.getFileExtension(originFileName);
        FileVO fileVO = new FileVO();
        fileVO.setFileName(originFileName);
        fileVO.setSaveFileName(saveFileName);
        fileVO.setFilePath(filePath);
        fileVO.setFileExtension(ext);
        fileVO.setFileSize(file.getSize());
        fileVO.setRgtr(regId);
        fileVO.setRequestSource(requestSource);
        String checksum = FileUtil.getHmacSHA256Checksum(filePath + "/" + saveFileName, keySaltMain);
        fileVO.setChecksum(checksum);
        fileVO.setPrsInfoYn(prsInfoYn);

        // 파일 중복 안되도록 uuid를 붙인다 (파일 경로로 data 조회 필요 - 학생 간 파일 공유 등)
        String uuid = UUID.randomUUID().toString().replaceAll("\\-", "");
        originFileName = StringUtils.substringBeforeLast(originFileName, ".");
        originFileName = originFileName + "(" + StringUtils.replace(uuid, "-", "") + ")." + ext;
        fileVO.setFileName(originFileName);

        return fileVO;
    }

    /**
     * 이미 디스크에 존재하는 파일을 업로드 파일로 등록한다 ({@link MultipartFile} 없이, 메모리 미적재).
     *
     * <p>{@link #uploadFile} 의 단일 파일 처리 흐름을 파일 기반으로 옮긴 것. 큰 zip 등 메모리에
     * 올리면 안 되는 파일을 등록할 때 사용한다. {@code srcFile} 은 {@link FileUtil#moveFile} 로
     * 업로드 경로에 이동되므로 호출 후 원본은 사라진다. 반환값은 {@code filePath + fileName} URL.
     */
    private String registerLocalFileAsUpload(File srcFile, String originalFileName, String uploadPath,
                                             String regId, String requestSource, String prsInfoYn) throws Exception {
        uploadPath = FileUtil.normalizeUploadPath(uploadPath);
        FileUtil.mkdirs(uploadPath);

        long fileSize = srcFile.length();
        String saveFileName = FileUtil.getSaveFileName(originalFileName);
        String copyFile = uploadPath + "/" + saveFileName;
        FileUtil.moveFile(srcFile, copyFile);

        FileVO fileVO = setFileVOFromFile(originalFileName, fileSize, saveFileName, uploadPath + "/", regId, requestSource, prsInfoYn);
        fileMapper.insertUploadFile(fileVO);

        return fileVO.getFilePath() + fileVO.getFileName();
    }

    /**
     * {@link #setFileVO} 의 파일 기반 버전. {@link MultipartFile} 대신 원본 파일명/크기를 직접 받는다.
     * checksum 계산·uuid 파일명 규칙 등은 {@link #setFileVO} 와 동일하게 맞춘다.
     */
    private FileVO setFileVOFromFile(String originalFileName, long fileSize, String saveFileName,
                                     String filePath, String regId, String requestSource, String prsInfoYn) throws Exception {
        if (StringUtils.startsWith(nasPath, "/") == false && StringUtils.startsWith(filePath, "/")) {
            filePath = StringUtils.removeStart(filePath, "/");
        }
        if (prsInfoYn == null || "".equals(prsInfoYn)) {
            prsInfoYn = "N";
        }
        String ext = FileUtil.getFileExtension(originalFileName);
        FileVO fileVO = new FileVO();
        fileVO.setFileName(originalFileName);
        fileVO.setSaveFileName(saveFileName);
        fileVO.setFilePath(filePath);
        fileVO.setFileExtension(ext);
        fileVO.setFileSize(fileSize);
        fileVO.setRgtr(regId);
        fileVO.setRequestSource(requestSource);
        String checksum = FileUtil.getHmacSHA256Checksum(filePath + "/" + saveFileName, keySaltMain);
        fileVO.setChecksum(checksum);
        fileVO.setPrsInfoYn(prsInfoYn);

        // 파일 중복 안되도록 uuid를 붙인다 (setFileVO 와 동일 규칙)
        String uuid = UUID.randomUUID().toString().replaceAll("\\-", "");
        String baseName = StringUtils.substringBeforeLast(originalFileName, ".");
        fileVO.setFileName(baseName + "(" + uuid + ")." + ext);

        return fileVO;
    }

    /**
     * 업로드 시 중복 방지용으로 붙인 UUID 접미사 "(32 hex)"를 확장자 직전에서 제거한다.
     * 저장 파일명/URL 은 그대로 두고, 다운로드(Content-Disposition) 노출 파일명만 깔끔하게 정리하는 용도.
     * 예) [반]종합학습검사_1차(23d4...defb).zip → [반]종합학습검사_1차.zip
     * 패턴이 없으면(레거시·다른 형식) 원본을 그대로 반환한다.
     */
    private String stripUploadUuidSuffix(String fileName) {
        if (StringUtils.isBlank(fileName)) {
            return fileName;
        }
        return fileName.replaceFirst("\\([0-9a-fA-F]{32}\\)(\\.[^.]+)$", "$1");
    }

    private FileLogVO setFileLogVO(FileVO fileVO, String accessIp, String requestSource) {
        FileLogVO fileLogVO = new FileLogVO();
        fileLogVO.setFileIdx(fileVO.getFileIdx());
        fileLogVO.setUserId(fileVO.getRgtr());
        fileLogVO.setAccessIp(accessIp);
        fileLogVO.setRequestSource(requestSource);
        if (fileVO != null) {
            fileLogVO.setFileName(fileVO.getFileName());
        }
        return fileLogVO;
    }

    private FileLogVO setFileLogMapToDto(Map<String, Object> fileMap, String accessIp, String requestSource) {
        FileLogVO fileLogVO = new FileLogVO();
        fileLogVO.setFileIdx(MapUtils.getInteger(fileMap, "fileIdx", 0));
        fileLogVO.setUserId(MapUtils.getString(fileMap, "rgtr", ""));
        fileLogVO.setAccessIp(accessIp);
        fileLogVO.setRequestSource(requestSource);
        if(MapUtils.isNotEmpty(fileMap)) {
            fileLogVO.setFileName(MapUtils.getString(fileMap, "fileName"));
        }
        return fileLogVO;
    }

    /**
     * 파일 유효성 검사
     *
     * @param file
     * @throws FileNotFoundException
     */
    private void validateFile(MultipartFile file) throws FileNotFoundException {
        if (file.isEmpty()) {
            throw new FileNotFoundException("파일이 없습니다.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new MaxUploadSizeExceededException(MAX_FILE_SIZE);
        }
        if (!FileUtil.isAllowedExtension(file)) {
            throw new IllegalArgumentException("허용되지 않은 파일 형식입니다.");
        }
    }

    /**
     * 일괄 다운로드용 zip 을 생성해 NAS 에 저장하고, {@code tb_dgnss_info} 의 type 별 zip URL 컬럼에 URL 을
     * 등록한 뒤 그 URL 을 반환한다. (2단계 다운로드 중 1단계: 생성)
     *
     * <p><b>OOM 방지</b>: zip 을 메모리({@link ByteArrayOutputStream})가 아닌 임시 파일에 직접
     * 스트리밍한 뒤, 그 파일을 업로드 파일로 등록(checksum 포함)한다. 반환된 URL 은 별도 호출인
     * {@code /pfile-download} 로 다운로드하며, 그쪽은 {@code Resource} 서빙이라 Range/이어받기를 지원한다.
     */
    @Transactional(rollbackFor = Exception.class)
    public String createDgnssDownloadAllZip(HttpServletRequest request, boolean isAuth, Map<String, Object> param) throws Exception {
        Long reqUserNo = SecurityUtil.getCurrentUserNo();
        String userId = SecurityUtil.getCurrentSpUserId(); // 로그용
        if (reqUserNo == null) {
            throw new AuthFailedException("사용자 정보가 없습니다.");
        }

        String requestSource = request.getHeader("Referer");
        if (requestSource == null) {
            requestSource = "";
        }
        if (isAuth) {
            param.put("reqUserNo", reqUserNo);
        }

        String type = MapUtils.getString(param, "type", "1");
        String dgnssId = MapUtils.getString(param, "dgnssId", "");
        log.info("createDgnssDownloadAllZip 시작: dgnssId={}, type={}, userId={}", dgnssId, type, userId);

        // 이미 생성된 zip 이 있으면 재생성 없이 바로 반환 (type 별 컬럼 조회)
        String existingUrl = fileMapper.selectDgnssZipFileUrl(param);
        if (StringUtils.isNotBlank(existingUrl)) {
            log.info("createDgnssDownloadAllZip 기존 zip 반환: dgnssId={}, type={}, url={}", dgnssId, type, existingUrl);
            return existingUrl;
        }

        Map<String, Object> dgnssInfo = fileMapper.selectTcDgnssInfoWithId(param);
        if (MapUtils.isEmpty(dgnssInfo)) {
            log.error("createDgnssDownloadAllZip 실패(검사 정보 없음): dgnssId={}, type={}, userId={}", dgnssId, type, userId);
            throw new Exception("검사 정보가 없습니다");
        }

        String dgnssName = StringUtils.equals(MapUtils.getString(dgnssInfo, "paperIdx", ""), "1") ? "종합학습검사" : "자기조절학습검사";
        String ordNo = StringUtils.equals(MapUtils.getString(dgnssInfo, "ordNo", ""), "1") ? "1차" : "2차";
        // 반 이름에 포함된 '/'(경로 구분자)는 파일명/다운로드 URL 분리(substringBeforeLast/AfterLast)를 깨뜨린다.
        // OS·URL·브라우저 모두 파일명에 ASCII '/'를 허용하지 않으므로, 시각적으로 동일한 전각 '／'(U+FF0F)로 치환한다.
        String clsName = MapUtils.getString(dgnssInfo, "claNm", "").replace('/', '／');
        String zipFileName;
        if (StringUtils.equals(type, "2")) {
            zipFileName = "[" + clsName + "]" + dgnssName + "_" + ordNo + "_요약본.zip";
        } else {
            zipFileName = "[" + clsName + "]" + dgnssName + "_" + ordNo + ".zip";
        }

        // OOM 방지: zip 을 힙이 아닌 임시 파일에 직접 스트리밍
        String tempDir = nasRoot() + "/temp/";
        FileUtil.mkdirs(tempDir);
        File tempZip = File.createTempFile("dgnss-zip-", ".zip", new File(tempDir));

        try {
            try (ZipOutputStream zipOut = new ZipOutputStream(
                    new BufferedOutputStream(new FileOutputStream(tempZip)), StandardCharsets.UTF_8)) {
                if (StringUtils.equals(type, "3")) {
                    List<Map<String, Object>> detailFileInfoList = fileMapper.selectFileDgnssFileList(param);
                    List<Map<String, Object>> summaryFileInfoList = fileMapper.selectFileDgnssSummaryList(param);
                    if (CollectionUtils.isEmpty(detailFileInfoList) && CollectionUtils.isEmpty(summaryFileInfoList)) {
                        log.error("createDgnssDownloadAllZip 실패(파일 정보 없음): dgnssId={}, type=3, userId={}", dgnssId, userId);
                        throw new Exception("파일 정보가 없습니다");
                    }
                    enrichMaps(detailFileInfoList);
                    enrichMaps(summaryFileInfoList);
                    addDgnssFilesToZip(detailFileInfoList, "상세 보고서", zipOut, isAuth, userId, request, requestSource);
                    addDgnssFilesToZip(summaryFileInfoList, "요약 보고서", zipOut, isAuth, userId, request, requestSource);
                } else {
                    List<Map<String, Object>> fileInfoList = StringUtils.equals(type, "1")
                            ? fileMapper.selectFileDgnssFileList(param)
                            : fileMapper.selectFileDgnssSummaryList(param);
                    if (CollectionUtils.isEmpty(fileInfoList)) {
                        log.error("createDgnssDownloadAllZip 실패(파일 정보 없음): dgnssId={}, type={}, userId={}", dgnssId, type, userId);
                        throw new Exception("파일 정보가 없습니다");
                    }
                    enrichMaps(fileInfoList);
                    addDgnssFilesToZip(fileInfoList, "", zipOut, isAuth, userId, request, requestSource);
                }
                zipOut.finish();
            }

            // 생성된 zip 을 업로드 파일로 등록 (checksum 포함) → /pfile-download 로 다운로드 가능
            String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String uploadPath = nasRoot() + "/" + datePath;
            String url = registerLocalFileAsUpload(tempZip, zipFileName, uploadPath, userId, requestSource, "Y");

            // tb_dgnss_info.zip_file_url 등록
            Map<String, Object> updateParam = new HashMap<>();
            updateParam.put("dgnssId", dgnssId);
            updateParam.put("type", type);
            updateParam.put("zipFileUrl", url);
            fileMapper.updateDgnssZipFileUrl(updateParam);

            log.info("createDgnssDownloadAllZip 완료: dgnssId={}, type={}, userId={}, zipFileName={}, url={}",
                    dgnssId, type, userId, zipFileName, url);
            return url;
        } catch (Exception e) {
            log.error("createDgnssDownloadAllZip 실패: dgnssId={}, type={}, userId={}", dgnssId, type, userId, e);
            throw e;
        } finally {
            // 정상 시 moveFile 로 원본이 이동돼 사라지지만, 실패 경로에서 남은 임시파일 정리
            if (tempZip.exists()) {
                FileUtil.deleteFile(tempZip);
            }
        }
    }

    private void addDgnssFilesToZip(List<Map<String, Object>> fileInfoList,
                                    String folderName,
                                    ZipOutputStream zipOut,
                                    boolean isAuth,
                                    String userId,
                                    HttpServletRequest request,
                                    String requestSource) throws Exception {
        if (CollectionUtils.isEmpty(fileInfoList)) {
            return;
        }

        Set<String> usedZipEntries = new HashSet<>();
        for (Map<String, Object> fileMap : fileInfoList) {
            prepareAndValidateDgnssFileMap(fileMap, isAuth, userId, request, requestSource);
            String zipEntryPath = buildDgnssZipEntryPath(fileMap, folderName, usedZipEntries);
            writeDgnssFileToZip(fileMap, zipEntryPath, zipOut);
        }
    }

    private void prepareAndValidateDgnssFileMap(Map<String, Object> fileMap,
                                                boolean isAuth,
                                                String userId,
                                                HttpServletRequest request,
                                                String requestSource) throws Exception {
        String fileUrl = StringUtils.substringBeforeLast(MapUtils.getString(fileMap, "fileUrl", ""), "/");
        String fileName = StringUtils.substringAfterLast(MapUtils.getString(fileMap, "fileUrl", ""), "/");
        fileMap.put("filePath", fileUrl + "/");
        fileMap.put("fileName", fileName);

        if (isAuth && MapUtils.getString(fileMap, "downloadAuthYn", "N").equals("N")) {
            throw new Exception("파일 열람 권한이 없습니다.");
        }

        if ("Y".equals(MapUtils.getString(fileMap, "delYn", "")) &&
                "Y".equals(MapUtils.getString(fileMap, "prsInfoYn", ""))) {
            throw new Exception("개인정보 처리방침에 의해 삭제된 파일입니다.");
        }

        FileLogVO fileLogVO = setFileLogMapToDto(fileMap, FileUtil.getRemoteIP(request), requestSource);
        fileLogVO.setUserId(userId);
        fileMapper.insertDownloadLog(fileLogVO);

        String filePath = MapUtils.getString(fileMap, "filePath", "") + MapUtils.getString(fileMap, "saveFileName", "");
        Path safePath = resolveSafePath(filePath);
        File file = safePath.toFile();
        if (!file.exists() || !file.isFile()) {
            throw new FileNotFoundException("다운로드 대상 파일이 없습니다.");
        }

        String checksum = MapUtils.getString(fileMap, "checksum", "");
        if (StringUtils.isEmpty(checksum)) {
            throw new Exception("파일 체크섬 정보가 없습니다.");
        }

        String fileChecksum = FileUtil.getHmacSHA256Checksum(safePath.toString(), keySaltMain);
        if (!StringUtils.equals(checksum, fileChecksum)) {
            throw new IOException("파일 다운로드 실패: 파일이 손상되었습니다.");
        }
    }

    private String buildDgnssZipEntryPath(Map<String, Object> fileMap, String folderName, Set<String> usedZipEntries) {
        String stdtNm = MapUtils.getString(fileMap, "userNm", "파일");
        String baseName = stdtNm + ".pdf";
        String entryPath = StringUtils.isBlank(folderName) ? baseName : folderName + "/" + baseName;
        if (usedZipEntries.add(entryPath)) {
            return entryPath;
        }

        String stdtId = MapUtils.getString(fileMap, "userId", "");
        String fallbackName = StringUtils.isBlank(stdtId) ? (stdtNm + "_2.pdf") : (stdtNm + "_" + stdtId + ".pdf");
        String fallbackEntryPath = StringUtils.isBlank(folderName) ? fallbackName : folderName + "/" + fallbackName;
        if (usedZipEntries.add(fallbackEntryPath)) {
            return fallbackEntryPath;
        }

        int sequence = 2;
        while (true) {
            String seqName = stdtNm + "_" + sequence + ".pdf";
            String seqEntryPath = StringUtils.isBlank(folderName) ? seqName : folderName + "/" + seqName;
            if (usedZipEntries.add(seqEntryPath)) {
                return seqEntryPath;
            }
            sequence++;
        }
    }

    private void writeDgnssFileToZip(Map<String, Object> fileMap, String zipEntryPath, ZipOutputStream zipOut) throws Exception {
        String saveFileName = MapUtils.getString(fileMap, "saveFileName", "");
        String fileUrl = MapUtils.getString(fileMap, "filePath", "");
        Path safePath = resolveSafePath(fileUrl + saveFileName);
        File file = safePath.toFile();
        if (!file.exists() || !file.isFile()) {
            return;
        }

        try (InputStream fis = new FileInputStream(file)) {
            zipOut.putNextEntry(new ZipEntry(zipEntryPath));
            byte[] buffer = new byte[1024];
            int len;
            while ((len = fis.read(buffer)) > 0) {
                zipOut.write(buffer, 0, len);
            }
            zipOut.closeEntry();
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public List<LinkedHashMap<String, Object>> uploadDgnssForBatch(List<MultipartFile> files, String uploadPath) {

        if (StringUtils.startsWith(uploadPath, "/") == false) {
            uploadPath = "/" + uploadPath;
        }

        List<LinkedHashMap<String, Object>> urls = new ArrayList<>();

        String resultMsg = "파일 업로드 성공";
        File tempFile = null; // 임시 파일 저장용
        File movedFile = null; // 이동된 파일 저장용
        String userId = null;

        try {
            for (MultipartFile file : files) {
                validateFile(file);

                // 업로드 경로 지정
                uploadPath = FileUtil.normalizeUploadPath(uploadPath);
                String tempPath = nasRoot() + "/temp/";  // 임시저장

                // 파일 경로 생성 (temp + 최종 업로드 경로 모두 보장)
                FileUtil.mkdirs(tempPath);
                FileUtil.mkdirs(uploadPath);

                // 파일명 생성
                String saveFileName = FileUtil.getSaveFileName(file.getOriginalFilename());

                // 파일 저장
                tempFile = new File(tempPath + saveFileName);
                file.transferTo(tempFile);

                // 파일 이동
                String copyPath = uploadPath;
                String copyFile = copyPath + "/" + saveFileName;
                movedFile = FileUtil.moveFile(tempFile, copyFile);

                // DB 저장
                FileVO fileVO = setFileVO(file, saveFileName, copyPath + "/", userId, "Batch Dgnss", "Y");
                fileMapper.insertUploadFile(fileVO);

                // 파일 저장 후 tempFile 참조를 null로 설정
                tempFile = null;
                movedFile = null;

                LinkedHashMap<String, Object> fileMap = new LinkedHashMap<>();
                String storedUrl = fileVO.getFilePath() + fileVO.getFileName();
                // 업로드 직후 실제 저장 경로 추적용 — filePath/fileName 분리값과 결합 url 을 [] 로 감싸 기록
                log.info("[파일 업로드 성공] filePath=[{}], fileName=[{}], url=[{}]",
                        fileVO.getFilePath(), fileVO.getFileName(), storedUrl);
                fileMap.put("url", storedUrl);
                urls.add(fileMap);
            }
        } catch (Exception e) {

            resultMsg = "파일 업로드 실패: " + e.getMessage();
            logUploadError("Batch Dgnss upload error", e, tempFile, movedFile, userId, uploadPath);

            // 업로드 실패 시, 생성된 파일이 있다면 삭제
            cleanupUploadFiles(tempFile, movedFile);
        }

        return urls;
    }

    /**
     * CSAP 대응
     * nas 경로 검증
     * @param filePath
     * @return
     * @throws IOException
     */
    public Path resolveSafePath(String filePath) throws IOException {
        if (filePath == null || filePath.isBlank()) {
            throw new SecurityException("Invalid path");
        }

        // 설정 주입된 NAS 루트 (예: /files/nas/engl)
        Path baseDir = Paths.get(nasPath).toAbsolutePath().normalize();
        Path baseReal = baseDir.toRealPath(LinkOption.NOFOLLOW_LINKS);

        Path candidate = Paths.get(filePath).normalize();
        Path resolved;

        if (candidate.isAbsolute()) {
            // 절대경로는 baseDir 하위일 때만 허용
            Path candidateReal = candidate.toRealPath(LinkOption.NOFOLLOW_LINKS);
            if (!candidateReal.startsWith(baseReal)) {
                throw new SecurityException("Absolute path outside of baseDir not allowed: " + filePath);
            }
            resolved = candidateReal;
        } else {
            // 상대경로는 baseDir에 붙여서 해석
            resolved = baseDir.resolve(candidate).normalize().toRealPath(LinkOption.NOFOLLOW_LINKS);
            if (!resolved.startsWith(baseReal)) {
                throw new SecurityException("Path escapes baseDir: " + filePath);
            }
        }

        // 심볼릭 링크 직접 대상 금지(정책에 따라 완화 가능)
        if (Files.isSymbolicLink(resolved)) {
            throw new SecurityException("Symbolic link not allowed: " + filePath);
        }

        return resolved;
    }

    private FileVO resolveFileInfoByUrl(String url) {
        String fileUrl = StringUtils.substringBeforeLast(url, "/");
        String fileName = StringUtils.substringAfterLast(url, "/");

        FileVO paramFileVO = new FileVO();
        paramFileVO.setFilePath(fileUrl + "/");
        paramFileVO.setFileName(fileName);

        return fileMapper.selectFileInfo(paramFileVO);
    }

    private void validateChecksum(FileVO fileVO, String filePath) throws Exception {
        String checksum = fileVO.getChecksum();
        if (StringUtils.isEmpty(checksum)) {
            throw new IOException("파일 checksum 정보가 누락되었습니다.");
        }

        String fileChecksum = FileUtil.getHmacSHA256Checksum(filePath, keySaltMain);
        if (!StringUtils.equals(checksum, fileChecksum)) {
            throw new IOException("파일 checksum 검증에 실패했습니다.");
        }
    }

    /**
     * Map 리스트에서 sp_user_id로 닉네임/이메일을 IDP에서 조회하여 채우기.
     * TODO: 나중에 GroupService.enrichMaps와 DRY 리팩토링 (Phase 4)
     */
    private void enrichMaps(List<Map<String, Object>> items) {
        if (items == null || items.isEmpty()) return;

        List<UserSlot> slots = items.stream()
                .map(m -> (String) m.get("userSpUserId"))
                .filter(Objects::nonNull)
                .distinct()
                .map(UserSlot::new)
                .toList();
        if (slots.isEmpty()) return;

        userInfoEnricher.enrich(slots);

        Map<String, UserSlot> bySpUserId = slots.stream()
                .collect(Collectors.toMap(UserSlot::getSpUserId, s -> s));
        items.forEach(m -> {
            String spUserId = (String) m.get("userSpUserId");
            if (spUserId == null) return;
            UserSlot slot = bySpUserId.get(spUserId);
            if (slot != null) {
                m.put("userNm", slot.getName());
            } else {
                // sp_user_id가 있지만 조회 실패: 다시 stdt_id로 fallback
                String stdtId = (String) m.get("userId");
                m.put("userNm", stdtId != null ? stdtId : "파일");
            }
        });
    }
}
