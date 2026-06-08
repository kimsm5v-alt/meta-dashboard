import os
import logging
import litellm
from typing import List, Tuple
from litellm import Router
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# 기본(Primary) 모델 그룹명: OpenAI (AgentService가 호출하는 논리명)
MODEL_NAME_PRIMARY = "meta-agent-primary"
# 폴백(Fallback) 모델 그룹명: Gemini
MODEL_NAME_FALLBACK = "meta-agent-fallback"

def get_api_keys(provider_prefix: str) -> List[str]:
    """
    환경 변수에서 특정 프로바이더의 모든 API 키를 추출합니다.
    예: OPENAI_API_KEY, OPENAI_API_KEY_2, OPENAI_API_KEY_3 등
    """
    keys = []
    # 기본 키 확인
    base_key = os.getenv(f"{provider_prefix}_API_KEY")
    if base_key:
        keys.append(base_key)
    
    # 추가 키 확인 (_2, _3, ...)
    i = 2
    while True:
        extra_key = os.getenv(f"{provider_prefix}_API_KEY_{i}")
        if not extra_key:
            break
        keys.append(extra_key)
        i += 1
    
    return keys


def setup_model_list() -> Tuple[List[dict], bool, bool]:
    """
    LiteLLM용 모델 리스트를 생성하고 각 프로바이더 활성화 여부를 반환합니다.

    Returns:
        (model_configs, has_primary, has_fallback)
    """
    model_configs = []
    has_primary = False
    has_fallback = False

    # 1. OpenAI (기본 Primary 프로바이더)
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4.1")
    openai_keys = get_api_keys("OPENAI")
    for key in openai_keys:
        model_configs.append({
            "model_name": MODEL_NAME_PRIMARY,
            "litellm_params": {
                "model": f"openai/{openai_model}",
                "api_key": key,
            }
        })
    if openai_keys:
        has_primary = True
        logger.info(f"OpenAI 프로바이더 등록: {len(openai_keys)}개 키, 모델={openai_model}")

    # 2. Gemini (Fallback 프로바이더)
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    gemini_keys = get_api_keys("GEMINI")
    for key in gemini_keys:
        model_configs.append({
            "model_name": MODEL_NAME_FALLBACK,
            "litellm_params": {
                "model": f"gemini/{gemini_model.replace('gemini/', '')}",
                "api_key": key,
            }
        })
    if gemini_keys:
        has_fallback = True
        logger.info(f"Gemini 폴백 프로바이더 등록: {len(gemini_keys)}개 키, 모델={gemini_model}")

    # 3. Anthropic (비활성화 - 필요 시 주석 해제)
    # anthropic_keys = get_api_keys("ANTHROPIC")
    # for key in anthropic_keys:
    #     model_configs.append({
    #         "model_name": MODEL_NAME_FALLBACK,
    #         "litellm_params": {"model": "anthropic/claude-3-5-sonnet", "api_key": key}
    #     })

    if not model_configs:
        logger.warning("설정된 유효한 API 키가 없습니다. .env 파일을 확인하세요.")

    return model_configs, has_primary, has_fallback


# 모델 리스트 및 활성화 여부 확인
model_list, has_primary, has_fallback = setup_model_list()

# 폴백 전략: OpenAI 실패 시 Gemini로 자동 전환
# Primary가 없으면 Fallback을 직접 호출하도록 논리명 재지정
_call_model = MODEL_NAME_PRIMARY if has_primary else MODEL_NAME_FALLBACK
_fallbacks = [{MODEL_NAME_PRIMARY: [MODEL_NAME_FALLBACK]}] if (has_primary and has_fallback) else []

if not has_primary:
    logger.warning("OpenAI 키가 없습니다. Gemini를 기본으로 사용합니다.")
if not has_fallback:
    logger.warning("Gemini 키가 없습니다. OpenAI 단독 운영됩니다.")

# LangSmith 트레이싱은 agent_service.py의 @traceable 데코레이터가 담당한다.
# LiteLLM success_callback="langsmith"를 동시에 활성화하면 동일 LLM 호출이
# LangSmith에 중복 Run으로 기록되므로 여기서는 등록하지 않는다.
# 참고: https://docs.smith.langchain.com/observability/how_to_guides/trace_with_litellm


# LiteLLM Router 설정
llm_router = Router(
    model_list=model_list,
    fallbacks=_fallbacks,
    routing_strategy="least-busy",
    num_retries=3,
    set_verbose=False
)

# AgentService가 호출할 단일 논리 모델명
ROUTER_MODEL_NAME = _call_model
