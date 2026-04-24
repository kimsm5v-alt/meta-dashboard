# 08. 인프라 팀 체크리스트

---

## Redis 준비

### 1. 인스턴스 프로비저닝

- [ ] 전용 Redis 인스턴스 vs 기존 공유 Redis 활용 결정
- [ ] NCP Cloud DB for Redis 또는 자체 구축
- [ ] 버전: 5.0+ 권장 (대부분 환경 OK)
- [ ] 최소 사양: 메모리 1GB (Pub/Sub 용도는 매우 가벼움)

### 2. 접근 설정

- [ ] BE 서버 2대에서 Redis로의 **네트워크 허용** (보안 그룹 설정)
- [ ] Redis 접속 계정/비밀번호 발급
- [ ] 환경변수로 주입:
  ```
  REDIS_HOST=...
  REDIS_PORT=6379
  REDIS_PASSWORD=***
  ```

### 3. 네임스페이스 합의

- [ ] 학심정 알림 전용 channel/key prefix: `meta-noti:*`
- [ ] 다른 서비스와 충돌 방지
- [ ] 예:
  - `meta-noti:user:{userNo}` — Pub/Sub 채널
  - `meta-noti:lock:*` — ShedLock 대신 사용 시 (단, MVP는 JDBC 기반)

### 4. HA 정책

- [ ] 단일 노드 vs Sentinel vs Cluster 결정
- [ ] 알림 중요도 기반: 장애 시 일시 중단 허용되면 단일 노드로 시작 가능
- [ ] 운영 중요도 높이려면 Sentinel (master/slave + failover)

### 5. Persistence 정책

- [ ] Pub/Sub만 쓰면 AOF/RDB 끄기 (메시지는 실시간 소비)
- [ ] 단, ShedLock이나 세션 캐시 같이 쓰면 AOF 필요

### 6. 모니터링

- [ ] Redis INFO 수집 (연결 수, 메모리 사용량)
- [ ] Pub/Sub 메시지 TPS 모니터링
- [ ] Slow log 확인

---

## Load Balancer / 네트워크

### 1. NCP Load Balancer

- [ ] **Idle Timeout 3600초(1시간) 이상**으로 변경
  - 기본 60초면 SSE 연결이 매 분마다 끊김
- [ ] HTTP/2 활성화 (브라우저당 동시 연결 6개 제한 회피)
- [ ] Connection Timeout 충분히 길게
- [ ] Health Check는 `/actuator/health` 등 기존 경로 사용 (SSE 경로 사용 X)

### 2. WAF (사용 시)

- [ ] SSE 경로(`/api/v1/notifications/stream`) long-polling 예외 등록
- [ ] 장시간 응답 차단하지 않도록 규칙 조정

### 3. 방화벽

- [ ] BE → Redis 포트 (6379) 허용
- [ ] BE 인스턴스 간 통신 (있다면)

---

## Nginx 설정 (BE 앞단에 있는 경우)

### SSE 전용 location 추가

`/etc/nginx/conf.d/learning-mind.conf` (예시 경로):

```nginx
# SSE 스트림 전용 설정
location /api/v1/notifications/stream {
    proxy_pass http://backend_upstream;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection '';
    
    # SSE 핵심 설정
    proxy_buffering off;               # 필수: 버퍼링 끄기
    proxy_cache off;                   # 캐시 끄기
    proxy_read_timeout 3600s;          # 1시간
    proxy_send_timeout 3600s;
    chunked_transfer_encoding on;
    
    # Gzip 끄기 (버퍼링 유발)
    gzip off;
}

# 일반 알림 API는 기본 설정 사용
location /api/v1/notifications {
    proxy_pass http://backend_upstream;
    # ... 기존 API와 동일 설정
}
```

### 체크

- [ ] 기존 location 블록과 우선순위 충돌 확인
- [ ] 배포 후 `curl -N -H "Authorization: Bearer ..." /api/v1/notifications/stream`으로 실시간 수신 확인
- [ ] Nginx reload로 무중단 적용

---

## CDN / CloudFront (사용 시)

- [ ] SSE 경로는 CDN 우회 설정 (origin 직접 호출)
- [ ] 또는 `Cache-Control: no-cache, no-transform` 헤더 강제
- [ ] CloudFront의 경우 behaviour 별도 등록

---

## 모니터링 / 관측성

### 지표

| 지표 | 수집 방법 | 임계치 예시 |
|---|---|---|
| 활성 SSE 연결 수 | Micrometer → Prometheus | 서버당 1000 경고 |
| Redis Pub/Sub TPS | Redis INFO | 급증 시 알람 |
| SSE 연결 실패율 | 애플리케이션 로그 집계 | 5% 이상 경고 |
| Tomcat thread 사용률 | JVM 메트릭 | 80% 경고 |
| Redis 메모리 사용률 | NCP 모니터링 | 80% 경고 |

### 대시보드 구성

- [ ] Grafana 대시보드 추가 (알림 전용 섹션)
- [ ] 알람 규칙 (PagerDuty/Slack 등)

---

## 배포 정책

### 1. 롤링 배포

- [ ] 인스턴스 간 재시작 간격 **60초 이상**
- [ ] 한 번에 전체 재시작 금지 (알림 서비스 전면 중단 방지)
- [ ] 재시작 시 emitter `complete()` 호출 → 클라가 즉시 재연결 시도

### 2. Graceful Shutdown

- [ ] Spring Boot `server.shutdown=graceful` 설정
- [ ] `spring.lifecycle.timeout-per-shutdown-phase=30s` 설정
- [ ] 진행 중인 SSE 연결 정리 후 종료

### 3. Blue-Green (고도화)

- 알림 전용 서비스로 분리 시 고려

---

## 환경별 설정 분리

### 개발 (vs-dev)

- [ ] Redis: dev 전용 인스턴스 또는 공유 중 전용 DB index
- [ ] LB: dev 환경 idle timeout 설정
- [ ] 로그 레벨: DEBUG

### 운영 (prod)

- [ ] Redis: HA 구성
- [ ] LB: 운영 idle timeout 설정
- [ ] 로그 레벨: INFO
- [ ] 모니터링 알람 활성화

---

## 장애 대응 런북

### 시나리오별 대응

| 상황 | 증상 | 대응 |
|---|---|---|
| Redis 다운 | SSE 메시지 전달 안 됨 | FE 폴링 fallback으로 자동 전환 (개발 필요) |
| BE 인스턴스 1대 다운 | 해당 인스턴스 연결 사용자만 영향 | LB가 자동 배제, 클라 재연결 |
| 전체 BE 다운 | 모든 알림 중단 | 기존 운영 런북 준수 |
| LB timeout 짧아짐 | SSE 자주 끊김 | LB 설정 확인 + 롤백 |

### FE Fallback 전략

SSE 연결 N회 실패 → 폴링 모드로 자동 전환. 인프라 장애 상황에서도 뱃지 카운트는 표시됨 (30초 지연).

---

## 비용 영향

### 추가 비용

| 항목 | 예상 |
|---|---|
| Redis 전용 인스턴스 | 월 5~10만원 (NCP 기본) |
| LB 설정 변경 | 0원 |
| Nginx 설정 변경 | 0원 |
| 모니터링 추가 | 0원 (기존 스택 활용) |

기존 Redis 공유 가능하면 **추가 비용 0원**.

---

## 의사결정 필요

- [ ] Redis 전용 vs 공유
- [ ] HA 정책 (단일 / Sentinel / Cluster)
- [ ] 운영 LB idle timeout 수치 (3600초 권장)
- [ ] Nginx 존재 여부 및 관리 책임자
- [ ] 모니터링 스택 (Grafana/Datadog/NCP 기본)
