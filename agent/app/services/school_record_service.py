"""
생활기록부 문구 생성 서비스.

설계 근거: agent/docs/SCHOOL_RECORD_GENERATION_PLAN.md

에이전트 대화(/chat)와 달리 Tool 호출이 필요 없다 — 프론트가 요인 결과와 관찰 입력을
모두 실어 보내므로 LangGraph를 타지 않고 LiteLLM Router를 직접 단발 호출한다.
"""
import asyncio
import logging
from contextlib import nullcontext
from typing import Any, AsyncIterator, Optional

import langsmith
from langsmith import traceable

from app.core.llm_router import llm_router, ROUTER_MODEL_NAME
from app.core.prompts import load_prompt
from app.core.school_record_policy import (
    HARD_CHAR_LIMIT,
    SCHOOL_LEVEL_GUIDELINES,
    TARGET_CHAR_MAX,
    TARGET_CHAR_MIN,
    get_type_guide,
    pick_sentence_pattern,
    t_score_to_level,
)
from app.core.tracing import is_enabled as langsmith_is_enabled
from app.models.school_record import (
    ForbiddenHit,
    RecordGenerateRequest,
    RecordGenerateResponse,
    RecordResult,
    RecordStudentInput,
)
from app.utils.record_validator import (
    check_blocking,
    check_warnings,
    count_chars,
    strip_formatting,
)

logger = logging.getLogger(__name__)

# 학생 1명당 생성 제한시간. 초과분은 해당 학생만 실패 처리하고 나머지는 계속 진행한다.
STUDENT_TIMEOUT_SECONDS = 30.0
# 선행 생성 동시성. 순차 "응답"은 유지하되 10명 × 3초를 그대로 기다리지 않기 위한 값.
PREFETCH_CONCURRENCY = 3
# 이벤트 공백이 길어질 때 중간 프록시의 idle timeout을 피하기 위한 heartbeat 주기.
HEARTBEAT_SECONDS = 15.0
# 정책 위반(차단 패턴 적중)·분량 초과 시 재생성 횟수. 10명 × 2회면 지연이 두 배가 된다.
MAX_RETRY_PER_STUDENT = 1
# 중복 회피 지시에 나열할 도입부 개수. 무제한으로 쌓으면 30명째 프롬프트에 어절 29개가
# 나열되어 회피 지시가 본문 지시보다 비대해진다.
MAX_AVOID_OPENINGS = 5

# 분량은 action에 따라 달라진다. 여기서만 지시하고 _ACTION_INSTRUCTIONS는 분량을 언급하지
# 않는다 — 양쪽이 각자 문장 수를 말하면 프롬프트 안에서 서로 모순된다.
_LENGTH_INSTRUCTIONS = {
    "generate": f"공백 제외 {TARGET_CHAR_MIN}~{TARGET_CHAR_MAX}자, 세 문장으로 씁니다.",
    "rewrite": f"공백 제외 {TARGET_CHAR_MIN}~{TARGET_CHAR_MAX}자, 세 문장으로 씁니다.",
    "shorten": "핵심만 남겨 두 문장 이내로 줄입니다.",
    "expand": f"공백 제외 {TARGET_CHAR_MAX}~400자, 네 문장으로 씁니다.",
}

_ACTION_INSTRUCTIONS = {
    "generate": "",
    "rewrite": (
        "아래 '직전 문구'와 같은 내용을 다루되 문장 구성과 표현을 확실히 다르게 바꿔 다시 씁니다. "
        "같은 어절로 시작하지 않습니다."
    ),
    "shorten": "아래 '직전 문구'를 줄여 씁니다. 새로운 내용을 덧붙이지 않고 핵심만 남깁니다.",
    "expand": (
        "아래 '직전 문구'를 바탕으로, 관찰된 모습이 학교생활 전반에서 어떻게 이어지는지 "
        "덧붙여 자세히 씁니다."
    ),
}

# 직전 문구를 요청에 실어야 하는 action과, 그때 붙일 라벨.
# generate는 백지에서 새로 쓰므로 대상이 없다.
_PREVIOUS_TEXT_LABELS = {
    "rewrite": "직전 문구 (이것과 다르게 써야 합니다)",
    "shorten": "직전 문구 (이 문구를 줄여야 합니다)",
    "expand": "직전 문구 (이 문구를 확장해야 합니다)",
}


class SchoolRecordService:
    def __init__(self):
        self.router = llm_router

    # ── 프롬프트 조립 ────────────────────────────────────────
    @staticmethod
    def _system_prompt(
        req: RecordGenerateRequest,
        student: RecordStudentInput,
        index: int,
        avoid_openings: list[str],
    ) -> str:
        guide = SCHOOL_LEVEL_GUIDELINES.get(
            req.school_level_code, SCHOOL_LEVEL_GUIDELINES["elementary"]
        )
        sections = [
            load_prompt("school_record_rules"),
            load_prompt(guide["prompt_file"]),
        ]

        sections.append(
            "## 분량\n"
            f"{_LENGTH_INSTRUCTIONS.get(req.action, _LENGTH_INSTRUCTIONS['generate'])} "
            f"어떤 경우에도 {HARD_CHAR_LIMIT}자를 넘기지 않습니다."
        )

        sections.append(
            "## 이번 문구의 문장 구조\n"
            f"{pick_sentence_pattern(index, student.round2_available)}"
        )

        type_guide = get_type_guide(student.lpa_type)
        if type_guide:
            sections.append(
                "## 이 학생의 서술 방향\n"
                f"- 초점: {type_guide['focus']}\n"
                f"- 전개: {type_guide['pattern']}"
            )
        else:
            sections.append(
                "## 이 학생의 서술 방향\n"
                "심리유형 정보가 없는 학생입니다. 유형에 근거한 서술을 하지 말고 "
                "요인별 검사 결과와 교사의 관찰 내용만으로 작성합니다."
            )

        if student.round2_available and student.round_changes:
            sections.append(
                "## 성장 서사\n"
                "1차 검사 대비 2차 검사의 변화가 확인된 학생입니다. 학기 초와 견주어 "
                "무엇이 어떻게 달라졌는지를 문구 안에 반드시 담습니다. 다만 점수나 수치는 쓰지 않고 "
                "행동과 태도의 변화로 표현합니다."
            )

        action_note = _ACTION_INSTRUCTIONS.get(req.action, "")
        if action_note:
            sections.append(f"## 이번 요청\n{action_note}")

        if avoid_openings:
            recent = avoid_openings[-MAX_AVOID_OPENINGS:]
            joined = ", ".join(f'"{opening}"' for opening in recent)
            sections.append(
                "## 중복 회피\n"
                f"같은 학급의 다른 학생 문구가 이미 {joined} 로 시작했습니다. "
                "이와 다른 어절로 시작하고, 문장 구성도 겹치지 않게 씁니다."
            )

        return "\n\n".join(sections)

    @staticmethod
    def _user_message(req: RecordGenerateRequest, student: RecordStudentInput) -> str:
        lines = [
            "# 학생 정보",
            f"- 학교급: {req.school_level}",
            f"- 학년: {req.grade}학년",
        ]

        if student.strengths:
            lines.append("\n# 검사 결과 — 강점 요인")
            for factor in student.strengths:
                lines.append(f"- {factor.name}: {t_score_to_level(factor.t_score)}")

        if student.improvements:
            lines.append("\n# 검사 결과 — 성장이 기대되는 요인")
            lines.append(
                "(이 요인들은 부족한 점이 아니라, 스스로 조절하고 노력한 모습으로 서술할 대상입니다)"
            )
            for factor in student.improvements:
                lines.append(f"- {factor.name}: {t_score_to_level(factor.t_score)}")

        if student.round2_available and student.round_changes:
            lines.append("\n# 1차 → 2차 변화")
            for change in student.round_changes:
                lines.append(f"- {change.category}: {change.direction}")

        if req.source == "COMMON_CONTEXT" and req.common_context:
            common = req.common_context
            lines.append("\n# 학급 공통 상황")
            lines.append(f"- 상황: {common.situation_label}")
            if common.activity_text:
                lines.append(f"- 활동: {common.activity_text}")
            for behavior in common.behaviors:
                lines.append(f"- 관찰된 행동: {behavior}")

        observation = student.observation
        if req.source != "TEST_ONLY" and observation:
            if observation.observations:
                lines.append("\n# 교사가 관찰한 모습")
                for entry in observation.observations:
                    polarity = "강점" if entry.type == "strength" else "성장"
                    lines.append(f"- {entry.factor} ({polarity})")
                    for behavior in entry.behavior_codes:
                        lines.append(f"  - {behavior}")
            if observation.free_text:
                lines.append(f"\n# 구체적인 장면\n{observation.free_text}")
            if observation.counseling_notes:
                lines.append("\n# 상담·관찰 기록")
                lines.append(
                    "(내용을 그대로 옮기지 말고, 확인된 태도와 변화 의지만 반영합니다)"
                )
                for note in observation.counseling_notes:
                    lines.append(f"- {note}")

        previous_label = _PREVIOUS_TEXT_LABELS.get(req.action)
        if previous_label and student.previous_text:
            lines.append(f"\n# {previous_label}\n{student.previous_text}")

        lines.append(
            "\n---\n위 정보를 바탕으로 행동특성 및 종합의견 문구만 출력하세요."
        )
        return "\n".join(lines)

    # ── LLM 호출 ─────────────────────────────────────────────
    @traceable(run_type="llm", name="LiteLLM")
    async def _complete(self, messages: list[dict]) -> str:
        response = await self.router.acompletion(model=ROUTER_MODEL_NAME, messages=messages)
        return response.choices[0].message.content or ""

    async def _stream(self, messages: list[dict]) -> AsyncIterator[str]:
        response = await self.router.acompletion(
            model=ROUTER_MODEL_NAME, messages=messages, stream=True
        )
        async for chunk in response:
            delta = chunk.choices[0].delta
            if getattr(delta, "content", None):
                yield delta.content

    # ── 대기 중 heartbeat ────────────────────────────────────
    async def _stream_with_heartbeat(self, messages: list[dict]) -> AsyncIterator[tuple[str, Any]]:
        """토큰을 흘리되 생성이 멎으면 ping을 끼워 넣고, 전체를 타임아웃으로 묶는다.

        ("token", 조각) 또는 ("ping", None)을 내보낸다. 토큰이 흐르는 동안에는 그 자체가
        keep-alive지만, 첫 토큰 전이나 스트림 도중 멈추면 아무것도 나가지 않아 중간 프록시가
        연결을 끊는다. 타임아웃은 소비 속도가 아니라 생성 시간에만 걸리도록 생산자 쪽에 둔다.
        """
        queue: asyncio.Queue = asyncio.Queue()

        async def produce() -> None:
            try:
                async with asyncio.timeout(STUDENT_TIMEOUT_SECONDS):
                    async for token in self._stream(messages):
                        queue.put_nowait(("token", token))
                queue.put_nowait(("done", None))
            except asyncio.CancelledError:
                raise
            except BaseException as e:  # noqa: BLE001 — 소비자에게 그대로 전달해 처리한다
                queue.put_nowait(("error", e))

        producer = asyncio.create_task(produce())
        try:
            while True:
                try:
                    kind, payload = await asyncio.wait_for(
                        queue.get(), timeout=HEARTBEAT_SECONDS
                    )
                except asyncio.TimeoutError:
                    yield "ping", None
                    continue
                if kind == "done":
                    return
                if kind == "error":
                    raise payload
                yield "token", payload
        finally:
            if not producer.done():
                producer.cancel()

    async def _await_with_heartbeat(self, task: asyncio.Task) -> AsyncIterator[tuple[str, Any]]:
        """태스크를 기다리며 공백이 길어지면 ping을 끼워 넣는다.

        ("ping", None)을 0회 이상 내보낸 뒤 마지막에 ("result", 결과)를 내보낸다.
        """
        try:
            while not task.done():
                done, _ = await asyncio.wait({task}, timeout=HEARTBEAT_SECONDS)
                if not done:
                    yield "ping", None
            yield "result", task.result()
        finally:
            if not task.done():
                task.cancel()

    # ── 후처리 ───────────────────────────────────────────────
    @staticmethod
    def _finalize(raw: str) -> tuple[str, list[ForbiddenHit], bool]:
        """(정리된 문구, 경고, 재생성 필요 여부)를 돌려준다."""
        text = strip_formatting(raw)
        blocking = check_blocking(text)
        too_long = count_chars(text) > HARD_CHAR_LIMIT
        warnings = [ForbiddenHit(**hit) for hit in check_warnings(text)]
        return text, warnings, bool(blocking) or too_long

    async def _generate_one(
        self,
        req: RecordGenerateRequest,
        student: RecordStudentInput,
        index: int,
        avoid_openings: list[str],
    ) -> RecordResult:
        """학생 1명 생성 + 후처리. 정책 위반이나 분량 초과면 1회까지 재생성한다."""
        messages = [
            {"role": "system", "content": self._system_prompt(req, student, index, avoid_openings)},
            {"role": "user", "content": self._user_message(req, student)},
        ]

        text, warnings, needs_retry = self._finalize(await self._complete(messages))

        for _ in range(MAX_RETRY_PER_STUDENT):
            if not needs_retry:
                break
            logger.info("재생성: student_id=%s (정책 위반 또는 분량 초과)", student.student_id)
            retry_messages = messages + [
                {"role": "assistant", "content": text},
                {
                    "role": "user",
                    "content": (
                        "위 문구는 기재 규칙을 지키지 못했습니다. 금지 표현(대회·수상, 사교육, "
                        "공인어학시험, 추측성 표현, 비교·서열화)을 모두 빼고, 공백 제외 "
                        f"{TARGET_CHAR_MAX}자 이내로 다시 작성하세요. 문구만 출력합니다."
                    ),
                },
            ]
            text, warnings, needs_retry = self._finalize(await self._complete(retry_messages))

        # 재생성 후에도 남은 위반은 경고로 넘겨 교사가 판단하게 한다(무한 루프 방지).
        if needs_retry:
            warnings = warnings + [ForbiddenHit(**hit) for hit in check_blocking(text)]

        return RecordResult(
            student_id=student.student_id,
            text=text,
            char_count=count_chars(text),
            warnings=warnings,
        )

    # ── 실행: 단발 / 스트리밍 ────────────────────────────────
    def _trace(self, name: str, req: RecordGenerateRequest):
        if not langsmith_is_enabled():
            return nullcontext()
        return langsmith.trace(
            name=name,
            inputs={"students": len(req.students), "source": req.source, "action": req.action},
            tags=["school-record"],
            metadata={
                "session_id": req.session_id,
                "class_id": req.class_id,
                "school_level_code": req.school_level_code,
            },
        )

    async def _guarded(
        self,
        req: RecordGenerateRequest,
        student: RecordStudentInput,
        index: int,
        avoid_openings: list[str],
    ) -> tuple[Optional[RecordResult], Optional[str]]:
        """예외를 학생 단위로 가둔다. 10명 중 1명이 실패해도 나머지는 완주해야 한다."""
        try:
            result = await asyncio.wait_for(
                self._generate_one(req, student, index, avoid_openings),
                timeout=STUDENT_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            logger.warning("생성 시간 초과: student_id=%s", student.student_id)
            return None, "생성 시간이 초과되었습니다."
        except asyncio.CancelledError:
            raise
        except Exception as e:  # noqa: BLE001 — 어떤 실패든 이 학생만 실패로 처리한다
            logger.error("생성 실패: student_id=%s (%s)", student.student_id, e, exc_info=True)
            return None, "문구를 생성하지 못했습니다."

        # 다음 학생이 같은 어절로 시작하지 않도록 도입부를 공유한다(best-effort:
        # 선행 생성 중인 학생은 이 목록을 보지 못할 수 있다).
        opening = result.text.split(" ", 1)[0] if result.text else ""
        if opening and opening not in avoid_openings:
            avoid_openings.append(opening)
        return result, None

    def _create_tasks(
        self, req: RecordGenerateRequest, avoid_openings: list[str]
    ) -> list[asyncio.Task]:
        """학생별 생성 태스크를 만들고 동시 실행을 PREFETCH_CONCURRENCY로 묶는다.

        스트리밍·단발이 같은 동시성 정책을 쓰도록 한 곳에서 만든다.
        """
        semaphore = asyncio.Semaphore(PREFETCH_CONCURRENCY)

        async def run(index: int, student: RecordStudentInput):
            async with semaphore:
                return await self._guarded(req, student, index, avoid_openings)

        return [
            asyncio.create_task(run(index, student))
            for index, student in enumerate(req.students)
        ]

    async def generate_all(self, req: RecordGenerateRequest) -> RecordGenerateResponse:
        """단발 응답. 재시도·배치·검증용.

        스트리밍과 동일하게 동시 실행을 묶는다 — 순차로 돌리면 10명 요청이 학생 수에
        비례해 길어져 게이트웨이 타임아웃에 걸린다.
        """
        avoid_openings: list[str] = []
        results: list[RecordResult] = []
        errors: list[dict] = []

        with self._trace("school-record-generate", req) as run_tree:
            tasks = self._create_tasks(req, avoid_openings)
            try:
                outcomes = await asyncio.gather(*tasks)
            except BaseException:
                for task in tasks:
                    if not task.done():
                        task.cancel()
                raise

            for student, (result, error) in zip(req.students, outcomes):
                if result:
                    results.append(result)
                else:
                    errors.append({"student_id": student.student_id, "message": error})

            if run_tree is not None:
                run_tree.end(outputs={"succeeded": len(results), "failed": len(errors)})

        return RecordGenerateResponse(
            results=results,
            succeeded=len(results),
            failed=len(errors),
            errors=errors,
        )

    async def stream_all(self, req: RecordGenerateRequest) -> AsyncIterator[dict[str, Any]]:
        """학생 단위 순차 이벤트 스트림.

        stream_tokens=False면 최대 PREFETCH_CONCURRENCY명을 미리 생성하되 index 순서대로만
        방출한다(체감 대기 단축, 순차 UX 유지). True면 토큰 순서를 지키기 위해 엄격히 순차 처리한다.
        """
        yield {"type": "start", "total": len(req.students)}
        succeeded = 0
        failed = 0

        inner = self._stream_sequential(req) if req.stream_tokens else self._stream_prefetched(req)

        with self._trace("school-record-stream", req) as run_tree:
            async for event in inner:
                if event["type"] == "student_done":
                    succeeded += 1
                elif event["type"] == "student_error":
                    failed += 1
                yield event

            if run_tree is not None:
                run_tree.end(outputs={"succeeded": succeeded, "failed": failed})

        yield {"type": "done", "succeeded": succeeded, "failed": failed}

    async def _stream_sequential(self, req: RecordGenerateRequest) -> AsyncIterator[dict[str, Any]]:
        """토큰 스트리밍 경로 — 선행 생성 없이 한 명씩.

        주의: token 이벤트는 후처리 이전의 원문이다. 마크다운 제거·재생성이 적용된 최종본은
        student_done의 text이므로 클라이언트는 그 값으로 교체해야 한다.
        """
        avoid_openings: list[str] = []
        for index, student in enumerate(req.students):
            yield {"type": "student_start", "index": index, "student_id": student.student_id}
            buffer = ""
            try:
                messages = [
                    {
                        "role": "system",
                        "content": self._system_prompt(req, student, index, avoid_openings),
                    },
                    {"role": "user", "content": self._user_message(req, student)},
                ]
                async for kind, payload in self._stream_with_heartbeat(messages):
                    if kind == "ping":
                        yield {"type": "ping"}
                        continue
                    buffer += payload
                    yield {
                        "type": "token",
                        "index": index,
                        "student_id": student.student_id,
                        "text": payload,
                    }

                text, warnings, needs_retry = self._finalize(buffer)
                if needs_retry:
                    # 위반이 있으면 스트리밍 결과를 버리고 비스트리밍 경로로 다시 만든다.
                    # 재생성도 최대 30초가 걸리므로 그동안 heartbeat를 유지한다.
                    retry = asyncio.create_task(
                        self._guarded(req, student, index, avoid_openings)
                    )
                    result = error = None
                    async for kind, payload in self._await_with_heartbeat(retry):
                        if kind == "ping":
                            yield {"type": "ping"}
                        else:
                            result, error = payload
                    if error:
                        yield {
                            "type": "student_error",
                            "index": index,
                            "student_id": student.student_id,
                            "message": error,
                        }
                        continue
                else:
                    opening = text.split(" ", 1)[0] if text else ""
                    if opening and opening not in avoid_openings:
                        avoid_openings.append(opening)
                    result = RecordResult(
                        student_id=student.student_id,
                        text=text,
                        char_count=count_chars(text),
                        warnings=warnings,
                    )
            except asyncio.CancelledError:
                raise
            except asyncio.TimeoutError:
                # 선행 생성 경로(_guarded)와 같은 문구로 맞춘다
                logger.warning("스트리밍 생성 시간 초과: student_id=%s", student.student_id)
                yield {
                    "type": "student_error",
                    "index": index,
                    "student_id": student.student_id,
                    "message": "생성 시간이 초과되었습니다.",
                }
                continue
            except Exception as e:  # noqa: BLE001
                logger.error("스트리밍 생성 실패: student_id=%s (%s)", student.student_id, e, exc_info=True)
                yield {
                    "type": "student_error",
                    "index": index,
                    "student_id": student.student_id,
                    "message": "문구를 생성하지 못했습니다.",
                }
                continue

            yield {
                "type": "student_done",
                "index": index,
                "student_id": student.student_id,
                "text": result.text,
                "char_count": result.char_count,
                "warnings": [w.model_dump() for w in result.warnings],
            }

    async def _stream_prefetched(self, req: RecordGenerateRequest) -> AsyncIterator[dict[str, Any]]:
        """선행 생성 경로 — Semaphore로 동시성을 묶고 index 순서대로 방출."""
        avoid_openings: list[str] = []
        tasks = self._create_tasks(req, avoid_openings)

        try:
            for index, (student, task) in enumerate(zip(req.students, tasks)):
                yield {"type": "student_start", "index": index, "student_id": student.student_id}

                # heartbeat: 학생 간 공백이 길어져도 중간 프록시가 연결을 끊지 않도록 한다
                result = error = None
                async for kind, payload in self._await_with_heartbeat(task):
                    if kind == "ping":
                        yield {"type": "ping"}
                    else:
                        result, error = payload

                if error:
                    yield {
                        "type": "student_error",
                        "index": index,
                        "student_id": student.student_id,
                        "message": error,
                    }
                    continue

                yield {
                    "type": "student_done",
                    "index": index,
                    "student_id": student.student_id,
                    "text": result.text,
                    "char_count": result.char_count,
                    "warnings": [w.model_dump() for w in result.warnings],
                }
        finally:
            # 클라이언트가 중간에 끊으면 남은 생성 작업을 취소해 LLM 호출이 새지 않게 한다
            for task in tasks:
                if not task.done():
                    task.cancel()


school_record_service = SchoolRecordService()
