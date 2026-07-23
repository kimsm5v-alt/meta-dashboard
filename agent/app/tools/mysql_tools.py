"""
MySQL(superplatform_meta) 도구 모듈

학급/검사/상담/메모/생기부 등 정형 데이터를 MySQL에서 조회하여
Agent의 LLM Tool Calling으로 제공한다. neo4j_tools.py와 동일한 패턴
(싱글톤 연결 관리자 + 구조화된 에러 dict 반환)을 따른다.

설계 근거 및 스키마 조인 관계는 실제 dev DB 및 backend 소스(DDL/MyBatis 매퍼)로 검증했다:
- stdt_id(학생 UUID)는 tb_dgnss_answer.MEM_ID / tb_dgnss_lpa_result.mem_id와 동일 값
- tb_dgnss_answer.ANSWER_IDX가 tb_dgnss_answer_report.ANSWER_IDX / tb_dgnss_lpa_result.answer_idx를 연결
- tb_dgnss_section.DEPTH=5 AND USE_YN='N' 조합이 정확히 "38개 요인"(공식 T점수 세트)과 일치함을 실측 확인
- tb_dgnss_section.DEPTH=4 AND USE_YN='N' 조합이 "11개 중분류"(38개 요인의 상위 그룹핑)와 일치
  (frontend dashboardService.ts의 extractMidCategoryScores와 동일한 소스/컬럼 규칙)
- tb_dgnss_info.paper_idx('1'=학습종합검사/'2'=자기조절학습검사) + UNIQUE KEY(cla_id, paper_idx, ord_no)
  확인 — ord_no는 학급 내에서도 검사 종류별로만 유일하므로, paper_idx 없이 MAX(ord_no)만
  구하면 최신 회차를 잘못 고르거나 응시 인원이 이중 집계될 수 있다(_LEARNING_PAPER_IDX 참고)

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

# 11개 중분류(38개 요인의 상위 그룹핑) = DEPTH 4, USE_YN='N' 조합. frontend의
# extractMidCategoryScores(dashboardService.ts, MID_CATEGORY_SECTION_ID_MAP)가 동일한
# tb_dgnss_answer_report 데이터에서 DEPTH만 4로 바꿔 추출하는 것과 동일한 소스/컬럼 규칙을 따른다.
_MID_CATEGORY_SECTION_FILTER = "s.DEPTH = 4 AND s.USE_YN = 'N'"

# "주의" 등급 LPA 유형(문서 4-2절 위험도 표 기준: 자원소진형/냉소적 무기력형/정서조절 취약형).
# class_id는 school_level에 관계없이 동일하게 부여되므로 값만으로 판별 가능.
_RISK_LPA_CLASS_IDS = ("Class1", "Class4", "Class5")

# tb_dgnss_info.paper_idx: '1'=학습종합검사(LPA/38요인/11중분류), '2'=자기조절학습검사.
# UNIQUE KEY가 (cla_id, paper_idx, ord_no) 조합이라 ord_no는 학급 내에서도 검사 종류별로만
# 유일하다 — 즉 같은 학급의 학습종합검사 2차와 자기조절학습검사 2차가 동시에 ord_no=2일 수 있다.
# 이 모듈의 학급/교사 요약 Tool은 전부 "학습종합검사(LPA·38요인)" 도메인 전용이므로,
# paper_idx 필터 없이 "그 학급의 MAX(ord_no)"만 구하면 자기조절학습검사 캠페인이 섞여
# 최신 회차를 잘못 고르거나 응시 인원이 이중 집계될 수 있다. 아래 Tool들은 반드시 이 필터를
# 함께 사용한다: query_class_dgnss_overview, query_class_midcategory_scores, query_class_roster,
# query_teacher_classes_overview, query_class_risk_students.
_LEARNING_PAPER_IDX = "1"

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


async def _resolve_latest_ord_no(cla_id: str, paper_idx: str = _LEARNING_PAPER_IDX) -> List[Dict[str, Any]]:
    """cla_id + paper_idx 조합의 가장 최근 ord_no를 조회한다.

    "최신 회차"의 정의(현재는 단순 MAX(ord_no))를 이 함수 하나로 통일해서,
    query_class_dgnss_overview/query_class_midcategory_scores가 각자 다른 방식으로
    최신 회차를 판단하다 향후 정의가 바뀔 때 서로 어긋나는 것을 방지한다.

    Returns:
        list[dict]: _execute_query와 동일한 에러 규약 — [{"ord_no": int 또는 None}]
        또는 [{"error": ..., "message": ...}].
    """
    return await _execute_query(
        "SELECT MAX(ord_no) AS ord_no FROM tb_dgnss_info WHERE cla_id = %s AND paper_idx = %s",
        (cla_id, paper_idx),
    )


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
async def query_class_dgnss_overview(cla_id: str, ord_no: Optional[int] = None) -> Dict[str, Any]:
    """학급의 검사 시행 이력과 특정 회차 LPA 유형 분포를 조회한다.

    학급 L2 대시보드, LPA 분포 파이/도넛 차트 캡처에 대한 질문 시 호출한다.
    `sessions`에는 항상 그 학급의 전체 회차 목록(ord_no 포함)이 담기므로, 몇 차까지
    검사가 있었는지는 이 필드로 먼저 확인한다. "1차 대비 2차 뭐가 달라졌어?"처럼
    회차를 비교하는 질문이면, sessions에서 확인한 ord_no 값으로 이 도구를 두 번
    (예: ord_no=1, ord_no=2) 호출해 두 결과를 비교한다.

    Args:
        cla_id: 학급 고유 ID (UUID).
        ord_no: 유형 분포를 조회할 회차 번호 (선택). 생략 시 가장 최근 회차를 사용한다.

    Returns:
        dict: {"sessions": [...], "ord_no": 실제 사용된 회차, "distribution": [...]} 형태.
          sessions: 회차별 [{ord_no, dgnss_at(Y=진행중/N=종료), st_dt, ed_dt,
                              total, not_submitted, in_progress, completed}, ...]
          distribution: 지정(또는 최신) 회차의 [{type_name, school_level, count}, ...]
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
        WHERE di.cla_id = %s AND di.paper_idx = %s
        GROUP BY di.id, di.ord_no, di.dgnss_at, di.dgnss_st_dt, di.dgnss_ed_dt
        ORDER BY di.ord_no DESC
        """,
        (cla_id, _LEARNING_PAPER_IDX),
    )
    if sessions and sessions[0].get("error"):
        return {"error": sessions[0]["error"], "message": sessions[0]["message"]}
    if not sessions:
        return {"sessions": [], "ord_no": None, "distribution": []}

    if ord_no is not None:
        resolved_ord_no = ord_no
    else:
        # 이 지점에서 sessions는 비어있지 않음이 보장되고, ORDER BY di.ord_no DESC로
        # 정렬돼 있으며 _resolve_latest_ord_no와 동일한 테이블·필터(cla_id + paper_idx)를
        # 조회한다. 따라서 sessions[0]["ord_no"]가 곧 최신 회차이므로, 별도 헬퍼 호출로
        # 같은 테이블을 다시 조회(중복 라운드트립)하지 않고 이를 재사용한다.
        resolved_ord_no = sessions[0]["ord_no"]
        # ord_no가 모두 NULL인 예외적 데이터 상태에서는 최신 회차를 특정할 수 없으므로,
        # query_class_midcategory_scores와 동일하게 조기 return으로 일관 처리한다.
        if resolved_ord_no is None:
            return {"sessions": sessions, "ord_no": None, "distribution": []}

    distribution = await _execute_query(
        """
        SELECT lr.type_name, lr.school_level, COUNT(*) AS count
        FROM tb_dgnss_lpa_result lr
        JOIN tb_dgnss_answer a ON a.ANSWER_IDX = lr.answer_idx
        JOIN tb_dgnss_result_info ri ON ri.id = a.DGNSS_RESULT_ID
        JOIN tb_dgnss_info di ON di.id = ri.dgnss_id
        WHERE di.cla_id = %s AND di.ord_no = %s AND di.paper_idx = %s AND lr.status = 'COMPLETED'
        GROUP BY lr.type_name, lr.school_level
        ORDER BY count DESC
        """,
        (cla_id, resolved_ord_no, _LEARNING_PAPER_IDX),
    )
    if distribution and distribution[0].get("error"):
        return {"error": distribution[0]["error"], "message": distribution[0]["message"]}
    return {"sessions": sessions, "ord_no": resolved_ord_no, "distribution": distribution}


# ---------------------------------------------------------------------------
# Tool 3: 학급 11개 중분류 반 평균 T점수 조회
# ---------------------------------------------------------------------------
@tool
async def query_class_midcategory_scores(cla_id: str, ord_no: Optional[int] = None) -> Dict[str, Any]:
    """학급의 11개 중분류(38개 요인의 상위 그룹핑) 반 평균 T점수를 회차별로 조회한다.

    "종합 결과 요약" 막대그래프(11개 중분류 하위요인의 반 평균 T점수) 캡처에 대한
    질문 시 호출한다. query_student_lpa_and_scores의 scores(38개 요인, 학생 개별)보다
    상위 그룹핑된 학급 평균값이라는 점에 유의한다.

    ord_no를 생략하면 최신 회차를 사용한다. "1차 대비 2차 뭐가 달라졌어?"처럼 회차를
    비교하는 질문이면, query_class_dgnss_overview의 sessions에서 확인한 ord_no로
    이 도구를 두 번(예: ord_no=1, ord_no=2) 호출해 두 결과를 비교한다.

    Args:
        cla_id: 학급 고유 ID (UUID).
        ord_no: 조회할 회차 번호 (선택). 생략 시 해당 학급의 가장 최근 회차.

    Returns:
        dict: {"ord_no": 실제 사용된 회차, "scores": [...]} 형태.
          scores: [{section_nm, section_nm_full, avg_t_score, student_count}, ...]
          (student_count는 해당 중분류 점수가 산출된 학생 수 — 응시 완료 인원과 다를 수 있음)
        회차 자체가 없으면 {"ord_no": None, "scores": []} 반환.
    """
    resolved_ord_no = ord_no
    if resolved_ord_no is None:
        latest = await _resolve_latest_ord_no(cla_id)
        if latest and latest[0].get("error"):
            return {"error": latest[0]["error"], "message": latest[0]["message"]}
        if not latest or latest[0]["ord_no"] is None:
            return {"ord_no": None, "scores": []}
        resolved_ord_no = latest[0]["ord_no"]

    scores = await _execute_query(
        f"""
        SELECT s.SECTION_NM AS section_nm, s.SECTION_NM_FULL AS section_nm_full,
               ROUND(AVG(ar.T_SCORE), 1) AS avg_t_score,
               COUNT(DISTINCT ar.ANSWER_IDX) AS student_count
        FROM tb_dgnss_answer_report ar
        JOIN tb_dgnss_section s ON s.SECTION_ID = ar.SECTION_ID
        JOIN tb_dgnss_answer a ON a.ANSWER_IDX = ar.ANSWER_IDX
        JOIN tb_dgnss_result_info ri ON ri.id = a.DGNSS_RESULT_ID
        JOIN tb_dgnss_info di ON di.id = ri.dgnss_id
        WHERE di.cla_id = %s AND di.ord_no = %s AND di.paper_idx = %s AND {_MID_CATEGORY_SECTION_FILTER}
        GROUP BY s.SECTION_ID, s.SECTION_NM, s.SECTION_NM_FULL
        ORDER BY s.SECTION_NM
        """,
        (cla_id, resolved_ord_no, _LEARNING_PAPER_IDX),
    )
    if scores and scores[0].get("error"):
        return {"error": scores[0]["error"], "message": scores[0]["message"]}
    return {"ord_no": resolved_ord_no, "scores": scores}


# ---------------------------------------------------------------------------
# Tool 4: 학생 관찰 메모 조회
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
# Tool 5: 상담 이력 조회
# ---------------------------------------------------------------------------
@tool
async def query_counseling_history(
    cla_id: Optional[str] = None,
    stdt_id: Optional[str] = None,
    tc_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """상담 일정 및 기록을 최신순으로 조회한다.

    stdt_id가 주어지면 해당 학생 대상 상담만, cla_id만 있으면 학급 전체,
    tc_id만 있으면 해당 교사가 담당하는 모든 학급의 상담을 반환한다(cla_id/tc_id 중 하나는 필수).
    상담 일정표 캡처, "이달 상담 완료율은?", "이번 주 내 상담 일정 전부 보여줘" 같은 질문 시 호출한다.
    "이번 주 상담이 몇 건이야?"처럼 특정 기간이 언급되면 반드시 start_date/end_date를
    함께 지정한다 — 생략하면 최신순 limit건만 반환되어 기간 밖의 데이터가 섞이거나
    기간 내 데이터가 잘릴 수 있다. 반별/전체 건수 집계만 필요하면 이 도구 대신
    query_counseling_summary가 더 적합하다.

    주의: summary/reason/next_steps는 교사가 직접 작성한 자유 텍스트라 학생 실명이
    포함될 수 있다. 답변 생성 시 실명을 그대로 노출하지 말 것.

    Args:
        cla_id: 학급 고유 ID (선택, UUID). 학급 단위 조회 시 사용.
        stdt_id: 학생 고유 ID (선택, UUID). 지정 시 해당 학생 상담만 필터링 (cla_id 필요).
        tc_id: 교사 고유 ID (선택). 지정 시 이 교사가 담당하는 모든 학급의 상담을 조회.
        start_date: 조회 시작일 (선택, "YYYY-MM-DD"). scheduled_at 기준.
        end_date: 조회 종료일 (선택, "YYYY-MM-DD", 포함). scheduled_at 기준.
        limit: 반환할 최대 건수 (기본 20, 최대 100).

    Returns:
        list[dict]: [{cla_id, scheduled_at, status, types, areas, methods, summary, next_steps}, ...].
          types는 ["urgent","regular"]와 같은 JSON 배열 문자열이며, "urgent"가 포함되면
          긴급상담, "follow-up"이 포함되면 후속상담을 의미한다(프론트 ScheduleType과 동일).
        cla_id/tc_id가 모두 없으면 [{"error": "MISSING_SCOPE", ...}] 반환.
    """
    if not cla_id and not tc_id:
        return [{"error": "MISSING_SCOPE", "message": "cla_id 또는 tc_id 중 하나는 반드시 지정해야 합니다."}]

    safe_limit = max(1, min(int(limit), MAX_LIMIT))
    date_clause = ""
    date_params: tuple = ()
    if start_date:
        date_clause += " AND ci.scheduled_at >= %s"
        date_params += (start_date,)
    if end_date:
        date_clause += " AND ci.scheduled_at <= %s"
        date_params += (f"{end_date} 23:59:59",)

    if stdt_id and cla_id:
        return await _execute_query(
            f"""
            SELECT ci.cla_id, ci.scheduled_at, ci.status, ci.types, ci.areas, ci.methods,
                   ci.summary, ci.next_steps
            FROM counseling_info ci
            JOIN counseling_student cs ON cs.counseling_id = ci.id
            WHERE ci.cla_id = %s AND cs.stdt_id = %s AND ci.use_yn = 'Y'{date_clause}
            ORDER BY ci.scheduled_at DESC
            LIMIT %s
            """,
            (cla_id, stdt_id, *date_params, safe_limit),
        )
    if cla_id:
        return await _execute_query(
            f"""
            SELECT ci.cla_id, ci.scheduled_at, ci.status, ci.types, ci.areas, ci.methods,
                   ci.summary, ci.next_steps
            FROM counseling_info ci
            WHERE ci.cla_id = %s AND ci.use_yn = 'Y'{date_clause}
            ORDER BY ci.scheduled_at DESC
            LIMIT %s
            """,
            (cla_id, *date_params, safe_limit),
        )
    return await _execute_query(
        f"""
        SELECT ci.cla_id, ci.scheduled_at, ci.status, ci.types, ci.areas, ci.methods,
               ci.summary, ci.next_steps
        FROM counseling_info ci
        WHERE ci.tc_id = %s AND ci.use_yn = 'Y'{date_clause}
        ORDER BY ci.scheduled_at DESC
        LIMIT %s
        """,
        (tc_id, *date_params, safe_limit),
    )


# ---------------------------------------------------------------------------
# Tool 6: 상담 건수 집계 (학급별 전체/긴급/후속 건수)
# ---------------------------------------------------------------------------
@tool
async def query_counseling_summary(
    cla_id: Optional[str] = None,
    tc_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """학급별 상담 건수를 전체/긴급/후속 상담으로 집계한다.

    상담일정 화면의 학급 요약 카드("6학년 3반 7건 · 긴급 1")에 대한 질문 시 호출한다.
    tc_id만 주면 그 교사가 담당하는 모든 학급을 cla_id별로 집계해서 반환하고,
    cla_id를 주면 해당 학급 하나만 반환한다(cla_id/tc_id 중 하나는 필수).
    개별 상담 건의 상세 내용(요약/다음 단계 등)이 필요하면 query_counseling_history를 사용한다.

    Args:
        cla_id: 학급 고유 ID (선택, UUID).
        tc_id: 교사 고유 ID (선택). 여러 학급을 아우르는 질문 시 사용.
        start_date: 집계 시작일 (선택, "YYYY-MM-DD"). scheduled_at 기준.
        end_date: 집계 종료일 (선택, "YYYY-MM-DD", 포함). scheduled_at 기준.

    Returns:
        list[dict]: [{cla_id, total(전체 건수), urgent_count(긴급상담 건수),
                       follow_up_count(후속상담 건수)}, ...].
        cla_id/tc_id가 모두 없으면 [{"error": "MISSING_SCOPE", ...}] 반환.
    """
    if not cla_id and not tc_id:
        return [{"error": "MISSING_SCOPE", "message": "cla_id 또는 tc_id 중 하나는 반드시 지정해야 합니다."}]

    scope_clause = "ci.cla_id = %s" if cla_id else "ci.tc_id = %s"
    scope_param = cla_id if cla_id else tc_id

    date_clause = ""
    date_params: tuple = ()
    if start_date:
        date_clause += " AND ci.scheduled_at >= %s"
        date_params += (start_date,)
    if end_date:
        date_clause += " AND ci.scheduled_at <= %s"
        date_params += (f"{end_date} 23:59:59",)

    return await _execute_query(
        f"""
        SELECT ci.cla_id,
               COUNT(*) AS total,
               SUM(JSON_CONTAINS(ci.types, '"urgent"')) AS urgent_count,
               SUM(JSON_CONTAINS(ci.types, '"follow-up"')) AS follow_up_count
        FROM counseling_info ci
        WHERE {scope_clause} AND ci.use_yn = 'Y'{date_clause}
        GROUP BY ci.cla_id
        """,
        (scope_param, *date_params),
    )


# ---------------------------------------------------------------------------
# Tool 7: 생활기록부 조회
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
# Tool 8: 학급 전체 명단 (검사 미배정/미응시 학생 포함)
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
            SELECT cla_id, MAX(ord_no) AS ord_no FROM tb_dgnss_info
            WHERE paper_idx = %s GROUP BY cla_id
        ) latest ON latest.cla_id = gi.cla_id
        LEFT JOIN tb_dgnss_info di ON di.cla_id = gi.cla_id AND di.ord_no = latest.ord_no
            AND di.paper_idx = %s
        LEFT JOIN tb_dgnss_result_info ri ON ri.dgnss_id = di.id AND ri.stdt_id = gm.stdt_id
        WHERE gi.cla_id = %s
        ORDER BY gm.member_no
        """,
        (_LEARNING_PAPER_IDX, _LEARNING_PAPER_IDX, cla_id),
    )


# ---------------------------------------------------------------------------
# Tool 9: 교사 담당 전체 학급 현황 (L1 대시보드)
# ---------------------------------------------------------------------------
@tool
async def query_teacher_classes_overview(tc_id: str) -> List[Dict[str, Any]]:
    """교사가 담당하는 모든 학급의 최신 회차(학습종합검사 기준) 진행 현황을 조회한다. (L1 전체 대시보드)

    "내가 담당하는 반 중에 검사 미완료인 반 있어?", "어느 반이 위험 학생이 제일 많아?" 같은
    여러 학급을 아우르는 질문 시 호출한다. 특정 학급 하나만 알고 싶다면
    query_class_dgnss_overview(cla_id)가 더 적합하다. 그룹 초대 코드나 자기조절학습검사를
    포함한 여러 캠페인의 진행/완료 개수(예: "검사하기" 화면의 "진행 중 2개")가 필요하면
    query_class_exam_campaigns를 사용한다 — 이 도구는 학습종합검사 최신 회차 하나만 본다.

    Args:
        tc_id: 교사 고유 ID.

    Returns:
        list[dict]: [{cla_id, invite_code(그룹 초대 코드), school_level, grade, class_number,
                       school_name, ord_no(학습종합검사 최신 회차), total, not_submitted,
                       in_progress, completed, at_risk_count(주의 등급 LPA 유형 학생 수)}, ...].
        담당 학급이 없으면 [].
    """
    classes = await _execute_query(
        """
        SELECT gi.cla_id, gi.invite_code, gi.school_level, gi.grade, gi.class_number, gi.school_name,
               latest.ord_no,
               COALESCE(SUM(ri.eak_stts_cd = 1), 0) AS not_submitted,
               COALESCE(SUM(ri.eak_stts_cd = 2), 0) AS in_progress,
               COALESCE(SUM(ri.eak_stts_cd = 3), 0) AS completed,
               COALESCE(COUNT(ri.id), 0) AS total
        FROM group_info gi
        JOIN user u ON u.user_no = gi.host_user_no
        LEFT JOIN (
            SELECT cla_id, MAX(ord_no) AS ord_no FROM tb_dgnss_info
            WHERE paper_idx = %s GROUP BY cla_id
        ) latest ON latest.cla_id = gi.cla_id
        LEFT JOIN tb_dgnss_info di ON di.cla_id = gi.cla_id AND di.ord_no = latest.ord_no
            AND di.paper_idx = %s
        LEFT JOIN tb_dgnss_result_info ri ON ri.dgnss_id = di.id
        WHERE u.tc_id = %s AND gi.use_yn = 'Y'
        GROUP BY gi.cla_id, gi.invite_code, gi.school_level, gi.grade, gi.class_number,
                 gi.school_name, latest.ord_no
        ORDER BY gi.school_name, gi.grade, gi.class_number
        """,
        (_LEARNING_PAPER_IDX, _LEARNING_PAPER_IDX, tc_id),
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
# Tool 10: 학급 검사 캠페인(회차 x 검사종류) 목록 + 그룹 초대 코드
# ---------------------------------------------------------------------------
@tool
async def query_class_exam_campaigns(
    cla_id: Optional[str] = None,
    tc_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """학급의 검사 캠페인(회차 x 검사종류) 목록과 그룹 초대 코드를 조회한다.

    "검사하기" 화면(그룹 카드의 초대 코드, "진행 중 N개"/"완료 M개" 뱃지)에 대한
    질문 시 호출한다. 한 학급은 회차(ord_no)와 검사종류(paper_idx)의 조합마다 별도의
    캠페인을 가질 수 있다 — 학습종합검사 1·2차 + 자기조절학습검사 1·2차, 최대 4개까지
    동시에 존재할 수 있다. query_class_dgnss_overview/query_teacher_classes_overview는
    학습종합검사 "최신 회차 하나"만 집계하므로, 이 화면처럼 여러 캠페인을 함께 세야 하는
    질문에는 반드시 이 도구를 사용해야 한다(대체 불가).

    주의: 자기조절학습검사(paper_idx=2)는 이 도구로 캠페인 존재/진행상태 확인까지만
    가능하다. 그 세부 결과(3대 전략/6개 중분류 점수 등)는 어떤 Tool로도 조회할 수 없으므로,
    그런 세부 내용을 묻는 질문에는 "아직 데이터로 확인할 수 없다"고 안내하고 창작하지 말 것.

    cla_id만 주면 그 학급의 캠페인만, tc_id만 주면 해당 교사가 담당하는 모든 학급의
    캠페인을 반환한다(cla_id/tc_id 중 하나는 필수).

    Args:
        cla_id: 학급 고유 ID (선택, UUID).
        tc_id: 교사 고유 ID (선택). 여러 학급을 아우르는 질문 시 사용.

    Returns:
        list[dict]: [{cla_id, invite_code(그룹 초대 코드), paper_idx("1"/"2"),
                       paper_name(학습종합검사/자기조절학습검사), ord_no, campaign_status
                       (진행중/완료), st_dt, ed_dt, not_submitted, in_progress_students,
                       completed_students, total_students}, ...].
        같은 학급/교사 범위에서 "진행 중"/"완료" 캠페인이 몇 개인지는 campaign_status
        값으로 직접 세면 된다. cla_id/tc_id가 모두 없으면 [{"error": "MISSING_SCOPE", ...}] 반환.
    """
    if not cla_id and not tc_id:
        return [{"error": "MISSING_SCOPE", "message": "cla_id 또는 tc_id 중 하나는 반드시 지정해야 합니다."}]

    if cla_id:
        return await _execute_query(
            """
            SELECT gi.cla_id, gi.invite_code,
                   di.paper_idx,
                   CASE di.paper_idx
                       WHEN '1' THEN '학습종합검사'
                       WHEN '2' THEN '자기조절학습검사'
                       ELSE di.paper_idx
                   END AS paper_name,
                   di.ord_no,
                   CASE di.dgnss_at
                       WHEN 'Y' THEN '진행중'
                       WHEN 'N' THEN '완료'
                       ELSE di.dgnss_at
                   END AS campaign_status,
                   di.dgnss_st_dt AS st_dt, di.dgnss_ed_dt AS ed_dt,
                   SUM(ri.eak_stts_cd = 1) AS not_submitted,
                   SUM(ri.eak_stts_cd = 2) AS in_progress_students,
                   SUM(ri.eak_stts_cd = 3) AS completed_students,
                   COUNT(ri.id) AS total_students
            FROM group_info gi
            JOIN tb_dgnss_info di ON di.cla_id = gi.cla_id
            LEFT JOIN tb_dgnss_result_info ri ON ri.dgnss_id = di.id
            WHERE gi.cla_id = %s AND gi.use_yn = 'Y'
            GROUP BY gi.cla_id, gi.invite_code, di.id, di.paper_idx, di.ord_no,
                     di.dgnss_at, di.dgnss_st_dt, di.dgnss_ed_dt
            ORDER BY gi.cla_id, di.paper_idx, di.ord_no
            """,
            (cla_id,),
        )
    return await _execute_query(
        """
        SELECT gi.cla_id, gi.invite_code,
               di.paper_idx,
               CASE di.paper_idx
                   WHEN '1' THEN '학습종합검사'
                   WHEN '2' THEN '자기조절학습검사'
                   ELSE di.paper_idx
               END AS paper_name,
               di.ord_no,
               CASE di.dgnss_at
                   WHEN 'Y' THEN '진행중'
                   WHEN 'N' THEN '완료'
                   ELSE di.dgnss_at
               END AS campaign_status,
               di.dgnss_st_dt AS st_dt, di.dgnss_ed_dt AS ed_dt,
               SUM(ri.eak_stts_cd = 1) AS not_submitted,
               SUM(ri.eak_stts_cd = 2) AS in_progress_students,
               SUM(ri.eak_stts_cd = 3) AS completed_students,
               COUNT(ri.id) AS total_students
        FROM group_info gi
        JOIN user u ON u.user_no = gi.host_user_no
        JOIN tb_dgnss_info di ON di.cla_id = gi.cla_id
        LEFT JOIN tb_dgnss_result_info ri ON ri.dgnss_id = di.id
        WHERE u.tc_id = %s AND gi.use_yn = 'Y'
        GROUP BY gi.cla_id, gi.invite_code, di.id, di.paper_idx, di.ord_no,
                 di.dgnss_at, di.dgnss_st_dt, di.dgnss_ed_dt
        ORDER BY gi.cla_id, di.paper_idx, di.ord_no
        """,
        (tc_id,),
    )


# ---------------------------------------------------------------------------
# Tool 11: 학급 내 긴급/관찰 필요 학생 목록
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
            SELECT cla_id, MAX(ord_no) AS ord_no FROM tb_dgnss_info
            WHERE paper_idx = %s GROUP BY cla_id
        ) latest ON latest.cla_id = gi.cla_id
        JOIN tb_dgnss_info di ON di.cla_id = gi.cla_id AND di.ord_no = latest.ord_no
            AND di.paper_idx = %s
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
        (*_RISK_LPA_CLASS_IDS, _LEARNING_PAPER_IDX, _LEARNING_PAPER_IDX, cla_id, *_RISK_LPA_CLASS_IDS),
    )


# ---------------------------------------------------------------------------
# Tool 목록 (app/tools/__init__.py에서 참조)
# ---------------------------------------------------------------------------
mysql_tools_list = [
    query_student_lpa_and_scores,
    query_class_dgnss_overview,
    query_class_midcategory_scores,
    query_student_memos,
    query_counseling_history,
    query_counseling_summary,
    query_school_records,
    query_class_roster,
    query_teacher_classes_overview,
    query_class_exam_campaigns,
    query_class_risk_students,
]
