# DGNSS 학생 결과 API 응답 형식 통일

> 작성일: 2026-03-19
> 대상 프로젝트: `meta-dashboard/backend`
> 관련 파일: `src/main/java/com/vs/meta/api/dgnss/service/DgnssService.java`

---

## 1. 목적

학생 검사 결과 조회 API에서 `paperIdx` 값에 따라 응답 형식이 달라지던 부분을 정리한다.

기존에는:

- `paperIdx = 1` 이면 `SECTION_ID`, `SECTION_NM`, `tScore` 중심의 리스트 형태
- `paperIdx = 2` 이면 영역별 객체(`motivateInfo`, `recognitionInfo`, `behaviorInfo`) 형태

로 내려가고 있었다.

이번 작업에서는 `paperIdx = 2` 도 `paperIdx = 1` 과 동일하게
`SECTION_ID`, `SECTION_NM`, `tScore` 중심의 리스트 형태로 통일했다.

---

## 2. 수정 대상 API

### 2.1 학생 개별 결과 조회

- `GET /api/dgnss/st/analysis`
- 컨트롤러:
  - `com.vs.meta.api.dgnss.controller.DgnssController#stMetaAnalysis`
- 서비스:
  - `com.vs.meta.api.dgnss.service.DgnssService#selectStAnalysis`

### 2.2 학생 종합 결과 조회

- `GET /api/dgnss/st/total/analysis`
- 컨트롤러:
  - `com.vs.meta.api.dgnss.controller.DgnssController#stTotalAnalysis`
- 서비스:
  - `com.vs.meta.api.dgnss.service.DgnssService#selectStTotalAnalysis`

---

## 3. 기존 응답 형식

### 3.1 `GET /api/dgnss/st/analysis`

#### `paperIdx = 1`

- `resultData.stUserInfo` 내부에 회차별 키 `"1"`, `"2"` 추가
- 각 회차 값은 리스트
- 리스트 원소 예시:
  - `SECTION_ID`
  - `SECTION_NM`
  - `DEPTH`
  - `tScore`
  - `ord_no`
  - `reaction`
  - `desirable`
  - `repeatResponse`

#### `paperIdx = 2`

- `resultData.stUserInfo` 내부에 아래 객체가 추가됨
  - `motivateInfo`
  - `recognitionInfo`
  - `behaviorInfo`
- 각 객체는 항목별 `{ score, rank }` 구조
- 추가로 `strFactor`, `weakFactor` 포함

### 3.2 `GET /api/dgnss/st/total/analysis`

#### `paperIdx = 1`

- 최상위에 `"1"`, `"2"` 키 존재
- 각 값은 섹션 리스트

#### `paperIdx = 2`

- 최상위에 `"1"`, `"2"` 키 존재
- 각 값은 회차별 요약 객체
- 예:
  - `motivateTotal`
  - `learningEg`
  - `metaCog`
  - `behaviorTotal`
  - `reaction`
  - `desirable`
  - `repeatResponse`

---

## 4. 변경 내용

`paperIdx = 2` 인 경우에도 `paperIdx = 1` 과 동일하게
`selectStLernAnalysis` 기반의 섹션 리스트를 반환하도록 서비스 로직을 변경했다.

즉 두 API 모두 이제 `paperIdx = 1`, `paperIdx = 2` 공통으로 다음 필드를 가진 리스트를 사용한다.

- `SECTION_ID`
- `SECTION_NM`
- `DEPTH`
- `tScore`
- `ord_no`
- `reaction`
- `desirable`
- `repeatResponse`

회차 구분은 기존과 동일하게:

- `"1"`: 1차
- `"2"`: 2차

형태를 유지한다.

---

## 5. 구현 방식

수정 파일:

- `src/main/java/com/vs/meta/api/dgnss/service/DgnssService.java`

적용 내용:

1. `selectStAnalysis`
   - `paperIdx = 1/2` 모두 `selectStLernAnalysis` 결과를 사용하도록 조기 반환 경로 추가

2. `selectStTotalAnalysis`
   - `paperIdx = 1/2` 모두 `selectStLernAnalysis` 결과를 사용하도록 조기 반환 경로 추가

3. 공통 헬퍼 추가
   - `splitStudentAnalysisByOrd`
   - 회차(`ord_no`) 기준으로 결과를 `"1"`, `"2"`로 분리

---

## 6. 결과 구조

### 6.1 `GET /api/dgnss/st/analysis`

`resultData.stUserInfo` 내부 예시:

```json
{
  "stUserInfo": {
    "stdtId": "rrmath016-s1",
    "gender": "남자",
    "grade": "중1",
    "1": [
      {
        "dgnssResultId": 123,
        "SECTION_ID": "20-22-01-01-01-0",
        "SECTION_NM": "자아존중감",
        "DEPTH": 5,
        "tScore": 55,
        "ord_no": 1,
        "reaction": null,
        "desirable": null,
        "repeatResponse": "N"
      }
    ]
  }
}
```

### 6.2 `GET /api/dgnss/st/total/analysis`

`resultData` 예시:

```json
{
  "stUserInfo": {
    "stdtId": "rrmath016-s1",
    "gender": "남자",
    "grade": "중1"
  },
  "1": [
    {
      "dgnssResultId": 123,
      "SECTION_ID": "20-22-01-01-01-0",
      "SECTION_NM": "자아존중감",
      "DEPTH": 5,
      "tScore": 55,
      "ord_no": 1,
      "reaction": null,
      "desirable": null,
      "repeatResponse": "N"
    }
  ]
}
```

---

## 7. 주의사항

- 이번 변경으로 `paperIdx = 2` 에서 더 이상 `motivateInfo`, `recognitionInfo`, `behaviorInfo` 구조를 반환하지 않는다.
- 따라서 해당 구조를 직접 소비하던 프론트나 외부 클라이언트가 있으면 같이 수정해야 한다.
- 응답 형식은 통일됐지만, 성별/회원 이관 작업은 아직 별도다.
- 성별은 추후 `aidt_lms.user.sex` 대신 `group_member.gender` 기준으로 전환할 예정이다.

---

## 8. 검증

컴파일 검증 완료:

```bash
..\gradlew.bat :backend:compileJava
```

결과:

- `compileJava` 성공
- 경고만 존재
  - deprecated API 사용 경고
  - unchecked/unsafe operations 경고

