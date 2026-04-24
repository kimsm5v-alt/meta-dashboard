# Task Board — 실시간 진행 현황

> 작업 착수/완료 시 **이 문서를 업데이트**.  
> 각 항목 체크박스 + 담당자 + 완료일 기록.

---

## 🎯 범례

- `[ ]` 미착수
- `[~]` 진행 중
- `[x]` 완료
- `[-]` 보류 / 미정
- `[?]` 블로커 (기획 답변 대기 등)

---

## 📍 현재 포커스

**Phase 1 착수 준비 단계.** 아래 "Phase 0"부터 순차 진행.

---

## Phase 0 — 선행 준비

| 상태 | 작업 | 담당 | 비고 |
|---|---|---|---|
| [x] | 기술 선택 결정 (SSE, Redis, ShedLock 등) | - | `02-tech-decisions.md` |
| [x] | 문서화 완료 | - | `plan/` 폴더 |
| [x] | 찍먹 코드 작성 + 동작 확인 | BE+FE | `/dev/sse` 라우트 |
| [?] | 기획자 확인 항목 답변 (S4/S5/S6/T6) | 기획 | 답변 시 Phase 1에 반영 |
| [?] | 법무 검토 (닉네임 박제) | 법무 | MVP 진행하며 병행 |
| [ ] | `.env.local`에 Redis 환경변수 추가 (선택) | BE | 로컬 Phase 2 테스트용 |

---

## Phase 1 — MVP (Redis 없이 개발서버까지)

### 1. DB 스키마

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [x] | `notification` 테이블 DDL 작성 | BE | 2026-04-24 |
| [x] | `shedlock` 테이블 DDL 작성 (Phase 2용) | BE | 2026-04-24 |
| [x] | 로컬 DB 적용 | BE | 2026-04-24 |
| [ ] | 개발 DB 적용 | BE/DBA | |
| [ ] | 샘플 데이터 insert/select 검증 | BE | |

### 2. BE 도메인 계층

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [x] | `Notification` 엔티티 | BE | 2026-04-24 |
| [x] | `NotificationCategory` enum | BE | 2026-04-24 |
| [x] | `NotificationMapper.java` + `.xml` | BE | 2026-04-24 |
| [ ] | Mapper 단위 테스트 | BE | |

### 3. BE 서비스 + Controller

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [x] | `NotificationDto`, `NotificationListResponse` | BE | 2026-04-24 |
| [x] | `NotificationService.create` | BE | 2026-04-24 |
| [x] | `NotificationService.createBatch` | BE | 2026-04-24 |
| [x] | `NotificationService.list` (cursor) | BE | 2026-04-24 |
| [x] | `NotificationService.countUnread` | BE | 2026-04-24 |
| [x] | `NotificationService.markAsRead` | BE | 2026-04-24 |
| [x] | `NotificationService.markAllAsRead` | BE | 2026-04-24 |
| [x] | `NotificationService.deleteOlderThan` | BE | 2026-04-24 |
| [x] | `NotificationController` REST 4종 | BE | 2026-04-24 |
| [x] | `NotificationDebugController` (local only test-send) | BE | 2026-04-24 |
| [ ] | Swagger/OpenAPI 문서 (기본 어노테이션은 추가됨) | BE | |

### 4. BE SSE

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [x] | `SseEmitterRegistry` (메모리) | BE | 2026-04-24 |
| [x] | `NotificationStreamController` (`/stream`) | BE | 2026-04-24 |
| [x] | Emitter 생명주기 관리 | BE | 2026-04-24 |
| [x] | Heartbeat 스케줄러 (30초) | BE | 2026-04-24 |
| [x] | `@EnableScheduling` 활성화 | BE | 2026-04-24 |

### 5. BE Dispatcher + 이벤트

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [x] | `NotificationDispatcher` 인터페이스 | BE | 2026-04-24 |
| [x] | `InMemoryDispatcher` 구현 (`@ConditionalOnProperty`) | BE | 2026-04-24 |
| [ ] | Application Event 클래스들 (T1~T4, S1, S3) | BE | |
| [ ] | `NotificationEventHandler` | BE | |
| [ ] | `GroupService.joinGroup` 훅 (T1) | BE | |
| [ ] | `GroupService.leave` 훅 (T2) | BE | |
| [ ] | 검사 제출 훅 (T3, T4) | BE | |
| [ ] | 검사 생성 훅 (S1) | BE | |
| [ ] | 결과 공개 훅 (S3) — ⚠️ 공개 로직 확정 후 | BE | |

### 6. BE 스케줄러

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [ ] | `NotificationScheduler` 클래스 | BE | |
| [ ] | T5/S2 리마인더 스케줄러 (매일 08:00) | BE | |
| [ ] | 90일 삭제 배치 (매일 03:00) | BE | |

### 7. FE API 레이어

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [ ] | `shared/types/notification.ts` | FE | |
| [ ] | `features/notifications/api/notificationApi.ts` | FE | |
| [ ] | `useNotifications` 훅 (`useInfiniteQuery`) | FE | |
| [ ] | `useUnreadCount` 훅 | FE | |
| [ ] | `useMarkAsRead` 훅 (낙관적 업데이트) | FE | |
| [ ] | `useMarkAllAsRead` 훅 | FE | |

### 8. FE SSE 훅

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [ ] | `useNotificationStream.ts` | FE | |
| [ ] | JWT 헤더 주입 | FE | |
| [ ] | 401 감지 → refresh 후 재연결 | FE | |
| [ ] | 지수 백오프 재연결 | FE | |
| [ ] | Fallback 폴링 전환 | FE | |
| [ ] | 로그아웃 시 정리 | FE | |

### 9. FE UI

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [ ] | `NotificationBell` | FE | |
| [ ] | `NotificationPanel` (카테고리 탭) | FE | |
| [ ] | `NotificationItem` | FE | |
| [ ] | `NotificationEmpty` | FE | |
| [ ] | `formatRelativeTime` 유틸 | FE | |
| [ ] | "모두 읽음" 버튼 (9개 이상 활성화) | FE | |
| [ ] | 무한 스크롤 | FE | |
| [ ] | 외부 클릭/ESC 닫기 | FE | |

### 10. 레이아웃 통합

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [ ] | `MainLayout` Header 벨 추가 | FE | |
| [ ] | `StudentLayout` Header 벨 추가 | FE | |
| [ ] | 딥링크 라우팅 테스트 | FE | |

### 11. 테스트

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [ ] | 로컬 E2E 시나리오 | BE+FE | |
| [ ] | 기획자 QA | 기획 | |

### 12. 개발서버 배포

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [ ] | 개발 DB DDL 적용 | BE/DBA | |
| [ ] | 개발서버 환경변수 확인 | DevOps | |
| [ ] | BE 배포 | BE | |
| [ ] | FE 배포 | FE | |
| [ ] | 개발서버 E2E 재검증 | 전체 | |

---

## Phase 2 — 운영 준비 (Redis + ShedLock)

### 0. 인프라 협의

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [ ] | Redis 인스턴스 확보 | DevOps | |
| [ ] | 접근 정보 / key prefix 합의 | DevOps | |
| [ ] | 네트워크 허용 | DevOps | |
| [ ] | 운영 LB idle timeout 3600s | DevOps | |
| [ ] | Nginx SSE 경로 설정 | DevOps | |

### 1. BE 확장

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [ ] | `build.gradle` Redis + ShedLock 의존성 | BE | |
| [ ] | `RedisConfig` | BE | |
| [ ] | `NotificationPubSubBridge` | BE | |
| [ ] | `RedisPubSubDispatcher` | BE | |
| [ ] | `SseEmitterRegistry` Redis 구독 연동 | BE | |
| [ ] | `SchedulerConfig` (`@EnableSchedulerLock`) | BE | |
| [ ] | 스케줄러 메서드에 `@SchedulerLock` | BE | |
| [ ] | `shedlock` 테이블 DDL | BE | |

### 2. 통합 테스트

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [ ] | 로컬 BE 2개 + Redis 시나리오 | BE | |
| [ ] | 스케줄러 중복 방지 검증 | BE | |
| [ ] | Redis 장애 시 폴링 fallback | BE+FE | |
| [ ] | 개발서버 Phase 2 리허설 | 전체 | |

### 3. 운영 배포

| 상태 | 작업 | 담당 | 완료일 |
|---|---|---|---|
| [ ] | 운영 Redis 정보 k8s Secret 등록 | DevOps | |
| [ ] | 운영 DB `shedlock` 테이블 생성 | DBA | |
| [ ] | `NOTIFICATION_PUBSUB_ENABLED=true` | DevOps | |
| [ ] | 운영 배포 | DevOps | |
| [ ] | 배포 후 모니터링 | 전체 | |

---

## 🚧 블로커 / 대기 중

### 기획 답변 대기

- [ ] **S4 이메일 초대** — 현재 기능 존재 여부 + MVP 포함 여부
- [ ] **S5 추방 기능** — 존재 여부 확인
- [ ] **S6 재검사 요청** — 존재 여부 확인
- [ ] **T6 집계 배치 정의** — 언제/어떻게
- [ ] **S3 결과 공개 시점** — 수동 / 자동

### 법무 검토 대기

- [ ] 닉네임 박제 저장 허용 여부
- [ ] 90일 보관 적정성

### 기타

- [ ] Auth 서버 C1 메일 중복 발송 여부 (Auth 팀 확인)

---

## 📝 작업 로그

업데이트 방식: 각 날짜별 무슨 작업 했는지 간단히 기록.

### 2026-04-24

- Phase 0 완료: 전체 로드맵 문서화 (`plan/` 폴더 생성)
- 찍먹 PoC 브랜치 (`feature/notification`) 작성 완료
  - BE: `NotificationTestController` (메모리 SSE)
  - FE: `/dev/sse` 라우트 + `SsePocPanel`
- application.yml에 Redis 환경변수 추가 (기본값으로 로컬 OK)

### 2026-04-25 (예정)

- Phase 1 계속 — BE 서비스/컨트롤러, SSE

### 2026-04-24 (추가)

- Phase 1 착수
- notification, shedlock DDL 작성 (`ddl/` 폴더)
- 로컬 DB `notification` 테이블 생성 완료
- BE 도메인 계층 구현:
  - `Notification` 엔티티
  - `NotificationCategory` enum
  - `NotificationMapper` (interface + XML)
- BE 서비스/컨트롤러/SSE 구현:
  - DTO (`NotificationDto`, `NotificationListResponse`)
  - `SseEmitterRegistry` (메모리)
  - `NotificationDispatcher` + `InMemoryDispatcher`
  - `NotificationService`
  - `NotificationController` (REST 4종)
  - `NotificationStreamController` (SSE)
  - `NotificationHeartbeatScheduler` (30초)
  - `NotificationDebugController` (`@Profile("local")` 테스트 발송)
- `@EnableScheduling` 활성화
- 찍먹 `NotificationTestController` 제거 (정식 컨트롤러가 대체)
- 컴파일 통과
- FE 명세서 `plan/fe-api-contract.md` 작성

---

## 🎯 다음 액션

1. **지금**: Phase 1 → 1. DB 스키마 작업 착수
2. 기획자에게 블로커 항목 답변 요청
3. 법무팀 검토 요청 (기획자 경유)

다음 작업 시작 시 이 문서의 해당 항목 `[ ]` → `[~]`로 변경.
