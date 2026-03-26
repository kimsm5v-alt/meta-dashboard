# 2. 사용자 플로우 & 데이터 흐름

> 화면 간 연결과 데이터 흐름을 시나리오 기반으로 정리  
> 최종 수정일: 2026-03-11

---

## 범례

- 🔵 기존 API (AIDT 백엔드)
- 🟢 신규 API (신규 개발 필요)
- 🟡 Gemini AI (현재 프론트엔드 직접 호출 → 백엔드 호출로 변경 필요)

---

## 1. 전체 서비스 플로우

```
┌──────────────────────────────────────────────────────────────────┐
│                        교사 (Teacher)                            │
│                                                                  │
│  ① 그룹 생성 → ② 검사 생성 → ③ 검사 종료 → ④ 결과 분석 → ⑤ 개입  │
│     /groups      /assessment    /assessment   /dashboard    /schedule │
│                                      │                     /ai-room  │
│                                      ▼                              │
│                              ⑥ LPA 분류 실행                        │
│                              (검사 종료 시 트리거)                    │
└──────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │ 검사 응시
┌──────────────────────────────────────────────────────────────────┐
│                        학생 (Student)                            │
│                                                                  │
│  ⓐ QR 스캔 → ⓑ 그룹 가입 → ⓒ 검사 응시 → ⓓ 제출               │
│     /join/:code   /join/:code   /exam/:code    /exam/:code       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. 시나리오별 상세 플로우

### 시나리오 1: 학기초 세팅 (그룹 생성 → 학생 초대 → 검사 실시)

```
교사                          서버                          학생
 │                             │                             │
 ├─ POST /api/groups ─────────▶│ groups 테이블 생성           │
 │◀── inviteCode 반환 ────────┤ invite_code 자동 생성        │
 │                             │                             │
 │  QR/링크 공유 ─────────────────────────────────────────────▶│
 │                             │                             │
 │                             │◀── POST /api/groups/join ───┤
 │                             │ group_students 레코드 생성    │
 │                             │ (게스트 시 studentId 자동생성)│
 │                             ├── groupId, studentId 반환 ──▶│
 │                             │                             │
 ├─ GET /tc/start ────────────▶│ dgnssId 발급 (AIDT)         │
 │◀── dgnssId 반환 ───────────┤                              │
 │                             │                             │
 │  검사 QR 공유 ─────────────────────────────────────────────▶│
 │                             │                             │
 │                             │◀── GET /st/info ────────────┤
 │                             ├── dgnssResultId 반환 ───────▶│
 │                             │                             │
 │                             │◀── GET /st/start ───────────┤
 │                             ├── 문항 + omrIdx 반환 ───────▶│
 │                             │                             │
 │                             │◀── POST /st/answer (반복) ──┤
 │                             │                             │
 │                             │◀── POST /st/submit ─────────┤
 │                             │ 답안 확정, T점수 산출 (AIDT) │
 │                             │                             │
```

**단계별 데이터 생성:**

| 단계 | 생성 데이터 | 저장 위치 |
|------|-----------|----------|
| 그룹 생성 | group, invite_code | 🟢 신규 DB |
| 학생 가입 | student-group 매핑 | 🟢 신규 DB |
| 검사 생성 | dgnssId | 🔵 AIDT DB |
| 문항 로드 | omrIdx | 🔵 AIDT DB |
| 답안 저장 | 문항별 응답 (1~5) | 🔵 AIDT DB |
| 검사 제출 | T점수 38개 산출 | 🔵 AIDT DB |

---

### 시나리오 2: 검사 종료 → LPA 분류

**기존 AIDT와 신규 시스템의 핵심 연결 지점.**

```
교사                          서버                          
 │                             │                            
 ├─ GET /tc/end ──────────────▶│ 검사 종료 (AIDT)           
 │◀── 종료 확인 ──────────────┤                             
 │                             │                            
 │  === LPA 분류 트리거 ===    │                            
 │                             │                            
 ├─ GET /tc/stinfolist ───────▶│ 학생 목록 (AIDT)           
 │◀── studentId[] 반환 ───────┤                             
 │                             │                            
 │  (학생별 반복)               │                            
 ├─ GET /st/total/analysis ───▶│ 38개 T점수 (AIDT)          
 │◀── tScores[38] 반환 ───────┤                             
 │                             │                            
 ├─ POST /api/lpa/classify-batch ▶│                          
 │  {                          │ LPA 분류 실행:              
 │    dgnssId, round,          │  1. 38개 T점수 → 유형 분류  
 │    schoolLevel,             │  2. 11개 중분류 평균 산출    
 │    students: [              │  3. 유형별 확률 계산         
 │      { studentId, tScores } │                             
 │    ]                        │ lpa_classifications 저장    
 │  }                          │                             
 │◀── 분류 결과 반환 ─────────┤                             
```

**⚠️ 백엔드 협의 필요:**

| 항목 | 방식 A (프론트 트리거) | 방식 B (백엔드 자동) |
|------|----------------------|---------------------|
| 흐름 | 프론트가 AIDT에서 T점수 조회 → 신규 API로 분류 요청 | 백엔드가 검사 종료 감지 → 자동 T점수 조회 + 분류 |
| 복잡도 | 프론트 순차 호출 | 백엔드 이벤트 처리 |
| 의존성 | 없음 | 백엔드가 AIDT API 접근 필요 |
| 권장 | MVP에서 간단 | 장기적으로 안정적 |

---

### 시나리오 3: 대시보드 드릴다운 (L1 → L2 → L3)

```
교사                          서버                          
 │                             │
 │  ── L1: /dashboard ──       │
 │                             │
 ├─ GET /api/groups ──────────▶│ 🟢 그룹 목록
 ├─ GET /tc/info ─────────────▶│ 🔵 그룹별 검사 정보
 ├─ GET /api/lpa/classes/:id ─▶│ 🟢 그룹별 LPA 유형 분포
 ├─ GET /tc/analysis ─────────▶│ 🔵 그룹별 학급 평균 T점수
 │◀── 4개 응답 조합 ──────────┤
 │                             │
 │  ▼ 반 카드 클릭             │
 │                             │
 │  ── L2: /dashboard/class/:classId ──
 │                             │
 ├─ GET /tc/stinfolist ───────▶│ 🔵 학생 목록 + 신뢰도
 ├─ GET /api/lpa/classes/:id ─▶│ 🟢 학급 LPA 결과 (1차/2차)
 ├─ GET /tc/analysis ─────────▶│ 🔵 학급 평균 T점수
 ├─ GET /tc/need ─────────────▶│ 🔵 관심 필요 학생
 │◀── 4개 응답 조합 ──────────┤
 │                             │
 │  ▼ 학생 행 클릭             │
 │                             │
 │  ── L3: /dashboard/class/:classId/student/:studentId ──
 │                             │
 ├─ GET /st/total/analysis ───▶│ 🔵 38개 T점수
 ├─ GET /api/lpa/students/:id ▶│ 🟢 LPA 분류 결과
 ├─ GET /api/ai-cache ────────▶│ 🟢 AI 총평 캐시
 │   (캐시 미스 시)             │
 │   ├─ Gemini API ───────────▶│ 🟡 AI 총평 생성
 │   ├─ POST /api/ai-cache ───▶│ 🟢 캐시 저장
 │                             │
 │  우측 패널:                  │
 ├─ GET /api/school-records/student/:id ──▶│ 🟢 생활기록부
 ├─ GET /api/unified-counseling/student/:id ▶│ 🟢 상담 이력
 ├─ GET /api/memos/student/:id ─────────▶│ 🟢 관찰 메모
 │                             │
```

**L2 학생 테이블 — 데이터 조합 (프론트에서 합침):**

| 칼럼 | 데이터 출처 |
|------|-----------|
| 번호 | 🔵 stinfolist → rowNum |
| 이름 | 🟢 group_students 또는 🔵 stinfolist |
| 1차 유형 | 🟢 lpa/classes → round1.predictedType |
| 1차 상태 | 🔵 stinfolist → reaction/desirable/repeatResponse |
| 변화 | 🟢 round1 vs round2 유형 비교 (프론트 계산) |
| 2차 유형 | 🟢 lpa/classes → round2.predictedType |
| 2차 상태 | 🔵 stinfolist + 🔵 tc/need → 관심 필요 플래그 |

---

### 시나리오 4: 상담 기록 라이프사이클

상담 상태 흐름:
```
scheduled (예정) ──┬──▶ completed (완료)
                   └──▶ 삭제 (DELETE)
```

#### 4-1. 상담 조회 → 새 상담 등록

```
교사                          서버
 │                             │
 │  ── /schedule 진입 ──       │
 │                             │
 ├─ GET /api/unified-counseling ──▶│ 🟢 전체 상담 목록 조회
 │◀── UnifiedCounselingRecord[] ──┤
 │                             │
 │  캘린더에서 날짜 선택        │
 │  + 등록 모달 작성            │
 │                             │
 ├─ POST /api/unified-counseling ─▶│ 🟢 상담 기록 생성
 │  { students: [{id, name,   │ status = "scheduled"
 │      number, classId}],     │
 │    classId,                 │
 │    scheduledAt,             │ (YYYY-MM-DD HH:mm)
 │    types: ['regular'|       │
 │      'urgent'|'follow-up'|  │
 │      'initial'],            │
 │    areas: ['academic'|      │
 │      'emotion'|'peer'|...], │
 │    methods: ['face-to-face'|│
 │      'phone'|'video'|       │
 │      'group'],              │
 │    reason }                 │
 │◀── 생성된 record 반환 ──────┤
 │                             │
```

#### 4-2. 상담 조회 → 기록 남기고 완료 처리

```
교사                          서버
 │                             │
 │  ── /schedule 진입 ──       │
 │                             │
 ├─ GET /api/unified-counseling ──▶│ 🟢 전체 상담 목록 조회
 │◀── records[] ──────────────┤
 │                             │
 │  예정(scheduled) 상담 클릭   │
 │  + 완료 모달에서 기록 입력   │
 │                             │
 ├─ POST /api/unified-counseling/:id/complete ─▶│ 🟢 완료 처리
 │  { duration: 30,            │ status → "completed"
 │    summary: "상담 내용...",  │ duration, summary, nextSteps 저장
 │    nextSteps: "후속 조치..." │ updatedAt 갱신
 │  }                          │
 │◀── 완료된 record 반환 ──────┤
 │                             │
```

#### 4-3. 상담 조회 → 기존 상담 변경 (일자, 내용, 유형 등)

```
교사                          서버
 │                             │
 │  ── /schedule 진입 ──       │
 │                             │
 ├─ GET /api/unified-counseling ──▶│ 🟢 전체 상담 목록 조회
 │◀── records[] ──────────────┤
 │                             │
 │  기존 상담 클릭              │
 │  + 수정 모달에서 변경        │
 │                             │
 ├─ PATCH /api/unified-counseling/:id ─▶│ 🟢 부분 수정
 │  { scheduledAt?: "...",     │ 변경된 필드만 업데이트
 │    types?: [...],           │ updatedAt 갱신
 │    areas?: [...],           │
 │    methods?: [...],         │
 │    students?: [...],        │
 │    reason?: "..." }         │
 │◀── 수정된 record 반환 ──────┤
 │                             │
```

#### 4-4. 상담 조회 → 기존 상담 삭제 (취소)

```
교사                          서버
 │                             │
 │  ── /schedule 진입 ──       │
 │                             │
 ├─ GET /api/unified-counseling ──▶│ 🟢 전체 상담 목록 조회
 │◀── records[] ──────────────┤
 │                             │
 │  기존 상담 클릭              │
 │  + 삭제 확인                 │
 │                             │
 ├─ DELETE /api/unified-counseling/:id ─▶│ 🟢 상담 삭제
 │◀── 204 No Content ─────────┤
 │                             │
```

**상담 데이터가 사용되는 곳:**

| 화면 | 용도 | API |
|------|------|-----|
| `/schedule` | 캘린더, CRUD | GET /api/counseling |
| L3 학생 대시보드 우측 패널 | 학생별 이력 | GET /api/counseling/student/:id |
| `/ai-room` | RAG 컨텍스트 (최근 5건) | GET /api/counseling/student/:id |
| `/counseling-dashboard` (Phase 2) | 통계 | GET /api/counseling |

**상담 타입 참고:**

| 분류 | 값 | 라벨 |
|------|-----|------|
| 유형 (types) | regular, urgent, follow-up, initial | 정기, 긴급, 후속, 초기 |
| 영역 (areas) | academic, career, peer, family, emotion, behavior, health, other | 학업, 진로, 교우관계, 가정, 정서·심리, 행동, 건강, 기타 |
| 방법 (methods) | face-to-face, phone, video, group | 대면, 전화, 화상, 집단 |
| 상태 (status) | scheduled, completed | 예정, 완료 (취소 시 삭제) |

---

### 시나리오 5: AI 총평 생성 & 캐시

```
교사                     프론트엔드                    서버
 │                         │                            │
 │  L3 대시보드 진입        │                            │
 │ ────────────────────────▶│                            │
 │                         ├─ GET /api/ai-cache ────────▶│ 캐시 확인
 │                         │                            │
 │                    캐시 히트 → 즉시 표시               │
 │                    캐시 미스 ↓                        │
 │                         │                            │
 │                         │  subcategoryAverages       │
 │                         │  (LPA 결과에서 가져옴)      │
 │                         │                            │
 │                         ├─ Gemini API ──────────────▶│ 🟡 AI 생성
 │                         │◀── 응답 ──────────────────┤
 │                         ├─ POST /api/ai-cache ──────▶│ 🟢 캐시 저장
 │                         │                            │
 │◀── AI 총평 표시 ────────┤                            │
```

**캐시 무효화 조건:**
- 해당 학생의 검사 결과 변경 (재검사)
- LPA 재분류 실행
- 수동 무효화 요청

---

### 시나리오 6: AI 어시스턴트 RAG 컨텍스트 조립

```
교사                     프론트엔드                    서버
 │                         │                            │
 │  AI Room 진입            │                            │
 │  "개별 학생" 모드 선택    │                            │
 │ ────────────────────────▶│                            │
 │                         │  === RAG 컨텍스트 수집 (병렬) ===
 │                         ├─ GET /st/total/analysis ───▶│ 🔵 38개 T점수
 │                         ├─ GET /api/lpa/students/:id ▶│ 🟢 LPA 결과
 │                         ├─ GET /api/unified-counseling/student/:id ▶│ 🟢 상담 5건
 │                         ├─ GET /api/memos/student/:id ──────▶│ 🟢 메모 5건
 │                         ├─ GET /api/school-records/student/:id ▶│ 🟢 생기부
 │                         │◀── 5개 응답 ──────────────┤
 │                         │                            │
 │                         │  조립 + PII 마스킹          │
 │                         │                            │
 │  질문 입력               │                            │
 │ ────────────────────────▶├─ Gemini API ─────────────▶│ 🟡 응답
 │◀── 답변 ────────────────┤                            │
```

**모드별 RAG 컨텍스트:**

| 데이터 소스 | 전체 | 반별 | 개별 |
|-----------|:----:|:----:|:----:|
| 38개 T점수 | — | — | ✅ |
| 1차↔2차 변화 | — | — | ✅ |
| LPA 분류 결과 | — | — | ✅ |
| 4단계 진단 결과 (공부마음/자원/기술/학습유형) | — | — | ✅ |
| 상담 기록 (최근 5건) | — | — | ✅ |
| 관찰 메모 (최근 5건) | — | — | ✅ |
| 생활기록부 문구 | — | — | ✅ |
| 학급 프로필 (강점/약점 TOP3) | ✅ | ✅ | — |
| 관심 필요 학생 | — | ✅ | — |
| 상담 현황 (완료/예정) | ✅ | ✅ | — |

---

### 시나리오 5: 교육 자료실 (Phase 2)

> Phase 2에서 추가 예정. 기획 확정 시 작성.

---

### 시나리오 6: 교사 커뮤니티 (Phase 2)

> Phase 2에서 추가 예정. 기획 확정 시 작성.

---

## 3. 기존 AIDT ↔ 신규 시스템 연결 맵

```
┌─────────────────────────────────────────────────────────┐
│                    기존 AIDT 시스템                       │
│                                                          │
│  검사 관리        학생 T점수         학급 분석             │
│  (dgnssId)       (38개 T점수)       (학급 평균)           │
│  /tc/info        /st/total/analysis  /tc/analysis        │
│  /tc/start                                               │
│  /tc/end         학생 목록           관심 필요             │
│  /tc/detail      /tc/stinfolist     /tc/need              │
└──────────┬──────────────┬──────────────┬─────────────────┘
           │              │              │
     dgnssId 참조    T점수 입력     학급 데이터 참조
           │              │              │
┌──────────▼──────────────▼──────────────▼─────────────────┐
│                    신규 시스템                             │
│                                                          │
│  그룹 관리        LPA 분류           상담/메모/생기부       │
│  (groups)        (lpa_classifi-     (counseling_records)  │
│                   cations)          (observation_memos)   │
│                  T점수 받아          (school_records)      │
│                  유형 분류 후 저장                         │
│                                     AI 캐시               │
│                                     (ai_summary_cache)    │
└──────────────────────────────────────────────────────────┘
```

**핵심 연결 키:**

| 키 | 설명 | 사용처 |
|----|------|--------|
| student_id (stdtId) | AIDT 학생 ID | 모든 신규 테이블에서 참조 |
| dgnss_id | AIDT 검사 세션 ID | lpa_classifications, ai_summary_cache |
| cla_id | AIDT 학급 ID | groups 테이블 선택 연동 |
| teacher_id (tcId) | AIDT 교사 ID | groups, counseling 등 |

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| 1. 서비스 정의 & IA | 전체 그림, 도메인 지식, IA |
| 3. 화면별 상세 명세 | 화면 20개의 기능/데이터/API |
| 4. 데이터 구조 & API 정의 | DB 테이블 상세, 신규 API 스펙 |
