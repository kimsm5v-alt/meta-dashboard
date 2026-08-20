"""
도메인지식 원본 JSON(검사로직 정의서/교사용 설명서)을 청크 리스트로 변환하고
키워드로 검색하는 순수 로직 모듈. langchain 등 외부 의존성 없이 표준 라이브러리만
사용해 pytest로 독립 테스트 가능하다(agent/tests/test_domain_knowledge_index.py).
`@tool` 데코레이터 래핑은 domain_knowledge_tools.py에서 한다.
"""
import json
import os
from typing import Any, Dict, List, Optional

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "core", "data", "domain_knowledge")
TEST_LOGIC_REFERENCE_PATH = os.path.join(_DATA_DIR, "test_logic_reference.json")
TEACHER_GUIDE_PATH = os.path.join(_DATA_DIR, "teacher_guide.json")

MAX_LIMIT = 20

VALID_SHEETS = (
    "개정이력", "시트목록", "유형분류표", "문항구성", "문항순서",
    "스크립트_중분류", "스크립트_변인명", "등급표_T점수_백분위",
    "T점수_계산식", "신뢰도지표_산출방식",
)


def _row_to_text(row: Dict[str, Any]) -> str:
    """행 dict의 모든 값을 공백으로 이어붙인 소문자 검색용 문자열로 변환한다."""
    parts = [str(v) for v in row.values() if v is not None]
    return " ".join(parts).lower()


def build_test_logic_chunks(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    """01번 원본 dict(json.load 결과)를 시트x행 단위 청크 리스트로 변환한다.

    각 청크: {"sheet": str, "row": dict, "searchableText": str(소문자)}
    """
    chunks: List[Dict[str, Any]] = []
    for sheet in VALID_SHEETS:
        section = raw.get(sheet)
        if not section:
            continue
        for row in section.get("rows", []):
            chunks.append({
                "sheet": sheet,
                "row": row,
                "searchableText": _row_to_text(row),
            })
    return chunks


def _block_text(block: Dict[str, Any]) -> Optional[str]:
    """슬라이드 block 1개에서 검색 가능한 텍스트를 추출한다. 없으면 None."""
    for field in ("content", "description", "text_in_image"):
        value = block.get(field)
        if value:
            return str(value)
    return None


def build_teacher_guide_chunks(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    """02번 원본 dict를 슬라이드 단위 청크 리스트로 변환한다(+ report_fixed_phrases 최상위 키별 청크).

    report_fixed_phrases는 통째로 청크 1개에 담지 않고, 최상위 키(예: "인사말")마다
    별도 청크로 분할한다(title에 키 이름이 담긴다). 하나의 거대 청크가 검색 점수를
    독식하고 그 큰 블록 전체가 LLM 컨텍스트로 들어가는 것을 방지하기 위함.

    각 청크: {"slide": int|None, "section": str|None, "title": str|None,
              "slideKind": str|None, "blockTexts": list[str], "searchableText": str(소문자)}
    """
    chunks: List[Dict[str, Any]] = []
    for slide in raw.get("slides", []):
        block_texts = [t for t in (_block_text(b) for b in slide.get("blocks", [])) if t]
        chunks.append({
            "slide": slide.get("slide"),
            "section": slide.get("section"),
            "title": slide.get("title"),
            "slideKind": slide.get("slide_kind"),
            "blockTexts": block_texts,
            "searchableText": " ".join(block_texts).lower(),
        })

    fixed_phrases = raw.get("report_fixed_phrases")
    if fixed_phrases:
        for key, value in fixed_phrases.items():
            phrase_text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
            chunks.append({
                "slide": None,
                "section": "리포트 고정문구",
                "title": key,
                "slideKind": None,
                "blockTexts": [phrase_text],
                "searchableText": phrase_text.lower(),
            })
    return chunks


def search_chunks(chunks: List[Dict[str, Any]], keyword: str, limit: int) -> List[Dict[str, Any]]:
    """청크 리스트에서 keyword(공백 분리 다중 검색어)를 매칭 개수 기준으로 검색한다.

    score>0인 청크만, score(서로 다른 검색어가 매칭된 개수) 내림차순으로 최대 limit개
    반환한다. 동점(score 동일)일 때는 검색어 총 출현 횟수(occurrence count)를 내부
    타이브레이커로 사용해 더 밀도 높게 매칭된 청크를 우선한다(단일 키워드 검색에서
    score가 항상 1이 되어 VALID_SHEETS/슬라이드 순서 등 입력 순서로만 정렬되는 문제 방지).
    occurrence count는 반환 dict에 노출하지 않는다 — "score"만 기존 의미 그대로 유지.
    원본 청크 dict를 복사해 "score" 키를 얹어 반환한다(원본은 변경하지 않음).
    """
    terms = [t for t in keyword.lower().split() if t]
    scored: List[Dict[str, Any]] = []
    for chunk in chunks:
        text = chunk["searchableText"]
        score = sum(1 for term in terms if term in text)
        if score > 0:
            occurrences = sum(text.count(term) for term in terms)
            scored.append((score, occurrences, {**chunk, "score": score}))
    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return [c for _, _, c in scored[:limit]]


class DomainKnowledgeIndex:
    """두 원본 JSON을 프로세스당 1회 로드해 청크 리스트를 캐싱하는 싱글톤.

    Neo4jConnectionManager(neo4j_tools.py)와 동일한 클래스메서드 싱글톤 패턴.
    """
    _test_logic_chunks: Optional[List[Dict[str, Any]]] = None
    _teacher_guide_chunks: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def get_test_logic_chunks(cls) -> List[Dict[str, Any]]:
        if cls._test_logic_chunks is None:
            with open(TEST_LOGIC_REFERENCE_PATH, encoding="utf-8") as f:
                raw = json.load(f)
            cls._test_logic_chunks = build_test_logic_chunks(raw)
        return cls._test_logic_chunks

    @classmethod
    def get_teacher_guide_chunks(cls) -> List[Dict[str, Any]]:
        if cls._teacher_guide_chunks is None:
            with open(TEACHER_GUIDE_PATH, encoding="utf-8") as f:
                raw = json.load(f)
            cls._teacher_guide_chunks = build_teacher_guide_chunks(raw)
        return cls._teacher_guide_chunks
