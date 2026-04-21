ㅕㄴ되냐# DGNSS 마이그레이션 진행 메모

> 작성일: 2026-03-19
> 대상 프로젝트: `meta-dashboard/backend`
> 관련 모듈: `api/dgnss`

---

## 1. 현재 상황

DGNSS 모듈은 백엔드 프로젝트로 이관되어 아래 경로에 존재한다.

- 컨트롤러:
  - `src/main/java/com/vs/meta/api/dgnss/controller/DgnssController.java`
- 서비스:
  - `src/main/java/com/vs/meta/api/dgnss/service/DgnssService.java`
- 매퍼 인터페이스:
  - `src/main/java/com/vs/meta/api/dgnss/mapper/DgnssMapper.java`
- 매퍼 XML:
  - `src/main/resources/mapper/dgnss/DgnssMapper.xml`

애플리케이션의 기본 DB 연결은 `viva_meta` 기준이지만,
DGNSS SQL은 아직 `aidt_lms` 레거시 회원/학급 테이블을 광범위하게 참조하고 있다.

즉:

- 모듈 이관은 되어 있음
- 회원/학급 스키마 마이그레이션은 아직 미완료

---

## 2. 참고 문서

### 기존 문서

- `docs/legacy-table-migration.md`
- `docs/member_db_design.md`
- `docs/meta_api_ddl_v3.sql`

### 이번 작업으로 추가한 문서

- `docs/dgnss-student-analysis-response-unification.md`

---

## 3. 이번에 확정된 사항

### 3.1 성별 저장 위치

성별 값은 `viva_meta.group_member.gender` 컬럼으로 이관하기로 결정했다.

### 3.2 성별 코드 체계

- 남자: `M`
- 여자: `F`

### 3.3 DGNSS 쪽 해석 기준

현재 심리검사 SQL은 대부분 아래 형태를 사용한다.

```sql
CASE WHEN sex = 'M' THEN '남자' ELSE '여자' END
```

즉 현재 로직은:

- `M`이면 남성
- 그 외 값은 모두 여성

구조다.

따라서 기존에 `W`를 쓰고 있었다고 하더라도,
앞으로 `F`를 사용해도 현재 분기 기준에서는 동작상 문제는 없다.

다만 이관 시에는 아래처럼 명시 비교로 바꾸는 것이 안전하다.

```sql
CASE
  WHEN gender = 'M' THEN '남자'
  WHEN gender = 'F' THEN '여자'
  ELSE ''
END
```

이유:

- `ELSE '여자'` 패턴은 `NULL`, 공백, 잘못된 코드도 전부 여성으로 처리한다.

---

## 4. 성별 영향도 조사 결과

현재 DGNSS에서 성별 관련 직접 참조는 대부분 `DgnssMapper.xml` 안에 있다.

대표 위치:

- `getDgnssReportLS`
  - `u.sex AS MEM_GENDER`
  - `CASE WHEN u.sex = 'M' THEN '남' ELSE '여' END`
- `getDgnssReportValidity`
  - `u.sex AS MEM_GENDER`
- 학생 결과/분석 조회 다수
  - `CASE WHEN d1.sex = 'M' THEN '남자' ELSE '여자' END AS gender`
- `selectStInfo`
  - `CASE WHEN c1.sex = 'M' THEN '남자' ELSE '여자' END gender`

정리하면:

- 원시 성별 코드 참조
  - `MEM_GENDER`
- 화면/응답 표시용 문자열 생성
  - `남`, `여`
  - `남자`, `여자`

둘 다 존재한다.

### 영향 범위

- 학생 개인 결과 조회
- 학생 종합 결과 조회
- 학생 목록/분석표
- PDF 생성 데이터
- 일부 교사 분석/리포트

---

## 5. 학생 결과 API 응답 형식 통일 작업

이번에 학생 결과 API 2개에 대해 `paperIdx=2` 응답도
`paperIdx=1`과 동일하게 `SECTION_ID`, `SECTION_NM`, `tScore` 중심 리스트 형식으로 통일했다.

대상 API:

- `GET /api/dgnss/st/analysis`
- `GET /api/dgnss/st/total/analysis`

수정 파일:

- `src/main/java/com/vs/meta/api/dgnss/service/DgnssService.java`

검증:

- `..\gradlew.bat :backend:compileJava`
- 컴파일 성공

상세 내용은 아래 문서 참고:

- `docs/dgnss-student-analysis-response-unification.md`

---

## 6. 아직 남아 있는 마이그레이션 포인트

### 6.1 회원/학급 조인 전환

아래 레거시 조인을 신규 구조로 바꿔야 한다.

- `aidt_lms.tc_cla_mb_info`
- `aidt_lms.stdt_reg_info`
- `aidt_lms.tc_cla_info`
- `aidt_lms.tc_reg_info`
- `aidt_lms.user`

기본 대응 방향:

- 학급 연결:
  - `tc_cla_mb_info` -> `group_info + group_member`
- 학생 식별:
  - `stdt_id` 유지
- 학생 이름:
  - `group_member.nickname` 또는 정책 확정 후 별도 컬럼
- 학생 번호:
  - `group_member.member_no`
- 성별:
  - `group_member.gender`

### 6.2 학생 이름 정책

아직 결정이 필요한 부분:

- 레거시 `flnm`을 `nickname`으로 대체 가능한지
- PDF/리포트에 실명이 필요한지

### 6.3 DDL 반영

현재 문서 기준 `group_member`에는 `gender` 컬럼이 아직 명시되어 있지 않다.

즉 아래 문서/DDL도 추후 같이 수정 필요:

- `docs/meta_api_ddl_v3.sql`
- `docs/member_db_design.md`

---

## 7. 다음 작업 제안

### 우선순위 1

`DgnssMapper.xml`에서 성별 참조를 전부 `group_member.gender` 기준으로 치환 대상 목록화

### 우선순위 2

아래 초기 핵심 쿼리부터 레거시 회원/학급 조인을 신규 구조로 변환

- `selectAllStdtList`
- `selectTcDgnssInfo`
- `selectActvStdtCnt`
- `selectTargetStList`
- `selectSubmitStList`

### 우선순위 3

PDF/상세조회 쿼리의 이름/성별/번호 매핑 정리

대표 대상:

- `selectTcUserInfo`
- `selectStUserInfo`
- `selectStInfo`
- `getDgnssReportLS`
- `getDgnssReportValidity`

### 우선순위 4

문서와 DDL 반영

- `group_member.gender` 컬럼 추가
- 성별 코드 정책 `M/F` 명시

---

## 8. 재시작 후 이어서 보기 좋은 파일

터미널 세션이 끊긴 후 다시 작업할 때 먼저 보면 되는 파일:

- `docs/dgnss-migration-progress-note-2026-03-19.md`
- `docs/dgnss-student-analysis-response-unification.md`
- `docs/legacy-table-migration.md`


---

## 9. 2026-03-19 �߰� ���� ��Ȳ

�̹� �۾����� DgnssMapper.xml ���� ���Ž� DB ���� ���� ���Ÿ� �Ϸ��ߴ�.

### 9.1 �Ϸ�� �۾�

- DgnssMapper.xml �� idt_lms, idt_diagnosis, iva_meta ��Ű�� prefix ����
- �л�/����/�б� ��ȸ�� ���� ���� �������� ��ȯ
- �л� �̸�: group_member.nickname
- �л� ��ȣ: group_member.member_no
- �л� ����: group_member.gender
- ���� �̸�: group_info.host_user_no -> user.user_no -> user.nickname
- �б޸� ǥ�ð�: group_info.group_nm
- �б��� ǥ�ð�: group_info.school_level
- FN_GET_MEM_UNDER_TSCORE�� group_member.member_no �������� ����
- PC_DGNSS_MARK�� ���Ž� ȸ�� ���̺� ������ ���� ���� �������� Ȯ��

### 9.2 1�� �ٽ� ���� ��ȯ �Ϸ�

- selectAllStdtList
- selectActvStdtCnt
- selectTargetStList
- selectSubmitStList
- selectTcDgnssInfo
- selectStInfo

### 9.3 �ֿ� ����Ʈ/�� ���� ��ȯ �Ϸ�

- selectTcId
- selectTcDgnssInfoOne
- selectTcDgnssInfoOneWithDgnssId
- selectTcDgnssDetailInfo
- selectTcDgnssNotSubmStList
- selectTcUserInfo
- selectStUserInfo
- getDgnssReportLS
- getDgnssReportSection
- getDgnssReportValidity
- getDgnssReportMem
- getDgnssReportStatByTest
- selectDgnssAnswerReliability
- selectLernType2
- selectLernType3
- selectLernType4
- selectLernType5
- selectLernType6
- selectDgnssAnswerReportMotivate
- selectDgnssAnswerReportRecognition
- selectDgnssAnswerReportBehavior
- selectTcTrustInfoList
- selectLernEtcInfoList
- selectTcEtcInfoList
- selectClassTotalReport
- selectClassLernReport
- selectWeakFactor
- selectStTotalReport
- selectMakePdfTargetList

### 9.4 ���� ���� �۾�

�ڵ� ���� �������δ� SQL/�Լ�/���ν��� ���̱׷��̼��� ���� ������, ���� ���� �ٽ� �۾��� ���� �����̴�.

- �л� ��� ��ȸ API ����
- ���� �˻� ���/�� ����
- �˻� ����/���� ����
- �л� PDF/���� PDF ����
- Java/PDF �������� ���� �ִ� dead branch ���� ���� ����

### 9.5 비고

- clsTypeCode는 VivaClass 연동시 사용 예정이어서 비활성화했다.
- ptnId는 더 이상 사용되지 않으므로 DGNSS 쪽을 삭제했다.

---

## 10. 2026-03-19 추가 작업 - Admin API 테스트 페이지 개편

### 10.1 작업 배경

DgnssController에 개발된 API들을 Admin 페이지에서 테스트할 수 있도록 api-test.html을 개편했다.

### 10.2 구조 변경

기존 단일 탭 구조에서 **2단계 탭 구조**로 변경:

```
┌─────────────────────────────────────────────────────────┐
│  [ADMIN 호출]  [심리검사]                    ← 메인 탭    │
├─────────────────────────────────────────────────────────┤
│  ADMIN 호출 선택 시: 기존 10개 탭                         │
│  심리검사 선택 시: DGNSS API 21개 탭                      │
└─────────────────────────────────────────────────────────┘
```

### 10.3 ADMIN 호출 탭 (기존 유지)

1. 회원가입
2. 로그인
3. 회원조회
4. 그룹생성
5. 그룹참가
6. 게스트참가
7. 그룹목록
8. 그룹상세
9. 관찰메모
10. 상담관리

### 10.4 심리검사 탭 (신규 추가)

#### 교사용 API (11개)

| 탭 | API | 설명 |
|---|-----|------|
| 목록조회 | GET /api/dgnss/tc/info | 검사 목록 |
| 검사시작 | POST /api/dgnss/tc/start | 학생 데이터 생성 |
| 검사종료 | POST /api/dgnss/tc/end | 검사 종료 처리 |
| 검사취소 | POST /api/dgnss/tc/cancel | 데이터 삭제 |
| 재시작 | POST /api/dgnss/tc/restart | 신규 학생 추가 배부 |
| 상세조회 | GET /api/dgnss/tc/detail | 검사 상세 정보 |
| 미제출목록 | GET /api/dgnss/tc/notsubm | 미제출 학생 |
| 종합분석 | GET /api/dgnss/tc/analysis | 대시보드 종합 |
| 학생목록 | GET /api/dgnss/tc/stinfolist | 대시보드 학생 |
| 상담필요 | GET /api/dgnss/tc/need | 상담 필요 학생 |
| 텍스트저장 | POST /api/dgnss/tc/text/save | 코멘트 저장 |

#### 학생용 API (6개)

| 탭 | API | 설명 |
|---|-----|------|
| 목록조회 | GET /api/dgnss/st/info | 참여 가능 검사 |
| 검사시작 | POST /api/dgnss/st/start | 문제목록 반환 |
| 새로하기 | GET /api/dgnss/st/new | 새 OMR 발급 |
| 답입력 | POST /api/dgnss/st/answer | 문제 답 저장 |
| 제출 | POST /api/dgnss/st/submit | 검사 제출 |
| 결과보기 | GET /api/dgnss/st/analysis | 결과 조회 |

#### PDF/공통 API (4개)

| 탭 | API | 설명 |
|---|-----|------|
| PDF다운로드 | POST /api/dgnss/pdf | 개별 다운로드 |
| PDF대상조회 | GET /api/dgnss/pdf/search | 일괄 대상 조회 |
| 일괄다운로드 | GET /api/dgnss/dgnss-download-all | ZIP 다운로드 |
| 요약본업로드 | POST /api/dgnss/summary/pdf | CDN 업로드 |

### 10.5 관리자 모드 - 테스트 ID 설정 패널

로그인 후 심리검사 탭에서 사용 가능한 관리자 전용 패널 추가:

- 학급 ID(claId) 입력 → 멤버 조회
- 교사/학생 드롭다운에서 선택
- 선택한 ID가 각 API 입력 필드에 자동 반영

자동 반영 필드:

| 선택 | 반영 필드 |
|------|----------|
| claId | 모든 교사/학생 목록조회, 검사시작, 재시작, 종합분석 |
| tcId | 교사 목록조회, 검사시작 |
| stdtId | 학생 목록조회, 결과보기, PDF다운로드(userId) |

### 10.6 JWT 토큰 연동

- 로그인 시 발급받은 accessToken이 모든 API 호출에 자동 적용
- Authorization: Bearer 헤더 자동 추가

### 10.7 수정 파일

- `src/main/resources/templates/admin/api-test.html`

---

## 11. group_info 테이블 collation 변경

### 11.1 DDL

```sql
-- 테이블 + 모든 컬럼 collation 일괄 변경
ALTER TABLE group_info CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 11.2 변경 후 확인

```sql
SHOW TABLE STATUS LIKE 'group_info';
SHOW FULL COLUMNS FROM group_info;
```
