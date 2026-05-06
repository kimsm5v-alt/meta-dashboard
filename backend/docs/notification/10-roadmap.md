# 10. 구현 로드맵

---

## 전체 공수

| 영역 | 공수 |
|---|---|
| **인프라** | 2d (Redis 연동 + LB/Nginx 설정 + 모니터링) |
| **BE — 기본 CRUD + 이벤트** | 5d |
| **BE — SSE + Redis Pub/Sub** | 3d |
| **BE — 스케줄러 + ShedLock** | 1.5d |
| **BE — 이메일 발송** | 1d |
| **FE — UI 컴포넌트** | 3d |
| **FE — SSE 클라이언트 + 재연결** | 2d |
| **FE — 딥링크/UX** | 1d |
| **통합 테스트 / QA** | 3d |
| **합계 (MVP)** | **약 21.5d (4~5주)** |

### 추가 공수 (MVP 포함 시)

| 기능 | 공수 |
|---|---|
| S4 이메일 초대 신규 개발 | +3d |
| S5 추방 UI 신규 개발 | +1d |
| S6 재검사 요청 신규 개발 | +2d |

---

## 단계별 진행

### Phase 0 — 선행 작업 (1주)

**병렬 진행:**

- 인프라 팀
  - [ ] Redis 인스턴스 준비
  - [ ] LB idle timeout 설정
  - [ ] Nginx 설정 변경
- 기획자/PO
  - [ ] 기획자 확인 필요 항목 답변 수집 (S4/S5/S6/T6/S3/C1)
  - [ ] 법무 검토 요청
- 개발팀
  - [ ] DB 마이그레이션 스크립트 작성
  - [ ] 기술 스택 최종 확인 (React Query, fetch-event-source 등)

**Blocker**: 기획/법무 답변. 없으면 일부 이벤트는 MVP 제외.

---

### Phase 1 — 기반 (1.5주)

**목표**: 알림 CRUD + 즉시 발생 이벤트 몇 가지 동작

**BE:**
- [ ] `notification`, `shedlock` 테이블 생성
- [ ] `NotificationService` + `NotificationMapper`
- [ ] REST API 4종 (`list`, `unread-count`, `read`, `read-all`)
- [ ] `NotificationEventHandler` + T1 (그룹 가입) 이벤트 연동
- [ ] `GroupService.joinGroup` 훅 추가

**FE:**
- [ ] API 클라이언트 (`notificationApi.ts`)
- [ ] React Query 훅 (폴링 fallback 모드)
- [ ] `NotificationBell` + `NotificationPanel` 기본 UI
- [ ] `MainLayout` / `StudentLayout` Header 통합

**검증:**
- 학생 그룹 가입 → 교사 목록에 T1 알림 표시 (폴링 30초 내)

---

### Phase 2 — SSE 적용 (1주)

**목표**: 실시간 알림 동작

**BE:**
- [ ] `SseEmitterRegistry`
- [ ] `NotificationStreamController` (`/stream`)
- [ ] Heartbeat 스케줄러
- [ ] Redis Pub/Sub 연동
- [ ] `NotificationPubSubBridge`
- [ ] 기존 이벤트 리스너에 `publish()` 추가

**FE:**
- [ ] `fetch-event-source` 연동
- [ ] `useNotificationStream` 훅
- [ ] 재연결 로직 (지수 백오프)
- [ ] 토큰 refresh 통합
- [ ] Fallback 폴링 전환 로직

**검증:**
- 서버 A에 연결된 사용자 → 서버 B에서 발생한 이벤트 수신 (다중 인스턴스)
- 네트워크 끊김 후 자동 재연결
- 롤링 배포 시 재연결 정상 동작

---

### Phase 3 — 이벤트 확장 + 스케줄러 (1주)

**목표**: 나머지 이벤트 연동 + 배치 작업

**BE:**
- [ ] T2 (탈퇴), T3 (제출), T4 (전원 완료) 이벤트 연동
- [ ] S1 (검사 배정) 이벤트 연동
- [ ] S3 (결과 공개) 이벤트 연동 (⚠️ 공개 로직 확정 후)
- [ ] S5 (추방), S6 (재검사) — 기능 존재 여부 따라 스킵 or 추가
- [ ] T5 / S2 리마인더 스케줄러 + ShedLock
- [ ] 90일 삭제 스케줄러

**FE:**
- [ ] 카테고리별 섹션 UI
- [ ] "모두 읽음" 버튼 (9개 이상 활성화)
- [ ] 상대 시간 표시
- [ ] 낙관적 업데이트 mutation

**검증:**
- 각 이벤트별 시나리오 테스트
- 스케줄러 ShedLock 동작 (2대 중 1대만 실행)

---

### Phase 4 — 외부 채널 (0.5주)

**목표**: 이메일 발송

**BE:**
- [ ] C1 회원가입 축하 메일 (⚠️ Auth 서버 중복 확인 후)
- [ ] S4 이메일 초대 (⚠️ 신규 개발 결정 시)

**검증:**
- 메일 수신 확인
- 템플릿 렌더링

---

### Phase 5 — QA / 안정화 (0.5주)

- [ ] 통합 테스트
- [ ] 다중 인스턴스 시나리오 검증
- [ ] 성능 테스트 (동접 500명 SSE 유지 시 메모리/CPU)
- [ ] 장애 복구 시나리오 (Redis 다운, BE 재시작)
- [ ] 보안 검증 (타인 알림 읽음 처리 차단 등)

---

## 배포 전략

### 무중단 배포

- Phase 1~2 구현 후 개발서버에 배포
- 프로덕션은 한 번에 배포
- 단, 스케줄러는 ShedLock 테이블 생성 후 자동 동작

### 점진 롤아웃 (선택)

- 특정 역할/그룹 대상 먼저 활성화
- 피드백 수집 후 전체 확대

### 롤백 전략

- FE Fallback 폴링이 있어 SSE 실패해도 기본 알림 동작
- 서버 이슈 시 SSE 엔드포인트만 403 리턴 → FE 자동 폴링 전환
- DB 롤백 필요 시 `notification` 테이블은 삭제해도 기존 기능 영향 없음

---

## 고도화 로드맵 (MVP 이후)

### 1차 고도화

- [ ] T7~T9 커뮤니티 알림 (댓글, 멘션, 좋아요)
- [ ] T10/T11/S7 공지/팝업
- [ ] 알림 설정 on/off (카테고리별)

### 2차 고도화

- [ ] 푸시 알림 (모바일 브라우저 Web Push)
- [ ] Daily digest 이메일 (하루 요약)
- [ ] Spring Boot 3 + Java 21 업그레이드 (Virtual Threads로 SSE 확장성 향상)

### 3차 고도화

- [ ] 알림 검색/필터
- [ ] 알림 통계 대시보드 (관리자용)
- [ ] 메시지 브로커 전환 (Kafka/NATS — 규모 확대 시)

---

## 의사결정 Gate

**Gate 1: 개발 시작 전**
- 기획자 확인 필요 항목 50% 이상 답변
- 법무 검토 진행 중 (완료 아니어도 시작 가능)
- 인프라 Redis 접근 확보

**Gate 2: Phase 2 진입 전**
- Phase 1 QA 통과 (폴링 기반 알림 정상)
- 인프라 LB/Nginx 설정 완료

**Gate 3: 운영 배포 전**
- 모든 MVP 이벤트 QA 통과
- 법무 검토 완료
- 다중 인스턴스 시나리오 검증 완료
