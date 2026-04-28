# Phase 2 — 운영 준비 (Redis Pub/Sub + ShedLock)

> 목표: 운영 배포 가능한 다중 인스턴스 구조로 확장  
> 기간: 약 5일 (1주)  
> 진입 시점: 운영 배포 일정 확정 후, Phase 1 완료 전제

---

## 🎯 범위

### 추가되는 것

- Redis Pub/Sub 연동
- 다중 인스턴스 간 메시지 브로드캐스트
- ShedLock 분산 락 (스케줄러 중복 방지)
- `shedlock` 테이블
- 운영 환경 LB/Nginx SSE 설정

### Phase 1에서 바꾸지 않는 것

- DB 스키마 (`notification` 테이블)
- REST API
- 이벤트 디스패처 구조 (Spring Event)
- FE 코드

→ **Phase 1 코드 대부분 그대로 사용**.

---

## 📋 작업 분해

### 0. 선행 (인프라 팀 협의) (1일)

| 작업 | 완료 기준 |
|---|---|
| [ ] Redis 인스턴스 확보 | 전용 or 공유 결정 |
| [ ] Redis 접근 정보 | 계정/비밀번호 발급 |
| [ ] Key prefix 합의 | `meta-noti:*` 사용 |
| [ ] BE → Redis 네트워크 허용 | 보안 그룹 설정 |
| [ ] 운영 LB idle timeout 3600s | NCP LB 설정 |
| [ ] Nginx SSE 경로 설정 | `proxy_buffering off` |
| [ ] HA 정책 결정 | 단일 / Sentinel / Cluster |

### 1. 의존성 + 설정 (0.5일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `build.gradle`에 `spring-boot-starter-data-redis` 추가 | |
| [ ] `build.gradle`에 ShedLock 의존성 추가 | |
| [ ] `application.yml` Redis 설정 (이미 있음 — 검증만) | |
| [ ] `application-vs-dev.yml`, `application-prod.yml` 환경변수 확인 | |

### 2. DB — shedlock 테이블 (0.5일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `shedlock` 테이블 DDL 작성 | `ddl/shedlock.sql` |
| [ ] 개발 DB 적용 | |
| [ ] 운영 DB 적용 (배포 시) | |

### 3. Redis Pub/Sub 브릿지 (1일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `RedisConfig` (RedisTemplate, MessageListenerContainer) | |
| [ ] `NotificationPubSubBridge` 신규 | `publish(userNo, dto)`, SUBSCRIBE 관리 |
| [ ] `SseEmitterRegistry`에 Redis 구독 연동 | SSE 연결 시 SUBSCRIBE, 해제 시 UNSUBSCRIBE |
| [ ] Redis 메시지 수신 시 emitter 찾아서 send | |

### 4. Dispatcher 토글 교체 (0.5일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `RedisPubSubDispatcher` 구현 | Phase 1에 설계해둔 `NotificationDispatcher` 구현체 |
| [ ] `@ConditionalOnProperty` 분기 동작 확인 | |
| [ ] `notification.pubsub.enabled=true` 시 Redis 경로 | |
| [ ] `=false` 시 기존 메모리 경로 유지 | |

### 5. ShedLock 도입 (0.5일)

| 작업 | 완료 기준 |
|---|---|
| [ ] `SchedulerConfig` (`@EnableSchedulerLock`) | |
| [ ] `LockProvider` Bean (JdbcTemplateLockProvider) | |
| [ ] 각 스케줄러 메서드에 `@SchedulerLock` 추가 | name/lockAtMostFor/lockAtLeastFor |
| [ ] BE 2대 기동 시 1대만 실행되는지 확인 | |

### 6. FE Fallback 동작 강화 (0.5일)

Phase 1에서 fallback 폴링 이미 구현됐지만, Phase 2 환경에서 한 번 더 검증.

| 작업 | 완료 기준 |
|---|---|
| [ ] Redis 일부러 끊었을 때 → FE 폴링 전환 확인 | |
| [ ] Redis 복구 시 → SSE 재연결 확인 | |

### 7. 통합 테스트 (1일)

| 시나리오 | 완료 기준 |
|---|---|
| [ ] 로컬 BE 2개 + Redis 시나리오 | 서버 A 연결 / 서버 B 이벤트 → 서버 A로 전달 |
| [ ] 스케줄러 중복 방지 | BE 2개 동시 기동 → 리마인더 1번만 발송 |
| [ ] FE 폴링 fallback | Redis 다운 → 30초 간격 뱃지 갱신 |
| [ ] Redis 재연결 | Pub/Sub 끊김 후 복구 시 정상 동작 |

### 8. 개발서버 Phase 2 리허설 (0.5일)

개발서버는 Phase 1 상태지만 Phase 2 설정으로 리허설:

| 작업 | 완료 기준 |
|---|---|
| [ ] 개발서버 `NOTIFICATION_PUBSUB_ENABLED=true`로 전환 | |
| [ ] 동작 확인 | 알림 정상 |
| [ ] 이상 없으면 유지, 이상 있으면 false로 롤백 | |

### 9. 운영 배포 (배포일)

| 작업 | 완료 기준 |
|---|---|
| [ ] 운영 Redis 접근 정보 k8s Secret 등록 | |
| [ ] 운영 DB에 `shedlock` 테이블 생성 | |
| [ ] `NOTIFICATION_PUBSUB_ENABLED=true` 환경변수 설정 | |
| [ ] 운영 LB idle timeout 확인 | 3600s |
| [ ] 운영 Nginx SSE 설정 확인 | `proxy_buffering off` |
| [ ] 카나리 / 점진 배포 (선택) | 일부 유저만 활성화 가능하면 |
| [ ] 배포 후 메트릭 확인 | 활성 SSE 연결 수, 에러율 |

---

## 🧩 코드 변경 요약

### 신규 파일

```
backend/src/main/java/com/vs/meta/common/config/
  ├── RedisConfig.java                   # Bean 등록
  └── SchedulerConfig.java               # @EnableSchedulerLock

backend/src/main/java/com/vs/meta/api/notification/
  └── sse/
      ├── NotificationPubSubBridge.java  # Redis 브릿지
      └── RedisPubSubDispatcher.java     # Dispatcher 구현체

backend/docs/notification/ddl/
  └── shedlock.sql
```

### 기존 파일 수정

| 파일 | 수정 내용 |
|---|---|
| `build.gradle` | 의존성 추가 |
| `application-{env}.yml` | Redis 설정 확인 / ShedLock |
| `SseEmitterRegistry` | Redis 구독/해제 연동 |
| `NotificationScheduler` | `@SchedulerLock` 어노테이션 추가 |

**핵심**: 비즈니스 로직 (NotificationService, EventHandler)은 **변경 없음**.

---

## ⚠️ 배포 리스크 & 롤백

### 리스크 1: Redis 접속 실패

**영향**: BE 기동 실패 또는 SSE 메시지 전달 실패

**대응**:
- `NOTIFICATION_PUBSUB_ENABLED=false`로 즉시 롤백 (앱 재시작 없이 프로퍼티만)
- Spring Cloud Config 있으면 런타임 변경 가능
- 또는 앱 재배포

### 리스크 2: ShedLock 이슈로 스케줄러 동작 안 함

**영향**: T5/S2 리마인더 미발송

**대응**:
- 로그 확인 → shedlock 테이블 상태 확인
- 수동으로 lock row 제거 후 다음 주기 기다림
- 문제 심각하면 `@SchedulerLock` 제거하고 임시로 1대만 스케줄러 활성

### 리스크 3: SSE 연결 대량 실패

**영향**: 사용자 알림 안 받음

**대응**:
- FE fallback 폴링 자동 동작 (30초 내 복구)
- LB/Nginx 설정 재확인
- 최악의 경우 SSE 엔드포인트 403 리턴 → FE 폴링 강제 모드

### 전체 롤백 전략

**Phase 2 → Phase 1 롤백:**
```yaml
notification:
  pubsub:
    enabled: false
```

이 설정만 변경하고 BE 재시작하면 Phase 1 동작.  
다만 운영은 BE 2대라 Phase 1로 돌릴 수는 없고, 한 대로 스케일 인 해야 함.

---

## ✅ Phase 2 완료 기준 (Definition of Done)

- [ ] 운영 환경에서 BE 2대 기동
- [ ] Redis Pub/Sub 통해 서버 간 알림 전달 검증
- [ ] ShedLock으로 스케줄러 중복 없음
- [ ] SSE 연결 안정 (동접 500명 기준 무이슈)
- [ ] FE fallback 동작 (Redis 장애 시)
- [ ] 모니터링 대시보드 구축
- [ ] 장애 대응 런북 작성
- [ ] 법무 검토 완료 (닉네임 박제 정책)

---

## 📈 Phase 2 이후 (고도화)

- [ ] T7~T9 커뮤니티 알림
- [ ] T10/T11/S7 공지/팝업
- [ ] 알림 설정 on/off
- [ ] Web Push (모바일 푸시)
- [ ] Spring Boot 3 + Java 21 (Virtual Threads)
- [ ] 월별 파티셔닝 (회원 수 증가 시)
