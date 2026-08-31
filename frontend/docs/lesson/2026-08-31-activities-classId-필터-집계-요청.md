# [요청] 활동 결과 API — `classId` 필터 시 해당 반 학생만 집계

> 2026-08-31 · superplatform-lms 백엔드 담당자 대상 · meta-dashboard(학심정) FE  
> 관련 코드: `features/lesson/api/lmsActivityService.ts` · `features/lesson/api/queries.ts`

---

## 0. 한 줄 요약

활동 시작 시 1~n개의 반을 선택해 내려보낼 수 있는데, `optFilter=classId:like:{classId}` 로 특정 반을 지정해도 **해당 반 학생만** 집계·조회되지 않고 **활동에 포함된 모든 반의 학생**이 함께 내려옵니다. 아래 3개 API에서 `classId` 필터가 **참여자(participant) 축까지** 적용되도록 변경 부탁드립니다.

---

## 1. 배경

- 활동(lesson) 시작 시 교사는 **1~n개의 반**을 선택해 활동을 배포할 수 있습니다.
- FE(학심정 meta-dashboard)는 반 단위 UI를 위해 `optFilter=classId:like:{classId}` 로 해당 반과 연관된 활동·결과만 조회합니다.
- 현재 `optFilter`는 **활동 목록 필터링**에는 동작하지만, **참여자·집계 결과**에는 반영되지 않는 경우가 있습니다.

---

## 2. 문제 정의

| 구분 | 기대 동작 | 현재 동작 |
| --- | --- | --- |
| 활동 목록 | `classId`가 포함된 활동만 조회 | 정상 |
| 활동별 집계 (`assignedCount`, `submittedCount` 등) | **해당 `classId` 소속 학생만** 집계 | 활동에 포함된 **모든 반** 학생을 합산 |
| 참여자 목록 (`rows`, `submitted`, `notSubmitted` 등) | **해당 `classId` 소속 학생만** 포함 | **모든 반** 학생 포함 |
| 미제출 학생 수 (`notSubmittedStudentCount`) | 해당 반 기준 미제출 학생 수 | 다른 반 학생까지 포함된 수 |

**핵심:** 활동이 **단일 반**에만 배포된 경우는 정상이나, **복수 반**에 배포된 활동에서는 `classId` 필터와 무관하게 전체 참여자 기준으로 집계됩니다.

---

## 3. 대상 API

| API | 설명 | FE 사용처 |
| --- | --- | --- |
| `GET /api/v1/activities/progress` | 반 학습현황 (묶음 조회) | 미제출 태그·카드 highlight |
| `GET /api/v1/activities/{activityId}/statistics` | 정오·점수 집계 | 활동 결과 — 문항별 정오율 |
| `GET /api/v1/activities/{activityId}/progress` | 참여 현황 (사람 축) | 활동 결과 — 제출/진행 상태 |

공통 쿼리 파라미터(요청):

```
optFilter=classId:like:{classId}
```

> `/activities/progress`는 이미 `optFilter`를 전달하고 있습니다.  
> `/statistics`, `/progress`는 FE에서 `classId`를 넘기도록 연동 예정이므로, **동일한 `optFilter` 규칙**으로 동작해 주시면 됩니다.

---

## 4. 검증용 상수

| 항목 | 값 |
| --- | --- |
| 조회 대상 반 (`classId`) | `7f6c97874b0f4c308b4357cd1a0ba2c6` |
| 해당 반 학생 수 | **9명** |
| 문제 활동 (`activityId`) | `01a04740-f77a-7c20-9c9c-e2530930958b` (제목: `초5_L4_Wrap Up`) |
| 문제 활동 전체 배정 학생 수 | **19명** (복수 반 배포) |

### 4-1. `classId: 7f6c97874b0f4c308b4357cd1a0ba2c6` 소속 학생 (9명)

```
0cc9da95-bdca-4265-94bf-cc9cc8730290
13bed149-adb4-4295-90d4-c7b1432f8551
21ae5f09-d175-4a65-a3a9-0bb5ada0d9d7
2aa3fd02-2154-4ebc-bb14-29956cb9e8f3
3a008cd2-4bc8-4553-94f2-280f22d79e46
6ea13daf-7299-4394-9045-13f04b7cb301
6ef37a26-2d8d-4209-8163-fddc2cf11588
91fae77c-8278-4542-9795-8532d9744f02
b6316593-a6e9-4953-a452-4430ee977682
```

### 4-2. 다른 반 소속 학생 (10명, `01a04740` 활동에만 포함)

```
030adc12-8c73-498f-bc02-0dd17be45e14
0c6d33a0-f05e-4887-a473-1766243cb5e0
3771fa17-f30f-46e0-a8d4-75bb56e86b49
45ef1e11-04a4-4547-a590-c790fba6cbf2
804862a1-c257-4365-9717-9d3ed2a0b6c1
9838a218-3f87-4b8e-a5bc-b4c7bf84e087
c572162d-3977-4a7f-b7f5-b782855072b5
cae7bd4f-0ca0-4bea-bb7d-94a1f7a75fb8
f0a64470-6b59-4d37-a984-a87af0a92561
f5ed2116-1871-4dfb-a065-a25189bd2e66
```

---

## 5. 예시 1 — `GET /api/v1/activities/progress` (묶음 조회)

### 5-1. 요청

```
GET /api/v1/activities/progress?availability=OPEN&optFilter=classId%3Alike%3A7f6c97874b0f4c308b4357cd1a0ba2c6
```

### 5-2. 현재 응답 (문제)

- `activityCount`: 7 — `classId`가 **포함된** 진행 중 활동 수 (정상)
- `notSubmittedStudentCount`: **19** — 다른 반 학생까지 포함 (비정상, 기대값 **9**)
- `activities[0..5]`: 해당 반 **단독** 배포 활동 → `assignedCount: 9` (정상)
- `activities[6]` (`01a04740-...`): **복수 반** 배포 활동 → `assignedCount: 19` (비정상, 기대값 **9**)

```json
{
  "activityId": "01a04740-f77a-7c20-9c9c-e2530930958b",
  "title": "초5_L4_Wrap Up",
  "assignedCount": 19,
  "submittedCount": 0,
  "notSubmittedCount": 19,
  "submitted": [],
  "notSubmitted": [
    "030adc12-8c73-498f-bc02-0dd17be45e14",
    "0c6d33a0-f05e-4887-a473-1766243cb5e0",
    "0cc9da95-bdca-4265-94bf-cc9cc8730290",
    "... (총 19명)"
  ]
}
```

`notSubmittedStudents`에도 다른 반 학생(`030adc12-...` 등)이 포함되어 `missingActivityIds`에 `01a04740-...`만 기록됩니다.

### 5-3. 기대 응답

`optFilter`에 지정한 `classId` 소속 학생만 집계·목록에 포함되어야 합니다.

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "activityCount": 7,
    "notSubmittedStudentCount": 9,
    "activities": [
      {
        "activityId": "01a04740-f77a-7c20-9c9c-e2530930958b",
        "title": "초5_L4_Wrap Up",
        "assignedCount": 9,
        "submittedCount": 0,
        "notSubmittedCount": 9,
        "submitted": [],
        "notSubmitted": [
          "0cc9da95-bdca-4265-94bf-cc9cc8730290",
          "13bed149-adb4-4295-90d4-c7b1432f8551",
          "21ae5f09-d175-4a65-a3a9-0bb5ada0d9d7",
          "2aa3fd02-2154-4ebc-bb14-29956cb9e8f3",
          "3a008cd2-4bc8-4553-94f2-280f22d79e46",
          "6ea13daf-7299-4394-9045-13f04b7cb301",
          "6ef37a26-2d8d-4209-8163-fddc2cf11588",
          "91fae77c-8278-4542-9795-8532d9744f02",
          "b6316593-a6e9-4953-a452-4430ee977682"
        ]
      }
    ],
    "notSubmittedStudents": [
      {
        "participant": "0cc9da95-bdca-4265-94bf-cc9cc8730290",
        "missingActivityIds": ["01a04740-f77a-7c20-9c9c-e2530930958b", "..."]
      }
    ]
  }
}
```

**집계 필드별 기대:**

| 필드 | 기대 |
| --- | --- |
| `assignedCount` | 해당 `classId` 소속 배정 학생 수 |
| `submittedCount` / `notSubmittedCount` | 위 학생 집합 기준 |
| `submitted` / `notSubmitted` | 위 학생 집합의 participant id만 |
| `notSubmittedStudents` | 위 학생 집합만, `missingActivityIds`도 해당 반 기준 |
| `notSubmittedStudentCount` | 위 목록 길이 |

---

## 6. 예시 2 — `GET /api/v1/activities/{activityId}/progress` (참여 현황)

대상 활동: `01a04740-f77a-7c20-9c9c-e2530930958b` (복수 반 배포, 전체 19명)

### 6-1. 요청

```
GET /api/v1/activities/01a04740-f77a-7c20-9c9c-e2530930958b/progress?optFilter=classId%3Alike%3A7f6c97874b0f4c308b4357cd1a0ba2c6
```

### 6-2. 현재 응답 (문제)

`optFilter` 없이 호출한 것과 동일하게 **19명 전체**가 내려옵니다.

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "assignedCount": 19,
    "startedCount": 1,
    "submittedCount": 0,
    "rows": [
      { "participant": "030adc12-8c73-498f-bc02-0dd17be45e14", "status": "NOT_STARTED" },
      { "participant": "0c6d33a0-f05e-4887-a473-1766243cb5e0", "status": "NOT_STARTED" },
      { "participant": "0cc9da95-bdca-4265-94bf-cc9cc8730290", "status": "NOT_STARTED" },
      {
        "participant": "13bed149-adb4-4295-90d4-c7b1432f8551",
        "status": "IN_PROGRESS",
        "participationId": "01a04741-51d1-748e-991c-e53c3d80c191",
        "attempt": 1,
        "gradingStatus": "NOT_APPLICABLE"
      },
      "... (총 19 rows)"
    ]
  }
}
```

- `030adc12-...` 등 **다른 반 학생**이 `rows`에 포함됨
- `assignedCount: 19`, `startedCount: 1` — 전체 반 합산

### 6-3. 기대 응답

`classId: 7f6c97874b0f4c308b4357cd1a0ba2c6` 소속 **9명만** 포함:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "assignedCount": 9,
    "startedCount": 1,
    "submittedCount": 0,
    "rows": [
      { "participant": "0cc9da95-bdca-4265-94bf-cc9cc8730290", "status": "NOT_STARTED" },
      {
        "participant": "13bed149-adb4-4295-90d4-c7b1432f8551",
        "status": "IN_PROGRESS",
        "participationId": "01a04741-51d1-748e-991c-e53c3d80c191",
        "attempt": 1,
        "gradingStatus": "NOT_APPLICABLE"
      },
      { "participant": "21ae5f09-d175-4a65-a3a9-0bb5ada0d9d7", "status": "NOT_STARTED" },
      { "participant": "2aa3fd02-2154-4ebc-bb14-29956cb9e8f3", "status": "NOT_STARTED" },
      { "participant": "3a008cd2-4bc8-4553-94f2-280f22d79e46", "status": "NOT_STARTED" },
      { "participant": "6ea13daf-7299-4394-9045-13f04b7cb301", "status": "NOT_STARTED" },
      { "participant": "6ef37a26-2d8d-4209-8163-fddc2cf11588", "status": "NOT_STARTED" },
      { "participant": "91fae77c-8278-4542-9795-8532d9744f02", "status": "NOT_STARTED" },
      { "participant": "b6316593-a6e9-4953-a452-4430ee977682", "status": "NOT_STARTED" }
    ]
  }
}
```

**집계 필드별 기대:**

| 필드 | 기대 |
| --- | --- |
| `assignedCount` | 필터된 반 소속 배정 학생 수 (9) |
| `startedCount` | 필터된 반 소속 중 `IN_PROGRESS` 이상 (1) |
| `submittedCount` | 필터된 반 소속 중 제출 완료 |
| `rows` | 필터된 반 소속 participant만 |

---

## 7. 예시 3 — `GET /api/v1/activities/{activityId}/statistics` (정오·점수 집계)

동일 활동 `01a04740-f77a-7c20-9c9c-e2530930958b` 기준.

### 7-1. 요청

```
GET /api/v1/activities/01a04740-f77a-7c20-9c9c-e2530930958b/statistics?optFilter=classId%3Alike%3A7f6c97874b0f4c308b4357cd1a0ba2c6
```

### 7-2. 현재 응답 (문제)

현재는 `optFilter` 파라미터를 받지 않거나, 받더라도 **전체 19명** 기준으로 집계합니다. (제출 0건이라 수치 차이는 없으나, 다른 반 학생의 응답이 포함되면 왜곡됩니다.)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "submittedCount": 0,
    "gradedParticipations": 0,
    "items": []
  }
}
```

### 7-3. 기대 동작 (제출 데이터가 있을 때)

가령 A반(9명) 3명·B반(10명) 5명이 제출했다면:

| | `optFilter` 없음 (현재) | `optFilter=classId:like:A` (기대) |
| --- | --- | --- |
| `submittedCount` | 8 | **3** |
| `gradedParticipations` | 8 | **3** |
| `items[].correctCount` 등 | 19명 전체 응답 기준 | **A반 9명** 응답만 기준 |

`optFilter`가 있으면 **해당 반 소속 학생의 participation만** 집계 대상에 포함해 주세요.  
제출 0건인 경우에도, 향후 데이터가 쌓였을 때 반 단위 UI가 올바르게 동작하려면 동일 규칙이 필요합니다.

---

## 8. 변경 요청 정리

1. **`optFilter=classId:like:{classId}` 적용 범위 확대**  
   활동 **포함 여부** 필터뿐 아니라, 응답의 **참여자 목록·집계 카운트**에도 동일하게 적용.

2. **복수 반 배포 활동 처리**  
   활동 시작 시 `options.classId`(또는 동등 필드)에 여러 반 id가 저장된 경우, `optFilter`로 지정한 반에 **실제 소속된 학생만** participant로 간주.

3. **3개 API 일관성**  
   `/activities/progress`, `/activities/{id}/progress`, `/activities/{id}/statistics` 모두 동일한 `optFilter` 규칙·집계 기준.

4. **`optFilter` 미전달 시**  
   기존과 같이 활동 전체 참여자 기준(하위 호환).

---

## 9. FE 후속 작업 (참고)

백엔드 반영 후 FE에서 아래 연동 예정입니다.

- `getActivityProgress(activityId, { optFilter })` — `classId` 전달
- `getActivityStatistics(activityId, { optFilter })` — `classId` 전달
- `useActivityProgressQuery` / `useActivityStatisticsQuery` — 선택된 반 `classId`를 queryKey·파라미터에 반영

---

## 10. 확인 방법

1. `classId: 7f6c97874b0f4c308b4357cd1a0ba2c6`(9명)으로 §5 요청 → `01a04740-...` 활동의 `assignedCount`가 **9**인지
2. 동일 `classId`로 §6 요청 → `rows`가 **9건**이고 다른 반 participant id가 없는지
3. 제출 데이터가 있는 활동으로 §7 요청 → `submittedCount`·`items`가 **해당 반 학생만** 기준인지
4. 단일 반 배포 활동(§5의 `activities[0..5]`)은 **기존과 동일**하게 9명 집계 유지(회귀 없음)
