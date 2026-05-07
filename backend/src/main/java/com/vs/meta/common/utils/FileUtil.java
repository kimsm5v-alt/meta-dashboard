package com.vs.meta.common.utils;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.http.HttpServletRequest;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.AccessDeniedException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
public class FileUtil {

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "pdf", "txt", "zip", "hwp", "hwpx" , "doc", "docx","mp3", "mp4", "webm", "ogg", "wav", "m4a", "svg", "ppt", "pptx", "xls", "xlsx");
    private static final List<String> REJECT_EXTENSIONS = Arrays.asList("exe", "swf", "flv", "f4v", "jsp", "jspx", "jspf");

    public static List<String> getAllowedExtensions() {
        return ALLOWED_EXTENSIONS;
    }

    public static List<String> getRejectedExtensions() {
        return REJECT_EXTENSIONS;
    }

    // 랜덤 파일명 생성
    public static String generateRandomFileName() {
        UUID uuid = UUID.randomUUID();
        return uuid.toString();
    }

    // 파일 확장자 추출
    public static String getFileExtension(String fileName) {
        if (fileName == null || fileName.isBlank()) return "";

        // 1) 파일명에서 경로 구분자 제거(만약 클라이언트가 풀패스 보냈다면)
        //    윈도우 '\' 도 고려
        int lastSlash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'));
        String baseName = (lastSlash >= 0) ? fileName.substring(lastSlash + 1) : fileName;

        // 2) 널바이트 등 의심스러운 문자 제거/검사
        if (baseName.indexOf('\0') >= 0) return "";

        // 3) 끝에 붙은 점(.) 여러개 제거 -> "file.jsp." / "file.jsp.." 등 처리
        while (baseName.endsWith(".")) {
            baseName = baseName.substring(0, baseName.length() - 1);
            if (baseName.isEmpty()) return "";
        }

        // 4) 마지막 '.' 이후 부분을 확장자로 취득
        int dot = baseName.lastIndexOf('.');
        if (dot == -1 || dot == baseName.length() - 1) return ""; // 확장자 없음

        String ext = baseName.substring(dot + 1).toLowerCase(Locale.ROOT);

        // 5) 확장자 형식 검증: 영숫자만 허용(원하면 '-' '_' 도 허용)
        Pattern extPattern = Pattern.compile("^[a-z0-9]+$");
        if (!extPattern.matcher(ext).matches()) {
            return ""; // 비정상 확장자(예: "jsp;.png" 등)로 간주
        }

        return ext;
    }


    // 확장자 검사 (MultipartFile)
    public static boolean isAllowedExtension(MultipartFile file) {
        if(file == null || file.getOriginalFilename() == null) return false;

        String extension = getFileExtension(file.getOriginalFilename())
                .toLowerCase()
                .trim();

        // 거부 확장자 차단 (블랙리스트 방식)
        return !REJECT_EXTENSIONS.contains(extension);
    }

    // 저장 파일명 생성
    public static String getSaveFileName(String fileName) {
        return generateRandomFileName() + "." + getFileExtension(fileName);
    }

    // 파일 경로 생성
    public static void mkdirs(String filePath) {
        File uploadDir = new File(filePath);
        if (!uploadDir.exists()) {
            boolean created = uploadDir.mkdirs();
            if (!created && !uploadDir.exists()) {
                log.error("디렉터리 생성 실패: path={}", uploadDir.getAbsolutePath());
            } else {
                log.debug("디렉터리 생성 완료: path={}", uploadDir.getAbsolutePath());
            }
        }
    }

    // 파일 기본 경로 설정
    public static String normalizeUploadPath(String uploadPath) {
        if (uploadPath == null || uploadPath.isEmpty()) {
            return "/common/";
        } else {

            //heum
            boolean isWin = System.getProperty("os.name").toLowerCase().startsWith("windows");
            if (!isWin) {
                // 앞뒤 공백 제거 후 앞뒤에 '/' 추가
                uploadPath = "/" + uploadPath.strip();
                while (uploadPath.contains("//")) {
                    uploadPath = uploadPath.replace("//", "/");
                }
            }
            return uploadPath;
        }
    }

    // 파일 전송
    public static File moveFile(File uploadFile, String targetFilePath) throws IOException {
        // null 체크 로직 추가
        if (uploadFile == null) {
            throw new IllegalArgumentException("uploadFile은 null일 수 없습니다.");
        }

        if (targetFilePath == null || targetFilePath.trim().isEmpty()) {
            throw new IllegalArgumentException("targetFilePath은 null이거나 빈 문자열일 수 없습니다.");
        }

        File destFile = new File(targetFilePath);

        // 대상 디렉토리가 존재하지 않으면 생성 (대상 파일 존재 여부와 무관하게 항상 보장)
        File parentDir = destFile.getParentFile();
        if (parentDir != null && !parentDir.exists()) {
            boolean created = parentDir.mkdirs();
            if (!created && !parentDir.exists()) {
                log.error("대상 디렉터리 생성 실패: path={}", parentDir.getAbsolutePath());
                throw new IOException("대상 디렉터리 생성 실패: " + parentDir.getAbsolutePath());
            }
            log.info("대상 디렉터리 생성: path={}", parentDir.getAbsolutePath());
        }

        // 대상 파일이 존재하면 삭제
        if (destFile.exists()) {
            try {
                Files.delete(destFile.toPath());
            } catch (IOException e) {
                log.error("기존 대상 파일 삭제 실패: path={}, error={}",
                        destFile.getAbsolutePath(), e.getMessage(), e);
                throw e;
            }
        }

        // 파일 이동
        try {
            FileUtils.moveFile(uploadFile, destFile);
        } catch (IOException e) {
            log.error("파일 이동 실패: source={}, target={}, sourceExists={}, parentExists={}, error={}",
                    uploadFile.getAbsolutePath(),
                    destFile.getAbsolutePath(),
                    uploadFile.exists(),
                    parentDir != null && parentDir.exists(),
                    e.getMessage(),
                    e);
            throw e;
        }

        return destFile;
    }

    // 파일 삭제 (void 버전)
    public static void deleteFile(File file) {
        if (file == null) {
            return;
        }

        synchronized (FileUtil.class) {
            String absolutePath = file.getAbsolutePath();
            try {
                if (!file.exists()) {
                    log.warn("파일 삭제 대상이 존재하지 않습니다: path={}", absolutePath);
                    return;
                }
                if (!file.delete()) {
                    File parent = file.getParentFile();
                    log.error("파일 삭제 실패: path={}, isFile={}, canWrite={}, parentExists={}, parentCanWrite={}",
                            absolutePath,
                            file.isFile(),
                            file.canWrite(),
                            parent != null && parent.exists(),
                            parent != null && parent.canWrite());
                } else {
                    log.debug("파일 삭제 완료: path={}", absolutePath);
                }
            } catch (SecurityException e) {
                log.error("파일 삭제 실패 - 보안 오류: path={}, error={}", absolutePath, e.getMessage(), e);
            }
        }
    }

    // 파일 삭제 (boolean 리턴 버전)
    public static boolean deleteFileReturn(File file) {
        if (file == null) {
            return false;
        }

        synchronized (FileUtil.class) {
            String absolutePath = file.getAbsolutePath();
            try {
                if (!file.exists()) {
                    log.warn("파일 삭제 대상이 존재하지 않습니다: path={}", absolutePath);
                    return false;
                }
                boolean result = file.delete();
                if (!result) {
                    File parent = file.getParentFile();
                    log.error("파일 삭제 실패: path={}, isFile={}, canWrite={}, parentExists={}, parentCanWrite={}",
                            absolutePath,
                            file.isFile(),
                            file.canWrite(),
                            parent != null && parent.exists(),
                            parent != null && parent.canWrite());
                }
                return result;
            } catch (SecurityException e) {
                log.error("파일 삭제 실패 - 보안 오류: path={}, error={}", absolutePath, e.getMessage(), e);
                return false;
            }
        }
    }

    public static String getHmacSHA256Checksum(String filename, String keySaltMain) throws Exception {
        if (keySaltMain == null) {
            throw new IllegalStateException("CHECKSUM_KEY is not set");
        }
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(keySaltMain.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));

        try (InputStream is = new BufferedInputStream(Files.newInputStream(Path.of(filename)), 256 * 1024)) {
            byte[] buffer = new byte[256 * 1024]; // 256KB
            int n;
            while ((n = is.read(buffer)) != -1) {
                mac.update(buffer, 0, n);
            }
        } catch (NoSuchFileException e) {
            log.error("파일이 존재하지 않습니다: {}", filename, e);
            throw e;
        } catch (AccessDeniedException e) {
            log.error("파일 접근 권한이 없습니다: {}", filename, e);
            throw e;
        } catch (IOException e) {
            log.error("파일 읽기 중 IO 오류 발생: {}", filename, e);
            throw e;
        }

        byte[] h = mac.doFinal();
        return String.format("%064x", new BigInteger(1, h));
    }

    static public String getRemoteIP(HttpServletRequest request) {
        String ip = request.getHeader("x-forwarded-for");

        if(ip == null || ip.length() == 0 || ip.toLowerCase().equals("unknown"))
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");

        if(ip == null || ip.length() == 0 || ip.toLowerCase().equals("unknown"))
            ip = request.getHeader("REMOTE_ADDR");

        if(ip == null || ip.length() == 0 || ip.toLowerCase().equals("unknown"))
            ip = request.getRemoteAddr();

        return ip;
    }
}
