"""
프롬프트 템플릿 로더

기획자가 Python 코드를 몰라도 시스템 프롬프트/Tool 정책 문구를 수정할 수 있도록,
순수 지침 텍스트를 이 디렉토리의 .md 파일로 분리했다.

- load_prompt()는 매 호출마다 파일을 새로 읽는다(캐싱 없음). 프롬프트 문구는
  요청당 1회 정도만 조립되므로 파일 IO 비용은 무시할 수 있고, 대신 planner가
  파일을 수정하면 서버 재시작 없이 다음 요청부터 바로 반영된다.
- 반환값은 rstrip("\n")으로 정규화된다. 파일 끝의 개행 수는 에디터/OS마다
  달라질 수 있으므로, 섹션 간 공백 줄 수는 호출부(agent_graph.py/agent_service.py)
  코드가 명시적으로 통제한다 — .md 파일의 trailing newline 처리에 좌우되지 않는다.

주의: Tool 함수의 docstring(app/tools/*.py)은 이 디렉토리에 포함하지 않는다.
LangChain이 그 docstring을 그대로 읽어 LLM 함수 호출 스키마(Args 포함)로 변환하므로,
문구를 잘못 수정하면 Tool 호출 자체가 깨질 수 있어 개발자가 코드로 계속 관리한다.
"""
from pathlib import Path

_PROMPTS_DIR = Path(__file__).parent


def load_prompt(name: str) -> str:
    """prompts/{name}.md 파일 내용을 읽어 반환한다 (앞뒤 개행 제거)."""
    path = _PROMPTS_DIR / f"{name}.md"
    return path.read_text(encoding="utf-8").strip("\n")
