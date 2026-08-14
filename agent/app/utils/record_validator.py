"""
생활기록부 문구 후처리 검증.

2단 구조다.
- **차단(blocking)**: prototype/src/features/school-record/service.ts 의 FORBIDDEN_PATTERNS 5종.
  정규식이 문맥까지 특정하므로 오탐이 거의 없다. 적중하면 1회 재생성한다.
- **경고(warning)**: 정책상 부적절하지만 기계적으로 단정하기 어려운 표현. 차단하지 않고
  교사에게 warnings로 노출한다.

aiPrompts.ts 의 PROHIBITED_KEYWORDS 를 그대로 옮기지 않은 이유: '점수', '못함', '부족함',
'고등학교' 같은 항목이 단순 부분문자열로 들어 있어 정상 문구를 반려시킨다("과제를 미루지
않으려 노력하였으나 완수하지 못함" 등). 오탐이 확실한 항목은 아래 _DROPPED_KEYWORDS 로
명시해 제외했다.
"""
import re

# ── 차단: 적중 시 재생성 대상 ─────────────────────────────────
_BLOCKING_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"TOEIC|TOEFL|TEPS|HSK|토익|토플", re.IGNORECASE), "공인어학시험"),
    # 정책이 금지하는 것은 '수상 실적'이지 대회 참여 서술 자체가 아니다. 원본(service.ts)의
    # 맨 '대회'는 "체육대회 준비 과정에서 친구를 도움" 같은 정당한 문구를 반려시키고,
    # 맨 '수상'은 "수상한 점을 살펴봄"(의심스러운)에 오탐한다. 실적 표현만 잡는다.
    (
        re.compile(r"상장|입상|경시대회|수상함|수상하[여였고]|수상했|수상 ?실적|금상|은상|동상"),
        "대회·수상 표현",
    ),
    # 맨 '학원'은 "학원 같은 규칙적인 생활" 같은 비유에 오탐한다. 조사가 붙은 형태만 잡는다.
    (re.compile(r"학원[에을의로]|과외|사교육"), "사교육 기관"),
    # 원본(service.ts)은 '인 것 같음'만 잡아 '성실한 것 같음' 같은 흔한 형태를 놓친다.
    # 선행 어미와 무관하게 '것 같-' / '것으로 보-' 자체를 잡도록 넓혔다.
    (re.compile(r"것 같[음다]|것으로 보[임인]|듯 ?함"), "추측성 표현"),
    (re.compile(r"반에서 \d+등|보다 (?:뛰어|우수)"), "비교·서열화"),
]

# ── 경고: 노출만 하고 차단하지 않음 ──────────────────────────
_WARNING_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"한부모|조손|이혼|별거|맞벌이|저소득|기초수급|다문화"), "가정환경"),
    (re.compile(r"몸무게|비만|장애|질병|ADHD|우울증|자폐", re.IGNORECASE), "신체·건강"),
    (re.compile(r"게으르|불성실|산만|문제아|열등"), "부정적 단정"),
    (re.compile(r"T점수|백분위|석차|등수|등위"), "점수·서열 수치"),
    (re.compile(r"자격증|영재교육원|경시대회"), "외부 실적"),
    (re.compile(r"소논문|논문|특허"), "논문·특허"),
]

# 오탐이 확실해 검증 대상에서 제외한 원본 키워드 — 왜 빠졌는지 남겨 둔다.
_DROPPED_KEYWORDS = {
    "점수": "'점수' 단독은 일반어. 'T점수/백분위/석차'만 경고한다",
    "못함": "'완수하지 못함' 등 정상 서술을 반려시킨다",
    "부족함": "'~이 부족함' 은 발전적 서술에서 정상적으로 쓰인다",
    "고등학교": "학교급 언급 자체는 정당. 특정 학교명만 문제인데 정규식으로 특정 불가",
    "대학교": "위와 동일",
    "키가": "'키가 큰' 외 맥락에서도 흔해 오탐 위험",
    "대회(단독)": "'체육대회 준비 과정에서 친구를 도움' 등 정당한 활동 서술을 반려시킨다",
    "수상(단독)": "'수상한 점을 살펴봄'(의심스러운)에 오탐한다. 실적 표현만 차단한다",
    "학원(단독)": "'학원 같은 규칙적인 생활' 같은 비유에 오탐한다",
}


def _scan(text: str, patterns: list[tuple[re.Pattern, str]]) -> list[dict[str, str]]:
    """{"match": ..., "label": ...} 목록. models.school_record.ForbiddenHit 로 그대로 변환된다."""
    hits: list[dict[str, str]] = []
    for pattern, label in patterns:
        # 그룹이 있는 정규식에서도 매치 원문을 얻기 위해 finditer를 쓴다(findall은 그룹만 돌려준다)
        for match in pattern.finditer(text):
            hits.append({"match": match.group(0), "label": label})
    return hits


def check_blocking(text: str) -> list[dict[str, str]]:
    """재생성이 필요한 정책 위반."""
    return _scan(text, _BLOCKING_PATTERNS)


def check_warnings(text: str) -> list[dict[str, str]]:
    """교사에게 알리되 차단하지 않는 표현."""
    return _scan(text, _WARNING_PATTERNS)


# ── 포맷 정리 ────────────────────────────────────────────────
_CODE_FENCE = re.compile(r"```[\s\S]*?```")
_HEADING = re.compile(r"^\s{0,3}#{1,6}\s*", re.MULTILINE)
_BULLET = re.compile(r"^\s*[-*•]\s+", re.MULTILINE)
_ORDERED = re.compile(r"^\s*\d+[.)]\s+", re.MULTILINE)
_EMPHASIS = re.compile(r"\*{1,3}|_{2,3}|`")
_BRACKET_PLACEHOLDER = re.compile(r"\[[^\]]{1,20}\]")
_WHITESPACE = re.compile(r"\s+")


def strip_formatting(text: str) -> str:
    """마크다운·번호매기기·특수기호를 제거하고 한 문단으로 정규화한다(정책 §4.2).

    LLM이 지시를 어겨도 나이스에 그대로 붙여넣을 수 있는 형태를 서버가 보장한다.
    """
    cleaned = _CODE_FENCE.sub("", text)
    cleaned = _HEADING.sub("", cleaned)
    cleaned = _BULLET.sub("", cleaned)
    cleaned = _ORDERED.sub("", cleaned)
    cleaned = _EMPHASIS.sub("", cleaned)
    # [학생], [이름] 같은 자리표시자는 문장에서 통째로 들어내는 편이 자연스럽다
    cleaned = _BRACKET_PLACEHOLDER.sub("", cleaned)
    cleaned = _WHITESPACE.sub(" ", cleaned).strip()
    return cleaned.strip("\"'“”‘’ ")


def count_chars(text: str) -> int:
    """공백 제외 글자 수 (prototype service.ts countChars 와 동일 규칙)."""
    return len(re.sub(r"\s", "", text))
