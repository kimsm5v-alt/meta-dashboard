# 알림 기능 — 점진적 구현 계획

> 작성일: 2026-04-24
> 목적: 로컬 → 개발서버 → 운영 배포까지의 단계적 구현 및 진행 상황 관리

---

## 🎯 전략

**"단순하게 시작 → 배포 → 확장"** — Redis/ShedLock 없이 Phase 1로 빠르게 개발서버까지 올리고, 운영 배포 전에 Phase 2 완성.

### 핵심 원칙

1. **코드 재사용 최대화**: Phase 1에서 작성한 코드를 Phase 2에서 거의 그대로 사용
2. **토글 패턴**: `notification.pubsub.enabled` 같은 설정 스위치로 메모리/Redis 전환
3. **위험 분산**: DB/이벤트 로직을 먼저 검증하고, 다중 서버 이슈는 나중에

---

## 📂 문서 구조

| 문서 | 내용 |
|---|---|
| [README.md](./README.md) | 전체 로드맵 + 현재 진행 상태 (본 문서) |
| [environment-strategy.md](./environment-strategy.md) | 로컬/개발/운영 환경별 구성 전략 |
| [phase-1-mvp.md](./phase-1-mvp.md) | **Phase 1** — Redis 없이 단일 인스턴스 MVP |
| [phase-2-scale.md](./phase-2-scale.md) | **Phase 2** — Redis Pub/Sub + ShedLock 추가 |
| [task-board.md](./task-board.md) | 실시간 작업 체크리스트 (진행 상태 관리) |
| [milestones.md](./milestones.md) | 일정 및 완료 기준 |

---

## 🚦 진행 상태 요약

### 현재 위치
**Phase 0 (선행 준비)** — 찍먹 완료, 본 구현 착수 직전

### Phase 1 — MVP 구현 (Redis 없이)
**상태**: ⏳ 시작 대기  
**목표**: 개발서버까지 알림 기능 동작 (BE 1대, Redis 없음, ShedLock 없음)  
**예상 공수**: 약 10일 (2주)

### Phase 2 — 운영 준비 (Redis + ShedLock)
**상태**: 📝 설계만  
**목표**: 운영 배포 가능한 형태로 확장 (BE 다수 인스턴스 대응)  
**예상 공수**: 약 5일 (1주)  
**진입 시점**: 운영 배포 일정 확정 후

---

## 🎯 단계 요약

### Phase 1 (지금 착수)

```
[로컬 개발 → 개발서버 배포]
 ├─ DB 스키마 (notification 테이블만)
 ├─ BE 구현
 │   ├─ Domain/Mapper/Service/Controller
 │   ├─ SseEmitterRegistry (메모리 기반)
 │   ├─ Spring Event 디스패처
 │   └─ @Scheduled 스케줄러 (ShedLock 없음)
 ├─ FE 구현
 │   ├─ React Query 훅 (목록/카운트/읽음)
 │   ├─ useNotificationStream (SSE)
 │   └─ 벨/드롭다운/목록 UI
 └─ 개발서버 배포 + 기능 검증
```

**제약:**
- BE 인스턴스 1대 필수 (다중 인스턴스 시 알림 전달 누락 가능)
- 개발서버는 단일 인스턴스 운영이라 문제없음

### Phase 2 (운영 배포 전)

```
[Redis Pub/Sub 연동 + ShedLock 추가]
 ├─ 인프라
 │   ├─ Redis 접근 확보 (전용 or 공유)
 │   └─ 운영 LB/Nginx SSE 설정
 ├─ BE 변경
 │   ├─ NotificationPubSubBridge 추가
 │   ├─ Dispatcher 토글 (메모리/Redis)
 │   ├─ ShedLock 도입
 │   └─ shedlock 테이블 DDL
 └─ 운영 배포
```

**Phase 1에서 Phase 2로 넘어갈 때 변경 범위:**
- 신규 파일 2~3개 추가
- 기존 코드 **수정은 1~2곳** (Dispatcher 토글 적용만)

---

## 🌐 환경별 구성 (요약)

| 환경 | BE 인스턴스 | Redis | ShedLock | 알림 push |
|---|---|---|---|---|
| 로컬 | 1대 | ❌ 불필요 | ❌ | 메모리 기반 |
| 개발서버 | 1대 | ❌ 불필요 (Phase 1) | ❌ | 메모리 기반 |
| 운영 | 2대 | ✅ 필수 | ✅ 필수 | Redis Pub/Sub |

상세는 [environment-strategy.md](./environment-strategy.md) 참조.

---

## 🔗 관련 문서

- 기획 스펙: [../01-spec.md](../01-spec.md)
- 기술 결정: [../02-tech-decisions.md](../02-tech-decisions.md)
- DB 모델: [../03-data-model.md](../03-data-model.md)
- API 스펙: [../04-api.md](../04-api.md)
- 이벤트 상세: [../05-events.md](../05-events.md)
- 기획 확인 필요: [../09-open-questions.md](../09-open-questions.md)
