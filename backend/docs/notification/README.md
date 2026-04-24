# 알림(Notification) 기능 설계 문서

> 최종 수정: 2026-04-24
> 작성 배경: 기획자 알림 이벤트 스펙(T1~T11, S1~S7, C1) 수령 → 구현 전 설계 정리

---

## 📌 개요

학심정에 실시간 알림 기능을 도입합니다. MVP는 **검사/그룹 2개 카테고리**, 교사/학생 각각의 주요 이벤트를 다룹니다.

### 핵심 결정

- **전달 방식**: SSE (Server-Sent Events)
- **다중 서버 공유**: Redis Pub/Sub
- **스케줄러 중복 방지**: ShedLock
- **이벤트 디스패치**: Spring `@TransactionalEventListener(AFTER_COMMIT)`
- **보관 정책**: 90일 자동 삭제

---

## 📂 문서 구조

### 설계 (Reference)

| 문서 | 내용 |
|---|---|
| [01-spec.md](./01-spec.md) | 기획 스펙 요약 (이벤트 목록, UI 규칙) |
| [02-tech-decisions.md](./02-tech-decisions.md) | 기술 선택 결정 사항과 근거 |
| [03-data-model.md](./03-data-model.md) | DB 스키마 (notification, shedlock) |
| [04-api.md](./04-api.md) | REST API + SSE 엔드포인트 스펙 |
| [05-events.md](./05-events.md) | 이벤트별 트리거 지점과 구현 세부 |
| [06-checklist-be.md](./06-checklist-be.md) | BE 작업 체크리스트 (전체) |
| [07-checklist-fe.md](./07-checklist-fe.md) | FE 작업 체크리스트 (전체) |
| [08-checklist-infra.md](./08-checklist-infra.md) | 인프라 팀 준비 항목 |
| [09-open-questions.md](./09-open-questions.md) | 기획/법무 확인 필요 항목 |
| [10-roadmap.md](./10-roadmap.md) | 구현 로드맵 및 공수 추정 (초기 버전) |

### 실행 (Plan) — **점진적 구현 계획 ⭐**

| 문서 | 내용 |
|---|---|
| [plan/README.md](./plan/README.md) | 점진적 구현 전략 (Phase 1/2) |
| [plan/environment-strategy.md](./plan/environment-strategy.md) | 로컬/개발/운영 환경별 구성 |
| [plan/phase-1-mvp.md](./plan/phase-1-mvp.md) | Phase 1 — Redis 없이 MVP |
| [plan/phase-2-scale.md](./plan/phase-2-scale.md) | Phase 2 — Redis + ShedLock |
| [plan/task-board.md](./plan/task-board.md) | **작업 체크리스트 (진행 현황)** |
| [plan/milestones.md](./plan/milestones.md) | 일정 및 마일스톤 |

**실제 구현 진행 중에는 `plan/task-board.md`를 주로 업데이트**합니다.

---

## 🚦 진행 상태

- [x] 기획 스펙 검토
- [x] 기술 선택 (폴링 → SSE로 상향)
- [ ] 기획자 확인 필요 항목 답변 대기 (S4/S5/S6 범위, T6 배치, 법무 등)
- [ ] 인프라 팀 Redis/LB 준비
- [ ] BE/FE 개발 시작

---

## 📊 요약 공수

- **기본 MVP**: 약 21.5일 (4~5주)
- 추가 기능 필요 시:
  - S4 이메일 초대 신규 개발: +3일
  - S5 추방 UI: +1일
  - S6 재검사 요청: +2일
