# tc/analysis `lernReportByOrd` 변경 (FE 연동 가이드)

> 대상: 프론트엔드 개발자
> 최종: 2026-08-07
> 관련 API: `GET /api/dgnss/tc/analysis` (교사 대시보드 - 학습심리검사 종합 분석)

---

## 1. 개요
`GET /api/dgnss/tc/analysis` 응답의 **`lernReportByOrd`** 필드가 변경되었습니다.

- `lernReportByOrd` = **회차별(`"1"`, `"2"`) 학생 단위 학습영역 점수·제출 상태** 목록.
- 학생-학급 **N:N 모델**(한 학생이 여러 학급에서 응시 가능)을 반영해, 현재 학급/타학급 응시 여부까지 학생 단위로 노출합니다.

---

## 2. 이번 변경점 (2026-08)

1. **`paperIdx=2`(자기조절)에서도 `lernReportByOrd` 노출**
   - 이전에는 `paperIdx=1`(학습종합) 응답에만 있었습니다. 이제 **1·2 모두** 내려갑니다.
2. **각 row 에 `reliabilityWarnings`(string[]) 추가**
   - 신뢰도 지표 중 '주의'인 항목명 배열. 주의 없으면 **빈 배열 `[]`**.
3. **신뢰도 '주의' 학생도 포함**
   - 이전에는 신뢰도 '주의' 학생이 누락되거나 점수 없이 표시됐는데, 이제 **점수와 함께 포함**되고 위 `reliabilityWarnings`로 표시됩니다.
   - (학급 평균·`lpaByOrd`는 변경 없음 — 신뢰도 학생 포함 여부 영향 없음)

---

## 3. `lernReportByOrd` 구조

```jsonc
"lernReportByOrd": {
  "1": [ /* 1회차 학생 배열 */ ],
  "2": [ /* 2회차 학생 배열 (조건 충족 시) */ ]
}
```

각 배열 원소(학생 row):

| 필드 | 타입 | 설명 |
|---|---|---|
| `stdtId` | string | 학생 ID |
| `source` | string | `IN_CLASS`(현재 학급) / `OTHER_CLASS`(타학급 응시분) |
| `ord_no` | number | 회차 |
| `subm_at` | string | `Y`(제출 완료) / `N`(응시 중·미제출) |
| `reliabilityWarnings` | string[] | **신규**. 신뢰도 '주의' 지표명 배열. 없으면 `[]` |
| `sectionScores` | object | `{ 섹션ID: T점수 }`. 미제출(N) 학생은 `{}` |

### `reliabilityWarnings` 값
아래 지표 중 '주의'인 것만 배열에 담깁니다.
- `사회적바람직성`
- `반응일관성`
- `연속동일반응`

> 응시 중(`subm_at="N"`)이거나 신뢰도 판정이 없는 학생은 `reliabilityWarnings: []`.

---

## 4. 응답 예시 (`resultData` 일부)

```json
{
  "lernReportByOrd": {
    "1": [
      {
        "stdtId": "a1b2...",
        "source": "IN_CLASS",
        "ord_no": 1,
        "subm_at": "Y",
        "reliabilityWarnings": [],
        "sectionScores": { "20-22-01": 63, "20-22-02": 58 }
      },
      {
        "stdtId": "c3d4...",
        "source": "IN_CLASS",
        "ord_no": 1,
        "subm_at": "Y",
        "reliabilityWarnings": ["사회적바람직성", "연속동일반응"],
        "sectionScores": { "20-22-01": 71, "20-22-02": 69 }
      },
      {
        "stdtId": "e5f6...",
        "source": "OTHER_CLASS",
        "ord_no": 1,
        "subm_at": "N",
        "reliabilityWarnings": [],
        "sectionScores": {}
      }
    ]
  }
}
```

---

## 5. FE 처리 가이드

- **신뢰도 주의 표시**: `reliabilityWarnings.length > 0` 이면 해당 학생에 '신뢰도 주의' 배지/툴팁 표시(항목명은 배열 값 사용). 기존 `reliabilityWarnings: string[]` 컨벤션과 동일하므로 렌더 로직 재사용 가능.
- **미제출/응시중**: `subm_at === "N"` 이면 `sectionScores`가 `{}` → 점수 차트 미렌더, "다른 학급에서 응시 중" 등 상태 표시.
- **타학급 응시분**: `source === "OTHER_CLASS"` 로 구분 가능.
- **paperIdx=2**: 이제 `lernReportByOrd`가 존재하므로, 기존에 `undefined` 가드만 하던 코드가 있다면 값이 채워져 내려오는 점 유의(자기조절 회차 데이터 활용 가능).

---

## 6. 참고
- 이 변경은 응답 **추가/보강** 성격입니다(기존 `lernReportByOrd` 필드 형태는 유지, `reliabilityWarnings`만 추가). 기존 파싱 로직은 그대로 동작합니다.
- `lpaByOrd`, 학급 평균(`"1"`/`"2"`) 등 다른 필드는 변경 없습니다.
