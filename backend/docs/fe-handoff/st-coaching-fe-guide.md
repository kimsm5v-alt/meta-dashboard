# 개인화 코칭 v2 조회 (FE 연동 가이드)

> 대상: 프론트엔드 개발자
> 최종: 2026-08-20 · 상태: **백엔드 구현 완료**
> 관련 API: `GET /api/dgnss/st/coaching/{answerIdx}`
> 용도: 학생 결과 화면의 **강점 카드 2개 + 맞춤 코칭 카드 1개** 렌더링
> 근거(내부 설계): `backend/docs/lpa/v2/그래프DB_설계전달서_v4.md`, `화면매핑표_v1.md`

---

## 1. 개요

`answerIdx` 하나로 개인화 코칭을 조회합니다. 백엔드가 **Neo4j로 선별**(강점 top2 요인 · 보완점 top1 경로) 후 **RDB에서 코칭 문구를 조립**해 반환합니다.

- 선별: Neo4j (편차·ModerationPath) / 문구: RDB (`coaching_strength`, `coaching_moderation`)
- **`[학생명]` placeholder는 치환하지 않고 그대로 내려갑니다 → FE가 실제 학생 이름으로 치환**
- 적용 범위: **종합검사(paperIdx=1), 초·중만**. 고등/미분류는 **빈 카드**로 응답
- 강점 카드 순서 = 선별 순서(편차 내림차순). "인정1/인정2" 같은 순위 배지는 **FE가 배열 순서대로 부여**

---

## 2. 요청

```
GET /api/dgnss/st/coaching/{answerIdx}
Authorization: Bearer <JWT>
```

| 파라미터 | 위치 | 필수 | 설명 |
|---|---|:---:|---|
| `answerIdx` | path | ✅ | 답안 인덱스 (`tb_dgnss_answer.ANSWER_IDX`) |

---

## 3. 응답

`resultData` 구조:

```json
{
  "answerIdx": 12345,
  "lpaClass": "자원소진형",
  "schoolLevel": "elementary",
  "strengthCards": [
    {
      "factor": "자아존중감",
      "observation": "자원소진형은 심리적 에너지가 많이 소모되면 … 다행히 [학생명]는 …",
      "line": "자신의 능력과 가치를 긍정적으로 바라보고 있어 참 멋지네.",
      "question": "요즘 너 스스로가 마음에 든다고 느꼈던 순간은 언제였어?"
    },
    {
      "factor": "타인정서인식",
      "observation": "…",
      "line": "…",
      "question": "…"
    }
  ],
  "coachingCard": {
    "zFactor": "…",
    "xFactor": "…",
    "yFactor": "…",
    "pathType": "…",
    "interpretation": "… [학생명] …",
    "coaching1": { "method": "…", "line": "…" },
    "coaching2": { "action": "…", "line": "…" }
  }
}
```

### 필드

| 필드 | 설명 |
|---|---|
| `answerIdx` | 요청한 답안 인덱스 |
| `lpaClass` | LPA 유형명 |
| `schoolLevel` | `elementary` / `middle` |
| `strengthCards[]` | **강점 카드(최대 2개)**, 선별 순서 유지 |
| `strengthCards[].factor` | 요인명(카드 제목) |
| `strengthCards[].observation` | 강점 관찰 본문 — **`[학생명]` 포함** |
| `strengthCards[].line` | 칭찬 멘트(인용) |
| `strengthCards[].question` | 확장 질문(인용) |
| `coachingCard` | **맞춤 코칭 카드(1개)** — 없으면 `null` |
| `coachingCard.interpretation` | 보완점 해석 — **`[학생명]` 포함** |
| `coachingCard.coaching1` | `{ method, line }` — 코칭1(방법 + 멘트) |
| `coachingCard.coaching2` | `{ action, line }` — 코칭2(행동 + 멘트) |
| `coachingCard.zFactor`/`xFactor`/`yFactor`/`pathType` | 조절경로 메타(내부 근거, 표시 선택) |

---

## 4. FE 렌더링 규칙 (중요)

화면매핑표 기준, 데이터에는 아래 처리가 **안 되어 있으므로 FE에서 적용**해야 합니다.

1. **`[학생명]` 치환**: `observation`, `interpretation`에 들어있는 `[학생명]`을 실제 학생 이름으로 치환.
2. **인용 따옴표 렌더링**: `line`, `question`, `coaching1.line`, `coaching2.line`은 **원본에 따옴표가 없습니다.** 인용 박스로 노출 시 **FE 템플릿에서 앞뒤 큰따옴표(" ")를 렌더링**하세요.
3. **순위 배지**: 강점 카드의 "인정1/인정2" 등 순위 표시는 데이터가 아니라, `strengthCards` **배열 순서대로 FE가 부여**.
4. **고정 라벨**: "더 이야기하고 싶다면 이렇게 물어보세요" 같은 라벨은 UI 고정 텍스트(데이터 아님).

---

## 5. 빈 응답 / 예외 처리

- **고등/미분류** 또는 선별 불가: `strengthCards`는 **빈 배열**, `coachingCard`는 **`null`**.
- RDB에 해당 문구가 없으면 해당 강점 카드는 **생략**되거나(강점) 코칭 카드가 **`null`**(보완점)로 옵니다 — FE는 카드 수가 0~2개 가변임을 전제로 렌더링하세요.
- 응답 envelope는 공통 `ResponseDTO<CustomBody>`(`success`/`resultCode`/`resultData`/`resultMessage`)입니다.

---

## 6. 체크리스트

1. 결과 화면에서 `answerIdx`로 `GET /api/dgnss/st/coaching/{answerIdx}` 호출
2. `strengthCards`(0~2개) + `coachingCard`(또는 null) 가변 렌더링
3. `observation`/`interpretation`의 `[학생명]` 치환
4. `line`/`question`/`coaching*.line` 인용 박스에 따옴표 렌더링
