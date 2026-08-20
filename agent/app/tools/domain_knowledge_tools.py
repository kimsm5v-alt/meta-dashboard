"""
학습심리정서검사 도메인지식 검색 Tool

01. 검사로직 정의서(스프레드시트 변환 JSON, 487KB)와 02. 교사용 설명서(슬라이드 변환
JSON, 136KB)를 매 요청마다 시스템 프롬프트에 통째로 넣기엔 너무 커서 키워드 검색
Tool로 제공한다. 임베딩 없이 순수 키워드 매칭으로 시작한다(추후 검색 품질 개선은
별도 작업).

청크 생성·검색 순수 로직은 domain_knowledge_index.py 참고(langchain 비의존, pytest로
독립 테스트됨).

참조 코드: agent/app/tools/neo4j_tools.py (동일한 싱글톤+화이트리스트 검증+구조화 에러
dict 패턴)
"""
from typing import Any, Dict, List, Optional, Union
from langchain_core.tools import tool

from .domain_knowledge_index import (
    DomainKnowledgeIndex,
    MAX_LIMIT,
    VALID_SHEETS,
    search_chunks,
)


def _validate_keyword(keyword: str) -> Union[None, Dict[str, str]]:
    """keyword가 비어있지 않은지 검증한다."""
    if not keyword or not keyword.strip():
        return {"error": "EMPTY_KEYWORD", "message": "keyword must be a non-empty string"}
    return None


@tool
async def search_test_logic_reference(
    keyword: str, sheet: Optional[str] = None, limit: int = 5
) -> List[Dict[str, Any]]:
    """검사로직 정의서(요인별 조작적 정의, 문항 구성, 스크립트 문구, T점수 산출식,
    등급표, 신뢰도 지표 등)를 키워드로 검색한다.

    Args:
        keyword: 검색어. 공백으로 여러 단어를 넣으면 각 단어의 매칭 개수 합으로 정렬된다.
        sheet: 검색 범위를 특정 시트로 제한(선택). 다음 10개 중 정확히 하나:
          "개정이력" | "시트목록" | "유형분류표" | "문항구성" | "문항순서" |
          "스크립트_중분류" | "스크립트_변인명" | "등급표_T점수_백분위" |
          "T점수_계산식" | "신뢰도지표_산출방식"
          생략 시 전체 시트에서 검색.
        limit: 반환할 최대 결과 수 (기본 5, 최대 20).

    Returns:
        list[dict]: [{"sheet": str, "row": dict, "score": int}, ...] 매칭 없으면 [].
        오류 시 단일 dict {"error": "<code>", "message": "..."} 담긴 리스트 반환.
    """
    err = _validate_keyword(keyword)
    if err:
        return [err]
    if sheet is not None and sheet not in VALID_SHEETS:
        return [{
            "error": "INVALID_SHEET",
            "message": f"sheet must be one of {sorted(VALID_SHEETS)} or omitted, got '{sheet}'",
        }]
    safe_limit = max(1, min(int(limit), MAX_LIMIT))
    chunks = DomainKnowledgeIndex.get_test_logic_chunks()
    if sheet is not None:
        chunks = [c for c in chunks if c["sheet"] == sheet]
    return [
        {"sheet": r["sheet"], "row": r["row"], "score": r["score"]}
        for r in search_chunks(chunks, keyword, safe_limit)
    ]


@tool
async def search_teacher_guide(keyword: str, limit: int = 5) -> List[Dict[str, Any]]:
    """교사용 사용 설명서(검사 개념, 척도 정의, 점수 체계, 해석 절차, 리포트 고정
    문구)를 키워드로 검색한다.

    Args:
        keyword: 검색어. 공백으로 여러 단어를 넣으면 각 단어의 매칭 개수 합으로 정렬된다.
        limit: 반환할 최대 결과 수 (기본 5, 최대 20).

    Returns:
        list[dict]: [{"slide": int|None, "section": str|None, "title": str|None,
                       "slideKind": str|None, "matchedContent": list[str], "score": int}, ...]
        매칭 없으면 []. 오류 시 단일 dict {"error": "<code>", "message": "..."} 담긴 리스트 반환.
    """
    err = _validate_keyword(keyword)
    if err:
        return [err]
    safe_limit = max(1, min(int(limit), MAX_LIMIT))
    chunks = DomainKnowledgeIndex.get_teacher_guide_chunks()
    results = search_chunks(chunks, keyword, safe_limit)
    terms = [t for t in keyword.lower().split() if t]
    output: List[Dict[str, Any]] = []
    for r in results:
        matched = [t for t in r["blockTexts"] if any(term in t.lower() for term in terms)]
        output.append({
            "slide": r["slide"],
            "section": r["section"],
            "title": r["title"],
            "slideKind": r["slideKind"],
            "matchedContent": matched,
            "score": r["score"],
        })
    return output


domain_knowledge_tools_list = [
    search_test_logic_reference,
    search_teacher_guide,
]
