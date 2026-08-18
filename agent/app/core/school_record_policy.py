"""
생활기록부 기재 정책 상수.

원본: prototype/src/shared/data/aiPrompts.ts (SCHOOL_LEVEL_GUIDELINES / TYPE_WRITING_GUIDES /
tScoreToLevel) 및 prototype/docs/meta-test/09_생활기록부_기재정책.md.

지침 "문장"은 prompts/school_record_*.md 로 분리되어 기획자가 직접 수정한다.
여기에는 코드가 분기·계산에 쓰는 "구조화된 값"만 둔다.
"""
from typing import Literal, TypedDict

SchoolLevelCode = Literal["elementary", "middle", "high"]

# 고등학교는 LPA 유형 모델이 없어 predictedType이 '미지원'으로 내려온다
# (frontend/src/shared/types/index.ts: StudentType = ... | '미지원').
LPA_UNSUPPORTED = "미지원"

# 1회 생성 분량. 정책의 1,500바이트(≈500자)는 "연간" 총량이므로 1회분이 다 쓰면
# 교사가 다른 내용을 덧붙일 여지가 없다. 3문장 기준으로 잡는다.
TARGET_CHAR_MIN = 200
TARGET_CHAR_MAX = 300
# 나이스 입력 한도(연간 1,500바이트 ≈ 한글 500자). 이 값을 넘으면 축약 재생성 대상.
HARD_CHAR_LIMIT = 500


class SchoolLevelGuideline(TypedDict):
    persona: str
    style: str
    focus: str
    keywords: list[str]
    prompt_file: str


SCHOOL_LEVEL_GUIDELINES: dict[SchoolLevelCode, SchoolLevelGuideline] = {
    "elementary": {
        "persona": "초등학교 담임교사",
        "style": "부드러운 서술형 (~함, ~임)",
        "focus": "학생의 개성과 장점, 긍정적인 변화 과정 및 성장 가능성",
        "keywords": ["호기심", "즐거움", "적극성", "친구사랑", "협력", "창의성", "바른 인사", "배려"],
        "prompt_file": "school_record_level_elementary",
    },
    "middle": {
        "persona": "중학교 담임교사",
        "style": "객관적인 사실에 근거한 서술형 (~함, ~임)",
        "focus": "자유학기 활동 연계, 자기주도적 태도, 공동체 의식 및 협업 능력",
        "keywords": ["자기이해", "책임감", "주도성", "협업", "공감", "탐구", "진로탐색", "성숙함"],
        "prompt_file": "school_record_level_middle",
    },
    "high": {
        "persona": "고등학교 담임교사",
        "style": "신뢰감 있는 개조식 서술형 (~함, ~임)",
        "focus": "학습 역량, 전공 관련 잠재력, 자원 관리 능력 및 구체적 수행 사례",
        "keywords": ["학업역량", "전공적합성", "융합적사고", "자기주도성", "리더십", "진로역량", "탐구력"],
        "prompt_file": "school_record_level_high",
    },
}


class TypeWritingGuide(TypedDict):
    focus: str
    pattern: str


# LPA 유형별 서사 골격. 키는 frontend의 StudentType 문자열과 정확히 일치해야 한다
# (ElementaryType/MiddleSchoolType — '안전 균형형'처럼 공백이 들어간 표기 포함).
TYPE_WRITING_GUIDES: dict[str, TypeWritingGuide] = {
    "자원소진형": {
        "focus": "회복 과정, 작은 성공 경험, 지지 관계",
        "pattern": "[어려움 인정] → [개입/노력] → [개선 징후] → [성장 가능성]",
    },
    "냉소적 무기력형": {
        "focus": "회복 과정, 작은 성공 경험, 지지 관계",
        "pattern": "[어려움 인정] → [개입/노력] → [개선 징후] → [성장 가능성]",
    },
    "안전 균형형": {
        "focus": "안정성 강조, 추가 성장 가능성",
        "pattern": "[현재 강점] → [균형잡힌 모습] → [발전 영역]",
    },
    "정서조절 취약형": {
        "focus": "안정성 강조, 추가 성장 가능성",
        "pattern": "[현재 강점] → [균형잡힌 모습] → [발전 영역]",
    },
    "몰입자원 풍부형": {
        "focus": "강점 유지, 심화 발전",
        "pattern": "[우수한 역량] → [구체적 사례] → [리더십/영향력] → [지속성]",
    },
    "자기주도 몰입형": {
        "focus": "강점 유지, 심화 발전",
        "pattern": "[우수한 역량] → [구체적 사례] → [리더십/영향력] → [지속성]",
    },
}


def get_type_guide(lpa_type: str) -> TypeWritingGuide | None:
    """LPA 유형별 작성 가이드. 미지원(고등)이거나 모르는 유형이면 None.

    원본(aiPrompts.ts)은 미스 시 '안전 균형형' 가이드로 fallback하는데, 그러면 고등학생
    전원에게 '안전 균형형' 서사가 붙는다. 유형 정보가 없으면 유형 가이드 없이 검사 결과만
    쓰도록 None을 반환한다.
    """
    if not lpa_type or lpa_type == LPA_UNSUPPORTED:
        return None
    return TYPE_WRITING_GUIDES.get(lpa_type)


def t_score_to_level(t_score: float, is_positive: bool = True) -> str:
    """T점수 → 5단계 '질적 수준' 레벨. 원문 수치는 LLM에 전달하지 않는다(정책상 점수 기재 금지).

    is_positive=False(부적 요인, 예: 점수가 낮을수록 긍정적인 요인)는 점수를 뒤집어(100-t_score)
    매핑한다 — frontend/src/features/school-record/model/computeStudentProfile.ts의
    meritScore(factor.isPositive ? avgT : 100-avgT) 계산과 동일한 보정 방식이다.
    그 결과 반환되는 레벨은 항상 "이 요인이 얼마나 긍정적으로 나타나는가"를 의미하며,
    요인명의 원래 방향(예: 불안이 높다/낮다)과는 반대일 수 있다 — LLM이 38개 요인 각각의
    심리학적 해석 방향을 스스로 추측하지 않아도 되도록, 방향 판단을 여기서 미리 끝낸다.
    """
    effective = t_score if is_positive else (100 - t_score)
    if effective >= 70:
        return "매우높음"
    if effective >= 60:
        return "높음"
    if effective >= 40:
        return "보통"
    if effective >= 30:
        return "낮음"
    return "매우낮음"


# 정책 §5.1의 문장 구조 3패턴. 일괄 생성 시 index로 라운드로빈 배정해
# "복사·붙여넣기식 동일 문구 금지"(정책 §2.3)를 구조 차원에서 방어한다.
SENTENCE_PATTERNS: list[str] = [
    "관찰-해석-발전: 구체적으로 관찰된 행동을 먼저 쓰고, 그 행동이 가진 의미를 해석한 뒤, 앞으로의 발전 방향으로 맺는다.",
    "상황-행동-결과: 어떤 상황이었는지 맥락을 먼저 제시하고, 그 안에서 학생이 한 행동을 쓴 뒤, 그로 인한 긍정적 결과로 맺는다.",
    "변화 서사: 학기 초의 모습을 먼저 쓰고, 노력이나 계기를 거쳐, 변화된 현재 모습으로 맺는다.",
]
# 변화 서사는 1·2차 비교 데이터가 있어야 사실 기반으로 쓸 수 있다.
_PATTERN_REQUIRES_ROUND2 = 2


def pick_sentence_pattern(index: int, round2_available: bool) -> str:
    """학생 순번으로 문장 구조 패턴을 결정론적으로 배정한다.

    결정론적이라 선행 생성(prefetch)과 충돌하지 않는다 — 앞 학생의 결과를 기다리지 않고도
    서로 다른 구조가 배정된다. 2차 검사가 없으면 변화 서사는 후보에서 제외한다.
    """
    candidates = (
        SENTENCE_PATTERNS
        if round2_available
        else [p for i, p in enumerate(SENTENCE_PATTERNS) if i != _PATTERN_REQUIRES_ROUND2]
    )
    return candidates[index % len(candidates)]
