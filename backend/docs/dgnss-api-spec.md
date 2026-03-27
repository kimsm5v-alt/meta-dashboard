# 학습심리정서검사 API 연동 규격서

> 최종 수정일: 2026-03-19

## 개요

학습심리정서검사(META 자기조절학습, 학습종합검사) 관련 API 규격서입니다.

### 기본 정보

| 항목 | 값 |
|------|-----|
| Base URL | `{서버주소}` |
| Content-Type | `application/json` |
| 인증 방식 | JWT Token (Header: `Authorization: Bearer {token}`) |

### 공통 응답 형식

```json
{
    "success": true,
    "resultMessage": "성공 메시지",
    "resultCode": 200,
    "paramData": { /* 요청 파라미터 */ },
    "resultData": { /* 응답 데이터 */ },
    "currentTime": "2025-04-07 16:40:20"
}
```

### 검사 종류 (paperIdx)

| 값 | 설명 |
|----|------|
| 1 | 학습종합검사 |
| 2 | META 자기조절학습검사 |

### 학년 정보 (grade)

| 값 | 설명 |
|----|------|
| el | 초등 |
| mi | 중등 |
| hi | 고등 |

---

## 교사용 API

### 1. 학습심리정서검사 목록 조회

교사가 자신의 학급에서 진행한 심리검사 목록을 조회합니다. 학습종합검사와 META 자기조절학습검사 모두 함께 전달됩니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/info` 또는 `/api/dgnss/tc/list` |
| Method | `GET` |

#### Request Parameters (Query String)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | claId | String | O | 학급 ID | |
| 2 | tcId | String | O | 교사 ID | |
| 3 | paperIdx | Integer | O | 심리검사 종류 | 1 이상으로 전달 |

#### Request Example

```
GET /api/dgnss/tc/info?claId=6e0602a00aaf46019f0f690c467ec16d&tcId=metamitest1-t&paperIdx=1
```

#### Response Fields (resultData.dgnssInfo[])

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | dgnssId | Integer | 심리검사 ID | |
| 2 | paperIdx | String | 심리검사 종류 | 1: 학습종합검사, 2: META자기조절학습검사 |
| 3 | ordNo | Integer | 회차 정보 | 1: 1회차, 2: 2회차 |
| 4 | stSubmCnt | Integer | 제출 인원 | |
| 5 | stTotalCnt | Integer | 총 인원 | |
| 6 | notDgnssStartCnt | Integer | 검사지 배부를 못받은 인원수 | |
| 7 | notDgnssStartList | String | 검사지 배부를 못받은 인원 | 콤마 구분자로 학생 ID 전달 |
| 8 | dgnssAt | String | 검사 상태 여부 | Y: 평가중, N: 평가 종료 |
| 9 | tcId | String | 교사 ID | |
| 10 | dgnssStDt | String | 검사 시작 일시 | YYYY. MM. DD. 형식 |
| 11 | dgnssEdDt | String | 응시 종료 일시 | YYYY. MM. DD. 형식 |

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(선생님)학습심리정서검사 목록 조회",
  "resultCode": 200,
  "paramData": {
    "paperIdx": "1",
    "tcId": "metamitest1-t",
    "claId": "6e0602a00aaf46019f0f690c467ec16d"
  },
  "resultData": {
    "dgnssInfo": [
      {
        "dgnssId": 385,
        "notDgnssStartCnt": 0,
        "paperIdx": "2",
        "stSubmCnt": 30,
        "ordNo": 1,
        "notDgnssStartList": null,
        "claId": "6e0602a00aaf46019f0f690c467ec16d",
        "dgnssStDt": "2024. 11. 26.",
        "stTotalCnt": 30,
        "dgnssAt": "N",
        "tcId": "metamitest1-t",
        "dgnssEdDt": "2025. 02. 03."
      }
    ]
  },
  "currentTime": "2025-04-07 16:40:20"
}
```

---

### 2. 학습심리정서검사 시작

교사가 심리검사를 시작하고 학생 데이터를 생성합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/start` |
| Method | `POST` |

#### Request Parameters (Body)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | claId | String | O | 학급 ID | |
| 2 | tcId | String | O | 교사 ID | |
| 3 | ordNo | Integer | O | 회차 정보 | 1 또는 2 |
| 4 | grade | String | O | 학년 정보 | el: 초등, mi: 중등, hi: 고등 |
| 5 | paperIdx | Integer | O | 심리검사 종류 | 1: 학습종합검사, 2: META자기조절학습검사 |

#### Request Example

```json
{
  "claId": "lectureTest",
  "tcId": "mathbe2-t",
  "ordNo": 1,
  "grade": "mi",
  "paperIdx": 1
}
```

#### Response Fields (resultData)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | dgnssId | Integer | 생성된 심리검사 ID | |
| 2 | stSubmCnt | Integer | 제출 인원 | 시작 시 0 |
| 3 | ordNo | Integer | 회차 | |
| 4 | claId | String | 학급 ID | |
| 5 | dgnssStDt | String | 검사 시작 일시 | |
| 6 | stTotalCnt | Integer | 총 인원 | |
| 7 | dgnssAt | String | 검사 상태 | Y: 평가중 |
| 8 | dgnssEdDt | String | 응시 종료 일시 | 시작 시 null |

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(선생님)학습심리정서검사 시작",
  "resultCode": 200,
  "paramData": {
    "paperIdx": "1",
    "ordNo": "1",
    "tcId": "mathbe2-t",
    "claId": "lectureTest",
    "grade": "mi"
  },
  "resultData": {
    "dgnssId": 294,
    "stSubmCnt": 0,
    "ordNo": 1,
    "claId": "lectureTest",
    "dgnssStDt": "2024-12-16 13:43:19",
    "stTotalCnt": 5,
    "dgnssAt": "Y",
    "dgnssEdDt": null
  },
  "currentTime": "2024-12-16 13:42:45"
}
```

---

### 3. 학습심리정서검사 종료

교사가 심리검사를 종료합니다. 모든 문제를 풀었지만 제출 버튼을 누르지 않은 학생도 채점에 포함됩니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/end` |
| Method | `POST` |

#### Request Parameters (Body)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssId | Integer | O | 심리검사 ID | |

#### Request Example

```json
{
  "dgnssId": 184
}
```

#### Response Fields (resultData)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | submStdtList | String[] | 제출 인원 목록 | 제출한 학생들 ID를 배열로 전달 |

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(선생님)학습심리정서검사 종료",
  "resultCode": 200,
  "paramData": {
    "dgnssId": "184"
  },
  "resultData": {
    "dgnssId": 294,
    "stSubmCnt": 2,
    "ordNo": 1,
    "claId": "lectureTest",
    "dgnssStDt": "2024-12-16 13:43:19",
    "submStdtList": ["mathbe2-s1", "mathbe2-s2"],
    "dgnssAt": "N",
    "dgnssEdDt": "2024-12-16 14:30:00"
  },
  "currentTime": "2024-12-16 13:42:45"
}
```

---

### 4. 학습심리정서검사 취소

교사가 심리검사를 취소하고 관련 데이터를 삭제합니다. `/tc/start`를 다시 호출해야 시작 가능합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/cancel` |
| Method | `POST` |

#### Request Parameters (Body)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssId | Integer | O | 심리검사 ID | |

#### Request Example

```json
{
  "dgnssId": 1084
}
```

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(선생님)학습심리정서검사 취소",
  "resultCode": 200,
  "paramData": {
    "dgnssId": "1084"
  },
  "resultData": null,
  "currentTime": "2024-12-16 13:42:45"
}
```

---

### 5. 학습심리정서검사 재시작

종료된 심리검사를 재시작합니다. 학급 내 새로 들어온 학생들에게 추가 시험지를 배부합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/restart` |
| Method | `POST` |

#### Request Parameters (Body)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssId | Integer | O | 심리검사 ID | |
| 2 | claId | String | O | 학급 ID | |
| 3 | grade | String | O | 학년 정보 | el: 초등, mi: 중등, hi: 고등 |

#### Request Example

```json
{
  "dgnssId": 1084,
  "claId": "eb1460dce8fc42889862e9a460beb4a0",
  "grade": "el"
}
```

#### Response Fields (resultData)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | result | String | 결과 여부 | 성공: "ok" |

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(선생님)학습심리정서검사 재시작",
  "resultCode": 200,
  "paramData": {
    "dgnssId": "1084",
    "claId": "eb1460dce8fc42889862e9a460beb4a0",
    "grade": "el"
  },
  "resultData": {
    "result": "ok"
  },
  "currentTime": "2024-12-16 13:42:45"
}
```

---

### 6. 학습심리정서검사 텍스트 저장

심리검사에 대한 교사 코멘트를 저장합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/text/save` |
| Method | `POST` |

#### Request Parameters (Body)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssId | Integer | O | 심리검사 ID | |
| 2 | dgnssText | String | O | 심리검사 텍스트 | 최대 500자 제한 (프론트에서도 처리 필요) |

#### Request Example

```json
{
  "dgnssId": 184,
  "dgnssText": "텍스트 내용"
}
```

#### Response Fields (resultData)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | result | String | 성공 여부 | "ok" |

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(선생님)학습심리정서검사 텍스트 저장",
  "resultCode": 200,
  "paramData": {
    "dgnssId": "184",
    "dgnssText": "텍스트"
  },
  "resultData": {
    "result": "ok"
  },
  "currentTime": "2024-12-16 13:42:45"
}
```

---

### 7. 학습심리정서검사 미제출 인원 목록

심리검사를 제출하지 않은 학생 목록을 조회합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/notsubm` 또는 `/api/dgnss/tc/notsubm/list` |
| Method | `GET` |

#### Request Parameters (Query String)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssId | Integer | O | 심리검사 ID | |

#### Request Example

```
GET /api/dgnss/tc/notsubm?dgnssId=294
```

#### Response Fields (resultData[])

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | stdtId | String | 학생 ID | |

#### Response Example

```json
{
  "success": true,
  "resultMessage": "학습심리정서검사 미제출 인원 목록",
  "resultCode": 200,
  "paramData": {
    "dgnssId": "294"
  },
  "resultData": [
    { "stdtId": "mathbe2-s2" },
    { "stdtId": "mathbe2-s3" },
    { "stdtId": "mathbe2-s4" },
    { "stdtId": "mathbe2-s5" },
    { "stdtId": "mathbe2-s6" }
  ],
  "currentTime": "2025-04-14 13:25:20"
}
```

---

### 8. 학습심리정서검사 상세 내용 조회

심리검사의 상세 정보를 조회합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/detail` |
| Method | `GET` |

#### Request Parameters (Query String)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssId | Integer | O | 심리검사 ID | |

#### Request Example

```
GET /api/dgnss/tc/detail?dgnssId=317
```

#### Response Fields (resultData)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | dgnssId | Integer | 심리검사 ID | |
| 2 | paperIdx | String | 심리검사 종류 | |
| 3 | stSubmCnt | Integer | 제출 인원 | |
| 4 | ordNo | Integer | 회차 | |
| 5 | dgnssText | String | 텍스트 | |
| 6 | notSubmStdtId | String | 미제출 인원 | 콤마 구분자로 학생 ID 전달 |
| 7 | claId | String | 학급 ID | |
| 8 | dgnssStDt | String | 검사 시작 일시 | |
| 9 | stTotalCnt | Integer | 총 인원 | |
| 10 | dgnssAt | String | 검사 상태 | |
| 11 | dgnssEdDt | String | 응시 종료 일시 | |

#### Response Example

```json
{
  "success": true,
  "resultMessage": "학습심리정서검사 상세 내용",
  "resultCode": 200,
  "paramData": {
    "dgnssId": "294"
  },
  "resultData": {
    "dgnssId": 294,
    "paperIdx": "1",
    "stSubmCnt": 1,
    "ordNo": 1,
    "dgnssText": null,
    "notSubmStdtId": "mathbe2-s2,mathbe2-s3,mathbe2-s4,mathbe2-s5,mathbe2-s6",
    "claId": "lectureTest",
    "dgnssStDt": "2024. 12. 16.",
    "stTotalCnt": 6,
    "dgnssAt": "N",
    "dgnssEdDt": "2024. 12. 19."
  },
  "currentTime": "2025-04-14 13:28:44"
}
```

---

### 9. 대시보드 - 학습심리검사 종합 분석

학급 전체의 심리검사 종합 분석 결과를 조회합니다. 회차별 List로 전달됩니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/analysis` |
| Method | `GET` |

#### Request Parameters (Query String)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | claId | String | O | 클래스 ID | |
| 2 | paperIdx | String | O | 심리검사 종류 | 1: 학습종합검사, 2: META자기조절학습검사 |
| 3 | ordNo | String | O | 현재 조회하는 회차 | 1회차: 1, 2회차: 2 |

#### Request Example

```
GET /api/dgnss/tc/analysis?claId=lectureTest&paperIdx=1
```

#### Response Fields (resultData.{회차}[])

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | id | Integer | 심리검사 ID | |
| 2 | ord_no | Integer | 회차 | 1 또는 2 |
| 3 | SECTION_ID | String | 영역 ID | |
| 4 | SECTION_NM | String | 영역 이름 | |
| 5 | DEPTH | Integer | 뎁스 | |
| 6 | tScore | Number | 영역별 점수 | |

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(교사) 대시보드 - 종합 분석",
  "resultCode": 200,
  "paramData": {
    "claId": "lectureTest",
    "paperIdx": "1"
  },
  "resultData": {
    "1": [
      {
        "ord_no": 1,
        "SECTION_NM": "긍정적 자아",
        "id": 294,
        "tScore": 35.9,
        "DEPTH": 4,
        "SECTION_ID": "10-22-01-01-0-0"
      },
      {
        "ord_no": 1,
        "SECTION_NM": "자아존중감",
        "id": 294,
        "tScore": 41.9,
        "DEPTH": 5,
        "SECTION_ID": "10-22-01-01-01-0"
      }
    ],
    "2": []
  },
  "currentTime": "2024-12-16 13:42:45"
}
```

#### SECTION_ID 별 코드 (학습종합검사)

| SECTION_ID | 영역명 |
|------------|--------|
| 10-22-01-01-0-0 | 긍정적 자아 |
| 10-22-01-01-01-0 | 자아존중감 |
| 10-22-01-01-02-0 | 자기효능감 |
| 10-22-01-01-03-0 | 성장마인드셋 |
| 10-22-01-02-0-0 | 대인관계능력 |
| 10-22-01-02-01-0 | 자기정서인식 |
| 10-22-01-02-02-0 | 자기정서조절 |
| 10-22-01-02-03-0 | 타인정서인식 |
| 10-22-01-02-04-0 | 타인공감능력 |
| 10-22-02-01-0-0 | 메타인지 |
| 10-22-02-01-01-0 | 계획능력 |
| 10-22-02-01-02-0 | 점검능력 |
| 10-22-02-01-03-0 | 조절능력 |
| 10-22-02-02-0-0 | 학습기술 |
| 10-22-02-02-01-0 | 공부환경 |
| 10-22-02-02-02-0 | 시간관리 |
| 10-22-02-02-03-0 | 수업태도 |
| 10-22-02-02-04-0 | 노트하기 |
| 10-22-02-02-05-0 | 시험준비 |
| 10-22-02-03-0-0 | 지지적 관계 |
| 10-22-02-03-01-0 | 부모 의사소통 |
| 10-22-02-03-02-0 | 부모 학업지지 |
| 10-22-02-03-03-0 | 친구 정서지지 |
| 10-22-02-03-04-0 | 교사 정서지지 |
| 10-22-03-01-0-0 | 학업스트레스 |
| 10-22-03-01-01-0 | 성적부담 |
| 10-22-03-01-02-0 | 공부부담 |
| 10-22-03-01-03-0 | 수업부담 |
| 10-22-03-02-0-0 | 학업관계 스트레스 |
| 10-22-03-02-01-0 | 부모 성적압력 |
| 10-22-03-02-02-0 | 부모 공부부담 |
| 10-22-03-02-03-0 | 친구 공부비교 |
| 10-22-03-02-04-0 | 교사 성적압력 |
| 10-22-03-02-05-0 | 교사 수업부담 |
| 10-22-03-03-0-0 | 학습 방해물 |
| 10-22-03-03-01-0 | 스마트폰 의존 |
| 10-22-03-03-02-0 | 게임 과몰입 |
| 10-22-04-01-0-0 | 학업열의 |
| 10-22-04-01-01-0 | 활기 |
| 10-22-04-01-02-0 | 몰두 |
| 10-22-04-01-03-0 | 의미감 |
| 10-22-04-02-0-0 | 성장력 |
| 10-22-04-02-01-0 | 자율성 |
| 10-22-04-02-02-0 | 유능성 |
| 10-22-04-02-03-0 | 관계성 |
| 10-22-05-01-0-0 | 학업소진 |
| 10-22-05-01-01-0 | 고갈 |
| 10-22-05-01-02-0 | 무능감 |
| 10-22-05-01-03-0 | 반감-냉소 |

---

### 10. 대시보드 - 학생 목록 조회

심리검사에 참여한 학생 목록과 점수를 조회합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/stinfolist` |
| Method | `GET` |

#### Request Parameters (Query String)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssId | Integer | O | 심리검사 ID | |
| 2 | paperIdx | Integer | O | 심리검사 종류 | 1: 학습종합검사, 2: META자기조절학습검사 |
| 3 | type | Integer | O | 타입 | 아래 표 참조 |

#### type 파라미터 설명

**META 자기조절학습검사 (paperIdx=2)**
| type | 설명 |
|------|------|
| 1 | 신뢰도 |
| 2 | 동기전략 |
| 3 | 인지전략 |
| 4 | 행동전략 |

**학습종합검사 (paperIdx=1)**
| type | 설명 |
|------|------|
| 1 | 신뢰도 |
| 2 | 긍정적 자아 & 대인관계 |
| 3 | 메타인지 & 학습기술 |
| 4 | 지지적 관계 & 학업열의 & 성장력 |
| 5 | 학업스트레스 & 학습방해물 |
| 6 | 학업관계스트레스 & 학업소진 |

#### Request Example

```
GET /api/dgnss/tc/stinfolist?dgnssId=294&paperIdx=1&type=6
```

#### Response Fields (resultData)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | type | Integer | 조회한 타입 | |
| 2 | stInfoList | Array | 학생 정보 목록 | |

#### Response Fields (resultData.stInfoList[])

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | stdtId | String | 학생 ID | |
| 2 | gender | String | 성별 | |
| 3 | desirable | String | 사회적 바람직성 | |
| 4 | reaction | String | 반응 일관성 | |
| 5 | {SECTION_ID} | Number | 영역별 T점수 | KEY: SECTION_ID, VALUE: T_SCORE |
| 6 | lpaClassId | String | LPA 클래스 ID | 예: Class1~Class6 |
| 7 | lpaTypeName | String | LPA 유형명 | |
| 8 | lpaConfidence | Number | LPA 신뢰도(%) | 소수점 가능 |
| 9 | lpaStatus | String | LPA 처리 상태 | COMPLETED / UNSUPPORTED / null |
| 10 | lpaTop1TypeName | String | LPA 1순위 유형명 | |
| 11 | lpaTop1Probability | Number | LPA 1순위 확률(%) | 소수점 1자리 |
| 12 | lpaTop2TypeName | String | LPA 2순위 유형명 | |
| 13 | lpaTop2Probability | Number | LPA 2순위 확률(%) | 소수점 1자리 |
| 14 | lpaTop3TypeName | String | LPA 3순위 유형명 | |
| 15 | lpaTop3Probability | Number | LPA 3순위 확률(%) | 소수점 1자리 |

> `lpaTop1Probability + lpaTop2Probability + lpaTop3Probability = 100.0`

#### Response Example

```json
{
  "success": true,
  "resultMessage": "대시보드 - 학생 목록",
  "resultCode": 200,
  "paramData": {
    "dgnssId": "294",
    "paperIdx": "1",
    "type": "6"
  },
  "resultData": {
    "type": 6,
    "stInfoList": [
      {
        "10-22-05-01-01-0": 26.7,
        "stdtId": "mathbe2-s1",
        "reaction": "주의",
        "gender": "남자",
        "desirable": "양호",
        "lpaClassId": "Class2",
        "lpaTypeName": "안전균형형",
        "lpaConfidence": 78.45,
        "lpaStatus": "COMPLETED",
        "lpaTop1TypeName": "안전균형형",
        "lpaTop1Probability": 78.5,
        "lpaTop2TypeName": "자원소진형",
        "lpaTop2Probability": 15.1,
        "lpaTop3TypeName": "몰입자원풍부형",
        "lpaTop3Probability": 6.4,
        "10-22-05-01-03-0": 44.4,
        "10-22-05-01-0-0": 41.5,
        "10-22-05-01-02-0": 56,
        "10-22-03-02-04-0": 63.9,
        "10-22-03-02-03-0": 49,
        "10-22-03-02-02-0": 61.1,
        "rowNum": 1,
        "10-22-03-02-01-0": 41.8,
        "10-22-03-02-0-0": 55.7,
        "10-22-03-02-05-0": 57.5
      }
    ]
  },
  "currentTime": "2024-12-19 14:18:10"
}
```

---

### 11. 상담 및 지도가 필요한 학생 조회

심리검사 결과, 상담/지도가 필요한 학생 목록을 조회합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/need` |
| Method | `GET` |

#### Request Parameters (Query String)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssId | Integer | O | 심리검사 ID | |
| 2 | paperIdx | Integer | N | 심리검사 종류 | 기본값: 2 |

#### Request Example

```
GET /api/dgnss/tc/need?dgnssId=1088&paperIdx=1
```

---

## 학생용 API

### 12. 학습심리정서검사 목록 조회

학생이 참여 가능한 심리검사 목록을 조회합니다. 학습종합검사와 META 자기조절학습검사 모두 함께 전달됩니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/info` 또는 `/api/dgnss/stnt/list` |
| Method | `GET` |

#### Request Parameters (Query String)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | claId | String | O | 클래스 ID | |
| 2 | stdtId | String | O | 학생 ID | |

#### Request Example

```
GET /api/dgnss/st/info?claId=lectureTest&stdtId=mathbe2-s1
```

#### Response Fields (resultData.dgnssInfo[])

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | dgnssId | Integer | 심리검사 ID | |
| 2 | dgnssResultId | Integer | 심리검사 상세 ID | |
| 3 | paperIdx | String | 심리검사 종류 | |
| 4 | ordNo | Integer | 회차 | |
| 5 | eakAt | String | 검사 시작 여부 | Y: 응시 시작, N: 응시 전 |
| 6 | submAt | String | 검사 제출 여부 | Y: 제출 완료, N: 미제출 |
| 7 | submDt | String | 제출한 날짜 | |
| 8 | dgnssStDt | String | 검사 시작 일시 | |
| 9 | dgnssEdDt | String | 응시 종료 일시 | |
| 10 | dgnssAt | String | 검사 상태 | Y: 평가중, N: 평가 종료 |

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(학생)학습심리정서검사 목록 조회",
  "resultCode": 200,
  "paramData": {
    "claId": "lectureTest",
    "stdtId": "mathbe2-s1"
  },
  "resultData": {
    "dgnssInfo": [
      {
        "dgnssId": 294,
        "dgnssResultId": 1717,
        "paperIdx": "1",
        "ordNo": 1,
        "eakAt": "Y",
        "submAt": "N",
        "submDt": null,
        "dgnssStDt": "2024. 12. 16.",
        "dgnssAt": "Y",
        "dgnssEdDt": null
      }
    ]
  },
  "currentTime": "2024-12-16 14:48:24"
}
```

---

### 13. 학습심리정서검사 시작

학생이 심리검사를 시작합니다. 시작으로 상태값 변경 및 문제목록이 전달됩니다 (default 첫 페이지).

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/start` 또는 `/api/dgnss/stnt/start/update` |
| Method | `POST` |

#### Request Parameters (Body)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssResultId | Integer | O | 심리검사 상세 ID | |
| 2 | paperIdx | Integer | O | 심리검사 종류 | |
| 3 | page | Integer | O | 페이지 번호 | 0부터 시작 |
| 4 | size | Integer | O | 페이지 크기 | 기본값 20 |

#### Request Example

```json
{
  "dgnssResultId": 1717,
  "paperIdx": 1,
  "page": 0,
  "size": 20
}
```

#### Response Fields (resultData)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | omrIdx | Integer | 답안지 ID | |
| 2 | dgnssQuesList | Array | 문제 정보 목록 | |
| 3 | page | Object | 페이지 정보 | |

#### Response Fields (resultData.dgnssQuesList[])

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | NO | Integer | 번호 | |
| 2 | answer | String | 학생이 입력한 답 | |
| 3 | QESITM_NM | String | 질문 | |
| 4 | fullCount | Integer | 총 문항 개수 | 내부 페이징을 위해 필요 |

#### Response Fields (resultData.page)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | size | Integer | 총 사이즈 | 미사용 |
| 2 | totalElements | Integer | 총 문항 개수 | |
| 3 | totalPages | Integer | 총 페이지 수 | 0부터 시작이므로 totalPages-1이 마지막 페이지 |
| 4 | number | Integer | 현재 페이지 | 0부터 시작 |

> **Note**: 종합검사는 120~124번까지 문항을 별도로 구성 필요, 자기조절검사는 73~77번까지 문항을 별도로 구성 필요

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(학생)META 자기조절학습 시작",
  "resultCode": 200,
  "paramData": {
    "paperIdx": "1",
    "page": "0",
    "size": "20",
    "dgnssResultId": "1717"
  },
  "resultData": {
    "omrIdx": 1795,
    "dgnssQuesList": [
      {
        "NO": 1,
        "answer": "",
        "QESITM_NM": "나는 배우는 내용에 따라 적절한 학습 방법을 선택한다.",
        "fullCount": 125
      },
      {
        "NO": 2,
        "answer": "",
        "QESITM_NM": "나는 중요한 문제를 부모님(보호자)과 의논한다.",
        "fullCount": 125
      }
    ],
    "page": {
      "size": 125,
      "totalElements": 125,
      "totalPages": 7,
      "number": 0
    }
  },
  "currentTime": "2024-12-16 14:48:24"
}
```

---

### 14. 심리검사 새로하기

학생이 심리검사를 새로 시작합니다. 변경된 OMR 정보로 전달됩니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/new` |
| Method | `GET` |

#### Request Parameters (Query String)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssResultId | Integer | O | 심리검사 상세 ID | |
| 2 | paperIdx | Integer | N | 심리검사 종류 | 기본값: 0 |
| 3 | page | Integer | N | 페이지 번호 | 기본값: 0 |
| 4 | size | Integer | N | 페이지 크기 | 기본값: 20 |

#### Request Example

```
GET /api/dgnss/st/new?dgnssResultId=1717&paperIdx=1&page=0&size=20
```

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(학생)심리검사 새로하기",
  "resultCode": 200,
  "paramData": {
    "paperIdx": "1",
    "page": "0",
    "size": "20",
    "dgnssResultId": "1717"
  },
  "resultData": {
    "omrIdx": 1800,
    "dgnssQuesList": [
      {
        "NO": 1,
        "answer": "",
        "QESITM_NM": "나는 배우는 내용에 따라 적절한 학습 방법을 선택한다.",
        "fullCount": 125
      }
    ],
    "page": {
      "size": 125,
      "totalElements": 125,
      "totalPages": 7,
      "number": 0
    }
  },
  "currentTime": "2024-12-16 14:48:24"
}
```

---

### 15. 답 입력

학생이 문제에 대한 답을 입력합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/answer` 또는 `/api/dgnss/stnt/answer/save` |
| Method | `POST` |

#### Request Parameters (Body)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | omrIdx | Integer | O | OMR ID | |
| 2 | no | Integer | O | 문항 번호 | |
| 3 | answer | Integer | O | 답 | |

#### Request Example

```json
{
  "omrIdx": 184,
  "no": 12,
  "answer": 1
}
```

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(학생)문제 풀이",
  "resultCode": 200,
  "paramData": {
    "omrIdx": "184",
    "no": 12,
    "answer": 1
  },
  "resultData": 1,
  "currentTime": "2024-12-16 14:48:24"
}
```

---

### 16. 심리검사 제출

학생이 심리검사를 제출합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/submit` |
| Method | `POST` |

#### Request Parameters (Body)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssResultId | Integer | O | 심리검사 상세 ID | |

#### Request Example

```json
{
  "dgnssResultId": 1717
}
```

#### Response Example

```json
{
  "success": true,
  "resultMessage": "심리검사 제출",
  "resultCode": 200,
  "paramData": {
    "dgnssResultId": "1717"
  },
  "resultData": {
    "result": "ok"
  },
  "currentTime": "2024-12-16 14:48:24"
}
```

---

### 17. 학습심리정서검사 결과보기

학생의 심리검사 결과를 조회합니다.

- `dgnssResultId` 전달 시: 해당 결과가 속한 단일 회차만 조회
- `stdtId` 전달 시: 학생 기준으로 진행된 회차를 모두 조회
- 응답은 `stUserInfo`와 회차별 키 `"1"`, `"2"` 구조로 반환
- 2회차가 없으면 `"2"`는 내려가지 않을 수 있음
- `paperIdx`는 연동 시 `1` 또는 `2`를 반드시 명시해서 전달

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/analysis` |
| Method | `GET` |

#### Request Parameters (Query String)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssResultId | String | X | 심리검사 상세 ID | 있으면 해당 회차만 조회 |
| 2 | stdtId | String | X | 학생 ID | 학생 기준 회차 조회 시 사용 |
| 3 | paperIdx | String | X | 심리검사 종류 | 연동 시 `1` 또는 `2`를 반드시 명시 전달 |
| 4 | ordNo | String | X | 기준 회차 | `stdtId` 기준 조회 시 메타 정보 조회용, 기본값: 1 |

> `dgnssResultId` 또는 (`stdtId` + `paperIdx`)를 전달해야 합니다.
> `paperIdx`는 구현 히스토리상 기본값이 존재하더라도, 연동 규격상 필수값으로 간주합니다.
> `ordNo`는 선택값입니다.

#### Request Example

```
GET /api/dgnss/st/analysis?dgnssResultId=1717&paperIdx=1
```

```
GET /api/dgnss/st/analysis?stdtId=rrmath016-s1&paperIdx=2
```

#### Response Fields (resultData)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | stUserInfo | Object | 학생 정보 | |
| 2 | `"1"` | Array | 1회차 검사 결과 정보 | 없을 수 있음 |
| 3 | `"2"` | Array | 2회차 검사 결과 정보 | 없을 수 있음 |

#### Response Fields (resultData.stUserInfo)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | stdtId | String | 학생 ID | |
| 2 | eakStDt | String | 제출 일시 | |
| 3 | ordNo | Integer | 기준 회차 | `dgnssResultId` 조회 시 해당 회차 |
| 4 | paperIdx | Integer | 심리검사 종류 | |
| 5 | gender | String | 성별 | |
| 6 | grade | String | 학년 정보 | |
| 7 | classCd | String | 반 정보 | |
| 8 | dgnssResultId | Integer | 심리검사 상세 ID | |

#### Response Fields (resultData."1"[], resultData."2"[])

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | dgnssResultId | Integer | 심리검사 상세 ID | |
| 2 | SECTION_ID | String | 섹션 ID | |
| 3 | SECTION_NM | String | 섹션 이름 | |
| 4 | DEPTH | Integer | 섹션 깊이 | |
| 5 | tScore | Number | 점수 | |
| 6 | ord_no | Integer | 회차 | |
| 7 | reaction | String | 반응성 | |
| 8 | desirable | String | 바람직성 | |
| 9 | repeatResponse | String | 반복응답 여부 | |
| 10 | lpaClassId | String | LPA 클래스 ID | 예: Class1~Class6 |
| 11 | lpaTypeName | String | LPA 유형명 | |
| 12 | lpaConfidence | Number | LPA 신뢰도(%) | 소수점 가능 |
| 13 | lpaStatus | String | LPA 처리 상태 | COMPLETED / UNSUPPORTED / null |
| 14 | lpaTop1TypeName | String | LPA 1순위 유형명 | |
| 15 | lpaTop1Probability | Number | LPA 1순위 확률(%) | 소수점 1자리 |
| 16 | lpaTop2TypeName | String | LPA 2순위 유형명 | |
| 17 | lpaTop2Probability | Number | LPA 2순위 확률(%) | 소수점 1자리 |
| 18 | lpaTop3TypeName | String | LPA 3순위 유형명 | |
| 19 | lpaTop3Probability | Number | LPA 3순위 확률(%) | 소수점 1자리 |

> `lpaTop1Probability + lpaTop2Probability + lpaTop3Probability = 100.0`

#### Response Example

```json
{
  "success": true,
  "resultMessage": "(학생)학습심리정서검사 결과보기",
  "resultCode": 200,
  "paramData": {
    "stdtId": "rrmath016-s1",
    "paperIdx": "1"
  },
  "resultData": {
    "stUserInfo": {
      "stdtId": "rrmath016-s1",
      "eakStDt": "2026-03-18 10:00:00",
      "ordNo": 1,
      "paperIdx": 1,
      "gender": "남자",
      "grade": "중1",
      "classCd": "1반",
      "dgnssResultId": 12509
    },
    "1": [
      {
        "dgnssResultId": 12509,
        "SECTION_ID": "10-22-01-01-01-0",
        "SECTION_NM": "자아존중감",
        "DEPTH": 5,
        "tScore": 55,
        "ord_no": 1,
        "reaction": null,
        "desirable": null,
        "repeatResponse": "N",
        "lpaClassId": "Class2",
        "lpaTypeName": "안전균형형",
        "lpaConfidence": 78.45,
        "lpaStatus": "COMPLETED",
        "lpaTop1TypeName": "안전균형형",
        "lpaTop1Probability": 78.5,
        "lpaTop2TypeName": "자원소진형",
        "lpaTop2Probability": 15.1,
        "lpaTop3TypeName": "몰입자원풍부형",
        "lpaTop3Probability": 6.4
      }
    ]
  },
  "currentTime": "2026-03-19 10:00:00"
}
```

---

## 공통 API

### 18. PDF 다운로드

심리검사 결과 PDF를 다운로드합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/pdf` |
| Method | `POST` |

#### Request Parameters (Body)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | userId | String | O | 사용자 ID | |
| 2 | userType | String | O | 사용자 유형 | S: 학생, T: 교사 |
| 3 | dgnssId | Integer | O | 심리검사 ID | |
| 4 | answerIdx | Integer | O | 답안 인덱스 | |
| 5 | ordNo | Integer | O | 회차 | |

#### Request Example

```json
{
  "userId": "mathbe2-s1",
  "userType": "S",
  "dgnssId": 184,
  "answerIdx": 1161,
  "ordNo": 1
}
```

---

### 19. 일괄다운로드 전 학생 조회

PDF 일괄 다운로드 전 대상 학생 목록을 조회합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/pdf/search` |
| Method | `GET` |

#### Request Parameters (Query String)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | dgnssId | Integer | O | 심리검사 ID | |
| 2 | type | String | N | PDF 타입 | 기본값: 1 |

#### Request Example

```
GET /api/dgnss/pdf/search?dgnssId=28
```

#### Response Fields (resultData)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | cnt | Integer | 생성해야하는 학생 수 | PDF 생성을 실시해야하는 학생 수 |
| 2 | data | Array | 학생 상세 데이터 | PDF 생성을 위해 필요한 정보 전달 |

#### Response Fields (resultData.data[])

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | answerIdx | Integer | 학생 응답 데이터 | |
| 2 | userId | String | 사용자 ID | |
| 3 | userType | String | 사용자 타입 | S: 학생 |

#### Response Example

```json
{
  "success": true,
  "resultMessage": "학습심리정서검사 일괄다운로드 전 학생 조회",
  "resultCode": 200,
  "paramData": {
    "dgnssId": "28"
  },
  "resultData": {
    "data": [
      {
        "userType": "S",
        "userId": "re22mma33-s1",
        "answerIdx": 131
      },
      {
        "userType": "S",
        "userId": "re22mma33-s2",
        "answerIdx": 132
      }
    ],
    "cnt": 5
  },
  "currentTime": "2025-10-23 11:40:37"
}
```

---

### 20. 일괄 다운로드

심리검사 결과 PDF를 일괄 다운로드합니다. 새 창으로 호출하면 ZIP 파일이 다운로드됩니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/dgnss-download-all` |
| Method | `GET` |
| Response Content-Type | `application/octet-stream` |

#### Request Parameters (Query String)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | jwtToken | String | O | JWT 토큰 | JWT 토큰 값 |
| 2 | dgnssId | String | O | 심리검사 ID | |
| 3 | type | String | X | PDF 타입 | 1: 기존 PDF (default), 2: 요약본 PDF |

#### Request Example

```
GET /api/dgnss/dgnss-download-all?jwtToken=xxxxx&dgnssId=184&type=1
```

> **Note**: 새 창으로 호출 시 ZIP 파일이 다운로드됩니다. Response가 따로 없습니다.

---

### 21. 심리검사 요약본 PDF 업로드

심리검사 요약본 PDF를 생성하고 CDN에 업로드 후 URL을 전달합니다.

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/summary/pdf` |
| Method | `POST` |

#### Request Parameters (Body)

| NO | 파라미터 | 타입 | 필수 | 설명 | 비고 |
|----|----------|------|------|------|------|
| 1 | answerIdx | Integer | O | 답안 인덱스 | |

#### Request Example

```json
{
  "answerIdx": 12679
}
```

#### Response Fields (resultData)

| NO | 필드 | 타입 | 설명 | 비고 |
|----|------|------|------|------|
| 1 | summaryUrl | String | 요약본 PDF URL | |

#### Response Example

```json
{
  "success": true,
  "resultMessage": "심리검사 요약본 PDF 업로드",
  "resultCode": 200,
  "paramData": {
    "answerIdx": 12679
  },
  "resultData": {
    "summaryUrl": "/files/nas/engl/20260107/vivaclass-s-gochkm2510803-5013_summary_20260107104002(2fb8b55684e7420d929bd6f42f430720).pdf"
  },
  "currentTime": "2026-01-07 10:40:02"
}
```

---

## 에러 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 99 | 실패 |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-03-18 | 1.0 | 최초 작성 |
| 2026-03-18 | 1.1 | Response Example 추가 |
| 2026-03-18 | 1.2 | 패키지/클래스명 etc→dgnss 변경, 엔드포인트 /api/meta→/api/dgnss 변경 |
| 2026-03-18 | 1.3 | xlsx 파일 기준 파라미터 상세 설명 추가 |
| 2026-03-19 | 1.4 | 학생 결과 조회 API를 `/api/dgnss/st/analysis` 단일 엔드포인트로 통합, `dgnssResultId`/`stdtId` 기준 조회 규칙 및 응답 구조 반영 |
