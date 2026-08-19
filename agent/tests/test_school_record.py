"""
생활기록부 문구 생성 테스트.

LLM 호출은 전부 모킹한다 — 검증 대상은 정책 상수, 후처리 검증기, 프롬프트 조립,
그리고 스트림의 이벤트 순서/에러 격리다.

수동 실행: `python tests/test_school_record.py` 또는 `pytest tests/test_school_record.py`
"""
import asyncio
import time

from app.core.school_record_policy import (
    LPA_UNSUPPORTED,
    SENTENCE_PATTERNS,
    get_type_guide,
    pick_sentence_pattern,
    t_score_to_level,
)
from app.models.school_record import (
    FactorLevel,
    ObservationEntry,
    ObservationInput,
    RecordGenerateRequest,
    RecordResult,
    RecordStudentInput,
)
from app.services.school_record_service import SchoolRecordService
from app.utils.record_validator import (
    check_blocking,
    check_warnings,
    count_chars,
    strip_formatting,
)


# ── 후처리 검증기 ────────────────────────────────────────────
def test_strip_formatting():
    raw = "**행동특성**\n\n- 수업에 성실히 참여함.\n1. 친구를 배려함."
    cleaned = strip_formatting(raw)
    assert "*" not in cleaned
    assert "\n" not in cleaned
    assert not cleaned.startswith("-")
    assert "수업에 성실히 참여함." in cleaned

    # 대괄호 자리표시자는 통째로 제거된다
    assert "[학생]" not in strip_formatting("[학생]은 성실함.")
    print("✅ strip_formatting")


def test_count_chars():
    assert count_chars("수업에 성실히 참여함.") == len("수업에성실히참여함.")
    print("✅ count_chars")


def test_check_blocking_all_patterns():
    cases = [
        ("토익 점수가 향상됨.", "공인어학시험"),
        ("교내 대회에서 상장을 받음.", "대회·수상 표현"),
        ("전국 대회에서 금상을 수상함.", "대회·수상 표현"),
        ("학원에서 배운 내용을 발표함.", "사교육 기관"),
        ("성실한 것 같음.", "추측성 표현"),
        ("반에서 3등을 함.", "비교·서열화"),
        ("친구보다 뛰어난 결과를 냄.", "비교·서열화"),
    ]
    for text, expected_label in cases:
        hits = check_blocking(text)
        assert hits, f"차단되지 않음: {text}"
        assert any(hit["label"] == expected_label for hit in hits), f"{text} → {hits}"

    assert check_blocking("모둠 활동에서 친구의 의견을 경청함.") == []
    print("✅ check_blocking (5종)")


def test_warning_false_positive_guard():
    """aiPrompts.ts PROHIBITED_KEYWORDS를 그대로 옮기면 반려됐을 정상 문구들."""
    safe_sentences = [
        "계획한 과제를 끝까지 완수하지 못함을 스스로 돌아보고 방법을 바꾸어 봄.",
        "부족함을 인정하고 보완하려는 태도를 보임.",
        "고등학교 진학을 앞두고 스스로 학습 계획을 세움.",
    ]
    for sentence in safe_sentences:
        assert check_warnings(sentence) == [], f"오탐 발생: {sentence}"
        assert check_blocking(sentence) == [], f"오탐 발생: {sentence}"

    # 진짜 위반은 잡는다
    assert check_warnings("T점수가 높게 나타남.")
    assert check_warnings("한부모 가정에서 성실히 생활함.")
    print("✅ 경고 오탐 가드")


# ── 정책 상수 ────────────────────────────────────────────────
def test_t_score_to_level():
    assert t_score_to_level(75) == "매우높음"
    assert t_score_to_level(70) == "매우높음"
    assert t_score_to_level(60) == "높음"
    assert t_score_to_level(50) == "보통"
    assert t_score_to_level(40) == "보통"
    assert t_score_to_level(39) == "낮음"
    assert t_score_to_level(29) == "매우낮음"
    print("✅ t_score_to_level")


def test_t_score_to_level_reverses_for_negative_factors():
    """is_positive=False(부적 요인)는 100-t_score로 뒤집혀 '질적 수준'으로 매핑된다 —
    frontend computeStudentProfile.ts의 meritScore 계산과 동일한 보정."""
    assert t_score_to_level(25, is_positive=False) == "매우높음"  # 100-25=75
    assert t_score_to_level(63, is_positive=False) == "낮음"  # 100-63=37
    assert t_score_to_level(75, is_positive=False) == "매우낮음"  # 100-75=25
    # is_positive 미지정(기본 True) 시 기존 동작과 동일해야 한다
    assert t_score_to_level(75) == t_score_to_level(75, is_positive=True)
    print("✅ t_score_to_level (부적 요인 방향 보정)")


def test_type_guide_unsupported_returns_none():
    """고등학교는 predictedType이 '미지원'. 원본처럼 '안전 균형형'으로 fallback하면
    고등학생 전원에게 엉뚱한 서사가 붙는다."""
    assert get_type_guide(LPA_UNSUPPORTED) is None
    assert get_type_guide("") is None
    assert get_type_guide("존재하지않는유형") is None
    assert get_type_guide("안전 균형형") is not None
    print("✅ 미지원 유형 분기")


def test_pick_sentence_pattern():
    # 2차 없으면 변화 서사(사실 근거 없음)는 후보에서 빠진다
    without_round2 = {pick_sentence_pattern(i, False) for i in range(6)}
    assert SENTENCE_PATTERNS[2] not in without_round2
    assert len(without_round2) == 2

    with_round2 = {pick_sentence_pattern(i, True) for i in range(6)}
    assert len(with_round2) == 3

    # 연속한 학생은 서로 다른 구조를 배정받는다 (동일 문구 방지)
    assert pick_sentence_pattern(0, True) != pick_sentence_pattern(1, True)
    print("✅ pick_sentence_pattern")


# ── 프롬프트 조립 ────────────────────────────────────────────
def _make_request(**overrides) -> RecordGenerateRequest:
    defaults = dict(
        session_id="s-1",
        class_id="c-1",
        school_level="초등",
        school_level_code="elementary",
        grade=4,
        source="INDIVIDUAL_OBSERVATION",
        students=[_make_student("stu-1")],
    )
    defaults.update(overrides)
    return RecordGenerateRequest(**defaults)


def _make_student(student_id: str, **overrides) -> RecordStudentInput:
    defaults = dict(
        student_id=student_id,
        lpa_type="안전 균형형",
        strengths=[FactorLevel(name="자기효능감", t_score=68.4, is_positive=True)],
        improvements=[FactorLevel(name="시험불안", t_score=63.0, is_positive=False)],
        observation=ObservationInput(
            observations=[
                ObservationEntry(
                    factor="자기효능감",
                    type="strength",
                    behavior_codes=["어려운 과제도 끝까지 해결하려 함"],
                )
            ],
            free_text="모둠 발표 준비를 맡음",
            counseling_notes=["학습 방법에 대해 상담함"],
        ),
    )
    defaults.update(overrides)
    return RecordStudentInput(**defaults)


def test_system_prompt_composition():
    service = SchoolRecordService()
    req = _make_request()
    prompt = service._system_prompt(req, req.students[0], 0, [])

    assert "기재 5대 원칙" in prompt
    assert "초등학교" in prompt          # 학교급 파일이 합쳐졌는지
    assert "이번 문구의 문장 구조" in prompt
    assert "안정성 강조" in prompt        # 안전 균형형 유형 가이드

    # 고등(미지원)은 유형 가이드 대신 명시적 안내가 들어간다
    high_req = _make_request(
        school_level="고등",
        school_level_code="high",
        students=[_make_student("stu-h", lpa_type=LPA_UNSUPPORTED)],
    )
    high_prompt = service._system_prompt(high_req, high_req.students[0], 0, [])
    assert "심리유형 정보가 없는 학생" in high_prompt
    assert "안정성 강조" not in high_prompt

    # 중복 회피 지시
    with_avoid = service._system_prompt(req, req.students[0], 0, ["수업"])
    assert "중복 회피" in with_avoid and "수업" in with_avoid
    print("✅ 시스템 프롬프트 조립")


def test_user_message_hides_raw_tscore():
    """정책상 점수 수치는 기재 금지 — LLM에 애초에 숫자를 주지 않는다."""
    service = SchoolRecordService()
    req = _make_request()
    message = service._user_message(req, req.students[0])

    assert "68.4" not in message
    assert "63" not in message
    assert "자기효능감: 높음" in message
    # 시험불안(t_score=63.0, is_positive=False)은 100-63=37로 뒤집혀 "낮음"으로 표기된다 —
    # 부적 요인이라 원점수가 높을수록(불안이 심할수록) 오히려 레벨은 낮게 나와야 맞다.
    assert "시험불안: 낮음" in message
    assert "모둠 발표 준비를 맡음" in message
    assert "학습 방법에 대해 상담함" in message
    print("✅ user 메시지 (T점수 미노출)")


# ── 스트리밍 ─────────────────────────────────────────────────
def test_stream_error_isolation_and_order():
    """10명 중 4번째가 실패해도 나머지 9명이 완주하고, 순서가 보존되어야 한다."""
    service = SchoolRecordService()
    req = _make_request(students=[_make_student(f"stu-{i}") for i in range(10)])

    async def fake_generate_one(request, student, index, avoid_openings):
        await asyncio.sleep(0)
        if index == 3:
            raise RuntimeError("의도된 실패")
        return RecordResult(
            student_id=student.student_id, text=f"문구 {index}", char_count=4, warnings=[]
        )

    service._generate_one = fake_generate_one

    async def collect():
        return [event async for event in service.stream_all(req)]

    events = asyncio.run(collect())

    assert events[0] == {"type": "start", "total": 10}
    assert events[-1] == {"type": "done", "succeeded": 9, "failed": 1}

    starts = [e for e in events if e["type"] == "student_start"]
    assert [e["index"] for e in starts] == list(range(10)), "학생 순서가 보존되지 않음"

    dones = [e for e in events if e["type"] == "student_done"]
    errors = [e for e in events if e["type"] == "student_error"]
    assert len(dones) == 9 and len(errors) == 1
    assert errors[0]["index"] == 3 and errors[0]["student_id"] == "stu-3"
    # 실패 이후 학생들도 정상 완료되었는지 (스트림이 끊기지 않았는지)
    assert {e["index"] for e in dones} == set(range(10)) - {3}
    print("✅ 스트림 에러 격리·순서 보존")


def test_retry_on_blocking_violation():
    """차단 패턴이 적중하면 1회 재생성하고, 재생성 결과를 최종본으로 쓴다."""
    service = SchoolRecordService()
    req = _make_request()
    calls = []

    async def fake_complete(messages):
        calls.append(messages)
        if len(calls) == 1:
            return "교내 대회에서 상장을 받음."
        return "모둠 활동에서 친구의 의견을 경청하고 맡은 역할을 성실히 수행함."

    service._complete = fake_complete

    result = asyncio.run(service._generate_one(req, req.students[0], 0, []))

    assert len(calls) == 2, "재생성이 일어나지 않음"
    assert "상장" not in result.text
    assert result.warnings == []
    assert result.char_count == count_chars(result.text)
    print("✅ 정책 위반 시 재생성")


def test_retry_gives_up_after_limit():
    """재생성 후에도 위반이 남으면 무한 루프 대신 warnings로 넘긴다."""
    service = SchoolRecordService()
    req = _make_request()

    async def always_violating(messages):
        return "교내 대회에서 상장을 받음."

    service._complete = always_violating
    result = asyncio.run(service._generate_one(req, req.students[0], 0, []))

    assert result.text  # 문구는 반환된다
    assert any(w.label == "대회·수상 표현" for w in result.warnings)
    print("✅ 재생성 상한 후 경고 전환")


# ── 회귀 테스트 (심층 분석에서 발견된 결함) ──────────────────
def test_school_level_code_is_derived_not_defaulted():
    """P1-1: 고정 기본값 'elementary'는 중등·고등 요청에서 필드를 빠뜨렸을 때
    오류 없이 초등 문체를 적용해 버린다. school_level에서 유도해야 한다."""
    service = SchoolRecordService()
    for level, expected in (("초등", "초등학교"), ("중등", "중학교"), ("고등", "고등학교")):
        req = RecordGenerateRequest(
            session_id="s", class_id="c", school_level=level, grade=8,
            source="TEST_ONLY", students=[_make_student("stu-1")],
        )  # school_level_code 생략
        prompt = service._system_prompt(req, req.students[0], 0, [])
        assert f"학교급 지침 — {expected}" in prompt, f"{level} → {expected} 지침이 적용되지 않음"

    # 명시된 값이 우선한다 (고등을 '중등'으로 뭉갠 school_level을 덮어써야 함)
    req = RecordGenerateRequest(
        session_id="s", class_id="c", school_level="중등", school_level_code="high",
        grade=10, source="TEST_ONLY", students=[_make_student("stu-1")],
    )
    assert "학교급 지침 — 고등학교" in service._system_prompt(req, req.students[0], 0, [])
    print("✅ school_level_code 유도·우선순위")


def test_common_context_required_for_common_source():
    """P2: 공통 상황 없이 COMMON_CONTEXT로 생성하면 교사 입력이 통째로 누락된다."""
    import pytest

    with pytest.raises(Exception):
        _make_request(source="COMMON_CONTEXT", common_context=None)
    print("✅ COMMON_CONTEXT 필수 검증")


def test_duplicate_student_id_rejected():
    import pytest

    with pytest.raises(Exception):
        _make_request(students=[_make_student("dup"), _make_student("dup")])
    print("✅ 중복 student_id 거부")


def test_previous_text_passed_for_all_edit_actions():
    """P1-2: 축약·확장은 기존 문구를 대상으로 해야 한다."""
    service = SchoolRecordService()
    student = _make_student("stu-1", previous_text="기존 문구입니다.")
    for action in ("rewrite", "shorten", "expand"):
        req = _make_request(action=action, students=[student])
        message = service._user_message(req, student)
        assert "기존 문구입니다." in message, f"action={action}에 직전 문구가 전달되지 않음"

    # generate는 백지에서 쓰므로 직전 문구를 넣지 않는다
    req = _make_request(action="generate", students=[student])
    assert "기존 문구입니다." not in service._user_message(req, student)
    print("✅ 편집 action별 직전 문구 전달")


def test_length_instruction_has_no_contradiction():
    """P1-3: 분량 지시와 action 지시가 서로 다른 문장 수를 말하면 안 된다."""
    service = SchoolRecordService()
    student = _make_student("stu-1", previous_text="기존 문구입니다.")

    shorten = service._system_prompt(_make_request(action="shorten", students=[student]), student, 0, [])
    assert "두 문장 이내로 줄입니다." in shorten
    assert "세 문장으로 씁니다." not in shorten, "축약 요청에 '세 문장' 지시가 함께 들어감"

    expand = service._system_prompt(_make_request(action="expand", students=[student]), student, 0, [])
    assert "네 문장으로 씁니다." in expand
    assert "세 문장으로 씁니다." not in expand

    generate = service._system_prompt(_make_request(action="generate"), _make_student("s"), 0, [])
    assert "세 문장으로 씁니다." in generate
    print("✅ action별 분량 지시 (모순 없음)")


def test_avoid_openings_capped():
    """P3-1: 30명 요청 후반부에서 회피 지시가 본문보다 비대해지면 안 된다."""
    service = SchoolRecordService()
    req = _make_request()
    many = [f"어절{i}" for i in range(29)]
    prompt = service._system_prompt(req, req.students[0], 29, many)
    section = [s for s in prompt.split("\n\n") if s.startswith("## 중복 회피")][0]

    # 안내 문구에도 '어절'이라는 낱말이 있으므로 따옴표로 감싼 나열 항목만 센다
    listed = section.count('"어절')
    assert listed == 5, f"최근 5개로 제한되지 않음: {listed}개"
    assert '"어절28"' in section and '"어절0"' not in section, "최근 항목이 아니라 오래된 항목이 남음"
    print("✅ 중복 회피 목록 상한")


def test_blocking_false_positives_fixed():
    """P3-2: 정책이 금지하는 것은 수상 '실적'이지 대회 참여 서술이 아니다."""
    should_pass = [
        "체육대회 준비 과정에서 친구를 도와 함께 준비함.",
        "수상한 점을 그냥 넘기지 않고 살펴봄.",
        "학원 같은 규칙적인 생활 습관을 스스로 유지함.",
        "학급회의에서 의견을 냄.",
    ]
    for sentence in should_pass:
        assert check_blocking(sentence) == [], f"오탐: {sentence}"

    should_block = ["교내 대회에서 상장을 받음.", "금상을 수상함.", "경시대회에 참가함.", "학원에 다니며 예습함."]
    for sentence in should_block:
        assert check_blocking(sentence), f"차단되어야 함: {sentence}"
    print("✅ 차단 정규식 오탐 수정")


def test_generate_all_runs_concurrently():
    """P3-4a: 단발 경로도 스트리밍과 같은 동시성을 써야 한다."""
    import time

    service = SchoolRecordService()
    req = _make_request(students=[_make_student(f"stu-{i}") for i in range(9)])

    async def slow(request, student, index, avoid):
        await asyncio.sleep(0.1)
        return RecordResult(student_id=student.student_id, text=f"문구{index}", char_count=3, warnings=[])

    service._generate_one = slow

    started = time.perf_counter()
    response = asyncio.run(service.generate_all(req))
    elapsed = time.perf_counter() - started

    assert response.succeeded == 9
    # 순차면 0.9s, 동시성 3이면 ~0.3s
    assert elapsed < 0.6, f"순차 처리로 보임: {elapsed:.2f}s"
    # 결과 순서는 요청 순서를 따른다
    assert [r.student_id for r in response.results] == [f"stu-{i}" for i in range(9)]
    print(f"✅ 단발 경로 동시성 ({elapsed:.2f}s)")


def test_token_stream_times_out_and_isolates():
    """토큰 루프도 선행 생성 경로와 동일하게 30초 상한에 묶여야 한다.
    이 보호가 없으면 LLM이 멎었을 때 스트림이 무한 대기한다."""
    from app.services import school_record_service as mod

    service = SchoolRecordService()
    req = _make_request(
        stream_tokens=True,
        students=[_make_student("stu-0"), _make_student("stu-1")],
    )

    async def stalling_stream(messages):
        if "stu" in str(messages) or True:
            pass
        yield "첫 조각 "
        await asyncio.sleep(5)  # 여기서 멎는다
        yield "도달하지 않음"

    async def healthy_stream(messages):
        yield "모둠 활동에서 맡은 역할을 성실히 수행함."

    calls = {"n": 0}

    async def stream_router(messages):
        calls["n"] += 1
        gen = stalling_stream(messages) if calls["n"] == 1 else healthy_stream(messages)
        async for token in gen:
            yield token

    service._stream = stream_router
    original_timeout, original_heartbeat = mod.STUDENT_TIMEOUT_SECONDS, mod.HEARTBEAT_SECONDS
    mod.STUDENT_TIMEOUT_SECONDS, mod.HEARTBEAT_SECONDS = 0.2, 0.05
    try:

        async def collect():
            return [event async for event in service.stream_all(req)]

        started = time.perf_counter()
        events = asyncio.run(collect())
        elapsed = time.perf_counter() - started
    finally:
        mod.STUDENT_TIMEOUT_SECONDS, mod.HEARTBEAT_SECONDS = original_timeout, original_heartbeat

    assert elapsed < 2, f"5초 대기에 묶임: {elapsed:.2f}s"

    errors = [e for e in events if e["type"] == "student_error"]
    assert len(errors) == 1 and errors[0]["index"] == 0
    assert errors[0]["message"] == "생성 시간이 초과되었습니다."

    # 멎은 학생 다음도 정상 완주해야 한다
    dones = [e for e in events if e["type"] == "student_done"]
    assert len(dones) == 1 and dones[0]["index"] == 1
    assert events[-1] == {"type": "done", "succeeded": 1, "failed": 1}

    # 멎어 있는 동안 heartbeat가 나갔는지
    assert any(e["type"] == "ping" for e in events), "정체 구간에 ping이 나가지 않음"
    print(f"✅ 토큰 스트림 타임아웃·heartbeat ({elapsed:.2f}s)")


def test_token_stream_emits_no_ping_when_flowing():
    """토큰이 정상적으로 흐르는 동안에는 불필요한 ping을 내보내지 않는다."""
    service = SchoolRecordService()
    req = _make_request(stream_tokens=True)

    async def fast_stream(messages):
        for token in ["모둠 활동에서 ", "맡은 역할을 ", "성실히 수행함."]:
            yield token

    service._stream = fast_stream

    async def collect():
        return [event async for event in service.stream_all(req)]

    events = asyncio.run(collect())
    assert [e["type"] for e in events if e["type"] == "ping"] == []
    assert len([e for e in events if e["type"] == "token"]) == 3
    assert [e for e in events if e["type"] == "student_done"][0]["text"] == (
        "모둠 활동에서 맡은 역할을 성실히 수행함."
    )
    print("✅ 정상 흐름에는 ping 없음")


if __name__ == "__main__":
    test_strip_formatting()
    test_count_chars()
    test_check_blocking_all_patterns()
    test_warning_false_positive_guard()
    test_t_score_to_level()
    test_type_guide_unsupported_returns_none()
    test_pick_sentence_pattern()
    test_system_prompt_composition()
    test_user_message_hides_raw_tscore()
    test_stream_error_isolation_and_order()
    test_retry_on_blocking_violation()
    test_retry_gives_up_after_limit()
    test_school_level_code_is_derived_not_defaulted()
    test_common_context_required_for_common_source()
    test_duplicate_student_id_rejected()
    test_previous_text_passed_for_all_edit_actions()
    test_length_instruction_has_no_contradiction()
    test_avoid_openings_capped()
    test_blocking_false_positives_fixed()
    test_generate_all_runs_concurrently()
    test_token_stream_times_out_and_isolates()
    test_token_stream_emits_no_ping_when_flowing()
    print("\n🎉 전체 통과")
