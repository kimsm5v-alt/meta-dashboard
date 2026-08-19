"""
domain_knowledge_index.py 순수 로직 단위 테스트. langchain 등 외부 의존성 없이 표준 라이브러리만 사용한다.
"""
from app.tools.domain_knowledge_index import (
    build_test_logic_chunks,
    build_teacher_guide_chunks,
    search_chunks,
    VALID_SHEETS,
)


def test_build_test_logic_chunks_flattens_rows_per_sheet():
    """각 시트의 rows가 시트명을 포함한 개별 청크로 변환되는지 확인"""
    raw = {
        "유형분류표": {
            "_원본시트": "유형분류표(초,중,고 포함)",
            "rows": [
                {"유형명": "자아 강점", "조작적 정의": None},
                {"유형명": "학습 디딤돌", "조작적 정의": "학습을 향한 디딤돌 역할"},
            ],
        },
        "문항구성": {
            "_원본시트": "문항구성",
            "rows": [{"문항번호": 1, "요인명": "자아존중감"}],
        },
    }
    chunks = build_test_logic_chunks(raw)
    assert len(chunks) == 3
    assert chunks[0]["sheet"] == "유형분류표"
    assert chunks[0]["row"]["유형명"] == "자아 강점"
    assert "학습을 향한 디딤돌" in chunks[1]["searchableText"]
    assert chunks[2]["sheet"] == "문항구성"
    print("✅ build_test_logic_chunks 테스트 통과")


def test_build_test_logic_chunks_handles_empty_input():
    """raw에 알려진 시트가 하나도 없으면 빈 리스트를 반환하는지 확인"""
    chunks = build_test_logic_chunks({})
    assert chunks == []
    print("✅ build_test_logic_chunks 빈 입력 테스트 통과")


def test_build_teacher_guide_chunks_extracts_slide_text():
    """슬라이드 blocks에서 content/description/text_in_image를 뽑아 searchableText로 합치고, report_fixed_phrases를 슬라이드 없는 합성 청크로 추가하는지 확인"""
    raw = {
        "slides": [
            {
                "slide": 1,
                "section": "표지",
                "title": "META 학습종합검사",
                "slide_kind": "cover",
                "blocks": [
                    {"type": "text", "content": "한국심리학회 공인 인증"},
                    {"type": "image", "image_kind": "decorative", "description": "로고 이미지"},
                ],
            },
        ],
        "report_fixed_phrases": {"인사말": "학부모님께 안내드립니다"},
    }
    chunks = build_teacher_guide_chunks(raw)
    assert len(chunks) == 2
    assert chunks[0]["slide"] == 1
    assert "한국심리학회 공인 인증" in chunks[0]["searchableText"]
    assert "로고 이미지" in chunks[0]["searchableText"]
    assert chunks[1]["slide"] is None
    assert chunks[1]["section"] == "리포트 고정문구"
    assert "학부모님께 안내드립니다" in chunks[1]["searchableText"]
    print("✅ build_teacher_guide_chunks 테스트 통과")


def test_search_chunks_ranks_by_term_match_count():
    """검색어 여러 개 중 더 많이 매칭된 청크가 앞에 오는지 확인"""
    chunks = [
        {"searchableText": "자아존중감 낮음 학생을 위한 코칭"},
        {"searchableText": "타인정서인식 낮은 학생을 위한 코칭 전략"},
        {"searchableText": "전혀 관련 없는 내용"},
    ]
    results = search_chunks(chunks, "자아존중감 코칭", limit=5)
    assert len(results) == 2
    assert results[0]["score"] == 2
    assert results[1]["score"] == 1
    print("✅ search_chunks 정렬 테스트 통과")


def test_search_chunks_respects_limit():
    """limit 개수만큼만 반환하는지 확인"""
    chunks = [{"searchableText": f"자아존중감 {i}"} for i in range(10)]
    results = search_chunks(chunks, "자아존중감", limit=3)
    assert len(results) == 3
    print("✅ search_chunks limit 테스트 통과")


def test_search_chunks_excludes_zero_score():
    """검색어가 전혀 매칭 안 된 청크는 결과에서 제외되는지 확인"""
    chunks = [{"searchableText": "관련 없는 문장"}]
    results = search_chunks(chunks, "자아존중감", limit=5)
    assert results == []
    print("✅ search_chunks 매칭없음 테스트 통과")


def test_search_chunks_case_insensitive():
    """대소문자를 무시하고 매칭하는지 확인"""
    chunks = [{"searchableText": "t score 계산식".lower()}]
    results = search_chunks(chunks, "T SCORE", limit=5)
    assert len(results) == 1
    print("✅ search_chunks 대소문자 무시 테스트 통과")


def test_valid_sheets_matches_known_ten_sheets():
    """VALID_SHEETS가 01번 원본의 10개 시트명과 정확히 일치하는지 확인"""
    assert VALID_SHEETS == (
        "개정이력", "시트목록", "유형분류표", "문항구성", "문항순서",
        "스크립트_중분류", "스크립트_변인명", "등급표_T점수_백분위",
        "T점수_계산식", "신뢰도지표_산출방식",
    )
    print("✅ VALID_SHEETS 테스트 통과")
