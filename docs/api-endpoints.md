# META 대시보드 API 엔드포인트 명세

> 백엔드 API 연동 가이드
>
> **Last Updated**: 2026-02-24

---

## 서버 정보

| 환경 | Base URL |
|------|----------|
| 테스트 | `https://t-vcloudapi.vsaidt.com` |
| 운영 | `https://vcloudapi.vsaidt.com` |

### 인증

- **방식**: JWT Token
- **헤더**: `Authorization: Bearer {token}`
- **토큰 발급**: Swagger에서 로그인 후 발급

---

## 대시보드 필수 API

### 1. 검사 목록 조회

```
GET /etc/meta/tc/list
```

**용도**: L1 대시보드 - 교사 담당 학급/검사 목록

**파라미터**: 없음 (JWT 토큰으로 교사 식별)

**응답 예시**:
```json
{
  "success": true,
  "resultData": {
    "list": [
      {
        "dgnssId": 1573,
        "claId": "6c0868fb47de476f89cbf93fcc0567fd",
        "ordNo": 2,
        "paperIdx": "1"
      }
    ]
  }
}
```

**프론트엔드 매핑**:
- `dgnssId` → 검사 ID (다른 API 호출 시 사용)
- `claId` → `Class.id`
- `ordNo` → 회차 (1차/2차)

---

### 2. 검사 상세 정보

```
GET /etc/meta/tc/detail?dgnssId={dgnssId}
```

**용도**: L2 대시보드 - 검사 메타 정보 (기간, 제출 현황)

**파라미터**:
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| dgnssId | number | ✅ | 검사 ID |

**응답 예시**:
```json
{
  "success": true,
  "resultData": {
    "dgnssId": 1573,
    "claId": "6c0868fb47de476f89cbf93fcc0567fd",
    "ordNo": 2,
    "paperIdx": "1",
    "dgnssStDt": "2025. 08. 20.",
    "dgnssEdDt": "2026. 02. 05.",
    "stTotalCnt": 10,
    "stSubmCnt": 5,
    "notSubmStdtName": "10번 심아린, 6번 박예린...",
    "notSubmStdtId": "hahamath303-s10, hahamath303-s6..."
  }
}
```

**프론트엔드 매핑**:
- `stTotalCnt` → 전체 학생 수
- `stSubmCnt` → 제출 학생 수
- `notSubmStdtId` → 미제출 학생 ID 목록

---

### 3. 학생 목록 조회

```
GET /etc/meta/tc/stinfolist?dgnssId={dgnssId}&type=1&paperIdx=1&testFlag=N
```

**용도**: L2 대시보드 - 학급 학생 목록 + 신뢰도 정보

**파라미터**:
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| dgnssId | number | ✅ | 검사 ID |
| type | number | ✅ | 1 (고정) |
| paperIdx | string | ✅ | "1" = 종합검사 |
| testFlag | string | ✅ | "N" (고정) |

**응답 예시**:
```json
{
  "success": true,
  "resultData": {
    "stInfoList": [
      {
        "stdtId": "hahamath303-s1",
        "rowNum": 1,
        "gender": "남자",
        "answerIdx": 11076,
        "reaction": "양호",
        "desirable": "양호",
        "repeatResponse": "N"
      }
    ]
  }
}
```

**프론트엔드 매핑**:
| API 필드 | 프론트엔드 | 설명 |
|----------|-----------|------|
| `stdtId` | `Student.id` | 학생 ID |
| `rowNum` | `Student.number` | 출석번호 |
| `gender` | - | 성별 |
| `answerIdx` | - | T점수 조회용 키 |
| `reaction` | `reliabilityWarnings` | "주의"면 ['반응일관성'] 추가 |
| `desirable` | `reliabilityWarnings` | "주의"면 ['사회적바람직성'] 추가 |
| `repeatResponse` | `reliabilityWarnings` | "Y"면 ['연속동일반응'] 추가 |

---

### 4. 개별 학생 T점수 조회 ⭐ (핵심)

```
GET /etc/meta/st/analysis?dgnssResultId={dgnssId}&paperIdx=1&ordNo={ordNo}&stdtId={stdtId}
```

**용도**: L3 대시보드 - 학생 개별 38개 T점수 (1차/2차 모두)

**파라미터**:
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| dgnssResultId | number | ✅ | 검사 ID |
| paperIdx | string | ✅ | "1" = 종합검사 |
| ordNo | number | ✅ | 회차 (1 또는 2) |
| stdtId | string | ✅ | 학생 ID |

**응답 예시**:
```json
{
  "success": true,
  "resultData": {
    "stUserInfo": {
      "stdtId": "hahamath303-s1",
      "gender": "남자",
      "grade": "1학년",
      "1": [
        {
          "ord_no": 1,
          "SECTION_NM": "자아존중감",
          "tScore": 55.5,
          "DEPTH": 5,
          "SECTION_ID": "10-22-01-01-01-0",
          "reaction": "양호",
          "desirable": "양호",
          "repeatResponse": "N"
        }
      ]
    }
  }
}
```

**T점수 추출 방법**:
```typescript
// DEPTH=5 (소분류 38개)만 필터링
const round1Scores = data["1"]
  .filter(item => item.DEPTH === 5 && item.ord_no === 1)
  .map(item => item.tScore);

const round2Scores = data["1"]
  .filter(item => item.DEPTH === 5 && item.ord_no === 2)
  .map(item => item.tScore);
```

**DEPTH 구분**:
| DEPTH | 개수 | 설명 |
|-------|------|------|
| 3 | 5개 | 대분류 (자아강점, 학습디딤돌, 학습걸림돌, 긍정적공부마음, 부정적공부마음) |
| 4 | 11개 | 중분류 (긍정적자아, 대인관계능력, 메타인지...) |
| 5 | 38개 | **소분류 (자아존중감, 자기효능감...)** ← 이거 사용 |

---

### 5. 학급 평균 T점수 조회

```
GET /etc/meta/tc/analysis?claId={claId}&paperIdx=1&ordNo={ordNo}
```

**용도**: L2/L2.5 대시보드 - 학급 전체 평균 T점수

**파라미터**:
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| claId | string | ✅ | 학급 ID |
| paperIdx | string | ✅ | "1" = 종합검사 |
| ordNo | number | ✅ | 회차 (1 또는 2) |

**응답 예시**:
```json
{
  "success": true,
  "resultData": {
    "1": [
      {
        "SECTION_NM": "자아존중감",
        "tScore": 48,
        "DEPTH": 5
      }
    ]
  }
}
```

---

### 6. 관심 필요 학생 조회

```
GET /etc/meta/tc/need?dgnssId={dgnssId}
```

**용도**: L2 대시보드 - 상담/지도 필요 학생 목록

**파라미터**:
| 이름 | 타입 | 필수 | 설명 |
|------|------|------|------|
| dgnssId | number | ✅ | 검사 ID |

---

### 7. 미제출 학생 목록

```
GET /etc/meta/tc/notsubm/list?dgnssId={dgnssId}
```

**용도**: L2 대시보드 - 검사 미제출 학생 목록

---

## 전체 API 목록 (29개)

### 교사용 API

| 메서드 | 엔드포인트 | 설명 | 대시보드 사용 |
|--------|-----------|------|--------------|
| GET | `/etc/meta/tc/list` | 검사 목록 조회 | ✅ L1 |
| GET | `/etc/meta/tc/info` | 검사 목록 조회 (v2) | - |
| GET | `/etc/meta/tc/detail` | 검사 상세 정보 | ✅ L2 |
| GET | `/etc/meta/tc/stinfolist` | 학생 목록 | ✅ L2 |
| GET | `/etc/meta/tc/analysis` | 학급 평균 T점수 | ✅ L2, L2.5 |
| GET | `/etc/meta/tc/need` | 관심 필요 학생 | ✅ L2 |
| GET | `/etc/meta/tc/notsubm` | 미제출 학생 | ⚠️ 선택 |
| GET | `/etc/meta/tc/notsubm/list` | 미제출 학생 목록 | ⚠️ 선택 |
| GET | `/etc/meta/tc/start` | 검사 시작 | ❌ 관리용 |
| GET | `/etc/meta/tc/end` | 검사 종료 | ❌ 관리용 |
| GET | `/etc/meta/tc/restart` | 검사 재시작 | ❌ 관리용 |
| GET | `/etc/meta/tc/cancel` | 검사 취소 | ❌ 관리용 |
| GET | `/etc/meta/tc/text/save` | 텍스트 저장 | ❌ |

### 학생용 API

| 메서드 | 엔드포인트 | 설명 | 대시보드 사용 |
|--------|-----------|------|--------------|
| GET | `/etc/meta/st/info` | 검사 목록 | - |
| GET | `/etc/meta/st/analysis` | **개별 T점수 조회** | ✅ L3 (핵심) |
| GET | `/etc/meta/st/total/analysis` | 종합 분석 | ⚠️ 확인 필요 |
| GET | `/etc/meta/st/start` | 검사 시작 | ❌ 학생용 |
| GET | `/etc/meta/st/new` | 검사 새로하기 | ❌ 학생용 |
| POST | `/etc/meta/st/answer` | 답 입력 | ❌ 학생용 |
| POST | `/etc/meta/st/submit` | 검사 제출 | ❌ 학생용 |
| GET | `/etc/meta/stnt/list` | 검사 목록 | - |
| GET | `/etc/meta/stnt/start/update` | 검사 시작 | ❌ 학생용 |
| POST | `/etc/meta/stnt/answer/save` | 답 저장 | ❌ 학생용 |

### 기타 API

| 메서드 | 엔드포인트 | 설명 | 대시보드 사용 |
|--------|-----------|------|--------------|
| POST | `/etc/meta/pdf` | PDF 다운로드 | ⚠️ 추후 |
| GET | `/etc/meta/pdf/search` | PDF 다운로드 전 조회 | ⚠️ 추후 |
| GET | `/etc/meta/dgnss-download-all` | 일괄 다운로드 | ⚠️ 추후 |
| POST | `/etc/meta/summary/pdf` | 요약본 업로드 | ❌ |
| POST | `/etc/meta/sync` | 회원 동기화 | ❌ 관리자용 |
| POST | `/etc/meta/updateUserInfo` | 회원정보 업데이트 | ❌ |

---

## 대시보드 페이지별 API 매핑

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
| 학생 38개 T점수 | `GET /etc/meta/st/analysis` |

---

## 에러 처리

### 공통 응답 구조

```json
{
  "success": true | false,
  "resultCode": 200 | 400 | 401 | 500,
  "resultMessage": "메시지",
  "resultData": { ... }
}
```

### 에러 코드

| 코드 | 설명 | 대응 |
|------|------|------|
| 200 | 성공 | - |
| 400 | 잘못된 요청 | 파라미터 확인 |
| 401 | 인증 실패 | JWT 토큰 재발급 |
| 403 | 권한 없음 | 해당 검사 접근 권한 확인 |
| 500 | 서버 오류 | 재시도 또는 관리자 문의 |

---

## 실제 테스트 값 (Swagger 검증)

> 2026-02-24 대화에서 Swagger로 실제 호출한 파라미터/응답 기록

### 테스트 계정 정보

| 항목 | 값 |
|------|-----|
| 검사 ID (dgnssId) | `1573` |
| 학급 ID (claId) | `6c0868fb47de476f89cbf93fcc0567fd` |
| 학생 ID 예시 | `hahamath303-s1` ~ `hahamath303-s10` |
| 회차 (ordNo) | `1` (1차), `2` (2차) |

---

### API 호출 예시

#### 1. 검사 목록 조회
```
GET /etc/meta/tc/list
Authorization: Bearer {JWT_TOKEN}
```

**응답**:
```json
{
  "success": true,
  "resultData": {
    "list": [
      {
        "dgnssId": 1573,
        "claId": "6c0868fb47de476f89cbf93fcc0567fd",
        "ordNo": 2,
        "paperIdx": "1"
      }
    ]
  }
}
```

---

#### 2. 검사 상세 정보
```
GET /etc/meta/tc/detail?dgnssId=1573
```

**응답**:
```json
{
  "success": true,
  "resultData": {
    "dgnssId": 1573,
    "claId": "6c0868fb47de476f89cbf93fcc0567fd",
    "ordNo": 2,
    "paperIdx": "1",
    "dgnssStDt": "2025. 08. 20.",
    "dgnssEdDt": "2026. 02. 05.",
    "stTotalCnt": 10,
    "stSubmCnt": 5,
    "dgnssAt": "N",
    "notSubmStdtName": "10번 심아린, 6번 박예린, 7번 박태인, 8번 서호, 9번 심아윤",
    "notSubmStdtId": "hahamath303-s10, hahamath303-s6, hahamath303-s7, hahamath303-s8, hahamath303-s9"
  }
}
```

---

#### 3. 학생 목록 조회
```
GET /etc/meta/tc/stinfolist?dgnssId=1573&type=1&paperIdx=1&testFlag=N
```

**응답**:
```json
{
  "success": true,
  "resultData": {
    "stInfoList": [
      {
        "stdtId": "hahamath303-s1",
        "rowNum": 1,
        "gender": "남자",
        "answerIdx": 11076,
        "reaction": "양호",
        "desirable": "양호",
        "repeatResponse": "N"
      },
      {
        "stdtId": "hahamath303-s2",
        "rowNum": 2,
        "gender": "여자",
        "answerIdx": 11077,
        "reaction": "양호",
        "desirable": "주의",
        "repeatResponse": "N"
      }
    ]
  }
}
```

**신뢰도 필드 해석**:
| 필드 | 값 | 의미 |
|------|-----|------|
| `reaction` | "양호" / "주의" | 반응일관성 |
| `desirable` | "양호" / "주의" | 사회적바람직성 |
| `repeatResponse` | "N" / "Y" | 연속동일반응 |

---

#### 4. 개별 학생 T점수 조회 ⭐
```
GET /etc/meta/st/analysis?dgnssResultId=1573&paperIdx=1&ordNo=1&stdtId=hahamath303-s1
```

**응답**:
```json
{
  "success": true,
  "resultData": {
    "stUserInfo": {
      "stdtId": "hahamath303-s1",
      "gender": "남자",
      "grade": "1학년"
    },
    "eakStDt": "2025-01-15",
    "1": [
      {
        "ord_no": 1,
        "SECTION_NM": "자아존중감",
        "tScore": 55.5,
        "DEPTH": 5,
        "SECTION_ID": "10-22-01-01-01-0",
        "reaction": "양호",
        "desirable": "양호",
        "repeatResponse": "N"
      },
      {
        "ord_no": 1,
        "SECTION_NM": "긍정적자아",
        "tScore": 52.3,
        "DEPTH": 4,
        "SECTION_ID": "10-22-01-01-0"
      }
    ]
  }
}
```

**DEPTH별 개수**:
| DEPTH | 개수 | 설명 | 용도 |
|-------|------|------|------|
| 3 | 5개 | 대분류 | 영역 차트 |
| 4 | 11개 | 중분류 | 중분류 요인 차트 |
| 5 | 38개 | **소분류** | **LPA 분류, 메인 T점수** |

---

#### 5. 학급 평균 T점수 조회
```
GET /etc/meta/tc/analysis?claId=6c0868fb47de476f89cbf93fcc0567fd&paperIdx=1&ordNo=1
```

**응답**:
```json
{
  "success": true,
  "resultData": {
    "1": [
      {
        "SECTION_NM": "자아존중감",
        "tScore": 48.2,
        "DEPTH": 5
      },
      {
        "SECTION_NM": "자기효능감",
        "tScore": 51.5,
        "DEPTH": 5
      }
    ]
  }
}
```

---

## 파라미터 요약

| API | 필수 파라미터 | 테스트 값 |
|-----|--------------|----------|
| `/tc/list` | (없음) | JWT만 필요 |
| `/tc/detail` | `dgnssId` | `1573` |
| `/tc/stinfolist` | `dgnssId`, `type`, `paperIdx`, `testFlag` | `1573`, `1`, `"1"`, `"N"` |
| `/st/analysis` | `dgnssResultId`, `paperIdx`, `ordNo`, `stdtId` | `1573`, `"1"`, `1`, `"hahamath303-s1"` |
| `/tc/analysis` | `claId`, `paperIdx`, `ordNo` | `"6c0868fb..."`, `"1"`, `1` |
| `/tc/need` | `dgnssId` | `1573` |

---

## 참고

- Swagger: `{Base URL}/swagger-ui.html`
- 백엔드 상세 가이드: [backend-api-guide.md](./backend-api-guide.md)
