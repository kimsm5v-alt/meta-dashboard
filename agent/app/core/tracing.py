"""
LangSmith 트레이싱 초기화 모듈

애플리케이션 기동 시 1회 초기화하여 LangSmith 연동 상태를 관리한다.
환경변수 LANGSMITH_ENV 값을 기반으로 프로젝트명을 자동 구성한다.

프로젝트명 규칙: meta-dashboard-agent-{LANGSMITH_ENV}
  예) LANGSMITH_ENV=dev   -> meta-dashboard-agent-dev
  예) LANGSMITH_ENV=prod  -> meta-dashboard-agent-prod
"""
import os
import logging

logger = logging.getLogger(__name__)

# 프로젝트 이름 베이스 (환경별 suffix가 붙음)
_PROJECT_BASE = "meta-dashboard-agent"

# 모듈 레벨 싱글톤 활성화 플래그
_langsmith_enabled: bool = False


def _build_project_name() -> str:
    """
    LANGSMITH_ENV 환경변수를 읽어 환경별 LangSmith 프로젝트명을 생성한다.

    Returns:
        str: 프로젝트명 (예: meta-dashboard-agent-dev)
    """
    env = os.getenv("LANGSMITH_ENV", "dev").strip().lower()
    return f"{_PROJECT_BASE}-{env}"


def setup_langsmith() -> bool:
    """
    LangSmith 트레이싱을 초기화한다.
    LANGSMITH_TRACING=true 이고 API 키가 있을 때만 활성화된다.

    - LANGSMITH_PROJECT 환경변수를 주입하여 langsmith SDK가 올바른 프로젝트로 전송하도록 한다.
    - LLM 호출 캡처는 agent_service의 langsmith.trace() context manager가 담당한다.

    Returns:
        bool: 활성화 여부
    """
    tracing_flag = os.getenv("LANGSMITH_TRACING", "false").lower()
    api_key = os.getenv("LANGSMITH_API_KEY", "").strip()

    if tracing_flag != "true" or not api_key:
        logger.info("LangSmith 트레이싱 비활성화 (LANGSMITH_TRACING != true 또는 API 키 미설정).")
        return False

    project_name = _build_project_name()

    # langsmith SDK 0.2+ 표준 환경변수 직접 설정
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGSMITH_API_KEY"] = api_key
    os.environ["LANGSMITH_PROJECT"] = project_name

    endpoint = os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
    os.environ["LANGSMITH_ENDPOINT"] = endpoint

    logger.info(f"LangSmith 트레이싱 활성화: project={project_name}, endpoint={endpoint}")
    return True


def initialize() -> None:
    """
    애플리케이션 기동 시 1회 호출하여 LangSmith를 초기화한다.
    main.py의 lifespan에서 호출한다.
    """
    global _langsmith_enabled
    _langsmith_enabled = setup_langsmith()


def is_enabled() -> bool:
    """LangSmith 트레이싱 활성화 여부를 반환한다."""
    return _langsmith_enabled
