# 생활기록부 AI 문구 생성 — 구현계획서

> 대상: `agent/` (FastAPI AI 에이전트)
> 목적: 프론트엔드가 전달한 학생 정보로 **행동특성 및 종합의견** 문구를 생성하는 API 2종 추가.
> 단건(학생별 작성)과 일괄(최대 10명 내외)을 **하나의 계약**으로 처리하고, 일괄은 SSE로 학생 단위 순차 응답한다.
> 기획 근거: `prototype/src/features/school-record/docs/기능정의서.md`, `prototype/docs/meta-test/09_생활기록부_기재정책.md`
> 프롬프트 자산 출처: `prototype/src/shared/data/aiPrompts.ts` (= `frontend/src/shared/data/aiPrompts.ts`에 이식본 존재)

---

## 0. 결론 먼저: 변화 범위

| 영역 | 변경 |
|---|---|
| `main.py` | **라우터 1줄 등록** — 기존 4개 엔드포인트/스키마는 변경 없음 |
| 신규 `app/routers/school_record.py` | 엔드포인트 2개 (단발 / SSE) |
| 신규 `app/services/school_record_service.py` | 생성 오케스트레이션 (tool-calling 없음) |
| 신규 `app/models/school_record.py` | 요청/응답/이벤트 스키마 |
| 신규 `app/core/school_record_policy.py` | 학교급·LPA 유형 가이드, T점수 레벨 변환 |
| 신규 `app/core/prompts/school_record_*.md` | 정책 지침 텍스트 (기획자 직접 수정 가능) |
| 신규 `app/utils/record_validator.py` | 금지어 2단 검증 · 분량 · 마크다운 제거 |
| `app/core/llm_router.py` | **변경 없음** — `router.acompletion()` 그대로 재사용 |
| `app/utils/pii_filter.py` | **변경 없음** — 이번 경로는 이름을 애초에 받지 않음 |
| `app/core/agent_graph.py` | **변경 없음** — 생기부 생성은 Tool 호출이 불필요하므로 그래프를 타지 않음 |

기존 `/chat`, `/chat/stream` 계약은 일절 건드리지 않는다. 청크 포맷(`{"text":…, "is_final":…}`)이 학생 단위 경계를 표현할 수 없어 별도 엔드포인트를 신설한다.

---

## 1. 확정된 설계 결정

사전 분석에서 도출된 5개 쟁점을 아래 권장안으로 확정한다.

| # | 결정 | 값 | 근거 |
|---|---|---|---|
| 1 | 문구 분량 | **200~300자 / 3문장** | 정책은 *연간* 1,500B(≈500자). 1회 생성분이 연간 한도를 다 쓰면 교사가 다른 항목을 못 붙임. 신 기획 화면의 결과 박스·CSV 톤과도 맞음 |
| 2 | 출력 포맷 | **plain text** | `getSchoolRecordPrompt`의 JSON 강제(`generatedText/wordCount/…`)는 토큰 스트리밍과 정면 충돌. `wordCount` 등 파생값은 서버가 계산 |
| 3 | 고등학생 | `predictedType == '미지원'` **명시 분기** | 고등은 LPA 미제공(`types/index.ts:14`). 현재 `TYPE_WRITING_GUIDES`에 키가 없어 fallback으로 '안전 균형형' 가이드가 잘못 붙음 |
| 4 | 금지어 | **2단 — 차단 5종 / 경고 N종** | `PROHIBITED_KEYWORDS`는 `'점수'`, `'못함'`, `'부족함'`, `'고등학교'` 등 부분문자열 오탐이 확실. 차단은 정규식 5종만, 나머지는 `warnings[]`로 교사 판단에 위임 |
| 5 | 성장 서사 | **2차 검사 있을 때만 조건부** | 정책 §6.1-6은 "반드시 포함"이나 2차 미완료 학급이 섞임. 데이터가 없으면 해당 지시를 프롬프트에서 제외 |

추가 확정 사항:

- **T점수 원문은 LLM에 보내지 않는다.** `매우높음/높음/보통/낮음/매우낮음` 5단계 레벨로만 변환해 전달하고, 변환은 **agent가 수행**한다(임계값 70/60/40/30 변경 시 프론트 재배포 불필요).
- **학생 이름·학번은 요청 스키마에 없다.** 마스킹이 아니라 미전송. 생기부 문구는 주어를 생략하므로 이름이 필요 없다.
- **요인 메타(38개 정의·관찰질문·추천행동)와 상황·행동 목록은 agent가 보유한다.** 프론트는 교사가 *선택한 결과*(요인명·행동 문자열)만 보낸다.

---

## 2. API 명세

### 2-1. 공통 요청 스키마 (`app/models/school_record.py`)

```python
SchoolLevelCode = Literal["elementary", "middle", "high"]
GenerationSource = Literal["TEST_ONLY", "COMMON_CONTEXT", "INDIVIDUAL_OBSERVATION"]
RecordAction = Literal["generate", "rewrite", "shorten", "expand"]

class ObservationEntry(BaseModel):
    factor: str                       # 38 소분류 요인명 (예: "자기효능감")
    type: Literal["strength", "improvement"]
    behavior_codes: list[str] = []    # 교사가 체크한 추천 행동 문장

class ObservationInput(BaseModel):
    observations: list[ObservationEntry] = []
    free_text: str = ""               # 구체적 장면 (최대 100자)
    counseling_notes: list[str] = []   # 상담·관찰 기록 summary 원문 (id 아님)

class CommonContext(BaseModel):
    situation_code: str               # CLASS_PARTICIPATION 등 8종
    activity_text: str = ""
    behaviors: list[str] = []

class FactorLevel(BaseModel):
    name: str
    t_score: float                    # agent가 레벨로 변환 후 폐기. LLM 미전달
    is_positive: bool

class RecordStudentInput(BaseModel):
    student_id: str                   # PII 아님. 이름·학번은 받지 않는다
    lpa_type: str                     # '미지원' 가능
    type_confidence: float | None = None
    strengths: list[FactorLevel]      # TOP3
    improvements: list[FactorLevel]   # TOP3
    mid_category_scores: dict[str, float] | None = None   # 11 중분류
    round2_available: bool = False
    round_changes: list[RoundChange] = []   # 성장 서사용 (2차 있을 때만)
    observation: ObservationInput | None = None
    previous_text: str | None = None  # action='rewrite' 시 회피 대상

class RecordGenerateRequest(BaseModel):
    session_id: str
    class_id: str
    school_level: Literal["초등", "중등", "고등"]
    school_level_code: SchoolLevelCode | None = None   # 생략 시 school_level에서 유도
    grade: int
    source: GenerationSource
    action: RecordAction = "generate"
    common_context: CommonContext | None = None
    stream_tokens: bool = False
    students: list[RecordStudentInput]        # 1명이든 10명이든 동일
```

> `school_level`이 고등을 '중등'으로 뭉개므로(`frontend/src/shared/types/index.ts:28-34`) `school_level_code`를 별도로 받는다. 둘이 충돌하면 `school_level_code`가 우선한다. **고정 기본값을 두지 않는다** — 생략 시 `school_level`에서 유도한다(초기 구현의 `"elementary"` 기본값은 중등·고등 요청에서 필드를 빠뜨리면 오류 없이 초등 문체를 적용해 버렸다).

**422로 거르는 조합** — 조용히 잘못된 결과를 내는 입력은 검증에서 막는다.

| 조건 | 이유 |
|---|---|
| `students` 0개 또는 31개 이상 | 한 반 정원 기준 |
| `source='COMMON_CONTEXT'`인데 `common_context` 없음 | 교사가 입력한 학급 활동이 통째로 누락된 문구가 나온다 |
| `students`에 중복 `student_id` | 클라이언트가 결과를 학생에 매핑할 때 혼선 |

### 2-2. `POST /school-record/generate` — 단발

전체 생성 완료 후 한 번에 반환한다. 재시도·배치·테스트에서 쓴다. 내부 동시성은 스트리밍과 동일하다(§3-1) — 순차로 돌리면 10명 요청이 학생 수에 비례해 길어져 게이트웨이 타임아웃에 걸린다.

```json
{
  "results": [
    { "student_id": "s1", "text": "...", "char_count": 214,
      "warnings": [{ "match": "학원", "label": "사교육 기관" }] }
  ],
  "succeeded": 10, "failed": 0
}
```

### 2-3. `POST /school-record/generate/stream` — SSE

```
data: {"type":"start","total":10}
data: {"type":"student_start","index":0,"student_id":"s1"}
data: {"type":"token","index":0,"student_id":"s1","text":"수업 시간에 "}
data: {"type":"student_done","index":0,"student_id":"s1","text":"<전문>","char_count":214,"warnings":[]}
data: {"type":"student_error","index":3,"student_id":"s4","message":"문구를 생성하지 못했습니다."}
data: {"type":"ping"}
data: {"type":"done","succeeded":9,"failed":1}
```

- `type` 필드가 학생 경계를 표현한다. 프론트는 **파서 하나로 단건·일괄을 모두 처리**한다(단건은 `index`가 항상 0).
- `token`은 `stream_tokens=true`일 때만 발생한다. 프로토타입 진행 UI는 대기/생성 중/완료 3상태만 쓰므로 일괄에서는 기본 off.
- **`student_error`는 스트림을 끊지 않는다.** 10명 중 1명 실패로 나머지 9명을 버리지 않는 것이 이 설계의 핵심 요구사항이다.
- 학생 1명당 타임아웃 **30초**. 초과 시 해당 학생만 `student_error`. **두 경로 모두**에 적용된다 — 토큰 스트리밍 경로는 토큰 루프 자체를 타임아웃으로 묶고, 타임아웃은 소비 속도가 아니라 생성 시간에만 걸리도록 생산자 쪽에 둔다.
- `ping`은 15초 간격 heartbeat다. 토큰이 흐르는 동안에는 그 자체가 keep-alive이므로 나가지 않고, 첫 토큰 전이나 스트림 도중 멎었을 때만 나간다. 학생 단위 처리라 이벤트 공백이 최대 30초까지 벌어지는데, 중간 프록시의 idle timeout이 그보다 짧으면 연결이 끊긴다. `/chat/stream`(토큰이 수십 ms 간격)과 성격이 다른 지점이라 경유 여부와 무관하게 넣는다. 응답 헤더에 `X-Accel-Buffering: no`도 함께 보낸다.
- `stream_tokens=true`일 때 `token`은 **후처리 이전의 원문**이다. 마크다운 제거·재생성이 반영된 최종본은 `student_done`의 `text`이므로 클라이언트는 그 값으로 교체해야 한다.

---

## 3. 생성 파이프라인

```
요청 → 검증 → [학생별] 프롬프트 조립 → LLM 호출 → 후처리 검증 → 이벤트 방출
                    │                                    │
         school_record_policy.py                 record_validator.py
         + prompts/*.md                          (금지어·분량·마크다운)
```

### 3-1. 순차 보장 + 선행 생성

요구사항은 "순차 **응답**"이지 순차 *생성*이 아니다. 10명 × 3초 = 30초를 그대로 기다릴 이유가 없다.

- `stream_tokens=False`: `asyncio.Semaphore(3)`으로 최대 3명을 동시에 생성하되, **index 순서대로만 방출**한다. 체감 대기가 1/3 수준으로 줄고 UX는 순차 그대로다.
- `stream_tokens=True`: 토큰이 순서대로 나와야 하므로 **선행 생성 없이 엄격히 순차** 처리한다.

### 3-2. 개별화 전략 (정책 §2.3 — 동일 문구 금지)

`COMMON_CONTEXT` 방식은 10명에게 같은 상황·행동을 적용하므로 입력이 거의 동일하다. 그대로 두면 정책 위반 문구가 나온다. 두 축으로 방어한다.

1. **문장 구조 패턴 라운드로빈** — 정책 §5.1의 3패턴(관찰-해석-발전 / 상황-행동-결과 / 변화 서사)을 `index % 3`으로 결정론적 배정. 선행 생성과 충돌하지 않는다.
2. **도입부 회피 (best-effort)** — 이미 완료된 학생들의 첫 어절을 다음 호출 프롬프트에 전달해 반복을 피하게 한다. 선행 생성 중인 건은 목록에 없을 수 있으나 완화 효과는 유효하다. **나열은 최근 5개로 제한한다** — 무제한으로 쌓으면 30명째 프롬프트에서 회피 지시가 본문 지시보다 비대해진다.

여기에 학생별 `strengths/improvements` 조합이 원래 다르므로 요인 서술은 자연히 갈라진다.

### 3-3. 프롬프트 조립

기존 `load_prompt()` 패턴(`app/core/prompts/`)을 그대로 쓴다. 기획자가 서버 재시작 없이 문구를 고칠 수 있다.

| 파일 | 내용 |
|---|---|
| `school_record_rules.md` | 5대 기재 원칙, 절대 금지사항, 출력 포맷(마크다운·특수문자 금지), 표현 치환표, 문장 구조 3패턴 |
| `school_record_level_elementary.md` | persona / style / focus / 권장 키워드 (초등) |
| `school_record_level_middle.md` | 〃 (중등) |
| `school_record_level_high.md` | 〃 (고등) |

Python 상수(`app/core/school_record_policy.py`)로 관리할 것:

- `SCHOOL_LEVEL_GUIDELINES` — `aiPrompts.ts:238`에서 이식
- `TYPE_WRITING_GUIDES` — `aiPrompts.ts`에서 이식 + **`'미지원'` 키 추가**(LPA 가이드 없이 검사 결과만으로 서술하도록 지시)
- `t_score_to_level()` — 70/60/40/30 임계값
- `SENTENCE_PATTERNS` — 3패턴 라운드로빈용

**시스템 프롬프트 = ** `school_record_rules.md` + 학교급 파일 + LPA 유형 가이드 + (2차 있을 때만) 성장 서사 지시 + 분량 지시(200~300자·3문장) + 배정된 문장 구조 패턴.

**user 메시지 =** `aiPrompts.ts:685`의 `buildSchoolRecordUserMessage` 구조를 Python으로 옮기되, **요인 체계를 38 소분류로 교체**한다(원본은 5대 영역 기준). 강점/보완 요인은 이름 + 레벨로, 관찰 입력은 요인별 블록으로, 상담·관찰 기록은 summary 원문으로 넣는다.

### 3-4. 후처리 검증 (`app/utils/record_validator.py`)

순서대로 적용한다.

1. **마크다운·특수문자 제거** — `**`, `###`, 선행 `-`, `1.` 번호매기기 제거(정책 §4.2). LLM이 어겨도 서버가 정리한다.
2. **차단 검증 (5종 정규식)** — `prototype/src/features/school-record/service.ts`의 `FORBIDDEN_PATTERNS` 기반. 공인어학시험 / 대회·수상 / 사교육 / 추측성 표현 / 비교·서열화. **적중 시 1회 재생성**, 재차 적중하면 `warnings`에 담아 그대로 반환(무한 루프 방지).
   원본을 그대로 쓰지 않고 세 패턴을 좁혔다 — 정책이 금지하는 것은 수상 *실적*이지 대회 참여 서술이 아니고, 원본의 맨 `대회`·`수상`·`학원`은 "체육대회 준비 과정에서 친구를 도움", "수상한 점을 살펴봄", "학원 같은 규칙적인 생활"을 모두 반려시켰다. 추측성 표현 `인 것 같음`도 "성실한 것 같음"을 놓쳐 `것 같[음다]`로 넓혔다.
3. **경고 검증** — `PROHIBITED_KEYWORDS` 계열은 `warnings[]`로만. 차단하지 않는다.
4. **분량** — 300자 초과 시 프롬프트에 축약 지시를 넣어 1회 재생성. 공백 제외 글자 수를 `char_count`로 반환(`countChars`와 동일 규칙).

재생성은 **학생당 최대 1회**로 제한한다. 10명 × 2회면 지연이 두 배가 된다.

---

## 4. 구현 단계

### Phase 1 — 스키마·정책 자산 (선행, 독립적)
- `app/models/school_record.py` 작성
- `app/core/school_record_policy.py` — `aiPrompts.ts`의 `SCHOOL_LEVEL_GUIDELINES` / `TYPE_WRITING_GUIDES` 이식, `'미지원'` 키 추가, `t_score_to_level()`
- `app/core/prompts/school_record_*.md` 4종 작성
- `app/utils/record_validator.py` + 단위 테스트

### Phase 2 — 생성 서비스
- `app/services/school_record_service.py`
  - `generate_one(student, ctx) -> RecordResult` — 프롬프트 조립 → `router.acompletion()` → 후처리
  - `generate_all(request) -> list[RecordResult]` — 단발용
  - `stream_all(request) -> AsyncIterator[Event]` — Semaphore + 순서 보장 방출, 학생 단위 예외 격리, 30초 타임아웃
- LangSmith `langsmith.trace(name="school-record-generate")` 연결 (기존 패턴 준용, 학생 수·source를 metadata에)

### Phase 3 — 엔드포인트
- `app/routers/school_record.py` — 엔드포인트 2개, SSE는 `StreamingResponse(media_type="text/event-stream")`
- `main.py`에 `app.include_router(school_record.router)` 1줄 추가

### Phase 4 — 검증
- `agent/tests/test_school_record.py` — validator 단위 테스트, 프롬프트 조립 스냅샷, **LLM을 mock한 이벤트 순서·에러 격리 테스트**(3번 학생만 예외를 던져도 나머지 9명이 완주하는지)
- `agent/tests/verify_streaming.py` 패턴을 따른 수동 검증 스크립트

---

## 5. 프론트엔드 연동 (별도 작업 — 계약만 확정)

agent는 **저장하지 않는다.** 프론트가 `student_done` 수신 시점마다 기존 [`schoolRecordApi.saveDraft`](../../frontend/src/features/school-record/api/schoolRecordApi.ts)를 호출한다. 중간 이탈해도 완료분이 보존되고, 백엔드가 정본이라는 현 아키텍처와 일치한다.

프론트에서 필요한 작업(이 계획서 범위 밖):

- `computeStudentProfile` 확장 — 현재 요인명 TOP3만 남기고 T점수 전체·중분류를 버리므로, 요청 조립에 필요한 값을 함께 반환하도록 수정
- SSE 파서 — `agentApiService.ts`는 `is_final` 기반이라 `type` 기반 파서가 별도로 필요. `@microsoft/fetch-event-source`가 이미 의존성에 있으므로 그쪽이 더 깔끔함
- `BulkGenerateSection`의 `progress`/`result` 단계 신규 구현 (현재 `AiGenerationNotice` 플레이스홀더 자리)
- `StudentWritingSection`의 문구 생성/다른 표현 버튼 연결

---

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 일괄 10명 문구가 서로 유사 | **정책 위반** (개별화 원칙) | §3-2 두 축 방어. Phase 4에서 10명 실제 생성 후 육안 검수 필수 |
| LLM이 마크다운·번호매기기 출력 | 나이스 입력 불가 | 서버 후처리로 강제 제거 (§3-4-1) |
| T점수 수치가 문구에 노출 | 정책 위반 | 애초에 LLM에 레벨만 전달 + 프롬프트 명시 금지 |
| 1명 실패로 전체 중단 | 교사 재작업 | 학생 단위 예외 격리 + 타임아웃 (§2-3) |
| 재생성 루프로 지연 폭증 | UX 저하 | 학생당 재생성 1회 상한 |
| 금지어 오탐으로 정상 문구 반려 | 기능 사용 불가 | 차단은 정규식 5종만, 나머지는 경고 (결정 #4) |

---

## 7. 선행 확인 사항

- **엔드포인트 경로** — agent 직접 호출(`ENV.AGENT_API_URL`)로 구현했다. 중개 서버(t-dj.vsaidt.com)는 이 저장소에 없는 외부 서비스라 경로 등록에 다른 팀 리드타임이 걸리는데, agent 쪽 산출물은 양쪽에서 동일하므로 여기에 블록될 이유가 없다. 프론트는 상수 하나로 전환 가능하다. `DELETE /chat/{id}`가 이미 중개를 거치지 않고 agent를 직접 호출하므로 경로별 혼용은 기존 관례이기도 하다.
- **⚠️ 운영 전환 전 인증 정리 필요** — agent에는 인증 미들웨어가 없다(`main.py`에 `CORSMiddleware`만 등록). 직접 호출로 운영에 나가면 학생 검사 결과·상담 기록 요약이 무인증 엔드포인트로 오간다. 기존 `/chat`도 같은 상태지만 이쪽이 페이로드 민감도가 높다.
- `midCategoryScores`가 실제 API 응답에서 채워지는지(스키마상 optional·nullable). 현재 요청 스키마에서는 사용하지 않으므로 착수를 막지는 않는다. 5대 영역 수준을 프롬프트에 넣으려면 그때 확인한다.

---

## 8. 범위 밖 (후속)

- 교사 선택 예시 문장(`OBSERVATION_PHRASES` 30문장 / `schoolRecordSentences.ts` 165문장) 선택 UI — 신 기획 화면에 해당 UI가 없다. 필요 시 agent 내부 few-shot 소재로만 활용
- 학기(semester) 구분 — 프론트 `Class`/`Student`에 필드 없음
- 생성 이력·버전 관리(백엔드 영역)

---

**작성 기준**: 사전 분석 보고 (프로토타입 기획·프롬프트 자산 / 프론트엔드 파라미터 가용성)
**상태**: **Phase 1~4 구현 완료 + 점검 결함 9건 수정 완료** (agent 직접 호출 경로). 테스트 27건 통과.
다음: 실제 LLM 키를 붙인 10명 생성 육안 검수(§6 최상단 리스크), 프론트 연동(§5), 운영 전 인증 정리(§7)

### 구현 중 계획과 달라진 점

1. `ping` heartbeat 이벤트 추가 — 학생 단위 처리라 이벤트 공백이 최대 30초까지 벌어져 중간 프록시 idle timeout에 걸릴 수 있다. 계획 작성 시 놓쳤던 항목.
2. 추측성 표현 정규식을 넓힘 — 원본(`service.ts`)의 `인 것 같음`은 "성실한 것 같음" 같은 흔한 형태를 놓친다. `것 같[음다]|것으로 보[임인]|듯 ?함`으로 교체.
3. 문장 구조 패턴 배정에 2차 검사 유무 반영 — "변화 서사" 패턴은 1·2차 비교 데이터가 있어야 사실 기반으로 쓸 수 있어, 2차가 없으면 후보에서 제외한다.

### 자체 점검에서 수정한 결함 (9건)

구현 후 자체 점검에서 발견해 모두 수정하고 회귀 테스트를 붙였다.

| # | 결함 | 조치 |
|---|---|---|
| 1 | `school_level_code` 고정 기본값 `elementary` — 중등·고등 요청에서 생략 시 **오류 없이 초등 문체 적용** | `school_level`에서 유도. 명시값 우선 |
| 2 | `action='shorten'`·`'expand'`가 `previous_text`를 전달받지 못해 백지에서 재생성 | 편집 계열 3종(`rewrite`/`shorten`/`expand`) 모두 직전 문구 전달, action별 라벨 부여 |
| 3 | 분량 지시 모순 — "세 문장으로 씁니다"와 "두 문장 이내로 줄입니다"가 동시 삽입 | 분량 지시를 action별로 분기하고, action 지시에서 문장 수 언급 제거 |
| 4 | `source='COMMON_CONTEXT'`인데 `common_context` 누락 시 조용히 통과 | 422 |
| 5 | `avoid_openings` 무제한 누적 (30명째 어절 29개, 294자) | 최근 5개로 제한 |
| 6 | 차단 정규식 오탐 — "체육대회 준비", "수상한 점", "학원 같은"이 반려됨 | 실적 표현만 잡도록 3개 패턴 축소 (§3-4-2) |
| 7 | LangSmith 추적에 생성 결과가 기록되지 않음 | `run_tree.end(outputs=...)` 호출 |
| 8 | `generate_all` 순차 처리 (10명 = 10초) | 스트리밍과 동일한 `Semaphore(3)` 적용 |
| 9 | `stream_tokens=true` 경로만 **타임아웃·heartbeat 없음** — LLM이 멎으면 무한 대기 | 토큰 루프를 30초 타임아웃으로 묶고, 정체 구간에 ping 방출. 두 경로가 공용 heartbeat 헬퍼를 쓰도록 정리 |

점검에서 **문제없음이 확인된 것**: 후처리가 실제 생기부 문체를 훼손하지 않음(원문 보존, 오탐 0), 클라이언트 조기 이탈 시 잔여 태스크 정상 취소(누수·미수거 예외 없음), 전원 실패 시 스트림 정상 종료, CORS 프리플라이트.
