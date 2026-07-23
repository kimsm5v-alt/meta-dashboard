"""
멀티모달(이미지) 입력 검증 유틸리티

AgentQuery.images로 들어오는 base64 data URI를 LLM에 전달하기 전에 검증한다.
형식/크기/개수가 부적절한 요청이 그대로 litellm/모델 API까지 가서 애매한 500
에러로 터지는 것을 방지하기 위해 API 경계(main.py)에서 먼저 걸러낸다.
"""
import re
from typing import List, Optional

MAX_IMAGES_PER_TURN = 3
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB (원본 바이트 기준, base64 길이로 근사 계산)

_DATA_URI_RE = re.compile(r"^data:image/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/]+=*)$")


class ImageValidationError(ValueError):
    """이미지 입력이 형식/크기/개수 제약을 위반했을 때 발생한다."""


def validate_images(images: Optional[List[str]]) -> Optional[List[str]]:
    """images 목록을 검증하고 그대로 반환한다. 비어있으면 None을 반환한다.

    Raises:
        ImageValidationError: 개수 초과, 포맷 불일치, 크기 초과 시.
    """
    if not images:
        return None

    if len(images) > MAX_IMAGES_PER_TURN:
        raise ImageValidationError(f"이미지는 최대 {MAX_IMAGES_PER_TURN}장까지 첨부할 수 있습니다.")

    for img in images:
        match = _DATA_URI_RE.match(img)
        if not match:
            raise ImageValidationError(
                "이미지는 data:image/(png|jpeg|webp|gif);base64,... 형식의 data URI여야 합니다."
            )
        approx_bytes = len(match.group(2)) * 3 // 4
        if approx_bytes > MAX_IMAGE_BYTES:
            raise ImageValidationError(
                f"이미지 크기는 장당 최대 {MAX_IMAGE_BYTES // (1024 * 1024)}MB까지 허용됩니다."
            )

    return images
