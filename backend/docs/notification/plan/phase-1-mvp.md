# Phase 1 — MVP 구현 (Redis 없이 개발서버까지)

> 목표: 단일 BE 인스턴스 환경에서 전체 알림 기능 동작  
> 기간: 약 10일 (2주)  
> 완료 기준: 개발서버에서 기획자/QA가 실제 알림 사용 가능

---

## 🎯 범위

### 포함

- DB 스키마 (`notification` 테이블)
- BE 핵심 레이어 (Domain/Mapper/Service/Controller)
- SSE 연결 (메모리 기반 Registry)
- Spring Event 디스패처 (AFTER_COMMIT)
- `@Scheduled` 스케줄러 (ShedLock 없이)
- FE UI (벨/드롭다운/목록/읽음)
- FE SSE 훅 (재연결 + 토큰 refresh)
- 개발서버 배포

### 제외 (Phase 2 이관)

- Redis Pub/Sub
- ShedLock
- 다중 인스턴스 지원
- 이메일 발송 (S4, C1) — 시간 허락하면 포함
- 전역 공지 (T10/T11/S7)

### 미확정 대응 (기획 답변 대기)

- S4 이메일 초대: MVP 제외 (답변 시 재평가)
- S5 추방: 기능 존재 여부 확인 후 포함/제외
- S6 재검사 요청: 동일
- T6 집계 배치: 배치 정의 확인 후 포함

---

## 📋 작업 분해

### 1. DB (0.5일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `notification` 테이블 DDL 작성 | `ddl.sql` 파일 생성, 인덱스 포함 |
| [ ] 로컬 DB 적용 | `describe notification;` 성공 |
| [ ] 샘플 insert/select 검증 | 10건 insert 후 cursor 페이징 동작 확인 |
| [ ] 개발 DB 적용 | DBA 또는 직접 적용 |

DDL 위치: `backend/docs/notification/ddl/notification.sql` (신규 생성)

### 2. BE 도메인 계층 (1일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `domain/Notification.java` | 엔티티 빌더 |
| [ ] `domain/enums/NotificationCategory.java` | enum (EXAM/GROUP/NOTICE) |
| [ ] `api/notification/mapper/NotificationMapper.java` (interface) | 6개 메서드 시그니처 |
| [ ] `resources/mapper/notification/NotificationMapper.xml` | insert/insertBatch/list/count/read/readAll/delete |
| [ ] ResultMap 설정 | 컬럼 매핑 확인 |

### 3. BE 서비스/컨트롤러 (1일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `NotificationService.create(userNo, category, eventCode, content, link)` | DB insert + Dispatcher 호출 |
| [ ] `NotificationService.createBatch(userNos, ...)` | 벌크 insert |
| [ ] `NotificationService.list(userNo, cursor, size, category?)` | cursor 페이징 |
| [ ] `NotificationService.countUnread(userNo)` | |
| [ ] `NotificationService.markAsRead(userNo, id)` | user_no 필터 |
| [ ] `NotificationService.markAllAsRead(userNo)` | |
| [ ] `NotificationController` (REST 4종) | JWT 인증 통과 |
| [ ] API 응답 포맷 `ResponseDTO<CustomBody>` | 학심정 규약 |

### 4. BE SSE (1일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `SseEmitterRegistry` (메모리 기반) | 사용자별 emitter 목록 관리 |
| [ ] `NotificationStreamController` | `/api/v1/notifications/stream` |
| [ ] Emitter 생명주기 관리 | onCompletion/Timeout/Error |
| [ ] Heartbeat 스케줄러 (30초) | 연결 유지 |
| [ ] 초기 "connected" 이벤트 | 클라 연결 확인 용 |

### 5. BE 디스패처 + 이벤트 (2일)

#### 5-1. Dispatcher (토글 패턴)

| 작업 | 완료 기준 |
|---|---|
| [ ] `NotificationDispatcher` 인터페이스/클래스 | `dispatch(userNo, dto)` |
| [ ] 메모리 기반 구현 (Phase 1) | `registry.sendTo()` 호출 |
| [ ] `notification.pubsub.enabled` 토글 준비 | Phase 2 확장 지점 표시 |

#### 5-2. 이벤트 정의

| 작업 | 완료 기준 |
|---|---|
| [ ] `StudentJoinedGroupEvent` (T1) | |
| [ ] `StudentLeftGroupEvent` (T2) | |
| [ ] `ExamSubmittedEvent` (T3, T4) | |
| [ ] `ExamAssignedEvent` (S1) | |
| [ ] `ExamResultPublishedEvent` (S3) | |
| [ ] (조건부) `StudentKickedEvent` (S5) | 기능 존재 확인 후 |
| [ ] (조건부) `ReExamRequestedEvent` (S6) | 기능 존재 확인 후 |

#### 5-3. 이벤트 리스너

| 작업 | 완료 기준 |
|---|---|
| [ ] `NotificationEventHandler` | 각 이벤트별 `@TransactionalEventListener(AFTER_COMMIT)` |
| [ ] 문구 렌더링 | 스펙 문구 그대로 포맷 |

#### 5-4. 비즈니스 로직에 이벤트 발행 추가

| 작업 | 완료 기준 |
|---|---|
| [ ] `GroupService.joinGroup` | T1 이벤트 발행 |
| [ ] `GroupService.leave`(확인 필요) | T2 이벤트 발행 |
| [ ] 검사 제출 로직 | T3, T4 이벤트 발행 |
| [ ] 검사 생성 로직 | S1 이벤트 발행 (그룹 전원) |
| [ ] 결과 공개 로직 | S3 이벤트 발행 (⚠️ 공개 시점 확정 후) |

### 6. BE 스케줄러 (1일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `NotificationScheduler` 클래스 | `@Scheduled` 사용 (ShedLock 없음) |
| [ ] T5/S2 리마인더 (매일 08:00) | 마감 D-3~D-1 미제출자 조회 |
| [ ] 90일 삭제 배치 (매일 03:00) | `deleteOlderThan(90)` |
| [ ] Timezone Asia/Seoul | |

### 7. FE API 레이어 (0.5일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `shared/types/notification.ts` | 타입 정의 |
| [ ] `features/notifications/api/notificationApi.ts` | REST 4종 함수 |
| [ ] React Query 훅 | `useNotifications`, `useUnreadCount`, `useMarkAsRead`, `useMarkAllAsRead` |

### 8. FE SSE 훅 (1일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `shared/hooks/useNotificationStream.ts` | `fetchEventSource` 사용 |
| [ ] 인증 헤더 주입 | `getAccessToken()` |
| [ ] 401 시 토큰 refresh + 재연결 | SDK `refreshAccessToken()` |
| [ ] 지수 백오프 재연결 | 1s → 30s max |
| [ ] Fallback 폴링 (SSE 3회 실패 시) | 30초 `useUnreadCount` 활성화 |
| [ ] 로그아웃 시 연결 종료 | AbortController |

### 9. FE UI (2일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `widgets/notifications/NotificationBell.tsx` | 벨 + 뱃지 (99+ 컷오프) |
| [ ] `widgets/notifications/NotificationPanel.tsx` | 드롭다운, 카테고리 탭 |
| [ ] `widgets/notifications/NotificationItem.tsx` | 미확인 강조, 클릭 시 읽음 + 이동 |
| [ ] `widgets/notifications/NotificationEmpty.tsx` | 빈 상태 |
| [ ] 상대 시간 유틸 `formatRelativeTime.ts` | 방금 전/N분 전/어제/YYYY.MM.DD |
| [ ] "모두 읽음" 버튼 (9개 이상 활성화) | |
| [ ] 무한 스크롤 (`useInfiniteQuery`) | |
| [ ] 외부 클릭/ESC 닫기 | |

### 10. 레이아웃 통합 + 딥링크 (0.5일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `MainLayout` Header에 벨 추가 (교사) | |
| [ ] `StudentLayout` Header에 벨 추가 (학생) | |
| [ ] 알림 클릭 시 `navigate(link)` | 쿼리스트링 포함 링크도 동작 |
| [ ] 읽음 처리 낙관적 업데이트 | |

### 11. 로컬 E2E 테스트 (0.5일)

| 시나리오 | 완료 기준 |
|---|---|
| [ ] 교사 로그인 → 벨 연결 확인 | DevTools EventStream 탭 |
| [ ] 학생이 그룹 가입 → 교사에게 T1 알림 | 실시간 수신 |
| [ ] 학생이 검사 제출 → T3 알림 | |
| [ ] 학생 전원 제출 → T4 알림 | |
| [ ] 알림 클릭 → 읽음 처리 + 딥링크 이동 | |
| [ ] "모두 읽음" 버튼 (9개 이상) | |
| [ ] 스케줄러 수동 트리거 → T5/S2 발송 | |

### 12. 개발서버 배포 (0.5일)

| 작업 | 완료 기준 |
|---|---|
| [ ] 개발 DB에 DDL 적용 | |
| [ ] `application-vs-dev.yml`에 `notification.pubsub.enabled=false` | |
| [ ] BE/FE 배포 | CI/CD 파이프라인 |
| [ ] 개발서버에서 E2E 시나리오 재확인 | 로컬과 동일 결과 |
| [ ] 기획자/QA에게 공유 | |

---

## 🧩 주요 설계 포인트 (Phase 2 대비)

### Dispatcher 토글 구조

```java
public interface NotificationDispatcher {
    void dispatch(Long userNo, NotificationDto dto);
}

// Phase 1
@Component
@ConditionalOnProperty(name = "notification.pubsub.enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryDispatcher implements NotificationDispatcher {
    private final SseEmitterRegistry registry;
    public void dispatch(Long userNo, NotificationDto dto) {
        registry.sendTo(userNo, "notification", dto);
    }
}

// Phase 2에서 추가될 것
@Component
@ConditionalOnProperty(name = "notification.pubsub.enabled", havingValue = "true")
public class RedisPubSubDispatcher implements NotificationDispatcher {
    // Redis PUBLISH로 교체
}
```

→ **리스너는 `Dispatcher`만 주입받아 사용**. Phase 2 전환 시 리스너 코드 변경 없음.

### 스케줄러 분리

```java
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "notification.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class NotificationScheduler {
    @Scheduled(...)
    public void sendReminders() { ... }
}
```

Phase 2에서 `@SchedulerLock` 어노테이션만 추가.

---

## ⚠️ 위험 요소 & 대응

### 1. 기획 답변 지연

**영향**: S4/S5/S6 범위 확정 불가, T6 배치 정의 모름

**대응**:
- 기본은 **MVP 제외**
- Phase 1 릴리즈 후 기획 답변 받으면 Phase 1.5로 추가

### 2. 법무 검토 지연

**영향**: 닉네임 박제 정책 확정 불가

**대응**:
- 현재 설계(박제) 기준 개발 진행
- 법무 답변 시 필요하면 마스킹 로직 추가

### 3. SSE 연결 안정성

**영향**: 네트워크 불안정 시 사용자 경험 저하

**대응**:
- FE 재연결 로직 철저히 (지수 백오프)
- Fallback 폴링 동작 확인
- Heartbeat 30초 주기

### 4. 검사/그룹 관련 기존 코드 의존성

**영향**: 이벤트 발행 지점 파악 필요

**대응**:
- Phase 1 초반에 기존 코드 분석 (`GroupService`, 검사 제출 로직)
- 이벤트 발행 지점 설계 문서 작성

---

## ✅ Phase 1 완료 기준 (Definition of Done)

- [ ] 개발서버에서 교사/학생 둘 다 알림 정상 동작
- [ ] 최소 이벤트 동작: T1, T3, S1 (그룹 가입 / 검사 제출 / 검사 배정)
- [ ] SSE 연결 성공/끊김/재연결 안정 동작
- [ ] 읽음 처리 동작
- [ ] 스케줄러 동작 (T5/S2 or 90일 삭제)
- [ ] 기획자가 확인하여 UX OK 판정
- [ ] 회귀 테스트 통과 (기존 기능 영향 없음)

Phase 1 완료 후 → 기획자 답변 수집 + Phase 2 진입 준비.
