import os
import logging
from typing import List
from litellm import Router
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# 환경 변수 검증 및 다중 키 추출
def get_api_keys(provider_prefix: str) -> List[str]:
    """
    환경 변수에서 특정 프로바이더의 모든 API 키를 추출합니다.
    예: GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3 등
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

def setup_model_list():
    """모든 가용 API 키를 바탕으로 LiteLLM용 모델 리스트를 생성합니다."""
    model_configs = []
    
    
    # 1. OpenAI (비활성화)
    # openai_keys = get_api_keys("OPENAI")
    # for key in openai_keys:
    #     model_configs.append({
    #         "model_name": "meta-agent-service",
    #         "litellm_params": {"model": "openai/gpt-4o", "api_key": key}
    #     })

    # 2. Gemini (활성화)
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    gemini_keys = get_api_keys("GEMINI")


    
    for key in gemini_keys:
        if key:
            model_configs.append({
                "model_name": "meta-agent-service",
                "litellm_params": {
                    "model": f"gemini/{gemini_model.replace('gemini/', '')}",
                    "api_key": key,
                }
            })

    # 3. Anthropic (비활성화)
    # anthropic_keys = get_api_keys("ANTHROPIC")
    # for key in anthropic_keys:
    #     model_configs.append({
    #         "model_name": "meta-agent-service",
    #         "litellm_params": {"model": "anthropic/claude-3-5-sonnet", "api_key": key}
    #     })

    if not model_configs:
        logger.warning("설정된 유효한 API 키가 없습니다. .env 파일을 확인하세요.")
    
    return model_configs

# 모델 리스트 생성
model_list = setup_model_list()

# LiteLLM Router 설정
llm_router = Router(
    model_list=model_list,
    routing_strategy="least-busy", # 향후 확장성을 고려해 기본 전략 유지
    num_retries=3,
    set_verbose=False
)

