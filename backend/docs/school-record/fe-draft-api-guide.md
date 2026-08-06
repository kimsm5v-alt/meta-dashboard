# 생활기록부 작성 고도화 — 작업본 저장 API (FE 연동 가이드)

> 대상: 프론트엔드 개발자
> 작성 기준: `SchoolRecordController.saveSchoolRecordDraft`, `SchoolRecordService.saveDraft`, `SchoolRecordInfoMapper.upsertSchoolRecordDraft`
> 최종: 2026-08-06

---

## 1. 개요
학생 생활기록부(행동특성 및 종합의견) 작성 화면의 **작업본을 저장**하는 API입니다.

- **호출 단위: 학생 1명**. 여러 학생 일괄 저장은 **이 API를 학생별로 반복 호출**하면 됩니다(전용 배치 API 없음).
- **UPSERT**: 학생당 1건만 유지됩니다. 같은 학생을 다시 저장하면 **덮어쓰기(in-place)** 되고, **직전 문구는 서버가 `previous_content`로 보존**합니다.
- 임시저장·문구생성·편집저장 등 모든 저장 흐름이 이 하나의 엔드포인트를 사용합니다(구분은 `status`로).

---

## 2. 엔드포인트

```
POST /api/school-records/draft
Content-Type: application/json
Authorization: Bearer <JWT>
```

- **인증 필수**(SSO JWT). 교사 식별자(`tcId`)는 **JWT에서 서버가 자동 도출**하므로 body로 보내지 않습니다.
- `category`(생기부 분류)는 종합의견 단일로 **서버가 고정**합니다. body로 보내지 않아도 됩니다.

---

## 3. 요청 body

| 필드 | 타입 | 필수 | 설명 |
|---|---|:---:|---|
| `studentId` | string | ✅ | 대상 학생 ID (`stdt_id`) |
| `classId` | string | ✅ | 학급 ID (`cla_id`) |
| `status` | string | | 작성 상태 코드(아래 표). 미전송 시 `"1"`(작성중) |
| `source` | string | | 생성 방식 코드(아래 표) |
| `content` | string | | 최종 생기부 문구. **임시저장 등 문구 없을 땐 생략/빈값 허용** |
| `generatedText` | string | | AI가 생성한 원본 문구(편집 전) |
| `strengths` | string[] | | 강점 요인 TOP3 키워드 |
| `improvements` | string[] | | 보완 요인 TOP3 키워드 |
| `observationInput` | object | | 관찰 입력(아래 구조) |

### 3-1. `status` 코드 (작성 상태)
| 코드 | 의미 |
|:---:|---|
| `1` | INPUTTING — 작성 중(임시저장) |
| `2` | GENERATING — 생성 중 |
| `3` | DRAFT — 작성 완료(AI 초안) |
| `4` | EDITED — 작성 완료(편집본) |
| `5` | FAILED — 생성 실패 |
> 미작성(EMPTY)은 **행 자체가 없음**(저장 호출 전 상태).

### 3-2. `source` 코드 (생성 방식)
| 코드 | 의미 |
|:---:|---|
| `1` | TEST_ONLY — 검사 결과만으로 생성 |
| `2` | COMMON_CONTEXT — 공통 상황을 추가하여 생성 |
| `3` | INDIVIDUAL_OBSERVATION — 개별 관찰 기반 생성 |

### 3-3. `observationInput` 구조
관찰 블록은 **1번 화면(검사 요인)에서 체크한 요인 수만큼(최대 6개)** 생기며, 각 블록은 그 요인의 행동 체크(요인당 최대 4개)를 담습니다.

```jsonc
{
  "observations": [
    {
      "factor": "자기효능감",       // 요인명
      "type": "strength",           // "strength" | "improvement"
      "behaviorCodes": ["b1", "b2"] // 그 요인에서 체크한 행동(최대 4)
    }
  ],
  "freeText": "모둠 발표에서 자료를 스스로 정리해 발표함", // 구체적 장면(선택)
  "counselingRefs": [123, 456]      // 참고한 상담 기록 id (읽기 참조만, 수정 없음)
}
```

---

## 4. 요청 예시

```json
{
  "studentId": "a1b2c3d4e5f67890abcdef1234567890",
  "classId": "abcd1234",
  "status": "3",
  "source": "3",
  "content": "학습에 대한 열의가 높고 자기주도적으로 계획을 세우는 모습을 보임",
  "strengths": ["자기효능감", "시간관리"],
  "improvements": ["게임 과몰입"],
  "observationInput": {
    "observations": [
      {"factor": "자기효능감", "type": "strength", "behaviorCodes": ["b1", "b2"]},
      {"factor": "게임 과몰입", "type": "improvement", "behaviorCodes": ["b9"]}
    ],
    "freeText": "모둠 발표에서 자료를 스스로 정리해 발표함",
    "counselingRefs": [123]
  }
}
```

### 임시저장(문구 없이 관찰만 저장) 예시
```json
{
  "studentId": "a1b2...", "classId": "abcd1234",
  "status": "1",
  "observationInput": { "observations": [{"factor":"자기효능감","type":"strength","behaviorCodes":["b1"]}] }
}
```

---

## 5. 응답

성공 시 공통 래핑(`ResponseDTO<CustomBody>`) 안에 다음이 담깁니다.
```json
{
  "success": true,
  "resultData": { "saved": true, "studentId": "a1b2...", "status": "3" },
  "resultMessage": "생기부 작업본 저장 완료"
}
```
실패 시 `success:false` + 오류 메시지(`studentId는 필수입니다.` 등).

---

## 6. 동작/주의

- **학생당 1건**: `(학생, 교사, 종합의견)` 기준으로 1건만 존재. 재저장 = 그 1건 수정.
- **직전 문구 보존**: 재저장 시 서버가 이전 `content`를 `previous_content`로 옮겨 보관(복원용). FE는 신경 쓸 필요 없음.
- **부분 저장 가능**: 문구 없이 관찰 입력만(임시저장), 또는 문구만도 저장 가능. 넘긴 필드만 반영됩니다.
- `strengths`/`improvements`/`observationInput`은 **JSON 그대로 전송**(서버가 JSON 컬럼에 저장). 문자열로 감싸서 보내지 마세요.
- 일괄 생성 화면도 **학생별로 이 API를 반복 호출**해 저장하면 됩니다.

## 7. 후속(미구현) — 참고
- **조회(리스트/상세) API는 별도 예정**입니다. 현재 `GET /api/school-records/student/{studentId}`는 **구(舊) 필드만**(id/content/category/createdAt) 반환하며, 신규 필드(strengths/improvements/status/observationInput 등)는 아직 내려주지 않습니다.
- 리스트에서는 `strengths`/`improvements`/`status`만 경량 조회하고, 상세에서 `observation_input`을 조회하는 형태로 설계 예정(확정 시 문서 갱신).
