# 환경별 구성 전략

> 로컬 / 개발서버 / 운영 — 각 환경에서 알림 기능을 어떻게 돌릴지 정리.

---

## 🖥 환경 비교표

| 항목 | 로컬 | 개발서버 (vs-dev) | 운영 (vs-prod) |
|---|---|---|---|
| BE 인스턴스 | 1대 (또는 2대 테스트) | 1대 | 2대 |
| Redis | 선택 (Docker) | ❌ (Phase 1) / ✅ (Phase 2) | ✅ 필수 |
| ShedLock | ❌ | ❌ (Phase 1) / ✅ (Phase 2) | ✅ 필수 |
| SSE 백엔드 | 메모리 | 메모리 (Phase 1) / Redis (Phase 2) | Redis Pub/Sub |
| 스케줄러 | 활성 | 활성 | 활성 + 분산 락 |
| MySQL | 로컬 | 개발 DB | 운영 DB |
| Frontend | Vite dev (5173) | t-meta-service.vsaidt.com | meta-service.vsaidt.com |
| API Base URL | localhost:8081 | t-meta-api.vsaidt.com | meta-api.vsaidt.com |

---

## 🏠 로컬 개발 환경

### 기본 설정

- BE 1개 인스턴스 (`./gradlew :backend:bootRun`)
- MySQL 로컬 또는 개발 DB SSH 터널
- Redis **없어도 됨** (메모리 기반 SSE 동작)

### `application-local.yml` 예시

```yaml
spring:
  profiles:
    active: local
  redis:
    host: localhost          # 사용 안 함, 기본값
    port: 6379

notification:
  pubsub:
    enabled: false           # 메모리 직접 전달
  scheduler:
    enabled: true            # 로컬에서도 스케줄러 동작 테스트 가능
```

### 실행 예시

```bash
# BE
cd D:/workspace/meta-dashboard
./gradlew :backend:bootRun

# FE
cd D:/workspace/meta-dashboard/frontend
npm run dev
```

### 다중 인스턴스 테스트 (선택)

Phase 2 검증 시:

```bash
# Redis 기동
docker run -d -p 6379:6379 redis:7-alpine

# BE 2개 실행 (다른 포트)
./gradlew :backend:bootRun --args='--server.port=8081'
./gradlew :backend:bootRun --args='--server.port=8082'
```

`notification.pubsub.enabled=true` 로 테스트.

---

## 🧪 개발서버 (vs-dev)

### Phase 1 상태 (초기)

**구성:**
- BE 1대
- Redis 없음 (pubsub.enabled=false)
- ShedLock 없음

**가능한 작업:**
- 모든 알림 기능 QA (기획자, 테스터)
- FE/BE 통합 동작 확인
- 기획 요구사항 검증

**제약:**
- BE를 2대로 늘리면 동작 이상 (알림 누락 가능)
- 스케일 아웃 시나리오 검증 불가 (이건 운영 전에만 필요)

### Phase 2 전환 (운영 배포 전 리허설)

**구성:**
- BE 1대 (개발서버는 그대로)
- Redis 접근 추가
- `pubsub.enabled=true` 로 전환 → Redis 기반 동작 확인
- ShedLock 활성 → 스케줄러 중복 방지 동작 확인

**환경변수:**
```
STAT_SPRING_REDIS_HOST=<개발 Redis>
STAT_SPRING_REDIS_PORT=6379
STAT_SPRING_REDIS_USERNAME=<계정>
STAT_SPRING_REDIS_PASSWORD=<비번>
NOTIFICATION_PUBSUB_ENABLED=true
```

### `application-vs-dev.yml` (예시)

```yaml
notification:
  pubsub:
    enabled: ${NOTIFICATION_PUBSUB_ENABLED:false}
  scheduler:
    enabled: true
```

---

## 🚀 운영 (vs-prod)

### 구성

**인프라:**
- BE 2대 (오토스케일 대비 N대도 가능)
- Redis 필수 (Pub/Sub 전용 or 공유)
- LB idle timeout 3600초
- Nginx `proxy_buffering off`

**설정:**

```yaml
# application-prod.yml
notification:
  pubsub:
    enabled: true              # 필수
  scheduler:
    enabled: true              # ShedLock으로 중복 방지

spring:
  redis:
    host: ${STAT_SPRING_REDIS_HOST}
    port: ${STAT_SPRING_REDIS_PORT}
    username: ${STAT_SPRING_REDIS_USERNAME}
    password: ${STAT_SPRING_REDIS_PASSWORD}
    timeout: 3000
    lettuce:
      pool:
        max-active: 16
        max-idle: 8
        min-idle: 2
```

### 체크리스트 (운영 배포 전)

- [ ] Redis 접근 정보 k8s Secret/ConfigMap에 등록
- [ ] `NOTIFICATION_PUBSUB_ENABLED=true` 확인
- [ ] Redis key prefix 합의 (`meta-noti:*`)
- [ ] LB idle timeout 3600초 이상
- [ ] Nginx SSE 경로 별도 설정 (`proxy_buffering off`)
- [ ] WAF/프록시 long-response 허용
- [ ] 롤링 배포 간격 60초 이상
- [ ] Redis HA 정책 결정 (단일 / Sentinel / Cluster)

### 운영 장애 대비

**Redis 다운 시:**
- SSE는 동작하지만 다른 서버에서 발생한 이벤트는 전달 불가
- FE는 fallback 폴링으로 자동 전환 (30초 간격)
- 서비스는 유지됨 (실시간성만 저하)

**BE 1대 장애 시:**
- LB가 자동 배제
- 해당 서버에 연결된 SSE는 끊김 → 클라 재연결 → 다른 서버로 이동

---

## 🔀 환경 간 코드 차이

**핵심: 환경별로 코드는 동일, 설정만 다름.**

```
[소스 코드] — 모든 환경 동일
    ↓
[application.yml] — 기본값
    ↓
[application-{profile}.yml] — 환경별 오버라이드
    ↓
[환경변수] — 런타임 주입
```

### 환경 전환 예시

**로컬 → 개발서버:**
```
pubsub.enabled: false → false (Phase 1) or true (Phase 2)
```

**개발서버 → 운영:**
```
pubsub.enabled: false/true → true (필수)
BE 인스턴스: 1대 → 2대
Redis: 개발용 → 운영용 HA
```

---

## 📋 환경별 테스트 시나리오

### 로컬
- 기본 기능 동작
- SSE 연결/재연결
- 읽음 처리
- 스케줄러 수동 트리거

### 개발서버 Phase 1
- QA: 기획자/테스터 시나리오 확인
- 기획 요구사항 검증

### 개발서버 Phase 2 (리허설)
- Redis 연동 확인
- Pub/Sub 동작
- ShedLock 동작 (수동 트리거로 2번 호출 → 1번만 실행되는지)
- fallback 폴링 동작 (Redis 일부러 끊었을 때)

### 운영 배포 전
- 부하 테스트 (SSE 동접 수백~수천)
- 롤링 배포 시 재연결 동작
- Redis 장애 시 서비스 유지
- 다중 인스턴스 간 이벤트 전파
