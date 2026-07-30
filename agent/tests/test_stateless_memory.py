"""무상태(Option A) 대화 메모리 정합성 통합 테스트.

실행 중인 에이전트 서버(localhost:8000)에 대한 블랙박스 HTTP 테스트.
핵심 검증: 에이전트가 자체 인메모리 세션이 아니라 요청마다 전달된 `history`로
컨텍스트를 구성하는지 → session_id가 달라지거나(=temp→실ID 전환/재시작 모사)
비어 있어도 이력만 있으면 정확히 회상하는지 확인한다.

수동 실행: `python tests/test_stateless_memory.py`
"""
import json
import requests

BASE_URL = "http://127.0.0.1:8000"
TIMEOUT = 180

# 검사 예측 유형(도메인 용어) — 도메인 한정 가드에 걸리지 않도록 LPA 맥락으로 질문한다
DISTINCT_TYPE = "안전균형형"


def post_chat(text, session_id, history=None, context_data=None):
    payload = {"text": text, "session_id": session_id}
    if history is not None:
        payload["history"] = history
    if context_data is not None:
        payload["context_data"] = context_data
    r = requests.post(f"{BASE_URL}/chat", json=payload, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def post_chat_stream(text, session_id, history=None, context_data=None):
    payload = {"text": text, "session_id": session_id}
    if history is not None:
        payload["history"] = history
    if context_data is not None:
        payload["context_data"] = context_data
    acc = ""
    with requests.post(f"{BASE_URL}/chat/stream", json=payload, stream=True, timeout=TIMEOUT) as r:
        r.raise_for_status()
        for raw in r.iter_lines():
            if not raw:
                continue
            line = raw.decode("utf-8")
            if not line.startswith("data:"):
                continue
            data = json.loads(line[5:].strip())
            if data.get("is_final"):
                break
            acc += data.get("text", "")
    return acc


results = []


def check(name, passed, detail=""):
    results.append((name, passed))
    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] {name}")
    if detail:
        print(f"       ↳ {detail}")


def test_cross_session_recall():
    """서로 다른 session_id 사이에서도 replay된 history로 이전 발화를 회상한다.
    (temp→실ID 전환 / 프로세스 재시작을 모사하는 핵심 시나리오)"""
    print("\n[1] 다른 session_id 간 이력 회상 (핵심 버그 재현 검증)")
    t1 = f"이번에 분석할 학생의 검사 예측 유형은 '{DISTINCT_TYPE}'입니다. 확인해 주세요."
    r1 = post_chat(t1, session_id="sess-A-turn1", history=[])
    ans1 = r1["response"]
    print(f"    turn1 응답: {ans1[:80]}...")

    history = [
        {"role": "user", "content": t1},
        {"role": "assistant", "content": ans1},
    ]
    t2 = "방금 내가 말한 학생의 검사 예측 유형을 한 단어로만 답해줘."
    # 일부러 완전히 다른 session_id 사용 → 인메모리라면 절대 못 맞힘
    r2 = post_chat(t2, session_id="sess-B-turn2-DIFFERENT", history=history)
    ans2 = r2["response"]
    print(f"    turn2 응답: {ans2[:120]}")
    check("다른 session_id에서 history 기반 회상", DISTINCT_TYPE in ans2,
          f"'{DISTINCT_TYPE}' 포함 여부")


def test_negative_control_no_history():
    """이력이 없으면(빈 history) 이전 발화를 알 수 없어야 한다 (환각/캐시 아님 확인)."""
    print("\n[2] 음성 대조군: history 없이는 회상 불가해야 함")
    t = "방금 내가 말한 학생의 검사 예측 유형을 한 단어로만 답해줘."
    r = post_chat(t, session_id="sess-C-empty", history=[])
    ans = r["response"]
    print(f"    응답: {ans[:120]}")
    check("빈 history에서는 이전 유형을 모름", DISTINCT_TYPE not in ans,
          f"'{DISTINCT_TYPE}' 미포함이어야 정상")


def test_list_previous_utterances():
    """'지금까지 한 질문 나열' 요청 시 전달된 history와 일치하는지."""
    print("\n[3] 이전 발화 리스팅 정합성 (사용자 원 증상)")
    history = [
        {"role": "user", "content": "질문1: 자원소진형 학생의 학습 특징을 알려줘."},
        {"role": "assistant", "content": "자원소진형은 학업 소진이 높은 유형입니다. (요약)"},
        {"role": "user", "content": "질문2: 그 학생에게 맞는 좌석 배치를 추천해줘."},
        {"role": "assistant", "content": "좌석 배치는 앞자리 배치를 권장합니다. (요약)"},
        {"role": "user", "content": "질문3: 가정 연계 지도 방법도 알려줘."},
        {"role": "assistant", "content": "가정에서는 규칙적 학습 루틴을 지원하세요. (요약)"},
    ]
    t = "지금까지 내가 한 질문 3개를 순서대로 요약해서 나열해줘."
    r = post_chat(t, session_id="sess-D-list", history=history)
    ans = r["response"]
    print(f"    응답:\n{ans}\n")
    keywords = ["자원소진", "좌석", "가정"]
    hit = [k for k in keywords if k in ans]
    check("나열 응답이 3개 발화 키워드를 모두 포함", len(hit) == len(keywords),
          f"매칭 키워드: {hit}")


def test_stream_with_history():
    """스트리밍 엔드포인트도 history를 반영하는지 (프론트 실제 경로)."""
    print("\n[4] 스트리밍(/chat/stream) + history 회상")
    t1 = f"이 학생의 검사 예측 유형은 '{DISTINCT_TYPE}'입니다."
    history = [
        {"role": "user", "content": t1},
        {"role": "assistant", "content": "네, 확인했습니다."},
    ]
    t2 = "방금 알려준 학생의 검사 예측 유형을 한 단어로만 답해줘."
    acc = post_chat_stream(t2, session_id="sess-E-stream", history=history)
    print(f"    누적 스트림: {acc[:120]}")
    check("스트리밍에서 history 기반 회상", DISTINCT_TYPE in acc,
          f"'{DISTINCT_TYPE}' 포함 여부")


if __name__ == "__main__":
    print("=" * 60)
    print("무상태(Option A) 대화 메모리 정합성 통합 테스트")
    print("=" * 60)

    # 헬스체크
    assert requests.get(f"{BASE_URL}/", timeout=10).status_code == 200, "서버 미기동"

    test_cross_session_recall()
    test_negative_control_no_history()
    test_list_previous_utterances()
    test_stream_with_history()

    print("\n" + "=" * 60)
    passed = sum(1 for _, p in results if p)
    total = len(results)
    print(f"결과: {passed}/{total} PASS")
    for name, p in results:
        print(f"  - [{'PASS' if p else 'FAIL'}] {name}")
    print("=" * 60)
    raise SystemExit(0 if passed == total else 1)
