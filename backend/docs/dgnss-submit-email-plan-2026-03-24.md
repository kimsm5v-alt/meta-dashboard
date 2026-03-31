# DGNSS 제출 완료 이메일 발송 계획

**작성일:** 2026-03-24  
**목적:** 학생이 심리검사 제출을 완료했을 때 PDF 결과물을 이메일로 발송하기 위한 백엔드 설계 방향 정리

---

## 1. 요구사항 정리

- 학생이 심리검사를 제출 완료하면 이메일을 발송한다.
- 이메일 수신 주소는 `group_member.email` 컬럼을 사용한다.
- 제출 시점에는 PDF가 자동으로 생성되어야 한다.
- 메일 링크를 보내는 것이 아니라, PDF 파일 자체를 이메일 첨부로 발송한다.
- NAS에 저장된 파일은 현재 `/files/pfile-download` 경로로 다운로드 가능하다.

---

## 2. 현재 확인된 관련 코드

### 2.1 제출 완료 시점

- `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssService.java`
- `stSubmit(int dgnssResultId, String paperType, boolean sameAnswerCheck)`

현재 `stSubmit`에서는 아래 순서로 처리된다.

1. `tb_dgnss_result_info.subm_at = Y`
2. 답안 JSON 저장
3. `answerIdx` 조회
4. `dgnssMapper.callProcMark(answerIdx)`
5. LPA 후처리 저장

즉, 이메일 발송 트리거는 이 메서드의 마지막 구간이 가장 자연스럽다.

### 2.2 메일 발송 유틸

- `backend/src/main/java/com/vs/meta/common/utils/NcpMailSender.java`

현재 아래 기능이 이미 있다.

- 일반 메일 발송
- 첨부용 파일 업로드
- 첨부 메일 발송
- PDF 바이트 배열을 첨부 메일로 보내는 `sendExamResultPdf(...)`

즉, 메일 유틸은 이미 충분하며, 핵심은 "NAS 파일을 메모리로 읽어 PDF 바이트 배열로 넘기는 방법"이다.

### 2.3 파일 다운로드 로직

- `backend/src/main/java/com/vs/meta/common/controller/FileController.java`
- `backend/src/main/java/com/vs/meta/common/service/FileService.java`

현재 `/files/pfile-download`는 `FileService.downloadFile(...)`를 호출한다.

이 메서드는 다음 역할을 가진다.

- JWT 기반 사용자 식별
- 파일 접근 권한 검증
- 다운로드 로그 적재
- NAS 파일 경로 해석
- 체크섬 검증
- `ResponseEntity<Resource>` 반환

---

## 3. 핵심 판단

### 3.1 `/pfile-download` API를 메일 발송에 직접 재사용하지 않는다

이유:

- 같은 애플리케이션 내부에서 HTTP로 자기 자신 API를 다시 호출할 필요가 없다.
- 현재 API는 `jwtToken`, `HttpServletRequest`, `ResponseEntity<Resource>` 중심으로 설계돼 있다.
- 메일 발송에는 최종적으로 `byte[] pdfData`가 필요하다.
- 다운로드 API용 로직과 메일 첨부용 로직은 목적이 다르다.

따라서 메일 발송용으로는 `FileService` 내부 로직을 분리하는 방식이 적절하다.

### 3.2 `FileService`에서 공통 파일 로딩 로직을 분리한다

권장 방향:

- 현재 `downloadFile(...)` 안의 파일 조회/검증/경로 해석/체크섬 검증 로직을 공통 private 메서드로 추출
- 그 공통 로직을 이용해 아래 2개 흐름으로 분리

1. 다운로드 API용
   - 최종 반환: `ResponseEntity<Resource>`
2. 이메일 첨부용
   - 최종 반환: `byte[]`

---

## 4. 권장 구조

### 4.1 FileService 분리안

예시 메서드 구조:

```java
public ResponseEntity<Object> downloadFile(...)
```

기존 다운로드 API 유지

```java
public byte[] loadFileBytesForEmail(String url, String userId)
```

메일 첨부용 파일 바이트 로딩

```java
private FileVO resolveAuthorizedFile(String url, String userId, boolean isAuth, String pionadaYn, String partnerActivityYn)
```

파일 메타 조회 + 권한 검증

```java
private Path resolveVerifiedFilePath(FileVO fileVO)
```

NAS 경로 해석 + 체크섬 검증

### 4.2 DgnssService 처리 흐름

권장 흐름:

1. 학생 제출 완료
2. `callProcMark(answerIdx)` 완료
3. LPA 저장 완료
4. 학생용 PDF 생성
5. 생성된 파일 URL 확보
6. `FileService.loadFileBytesForEmail(...)` 호출
7. `NcpMailSender.sendExamResultPdf(...)` 호출

---

## 5. PDF 생성 관련 계획

현재 요구사항상 학생이 제출할 경우 `pdfDownload` 메서드를 호출해 PDF를 생성해야 한다.

다만 그대로 컨트롤러 응답용 메서드를 재사용하기보다, 아래 방식이 더 적절하다.

### 권장안

- 학생 PDF 생성 핵심 로직을 서비스 내부 메서드로 분리
- 다운로드 응답용 메서드와 메일 첨부용 호출부가 같은 생성 메서드를 재사용

예시:

```java
private String generateStudentPdfAndReturnUrl(...)
```

이 메서드는

- PDF를 생성하고
- NAS 저장 후
- 최종 파일 URL을 반환

이렇게 하면 메일 발송과 다운로드가 같은 생성 로직을 공유할 수 있다.

---

## 6. 이메일 발송 시 필요한 데이터

최소 필요 데이터:

- `dgnssResultId`
- `answerIdx`
- 학생 `MEM_ID`
- 학생 이름
- 학생 이메일 (`group_member.email`)
- 생성된 PDF 파일 URL

추가로 있으면 좋은 데이터:

- 검사명
- 제출일시
- 학급명

---

## 7. 실패 처리 정책

권장 정책:

- 심리검사 제출 자체는 성공 처리
- PDF 생성 또는 메일 발송 실패는 별도 로그로 남김
- 메일 실패 때문에 제출 트랜잭션 전체를 롤백하지 않음

이유:

- 제출 성공과 메일 발송 성공은 성격이 다르다.
- 외부 메일 API 실패가 핵심 비즈니스 처리까지 깨뜨리면 운영 리스크가 커진다.

---

## 8. 동기/비동기 처리 판단

### 8.1 1차 구현 권장안

- 우선 동기 처리로 붙일 수는 있다.

순서:

1. 제출 완료
2. 채점
3. LPA 저장
4. PDF 생성
5. 메일 발송

### 8.2 향후 개선 권장안

- 장기적으로는 비동기 처리 권장

이유:

- PDF 생성과 메일 발송은 느릴 수 있다.
- 제출 API 응답 시간이 길어질 수 있다.

향후 방향:

- 제출 성공 후 이벤트/큐/비동기 메서드로 후속 처리

---

## 9. 중복 발송 정책

사전에 확정이 필요한 항목:

- 같은 제출 건에 대해 메일을 1회만 보낼지
- 재채점/재생성 시 재발송 허용 여부

권장안:

- 기본은 `dgnss_result_id` 또는 `answer_idx` 기준 1회 발송
- 재발송은 별도 관리자 기능 또는 수동 트리거로 분리

가능하면 발송 이력 저장 테이블 또는 컬럼을 두는 것이 좋다.

예시 필드:

- `answer_idx`
- `mail_type`
- `sent_at`
- `status`
- `error_message`

---

## 10. 최종 권장 구현 방향

1. `stSubmit(...)` 마지막에서 후처리 시작
2. 학생 PDF 생성 로직을 서비스 메서드로 분리
3. `FileService`에서 다운로드용/메일용 파일 읽기 로직 분리
4. `group_member.email` 조회 쿼리 추가
5. NAS 파일을 `byte[]`로 읽어 `NcpMailSender.sendExamResultPdf(...)` 호출
6. 메일 실패는 제출 실패로 롤백하지 않음
7. 추후 중복 발송 방지를 위한 발송 이력 관리 추가 검토

---

## 11. 다음 구현 전에 확정할 사항

- 제출 직후 발송할 PDF 종류
  - 학생 결과 PDF
  - 요약 PDF
  - 둘 중 하나
- 동기 발송 여부
- 중복 발송 허용 여부
- 메일 제목/본문 문구 확정
- 발송 이력 저장 여부

---
