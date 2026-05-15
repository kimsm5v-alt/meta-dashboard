# tc/analysis LPA 및 타학급 fallback 정책 적용 정리 (2026-05-06)

## 배경
- 교사용 `GET /api/dgnss/tc/analysis` 응답에 학생별 LPA 유형 정보가 필요함.
- 학생/그룹이 N:N 구조라서, 현재 학급에 속한 학생이라도 해당 학급에서 심리검사 이력이 없을 수 있음.
- 이 경우 같은 `paperIdx`, `ordNo` 조건의 타학급 응시 이력을 fallback으로 조회해야 함.

## 최종 정책
- 적용 대상: `paperIdx`와 무관하게 적용.
- 즉, `paperIdx = 1`, `paperIdx = 2` 모두 `lpaByOrd` 및 타학급 fallback 적용.

### 학생별 LPA 응답
- `tc/analysis` 응답에 `lpaByOrd` 추가.
- 구조 예시:
  - `lpaByOrd["1"]`, `lpaByOrd["2"]` (회차별)
  - 각 원소: `stdtId`, `source`, `lpaClassId`, `lpaTypeName`, `lpaConfidence`, `lpaStatus`, `lpaTop1~3(이름/확률)`
- `source` 값:
  - `IN_CLASS`: 현재 학급 응시 이력 기반
  - `OTHER_CLASS`: 타학급 fallback 응시 이력 기반

### fallback 대상 기준(중요)
- fallback은 "미제출"이 아니라,
- **현재 학급 + 동일 paperIdx + 동일 ordNo 기준으로 `tb_dgnss_result_info` row 자체가 없는 학생**만 대상.
- 즉, 현재 학급에 result row가 있으면(`subm_at`이 `N`이어도) fallback 대상에서 제외.

## 구현 변경 파일

### 1) 서비스
- `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssService.java`
- `selectTcAnalysis` 변경:
  - LPA/fallback 수행을 `paperIdx` 분기 밖으로 이동하여 공통 적용
  - `paperIdx=2`의 기존 평균 계산 로직은 유지
  - fallback 병합 후 `stdtId` 기준 dedup

### 2) 매퍼 인터페이스
- `backend/src/main/java/com/vs/meta/api/dgnss/mapper/DgnssMapper.java`
- 추가 메서드:
  - `selectOrdNoByDgnssId(int dgnssId)`
  - `selectClassStudentsWithoutResultInClassForOrd(Map<String, Object> param)`
  - `selectClassTotalReportFromOtherClasses(Map<String, Object> param)`

### 3) 매퍼 SQL
- `backend/src/main/resources/mapper/dgnss/DgnssMapper.xml`
- `selectClassTotalReport`:
  - `stdtId`, LPA 컬럼(class/type/confidence/status/probabilities_json) 포함
- 신규 SQL:
  - `selectOrdNoByDgnssId`
  - `selectClassStudentsWithoutResultInClassForOrd`
  - `selectClassTotalReportFromOtherClasses`

## 관련 tc/start 정책 확인
- `insertTcDgnssStart`의 `ordNo=2` 대상 선정 정책은 이미 반영됨.
- 기준: 동일 학급 1회차 이력 존재 + 타학급 1회차 이력 없음.
- `subm_at` Y/N 무관(이력 존재 기준).

## 빌드 검증
- `./gradlew.bat :backend:compileJava` 성공.

## 주의사항
- `lpaByOrd`는 현재 `paperIdx`와 무관하게 채워짐.
- `selectClassTotalReportFromOtherClasses`는 현재 `b1.subm_at = 'Y'` 조건을 유지하므로, 타학급 fallback은 제출 데이터 기준으로만 내려감.

---

# 추가 작업 (2026-05-08): paperIdx=1 학생별 학습영역 점수 + 타학급 응시 상태 노출

## 배경
- 위 LPA fallback 작업 이후, paperIdx=1 (학습종합검사)의 학생별 학습영역 점수도 동일한 N:N 이슈가 있음.
- 기존 `tc/analysis` 응답의 `"1"`/`"2"` 필드는 `selectClassLernReport` 의 학급 평균(per-section avg)이라 학생 단위 fallback 추적이 안 됨.
- "어떤 학생이 다른 학급에서 응시했는지", "그 학생이 다른 학급에서 제출했는지/응시 중인지" 를 FE 가 표시할 수 있어야 함.

## 추가 정책

### lernReportByOrd 필드 신설 (paperIdx=1 한정)

`tc/analysis` 응답에 `lernReportByOrd` 추가. 회차별(`"1"`, `"2"`) 학생 row 배열.

각 원소:

| 필드 | 값 | 설명 |
|---|---|---|
| `stdtId` | string | 학생 ID |
| `source` | `IN_CLASS` / `OTHER_CLASS` | 현재 학급 데이터인지 타학급 fallback 인지 |
| `ord_no` | int | 회차 |
| `subm_at` | `Y` / `N` | 제출 상태 (`Y`=제출완료, `N`=미제출/응시 중) |
| `sectionScores` | object | `{SECTION_ID: T_SCORE}` map. 미제출 학생은 `{}` |

### subm_at 노출 정책

`subm_at` 은 모든 `lernReportByOrd` row 에 노출:
- IN_CLASS row: 항상 `Y` (현재 학급 조회 SQL 인 `selectClassTotalReport` 에 `b1.subm_at = 'Y'` 필터)
- OTHER_CLASS Y row: 기존 `selectClassTotalReportFromOtherClasses` 결과 (Y 필터)
- OTHER_CLASS N row: 새로 추가된 SQL `selectClassStudentsSubmStatusFromOtherClasses` 로 별도 보강

### "다른 학급" 정의

세 SQL 모두 동일 — `tb_dgnss_info.cla_id <> #{claId}` (현재 학급 cla_id 가 아닌 진단). 추가 메타 검증 없음 (학생-학급 N:N 모델상 의도된 동작).

### 미제출(N) 학생 fallback 포함

기존 fallback (`selectClassTotalReportFromOtherClasses`) 은 `subm_at='Y'` 만 조회 → 타학급에서 응시 중(N)인 학생은 응답에서 누락.
**이번 변경**: `selectClassStudentsSubmStatusFromOtherClasses` 로 누락 학생들의 타학급 subm_at 상태(Y/N 무관)를 추가 조회 → N-only 학생도 `lernReportByOrd` 에 빈 `sectionScores={}`, `subm_at='N'` 으로 노출.

### lpaByOrd 변경 없음

LPA 분류는 제출 데이터 기준이라 의미 있음 → 기존 정책 그대로 유지(N 학생 무관).

## 구현 변경 파일

### 1) 서비스
- `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssService.java`
- `selectTcAnalysis` 의 `lpaByOrd` 루프 안에서 동일 `lpaRows` 의 `json` 컬럼을 파싱하여 `lernReportByOrd` 병행 구축:
  - `lernReportByOrd` 는 `paperIdx == "1"` 일 때만 활성 (`exposeLernReport` 플래그)
  - `ObjectMapper` 로 `json` (예: `{"20-22-01": 65, ...}`) 파싱 → `sectionScores`
  - `subm_at = "Y"` 명시 (기존 fallback row 모두 Y 필터링이라 안전)
  - `lernIncludedStdtIds` Set 으로 중복 방지
- 누락 학생 중 위 fallback 에 안 잡힌 N-only 학생을 추가 query 호출로 보강:
  - `selectClassStudentsSubmStatusFromOtherClasses` 호출 → submAt 별 학생 row 회수
  - lernIncludedStdtIds 에 없는 학생만 추가, `sectionScores={}`, `subm_at=submAt` 으로 row 생성
- `resultMap.put("lernReportByOrd", lernReportByOrd)` (paperIdx=1 한정)

### 2) 매퍼 인터페이스
- `backend/src/main/java/com/vs/meta/api/dgnss/mapper/DgnssMapper.java`
- 추가 메서드:
  - `List<Map<String, Object>> selectClassStudentsSubmStatusFromOtherClasses(Map<String, Object> param)`

### 3) 매퍼 SQL
- `backend/src/main/resources/mapper/dgnss/DgnssMapper.xml`
- 신규 SQL: `selectClassStudentsSubmStatusFromOtherClasses`
  - 본문: `SELECT b1.stdt_id, MAX(b1.subm_at) AS submAt FROM tb_dgnss_info a1 INNER JOIN tb_dgnss_result_info b1 ON a1.id = b1.dgnss_id WHERE a1.cla_id <> #{claId} AND a1.paper_idx = #{paperIdx} AND a1.ord_no = #{ordNo} AND a1.dgnss_at = 'N' AND b1.stdt_id IN (...) GROUP BY b1.stdt_id`
  - `MAX(subm_at)` 로 Y > N 우선순위 (학생이 여러 타학급에 row 가 있을 때 Y 우선)
  - INNER JOIN 만 사용 (answer/answer_report 미참여) → N-status 도 잡힘

> `selectClassLernReport`(XML L2781) 와 `selectClassTotalReportFromOtherClasses`(L2749) 는 변경하지 않음. 기존 동작 그대로.

## 응답 변화

기존 응답:
```json
{
  "1": [ ...학급 평균 row... ],
  "2": [ ... ],
  "lpaByOrd": {
    "1": [ ...per-student LPA row... ]
  }
}
```

신규 응답 (paperIdx=1):
```json
{
  "1": [ ...학급 평균 row (변경 없음)... ],
  "2": [ ... ],
  "lpaByOrd": {
    "1": [ ...per-student LPA row (변경 없음)... ]
  },
  "lernReportByOrd": {
    "1": [
      {
        "stdtId": "abc",
        "source": "IN_CLASS",
        "ord_no": 1,
        "subm_at": "Y",
        "sectionScores": {"20-22-01": 65, "20-22-02": 72}
      },
      {
        "stdtId": "def",
        "source": "OTHER_CLASS",
        "ord_no": 1,
        "subm_at": "Y",
        "sectionScores": {"20-22-01": 58, "20-22-02": 70}
      },
      {
        "stdtId": "xyz",
        "source": "OTHER_CLASS",
        "ord_no": 1,
        "subm_at": "N",
        "sectionScores": {}
      }
    ]
  }
}
```

## 케이스별 동작 표

| 학생 상태 | source | subm_at | sectionScores | 비고 |
|---|---|---|---|---|
| 현재 학급에서 응시·제출 (Y) | `IN_CLASS` | `Y` | 정상 | 기존 동작 |
| 타학급에서 응시·제출 (Y) | `OTHER_CLASS` | `Y` | 정상 | 기존 fallback (`selectClassTotalReportFromOtherClasses`) |
| 타학급에서 응시 중 (N) | `OTHER_CLASS` | `N` | `{}` | **신규** — `selectClassStudentsSubmStatusFromOtherClasses` 로 추가 |
| 어디서도 응시 이력 없음 | (응답에 없음) | — | — | 변경 없음 |
| 현재 학급에 N row 만 있음 | (응답에 없음) | — | — | 기존 정책 (`subm_at='Y'` 필터, 누락 판정 SQL 도 row 존재 시 제외) |

## 빌드 검증
- `./gradlew :backend:compileJava` 성공.

## 주의사항 (추가)
- `lernReportByOrd` 는 paperIdx=1 응답에만 포함. paperIdx=2 (META 자기조절) 는 기존 lpaByOrd + 학급 평균(`"1"`/`"2"`)으로 충분 + 응답 크기 폭증 방지.
- `selectClassTotalReport.json` 컬럼은 MySQL `GROUP_CONCAT` 기본 길이 제한(1024 bytes) 영향을 받을 수 있음 — paperIdx=1 의 SECTION_ID 수 × 평균 30자 기준 보통 안전하나, 매우 많은 섹션 시 truncation 가능. 파싱 실패 시 `sectionScores={}` 로 응답하되 `source`/`subm_at` 표기는 유지.
- `selectClassStudentsSubmStatusFromOtherClasses` 는 일부러 INNER JOIN 만 사용 — answer/answer_report 데이터 없는 N 상태 학생도 잡히도록.
- "다른 그룹" 판정은 `tb_dgnss_info.cla_id <> #{claId}` 단일 기준. 학생이 과거 다른 학교 학급에서 응시한 이력도 모두 잡힘. N:N 모델상 의도된 동작.

---

# 추가 작업 (2026-05-08): /tc/stinfolist 학생 명단 fallback

## 배경
- `GET /api/dgnss/tc/stinfolist` (교사 대시보드 — 학생 목록) 도 동일한 N:N 이슈 발생.
- `type` 파라미터에 따라 9개 매퍼 분기:
  - paperIdx=1: type=1 Reliability, type=2~6 LernType2~6
  - paperIdx=2: type=1 Reliability, type=2 Motivate, type=3 Recognition, type=4 Behavior
- 9개 모두 `WHERE a1.id = #{dgnssId}` 로 단일 학급 진단만 조회 → 다른 학급에서 응시한 학생은 명단에서 누락.

## 추가 정책

### 적용 범위
- 9개 매퍼 모두 동일 패턴으로 fallback 적용.
- "그룹에는 포함되어있지만 현재 학급의 심리검사 row 자체가 없는 학생"만 다른 학급에서 재조회 (기존 doc-2026-05-06 정책 그대로 답습).

### 응답 필드 변화 (최소)
- 학생 row 에 **`source` 필드만 추가** (`IN_CLASS` / `OTHER_CLASS`).
- **`subm_at` 미추가** — 9개 원본 SQL 모두 응답에 `subm_at` 없었기 때문 (기존 응답 호환 우선).
- 그 외 모든 필드(`rowNum`, `stdtId`, `nickname`, `memberNo`, `reaction`, `desirable`, `repeatResponse`, `lpa.*` 5개, 영역별 점수 컬럼들, `gender`)는 원본 그대로 유지.

### 닉네임/번호 표시 정책
- fallback row 의 `nickname`, `memberNo` 는 **현재 학급의 group_member 기준** 으로 표시.
- 신규 fallback SQL 의 group_info JOIN 을 `gi.cla_id = #{claId}` 로 변경하여 보장.
- 의도: 교사가 자기 학급 학생으로 인식하도록 (타학급 닉네임 노출 방지).

### 미제출(N) 학생 미포함
- `b1.subm_at='Y'` 필터 9개 fallback SQL 에 모두 유지 — 기존 정책 일관성.
- 미제출 상태 노출이 필요한 별도 화면이 생기면 그때 확장.

## 구현 변경 파일

### 1) 서비스
- `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssService.java`
- `selectStInfoList` 변경:
  - 기존 type 분기는 그대로 (변경 없음).
  - 분기 후 `applyStInfoListFallback(stInfoList, param, paperIdx, type)` 호출.
  - 결과 list 를 resultMap 에 put. 이후 `enrichLpaTop3` + `moveSectionScoresToScoresMap` 동일 적용.
- 신규 private helper 메서드:
  - `applyStInfoListFallback`: dgnssId → claId/ordNo 추출 → 누락 학생 식별 → IN_CLASS/OTHER_CLASS source 부여 → dedup
  - `dispatchStInfoFallback`: paperIdx + type 조합으로 9개 fallback 매퍼 분기

### 2) 매퍼 인터페이스
- `backend/src/main/java/com/vs/meta/api/dgnss/mapper/DgnssMapper.java`
- 추가 메서드 (총 10개):
  - `selectClaIdByDgnssId(int dgnssId)` — helper, dgnssId → cla_id 단건 조회
  - `selectDgnssAnswerReliabilityFromOtherClasses(Map)`
  - `selectLernType2FromOtherClasses(Map)`
  - `selectLernType3FromOtherClasses(Map)`
  - `selectLernType4FromOtherClasses(Map)`
  - `selectLernType5FromOtherClasses(Map)`
  - `selectLernType6FromOtherClasses(Map)`
  - `selectDgnssAnswerReportMotivateFromOtherClasses(Map)`
  - `selectDgnssAnswerReportRecognitionFromOtherClasses(Map)`
  - `selectDgnssAnswerReportBehaviorFromOtherClasses(Map)`

### 3) 매퍼 SQL
- `backend/src/main/resources/mapper/dgnss/DgnssMapper.xml`
- 신규 SQL 10개 (위 매퍼 메서드 일대일).
- 9개 fallback SQL 변경 포인트 (원본 9개 SQL 대비):
  - SELECT 절: 원본과 동일.
  - JOIN 절: `INNER JOIN group_info gi ON a1.cla_id = gi.cla_id` → `INNER JOIN group_info gi ON gi.cla_id = #{claId}` (현재 학급 멤버 정보로 표시).
  - WHERE 절:
    - 제거: `a1.id = #{dgnssId}`
    - 추가: `a1.cla_id <> #{claId} AND a1.paper_idx = #{paperIdx} AND a1.ord_no = #{ordNo} AND b1.stdt_id IN (...)`
  - 유지: `a1.dgnss_at = 'N'`, `b1.subm_at = 'Y'`, `ORDER BY gm.member_no`.

> 원본 9개 SQL 은 변경 없음. 기존 호출(현재 학급 단일 진단 조회) 동작 그대로.

## type 매트릭스

| type | paperIdx=1 | paperIdx=2 | fallback 매퍼 |
|---|---|---|---|
| 1 | 신뢰도 | 신뢰도 | `selectDgnssAnswerReliabilityFromOtherClasses` |
| 2 | 학습유형2 | 동기전략 | `selectLernType2FromOtherClasses` / `selectDgnssAnswerReportMotivateFromOtherClasses` |
| 3 | 학습유형3 | 인지전략 | `selectLernType3FromOtherClasses` / `selectDgnssAnswerReportRecognitionFromOtherClasses` |
| 4 | 학습유형4 | 행동전략 | `selectLernType4FromOtherClasses` / `selectDgnssAnswerReportBehaviorFromOtherClasses` |
| 5 | 학습유형5 | (해당 없음) | `selectLernType5FromOtherClasses` |
| 6 | 학습유형6 | (해당 없음) | `selectLernType6FromOtherClasses` |

## 응답 예시

기존 응답 (변경 없음 + 신규 source 필드만 추가):

```json
{
  "stInfoList": [
    {"rowNum": 1, "stdtId": "abc", "nickname": "홍길동", "memberNo": 1, ..., "source": "IN_CLASS"},
    {"rowNum": 2, "stdtId": "def", "nickname": "김철수", "memberNo": 2, ..., "source": "IN_CLASS"},
    {"rowNum": 1, "stdtId": "xyz", "nickname": "이영희", "memberNo": 5, ..., "source": "OTHER_CLASS"}
  ],
  "type": 1
}
```

## 케이스별 동작 표

| 학생 상태 | source | 비고 |
|---|---|---|
| 현재 학급에서 응시·제출 (Y) | `IN_CLASS` | 기존 동작 + source 표기 |
| 타학급에서 응시·제출 (Y) | `OTHER_CLASS` | **신규** — 다른 학급 응시 데이터 가져옴, 닉네임/번호는 현재 학급 group_member 기준 |
| 타학급에서 응시 중 (N) | (응답에 없음) | `b1.subm_at='Y'` 필터 유지 |
| 어디서도 응시 이력 없음 | (응답에 없음) | 변경 없음 |
| 현재 학급에 N row 만 있음 | (응답에 없음) | 기존 정책 유지 |

## 안전 장치 (Service)
- `dgnssId <= 0` 또는 `claId 없음` 시 fallback skip — 기존 응답 그대로 (source 도 미부여).
- 누락 학생 0명 → fallback 호출 skip, IN_CLASS source 만 부여.
- fallback 결과 0건 → 무시, 기존 stInfoList 그대로 반환.
- `dispatchStInfoFallback` 매핑되지 않은 (paperIdx, type) 조합 → 빈 리스트 반환.

## ROW_NUMBER 처리
- 9개 원본 SQL 의 `ROW_NUMBER() OVER(ORDER BY gm.member_no) AS rowNum` 보존.
- fallback SQL 도 동일하게 ROW_NUMBER 부여 → 합쳐지면 rowNum 이 두 그룹에서 각각 1..N 으로 중복 가능.
- FE 가 stdtId 기준으로 식별한다면 무해. rowNum 재할당이 필요하면 service 측에서 enrich 단계 추가 가능.

## 빌드 검증
- `./gradlew :backend:compileJava` 성공.

## 주의사항 (추가)
- **`subm_at` 노출 안 함** — 9개 원본 SQL 응답에 없었기 때문 (사용자 지시: "기존에 subm_at값이 없었다면 추가할 필요 없어"). 미제출 학생도 응답 미포함 (기존 정책 일관성).
- 9개 fallback SQL 의 SELECT 절은 원본과 100% 동일 — 추후 원본 컬럼 변경 시 fallback 도 동일하게 동기화 필요.
- 기존 9개 매퍼는 paperIdx=2 type=1 케이스에서도 동일 `selectDgnssAnswerReliability` 사용 — fallback dispatch 도 paperIdx 무관하게 동일 매퍼 호출.
- `applyStInfoListFallback` 은 `enrichLpaTop3` / `moveSectionScoresToScoresMap` **이전** 에 호출됨 — fallback row 도 동일 후처리 적용 보장.
