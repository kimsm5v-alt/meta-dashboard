# 학생 회차별 학습현황 (FE 연동 가이드)

> 대상: 프론트엔드 개발자
> 최종: 2026-08-12 · 상태: **백엔드 구현 완료**
> 관련 API: `GET /api/dgnss/students/{studentId}/learning-status`
> 용도: 변화추적 학생 개인 화면에서 1·2차 검사 간 **학습현황 변화** 표시 (기존 임시 데이터 대체)

---

## 1. 개요

학생의 회차별 학습현황(`TB_DGNSS_ANSWER.LSANS01~05`)을 **회차 순으로** 반환합니다.
값은 화면 문구가 아니라 **고정 코드값**으로 내려갑니다(요청하신 형식).

- `studentId` = **학생 `stdt_id`** (경로 변수)
- 회차 = **`ord_no`** (응답 `round`)
- 기본 **종합검사(paperIdx=1)** 기준. 미응시/미제출 회차는 결과에서 제외됩니다.

---

## 2. 요청

```
GET /api/dgnss/students/{studentId}/learning-status?claId={claId}
Authorization: Bearer <JWT>
```

| 파라미터 | 위치 | 필수 | 기본 | 설명 |
|---|---|:---:|:---:|---|
| `studentId` | path | ✅ | — | 학생 `stdt_id` |
| `claId` | query | ✅ | — | 학급 ID |
| `paperIdx` | query | — | `1` | 검사 유형(1=종합, 2=자기조절). `0`/음수면 전체 |

> `paperIdx`를 생략하면 종합검사(1)만 조회합니다. 종합/자기조절은 `ord_no`가 겹칠 수 있어 기본적으로 한 유형만 반환합니다.

---

## 3. 응답

`resultData` 구조:

```json
{
  "studentId": "abc123",
  "rounds": [
    {
      "round": 1,
      "answerIdx": 1234,
      "academicAchievement": "high",
      "gradeSatisfaction": "high",
      "learningMotivation": "interest",
      "selfStudyTime": "2-3h",
      "learningCounselor": "family"
    },
    {
      "round": 2,
      "answerIdx": 2345,
      "academicAchievement": "mid",
      "gradeSatisfaction": "mid",
      "learningMotivation": "future",
      "selfStudyTime": "1-2h",
      "learningCounselor": "teacher"
    }
  ]
}
```

- `rounds`는 `round`(=ord_no) **오름차순**입니다.
- 응시했지만 해당 문항을 응답하지 않았다면 그 필드는 **`null`** 로 옵니다(값 없음).
- 응시/제출한 회차가 없으면 `rounds`는 **빈 배열**입니다.

---

## 4. 코드값 정의

각 항목의 코드값(원본 `LSANS` 1~5 매핑):

| 필드 | 코드값 |
|---|---|
| `academicAchievement` (학업성취도) | `very-low` · `low` · `mid` · `high` · `very-high` |
| `gradeSatisfaction` (성적만족도) | `very-low` · `low` · `mid` · `high` · `very-high` |
| `learningMotivation` (공부 이유) | `interest` · `future` · `college` · `expectations` · `unknown` |
| `selfStudyTime` (1일 평균 혼공 시간) | `none` · `under1h` · `1-2h` · `2-3h` · `over3h` |
| `learningCounselor` (학습 고민 상담사) | `friend` · `teacher` · `family` · `counselor` · `etc` |

**화면 문구 매핑 참고** (FE에서 표기):

| 코드 | academicAchievement / gradeSatisfaction | learningMotivation | selfStudyTime | learningCounselor |
|---|---|---|---|---|
| 1 | very-low = 매우 낮음 | interest = 흥미를 느껴서 | none = 전혀 안함 | friend = 친구 |
| 2 | low = 낮음 | future = 미래를 위해서 | under1h = 1시간 미만 | teacher = 선생님 |
| 3 | mid = 보통 | college = 대학 진학 | 1-2h = 1~2시간 | family = 가족 |
| 4 | high = 높음 | expectations = 주변 기대 때문에 | 2-3h = 2~3시간 | counselor = 상담 전문가 |
| 5 | very-high = 매우 높음 | unknown = 모르겠음 | over3h = 3시간 이상 | etc = 기타 |

---

## 5. 참고

- 응답 envelope는 공통 `ResponseDTO<CustomBody>`(`success`/`resultCode`/`resultData`/`resultMessage`)입니다.
- 데이터 원천은 `TB_DGNSS_ANSWER.LSANS01~05`이며, 코드 매핑은 검사 결과 PDF와 동일한 기준입니다.
