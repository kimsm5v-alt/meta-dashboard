"""
FastAPI 라우터 모듈.

main.py가 비대해지지 않도록 도메인별 엔드포인트를 이 디렉토리로 분리한다.
기존 /chat 계열은 main.py에 그대로 두고, 신규 도메인부터 여기에 추가한다.
"""
from . import school_record

__all__ = ["school_record"]
