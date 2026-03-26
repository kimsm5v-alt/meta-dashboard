package com.vs.meta.common.service;

import com.vs.meta.common.security.JwtUtil;
import com.vs.meta.common.exception.AuthFailedException;
import com.vs.meta.common.vo.FileVO;
import com.vs.meta.common.vo.FileLogVO;
import com.vs.meta.common.mapper.FileMapper;
import com.vs.meta.common.utils.FileUtil;
import io.jsonwebtoken.Claims;
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
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.servlet.http.HttpServletRequest;
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
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    @Value("${cloud.aws.nas.path}")
    private String nasPath;

    private long MAX_FILE_SIZE = 1000 * 1024 * 1024; // 1000mb

    private final FileMapper fileMapper;

    private final JwtUtil jwtUtil;

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
            String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                /*로컬 테스트 시 주석 변경하여 테스트*/
                /*userId = "mathbook253-t";*/
                log.error("Authorization 헤더 누락 또는 잘못된 형식");
                throw new AuthFailedException("Authorization 헤더 누락 또는 잘못된 형식");
            }
            else {
                String jwtToken = authorizationHeader.substring(7); // "Bearer " 제거
                Claims claims = jwtUtil.getAllClaimsFromToken(jwtToken);
                userId = claims.get("id", String.class);
                if (userId == null) {
                    log.error("JWT에서 id 값이 누락되었습니다.");
                    throw new AuthFailedException("JWT에서 id 값이 누락되었습니다.");
                }
            }

            String requestSource = request.getHeader("Referer"); // 요청 출처를 헤더에서 추출
            if (requestSource == null) {
                requestSource = "";  // 기본 값 설정
            }

            for (MultipartFile file : files) {
                validateFile(file);

                // 업로드 경로 지정
                uploadPath = FileUtil.normalizeUploadPath(uploadPath);
                String tempPath = nasPath + "/temp/";  // 임시저장

                // 파일 경로 생성
                FileUtil.mkdirs(tempPath);

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
                fileMap.put("url", fileVO.getFilePath() + fileVO.getFileName());
                urls.add(fileMap);
            }
        } catch (AuthFailedException e) {
            resultMsg = "인증 실패: " + e.getMessage();
            log.error("File upload - Authentication failed: {}", e.getMessage());
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
        } catch (IllegalArgumentException e) {
            resultMsg = "파일 업로드 실패: 잘못된 파라미터";
            log.error("File upload - Invalid argument error: {}", e.getMessage());
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
        } catch (NullPointerException e) {
            resultMsg = "파일 업로드 실패: 필수 데이터 누락";
            log.error("File upload - Null pointer error: {}", e.getMessage());
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
        } catch (IOException e) {
            resultMsg = "파일 업로드 실패: 파일 입출력 오류";
            log.error("File upload - IO error: {}", e.getMessage());
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
        } catch (SecurityException e) {
            resultMsg = "파일 업로드 실패: 보안 오류";
            log.error("File upload - Security error: {}", e.getMessage());
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
        } catch (DataAccessException e) {
            resultMsg = "파일 업로드 실패: 데이터베이스 오류";
            log.error("File upload - Database access error: {}", e.getMessage());
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
        } catch (SQLException e) {
            resultMsg = "파일 업로드 실패: 데이터베이스 쿼리 오류";
            log.error("File upload - SQL error: {}", e.getMessage());
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
        } catch (MultipartException e) {
            resultMsg = "파일 업로드 실패: 멀티파트 파일 처리 오류";
            log.error("File upload - Multipart error: {}", e.getMessage());
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
        } catch (UnsupportedOperationException e) {
            resultMsg = "파일 업로드 실패: 지원하지 않는 작업";
            log.error("File upload - Unsupported operation error: {}", e.getMessage());
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
        } catch (RuntimeException e) {
            resultMsg = "파일 업로드 실패: 런타임 오류";
            log.error("File upload - Runtime error: {}", e.getMessage());
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
        } catch (Exception e) {
            resultMsg = "파일 업로드 실패: 예상치 못한 오류";
            log.error("File upload - Unexpected error: {}", e.getMessage());
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
        }

        return urls;
    }

    /**
     * 개인정보 포함 파일 다운로드
     * @param url
     * @param jwtToken
     * @param request
     * @param isAuth
     * @param pionadaYn
     * @param partnerActivityYn
     * @return
     * @throws Exception
     */
    public ResponseEntity<Object> downloadFile(String url, String jwtToken, HttpServletRequest request, boolean isAuth, String pionadaYn, String partnerActivityYn) throws Exception {
        Map<String, String> response = new HashMap<>();
        String userId = null;
        try {
            if (StringUtils.isEmpty(jwtToken)) {
                log.error("JWT 토큰 값이 누락되었습니다.");
                throw new AuthFailedException("JWT 토큰 값이 누락되었습니다.");
            } else {
                Claims claims = jwtUtil.getAllClaimsFromToken(jwtToken);
                userId = claims.get("id", String.class);
            }
            if (StringUtils.isEmpty(userId)) {
                throw new AuthFailedException("JWT 토큰 값 오류 - 사용자 정보가 없습니다.");
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

            } else if (StringUtils.equals(partnerActivityYn, "Y")) {
                fileVO = fileMapper.selectFileInfoWithPartnerActivity(paramFileVO);
            } else {
                fileVO = fileMapper.selectFileInfo(paramFileVO);
            }

            if (fileVO == null) {
                response.put("message", "파일 다운로드 실패: 파일 정보가 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response);
            }

            if (isAuth && ObjectUtils.defaultIfNull(fileVO.getDownloadAuthYn(), "N").equals("N")) {
                response.put("message", "파일 다운로드 실패: 파일 열람 권한이 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(response);
            }

            if ("Y".equals(fileVO.getDelYn()) && "Y".equals(fileVO.getPrsInfoYn())) {
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

                String encodedFileName = URLEncoder.encode(originalFileName, "UTF-8").replace("+", "%20");
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
            log.error("File download - Authentication failed: {}", e.getMessage());
            response.put("message", "파일 다운로드 실패: 인증 오류");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (IOException e) {
            log.error("File download - IO error: {}", e.getMessage());
            response.put("message", "파일 다운로드 실패: 파일 입출력 오류");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (SecurityException e) {
            log.error("File download - Security error: {}", e.getMessage());
            response.put("message", "파일 다운로드 실패: 보안 오류");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        } catch (Exception e) {
            log.error("File download - Unexpected error: {}", e.getMessage());
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
     * 파일 일괄 다운로드
     * @param jwtToken
     * @param request
     * @param isAuth
     * @param param
     * @return
     * @throws Exception
     */
    public ResponseEntity<StreamingResponseBody> dgnssDownloadAll(String jwtToken, HttpServletRequest request, boolean isAuth, Map<String, Object> param) throws Exception {
        Map<String, String> response = new HashMap<>();
        String userId = null;
        if (StringUtils.isEmpty(jwtToken)) {
            log.error("JWT 토큰 값이 누락되었습니다.");
            throw new AuthFailedException("JWT 토큰 값이 누락되었습니다.");
        } else {
            Claims claims = jwtUtil.getAllClaimsFromToken(jwtToken);
            userId = claims.get("id", String.class);
        }
        if (StringUtils.isEmpty(userId)) {
            throw new AuthFailedException("JWT 토큰 값 오류 - 사용자 정보가 없습니다.");
        }

        String requestSource = request.getHeader("Referer"); // 요청 출처를 헤더에서 추출
        if (requestSource == null) {
            requestSource = "";  // 기본 값 설정
        }

        if (isAuth) {
            param.put("rgtr", userId);
        }

        // 피어나다의 경우 학생 파일을 교사가 생성할 수 있음
        String type = MapUtils.getString(param, "type", "1");
        List<Map<String, Object>> fileInfoList = new ArrayList<>();
        if (StringUtils.equals(type, "1")) {
            fileInfoList = fileMapper.selectFileDgnssFileList(param);
        } else {
            fileInfoList = fileMapper.selectFileDgnssSummaryList(param);
        }
        if (CollectionUtils.isEmpty(fileInfoList)) {
            throw new Exception("파일 정보가 없습니다");
        }

        // 검사 정보 조회
        Map<String, Object> dgnssInfo = fileMapper.selectTcDgnssInfoWithId(param);
        if (MapUtils.isEmpty(dgnssInfo)) {
            throw new Exception("검사 정보가 없습니다");
        }
        String claId = MapUtils.getString(dgnssInfo, "claId", "");

        // 학생 이름 매핑 및 학급 정보
        Map<String, Object> userIdMap = new HashMap<>();

        // fileInfoList에서 학생 이름 매핑
        for (Map<String, Object> fileMap : fileInfoList) {
            String stdtId = MapUtils.getString(fileMap, "userId", "");
            String stdtNm = MapUtils.getString(fileMap, "userNm", "");
            if (StringUtils.isNotEmpty(stdtId)) {
                userIdMap.put(stdtId, stdtNm);
            }
        }

        for (Map<String, Object> fileMap : fileInfoList) {
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

            // 로그 기록
            FileLogVO fileLogVO = setFileLogMapToDto(fileMap, FileUtil.getRemoteIP(request), requestSource);
            fileLogVO.setUserId(userId);
            fileMapper.insertDownloadLog(fileLogVO);

            // 파일 존재 및 체크섬 확인
            String saveFileName = MapUtils.getString(fileMap, "saveFileName", "");
            Path filePath = Paths.get(fileUrl).resolve(saveFileName).normalize();
            File file = filePath.toFile();

            String fileChecksum = null;

            String checksum = MapUtils.getString(fileMap, "checksum", "");
            if (StringUtils.isEmpty(checksum)) {
                throw new Exception("파일 체크섬 정보가 없습니다.");
            }

            fileChecksum = FileUtil.getHmacSHA256Checksum(filePath.toString(), keySaltMain);
            if (StringUtils.equals(checksum, fileChecksum) == false) {
                throw new IOException("파일 다운로드 실패: 파일이 손상되었습니다.");
            }
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zipOut = new ZipOutputStream(baos, StandardCharsets.UTF_8)) {
            for (Map<String, Object> fileMap : fileInfoList) {
                String stdtId = MapUtils.getString(fileMap, "userId", "");
                String saveFileName = MapUtils.getString(fileMap, "saveFileName", "");
                String fileUrl = MapUtils.getString(fileMap, "filePath", "");
                Path filePath = Paths.get(fileUrl).resolve(saveFileName).normalize();
                File file = filePath.toFile();
                if (!file.exists() || !file.isFile()) continue;

                try (InputStream fis = new FileInputStream(file)) {
                    String zipFileName = MapUtils.getString(userIdMap, stdtId, "파일") + ".pdf";
                    zipOut.putNextEntry(new ZipEntry(zipFileName));
                    byte[] buffer = new byte[1024];
                    int len;
                    while ((len = fis.read(buffer)) > 0) {
                        zipOut.write(buffer, 0, len);
                    }
                    zipOut.closeEntry();
                }
            }
            zipOut.finish();
        } catch (Exception e) {
            log.error("ZIP 생성 오류: {}", e.getMessage());
        }
        byte[] zipBytes = baos.toByteArray();

        String dgnssName = StringUtils.equals(MapUtils.getString(dgnssInfo, "paperIdx", ""), "1") ? "종합학습검사" : "자기조절학습검사";
        String ordNo = StringUtils.equals(MapUtils.getString(dgnssInfo, "ordNo", ""), "1") ? "1차" : "2차";
        String clsName = MapUtils.getString(dgnssInfo, "claNm", "");
        String zipFileName = StringUtils.equals("1", type) ? "[" + clsName + "]" + dgnssName + "_" + ordNo + ".zip" : "[" + clsName + "]" + dgnssName + "_" + ordNo + "_요약본" + ".zip";
        String encodedFileName = URLEncoder.encode(zipFileName, StandardCharsets.UTF_8).replace("+", "%20");

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + encodedFileName);
        headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE);
        headers.add("Access-Control-Expose-Headers", "Content-Disposition");
        headers.setContentLength(zipBytes.length);

        StreamingResponseBody stream = outputStream -> {
            outputStream.write(zipBytes);
            outputStream.flush();
        };

        return new ResponseEntity<>(stream, headers, HttpStatus.OK);
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
                String tempPath = nasPath + "/temp/";  // 임시저장

                // 파일 경로 생성
                FileUtil.mkdirs(tempPath);

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
                fileMap.put("url", fileVO.getFilePath() + fileVO.getFileName());
                urls.add(fileMap);
            }
        } catch (Exception e) {

            resultMsg = "파일 업로드 실패: " + e.getMessage();
            log.error(resultMsg);

            // 업로드 실패 시, 생성된 파일이 있다면 삭제
            FileUtil.deleteFile(tempFile);
            FileUtil.deleteFile(movedFile);
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
}
