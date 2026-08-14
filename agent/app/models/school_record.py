"""
생활기록부(행동특성 및 종합의견) 문구 생성 스키마.

설계 근거: agent/docs/SCHOOL_RECORD_GENERATION_PLAN.md

단건 작성(학생별)과 일괄 생성은 동일한 요청 계약을 쓴다 — 단건은 students 길이가 1인
일괄이다. 프롬프트/정책/검증이 전부 같은데 경로를 둘로 나누면 정책이 한 벌인데 구현이
두 벌이 되어 문체가 갈라진다.

PII 원칙: 학생 이름·학번은 이 스키마에 존재하지 않는다. 마스킹이 아니라 "미전송"이다.
생기부 문구는 주어를 생략해 쓰므로(프롬프트에서 강제) 이름 자체가 필요 없다.
"""
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator

SchoolLevel = Literal["초등", "중등", "고등"]
SchoolLevelCode = Literal["elementary", "middle", "high"]
GenerationSource = Literal["TEST_ONLY", "COMMON_CONTEXT", "INDIVIDUAL_OBSERVATION"]
RecordAction = Literal["generate", "rewrite", "shorten", "expand"]
FactorPolarity = Literal["strength", "improvement"]

# 한 반 정원 상한. 일괄 생성이 무제한으로 커지면 스트림 지속시간과 비용이 통제 불가가 된다.
MAX_STUDENTS_PER_REQUEST = 30

# school_level_code 생략 시 school_level에서 유도하는 표. 고정 기본값('elementary')을 두면
# 중등·고등 요청에서 필드를 빠뜨렸을 때 오류 없이 초등 문체로 생성되어 아무도 눈치채지 못한다.
SCHOOL_LEVEL_TO_CODE: dict[str, str] = {
    "초등": "elementary",
    "중등": "middle",
    "고등": "high",
}


class FactorLevel(BaseModel):
    """강점/보완 요인 1개 (38개 소분류 요인 기준).

    t_score는 서버가 레벨(매우높음~매우낮음)로 변환하는 용도로만 받는다.
    원문 수치는 LLM에 전달되지 않으며(정책상 점수 기재 금지), 변환 후 폐기된다.
    """

    name: str = Field(..., description="요인명 (예: 자기효능감)")
    t_score: float = Field(..., description="해당 요인 T점수. LLM에는 레벨로만 전달된다")
    is_positive: bool = Field(True, description="정적 요인 여부(부적 요인은 해석 방향이 반대)")


class ObservationEntry(BaseModel):
    """교사가 선택한 요인 1개 + 그 요인에서 체크한 관찰 행동."""

    factor: str
    type: FactorPolarity = "strength"
    behavior_codes: list[str] = Field(default_factory=list, description="체크한 추천 행동 문장")


class ObservationInput(BaseModel):
    """학생별 관찰 입력. counseling_notes는 id가 아니라 요약 원문을 받는다
    (에이전트는 백엔드 DB에 접근하지 않으므로 id로는 본문을 얻을 수 없다)."""

    observations: list[ObservationEntry] = Field(default_factory=list)
    free_text: str = Field("", description="교사가 적은 구체적 장면")
    counseling_notes: list[str] = Field(default_factory=list, description="상담·관찰 기록 요약 원문")


class CommonContext(BaseModel):
    """일괄 생성 방식 B(COMMON_CONTEXT) — 선택 학생 전원에 공통 적용되는 상황."""

    situation_label: str = Field(..., description="상황 라벨 (예: 모둠 활동)")
    activity_text: str = ""
    behaviors: list[str] = Field(default_factory=list)


class RoundChange(BaseModel):
    """1차 → 2차 검사 변화 1건. 정책 §6.1-6의 성장 서사 재료."""

    category: str
    direction: Literal["개선", "유지", "하락"]


class RecordStudentInput(BaseModel):
    student_id: str = Field(..., description="식별자. PII 아님 — 이름·학번은 받지 않는다")
    lpa_type: str = Field("미지원", description="LPA 유형. 고등학교는 '미지원'")
    strengths: list[FactorLevel] = Field(default_factory=list, description="강점 요인 TOP3")
    improvements: list[FactorLevel] = Field(default_factory=list, description="보완 요인 TOP3")
    round2_available: bool = False
    round_changes: list[RoundChange] = Field(default_factory=list)
    observation: Optional[ObservationInput] = None
    previous_text: Optional[str] = Field(
        None, description="action='rewrite'일 때 회피 대상이 되는 직전 문구"
    )


class RecordGenerateRequest(BaseModel):
    session_id: str
    class_id: str
    school_level: SchoolLevel
    school_level_code: Optional[SchoolLevelCode] = Field(
        None,
        description=(
            "문체 분기의 실제 기준. school_level은 고등을 '중등'으로 뭉개므로 이 값이 우선한다 "
            "(frontend/src/shared/types/index.ts 참고). 생략하면 school_level에서 유도한다."
        ),
    )
    grade: int = 1
    source: GenerationSource = "INDIVIDUAL_OBSERVATION"
    action: RecordAction = "generate"
    common_context: Optional[CommonContext] = None
    stream_tokens: bool = Field(
        False,
        description=(
            "토큰 단위 스트리밍 여부. True면 순서 보장을 위해 선행 생성 없이 엄격히 순차 처리된다."
        ),
    )
    students: list[RecordStudentInput] = Field(
        ..., min_length=1, max_length=MAX_STUDENTS_PER_REQUEST
    )

    @model_validator(mode="after")
    def _resolve_and_validate(self) -> "RecordGenerateRequest":
        """생략된 값을 유도하고, 조용히 잘못된 결과를 내는 조합을 422로 거른다."""
        if self.school_level_code is None:
            self.school_level_code = SCHOOL_LEVEL_TO_CODE[self.school_level]

        # 공통 상황 없이 COMMON_CONTEXT로 생성하면 교사가 입력한 학급 활동이 통째로
        # 누락된 문구가 나온다. 조용히 통과시키면 안 된다.
        if self.source == "COMMON_CONTEXT" and self.common_context is None:
            raise ValueError("source='COMMON_CONTEXT'이면 common_context가 필요합니다.")

        # 중복 student_id는 클라이언트가 결과를 학생에 매핑할 때 혼선을 만든다.
        student_ids = [student.student_id for student in self.students]
        if len(set(student_ids)) != len(student_ids):
            raise ValueError("students에 중복된 student_id가 있습니다.")

        return self


class ForbiddenHit(BaseModel):
    match: str
    label: str


class RecordResult(BaseModel):
    student_id: str
    text: str
    char_count: int = Field(..., description="공백 제외 글자 수")
    warnings: list[ForbiddenHit] = Field(default_factory=list)


class RecordGenerateResponse(BaseModel):
    results: list[RecordResult]
    succeeded: int
    failed: int
    errors: list[dict] = Field(default_factory=list)
