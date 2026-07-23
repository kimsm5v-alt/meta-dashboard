> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 853a3eed

## 코드 복잡도 분석

**분석된 파일**: 7개 / 변경된 파일: 8개


### 정상 범위 (NONE)


**`filemapper.xml`** (other)

- 평균 복잡도: **0.243**

- 최대 복잡도: 0.474

- 청크 수: 2개

- 평균 사용처: 7.0곳


**권장사항:**

- 복잡도 정상 범위


**`piopdfvo.java`** (other)

- 평균 복잡도: **0.229**

- 최대 복잡도: 0.474

- 청크 수: 91개

- 평균 사용처: 20.7곳


**권장사항:**

- 파일 크기가 큼 (91개 청크) - 파일 분리 검토


**`dgnsscontroller.java`** (other)

- 평균 복잡도: **0.227**

- 최대 복잡도: 0.470

- 청크 수: 23개

- 평균 사용처: 28.1곳


**권장사항:**

- 파일 크기가 큼 (23개 청크) - 파일 분리 검토


**`filemapper.java`** (other)

- 평균 복잡도: **0.223**

- 최대 복잡도: 0.465

- 청크 수: 25개

- 평균 사용처: 19.2곳


**권장사항:**

- 파일 크기가 큼 (25개 청크) - 파일 분리 검토


**`pdfservice.java`** (other)

- 평균 복잡도: **0.214**

- 최대 복잡도: 0.468

- 청크 수: 11개

- 평균 사용처: 33.8곳


**권장사항:**

- 복잡도 정상 범위


**`dgnssservice.java`** (other)

- 평균 복잡도: **0.129**

- 최대 복잡도: 0.473

- 청크 수: 59개

- 평균 사용처: 14.9곳


**권장사항:**

- 파일 크기가 큼 (59개 청크) - 파일 분리 검토


**`fileservice.java`** (other)

- 평균 복잡도: **0.113**

- 최대 복잡도: 0.468

- 청크 수: 17개

- 평균 사용처: 20.6곳


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 학습심리정서검사(DGNSS) 일괄 다운로드 API를 기존의 메모리 내 zip 생성 후 스트리밍 방식에서 **2단계 다운로드 방식**으로 전면 개편한 것입니다. 기존 방식은 zip 전체를 `ByteArrayOutputStream`에 적재한 후 `StreamingResponseBody`로 스트리밍했기 때문에, 학생 수가 많을 경우 **OOM(Java heap space)** 위험과 zip 생성 중 연결 끊김 시 **Broken pipe / AsyncRequestNotUsableException** 문제가 있었습니다. 이를 해결하기 위해 zip을 NAS에 임시 파일로 저장하고, `/pfile-download`를 통해 Range/이어받기를 지원하는 방식으로 변경되었습니다.

- **목적**: OOM 방지, 대용량 파일 다운로드 안정성 확보, HTTP Range 기반 이어받기 지원
- **도메인**: API / 비즈니스 로직 (파일 다운로드)
- **변경 방향**: 메모리 집약적 스트리밍 -> 파일 기반 2단계 다운로드 (생성 + 서빙 분리)

## [GOOD] 잘된 점

1. **OOM 문제의 근본적 해결**: `ByteArrayOutputStream`에 전체 zip을 적재하던 방식을 임시 파일 스트리밍으로 변경하여, 힙 메모리 사용량이 zip 크기와 무관해졌습니다. 이는 대규모 학급/학교 단위 다운로드에서 실질적인 안정성 개선입니다. `FileService.java`의 `createDgnssDownloadAllZip` 메서드에서 `File.createTempFile`을 사용하고 `ZipOutputStream`을 `FileOutputStream`으로 감싸 파일에 직접 쓰도록 변경된 점이 핵심입니다.

2. **리소스 누수 방지 (PioPdfVO.closeQuietly)**: PDFBox의 `PDDocument`가 예외 경로에서 닫히지 않아 발생하던 리소스 누수를 `try-finally` + `closeQuietly()` 패턴으로 해결했습니다. `PioPdfVO.java`의 `closeQuietly()` 메서드는 `pdDoc.close()`가 멱등(idempotent)함을 Javadoc에 명시하여 중복 호출에도 안전함을 보장합니다. `PdfService.java`의 3개 메서드(`createDgnssAnalysisByTemplate`, `createDgnssReportCoch`, 세 번째 메서드)에 일관되게 적용되었습니다.

3. **캐싱 전략 도입**: 동일한 `dgnssId` + `type` 조합에 대해 이미 생성된 zip이 있으면 DB에서 URL을 조회해 즉시 반환함으로써, 불필요한 재생성을 방지합니다. `FileMapper.xml`의 `selectDgnssZipFileUrl` 쿼리가 `type`에 따라 `detail_zip_file_url` / `summary_zip_file_url` / `full_zip_file_url` 컬럼을 동적으로 선택하는 `dgnssZipColumn` SQL 조각을 사용한 점이 인상적입니다.

4. **임시 파일 정리 보장**: `finally` 블록에서 `tempZip.exists()` 체크 후 `FileUtil.deleteFile()`을 호출하여, 예외 발생 시에도 임시 파일이 남지 않도록 처리했습니다.

## 변경사항 요약

- `DgnssController.dgnssDownloadAll()`: 응답 형식을 `StreamingResponseBody`(octet-stream)에서 `ResponseDTO<CustomBody>`(JSON)로 변경
- `FileService.createDgnssDownloadAllZip()`: zip 생성을 메모리(ByteArrayOutputStream) 대신 임시 파일에 스트리밍, 생성된 zip을 업로드 파일로 등록하고 URL을 DB에 저장
- `FileService.registerLocalFileAsUpload()`, `setFileVOFromFile()`: MultipartFile 없이 로컬 파일을 업로드 등록하는 신규 메서드
- `PioPdfVO.closeQuietly()`: PDDocument 리소스 누수 방지를 위한 안전망 메서드 추가
- `PdfService`: 3개 메서드에 `try-finally` + `closeQuietly()` 적용
- `FileMapper.xml`: type별 zip URL 컬럼 조회/등록 SQL 추가 (`dgnssZipColumn` SQL 조각 활용)

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `createDgnssDownloadAllZip`에서 `@Transactional` 롤백 시 zip 파일 등록이 취소되지 않음**

- **파일**: `backend/src/main/java/com/vs/meta/common/service/FileService.java`
- **위치**: `createDgnssDownloadAllZip` 메서드 (라인 662~761)
- **문제 분석**: `registerLocalFileAsUpload()` 내부의 실행 순서는 다음과 같습니다:
  1. `FileUtil.moveFile(srcFile, copyFile)` -- 임시 파일을 NAS 업로드 경로로 이동 (파일 시스템 I/O)
  2. `fileMapper.insertUploadFile(fileVO)` -- DB에 파일 레코드 INSERT
  3. `fileMapper.updateDgnssZipFileUrl(updateParam)` -- `tb_dgnss_info`의 zip URL 컬럼 UPDATE

  `@Transactional(rollbackFor = Exception.class)`이 메서드 레벨에 선언되어 있으므로, 2번 또는 3번에서 예외가 발생하면 DB 작업은 롤백됩니다. 하지만 **1번에서 이미 이동된 파일은 롤백되지 않습니다**. 즉, DB에는 zip URL이 등록되지 않았지만 NAS에는 파일이 존재하는 **고아 파일(orphan file)** 상태가 됩니다. 이 파일은 더 이상 참조되지 않으므로 디스크 공간을 낭비하게 됩니다.

- **해결 방안**: `registerLocalFileAsUpload` 내에서 `moveFile` 이후의 DB 작업이 실패할 경우, 이동된 파일을 삭제하는 보상 로직을 추가하세요.

  **수정 코드** (`registerLocalFileAsUpload` 메서드, 라인 548~562):
  ```java
  private String registerLocalFileAsUpload(File srcFile, String originalFileName, String uploadPath,
                                           String regId, String requestSource, String prsInfoYn) throws Exception {
      uploadPath = FileUtil.normalizeUploadPath(uploadPath);
      FileUtil.mkdirs(uploadPath);

      long fileSize = srcFile.length();
      String saveFileName = FileUtil.getSaveFileName(originalFileName);
      String copyFile = uploadPath + "/" + saveFileName;
      FileUtil.moveFile(srcFile, copyFile);

      try {
          FileVO fileVO = setFileVOFromFile(originalFileName, fileSize, saveFileName, uploadPath + "/", regId, requestSource, prsInfoYn);
          fileMapper.insertUploadFile(fileVO);
          return fileVO.getFilePath() + fileVO.getFileName();
      } catch (Exception e) {
          // DB 등록 실패 시 이동된 파일 정리 (고아 파일 방지)
          FileUtil.deleteFile(new File(copyFile));
          throw e;
      }
  }
  ```

  이렇게 하면 `insertUploadFile` 실패 시 `moveFile`로 이동된 파일이 정리되어 고아 파일이 남지 않습니다.

**2. `setFileVOFromFile`에서 `filePath` 조작 로직의 중복 가능성**

- **파일**: `backend/src/main/java/com/vs/meta/common/service/FileService.java`
- **위치**: `setFileVOFromFile` 메서드 (라인 576~607)
- **문제 분석**: `setFileVOFromFile`은 `filePath` 파라미터를 받아 `nasPath`와의 선행 슬래시 불일치를 보정합니다:
  ```java
  if (StringUtils.startsWith(nasPath, "/") == false && StringUtils.startsWith(filePath, "/")) {
      filePath = StringUtils.removeStart(filePath, "/");
  }
  ```
  그런데 이 메서드를 호출하는 `registerLocalFileAsUpload`는 이미 `FileUtil.normalizeUploadPath(uploadPath)`를 통해 `uploadPath`를 정규화한 상태입니다. `normalizeUploadPath`는 Linux 환경에서 앞뒤에 `/`를 붙이고 중복 `/`를 제거합니다. 따라서 `setFileVOFromFile`에 전달되는 `filePath`는 이미 정규화된 상태이며, `nasPath`와의 비교 로직이 실제로 필요한지 검토가 필요합니다. `setFileVO`와의 일관성을 유지하기 위해 남겨둔 것으로 보이지만, 중복 정규화로 인해 예상치 못한 경로 조작이 발생할 가능성이 있습니다.

- **해결 방안**: `registerLocalFileAsUpload`에서 `setFileVOFromFile` 호출 시 전달하는 `filePath`가 이미 정규화된 상태임을 고려하여, `setFileVOFromFile` 내부의 `nasPath` 비교 로직이 불필요하다면 제거하거나, `normalized` 플래그를 추가하여 중복 정규화를 방지하세요.

### Medium (개선 권장)

**1. `closeQuietly()`의 예외 로깅 수준**

- **파일**: `backend/src/main/java/com/vs/meta/api/dgnss/vo/PioPdfVO.java`
- **위치**: `closeQuietly()` 메서드 (라인 300~307)
- **문제**: `closeQuietly()`에서 `IOException` 발생 시 `log.error("IO error : {}", e.getMessage())`로 로깅하는데, `e.getMessage()`만 출력하면 스택 트레이스가 누락되어 실제 문제 원인 파악이 어렵습니다. `closeQuietly()`는 finally 블록에서 호출되는 안전망 메서드이므로, 여기서 발생한 예외가 정상 경로의 예외를 가릴 가능성은 낮지만, 디버깅을 위해 스택 트레이스까지 기록하는 것이 좋습니다.
- **해결 방안**: `log.error("IO error : {}", e.getMessage(), e)`로 변경하여 스택 트레이스까지 함께 기록하세요.

**2. `tempDir` 경로가 `nasRoot()` 아래에 생성되는 점**

- **파일**: `backend/src/main/java/com/vs/meta/common/service/FileService.java`
- **위치**: `createDgnssDownloadAllZip` 메서드 (라인 704~705)
- **문제**: 임시 zip 파일이 `nasRoot() + "/temp/"` 디렉토리에 생성됩니다. `File.createTempFile`은 JVM 종료 시 자동 삭제를 보장하지 않으며, `finally` 블록에서 `tempZip.exists()` 체크 후 삭제하지만, JVM이 비정상 종료되면 `temp/` 디렉토리에 고아 파일이 누적될 수 있습니다. NAS는 일반적으로 정리 정책(TTL)이 적용되는 스토리지이므로 큰 문제는 아니지만, `temp/` 디렉토리 자체에 대한 주기적 정리 정책이 있는지 확인이 필요합니다.
- **해결 방안**: (선택) `File.createTempFile`의 기본 임시 디렉토리(`java.io.tmpdir`)를 사용하거나, `temp/` 디렉토리에 대한 TTL 정리 정책을 문서화하세요.

---

## 주요 파일 분석

### FileService.java
**변경 내용:**
zip 생성을 메모리(ByteArrayOutputStream)에서 임시 파일 스트리밍으로 변경하고, 생성된 zip을 업로드 파일로 등록하는 `registerLocalFileAsUpload`, `setFileVOFromFile` 메서드 추가

**핵심 로직 흐름:**
1. `createDgnssDownloadAllZip` 호출
2. `fileMapper.selectDgnssZipFileUrl(param)`로 기존 zip URL 조회 (캐싱)
3. 없으면 `File.createTempFile`로 임시 파일 생성
4. `ZipOutputStream` + `FileOutputStream`으로 zip을 임시 파일에 직접 스트리밍
5. `registerLocalFileAsUpload`로 임시 파일을 NAS 업로드 경로로 이동 + DB 등록
6. `fileMapper.updateDgnssZipFileUrl`로 `tb_dgnss_info`에 URL 저장
7. `finally`에서 임시 파일 정리

**개선 제안:**
1. `registerLocalFileAsUpload`에서 `moveFile` 이후 DB 작업 실패 시 고아 파일 발생 가능 (High 이슈)
   - **위치 (라인 번호)**: 548~562
   - **해결 방안**: 위 High 이슈 1번에서 제시한 보상 로직 추가

### PioPdfVO.java
**변경 내용:**
`closeQuietly()` 메서드 추가 - PDDocument 리소스 누수 방지를 위한 안전망

**개선 제안:**
1. 예외 로깅에 스택 트레이스 누락 (Medium)
   - **위치 (라인 번호)**: 305
   - **기존 코드**: `log.error("IO error : {}", e.getMessage());`
   - **해결 방안**: `log.error("IO error : {}", e.getMessage(), e);`

### PdfService.java
**변경 내용:**
3개 메서드(`createDgnssAnalysisByTemplate`, `createDgnssReportCoch`, 세 번째 메서드)에 `try-finally` + `closeQuietly()` 적용

**개선 제안:**
없음. 리소스 누수 방지 패턴이 명확하고 일관성 있게 적용되었습니다. 각 메서드의 `PioPdfVO` 객체 생성 직후 `try` 블록을 열고, 메서드 끝에서 `finally`로 `closeQuietly()`를 호출하는 구조가 깔끔합니다.

### FileMapper.xml
**변경 내용:**
`dgnssZipColumn` SQL 조각과 `selectDgnssZipFileUrl`, `updateDgnssZipFileUrl` 쿼리 추가

**개선 제안:**
없음. `dgnssZipColumn` SQL 조각을 `<choose>`로 구현하여 type에 따라 컬럼을 동적으로 선택하는 방식이 깔끔하고 확장성이 좋습니다. `type == "2"` -> `summary_zip_file_url`, `type == "3"` -> `full_zip_file_url`, 기본 -> `detail_zip_file_url`로 매핑된 점이 명확합니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전체적으로 아키텍처 개선 방향이 명확하고, OOM 문제 해결을 위한 접근 방식이 적절합니다. 특히 `ByteArrayOutputStream`에서 임시 파일 스트리밍으로의 전환은 대용량 파일 처리에서 실질적인 안정성 개선입니다. `closeQuietly()` 도입과 캐싱 전략도 매우 긍정적이며, FE 연동 가이드 문서가 충실히 작성되어 있어 전반적인 코드 품질은 양호합니다.

다만 `@Transactional` 롤백 시 NAS에 고아 파일이 남을 수 있는 점(High 이슈)은 실제 운영 환경에서 디스크 사용량 증가로 이어질 수 있으므로, `registerLocalFileAsUpload`에 보상 로직(compensating action)을 추가하는 것을 권장합니다. 이는 단순히 `try-catch`로 `moveFile`된 파일을 삭제하는 3~4줄의 코드만 추가하면 해결되는 문제이므로, 수정 부담이 매우 적습니다.

위 High 이슈 2건(고아 파일 문제, 경로 정규화 중복)만 수정되면 승인할 수 있는 수준의 커밋입니다.