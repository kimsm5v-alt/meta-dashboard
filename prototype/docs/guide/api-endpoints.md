# 학습심리정서검사 API 레퍼런스

> **용도**: 프론트엔드 API 연동 가이드
> **기준**: DGNSS 마이그레이션 완료 기준 (2026-03-19)
> **Last Updated**: 2026-03-23

---

## 서버 정보

| 환경 | Base URL |
|------|----------|
| 로컬 백엔드 | `http://localhost:8081` |
| 테스트 | `https://t-vcloudapi.vsaidt.com` |
| 운영 | `https://vcloudapi.vsaidt.com` |

### 인증

- **방식**: JWT Bearer Token
- **헤더**: `Authorization: Bearer {token}`
- **토큰 발급**: Swagger에서 로그인 후 발급
- **토큰 구조** (payload 예시):
  ```json
  {
    "id": "engreal51-t",
    "userSeCd": "T",
    "claId": "22d4a5d5d98841cd9e48918c5820900a",
    "subject": "math",
    "isProxy": "N"
  }
  ```

### 공통 응답 구조

```json
{
  "success": true,
  "resultMessage": "성공 메시지",
  "resultCode": 200,
  "paramData": { /* 요청 파라미터 */ },
  "resultData": { /* 응답 데이터 */ },
  "currentTime": "2026-03-23 16:40:20"
}
```

### 검사 종류 (paperIdx)

| 값 | 설명 |
|----|------|
| 1 | 학습종합검사 (125문항) |
| 2 | META 자기조절학습검사 (77문항) |

> **본 서비스에서는 `paperIdx="1"` (학습종합검사)만 사용**

### 학년 정보 (grade)

| 값 | 설명 |
|----|------|
| el | 초등 |
| mi | 중등 |
| hi | 고등 |

---

## 주의사항

### 엔드포인트 변경 (2026-03-19)

**기존 `/etc/meta/*` 엔드포인트는 더 이상 사용하지 않습니다.**

| 기존 (사용 중지) | 신규 (현재 사용) |
|-----------------|-----------------|
| `/etc/meta/tc/*` | `/api/dgnss/tc/*` |
| `/etc/meta/st/*` | `/api/dgnss/st/*` |
| `/etc/meta/stnt/*` | `/api/dgnss/stnt/*` |
| `/etc/meta/pdf/*` | `/api/dgnss/pdf/*` |

### 응답 형식 통일 (2026-03-19)

- `paperIdx=2` 응답이 `paperIdx=1`과 동일한 형식으로 통일됨
- 기존: `motivateInfo`, `recognitionInfo`, `behaviorInfo` 객체 형태
- 신규: `SECTION_ID`, `SECTION_NM`, `tScore` 리스트 형태

---

## 1. 교사 API

### 1-1. 검사 목록 조회

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/info` 또는 `/api/dgnss/tc/list` |
| Method | `GET` |

**Request (Query Params)**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| claId | string | Y | 학급 ID |
| tcId | string | Y | 교사 ID |
| paperIdx | integer | Y | 심리검사 종류 (1 이상으로 전달) |

**Response (`resultData.dgnssInfo[]`)**

```json
{
  "dgnssInfo": [
    {
      "dgnssId": 385,
      "paperIdx": "2",
      "ordNo": 1,
      "claId": "6e0602a00aaf46019f0f690c467ec16d",
      "tcId": "metamitest1-t",
      "dgnssAt": "N",
      "dgnssStDt": "2024. 11. 26.",
      "dgnssEdDt": "2025. 02. 03.",
      "stTotalCnt": 30,
      "stSubmCnt": 30,
      "notDgnssStartCnt": 0,
      "notDgnssStartList": null
    }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| dgnssId | Integer | 심리검사 ID |
| paperIdx | String | 심리검사 종류 |
| ordNo | Integer | 회차 정보 (1: 1회차, 2: 2회차) |
| stSubmCnt | Integer | 제출 인원 |
| stTotalCnt | Integer | 총 인원 |
| notDgnssStartCnt | Integer | 검사지 미배부 인원수 |
| dgnssAt | String | 검사 상태 (Y: 평가중, N: 평가 종료) |
| dgnssStDt | String | 검사 시작 일시 |
| dgnssEdDt | String | 응시 종료 일시 |

---

### 1-2. 검사 시작 (생성)

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/start` |
| Method | `POST` |

**Request (Body)**

```json
{
  "claId": "lectureTest",
  "tcId": "mathbe2-t",
  "ordNo": 1,
  "grade": "mi",
  "paperIdx": 1
}
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| claId | String | Y | 학급 ID |
| tcId | String | Y | 교사 ID |
| ordNo | Integer | Y | 회차 정보 (1 또는 2) |
| grade | String | Y | 학년 정보 (el/mi/hi) |
| paperIdx | Integer | Y | 심리검사 종류 |

**Response (`resultData`)**

```json
{
  "dgnssId": 294,
  "stSubmCnt": 0,
  "ordNo": 1,
  "claId": "lectureTest",
  "dgnssStDt": "2024-12-16 13:43:19",
  "stTotalCnt": 5,
  "dgnssAt": "Y",
  "dgnssEdDt": null
}
```

---

### 1-3. 검사 종료

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/end` |
| Method | `POST` |

**Request (Body)**

```json
{
  "dgnssId": 184
}
```

**Response (`resultData`)**

```json
{
  "dgnssId": 294,
  "stSubmCnt": 2,
  "ordNo": 1,
  "claId": "lectureTest",
  "dgnssStDt": "2024-12-16 13:43:19",
  "submStdtList": ["mathbe2-s1", "mathbe2-s2"],
  "dgnssAt": "N",
  "dgnssEdDt": "2024-12-16 14:30:00"
}
```

---

### 1-4. 검사 취소

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/cancel` |
| Method | `POST` |

> 검사 데이터가 삭제됨. 되돌릴 수 없음. `/tc/start`를 다시 호출해야 시작 가능.

**Request (Body)**

```json
{
  "dgnssId": 1084
}
```

---

### 1-5. 검사 재시작

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/restart` |
| Method | `POST` |

> 종료된 심리검사를 재시작. 학급 내 새로 들어온 학생들에게 추가 시험지를 배부.

**Request (Body)**

```json
{
  "dgnssId": 1084,
  "claId": "eb1460dce8fc42889862e9a460beb4a0",
  "grade": "el"
}
```

**Response (`resultData`)**

```json
{ "result": "ok" }
```

---

### 1-6. 검사 상세 조회

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/detail` |
| Method | `GET` |

**Request (Query Params)**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | Integer | Y | 심리검사 ID |

**Response (`resultData`)**

```json
{
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
}
```

---

### 1-7. 미제출 학생 목록

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/notsubm` 또는 `/api/dgnss/tc/notsubm/list` |
| Method | `GET` |

**Request (Query Params)**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | Integer | Y | 심리검사 ID |

**Response (`resultData[]`)**

```json
[
  { "stdtId": "mathbe2-s2" },
  { "stdtId": "mathbe2-s3" }
]
```

---

### 1-8. 대시보드 학생 목록 (신뢰도/전략별)

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/stinfolist` |
| Method | `GET` |

**Request (Query Params)**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | Integer | Y | 심리검사 ID |
| paperIdx | Integer | Y | 심리검사 종류 |
| type | Integer | Y | 타입 (아래 표 참조) |

**type 파라미터 설명**

| paperIdx | type | 설명 |
|----------|------|------|
| 1 | 1 | 신뢰도 |
| 1 | 2 | 긍정적 자아 & 대인관계 |
| 1 | 3 | 메타인지 & 학습기술 |
| 1 | 4 | 지지적 관계 & 학업열의 & 성장력 |
| 1 | 5 | 학업스트레스 & 학습방해물 |
| 1 | 6 | 학업관계스트레스 & 학업소진 |
| 2 | 1 | 신뢰도 |
| 2 | 2 | 동기전략 |
| 2 | 3 | 인지전략 |
| 2 | 4 | 행동전략 |

**Response (`resultData`)**

```json
{
  "type": 6,
  "stInfoList": [
    {
      "stdtId": "mathbe2-s1",
      "rowNum": 1,
      "gender": "남자",
      "reaction": "주의",
      "desirable": "양호",
      "10-22-05-01-01-0": 26.7,
      "10-22-05-01-02-0": 56,
      "10-22-05-01-03-0": 44.4,
      "10-22-05-01-0-0": 41.5
    }
  ]
}
```

---

### 1-9. 상담/지도 필요 학생

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/need` |
| Method | `GET` |

**Request (Query Params)**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | Integer | Y | 심리검사 ID |
| paperIdx | Integer | N | 심리검사 종류 (기본값: 2) |

---

### 1-10. 종합 분석 (학급 평균)

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/analysis` |
| Method | `GET` |

**Request (Query Params)**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| claId | String | Y | 클래스 ID |
| paperIdx | String | Y | 심리검사 종류 |
| ordNo | String | Y | 현재 조회하는 회차 |

**Response (`resultData`)**

```json
{
  "1": [
    {
      "ord_no": 1,
      "SECTION_NM": "긍정적 자아",
      "id": 294,
      "tScore": 35.9,
      "DEPTH": 4,
      "SECTION_ID": "10-22-01-01-0-0"
    }
  ],
  "2": []
}
```

---

### 1-11. 교사 메모 저장

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/tc/text/save` |
| Method | `POST` |

**Request (Body)**

```json
{
  "dgnssId": 184,
  "dgnssText": "텍스트 내용"
}
```

> 최대 500자 제한 (프론트에서도 처리 필요)

**Response (`resultData`)**

```json
{ "result": "ok" }
```

---

## 2. 학생 API

### 2-1. 검사 목록 조회

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/info` 또는 `/api/dgnss/stnt/list` |
| Method | `GET` |

**Request (Query Params)**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| claId | String | Y | 클래스 ID |
| stdtId | String | Y | 학생 ID |

**Response (`resultData.dgnssInfo[]`)**

```json
{
  "dgnssInfo": [
    {
      "dgnssId": 294,
      "dgnssResultId": 1717,
      "paperIdx": "1",
      "ordNo": 1,
      "claId": "lectureTest",
      "dgnssStDt": "2024. 12. 16.",
      "dgnssAt": "Y",
      "dgnssEdDt": null,
      "eakAt": 1,
      "submAt": "N",
      "submDt": null
    }
  ]
}
```

| 필드 | 설명 |
|------|------|
| dgnssResultId | 심리검사 상세 ID (★ 검사 시작/답안 입력/분석에 필요) |
| eakAt | 제출 상태 (1:응시전, 2:응시중, 3:제출완료, 4:채점중, 5:채점완료) |
| submAt | 검사 제출 여부 |

---

### 2-2. 검사 시작 (문항 로드)

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/start` 또는 `/api/dgnss/stnt/start/update` |
| Method | `POST` |

**Request (Body)**

```json
{
  "dgnssResultId": 1717,
  "paperIdx": 1,
  "page": 0,
  "size": 20
}
```

**Response (`resultData`)**

```json
{
  "omrIdx": 1795,
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
}
```

> **Note**: 종합검사는 120~124번까지 문항을 별도로 구성 필요

---

### 2-3. 검사 새로하기 (답안 초기화)

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/new` |
| Method | `GET` |

**Request (Query Params)**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssResultId | Integer | Y | 심리검사 상세 ID |
| paperIdx | Integer | N | 심리검사 종류 (기본값: 0) |
| page | Integer | N | 페이지 번호 (기본값: 0) |
| size | Integer | N | 페이지 크기 (기본값: 20) |

---

### 2-4. 답안 저장

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/answer` 또는 `/api/dgnss/stnt/answer/save` |
| Method | `POST` |

**Request (Body)**

```json
{
  "omrIdx": 184,
  "no": 12,
  "answer": 1
}
```

---

### 2-5. 검사 제출

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/submit` |
| Method | `POST` |

**Request (Body)**

```json
{
  "dgnssResultId": 1717
}
```

**Response (`resultData`)**

```json
{ "result": "ok" }
```

---

### 2-6. 학생 결과 조회 (통합 API)

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/st/analysis` |
| Method | `GET` |

> **변경사항 (2026-03-19)**: 기존 `/api/dgnss/st/total/analysis`가 이 엔드포인트로 통합됨

**Request (Query Params)**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssResultId | String | X | 심리검사 상세 ID (있으면 해당 회차만 조회) |
| stdtId | String | X | 학생 ID (학생 기준 회차 조회 시 사용) |
| paperIdx | String | X | 심리검사 종류 (연동 시 `1` 또는 `2`를 반드시 명시) |
| ordNo | String | X | 기준 회차 (기본값: 1) |

> `dgnssResultId` 또는 (`stdtId` + `paperIdx`)를 전달해야 합니다.

**Response (`resultData`)**

```json
{
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
      "repeatResponse": "N"
    }
  ]
}
```

| 필드 | 설명 |
|------|------|
| stUserInfo | 학생 정보 |
| `"1"` | 1회차 검사 결과 정보 |
| `"2"` | 2회차 검사 결과 정보 (없을 수 있음) |

---

## 3. PDF 관련 API

### 3-1. PDF 다운로드

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/pdf` |
| Method | `POST` |

**Request (Body)**

```json
{
  "userId": "mathbe2-s1",
  "userType": "S",
  "dgnssId": 184,
  "answerIdx": 1161,
  "ordNo": 1
}
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| userId | String | Y | 사용자 ID |
| userType | String | Y | 사용자 유형 (S: 학생, T: 교사) |
| dgnssId | Integer | Y | 심리검사 ID |
| answerIdx | Integer | Y | 답안 인덱스 |
| ordNo | Integer | Y | 회차 |

---

### 3-2. 일괄 다운로드 전 학생 조회

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/pdf/search` |
| Method | `GET` |

**Request (Query Params)**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| dgnssId | Integer | Y | 심리검사 ID |
| type | String | N | PDF 타입 (기본값: 1) |

**Response (`resultData`)**

```json
{
  "data": [
    {
      "userType": "S",
      "userId": "re22mma33-s1",
      "answerIdx": 131
    }
  ],
  "cnt": 5
}
```

---

### 3-3. 일괄 다운로드 (ZIP)

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/dgnss-download-all` |
| Method | `GET` |
| Response Content-Type | `application/octet-stream` |

**Request (Query Params)**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| jwtToken | String | Y | JWT 토큰 값 |
| dgnssId | String | Y | 심리검사 ID |
| type | String | X | PDF 타입 (1: 기존 PDF, 2: 요약본 PDF) |

> 새 창으로 호출 시 ZIP 파일이 다운로드됩니다.

---

### 3-4. 요약본 PDF 업로드

| 항목 | 값 |
|------|-----|
| URL | `/api/dgnss/summary/pdf` |
| Method | `POST` |

**Request (Body)**

```json
{
  "answerIdx": 12679
}
```

**Response (`resultData`)**

```json
{
  "summaryUrl": "/files/nas/engl/20260107/vivaclass-s-gochkm2510803-5013_summary_20260107104002.pdf"
}
```

---

## 4. 핵심 ID 흐름도

```
[교사 검사 시작]
    └→ dgnssId (검사 ID) 발급
         │
         ├→ [학생 목록 조회] /api/dgnss/st/info
         │     └→ dgnssResultId (학생별 결과 ID) 획득
         │          │
         │          ├→ [검사 시작] /api/dgnss/st/start
         │          │     └→ omrIdx (OMR 인덱스) 발급
         │          │          └→ [답안 저장] /api/dgnss/st/answer (omrIdx + no + answer)
         │          │
         │          ├→ [제출] /api/dgnss/st/submit (dgnssResultId)
         │          │
         │          └→ [개인 분석] /api/dgnss/st/analysis (stdtId + paperIdx)
         │
         ├→ [학급 분석] /api/dgnss/tc/analysis (claId + paperIdx + ordNo)
         │
         ├→ [PDF 대상 조회] /api/dgnss/pdf/search (dgnssId)
         │     └→ answerIdx 획득
         │          └→ [PDF 다운로드] /api/dgnss/pdf (answerIdx or dgnssId)
         │
         └→ [검사 종료] /api/dgnss/tc/end (dgnssId)
```

---

## 5. SECTION_ID 구조

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

### SECTION_ID 별 코드 (학습종합검사)

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

## 6. 대시보드 페이지별 API 매핑

### L1 - 교사 전체 반 대시보드

| 기능 | API |
|------|-----|
| 담당 학급 목록 | `GET /api/dgnss/tc/info` |

### L2 - 반 대시보드

| 기능 | API |
|------|-----|
| 검사 상세 정보 | `GET /api/dgnss/tc/detail` |
| 학생 목록 + 신뢰도 | `GET /api/dgnss/tc/stinfolist` |
| 학급 평균 T점수 | `GET /api/dgnss/tc/analysis` |
| 관심 필요 학생 | `GET /api/dgnss/tc/need` |

### L3 - 학생 대시보드

| 기능 | API |
|------|-----|
| 학생 38개 T점수 | `GET /api/dgnss/st/analysis` |

### 검사 관리

| 기능 | API |
|------|-----|
| 검사 시작 (생성) | `POST /api/dgnss/tc/start` |
| 검사 목록 조회 | `GET /api/dgnss/tc/info` |
| 검사 종료 | `POST /api/dgnss/tc/end` |
| 검사 재시작 | `POST /api/dgnss/tc/restart` |
| 검사 취소 | `POST /api/dgnss/tc/cancel` |

### 학생 검사 응시

| 기능 | API |
|------|-----|
| 검사 목록 조회 | `GET /api/dgnss/st/info` |
| 문항 로드 | `POST /api/dgnss/st/start` |
| 답안 저장 | `POST /api/dgnss/st/answer` |
| 답안 초기화 | `GET /api/dgnss/st/new` |
| 검사 제출 | `POST /api/dgnss/st/submit` |

---

## 7. 에러 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 99 | 실패 |

---

## 8. 프론트엔드 구현 현황

### Vite 프록시 설정 (vite.config.ts)

```typescript
proxy: {
  '/api/dgnss': {
    target: 'http://localhost:8081',
    changeOrigin: true,
    secure: false,
  },
}
```

### 서비스 파일 현황

| 파일 | 역할 | 사용 엔드포인트 |
|------|------|----------------|
| `metaApi.ts` | 공통 API | `/api/dgnss/*` |
| `assessmentService.ts` | 교사용 검사 관리 | `/api/dgnss/tc/*` |
| `examService.ts` | 학생용 검사 응시 | `/api/dgnss/st/*` |

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2026-02-27 | 1.0 | 최초 작성 |
| 2026-03-23 | 2.0 | DGNSS 마이그레이션 반영 - 엔드포인트 `/etc/meta/*` → `/api/dgnss/*` 변경, 학생 결과 API 통합 |

---

## 참고

- 백엔드 상세 규격서: `backend/docs/dgnss-api-spec.md`
- 백엔드 가이드: [backend-api-guide.md](./backend-api-guide.md)
