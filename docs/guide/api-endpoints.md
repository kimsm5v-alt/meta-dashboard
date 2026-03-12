# META 학습심리정서검사 API 레퍼런스

> **용도**: 프론트엔드 API 연동 가이드
> **기준**: AIDT 실제 운영 환경 호출 기준 (2026-02-27)
> **Last Updated**: 2026-02-27

---

## 서버 정보

| 환경 | Base URL |
|------|----------|
| 테스트 | `https://t-vcloudapi.vsaidt.com` |
| 운영 | `https://vcloudapi.vsaidt.com` |

### 인증

- **방식**: JWT Bearer Token
- **헤더**: `Authorization: Bearer {token}`
- **토큰 발급**: Swagger에서 로그인 후 발급
- **토큰 구조** (payload 예시):
  ```json
  {
    "id": "engreal51-t",        // 사용자 ID
    "userSeCd": "T",            // T=교사, S=학생
    "claId": "22d4a5d5d98841cd9e48918c5820900a",  // 학급 ID
    "subject": "math",
    "isProxy": "N"
  }
  ```
- **주의**: 교사용 토큰(`userSeCd: "T"`)과 학생용 토큰(`userSeCd: "S"`)이 별도로 필요할 수 있음

### 공통 응답 구조

```json
{
  "success": true,
  "resultMessage": "...",
  "resultCode": 200,
  "paramData": { /* 요청 파라미터 에코백 */ },
  "resultData": { /* 실제 데이터 */ },
  "sTime": "2026-02-27 20:28:23.779",
  "eTime": "2026-02-27 20:28:23.865",
  "hash": "...",
  "currentTime": "..."
}
```

---

## 주의사항 (규격서 vs 실제 차이점)

### 엔드포인트 동작 현황 (2026-02-27 테스트 기준)

| 엔드포인트 | 문서 | 실제 테스트 | 비고 |
|-----------|------|------------|------|
| `/etc/meta/tc/list` | 권장 | ❌ 404 | 교사용 JWT로 테스트 |
| `/etc/meta/tc/info` | 구버전 | ✅ 동작 | 교사용 JWT로 동작 확인 |
| `/etc/meta/stnt/list` | 권장 | ❌ 404 | 교사용 JWT로 테스트 |
| `/etc/meta/st/info` | 구버전 | ✅ 200 (빈 배열) | 교사용 JWT로 동작, **학생에게 검사 할당 안됨** |

### 주요 주의사항

- 규격서(정의서)에는 구버전 엔드포인트가 적혀 있는 경우가 많음
- 스웨거에는 중복 엔드포인트 쌍이 존재 (예: `/etc/meta/tc/info`와 `/etc/meta/tc/list`가 동일 operationId)
- **실제 테스트 결과, 교사 API는 `/tc/info`가 동작, `/tc/list`는 404**
- **학생 API `/st/info`는 200 응답하나 빈 배열 반환 → 학생에게 검사 할당이 필요함 (백엔드 확인 필요)**
- `paperIdx`: 검사지 유형 (`"1"` = 학습종합검사 125문항, `"2"` = META 자기조절학습검사 77문항)
- **본 서비스에서는 `paperIdx="1"` (학습종합검사)만 사용. `paperIdx="2"`는 무시해도 됨.**
- `grade`: 학년군 (`"el"` = 초등, `"mi"` = 중등, `"hi"` = 고등)

---

## 1. 교사 API

### 1-1. 검사 목록 조회

```
GET /etc/meta/tc/info
```

> ⚠️ **실제 테스트 결과 (2026-02-27)**:
> - `/etc/meta/tc/list` → 404 에러
> - `/etc/meta/tc/info` → ✅ 정상 동작
> - 문서에는 `/tc/list` 권장으로 되어 있으나, 실제로는 `/tc/info` 사용 필요

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| claId | string | Y | 학급 ID |
| tcId | string | Y | 교사 ID |
| paperIdx | string | N | 검사지 유형 (미입력 시 전체, `"1"`=학습심리정서, `"2"`=자기조절학습) |

**Response (`resultData`)**
```json
{
  "dgnssInfo": [
    {
      "dgnssId": 1502,           // 검사 ID (PK)
      "paperIdx": "1",           // 검사지 유형
      "ordNo": 1,                // 회차
      "claId": "cebc78e7...",    // 학급 ID
      "tcId": "ssmath15-t",      // 교사 ID
      "dgnssAt": "N",            // 검사 진행 중 여부 ("Y"=진행중, "N"=종료)
      "dgnssStDt": "2025. 11. 20.",  // 검사 시작일
      "dgnssEdDt": "2026. 01. 29.",  // 검사 종료일 (null이면 미종료)
      "stTotalCnt": 10,          // 전체 학생 수
      "stSubmCnt": 2,            // 제출 학생 수
      "notDgnssStartCnt": 0,     // 미시작 학생 수
      "notDgnssStartList": null  // 미시작 학생 목록
    }
  ]
}
```

**대시보드 매핑**: L1 대시보드 - 교사 담당 학급/검사 목록

---

### 1-2. 검사 시작 (생성)

```
GET /etc/meta/tc/start
```

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| claId | string | Y | 학급 ID |
| tcId | string | Y | 교사 ID |
| ordNo | string | Y | 회차 번호 |
| grade | string | Y | 학년군 (`"el"`, `"mi"`, `"hi"`) |
| paperIdx | string | Y | 검사지 유형 (`"1"` 또는 `"2"`) |
| id | integer | N | 기존 검사 ID (재시작 시) |

**Response (`resultData`)**
```json
{
  "dgnssId": 1684,               // 생성된 검사 ID
  "claId": "cebc78e7...",
  "ordNo": 2,
  "dgnssAt": "Y",               // 진행 중
  "dgnssStDt": "2026-02-27 20:28:23",
  "dgnssEdDt": null,
  "stTotalCnt": 10,
  "stSubmCnt": 0
}
```

**대시보드 매핑**: 검사 관리 - 새 검사 생성

---

### 1-3. 검사 종료

```
GET /etc/meta/tc/end
```

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | string | Y | 검사 ID |
| paperIdx | string | N | 검사지 유형 |

**Response (`resultData`)**
```json
{
  "dgnssId": 1502,
  "paperIdx": "1",
  "dgnssAt": "N",                // 종료됨
  "dgnssStDt": "2025-11-20 14:37:25",
  "dgnssEdDt": "2026-02-27 20:44:10",  // 종료 시각 기록됨
  "stSubmCnt": 0,
  "ordNo": 1,
  "claId": "cebc78e7...",
  "tcId": "ssmath15-t",
  "submStdtList": ["ssmath15-s1", "ssmath15-s2"]  // 제출한 학생 목록
}
```

---

### 1-4. 검사 재시작

```
GET /etc/meta/tc/restart
```

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | string | Y | 검사 ID |
| claId | string | Y | 학급 ID |
| grade | string | Y | 학년군 |

**Response (`resultData`)**
```json
{ "result": "ok" }
```

---

### 1-5. 검사 취소

```
GET /etc/meta/tc/cancel
```

> 검사 데이터가 삭제됨. 되돌릴 수 없음.

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | string | Y | 검사 ID |

**Response (`resultData`)**: `null`

---

### 1-6. 검사 상세 조회

```
GET /etc/meta/tc/detail
```

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | string | Y | 검사 ID |

**Response (`resultData`)**
```json
{
  "dgnssId": 1502,
  "paperIdx": "1",
  "ordNo": 1,
  "num": 1,
  "dgnssAt": "N",
  "dgnssStDt": "2025. 11. 20.",
  "dgnssEdDt": "2026. 01. 29.",
  "stTotalCnt": 10,
  "stSubmCnt": 2,
  "dgnssText": null,              // 교사가 저장한 메모
  "notSubmStdtId": "ssmath15-s3, ssmath15-s4, ...",   // 미제출 학생 ID (콤마 구분)
  "notSubmStdtName": "3번 최하율, 4번 김서아, ..."     // 미제출 학생 이름
}
```

**대시보드 매핑**: L2 대시보드 - 검사 메타 정보 (기간, 제출 현황)

---

### 1-7. 미제출 학생 목록

```
GET /etc/meta/tc/notsubm
```

> ⚠️ **실제 테스트 결과 (2026-03-01)**:
> - `/etc/meta/tc/notsubm/list` → ❌ 404 에러
> - `/etc/meta/tc/notsubm` → ✅ 동작
> - **현재 사용 엔드포인트**: `/etc/meta/tc/notsubm`

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | string | Y | 검사 ID |

**Response (`resultData`)**: 배열
```json
[
  { "stdtId": "ssmath15-s3" },
  { "stdtId": "ssmath15-s4" }
]
```

---

### 1-8. 대시보드 학생 목록 (신뢰도/전략별)

```
GET /etc/meta/tc/stinfolist
```

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | string | Y | 검사 ID |
| paperIdx | string | Y | 검사지 유형 |
| type | string | Y | 조회 유형 (`1`=신뢰도, `2`=동기전략, `3`=인지전략, `4`=행동전략, `5`=기타) |

**Response (`resultData`)**
```json
{
  "type": 1,
  "stInfoList": [
    {
      "stdtId": "ssmath15-s1",
      "answerIdx": 16412,         // 답안 인덱스 (PDF 다운로드 등에 사용)
      "rowNum": 1,
      "gender": "남자",
      "reason": "미래를 위해서",    // 학습 이유
      "reaction": "양호",          // 반응 신뢰도
      "repeatResponse": "N",      // 반복 응답 여부 ("Y"=있음 → 주의 필요)
      "desirable": "양호",         // 바람직성 척도
      "styTime": "1시간 미만",      // 학습 시간
      "styPer": "보통",            // 학습 노력
      "satisPer": "보통",          // 만족도
      "cnsl": "가족"               // 상담 대상
    }
  ]
}
```

**프론트엔드 매핑**:
| API 필드 | 프론트엔드 | 설명 |
|----------|-----------|------|
| `stdtId` | `Student.id` | 학생 ID |
| `rowNum` | `Student.number` | 출석번호 |
| `answerIdx` | - | T점수 조회용 키 |
| `reaction` | `reliabilityWarnings` | "주의"면 ['반응일관성'] 추가 |
| `desirable` | `reliabilityWarnings` | "주의"면 ['사회적바람직성'] 추가 |
| `repeatResponse` | `reliabilityWarnings` | "Y"면 ['연속동일반응'] 추가 |

**대시보드 매핑**: L2 대시보드 - 학급 학생 목록 + 신뢰도 정보

---

### 1-9. 상담/지도 필요 학생

```
GET /etc/meta/tc/need
```

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | string | Y | 검사 ID |
| paperIdx | string | Y | 검사지 유형 |

**Response (`resultData`)**
```json
{
  "reaction": [],                    // 반응 신뢰도 문제 학생
  "repeatResponse": [                // 반복 응답 학생
    { "num": 2, "stdtId": "ssmath15-s2" }
  ],
  "desirable": [],                   // 바람직성 문제 학생
  "etcInfo": {                       // 섹션별 주의 필요 학생 (SECTION_ID → 학생 배열)
    "10-22-01-01-03-0": [
      { "num": 2, "stdtId": "ssmath15-s2" }
    ],
    "10-22-01-02-01-0": [
      { "num": 2, "stdtId": "ssmath15-s2" }
    ]
  }
}
```

**대시보드 매핑**: L2 대시보드 - 상담/지도 필요 학생 목록

---

### 1-10. 종합 분석 (학급 평균)

```
GET /etc/meta/tc/analysis
```

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| claId | string | Y | 학급 ID |
| paperIdx | string | Y | 검사지 유형 |
| ordNo | string | Y | 조회할 회차 |

**Response (`resultData`)**: 회차별 객체 (키: 회차 번호 문자열)
```json
{
  "1": [   // 1회차 결과
    {
      "ord_no": 1,
      "SECTION_ID": "10-22-01-01-0-0",   // 섹션 코드 (계층 구조)
      "SECTION_NM": "긍정적 자아",         // 섹션명
      "DEPTH": 4,                          // 깊이 (4=중분류, 5=소분류)
      "tScore": 46,                        // T점수 (학급 평균)
      "id": 1502                           // 검사 ID
    }
    // ... 약 49개 섹션
  ]
}
```

> **SECTION_ID 체계**: `10-22-{대분류}-{중분류}-{소분류}-0` 형태
> - DEPTH 4: 중분류 (소분류 코드 = `0`)
> - DEPTH 5: 소분류

**대시보드 매핑**: L2/L2.5 대시보드 - 학급 전체 평균 T점수

---

### 1-11. 교사 메모 저장

```
GET /etc/meta/tc/text/save
```

> GET이지만 데이터를 저장하는 API

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | string | Y | 검사 ID |
| dgnssText | string | Y | 저장할 텍스트 |

**Response (`resultData`)**
```json
{ "result": "ok" }
```

---

## 2. 학생 API

> ⚠️ **중요 (2026-02-27 테스트 결과)**:
> - `/etc/meta/stnt/list` → 404 에러
> - `/etc/meta/st/info` → ✅ 200 응답, 그러나 **빈 배열 반환** (`resultData: []`)
>
> **분석**: API는 동작하지만 학생에게 검사가 할당되지 않은 상태.
> 교사가 `/tc/start`로 검사 생성 후 학생에게 자동 할당이 안되는 것으로 보임.
>
> **확인 필요 사항**:
> 1. 교사가 검사 생성 후 학생에게 자동 할당되는지?
> 2. 별도 학생 할당 API가 있는지? (예: `/tc/assign/student`)
> 3. 학생 ID 형식 (`engreal51-s1`)이 올바른지?

### 2-1. 검사 목록 조회

```
GET /etc/meta/stnt/list
```

> ⚠️ **실제 테스트 결과 (2026-02-27)**:
> - `/etc/meta/stnt/list` → 404 에러
> - `/etc/meta/st/info` → ✅ 200 응답, 빈 배열 반환
> - **현재 사용 엔드포인트**: `/etc/meta/st/info`
> - **문제**: 학생에게 검사 할당이 안됨 (빈 배열) → 백엔드 확인 필요

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| claId | string | Y | 학급 ID |
| stdtId | string | Y | 학생 ID |

**Response (`resultData`)**: 배열
```json
[
  {
    "dgnssId": 1502,              // 검사 ID
    "dgnssResultId": 16412,       // 학생별 결과 ID (★ 검사 시작/답안 입력/분석에 필요)
    "paperIdx": "1",
    "ordNo": 1,
    "dgnssAt": "N",               // 검사 진행 상태
    "submAt": "Y",                // 제출 여부
    "submDt": "2026. 01. 29.",    // 제출일
    "eakAt": "Y"                  // EAK 여부 (결과 생성 완료)
  }
]
```

**핵심**: 이 API로 `dgnssResultId`를 획득해야 검사 시작/답안 저장/분석 가능

---

### 2-2. 검사 시작 (문항 로드)

```
GET /etc/meta/st/start
```

> ⚠️ **실제 테스트 결과 (2026-02-28)**:
> - `/etc/meta/stnt/start/update` → ❌ 404
> - `/etc/meta/st/start` → ✅ 동작
> - **현재 사용 엔드포인트**: `/etc/meta/st/start`

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssResultId | string | Y | 학생 결과 ID (`/etc/meta/stnt/list`에서 획득) |
| paperIdx | string | Y | 검사지 유형 |
| page | string | Y | 페이지 번호 (0부터) |
| size | string | Y | 페이지 크기 (보통 `"20"`) |

**Response (`resultData`)**
```json
{
  "omrIdx": 23749,                // OMR 인덱스 (★ 답안 입력에 필요)
  "stAnsCnt": 1,                  // 이미 답한 문항 수
  "dgnssQuesList": [
    {
      "NO": 1,                    // 문항 번호
      "QESITM_NM": "나는 배우는 내용에 따라 적절한 학습 방법을 선택한다.",
      "answer": "1",              // 기존 답변 (빈 문자열이면 미답)
      "fullCount": 125            // 전체 문항 수
    }
    // ... 페이지 크기만큼
  ],
  "page": {
    "size": 20,
    "totalElements": 125,
    "totalPages": 7,
    "number": 0                   // 현재 페이지
  }
}
```

---

### 2-3. 검사 새로하기 (답안 초기화)

```
GET /etc/meta/st/new
```

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssResultId | string | Y | 학생 결과 ID |
| paperIdx | string | Y | 검사지 유형 |
| page | string | Y | 페이지 번호 |
| size | string | Y | 페이지 크기 |

**Response**: 2-2와 동일 구조 (새 `omrIdx` 발급, `answer` 필드 없음)

---

### 2-4. 답안 저장

```
POST /etc/meta/st/answer
```

> ⚠️ **실제 테스트 결과 (2026-02-28)**:
> - `/etc/meta/stnt/answer/save` → ❌ 404
> - `/etc/meta/st/answer` → ✅ 동작
> - **현재 사용 엔드포인트**: `/etc/meta/st/answer`

**Request (Body - JSON)**
```json
{
  "omrIdx": 23749,    // OMR 인덱스 (검사 시작에서 받은 값)
  "no": 1,            // 문항 번호
  "answer": "1"       // 답변 (1~5 리커트 척도)
}
```

**Response (`resultData`)**: `1` (성공 시)

---

### 2-5. 검사 제출

```
POST /etc/meta/st/submit
```

**Request (Body - JSON)**
```json
{
  "dgnssResultId": 18401,     // 학생 결과 ID
  "paperIdx": "1"             // 검사지 유형 (규격서에는 없지만 실제 호출에 포함)
}
```

**Response (`resultData`)**
```json
{ "submit": true }
```

---

### 2-6. 개인 종합 분석

```
GET /etc/meta/st/total/analysis
```

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| stdtId | string | Y | 학생 ID |
| paperIdx | string | Y | 검사지 유형 |
| ordNo | string | Y | 조회할 회차 |

**Response (`resultData`)**: 회차별 객체
```json
{
  "1": [  // 1회차
    {
      "ord_no": 1,
      "SECTION_ID": "10-22-01-01-0-0",
      "SECTION_NM": "긍정적 자아",
      "DEPTH": 4,
      "tScore": 46.3,                  // 개인 T점수 (소수점 포함)
      "dgnssResultId": 16412,
      "reaction": "양호",
      "repeatResponse": "N",
      "desirable": "양호"
    }
    // ... 약 49개 섹션
  ],
  "2": [ ... ]  // 2회차 (있으면)
}
```

> 교사용 `/tc/analysis`와 차이점:
> - 개인 T점수 (소수점 1자리)
> - `dgnssResultId`, `reaction`, `repeatResponse`, `desirable` 필드 추가

**대시보드 매핑**: L3 대시보드 - 학생 개별 38개 T점수

---

## 3. PDF 관련 API

### 3-1. PDF 다운로드 대상 조회

```
GET /etc/meta/pdf/search
```

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | string | Y | 검사 ID |
| type | string | N | `"1"`=교사용, `"2"`=학생 전체 |

**Response (`resultData`)**
```json
{
  "cnt": 2,
  "data": [
    { "userType": "S", "userId": "ssmath15-s1", "answerIdx": 16412 },
    { "userType": "S", "userId": "ssmath15-s2", "answerIdx": 16413 }
  ]
}
```

---

### 3-2. PDF 다운로드 (교사용/학생용)

```
POST /etc/meta/pdf
```

**Request (Body - JSON)**

**교사용 보고서:**
```json
{
  "userId": "ssmath15-t",
  "userType": "T",
  "dgnssId": 1502,
  "ordNo": 1,
  "token": "",
  "accessId": "ssmath15-t",
  "apiDomain": "https://gw.aidtclass.com/math/v1/vlmsapi",
  "apiVersion": "2.4",
  "protectYn": "Y"
}
```

**학생용 보고서** (교사가 학생 보고서 조회 또는 학생 본인 다운로드):
```json
{
  "userId": "ssmath15-s1",       // 학생 ID
  "userType": "S",
  "answerIdx": 16412,             // ★ dgnssId 대신 answerIdx 사용
  "ordNo": 1,
  "token": "",
  "accessId": "ssmath15-t",       // 요청자 ID
  "apiDomain": "https://gw.aidtclass.com/math/v1/vlmsapi",
  "apiVersion": "2.4",
  "protectYn": "Y"
}
```

**Response (`resultData`)**
```json
{
  "url": "/files/nas/engl/20260227/ssmath15-t_20260227202955(c52b96fbe3fc43c2b08c65d0e94d15f8).pdf"
}
```

---

### 3-3. 검사 결과 일괄 다운로드 (ZIP)

```
GET /etc/meta/dgnss-download-all
```

**Request (Query Params)**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | string | Y | 검사 ID |
| type | string | N | 다운로드 유형 |
| jwtToken | string | Y | JWT 토큰 |
| token | string | N | VLMS 토큰 |
| accessId | string | N | 접속 ID |
| apiDomain | string | N | API 도메인 |
| apiVersion | string | N | API 버전 |

**Response**: `application/octet-stream` (바이너리 파일)

---

### 3-4. 요약본 PDF 생성

```
POST /etc/meta/summary/pdf
```

**Request (Body - JSON)**
```json
{
  "answerIdx": 16413,
  "type": "2"
}
```

**Response (`resultData`)**
```json
{
  "summaryUrl": "/files/nas/engl/20260227/ssmath15-s2_summary_20260227203757(...).pdf"
}
```

---

## 4. 엔드포인트 매핑 요약 (문서 vs 실제 테스트)

### 실제 테스트 결과 (2026-02-27)

| 엔드포인트 | 문서 권장 | 실제 동작 | 사용 토큰 | 비고 |
|-----------|----------|----------|----------|------|
| `/etc/meta/tc/info` | 구버전 | ✅ 동작 | 교사용 JWT | **실제 사용** |
| `/etc/meta/tc/list` | 신버전 | ❌ 404 | 교사용 JWT | 문서와 다름 |
| `/etc/meta/tc/notsubm` | 구버전 | ✅ 동작 | 교사용 JWT | **실제 사용** |
| `/etc/meta/tc/notsubm/list` | 신버전 | ❌ 404 | 교사용 JWT | 문서와 다름 |
| `/etc/meta/stnt/list` | 신버전 | ❌ 404 | 교사용 JWT | 사용 불가 |
| `/etc/meta/st/info` | 구버전 | ✅ 200 (빈 배열) | 교사용 JWT | **실제 사용**, 학생 할당 필요 |
| `/etc/meta/stnt/start/update` | 신버전 | ❌ 404 | - | 사용 불가 |
| `/etc/meta/st/start` | 구버전 | ✅ 동작 | - | **실제 사용** |
| `/etc/meta/stnt/answer/save` | 신버전 | ❌ 404 | - | 사용 불가 |
| `/etc/meta/st/answer` | 구버전 | ✅ 동작 | - | **실제 사용** |

### 문서 기준 매핑 (참고용)

| 문서 권장 엔드포인트 | 구버전 | 실제 동작 | 비고 |
|---------------------|------|----------|------|
| `/etc/meta/tc/list` | `/etc/meta/tc/info` | ✅ 구버전 | 교사 검사 목록 |
| `/etc/meta/tc/notsubm/list` | `/etc/meta/tc/notsubm` | ✅ 구버전 | 미제출 목록 |
| `/etc/meta/stnt/list` | `/etc/meta/st/info` | ✅ 구버전 | 학생 검사 목록 |
| `/etc/meta/stnt/start/update` | `/etc/meta/st/start` | ✅ 구버전 | 학생 검사 시작 |
| `/etc/meta/stnt/answer/save` | `/etc/meta/st/answer` | ✅ 구버전 | 답안 저장 |

---

## 5. 핵심 ID 흐름도

```
[교사 검사 시작]
    └→ dgnssId (검사 ID) 발급
         │
         ├→ [학생 목록 조회] /etc/meta/stnt/list
         │     └→ dgnssResultId (학생별 결과 ID) 획득
         │          │
         │          ├→ [검사 시작] /etc/meta/st/start
         │          │     └→ omrIdx (OMR 인덱스) 발급
         │          │          └→ [답안 저장] /etc/meta/st/answer  (omrIdx + no + answer)
         │          │
         │          ├→ [제출] /etc/meta/st/submit  (dgnssResultId)
         │          │
         │          └→ [개인 분석] /etc/meta/st/total/analysis  (stdtId + paperIdx + ordNo)
         │
         ├→ [학급 분석] /etc/meta/tc/analysis  (claId + paperIdx + ordNo)
         │
         ├→ [PDF 대상 조회] /etc/meta/pdf/search  (dgnssId)
         │     └→ answerIdx 획득
         │          └→ [PDF 다운로드] /etc/meta/pdf  (answerIdx or dgnssId)
         │
         └→ [검사 종료] /etc/meta/tc/end  (dgnssId)
```

---

## 6. SECTION_ID 구조 (검사 결과 해석용)

```
10-22-{대영역}-{중분류}-{소분류}-0

대영역:
  01 = 동기전략 (긍정적 자아, 대인관계능력)
  02 = 인지전략 (메타인지, 학습기술, 지지적 관계)
  03 = 방해요인 (학업스트레스, 학업관계 스트레스, 학습 방해물)
  04 = 학업적응 (학업열의, 성장력)
  05 = 학업부적응 (학업소진)

DEPTH 4 = 중분류 (소분류 코드가 0)
DEPTH 5 = 소분류
```

### 전체 섹션 목록 (paperIdx="1" 기준)

| SECTION_ID | DEPTH | 섹션명 | 상위 |
|-----------|-------|--------|------|
| 10-22-01-01-0-0 | 4 | 긍정적 자아 | 동기전략 |
| 10-22-01-01-01-0 | 5 | 자아존중감 | 긍정적 자아 |
| 10-22-01-01-02-0 | 5 | 자기효능감 | 긍정적 자아 |
| 10-22-01-01-03-0 | 5 | 성장마인드셋 | 긍정적 자아 |
| 10-22-01-02-0-0 | 4 | 대인관계능력 | 동기전략 |
| 10-22-01-02-01-0 | 5 | 자기정서인식 | 대인관계능력 |
| 10-22-01-02-02-0 | 5 | 자기정서조절 | 대인관계능력 |
| 10-22-01-02-03-0 | 5 | 타인정서인식 | 대인관계능력 |
| 10-22-01-02-04-0 | 5 | 타인공감능력 | 대인관계능력 |
| 10-22-02-01-0-0 | 4 | 메타인지 | 인지전략 |
| 10-22-02-01-01-0 | 5 | 계획능력 | 메타인지 |
| 10-22-02-01-02-0 | 5 | 점검능력 | 메타인지 |
| 10-22-02-01-03-0 | 5 | 조절능력 | 메타인지 |
| 10-22-02-02-0-0 | 4 | 학습기술 | 인지전략 |
| 10-22-02-02-01-0 | 5 | 공부환경 | 학습기술 |
| 10-22-02-02-02-0 | 5 | 시간관리 | 학습기술 |
| 10-22-02-02-03-0 | 5 | 수업태도 | 학습기술 |
| 10-22-02-02-04-0 | 5 | 노트하기 | 학습기술 |
| 10-22-02-02-05-0 | 5 | 시험준비 | 학습기술 |
| 10-22-02-03-0-0 | 4 | 지지적 관계 | 인지전략 |
| 10-22-02-03-01-0 | 5 | 부모 의사소통 | 지지적 관계 |
| 10-22-02-03-02-0 | 5 | 부모 학업지지 | 지지적 관계 |
| 10-22-02-03-03-0 | 5 | 친구 정서지지 | 지지적 관계 |
| 10-22-02-03-04-0 | 5 | 교사 정서지지 | 지지적 관계 |
| 10-22-03-01-0-0 | 4 | 학업스트레스 | 방해요인 |
| 10-22-03-01-01-0 | 5 | 성적부담 | 학업스트레스 |
| 10-22-03-01-02-0 | 5 | 공부부담 | 학업스트레스 |
| 10-22-03-01-03-0 | 5 | 수업부담 | 학업스트레스 |
| 10-22-03-02-0-0 | 4 | 학업관계 스트레스 | 방해요인 |
| 10-22-03-02-01-0 | 5 | 부모 성적압력 | 학업관계 스트레스 |
| 10-22-03-02-02-0 | 5 | 부모 공부부담 | 학업관계 스트레스 |
| 10-22-03-02-03-0 | 5 | 친구 공부비교 | 학업관계 스트레스 |
| 10-22-03-02-04-0 | 5 | 교사 성적압력 | 학업관계 스트레스 |
| 10-22-03-02-05-0 | 5 | 교사 수업부담 | 학업관계 스트레스 |
| 10-22-03-03-0-0 | 4 | 학습 방해물 | 방해요인 |
| 10-22-03-03-01-0 | 5 | 스마트폰 의존 | 학습 방해물 |
| 10-22-03-03-02-0 | 5 | 게임 과몰입 | 학습 방해물 |
| 10-22-04-01-0-0 | 4 | 학업열의 | 학업적응 |
| 10-22-04-01-01-0 | 5 | 활기 | 학업열의 |
| 10-22-04-01-02-0 | 5 | 몰두 | 학업열의 |
| 10-22-04-01-03-0 | 5 | 의미감 | 학업열의 |
| 10-22-04-02-0-0 | 4 | 성장력 | 학업적응 |
| 10-22-04-02-01-0 | 5 | 자율성 | 성장력 |
| 10-22-04-02-02-0 | 5 | 유능성 | 성장력 |
| 10-22-04-02-03-0 | 5 | 관계성 | 성장력 |
| 10-22-05-01-0-0 | 4 | 학업소진 | 학업부적응 |
| 10-22-05-01-01-0 | 5 | 고갈 | 학업소진 |
| 10-22-05-01-02-0 | 5 | 무능감 | 학업소진 |
| 10-22-05-01-03-0 | 5 | 반감-냉소 | 학업소진 |

---

## 7. 대시보드 페이지별 API 매핑

### L1 - 교사 전체 반 대시보드

```
/dashboard
```

| 기능 | API |
|------|-----|
| 담당 학급 목록 | `GET /etc/meta/tc/list` |

### L2 - 반 대시보드

```
/dashboard/class/:classId
```

| 기능 | API |
|------|-----|
| 검사 상세 정보 | `GET /etc/meta/tc/detail` |
| 학생 목록 + 신뢰도 | `GET /etc/meta/tc/stinfolist` |
| 학급 평균 T점수 | `GET /etc/meta/tc/analysis` |
| 관심 필요 학생 | `GET /etc/meta/tc/need` |

### L2.5 - 학급 특성 상세 분석

```
/dashboard/class/:classId/analysis
```

| 기능 | API |
|------|-----|
| 학급 평균 T점수 (38개) | `GET /etc/meta/tc/analysis` |

### L3 - 학생 대시보드

```
/dashboard/class/:classId/student/:studentId
```

| 기능 | API |
|------|-----|
| 학생 38개 T점수 | `GET /etc/meta/st/total/analysis` |

### 검사 관리

```
/assessment
```

| 기능 | API |
|------|-----|
| 검사 시작 (생성) | `GET /etc/meta/tc/start` |
| 검사 목록 조회 | `GET /etc/meta/tc/list` |
| 검사 종료 | `GET /etc/meta/tc/end` |
| 검사 재시작 | `GET /etc/meta/tc/restart` |
| 검사 취소 | `GET /etc/meta/tc/cancel` |

### 학생 검사 응시

```
/exam/:code
```

| 기능 | API |
|------|-----|
| 검사 목록 조회 (dgnssResultId 획득) | `GET /etc/meta/stnt/list` |
| 문항 로드 | `GET /etc/meta/st/start` |
| 답안 저장 | `POST /etc/meta/st/answer` |
| 답안 초기화 | `GET /etc/meta/st/new` |
| 검사 제출 | `POST /etc/meta/st/submit` |

---

## 8. 에러 처리

### 에러 코드

| 코드 | 설명 | 대응 |
|------|------|------|
| 200 | 성공 | - |
| 400 | 잘못된 요청 | 파라미터 확인 |
| 401 | 인증 실패 | JWT 토큰 재발급 |
| 403 | 권한 없음 | 해당 검사 접근 권한 확인 |
| 404 | 엔드포인트 없음 | 엔드포인트 확인, 또는 권한 문제일 수 있음 |
| 500 | 서버 오류 | 재시도 또는 관리자 문의 |

---

## 9. 프론트엔드 구현 현황

### 환경 변수 (.env)

```bash
# API 사용 여부 (true: 백엔드 API, false: Mock 데이터)
VITE_USE_API=true

# API Base URL (비워두면 Vite 프록시 사용)
VITE_API_BASE_URL=

# JWT 토큰 (Swagger에서 발급)
VITE_JWT_TOKEN=eyJhbGciOiJIUzM4NCJ9...
```

### 서비스 파일 현황

| 파일 | 역할 | 사용 엔드포인트 | 상태 |
|------|------|----------------|------|
| `assessmentService.ts` | 교사용 검사 관리 | `/tc/info` | ✅ 동작 |
| `examService.ts` | 학생용 검사 응시 | `/st/info` | ✅ 200 응답, 빈 배열 (학생 할당 필요) |

### Vite 프록시 설정 (vite.config.ts)

```typescript
proxy: {
  '/etc/meta': {
    target: 'https://t-vcloudapi.vsaidt.com',
    changeOrigin: true,
    secure: true,
  },
}
```

### 테스트용 ID

```typescript
// AssessmentPage.tsx
const TEST_TC_ID = 'engreal51-t';
const TEST_CLA_ID = '22d4a5d5d98841cd9e48918c5820900a';
```

---

## 10. 백엔드 확인 필요 사항

### 🔴 Critical (학생 검사 응시 기능 블로킹)

1. **학생-검사 할당 프로세스** ⭐ 최우선
   - `/etc/meta/st/info` API는 200 응답하지만 **빈 배열 반환** (`resultData: []`)
   - 교사가 `/tc/start`로 검사 생성 후 학생에게 **자동 할당이 안되는 것으로 보임**
   - 별도 학생 할당 API가 있는지? (예: `/tc/assign/student`, `/tc/stnt/add` 등)

2. **학생 ID 형식**
   - `engreal51-s1` 형식이 올바른지?
   - 학생이 해당 `claId`(`22d4a5d5d98841cd9e48918c5820900a`) 학급에 등록되어 있는지?

### 🟢 해결됨

3. **학생 API 엔드포인트**
   - `/etc/meta/stnt/list` → ❌ 404
   - `/etc/meta/st/info` → ✅ 200 (현재 사용 중)

### 🟡 Medium

4. **엔드포인트 정리**
   - `/tc/list` vs `/tc/info` 중 어떤 것이 실제 운영 엔드포인트인지?

---

## 11. 참고

- Swagger: `{Base URL}/swagger-ui.html`
- 백엔드 상세 가이드: [backend-api-guide.md](./backend-api-guide.md)
