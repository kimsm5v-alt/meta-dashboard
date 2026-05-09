"""
Neo4j 그래프 데이터베이스 Tool 모듈

LPA(Latent Profile Analysis) 유형별 데이터를 Neo4j에서 조회하여
Agent의 LLM Tool Calling으로 제공한다.

참조 문서: agent/docs/NEO4J_TOOL_IMPLEMENTATION_PLAN_V2.md (SSOT)
참조 코드: backend/.../service/DgnssGraphService.java (정답 레퍼런스)
"""
import os
import logging
import asyncio
from typing import Dict, List, Any, Union
from neo4j import AsyncGraphDatabase, exceptions as neo4j_exceptions
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 합법적인 (className, schoolLevel) 조합 — 6쌍 전부
# DgnssLpaService.java의 ELEMENTARY_CLASSES/MIDDLE_CLASSES와 동일
# ---------------------------------------------------------------------------
VALID_SCHOOL_LEVELS = {"elementary", "middle"}
VALID_CLASS_NAMES = {
    "elementary": {"자원소진형", "안전 균형형", "몰입자원 풍부형"},
    "middle":     {"냉소적 무기력형", "정서조절 취약형", "자기주도 몰입형"},
}
MAX_LIMIT = 100


# ---------------------------------------------------------------------------
# Neo4j 연결 관리 (싱글톤 패턴)
# ---------------------------------------------------------------------------
class Neo4jConnectionManager:
    """Neo4j AsyncDriver 싱글톤 관리자"""
    _driver = None

    @classmethod
    def get_driver(cls):
        """드라이버 인스턴스 반환. 미초기화 시 생성."""
        if cls._driver is None:
            uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
            user = os.getenv("NEO4J_USERNAME", "neo4j")
            password = os.getenv("NEO4J_PASSWORD", "test1234")
            cls._driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        return cls._driver

    @classmethod
    async def verify(cls):
        """기동 시 1회 호출하여 Neo4j 연결 상태를 검증한다. 실패 시 예외 전파."""
        driver = cls.get_driver()
        await driver.verify_connectivity()

    @classmethod
    async def close(cls):
        """애플리케이션 종료 시 드라이버 리소스를 해제한다."""
        if cls._driver is not None:
            await cls._driver.close()
            cls._driver = None


# ---------------------------------------------------------------------------
# 인자 검증 (6쌍 화이트리스트 기반)
# ---------------------------------------------------------------------------
def _validate_args(className: str, schoolLevel: str) -> Union[None, Dict[str, str]]:
    """className과 schoolLevel 조합이 합법적인지 검증한다.

    Returns:
        None: 유효한 조합
        Dict: 에러 정보 (error 코드 + message)
    """
    if schoolLevel not in VALID_SCHOOL_LEVELS:
        return {
            "error": "INVALID_SCHOOL_LEVEL",
            "message": f"schoolLevel must be one of {sorted(VALID_SCHOOL_LEVELS)}, got '{schoolLevel}'"
        }
    if className not in VALID_CLASS_NAMES[schoolLevel]:
        return {
            "error": "INVALID_CLASS_NAME",
            "message": (
                f"className '{className}' invalid for schoolLevel '{schoolLevel}'. "
                f"Allowed: {sorted(VALID_CLASS_NAMES[schoolLevel])}"
            )
        }
    return None


# ---------------------------------------------------------------------------
# Cypher 쿼리 실행 공통 함수
# ---------------------------------------------------------------------------
async def _execute_query(query: str, parameters: dict) -> List[Dict[str, Any]]:
    """Neo4j Cypher 쿼리를 실행하고 결과를 dict 리스트로 반환한다.

    타임아웃, 연결 실패 등 모든 예외를 구조화된 에러 dict로 변환하여
    LLM이 에러 상황을 이해할 수 있도록 한다.
    """
    driver = Neo4jConnectionManager.get_driver()
    if driver is None:
        return [{"error": "DRIVER_NOT_INITIALIZED", "message": "Neo4j driver not available"}]

    timeout = float(os.getenv("GRAPH_TOOL_TIMEOUT", "5.0"))

    async def _run():
        async with driver.session() as session:
            result = await session.run(query, parameters)
            return await result.data()

    try:
        return await asyncio.wait_for(_run(), timeout=timeout)
    except asyncio.TimeoutError:
        logger.error(f"Neo4j query timeout ({timeout}s)")
        return [{"error": "TIMEOUT", "message": "Query timeout exceeded"}]
    except neo4j_exceptions.ServiceUnavailable as e:
        logger.error(f"Neo4j unavailable: {e}")
        return [{"error": "UNAVAILABLE", "message": "Database service unavailable"}]
    except neo4j_exceptions.AuthError as e:
        logger.error(f"Neo4j auth failed: {e}")
        return [{"error": "AUTH_FAILED", "message": "Database authentication failed"}]
    except neo4j_exceptions.ClientError as e:
        logger.error(f"Neo4j client error: {e}")
        return [{"error": "CLIENT_ERROR", "message": str(e)}]
    except Exception as e:
        logger.exception("Unknown Neo4j error")
        return [{"error": "UNKNOWN", "message": str(e)}]


# ---------------------------------------------------------------------------
# Tool 1: LPA 유형 메타데이터 조회
# ---------------------------------------------------------------------------
@tool
async def get_lpa_class_info(className: str, schoolLevel: str) -> List[Dict[str, Any]]:
    """LPA 유형의 메타데이터(설명/색상/번호)를 1건 조회한다.

    Args:
        className: LPA 유형명. 다음 6개 중 정확히 하나(공백 포함):
          - elementary: "자원소진형" | "안전 균형형" | "몰입자원 풍부형"
          - middle: "냉소적 무기력형" | "정서조절 취약형" | "자기주도 몰입형"
        schoolLevel: 학교급. "elementary" 또는 "middle".

    Returns:
        list[dict]: 유형 메타데이터 1건. 데이터 없을 시 [] 반환.
        오류 시 단일 dict {"error": "<code>", "message": "..."} 반환.
    """
    err = _validate_args(className, schoolLevel)
    if err:
        return [err]
    return await _execute_query(
        """
        MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
        RETURN c.name AS className, c.school_level AS schoolLevel,
               c.class_num AS classNum, c.color AS color, c.description AS description
        LIMIT 1
        """,
        {"className": className, "schoolLevel": schoolLevel},
    )


# ---------------------------------------------------------------------------
# Tool 2: 조절(Moderation) 경로 전략 목록 조회
# ---------------------------------------------------------------------------
@tool
async def get_moderation_paths(className: str, schoolLevel: str, limit: int = 20) -> List[Dict[str, Any]]:
    """해당 유형의 조절(Moderation) 경로 전략 목록을 조회한다. (개입 전략)

    Args:
        className: LPA 유형명. 다음 6개 중 정확히 하나(공백 포함):
          - elementary: "자원소진형" | "안전 균형형" | "몰입자원 풍부형"
          - middle: "냉소적 무기력형" | "정서조절 취약형" | "자기주도 몰입형"
        schoolLevel: 학교급. "elementary" 또는 "middle".
        limit: 반환할 최대 경로 수 (기본 20, 최대 100).

    Returns:
        list[dict]: 조절 경로 목록. 데이터 없을 시 [] 반환.
    """
    err = _validate_args(className, schoolLevel)
    if err:
        return [err]
    safe_limit = max(1, min(int(limit), MAX_LIMIT))
    return await _execute_query(
        """
        MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
              -[:HAS_MODERATION_PATH]->(p:ModerationPath)
        RETURN p.id AS id, p.path_type AS pathType, p.path_color AS pathColor,
               p.x AS x, p.z AS z, p.y AS y,
               p.keyword_interp AS keywordInterp, p.keyword_strat AS keywordStrat,
               p.interpretation AS interpretation, p.strategy AS strategy,
               p.z_factor_type AS zFactorType, p.z_need_direction AS zNeedDirection
        ORDER BY p.id
        LIMIT $limit
        """,
        {"className": className, "schoolLevel": schoolLevel, "limit": safe_limit},
    )


# ---------------------------------------------------------------------------
# Tool 3: 매개(Mediation) 경로 전략 목록 조회
# ---------------------------------------------------------------------------
@tool
async def get_mediation_paths(className: str, schoolLevel: str, limit: int = 20) -> List[Dict[str, Any]]:
    """해당 유형의 매개(Mediation) 경로 전략 목록을 조회한다. (X->M->Y 경로)

    Args:
        className: LPA 유형명. 다음 6개 중 정확히 하나(공백 포함):
          - elementary: "자원소진형" | "안전 균형형" | "몰입자원 풍부형"
          - middle: "냉소적 무기력형" | "정서조절 취약형" | "자기주도 몰입형"
        schoolLevel: 학교급. "elementary" 또는 "middle".
        limit: 반환할 최대 경로 수 (기본 20, 최대 100).

    Returns:
        list[dict]: 매개 경로 목록. 데이터 없을 시 [] 반환.
    """
    err = _validate_args(className, schoolLevel)
    if err:
        return [err]
    safe_limit = max(1, min(int(limit), MAX_LIMIT))
    return await _execute_query(
        """
        MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
              -[:HAS_MEDIATION_PATH]->(p:MediationPath)
        RETURN p.id AS id, p.x AS x, p.m AS mediator, p.y AS y,
               p.path_type AS pathType,
               p.interpretation AS interpretation, p.strategy AS strategy
        ORDER BY p.id
        LIMIT $limit
        """,
        {"className": className, "schoolLevel": schoolLevel, "limit": safe_limit},
    )


# ---------------------------------------------------------------------------
# Tool 4: 요인 평균 T-Score 조회
# ---------------------------------------------------------------------------
@tool
async def get_factor_scores(className: str, schoolLevel: str) -> List[Dict[str, Any]]:
    """해당 유형 집단의 38개 요인 평균 T-Score를 조회한다. (학생 개별 점수와 비교용)

    Args:
        className: LPA 유형명. 다음 6개 중 정확히 하나(공백 포함):
          - elementary: "자원소진형" | "안전 균형형" | "몰입자원 풍부형"
          - middle: "냉소적 무기력형" | "정서조절 취약형" | "자기주도 몰입형"
        schoolLevel: 학교급. "elementary" 또는 "middle".

    Returns:
        list[dict]: 38개 요인별 T-Score 목록. 데이터 없을 시 [] 반환.
    """
    err = _validate_args(className, schoolLevel)
    if err:
        return [err]
    return await _execute_query(
        """
        MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
              -[r:GROUP_TSCORE]->(f:Factor)
        RETURN f.name AS factorName,
               f.factor_type AS factorType,
               f.need_score_direction AS needScoreDirection,
               r.t_score AS tScore,
               r.raw_mean AS rawMean
        ORDER BY f.name
        """,
        {"className": className, "schoolLevel": schoolLevel},
    )


# ---------------------------------------------------------------------------
# Tool 5: 유형 전반 일괄 조회 (대화 초반 1회 호출 권장)
# ---------------------------------------------------------------------------
@tool
async def get_lpa_overview(className: str, schoolLevel: str,
                           modPathLimit: int = 10, medPathLimit: int = 5) -> List[Dict[str, Any]]:
    """대화 초반 1회 호출로 유형 전반(설명+상위 조절/매개 경로+요인평균)을 일괄 조회한다.

    Tool Call 왕복 횟수를 줄이기 위한 안전망용 통합 쿼리.
    세부 질문은 개별 Tool(get_moderation_paths 등)을 사용한다.

    Args:
        className: LPA 유형명. 다음 6개 중 정확히 하나(공백 포함):
          - elementary: "자원소진형" | "안전 균형형" | "몰입자원 풍부형"
          - middle: "냉소적 무기력형" | "정서조절 취약형" | "자기주도 몰입형"
        schoolLevel: 학교급. "elementary" 또는 "middle".
        modPathLimit: 반환할 조절 경로 최대 수 (기본 10).
        medPathLimit: 반환할 매개 경로 최대 수 (기본 5).

    Returns:
        list[dict]: 유형 전반 데이터 1건. 데이터 없을 시 [] 반환.
    """
    err = _validate_args(className, schoolLevel)
    if err:
        return [err]
    return await _execute_query(
        """
        MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
        OPTIONAL MATCH (c)-[:HAS_MODERATION_PATH]->(mod:ModerationPath)
        WITH c, [x IN collect(DISTINCT {
          id: mod.id, pathType: mod.path_type, x: mod.x, z: mod.z, y: mod.y,
          keywordStrat: mod.keyword_strat, strategy: mod.strategy
        }) WHERE x.id IS NOT NULL][0..$modPathLimit] AS moderationPaths
        OPTIONAL MATCH (c)-[:HAS_MEDIATION_PATH]->(med:MediationPath)
        WITH c, moderationPaths, [x IN collect(DISTINCT {
          id: med.id, x: med.x, mediator: med.m, y: med.y, strategy: med.strategy
        }) WHERE x.id IS NOT NULL][0..$medPathLimit] AS mediationPaths
        OPTIONAL MATCH (c)-[r:GROUP_TSCORE]->(f:Factor)
        RETURN c.name AS className, c.school_level AS schoolLevel,
               c.description AS description,
               moderationPaths, mediationPaths,
               [x IN collect(DISTINCT {factorName: f.name, tScore: r.t_score})
                WHERE x.factorName IS NOT NULL] AS factorScores
        """,
        {
            "className": className, "schoolLevel": schoolLevel,
            "modPathLimit": max(1, min(int(modPathLimit), MAX_LIMIT)),
            "medPathLimit": max(1, min(int(medPathLimit), MAX_LIMIT)),
        },
    )


# ---------------------------------------------------------------------------
# Tool 목록 (agent_service에서 참조)
# ---------------------------------------------------------------------------
neo4j_tools_list = [
    get_lpa_class_info,
    get_moderation_paths,
    get_mediation_paths,
    get_factor_scores,
    get_lpa_overview,
]
