"""
생활기록부 문구 생성 엔드포인트.

단건(학생별 작성)과 일괄 생성이 같은 요청 계약을 쓴다 — 단건은 students 길이가 1이다.
분리 축은 "단건 vs 일괄"이 아니라 "stream vs non-stream"이며, 이는 기존 /chat 과 /chat/stream
쌍의 관례를 따른 것이다.
"""
import json
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.school_record import RecordGenerateRequest, RecordGenerateResponse
from app.services.school_record_service import school_record_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/school-record", tags=["school-record"])


@router.post("/generate", response_model=RecordGenerateResponse)
async def generate(request: RecordGenerateRequest) -> RecordGenerateResponse:
    """전체 생성 완료 후 한 번에 반환한다.

    스트리밍이 불필요한 단건 생성, 재시도, 배치 검증에서 사용한다.
    """
    try:
        return await school_record_service.generate_all(request)
    except Exception as e:
        logger.error(f"School record generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="문구 생성 중 오류가 발생했습니다.")


@router.post("/generate/stream")
async def generate_stream(request: RecordGenerateRequest) -> StreamingResponse:
    """학생 단위로 순차 응답하는 SSE 스트림.

    이벤트: start / student_start / token / student_done / student_error / ping / done
    학생 1명의 실패는 student_error로 알리고 스트림은 계속된다 — 10명 중 1명 때문에
    나머지 9명의 결과를 버리지 않는다.
    """

    async def event_generator():
        try:
            async for event in school_record_service.stream_all(request):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.error(f"School record streaming failed: {e}", exc_info=True)
            error = {"type": "error", "message": "문구 생성 중 오류가 발생했습니다."}
            yield f"data: {json.dumps(error, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        # 중간 프록시(nginx 등)가 SSE를 버퍼링하면 "순차 응답"이 성립하지 않는다.
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
