import os
import logging
import asyncio
from typing import Dict, List, Any, Optional
from neo4j import AsyncGraphDatabase, exceptions as neo4j_exceptions
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

class Neo4jConnectionManager:
    """Neo4j 연결 및 자원 해제를 관리하는 클래스 (클래스 메서드 기반)"""
    _driver = None

    @classmethod
    def get_driver(cls):
        """Neo4j 드라이버 인스턴스 지연 생성 (Lazy-loading)"""
        if cls._driver is None:
            uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
            user = os.getenv("NEO4J_USERNAME", "neo4j")
            password = os.getenv("NEO4J_PASSWORD", "test1234")
            try:
                cls._driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
            except Exception as e:
                logger.error(f"Neo4j 드라이버 초기화 실패: {e}")
        return cls._driver

    @classmethod
    async def close(cls):
        """애플리케이션 종료 시 드라이버 리소스 해제"""
        if cls._driver is not None:
            await cls._driver.close()
            cls._driver = None
            logger.info("Neo4j 드라이버가 안전하게 종료되었습니다.")


async def _execute_query(query: str, parameters: dict) -> List[Dict[str, Any]]:
    """공통 쿼리 실행기: 타임아웃 및 Graceful Degradation 처리"""
    driver = Neo4jConnectionManager.get_driver()
    if driver is None:
        logger.error("Neo4j 드라이버가 초기화되지 않아 쿼리를 수행할 수 없습니다. (get_driver() 내부에서 초기화 실패 로그를 확인하세요)")
        return [{"error": "Database connection failed"}]
    
    timeout = float(os.getenv("GRAPH_TOOL_TIMEOUT", "5.0"))
    
    try:
        # 비동기 환경에서 안전한 타임아웃 보장
        async with driver.session() as session:
            result = await asyncio.wait_for(
                session.run(query, parameters),
                timeout=timeout
            )
            records = await asyncio.wait_for(
                result.data(),
                timeout=timeout
            )
            return records
    except asyncio.TimeoutError:
        logger.error(f"Neo4j 쿼리 타임아웃 초과 ({timeout}s)")
        return [{"error": "Query timeout exceeded"}]
    except neo4j_exceptions.ServiceUnavailable as e:
        logger.error(f"Neo4j 서비스를 사용할 수 없음: {e}")
        return [{"error": "Database service unavailable"}]
    except neo4j_exceptions.AuthError as e:
        logger.error(f"Neo4j 인증 실패: {e}")
        return [{"error": "Database authentication failed"}]
    except neo4j_exceptions.ClientError as e:
        logger.error(f"Neo4j 클라이언트 오류 (Cypher 문법 등): {e}")
        return [{"error": f"Database client error: {str(e)}"}]
    except Exception as e:
        logger.error(f"Neo4j 쿼리 실행 중 알 수 없는 오류 발생: {e}")
        return [{"error": f"Query execution failed: {str(e)}"}]


@tool
async def get_lpa_class_info(className: str, schoolLevel: str) -> List[Dict[str, Any]]:
    """
    특정 LPA(학습자 특성) 클래스의 메타데이터(설명 등)를 조회합니다.
    Args:
        className: 유형명 (예: "자원소진형")
        schoolLevel: 학교급 (예: "E", "M", "H")
    """
    query = """
    MATCH (c:LPAClass {className: $className, schoolLevel: $schoolLevel})
    RETURN properties(c) AS info
    """
    return await _execute_query(query, {"className": className, "schoolLevel": schoolLevel})


@tool
async def get_moderation_paths(className: str, schoolLevel: str) -> List[Dict[str, Any]]:
    """
    해당 유형(className)의 성취를 위한 조절 효과 경로(HAS_MODERATION_PATH) 전략을 조회합니다.
    Args:
        className: 유형명 (예: "자원소진형")
        schoolLevel: 학교급 (예: "E", "M", "H")
    """
    query = """
    MATCH (c:LPAClass {className: $className, schoolLevel: $schoolLevel})-[r:HAS_MODERATION_PATH]->(p:ModerationPath)
    RETURN p.pathName AS pathName, p.description AS description, r.priority AS priority
    ORDER BY r.priority ASC
    """
    return await _execute_query(query, {"className": className, "schoolLevel": schoolLevel})


@tool
async def get_mediation_paths(className: str, schoolLevel: str) -> List[Dict[str, Any]]:
    """
    해당 유형(className)의 성취를 위한 매개 효과 경로(HAS_MEDIATION_PATH) 전략을 조회합니다.
    Args:
        className: 유형명 (예: "자원소진형")
        schoolLevel: 학교급 (예: "E", "M", "H")
    """
    query = """
    MATCH (c:LPAClass {className: $className, schoolLevel: $schoolLevel})-[r:HAS_MEDIATION_PATH]->(p:MediationPath)
    RETURN p.pathName AS pathName, p.description AS description, r.priority AS priority
    ORDER BY r.priority ASC
    """
    return await _execute_query(query, {"className": className, "schoolLevel": schoolLevel})


@tool
async def get_factor_scores(className: str, schoolLevel: str) -> List[Dict[str, Any]]:
    """
    해당 유형(className)이 속한 집단의 요인별 평균 점수(T-Score)를 조회합니다.
    이를 통해 학생의 실제 점수와 집단 평균을 비교 분석할 수 있습니다.
    Args:
        className: 유형명 (예: "자원소진형")
        schoolLevel: 학교급 (예: "E", "M", "H")
    """
    query = """
    MATCH (c:LPAClass {className: $className, schoolLevel: $schoolLevel})-[r:GROUP_TSCORE]->(f:Factor)
    RETURN f.factorName AS factorName, r.tscore AS averageScore
    """
    return await _execute_query(query, {"className": className, "schoolLevel": schoolLevel})

# 에이전트 서비스에 주입하기 위한 도구 리스트 익스포트
neo4j_tools_list = [
    get_lpa_class_info,
    get_moderation_paths,
    get_mediation_paths,
    get_factor_scores
]
