# DGNSS LPA 유형 적용 메모

**작성일:** 2026-03-20  
**목적:** META Dashboard DGNSS 채점 결과에 LPA 유형 분류를 추가하기 위한 현재 결정사항과 구현 기준 정리

---

## 1. 현재 확인된 전제

- `tb_dgnss_answer`에서 학생별 검사 결과의 학교급 구분값을 확인할 수 있다.
- 채점 완료 후 학생별 T점수는 모두 조회 가능하다.
- 따라서 LPA는 "채점 완료된 답안 1건"을 기준으로 후처리 분석으로 붙이는 방식이 적절하다.

---

## 2. 참고 데이터 파일

참고 원본:

- `C:\Users\ADMIN\IdeaProjects\kimjh21-test\docs\LPA 유형 분류 로직.md`
- `C:\Users\ADMIN\IdeaProjects\kimjh21-test\src\main\resources\data\lpa-profile-data.json`
- `C:\Users\ADMIN\IdeaProjects\kimjh21-test\src\main\resources\data\lpa-types.json`

확인된 구조:

- `lpa-profile-data.json`
  - `Class1 ~ Class6`별 38개 요인 평균 T점수 보유
- `lpa-types.json`
  - `Class1 ~ Class6`별 유형명, 설명, 개입 전략, 해석 문구 보유

---

## 3. 현재 확인된 분류 체계

### 3.1 초등

- `Class1`: 자원소진형
- `Class2`: 안전균형형
- `Class3`: 몰입자원풍부형

### 3.2 중등

- `Class4`: 무기력형
- `Class5`: 정서조절취약형
- `Class6`: 자기주도몰입형

---

## 4. 해설 적용 기준

- 해설은 `typeName` 기준이 아니라 `classId` 기준으로 적용하는 것이 안전하다.
- 이유:
  - 현재 JSON 구조가 `Class1 ~ Class6` 중심이다.
  - 향후 같은 유형명이 학교급별로 중복되더라도 `classId` 기준이면 충돌 없이 처리할 수 있다.
- 따라서 결과 저장 시에도 `predictedType`만 저장하지 말고 `predictedClassId`를 함께 저장해야 한다.

---

## 5. 학교급 처리 정책

- 현재 LPA 데이터는 초등/중등만 존재한다.
- 고등(`high`)용 프로파일은 아직 없다.

구현 전 정책 후보:

1. 고등은 미지원 처리
2. 고등은 중등 프로파일 임시 공용 사용
3. 고등 전용 LPA 데이터 추가 확보

현재 기준 권장안:

- 고등은 미지원 처리

---

## 6. 저장 구조 권장안

기존 `tb_dgnss_answer`에 컬럼을 직접 추가하기보다, 별도 결과 테이블을 두는 것이 적절하다.

권장 테이블명 예시:

- `tb_dgnss_lpa_result`

### 6.1 저장 기준

- 기준 키: `answer_idx`

이유:

- LPA는 채점 완료된 답안 1건에 대해 1회 계산되는 파생 분석 결과이다.
- T점수 원천도 `tb_dgnss_answer_report.answer_idx`를 기준으로 연결되기 때문이다.

### 6.2 권장 컬럼

- `id`
- `answer_idx`
- `dgnss_result_id`
- `test_idx`
- `mem_id`
- `school_level`
- `class_id`
- `type_name`
- `confidence`
- `model_version`
- `profile_version`
- `input_scores_json`
- `probabilities_json`
- `status`
- `created_at`
- `updated_at`

### 6.3 권장 인덱스

- `uk_answer_idx`
- `idx_mem_id`
- `idx_test_idx`
- `idx_dgnss_result_id`

---

## 7. 컬럼 추가 대신 별도 테이블을 권장하는 이유

- LPA 결과는 단순 문자열 1개가 아니라 `classId`, `confidence`, `학교급`, `모델 버전`, `확률 분포`, `입력점수 snapshot`까지 확장될 수 있다.
- 해설과 모델 버전이 바뀌더라도 원본 답안 테이블과 분리돼 있으면 이력 관리가 쉽다.
- 재계산, 검증, 모델 교체 시 영향 범위를 줄일 수 있다.

비권장 예:

- `tb_dgnss_answer`에 `lpa_type_name`, `lpa_confidence`만 추가

문제점:

- 모델 버전 관리가 어렵다.
- 확률 전체 분포 저장이 어렵다.
- 입력점수 snapshot이 남지 않는다.
- 재계산/비교 작업이 불편하다.

---

## 8. 구현 순서 초안

1. `answer_idx` 기준으로 38개 T점수를 추출하는 쿼리 정의
2. 학교급(`elementary`, `middle`, `high`)을 판별하는 서비스 로직 정의
3. 학교급에 맞는 LPA 클래스 집합만 비교하도록 분기
4. 로그 우도 계산 구현
5. 사전확률 반영 구현
6. Log-Sum-Exp 정규화 구현
7. `classId`, `typeName`, `confidence` 산출
8. `lpa-types.json` 기반 해설 데이터 결합
9. `tb_dgnss_lpa_result` 저장
10. 학생/교사 결과 조회 API 응답에 LPA 결과 포함

---

## 9. 사전확률 관련 결정 필요

- 원본 LPA 문서 예시는 `priors`를 별도 사용한다.
- 하지만 현재 실제 `lpa-profile-data.json`에는 `priors` 필드가 없다.
- 대신 `lpa-types.json`에 `proportion` 값이 존재한다.

구현 후보:

1. `lpa-types.json`의 `proportion`을 prior로 사용
2. prior를 별도 설정 파일로 분리
3. 초기 버전은 동일 prior로 단순화

현재 기준 권장안:

- `lpa-types.json`의 `proportion`을 prior로 사용

---

## 10. 다음 작업 시 확인할 항목

- 38개 T점수의 정확한 추출 순서
- 학교급 컬럼의 실제 값 체계
- 고등 처리 정책 확정
- LPA 결과를 어느 API 응답에 포함할지 결정
- 재채점/재계산 시 upsert 정책 정의

---
