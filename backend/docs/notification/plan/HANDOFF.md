# 🤝 알림 기능 핸드오프 가이드

> 알림 기능 BE 구현(Phase 1)이 `feature/notification` 브랜치에 완료되어, FE 담당자 및 검사(EXAM) BE 담당자가 이어받는 시점의 진입점 문서.
>
> **최종 수정**: 2026-04-24

---

## 📌 현재 상태 한눈에

```
✅ 완료 (이 브랜치에 전부 커밋·푸시됨)
  - 도메인/매퍼/서비스/DTO/컨트롤러
  - SSE 스트림 + Heartbeat(30초) + Registry
  - 이벤트 리스너 4종 (T1/T2/S4/S5 — 그룹 영역)
  - 그룹 서비스 쪽 publishEvent 연결 완료
  - 90일 Retention 배치 (@Scheduled 매일 03:00 KST)
  - 로컬 테스터 페이지 (@Profile("local"))
  - API 명세·이벤트 설계 문서

⏳ 담당자 분리 — 아래 2명에게 전달
  1) 검사(EXAM) BE 담당자 → T3/T4/T5/T6/S1/S2/S3/S6 이벤트 연동
  2) FE 담당자 → 벨/드롭다운/SSE 훅 UI 구현

🗓 Phase 2 (나중, BE 2대 이상 환경)
  - RedisDispatcher 구현 + Redis Pub/Sub
  - ShedLock (스케줄러 단일 실행 보장)
```

---

## 👥 대상별 "이것만 읽으세요"

### 🧑‍💻 검사(EXAM) BE 담당자

| 우선순위 | 문서 | 내용 |
|---|---|---|
| 1 | [`exam-integration-guide.md`](./exam-integration-guide.md) | **이것만 봐도 충분.** 이벤트 record 생성 + 리스너 메서드 + publishEvent 호출 패턴, 단계별 예시 |
| 2 | `../05-events.md` | T3~T6, S1~S3, S6 이벤트 문구·링크 템플릿 세부 |
| 3 | `com.vs.meta.api.group.service.GroupService` | 그룹 영역의 publishEvent 연동 실제 코드 (참고) |

**30초 요약**:
1. `ExamSubmittedEvent` 같은 record 만들기
2. `NotificationEventHandler` 에 `@TransactionalEventListener(AFTER_COMMIT) + @Transactional(REQUIRES_NEW)` 달린 메서드 추가
3. 검사 도메인 서비스에 `ApplicationEventPublisher` 주입하고 `publishEvent(...)` 한 줄 추가
4. 로컬 테스터로 확인 (`http://localhost:8081/dev/notification-tester` — 필요하면 debug 트리거 엔드포인트 추가)

---

### 🎨 FE 담당자

| 우선순위 | 문서 | 내용 |
|---|---|---|
| 1 | [`fe-api-contract.md`](./fe-api-contract.md) | **이것만 봐도 충분.** REST 5종 + SSE 1종, TypeScript 타입, SSE 구현 주의사항 |
| 2 | (실행) `http://localhost:8081/dev/notification-tester` | BE 로컬 기동 후 접속 — 실제 페이로드 눈으로 확인 |
| 3 | `prototype/src/features/notifications-mock/` | UI 디자인 레퍼런스 (구조 참고 X, 디자인만) |

**30초 요약**:
- API 5개 (`GET /notifications`, `/unread-count`, `POST /{id}/read`, `/read-all`) + SSE 1개 (`GET /stream`)
- FE는 userNo 전달 불필요 — JWT로 BE가 자동 식별
- SSE는 브라우저 기본 `EventSource` 대신 `@microsoft/fetch-event-source` 사용 (Bearer 헤더 필요)
- 수신 이벤트 타입: `connected` / `notification` / heartbeat

---

## 🧪 로컬 테스터 페이지 (양쪽 모두 유용)

BE를 `@Profile("local")` 로 기동하면:

```
http://localhost:8081/dev/notification-tester
```

### 기능

- JWT 입력 (SSO SDK 통해 받은 access token 붙여넣기)
- SSE Connect/Disconnect
- T1/T2/S4/S5/TEST 폼으로 이벤트 발화
- 실시간 수신 로그 (event type + JSON 페이로드)
- 알림 페이로드 구조 예시 표시

### 커버리지

**실제와 100% 동일**: 이벤트 publish 이후의 모든 경로 (리스너 → DB insert → SSE 전송)

**우회**: 상위 비즈 로직 (GroupService 호출 등)은 생략하고 이벤트 파라미터를 폼으로 직접 입력

> ⚠️ 검사 담당자가 T3/T4 등을 테스터로 확인하려면 `NotificationDebugController` 에 `fireT3` 등 동일 패턴으로 debug 엔드포인트 추가하면 됨. 30초 작업.

### 주의

- **운영/개발서버에서는 접속 불가** — 컨트롤러 자체가 `@Profile("local")` 이라 bean 미등록 → 404
- **JWT 필요** — 테스터 자체도 인증 경로를 타므로 FE에서 한 번 로그인한 후 토큰 복사 필요

---

## 🔑 주요 약속 사항 (양쪽 공통)

1. **AFTER_COMMIT 유지** — 리스너는 `@TransactionalEventListener(AFTER_COMMIT)` 필수. 본 업무 롤백 시 알림 발송 방지
2. **REQUIRES_NEW 유지** — 리스너 내부에 `@Transactional(propagation = REQUIRES_NEW)` 필수. 알림 insert/dispatch 완결
3. **문구 박제** — 이벤트 record에 렌더링 완성된 문자열(닉네임/그룹명/검사명 등)을 담아 전달, 리스너에서 `String.format` 으로 조립하여 `content` 컬럼에 저장
4. **게스트 (userNo == null) 스킵** — 인앱 알림 불가. 이벤트 발행 단계에서 필터링
5. **에러 로깅** — catch 블록은 `log.warn("메시지", ex)` 로 **Throwable을 마지막 인자로 넘길 것** (스택트레이스 보존). `ex.getMessage()` 만 찍지 말 것

---

## 📁 전체 문서 구조

```
backend/docs/notification/
├── README.md              ← 알림 기능 전반 개요
├── 01-spec.md             ← 기획 스펙 원본
├── 02-tech-decisions.md   ← 기술 결정 기록 (SSE vs WebSocket 등)
├── 03-data-model.md       ← 데이터 모델 (notification 테이블)
├── 04-api.md              ← API 상세 설계
├── 05-events.md           ← 이벤트별 문구/링크 템플릿 ★
├── 06-checklist-be.md     ← BE 체크리스트
├── 07-checklist-fe.md     ← FE 체크리스트
├── 08-checklist-infra.md  ← 인프라 체크리스트
├── 09-open-questions.md   ← 미정 이슈
├── 10-roadmap.md          ← 로드맵
├── ddl/
│   ├── notification.sql   ← 테이블 DDL
│   └── shedlock.sql       ← Phase 2용 ShedLock 테이블 DDL
└── plan/
    ├── README.md
    ├── HANDOFF.md                   ← ★ 지금 이 파일 (진입점)
    ├── environment-strategy.md      ← 환경별 전략
    ├── phase-1-mvp.md               ← Phase 1 구현 계획
    ├── phase-2-scale.md             ← Phase 2 계획 (Redis + ShedLock)
    ├── task-board.md                ← 진행 보드
    ├── milestones.md                ← 마일스톤
    ├── fe-api-contract.md           ← ★ FE 담당자용
    └── exam-integration-guide.md    ← ★ 검사 담당자용
```

---

## 💬 질문/이슈 발생 시

- 알림 기능 전반 문의: 알림 기능 담당자 (이 브랜치 커밋 이력 참고)
- 계획 변경 발생 시 `task-board.md` 에 반영
- 운영/배포 단계 이슈는 `10-roadmap.md` 에 추가
