# AGENTS.md - AI Agent Context & Guidelines

> AI 코딩 어시스턴트가 전체 모노레포 구조를 이해하고, 각 프로젝트 간의 관계와 개발 지침을 준수하기 위한 통합 가이드입니다.

## 🏗 프로젝트 구조 및 역할

본 프로젝트는 Nx 기반의 모노레포로 구성되어 있으며, 각 폴더는 다음과 같은 명확한 역할을 가집니다.

| 폴더명 | 역할 및 성격 | 지침 |
|:---:|:---|:---|
| `prototype` | **기획 단계의 초기 프로젝트** | UI/UX 컨셉과 주요 로직이 구현된 기준점입니다. 기획 의도를 파악할 때 최우선으로 참고합니다. |
| `frontend` | **실제 구현용 프론트엔드 프로젝트** | `prototype`을 벤치마킹하여 정교하게 구현해야 합니다. 최신 기술 스택(Vite + React + TS)을 사용합니다. |
| `backend` | **Java Spring Boot 기반 서버** | API의 데이터 구조와 비즈니스 로직의 원천입니다. `frontend` 구현 시 이 구조를 기반으로 연동합니다. |
| `agent` | **Python FastAPI 기반 AI 에이전트** | AI 분석 및 인터랙션 로직을 담당합니다. 본 지침 파일이 위치한 핵심 도메인 영역입니다. |

## 🛠 주요 개발 지침

### 1. 프론트엔드 구현 전략 (`frontend`)
- **Prototype 벤치마킹**: 새로운 UI나 기능을 만들 때 `prototype` 폴더 내의 컴포넌트 구조와 디자인 패턴을 분석하여 반영합니다.
- **Glass-morphism 디자인**: `frontend/src/index.css`에 정의된 프리미엄 다크 모드 및 글래스모피즘 스타일을 일관되게 적용합니다.
- **NX 연동**: 모든 실행은 루트의 `nx` 명령어를 통해 관리하며, `project.json`에 정의된 타겟을 준수합니다.

### 2. API 연동 가이드
- **Backend 참조 필수**: 아키텍처 설계 시 `backend` 프로젝트의 Controller 및 DTO 구조를 확인하여 `frontend`의 API 데이터 모델을 정의합니다.
- **Mocking 정책**: 백엔드 개발 완료 전에는 `prototype`에서 사용된 Mock Data 구조를 `frontend` 환경에 맞게 변환하여 사용합니다.

### 3. AI 에이전트 개발 (`agent`)
- **FastAPI 준수**: `agent/main.py`를 중심으로 모듈화된 라우팅 체계를 유지합니다.
- **도커 환경**: 빌드 시 모노레포 루트 경로를 Build Context로 사용하므로, 파일 참조 시 `agent/` 접두어를 포함한 경로를 사용해야 합니다.

## 🚫 주의 사항
- **개인정보 보호**: 학생 이름, 학번 등 PII(Personally Identifiable Information) 데이터는 AI 요청 시 반드시 마스킹 처리합니다.
- **하위 호환성**: 신규 기능을 추가할 때 기존 `prototype`의 검사 알고리즘이나 `backend`의 핵심 로직과 충돌하지 않는지 확인하십시오.

---
**최종 수정일**: 2026-03-17
**담당**: Antigravity AI Assistant
