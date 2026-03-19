# Meta Dashboard Monorepo

비상교육 학습심리정서검사 AI 프로젝트입니다.
이 프로젝트는 **폴리글랏 모노레포(Polyglot Monorepo)** 구조로 설계되어 있으며, Nx를 통해 통합 관리됩니다.

## 프로젝트 구조

프로젝트는 서비스 성격에 따라 주요 모듈로 구성되어 있습니다. 각 모듈은 독립적인 기술 스택을 가지며 Nx를 통해 연결됩니다.

| 모듈명 | 기술 스택 | 설명 | 핵심 디자인 패턴 |
| :--- | :--- | :--- | :--- |
| **frontend** | React, TypeScript, Vite | 실제 프로덕션 대응을 위한 신규 프론트엔드 | Component-based, Hooks |
| **prototype** | React, TypeScript, Vite | 대시보드 UI/UX 프로토타입 (사전 테스트 및 참고용) | Repository Pattern, Feature-based |
| **backend** | Java, Spring Boot 3.x | 핵심 비즈니스 로직 및 API | Layered Architecture (DDD Lite) |
| **agent** | Python 3.11+, FastAPI | AI 에이전트 및 모델 연동 | Strategy Pattern, Pipeline Pattern |

---

## 실행 및 빌드 방법

프로젝트의 모든 제어는 **프로젝트 루트 디렉토리**에서## 1. 사전 요구사항 (Prerequisites)

이 프로젝트를 실행하기 위해 각 운영체제별로 다음 도구들이 설치되어 있어야 합니다.

### 공통 필수 사항
- **Node.js**: v18 이상 추천 ([설치 페이지](https://nodejs.org/))
- **Git**: 코드 클론 및 관리용

---

### Mac (macOS)
1. **Homebrew 설치** (기본 패키지 관리자):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. **Python & pyenv**:
   ```bash
   brew install pyenv
   pyenv install 3.11.9
   pyenv global 3.11.9
   ```
3. **Java (JDK 17)**:
   ```bash
   brew install openjdk@17
   # 환경 변수 설정
   sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
   echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

### Windows
1. **Python**: [Official Python Downloads](https://www.python.org/downloads/windows/)에서 3.10 이상 설치 (설치 시 'Add Python to PATH' 반드시 체크)
2. **Java (JDK 17)**: [Adoptium (Temurin)](https://adoptium.net/temurin/releases/?version=17)에서 `.msi` 파일 다운로드하여 설치
3. **Git Bash**: 윈도우용 Git 설치 시 함께 포함되는 Git Bash 사용을 권장합니다.

### Linux (Ubuntu/Debian 기준)
1. **기본 빌드 도구**:
   ```bash
   sudo apt update && sudo apt install -y build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev xz-utils tk-dev libffi-dev liblzma-dev python3-openssl git
   ```
2. **pyenv & Python**:
   ```bash
   curl https://pyenv.run | bash
   # ~/.bashrc 등에 안내된 환경변수 추가 후 실행
   pyenv install 3.11.9
   pyenv global 3.11.9
   ```
3. **Java (JDK 17)**:
   ```bash
   sudo apt install openjdk-17-jdk
   ```

---

## 2. 의존성 설치
반드시 루트 디렉토리에서 실행하여 전체 워크스페이스의 의존성을 설치해야 합니다.
```bash
npm install
```
> [!NOTE]
> 에이전트(agent) 모듈은 실행 시 `pyenv`와 `venv`를 자동으로 확인하여 가상환경을 구성하고 의존성을 설치합니다.

### 3. 프로젝트 확인
등록된 프로젝트 목록을 확인합니다.
```bash
npx nx show projects
# 출력: frontend, prototype, backend, agent
```

### 4. 모듈별 실행
루트 디렉토리에서 `npm run` 명령어로 각 모듈을 실행할 수 있습니다.

```bash
# 프론트엔드 + 에이전트 + 백엔드 + 프로토타입 동시 실행
# 개발 시 전체 시스템(Full-stack)이 필요한 경우 사용합니다.
npm run start

# 개별 모듈 실행
npm run frontend
npm run prototype
npm run backend
npm run agent
```

### 5. 전체 빌드
```bash
npm run build  # 또는 npx nx run-many -t build
```

---

## 아키텍처 가이드라인

유지보수 비용을 최소화하기 위해 다음 규칙을 준수합니다.

1. **클린 코드**: 가독성이 높고 모듈화된 코드를 지향합니다.
2. **인터페이스 기반 설계**: 백엔드와 에이전트는 인터페이스와 구현체를 분리하여 결합도를 낮춥니다.
3. **계약 중심 통신**: 모둘 간 통신은 OpenAPI 명세를 기준으로 정합성을 유지합니다.
4. **Emoji 지양**: 주석 및 소스코드에 이모지를 사용하지 않습니다.
