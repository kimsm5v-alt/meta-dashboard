# 레거시 심리검사 DB → meta-api 회원 테이블 전환 가이드

> **최초 작성일**: 2026-03-17
> **최종 수정일**: 2026-03-18 (v2.1)
> **배경**: vlms-stat에서 이관한 dgnss 모듈(학습심리정서검사)이 `aidt_lms` 레거시 회원 테이블을 직접 참조하고 있음.
> meta-api-api는 자체 DB(`viva_meta`)로 회원을 관리하므로, 레거시 테이블 참조를 `viva_meta`로 전환해야 함.
> **선행 작업**: KERIS/VivaClass 외부 연동 제거 완료, ntcn 모듈 제거 완료 (2026-03-17)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-03-17 | 1.0 | 최초 작성 |
| 2026-03-18 | 2.0 | etc→dgnss 패키지 변경 반영, ntcn 모듈 제거, viva_meta v3 구조 반영 (user_no PK) |
| 2026-03-18 | 2.1 | File 테이블 마이그레이션 추가 (aidt_file→file, aidt_file_download_log→file_download_log) |

---

## 1. 레거시 `aidt_lms` 회원 관련 테이블 (심리검사 모듈에서 사용 중)

| 테이블 | 역할 | 참조 횟수 | 주요 사용 컬럼 |
|--------|------|:---------:|--------------|
| `aidt_lms.user` | 통합 사용자 (교사+학생) | 3곳 | `user_id`, `sex` |
| `aidt_lms.stdt_reg_info` | 학생 등록 정보 | ~25곳 | `user_id`, `flnm`(실명), `num`(출석번호) |
| `aidt_lms.tc_cla_mb_info` | 학급-멤버 매핑 | ~40곳 | `cla_id`, `user_id`(교사), `stdt_id`, `actvtn_at` |
| `aidt_lms.tc_cla_info` | 학급 마스터 | 2곳 | `cla_id`, `cla_nm`, `user_id`(교사) |
| `aidt_lms.tc_cla_user_info` | 학급-교사 매핑 | 1곳 (FileMapper) | `cla_id`, `user_id` |
| `aidt_lms.tc_reg_info` | 교사 등록 정보 | 2곳 | `user_id`, `flnm`(실명) |

### 참조 파일별 분포

| 파일 | 참조 횟수 | 비고 |
|------|:---------:|------|
| `mapper/dgnss/DgnssMapper.xml` | ~70곳 | etc→dgnss로 변경됨 |
| `mapper/common/FileMapper.xml` | ~15곳 | common 패키지로 이동됨 |
| **합계** | **~85곳** | |

### 1.2 레거시 `aidt_lms` 파일 관련 테이블

| 레거시 테이블 | 전환 후 테이블 | 역할 | 상태 |
|--------------|--------------|------|:----:|
| `aidt_lms.aidt_file` | `viva_meta.file` | 파일 메타정보 | ✅ 완료 |
| `aidt_lms.aidt_file_download_log` | `viva_meta.file_download_log` | 다운로드 로그 | ✅ 완료 |

#### File 테이블 주요 컬럼

| 컬럼 | 설명 |
|------|------|
| `id` | 파일 PK (AUTO_INCREMENT) |
| `file_name` | 원본 파일명 |
| `save_file_name` | 저장된 파일명 (UUID) |
| `file_path` | 파일 경로 |
| `file_extension` | 확장자 |
| `file_size` | 파일 크기 |
| `rgtr` | 등록자 ID |
| `checksum` | HMAC SHA256 체크섬 |
| `prsinfo_yn` | 개인정보 포함 여부 (Y/N) |
| `del_yn` | 삭제 여부 (Y/N) |

---

## 2. meta-api `viva_meta` 회원 테이블 (v3)

> **v3 핵심 변경**: `user_id`(VARCHAR PK) 제거 → `user_no`(BIGINT AUTO_INCREMENT PK), `email`이 로그인 식별자

| 테이블 | 역할 | 주요 컬럼 |
|--------|------|----------|
| `viva_meta.user` | 통합 회원 | `user_no`(PK), `email`(로그인), `nickname`, `role_code`, `tc_id`, `stdt_id`, `status` |
| `viva_meta.group_info` | 그룹(학급) | `group_id`(PK), `cla_id`(레거시 호환 UUID), `host_user_no`, `group_nm`, `school_level`, `grade`, `class_number` |
| `viva_meta.group_member` | 그룹 멤버 | `group_id`, `user_no`, `stdt_id`, `nickname`, `member_type`, `member_no`, `status` |

---

## 3. 데이터베이스 간 차이 분석

### 3.1 aidt_lms에만 있는 것 (viva_meta에 없음)

| 테이블/컬럼 | 설명 | 마이그레이션 영향 |
|------------|------|-----------------|
| `user.sex` | 성별 (M/F) | ⚠️ **결정 필요** - 추가 or 제거 |
| `stdt_reg_info` 테이블 | 학생 상세정보 (flnm, num 등) | user/group_member에 통합 |
| `tc_reg_info` 테이블 | 교사 상세정보 (flnm 등) | user에 통합 |
| `tc_cla_user_info` 테이블 | 학급-교사 매핑 | group_info.host_user_no로 대체 |
| `tc_cla_mb_info.user_id` | 담당 교사 ID (멤버 테이블 내) | group_info에서 관리 |

### 3.2 viva_meta에만 있는 것 (aidt_lms에 없음)

| 테이블/컬럼 | 설명 | 비고 |
|------------|------|------|
| `user.email` | 이메일 (로그인 식별자) | 신규 인증 체계 |
| `user.password` | BCrypt 암호화 비밀번호 | 자체 인증 |
| `user.role_code` | 권한 코드 | STUDENT/TEACHER/PRINCIPAL/SUPERINTENDENT/ADMIN |
| `user.user_no` | BIGINT PK | 내부 식별자 |
| `role_group` 테이블 | 권한 그룹 마스터 | 권한 체계 |
| `school_info` 테이블 | 학교 마스터 | 학교 정보 관리 |
| `auth_school_map` 테이블 | 직책별 학교 접근 매핑 | 교장/장학사용 |
| `email_verification` 테이블 | 이메일 인증코드 | 회원가입 인증 |
| `guest_conversion_log` 테이블 | 게스트→회원 전환 이력 | 게스트 기능 |
| `memo_info` 테이블 | 관찰 메모 | 신규 기능 |
| `counseling_info` 테이블 | 상담 정보 | 신규 기능 |
| `counseling_student` 테이블 | 상담-학생 매핑 | 신규 기능 |
| `refresh_token` 테이블 | 리프레시 토큰 관리 | JWT 인증 |
| `group_info.invite_code` | 초대 코드 | 그룹 참가 |
| `group_member.member_type` | STUDENT/GUEST 구분 | 게스트 참가 |
| `group_member.email` | 게스트 이메일 | 회원 전환 매칭용 |

---

## 4. 컬럼별 매핑 비교

### 4.1 회원 테이블 매핑

| 항목 | 레거시 (`aidt_lms`) | meta-api (`viva_meta`) | 매핑 | 비고 |
|------|-------------------|----------------------|:----:|------|
| 사용자 PK | `user.user_id` (VARCHAR) | `user.user_no` (BIGINT) | △ | PK 타입 변경 |
| 로그인 식별자 | `user.user_id` | `user.email` | △ | 이메일 로그인으로 전환 |
| 학생 ID | `user.user_id` (학생) | `user.stdt_id` | ✅ | 레거시 호환 |
| 교사 ID | `user.user_id` (교사) | `user.tc_id` | ✅ | 레거시 호환 |
| 학생 이름 | `stdt_reg_info.flnm` | `user.nickname` 또는 `group_member.nickname` | △ | 레거시=실명, meta-api=닉네임 |
| 학생 번호 | `stdt_reg_info.num` | `group_member.member_no` | △ | 레거시=전역, meta-api=그룹별 |
| 교사 이름 | `tc_reg_info.flnm` | `user.nickname` | △ | 동일 |
| 성별 | `user.sex` (M/F) | **없음** | ❌ | **결정 필요** |

### 4.2 학급/그룹 테이블 매핑

| 항목 | 레거시 (`aidt_lms`) | meta-api (`viva_meta`) | 매핑 | 비고 |
|------|-------------------|----------------------|:----:|------|
| 학급 ID | `tc_cla_info.cla_id` | `group_info.cla_id` | ✅ | 호환 설계 (UUID) |
| 학급명 | `tc_cla_info.cla_nm` | `group_info.group_nm` | ✅ | |
| 담당 교사 | `tc_cla_info.user_id` | `group_info.host_user_no` → `user.tc_id` | ✅ | 조인 필요 |

### 4.3 학급 멤버 테이블 매핑

| 항목 | 레거시 (`aidt_lms`) | meta-api (`viva_meta`) | 매핑 | 비고 |
|------|-------------------|----------------------|:----:|------|
| 학급 연결 | `tc_cla_mb_info.cla_id` | `group_member.group_id` → `group_info.cla_id` | ✅ | 2단계 조인 |
| 학생 연결 | `tc_cla_mb_info.stdt_id` | `group_member.stdt_id` | ✅ | 레거시 호환 |
| 교사 연결 | `tc_cla_mb_info.user_id` | `group_info.host_user_no` | ✅ | group_info로 이동 |
| 활성 상태 | `tc_cla_mb_info.actvtn_at` (Y/N) | `group_member.status` | △ | Y → ACTIVE |

---

## 5. 주요 전환 패턴

### 5.1 학생 이름/번호 조회

```sql
-- [현재] 레거시
SELECT sri.flnm, sri.num
FROM aidt_lms.tc_cla_mb_info tcmi
INNER JOIN aidt_lms.stdt_reg_info sri ON tcmi.stdt_id = sri.user_id
WHERE tcmi.cla_id = #{claId}
  AND tcmi.actvtn_at = 'Y'

-- [전환 후] viva_meta
SELECT gm.nickname AS flnm, gm.member_no AS num
FROM viva_meta.group_member gm
INNER JOIN viva_meta.group_info gi ON gm.group_id = gi.group_id
WHERE gi.cla_id = #{claId}
  AND gm.status = 'ACTIVE'
```

### 5.2 학급 멤버 활성 체크

```sql
-- [현재] 레거시
INNER JOIN aidt_lms.tc_cla_mb_info tcmi
  ON cla_id = tcmi.cla_id
  AND stdt_id = tcmi.stdt_id
  AND tcmi.actvtn_at = 'Y'

-- [전환 후] viva_meta
INNER JOIN viva_meta.group_info gi ON gi.cla_id = #{claId}
INNER JOIN viva_meta.group_member gm
  ON gi.group_id = gm.group_id
  AND gm.stdt_id = #{stdtId}
  AND gm.status = 'ACTIVE'
```

### 5.3 교사 ID 조회 (학급 기준)

```sql
-- [현재] 레거시
SELECT user_id FROM aidt_lms.tc_cla_info WHERE cla_id = #{claId}

-- [전환 후] viva_meta
SELECT u.tc_id
FROM viva_meta.group_info gi
INNER JOIN viva_meta.user u ON gi.host_user_no = u.user_no
WHERE gi.cla_id = #{claId}
```

### 5.4 교사 이름 조회

```sql
-- [현재] 레거시
SELECT tri.flnm
FROM aidt_lms.tc_reg_info tri
WHERE tri.user_id = #{tcId}

-- [전환 후] viva_meta
SELECT u.nickname AS flnm
FROM viva_meta.user u
WHERE u.tc_id = #{tcId}
```

### 5.5 성별 조회 (제거 시)

```sql
-- [현재] 레거시
SELECT CASE WHEN d1.sex = 'M' THEN '남자' ELSE '여자' END AS gender
FROM aidt_lms.user d1
WHERE user_id = #{stdtId}

-- [전환 후] 제거하거나, user 테이블에 sex 컬럼 추가 필요
-- (A안) 제거: 쿼리에서 gender 컬럼 삭제
-- (B안) 추가: viva_meta.user에 sex 컬럼 추가 후 동일 패턴 사용
```

---

## 6. 마이그레이션 가능 여부 요약

| 항목 | 상태 | 비고 |
|------|:----:|------|
| 회원 정보 (성별 제외) | ✅ | `tc_id`, `stdt_id` 호환 |
| 학급/그룹 정보 | ✅ | `cla_id` 호환 |
| 학급 멤버 정보 | ✅ | `stdt_id` 호환 |
| 교사-학급 관계 | ✅ | `host_user_no` → `tc_id` 조인 |
| 학생 이름 | ✅ | `flnm` → `nickname` |
| 학생 번호 | ✅ | `num` → `member_no` |
| 성별 정보 | ⚠️ | **결정 필요** |
| 심리검사 데이터 (aidt_diagnosis) | ⚠️ | 별도 유지, FK만 변경 |
| 파일 테이블 (`file`) | ✅ | `aidt_file` → `file` 완료 |
| 다운로드 로그 (`file_download_log`) | ✅ | `aidt_file_download_log` → `file_download_log` 완료 |

---

## 7. 전환 작업 범위

| 파일 | 수정 개소 | 난이도 | 비고 |
|------|:---------:|:-----:|------|
| `mapper/dgnss/DgnssMapper.xml` | ~70곳 | 높음 | `stdt_reg_info` + `tc_cla_mb_info` 조인 패턴 |
| `mapper/common/FileMapper.xml` | ~15곳 | 중간 | 테이블명 변경 완료 (`file`, `file_download_log`) |
| `DgnssService.java` | 확인 필요 | 중간 | Map 키 이름 변경 (`flnm`→`nickname` 등) |
| `FileService.java` | 확인 필요 | 중간 | common 패키지로 이동 완료 |
| **합계** | **~85곳+** | | |

### 7.1 File 테이블 마이그레이션 완료 내역

| 작업 | 변경 전 | 변경 후 | 상태 |
|------|--------|--------|:----:|
| 테이블명 변경 | `aidt_file` | `file` | ✅ |
| 테이블명 변경 | `aidt_file_download_log` | `file_download_log` | ✅ |
| Mapper 패키지 이동 | `api.dgnss.mapper` | `common.mapper` | ✅ |
| Mapper XML 이동 | `mapper/dgnss/` | `mapper/common/` | ✅ |
| VO 패키지 이동 | `api.dgnss.vo` | `common.vo` | ✅ |
| Controller 이동 | - | `common.controller.FileController` | ✅ |
| Service 이동 | `api.dgnss.service` | `common.service` | ✅ |

---

## 8. 선결 과제

| # | 과제 | 상태 | 비고 |
|---|------|:----:|------|
| 1 | **성별 컬럼 추가 여부 결정** | ⏳ 대기 | `user` 테이블에 `sex` 컬럼 추가 or 기능에서 제거 |
| 2 | `nickname` vs 실명 정책 확정 | ⏳ 대기 | PDF 보고서에 실명 필요 시 `real_name` 컬럼 추가 검토 |
| 3 | `aidt_diagnosis` 테이블 유지 여부 | ⏳ 대기 | 진단 결과 데이터 별도 DB 유지 or `viva_meta` 통합 |
| 4 | 기존 데이터 마이그레이션 | ⏳ 대기 | 레거시 → `viva_meta` 이관 스크립트 필요 여부 |
| 5 | File 테이블 마이그레이션 | ✅ 완료 | 테이블명 변경, Mapper/Service/Controller 이동 완료 |
| 6 | FileMapper 내 회원 테이블 참조 전환 | ⏳ 대기 | `tc_cla_mb_info`, `stdt_reg_info` 등 → `viva_meta` |

---

## 9. 관련 문서

- [dgnss-api-spec.md](./dgnss-api-spec.md) — 학습심리정서검사 API 연동 규격서
- [meta_api_ddl_v3.sql](./meta_api_ddl_v3.sql) — viva_meta 데이터베이스 DDL

---

## 10. 2026-03-19 DGNSS ���̱׷��̼� �ݿ� ����

### 10.1 ���� Ȯ���� ����

- �л� �̸�: group_member.nickname
- �л� ��ȣ: group_member.member_no
- �л� ����: group_member.gender
- ���� �̸�: group_info.host_user_no -> user.user_no -> user.nickname
- �б޸�: group_info.group_nm
- �б���: group_info.school_level

### 10.2 �л�/���� �̸� ��å Ȯ��

���� �������� ��� ���¿��� �̸� ��å�� �Ʒ��� ���� Ȯ���Ѵ�.

- stdt_reg_info.flnm -> group_member.nickname
- 	c_reg_info.flnm -> user.nickname

�� �л� ǥ�ø��� group_member, ���� ǥ�ø��� user �������� �и��Ѵ�.

### 10.3 ���� ��å Ȯ��

���� �������� �����̾��� ���� ��å�� �Ʒ��� ���� Ȯ���Ѵ�.

- ��� �÷�: group_member.gender
- �ڵ� ü��: M/F
- ǥ�� ��ȯ:

`sql
CASE
  WHEN gm.gender = 'M' THEN '����'
  WHEN gm.gender = 'F' THEN '����'
  ELSE ''
END
`

CASE WHEN sex = 'M' THEN '����' ELSE '����' END ���´� ������� �ʴ´�.

### 10.4 DGNSS ������ ����� ���� Ȯ��

���� ������ "idt_diagnosis ���� ����" ������ �� �̻� ������� �ʴ´�.

- DGNSS ���̺��� ���� DB �������� ���
- DgnssMapper.xml �� ��Ű�� prefix ���� �Ϸ�
- �Լ�/���ν��� ȣ�⵵ ���� DB �������� ���

### 10.5 DGNSS �ݿ� ��Ȳ

�Ʒ� �׸��� ���� �ڵ忡 �ݿ� �Ϸ��ߴ�.

- DgnssMapper.xml �� ���Ž� DB prefix ����
- ȸ��/�б� ���� ��ȯ
- FN_GET_MEM_UNDER_TSCORE ��ȯ
- PC_DGNSS_MARK ���� ���� Ȯ��

���� ���� �ٽ� �ܰ�� SQL ������ �ƴ϶� ���� �����̴�.

- �л� ��� API
- ���� �˻� ���/��
- �˻� ����/����
- �л� PDF/���� PDF

### 10.6 ���� �޸�

�Ʒ� ������ ���� �������� ����.

- 	c_reg_info.flnm -> user.nickname
- ��� �÷�: group_member.gender
- �ڵ� ü��: M/F

`sql
CASE
  WHEN gm.gender = 'M' THEN '����'
  WHEN gm.gender = 'F' THEN '����'
  ELSE ''
END
`

- CASE WHEN sex = 'M' THEN '����' ELSE '����' END ���´� ������� �ʴ´�.
- ���� ������ "idt_diagnosis ���� ����" ������ �� �̻� ������� �ʴ´�.
- DgnssMapper.xml �� ���Ž� DB prefix ���� �Ϸ�
- FN_GET_MEM_UNDER_TSCORE ��ȯ �Ϸ�
- PC_DGNSS_MARK ���� ���� Ȯ��
