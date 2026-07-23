"""
MySQL(superplatform_meta) 도구 모듈

학급/검사/상담/메모/생기부 등 정형 데이터를 MySQL에서 조회하여
Agent의 LLM Tool Calling으로 제공한다. neo4j_tools.py와 동일한 패턴
(싱글톤 연결 관리자 + 구조화된 에러 dict 반환)을 따른다.

설계 근거 및 스키마 조인 관계는 실제 dev DB에 직접 접속해 검증했다:
- stdt_id(학생 UUID)는 tb_dgnss_answer.MEM_ID / tb_dgnss_lpa_result.mem_id와 동일 값
- tb_dgnss_answer.ANSWER_IDX가 tb_dgnss_answer_report.ANSWER_IDX / tb_dgnss_lpa_result.answer_idx를 연결
- tb_dgnss_section.DEPTH=5 AND USE_YN='N' 조합이 정확히 "38개 요인"(공식 T점수 세트)과 일치함을 실측 확인

[중요: 미해결 리스크 — 구현 전 반드시 인지할 것]
1. 읽기 전용 DB 계정: 이 모듈은 SELECT만 실행하도록 코드로 방어(_assert_select_only)하지만,
   실제 DB 계정 권한(GRANT)이 read-only인지는 DB 운영팀이 별도로 보장해야 한다.
   애플리케이션 코드만으로는 계정 권한 자체를 제한할 수 없다.
2. 테넌트 간 인가(authorization) 미해결: 각 쿼리는 stdt_id와 cla_id를 함께 WHERE 조건에 걸어
   "존재하지 않는 조합"의 사고성 크로스 클래스 조회는 막지만, 이건 파라미터 정합성 검증일 뿐이다.
   "이 stdt_id/cla_id가 실제로 지금 요청 중인 교사의 학급이 맞는지"는 검증하지 않는다.
   Agent 서비스 자체가 인증된 사용자 컨텍스트를 전달받지 않기 때문에(AgentQuery에 교사 식별자 없음)
   원천적으로 이 계층에서 막을 수 없고, Backend/Frontend가 인가된 cla_id/stdt_id만 넘겨준다는
   신뢰를 그대로 이어받는다(기존 Neo4j Tool의 className/schoolLevel과 동일한 신뢰 모델).
3. PII 마스킹 사각지대: memo_info.content, counseling_info.summary/reason/next_steps,
   school_record_info.content는 교사가 직접 입력한 자유 텍스트라 학생 실명이 섞여 있을 수 있다.
   pii_filter.py의 마스킹은 dict 키 매칭 방식이라 자유 텍스트 안의 이름은 걸러내지 못한다.
   임시 완화책으로 시스템 프롬프트에 "자유 텍스트에 실명이 보이면 그대로 노출하지 말라"는
   지시를 추가했다(agent_graph.py/agent_service.py 참고). 근본 해결(NER 기반 스크러빙)은 별도 작업 필요.
"""
import os
import re
import logging
import asyncio
from typing import Any, Dict, List, Optional

import aiomysql
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

MAX_LIMIT = 100
DEFAULT_QUERY_TIMEOUT = float(os.getenv("MYSQL_TOOL_TIMEOUT", "5.0"))

# 38개 공식 T점수 요인 = DEPTH 5(최소 단위) AND USE_YN='N' 조합. 실제 데이터로 검증됨
# (tb_dgnss_answer_report가 참조하는 SECTION_ID 전부가 이 조건과 정확히 일치).
_FACTOR_SECTION_FILTER = "s.DEPTH = 5 AND s.USE_YN = 'N'"

# "주의" 등급 LPA 유형(문서 4-2절 위험도 표 기준: 자원소진형/냉소적 무기력형/정서조절 취약형).
# class_id는 school_level에 관계없이 동일하게 부여되므로 값만으로 판별 가능.
_RISK_LPA_CLASS_IDS = ("Class1", "Class4", "Class5")

_SELECT_PREFIX_RE = re.compile(r"^\s*SELECT\b", re.IGNORECASE)


# ---------------------------------------------------------------------------
# MySQL 연결 관리 (싱글톤 커넥션 풀)
# ---------------------------------------------------------------------------
class MySQLConnectionManager:
    """aiomysql 커넥션 풀 싱글톤 관리자.

    반드시 읽기 전용(SELECT-only) 권한의 DB 계정을 사용해야 한다(운영 요구사항).
    이 클래스는 그 권한을 강제하지 못하므로, 실제 GRANT 설정은 DB 운영팀 책임이다.
    """
    _pool: Optional[aiomysql.Pool] = None

    @classmethod
    async def get_pool(cls) -> aiomysql.Pool:
        if cls._pool is None:
            cls._pool = await aiomysql.create_pool(
                host=os.getenv("MYSQL_HOST", "localhost"),
                port=int(os.getenv("MYSQL_PORT", "3306")),
                user=os.getenv("MYSQL_USER", "root"),
                password=os.getenv("MYSQL_PASSWORD", ""),
                db=os.getenv("MYSQL_DATABASE", "superplatform_meta"),
                charset="utf8mb4",
                autocommit=True,
                minsize=1,
                maxsize=int(os.getenv("MYSQL_POOL_MAXSIZE", "5")),
                cursorclass=aiomysql.cursors.DictCursor,
            )
        return cls._pool

    @classmethod
    async def verify(cls) -> None:
        """기동 시 1회 호출하여 MySQL 연결 상태를 검증한다. 실패 시 예외 전파."""
        pool = await cls.get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
                await cur.fetchone()

    @classmethod
    async def close(cls) -> None:
        """애플리케이션 종료 시 커넥션 풀을 해제한다."""
        if cls._pool is not None:
            cls._pool.close()
            await cls._pool.wait_closed()
            cls._pool = None


# ---------------------------------------------------------------------------
# 쿼리 실행 공통 함수
# ---------------------------------------------------------------------------
def _assert_select_only(query: str) -> None:
    """이 모듈의 모든 쿼리는 고정 파라미터화 SELECT문이어야 한다(안전장치).

    LLM이 임의의 SQL을 만들어 전달하는 구조가 아니라(text-to-SQL 아님),
    각 Tool 함수 내부에 하드코딩된 쿼리만 실행하므로 SQL Injection 경로 자체가 없다.
    이 assert는 "실수로 비-SELECT 쿼리를 추가하는 것"을 막는 개발 단계 방어용이다.
    """
    if not _SELECT_PREFIX_RE.match(query):
        raise ValueError("mysql_tools는 SELECT 쿼리만 실행할 수 있습니다 (읽기 전용 원칙).")


async def _execute_query(query: str, params: tuple) -> List[Dict[str, Any]]:
    """파라미터화된 SELECT 쿼리를 실행하고 결과를 dict 리스트로 반환한다.

    모든 예외를 구조화된 에러 dict로 변환하여 LLM이 에러 상황을 이해할 수 있도록 한다
    (neo4j_tools.py의 _execute_query와 동일한 정책).
    """
    _assert_select_only(query)

    async def _run() -> List[Dict[str, Any]]:
        pool = await MySQLConnectionManager.get_pool()
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, params)
                return await cur.fetchall()

    try:
        return await asyncio.wait_for(_run(), timeout=DEFAULT_QUERY_TIMEOUT)
    except asyncio.TimeoutError:
        logger.error(f"MySQL query timeout ({DEFAULT_QUERY_TIMEOUT}s)")
        return [{"error": "TIMEOUT", "message": "Query timeout exceeded"}]
    except aiomysql.Error as e:
        logger.error(f"MySQL error: {e}")
        return [{"error": "DB_ERROR", "message": str(e)}]
    except Exception as e:
        logger.exception("Unknown MySQL error")
        return [{"error": "UNKNOWN", "message": str(e)}]


# ---------------------------------------------------------------------------
# Tool 1: 학생 LPA 유형 + 38개 요인 T점수 조회
# ---------------------------------------------------------------------------
@tool
async def query_student_lpa_and_scores(stdt_id: str, cla_id: str) -> Dict[str, Any]:
    """학생의 최신 회차 LPA 심리유형과 38개 요인별 T점수를 조회한다.

    학생 개별 대시보드(L3)나 히트맵/레이더 차트 캡처에 대한 질문 시 호출한다.
    같은 학생이 여러 회차 검사를 봤다면 가장 최근(ord_no가 큰) 완료된 회차를 반환한다.

    Args:
        stdt_id: 학생 고유 ID (UUID).
        cla_id: 학급 고유 ID (UUID). LPA 결과가 이 학급에서 시행된 검사 소속인지 함께 확인한다.

    Returns:
        dict: {"lpa": {...}, "scores": [...]} 형태.
          lpa: type_name(유형명), confidence(확신도%), school_level, ord_no(회차),
               reaction_mark(반응일관성: 양호/주의), desirable_mark(사회적바람직성: 양호/주의),
               repeated_response(연속동일반응: Y/N) — 검사 신뢰도 관련 질문에 사용.
          scores: 38개 요인별 [{section_nm, t_score, t_rank, t_script, p_rank}, ...]
        해당 학급 소속으로 완료된 LPA 결과가 없으면 {"lpa": None, "scores": []} 반환.
    """
    lpa_rows = await _execute_query(
        """
        SELECT lr.type_name, lr.school_level, lr.class_id, lr.confidence,
               lr.status, lr.answer_idx, di.ord_no,
               a.COCH_DGNSS_QESITM01_MARK AS reaction_mark,
               a.COCH_DGNSS_QESITM02_MARK AS desirable_mark,
               a.REPEATED_RESPONSE_YN AS repeated_response
        FROM tb_dgnss_lpa_result lr
        JOIN tb_dgnss_answer a ON a.ANSWER_IDX = lr.answer_idx
        JOIN tb_dgnss_result_info ri ON ri.id = a.DGNSS_RESULT_ID
        JOIN tb_dgnss_info di ON di.id = ri.dgnss_id
        WHERE lr.mem_id = %s AND di.cla_id = %s AND lr.status = 'COMPLETED'
        ORDER BY di.ord_no DESC
        LIMIT 1
        """,
        (stdt_id, cla_id),
    )
    if lpa_rows and lpa_rows[0].get("error"):
        return {"error": lpa_rows[0]["error"], "message": lpa_rows[0]["message"]}
    if not lpa_rows:
        return {"lpa": None, "scores": []}

    lpa = lpa_rows[0]
    scores = await _execute_query(
        f"""
        SELECT s.SECTION_NM AS section_nm, s.SECTION_NM_FULL AS section_nm_full,
               ar.T_SCORE AS t_score, ar.T_RANK AS t_rank,
               ar.T_SCRIPT AS t_script, ar.P_RANK AS p_rank
        FROM tb_dgnss_answer_report ar
        JOIN tb_dgnss_section s ON s.SECTION_ID = ar.SECTION_ID
        WHERE ar.ANSWER_IDX = %s AND {_FACTOR_SECTION_FILTER}
        ORDER BY s.SECTION_NM
        """,
        (lpa["answer_idx"],),
    )
    return {"lpa": lpa, "scores": scores}


# ---------------------------------------------------------------------------
# Tool 2: 학급 검사 진행 현황 + LPA 유형 분포 조회
# ---------------------------------------------------------------------------
@tool
async def query_class_dgnss_overview(cla_id: str) -> Dict[str, Any]:
    """학급의 검사 시행 이력과 최신 회차 LPA 유형 분포를 조회한다.

    학급 L2 대시보드, LPA 분포 파이/도넛 차트 캡처에 대한 질문 시 호출한다.

    Args:
        cla_id: 학급 고유 ID (UUID).

    Returns:
        dict: {"sessions": [...], "latest_distribution": [...]} 형태.
          sessions: 회차별 [{ord_no, dgnss_at(Y=진행중/N=종료), st_dt, ed_dt,
                              total, not_submitted, in_progress, completed}, ...]
          latest_distribution: 최신 회차의 [{type_name, school_level, count}, ...]
    """
    sessions = await _execute_query(
        """
        SELECT di.id AS dgnss_id, di.ord_no, di.dgnss_at,
               di.dgnss_st_dt AS st_dt, di.dgnss_ed_dt AS ed_dt,
               SUM(ri.eak_stts_cd = 1) AS not_submitted,
               SUM(ri.eak_stts_cd = 2) AS in_progress,
               SUM(ri.eak_stts_cd = 3) AS completed,
               COUNT(ri.id) AS total
        FROM tb_dgnss_info di
        LEFT JOIN tb_dgnss_result_info ri ON ri.dgnss_id = di.id
        WHERE di.cla_id = %s
        GROUP BY di.id, di.ord_no, di.dgnss_at, di.dgnss_st_dt, di.dgnss_ed_dt
        ORDER BY di.ord_no DESC
        """,
        (cla_id,),
    )
    if sessions and sessions[0].get("error"):
        return {"error": sessions[0]["error"], "message": sessions[0]["message"]}
    if not sessions:
        return {"sessions": [], "latest_distribution": []}

    latest_ord_no = sessions[0]["ord_no"]
    distribution = await _execute_query(
        """
        SELECT lr.type_name, lr.school_level, COUNT(*) AS count
        FROM tb_dgnss_lpa_result lr
        JOIN tb_dgnss_answer a ON a.ANSWER_IDX = lr.answer_idx
        JOIN tb_dgnss_result_info ri ON ri.id = a.DGNSS_RESULT_ID
        JOIN tb_dgnss_info di ON di.id = ri.dgnss_id
        WHERE di.cla_id = %s AND di.ord_no = %s AND lr.status = 'COMPLETED'
        GROUP BY lr.type_name, lr.school_level
        ORDER BY count DESC
        """,
        (cla_id, latest_ord_no),
    )
    return {"sessions": sessions, "latest_distribution": distribution}


# ---------------------------------------------------------------------------
# Tool 3: 학생 관찰 메모 조회
# ---------------------------------------------------------------------------
@tool
async def query_student_memos(stdt_id: str, cla_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    """학생의 관찰 메모(교사 작성)를 최신순으로 조회한다.

    학생 메모 패널 캡처, "이 학생 행동 특성은?" 같은 질문 시 호출한다.

    주의: content는 교사가 직접 작성한 자유 텍스트라 학생 실명이 포함될 수 있다.
    답변 생성 시 실명이 보이더라도 그대로 노출하지 말고 "학생"으로 지칭할 것
    (시스템 프롬프트에도 동일 지침 포함).

    Args:
        stdt_id: 학생 고유 ID (UUID).
        cla_id: 학급 고유 ID (UUID).
        limit: 반환할 최대 메모 수 (기본 20, 최대 100).

    Returns:
        list[dict]: [{memo_date, category, content, is_important}, ...]. 없으면 [].
    """
    safe_limit = max(1, min(int(limit), MAX_LIMIT))
    return await _execute_query(
        """
        SELECT memo_date, category, content, is_important
        FROM memo_info
        WHERE stdt_id = %s AND cla_id = %s AND use_yn = 'Y'
        ORDER BY memo_date DESC
        LIMIT %s
        """,
        (stdt_id, cla_id, safe_limit),
    )


# ---------------------------------------------------------------------------
# Tool 4: 상담 이력 조회
# ---------------------------------------------------------------------------
@tool
async def query_counseling_history(
    cla_id: Optional[str] = None,
    stdt_id: Optional[str] = None,
    tc_id: Optional[str] = None,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """상담 일정 및 기록을 최신순으로 조회한다.

    stdt_id가 주어지면 해당 학생 대상 상담만, cla_id만 있으면 학급 전체,
    tc_id만 있으면 해당 교사가 담당하는 모든 학급의 상담을 반환한다(cla_id/tc_id 중 하나는 필수).
    상담 일정표 캡처, "이달 상담 완료율은?", "이번 주 내 상담 일정 전부 보여줘" 같은 질문 시 호출한다.

    주의: summary/reason/next_steps는 교사가 직접 작성한 자유 텍스트라 학생 실명이
    포함될 수 있다. 답변 생성 시 실명을 그대로 노출하지 말 것.

    Args:
        cla_id: 학급 고유 ID (선택, UUID). 학급 단위 조회 시 사용.
        stdt_id: 학생 고유 ID (선택, UUID). 지정 시 해당 학생 상담만 필터링 (cla_id 필요).
        tc_id: 교사 고유 ID (선택). 지정 시 이 교사가 담당하는 모든 학급의 상담을 조회.
        limit: 반환할 최대 건수 (기본 20, 최대 100).

    Returns:
        list[dict]: [{cla_id, scheduled_at, status, types, areas, methods, summary, next_steps}, ...].
        cla_id/tc_id가 모두 없으면 [{"error": "MISSING_SCOPE", ...}] 반환.
    """
    if not cla_id and not tc_id:
        return [{"error": "MISSING_SCOPE", "message": "cla_id 또는 tc_id 중 하나는 반드시 지정해야 합니다."}]

    safe_limit = max(1, min(int(limit), MAX_LIMIT))
    if stdt_id and cla_id:
        return await _execute_query(
            """
            SELECT ci.cla_id, ci.scheduled_at, ci.status, ci.types, ci.areas, ci.methods,
                   ci.summary, ci.next_steps
            FROM counseling_info ci
            JOIN counseling_student cs ON cs.counseling_id = ci.id
            WHERE ci.cla_id = %s AND cs.stdt_id = %s AND ci.use_yn = 'Y'
            ORDER BY ci.scheduled_at DESC
            LIMIT %s
            """,
            (cla_id, stdt_id, safe_limit),
        )
    if cla_id:
        return await _execute_query(
            """
            SELECT ci.cla_id, ci.scheduled_at, ci.status, ci.types, ci.areas, ci.methods, ci.summary
            FROM counseling_info ci
            WHERE ci.cla_id = %s AND ci.use_yn = 'Y'
            ORDER BY ci.scheduled_at DESC
            LIMIT %s
            """,
            (cla_id, safe_limit),
        )
    return await _execute_query(
        """
        SELECT ci.cla_id, ci.scheduled_at, ci.status, ci.types, ci.areas, ci.methods, ci.summary
        FROM counseling_info ci
        WHERE ci.tc_id = %s AND ci.use_yn = 'Y'
        ORDER BY ci.scheduled_at DESC
        LIMIT %s
        """,
        (tc_id, safe_limit),
    )


# ---------------------------------------------------------------------------
# Tool 5: 생활기록부 조회
# ---------------------------------------------------------------------------
@tool
async def query_school_records(stdt_id: str, cla_id: str) -> List[Dict[str, Any]]:
    """학생의 생활기록부 내용을 카테고리별로 조회한다.

    생기부 패널 캡처 시 호출한다.

    주의: content는 자유 텍스트라 학생 실명이 포함될 수 있다. 답변 생성 시
    실명을 그대로 노출하지 말 것.

    Args:
        stdt_id: 학생 고유 ID (UUID).
        cla_id: 학급 고유 ID (UUID).

    Returns:
        list[dict]: [{category, content}, ...]. 없으면 [].
    """
    return await _execute_query(
        """
        SELECT category, content
        FROM school_record_info
        WHERE stdt_id = %s AND cla_id = %s AND use_yn = 'Y'
        """,
        (stdt_id, cla_id),
    )


# ---------------------------------------------------------------------------
# Tool 6: 학급 전체 명단 (검사 미배정/미응시 학생 포함)
# ---------------------------------------------------------------------------
@tool
async def query_class_roster(cla_id: str) -> List[Dict[str, Any]]:
    """학급 소속 학생 전체 명단을 조회한다. 검사에 배정조차 되지 않은 학생도 포함한다.

    query_class_dgnss_overview는 집계 카운트만 반환하므로, "미제출 학생이 누구야?"처럼
    실제 학생 명단이 필요한 질문에는 이 도구를 사용한다. 최신 회차 기준으로 응시 상태를 함께 보여준다.

    Args:
        cla_id: 학급 고유 ID (UUID).

    Returns:
        list[dict]: [{stdt_id, member_no(출석번호), member_status(ACTIVE/KICKED),
                       eak_stts_cd(1=미응시/2=응시중/3=완료/NULL=최신 회차에 아예 배정 안 됨)}, ...].
        member_no 순으로 정렬. 학급에 소속 학생이 없으면 [].
    """
    return await _execute_query(
        """
        SELECT gm.stdt_id, gm.member_no, gm.status AS member_status, ri.eak_stts_cd
        FROM group_member gm
        JOIN group_info gi ON gi.group_id = gm.group_id
        LEFT JOIN (
            SELECT cla_id, MAX(ord_no) AS ord_no FROM tb_dgnss_info GROUP BY cla_id
        ) latest ON latest.cla_id = gi.cla_id
        LEFT JOIN tb_dgnss_info di ON di.cla_id = gi.cla_id AND di.ord_no = latest.ord_no
        LEFT JOIN tb_dgnss_result_info ri ON ri.dgnss_id = di.id AND ri.stdt_id = gm.stdt_id
        WHERE gi.cla_id = %s
        ORDER BY gm.member_no
        """,
        (cla_id,),
    )


# ---------------------------------------------------------------------------
# Tool 7: 교사 담당 전체 학급 현황 (L1 대시보드)
# ---------------------------------------------------------------------------
@tool
async def query_teacher_classes_overview(tc_id: str) -> List[Dict[str, Any]]:
    """교사가 담당하는 모든 학급의 최신 회차 진행 현황을 조회한다. (L1 전체 대시보드)

    "내가 담당하는 반 중에 검사 미완료인 반 있어?", "어느 반이 위험 학생이 제일 많아?" 같은
    여러 학급을 아우르는 질문 시 호출한다. 특정 학급 하나만 알고 싶다면
    query_class_dgnss_overview(cla_id)가 더 적합하다.

    Args:
        tc_id: 교사 고유 ID.

    Returns:
        list[dict]: [{cla_id, school_level, grade, class_number, school_name,
                       ord_no(최신 회차), total, not_submitted, in_progress, completed,
                       at_risk_count(주의 등급 LPA 유형 학생 수)}, ...].
        담당 학급이 없으면 [].
    """
    classes = await _execute_query(
        """
        SELECT gi.cla_id, gi.school_level, gi.grade, gi.class_number, gi.school_name,
               latest.ord_no,
               COALESCE(SUM(ri.eak_stts_cd = 1), 0) AS not_submitted,
               COALESCE(SUM(ri.eak_stts_cd = 2), 0) AS in_progress,
               COALESCE(SUM(ri.eak_stts_cd = 3), 0) AS completed,
               COALESCE(COUNT(ri.id), 0) AS total
        FROM group_info gi
        JOIN user u ON u.user_no = gi.host_user_no
        LEFT JOIN (
            SELECT cla_id, MAX(ord_no) AS ord_no FROM tb_dgnss_info GROUP BY cla_id
        ) latest ON latest.cla_id = gi.cla_id
        LEFT JOIN tb_dgnss_info di ON di.cla_id = gi.cla_id AND di.ord_no = latest.ord_no
        LEFT JOIN tb_dgnss_result_info ri ON ri.dgnss_id = di.id
        WHERE u.tc_id = %s AND gi.use_yn = 'Y'
        GROUP BY gi.cla_id, gi.school_level, gi.grade, gi.class_number, gi.school_name, latest.ord_no
        ORDER BY gi.school_name, gi.grade, gi.class_number
        """,
        (tc_id,),
    )
    if classes and classes[0].get("error"):
        return classes
    if not classes:
        return []

    cla_ids = [c["cla_id"] for c in classes]
    placeholders = ",".join(["%s"] * len(cla_ids))
    risk_rows = await _execute_query(
        f"""
        SELECT di.cla_id,
               SUM(lr.class_id IN ({",".join(["%s"] * len(_RISK_LPA_CLASS_IDS))})) AS at_risk_count
        FROM tb_dgnss_lpa_result lr
        JOIN tb_dgnss_answer a ON a.ANSWER_IDX = lr.answer_idx
        JOIN tb_dgnss_result_info ri ON ri.id = a.DGNSS_RESULT_ID
        JOIN tb_dgnss_info di ON di.id = ri.dgnss_id
        WHERE di.cla_id IN ({placeholders}) AND lr.status = 'COMPLETED'
        GROUP BY di.cla_id
        """,
        (*_RISK_LPA_CLASS_IDS, *cla_ids),
    )
    risk_by_cla_id = {r["cla_id"]: r["at_risk_count"] for r in risk_rows if "cla_id" in r}
    for c in classes:
        c["at_risk_count"] = risk_by_cla_id.get(c["cla_id"], 0)
    return classes


# ---------------------------------------------------------------------------
# Tool 8: 학급 내 긴급/관찰 필요 학생 목록
# ---------------------------------------------------------------------------
@tool
async def query_class_risk_students(cla_id: str) -> List[Dict[str, Any]]:
    """학급 내 최신 회차 기준 '주의가 필요한' 학생 목록을 조회한다.

    "우리 반에서 긴급하게 봐야 할 학생 누구야?" 같은 질문 시 호출한다.
    주의 조건(하나라도 해당하면 포함): LPA 유형이 위험군(자원소진형/냉소적 무기력형/정서조절 취약형)이거나,
    반응일관성/사회적바람직성이 '주의'이거나, 연속동일반응이 있는 경우.

    주의: 이 판정은 프론트엔드 화면(ClassDetailAnalysisPage)의 위험군 표시 로직을 SQL로
    근사 구현한 것으로, 프론트엔드의 정확한 판정 기준(가중치, 복합 조건 등)과 100% 일치한다는
    보장은 없다. 화면에 표시된 위험군과 차이가 있을 수 있음을 답변 시 참고할 것.

    Args:
        cla_id: 학급 고유 ID (UUID).

    Returns:
        list[dict]: [{stdt_id, member_no, type_name, is_risk_type,
                       reaction_mark, desirable_mark, repeated_response}, ...].
        해당 없으면 [].
    """
    return await _execute_query(
        f"""
        SELECT gm.stdt_id, gm.member_no, lr.type_name,
               (lr.class_id IN ({",".join(["%s"] * len(_RISK_LPA_CLASS_IDS))})) AS is_risk_type,
               a.COCH_DGNSS_QESITM01_MARK AS reaction_mark,
               a.COCH_DGNSS_QESITM02_MARK AS desirable_mark,
               a.REPEATED_RESPONSE_YN AS repeated_response
        FROM group_member gm
        JOIN group_info gi ON gi.group_id = gm.group_id
        JOIN (
            SELECT cla_id, MAX(ord_no) AS ord_no FROM tb_dgnss_info GROUP BY cla_id
        ) latest ON latest.cla_id = gi.cla_id
        JOIN tb_dgnss_info di ON di.cla_id = gi.cla_id AND di.ord_no = latest.ord_no
        JOIN tb_dgnss_result_info ri ON ri.dgnss_id = di.id AND ri.stdt_id = gm.stdt_id
        JOIN tb_dgnss_answer a ON a.DGNSS_RESULT_ID = ri.id
        LEFT JOIN tb_dgnss_lpa_result lr ON lr.answer_idx = a.ANSWER_IDX AND lr.status = 'COMPLETED'
        WHERE gi.cla_id = %s
          AND (
                lr.class_id IN ({",".join(["%s"] * len(_RISK_LPA_CLASS_IDS))})
                OR a.COCH_DGNSS_QESITM01_MARK = '주의'
                OR a.COCH_DGNSS_QESITM02_MARK = '주의'
                OR a.REPEATED_RESPONSE_YN = 'Y'
          )
        ORDER BY gm.member_no
        """,
        (*_RISK_LPA_CLASS_IDS, cla_id, *_RISK_LPA_CLASS_IDS),
    )


# ---------------------------------------------------------------------------
# Tool 목록 (app/tools/__init__.py에서 참조)
# ---------------------------------------------------------------------------
mysql_tools_list = [
    query_student_lpa_and_scores,
    query_class_dgnss_overview,
    query_student_memos,
    query_counseling_history,
    query_school_records,
    query_class_roster,
    query_teacher_classes_overview,
    query_class_risk_students,
]
