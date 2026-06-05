# DGNSS 다학급 fallback — 프론트 개발 가이드 (2026-05-08)

> **대상**: 프론트엔드 개발 담당자
> **목적**: 학생-그룹 N:N 구조 대응으로 백엔드 API 응답이 일부 변경되었습니다. 이 문서는 FE 가 추가/변경된 필드를 어떻게 처리해야 하는지 정리합니다.
> **관련 백엔드 정책 문서**: `tc-analysis-lpa-fallback-policy-2026-05-06.md`

---

## 1. 배경 — 왜 변경이 필요했나

기존 시스템에서 **학생은 여러 그룹(학급)에 동시 소속** 가능하지만, 심리검사(`tb_dgnss_result_info`) 데이터는 학급 단위로만 쌓입니다.

**문제 상황**:
- 학생 A 가 그룹1 + 그룹2 양쪽 멤버
- 1회차를 그룹1 에서 응시 → 그룹1 에만 result 데이터 존재
- 그룹2 교사가 학급 분석 화면을 열면 → 학생 A 데이터 안 보임 (다른 학급에서 응시했기 때문)
- 그룹2 에서 2회차 출제 시도 → 학생 A 가 누락됨

**해결**: 현재 학급에 데이터가 없는 학생은 **다른 학급의 응시 데이터를 fallback 으로 보강**. 이때 각 row 가 어느 학급 데이터인지 FE 가 식별할 수 있도록 `source` 필드 부여.

---

## 2. 공통 개념 — 응답에 등장하는 신규 enum 값

### 2.1 `source` 필드 (학생 row 단위)

| 값 | 의미 | 언제 표시되나 |
|---|---|---|
| `IN_CLASS` | 현재 학급에서 응시한 데이터 | 기본 — 학생이 현재 학급에서 응시·제출했을 때 |
| `OTHER_CLASS` | 다른 학급에서 응시한 데이터 (fallback) | 학생이 현재 학급에 없고 타학급에서 응시했을 때 |

### 2.2 `subm_at` 필드 (제출 상태, `lernReportByOrd` 한정)

| 값 | 의미 |
|---|---|
| `Y` | 제출 완료 |
| `N` | 응시 중 (미제출) — 타학급에서 진행 중인 학생 |

### 2.3 `/tc/start/preview` 의 `status` 값 (학생 row 단위)

| 값 | 의미 | 2회차 출제 가능? |
|---|---|---|
| `ELIGIBLE` | 현재 학급에서 1회차 응시 이력 있음, 타학급 응시 이력 없음 | ✅ |
| `BLOCKED_OTHER_CLASS` | 타학급에서 1회차 응시함 — 현재 학급에서 2회차 불가 | ❌ |
| `NO_HISTORY` | 1회차 응시 이력 없음 | ❌ |

> 백엔드에선 row 단위 status 를 받아 집계해 응답하므로, FE 는 카운트 + `blockedStudents` 리스트만 사용하면 됩니다.

---

## 3. 변경된 API

### 3.1 `GET /api/dgnss/tc/analysis` (교사 종합 분석)

#### 3.1.1 Request — 변경 없음

```
GET /api/dgnss/tc/analysis?claId={claId}&paperIdx={paperIdx}&ordNo={ordNo}
```

#### 3.1.2 Response — 신규 필드 추가 (**기존 필드 변경 없음**)

```json
{
  "resultData": {
    "1": [ ...학급 평균 (기존 그대로)... ],
    "2": [ ...학급 평균 (기존 그대로)... ],

    "lpaByOrd": {
      "1": [
        {
          "stdtId": "abc",
          "source": "IN_CLASS",          // ← 신규
          "lpaClassId": 1,
          "lpaTypeName": "...",
          "lpaConfidence": 0.85,
          "lpaStatus": "ACTIVE",
          "lpaTop1TypeName": "...",
          "lpaTop1Probability": 0.85,
          "lpaTop2TypeName": "...",
          "lpaTop2Probability": 0.10,
          "lpaTop3TypeName": "...",
          "lpaTop3Probability": 0.05
        },
        {
          "stdtId": "def",
          "source": "OTHER_CLASS",       // ← 다른 학급에서 응시한 학생
          ...
        }
      ],
      "2": [ ... ]
    },

    "lernReportByOrd": {                   // ← 신규 (paperIdx=1 일 때만 존재)
      "1": [
        {
          "stdtId": "abc",
          "source": "IN_CLASS",
          "ord_no": 1,
          "subm_at": "Y",                  // 제출 완료
          "sectionScores": {
            "20-22-01": 65,
            "20-22-02": 72,
            ...
          }
        },
        {
          "stdtId": "def",
          "source": "OTHER_CLASS",
          "ord_no": 1,
          "subm_at": "Y",
          "sectionScores": { ... }
        },
        {
          "stdtId": "xyz",
          "source": "OTHER_CLASS",
          "ord_no": 1,
          "subm_at": "N",                  // 타학급에서 응시 중
          "sectionScores": {}              // 빈 객체
        }
      ],
      "2": [ ... ]
    }
  }
}
```

#### 3.1.3 FE 처리 가이드

| 항목 | 처리 방법 |
|---|---|
| `"1"` / `"2"` (학급 평균 차트) | **기존 그대로** 사용 — 변경 없음 |
| `lpaByOrd[ordNo]` 각 row | `source === "OTHER_CLASS"` 면 "다른 학급 응시" 배지/툴팁 표시 권장 |
| `lernReportByOrd` 존재 여부 | paperIdx=1 응답에서만 존재. 없으면 `undefined` 체크 후 무시 |
| `lernReportByOrd[ordNo]` 각 row | `subm_at === "N"` 이면 "응시 중" 상태로 표시, sectionScores 는 빈 객체이므로 점수 차트는 미렌더링 |
| `sectionScores` | `{SECTION_ID: 점수}` map. SECTION_ID 는 `"1"`/`"2"` 의 SECTION_NM 과 매핑 가능 |

> **중요**: paperIdx=2 (META 자기조절) 응답에는 `lernReportByOrd` 가 **포함되지 않습니다**. 학급 평균은 paperIdx=2 의 `"1"`/`"2"` 응답에서 그대로 제공.

---

### 3.2 `GET /api/dgnss/tc/stinfolist` (교사 대시보드 학생 목록)

#### 3.2.1 Request — 변경 없음

```
GET /api/dgnss/tc/stinfolist?dgnssId={dgnssId}&paperIdx={paperIdx}&type={type}&testFlag=N
```

#### 3.2.2 Response — `source` 필드 1개만 추가 (**그 외 모든 기존 필드 변경 없음**)

```json
{
  "resultData": {
    "stInfoList": [
      {
        "rowNum": 1,
        "stdtId": "abc",
        "nickname": "홍길동",
        "memberNo": 1,
        "reaction": "...",
        "desirable": "...",
        "repeatResponse": "N",
        "lpaClassId": 1,
        "lpaTypeName": "...",
        ...
        "gender": "남자",
        "source": "IN_CLASS"              // ← 신규 (only)
      },
      {
        "rowNum": 2,
        "stdtId": "def",
        ...
        "source": "OTHER_CLASS"           // ← 다른 학급에서 응시한 학생
      }
    ],
    "type": 1
  }
}
```

#### 3.2.3 FE 처리 가이드

| 항목 | 처리 방법 |
|---|---|
| 기존 모든 필드 (rowNum, stdtId, nickname, ...) | **변경 없음** — 그대로 사용 |
| `source` | `"OTHER_CLASS"` 면 명단에 "다른 학급 응시" 표기 권장 |
| `nickname` / `memberNo` | OTHER_CLASS 라도 **현재 학급 group_member 기준** 으로 표시됨 (BE 가 보장) — FE 는 별도 처리 불필요 |
| 미제출(`subm_at='N'`) 학생 | 응답에 포함되지 않음 (기존 정책 유지). 응시 중인 다른 학급 학생을 명단에 추가로 노출하지 않음 |
| rowNum 중복 | 현재 학급 row 와 fallback row 가 합쳐지면 `rowNum` 이 중복될 수 있음 — FE 는 `stdtId` 로 식별 권장 |

#### 3.2.4 적용 type 매트릭스

| type | paperIdx=1 | paperIdx=2 | fallback 적용 |
|---|---|---|---|
| 1 | 신뢰도 | 신뢰도 | ✅ |
| 2 | 학습유형2 | 동기전략 | ✅ |
| 3 | 학습유형3 | 인지전략 | ✅ |
| 4 | 학습유형4 | 행동전략 | ✅ |
| 5 | 학습유형5 | (해당 없음) | ✅ (paperIdx=1만) |
| 6 | 학습유형6 | (해당 없음) | ✅ (paperIdx=1만) |

---

## 4. 신규 API

### 4.1 `GET /api/dgnss/tc/start/preview` (2회차 출제 사전 검증)

#### 4.1.1 개요
- **언제 호출하나**: 교사가 **2회차 출제 버튼 클릭 직후**, 실제 `POST /tc/start` 호출 **전**
- **왜 필요한가**:
  - 2회차는 "현재 학급에서 1회차 응시한 학생만" 출제 가능 (`selectEligibleTargetStListForOrd2` 정책)
  - 다른 학급에서 1회차 응시한 학생은 출제 대상에서 제외됨
  - FE 가 사전에 "어떤 학생이 제외되는지" 사용자에게 보여주고 확인받을 수 있도록

> **1회차 출제 시에는 호출 불필요** — 1회차는 분류 검증이 의미 없습니다.

#### 4.1.2 Request

```
GET /api/dgnss/tc/start/preview?claId={claId}&paperIdx={paperIdx}&ordNo=2
```

| 파라미터 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `claId` | string | ✅ | 현재 학급 ID |
| `paperIdx` | int | ✅ | 1: 학습종합검사, 2: META 자기조절 |
| `ordNo` | int | ✅ | 회차 (현재는 2회차 진입 시에만 호출) |

#### 4.1.3 Response — 출제 가능 케이스

```json
{
  "resultData": {
    "canStart": true,
    "totalCount": 15,
    "eligibleCount": 10,
    "blockedOtherClassCount": 3,
    "noHistoryCount": 2,
    "blockedStudents": [
      {"stdtId": "abc", "nickname": "홍길동", "memberNo": 1},
      {"stdtId": "def", "nickname": "김철수", "memberNo": 5},
      {"stdtId": "ghi", "nickname": "이영희", "memberNo": 9}
    ]
  }
}
```

#### 4.1.4 Response — 출제 불가 케이스 (모두 차단)

```json
{
  "resultData": {
    "canStart": false,
    "totalCount": 15,
    "eligibleCount": 0,
    "blockedOtherClassCount": 13,
    "noHistoryCount": 2,
    "blockedStudents": [ ...13명 명단... ]
  }
}
```

#### 4.1.5 응답 필드 정의

| 필드 | 타입 | 설명 |
|---|---|---|
| `canStart` | boolean | `eligibleCount > 0` 이면 true. **false 면 2회차 출제 진행 불가** |
| `totalCount` | int | 현재 학급 group_member 총원 |
| `eligibleCount` | int | 출제 가능 학생 수 (현재 학급 1회차 응시자) |
| `blockedOtherClassCount` | int | 타학급에서 1회차 응시한 학생 수 |
| `noHistoryCount` | int | 1회차 응시 이력 없는 학생 수 |
| `blockedStudents` | array | 타학급 응시자 명단 — `stdtId`, `nickname`, `memberNo` |

> 항상 성립: `totalCount = eligibleCount + blockedOtherClassCount + noHistoryCount`

#### 4.1.6 FE 권장 사용 시나리오

```
[교사가 2회차 출제 버튼 클릭]
    │
    ▼
GET /api/dgnss/tc/start/preview
    │
    ├─ canStart === false
    │   └─ 모달: "2회차 출제 불가
    │              현재 학급 1회차 응시자가 없습니다.
    │              (다른 학급 응시자 N명, 미응시 M명)"
    │      [확인] 버튼만 노출, 출제 진행 중단
    │
    ├─ canStart === true && blockedOtherClassCount > 0
    │   └─ 모달: "다른 학급에서 1회차를 응시한 학생 N명은 제외됩니다.
    │             [블록 학생 명단 리스트 표시]
    │             출제 가능한 학생: M명
    │             계속 진행하시겠습니까?"
    │      [취소] / [계속 출제]
    │      → 확인 시 POST /tc/start 호출
    │
    └─ canStart === true && blockedOtherClassCount === 0
        └─ 모달 없이 바로 POST /tc/start 호출 (또는 확인 모달만)
```

#### 4.1.7 후속 `POST /tc/start` 와의 관계

- **변경 없음**: `POST /tc/start` 의 request/response 는 그대로
- preview 가 통과해도 `/tc/start` 안의 `selectEligibleTargetStListForOrd2` 검증은 backstop 으로 유지 (race condition 대비)
- 만약 preview 통과 후 `/tc/start` 가 실패하면 (사용자 동시 작업 등) 백엔드가 `result: "fail"` + 메시지 반환

---

## 5. 변경 없는 API (참고)

다음 API 들은 fallback 작업과 무관하게 **응답 변경 없음**:

- `POST /api/dgnss/tc/start` — 변경 없음 (단, preview 와 함께 사용 권장)
- `POST /api/dgnss/tc/end`
- `POST /api/dgnss/tc/cancel`
- `POST /api/dgnss/tc/restart`
- `GET /api/dgnss/tc/info`, `/tc/list`
- `GET /api/dgnss/tc/detail` — 추후 fallback 적용 검토 예정
- `GET /api/dgnss/tc/notsubm` — 추후 fallback 적용 검토 예정
- `GET /api/dgnss/tc/class-factor-avg` — 추후 fallback 적용 검토 예정
- `GET /api/dgnss/tc/need`
- 모든 `/st/*` (학생용 endpoint) — 변경 없음
- 모든 `/pdf` 관련 — 변경 없음

---

## 6. 마이그레이션 체크리스트 (FE 작업 항목)

### 6.1 `/tc/analysis` 화면
- [ ] `lpaByOrd[ordNo][].source` 사용 — OTHER_CLASS 학생 시각적 구분 (배지/아이콘)
- [ ] `lernReportByOrd` 신규 필드 활용 가능 여부 검토 (paperIdx=1 한정)
  - [ ] `subm_at === "N"` 학생은 "응시 중" 상태 표시
  - [ ] `sectionScores` 가 `{}` 인 경우 점수 차트 미렌더링
- [ ] paperIdx=2 응답에 `lernReportByOrd` 없음 → undefined 가드

### 6.2 `/tc/stinfolist` 화면
- [ ] `stInfoList[].source` 사용 — OTHER_CLASS 학생 명단에 표기
- [ ] `rowNum` 중복 가능성 인지 — 식별 키로 `stdtId` 사용

### 6.3 2회차 출제 플로우 (신규)
- [ ] 2회차 출제 버튼 핸들러: `GET /tc/start/preview` 호출 추가
- [ ] `canStart === false` 시 모달 + 진행 차단
- [ ] `blockedStudents.length > 0` 시 명단 표시 + 확인 모달
- [ ] 확인 후 기존 `POST /tc/start` 호출 진행
- [ ] 1회차 출제 시에는 preview 호출 **하지 않음**

---

## 7. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-06 | (초기) `/tc/analysis` 의 `lpaByOrd` 에 per-student `source` 신설 — 학생별 다른 학급 응시 표기 |
| 2026-05-08 | `/tc/analysis` 에 `lernReportByOrd` 추가 (paperIdx=1 한정, `subm_at` 포함) |
| 2026-05-08 | `/tc/stinfolist` 각 row 에 `source` 추가 (9개 type 분기 일괄) |
| 2026-05-08 | `GET /tc/start/preview` 신규 API — 2회차 출제 사전 검증 |

---

## 8. 문의

- 백엔드 변경 상세: `tc-analysis-lpa-fallback-policy-2026-05-06.md`
- 정책 / 동작 의문점: 백엔드 담당자 (DGNSS 서비스)
