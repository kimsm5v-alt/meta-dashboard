"""
PII (Personally Identifiable Information) 마스킹 유틸리티

CLAUDE.md 가이드라인에 따라 학생 이름, 학번 등의 개인정보를
AI 요청 전에 마스킹 처리합니다.
"""
import re
from typing import Any, Dict, List


# 마스킹할 PII 필드명 (프로젝트 요구사항에 맞게 확장 가능)
PII_FIELDS = {
    "name", "student_name", "studentName", "이름", "성명",
    "student_id", "studentId", "학번",
    "phone", "phone_number", "phoneNumber", "전화번호", "휴대폰",
    "email", "이메일",
    "address", "주소",
    "ssn", "주민등록번호", "생년월일"
}


def mask_string(text: str, show_first: int = 1, mask_char: str = "*") -> str:
    """
    문자열을 마스킹 처리합니다.

    Args:
        text: 마스킹할 텍스트
        show_first: 앞부분 표시할 글자 수
        mask_char: 마스킹에 사용할 문자

    Returns:
        마스킹된 문자열

    Example:
        "홍길동" -> "홍**"
        "20231234" -> "2*******"
    """
    if not text or len(text) <= show_first:
        return mask_char * len(text) if text else ""

    return text[:show_first] + mask_char * (len(text) - show_first)


def mask_pii_in_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    딕셔너리 내의 PII 필드를 재귀적으로 마스킹합니다.

    Args:
        data: 마스킹할 딕셔너리

    Returns:
        마스킹 처리된 딕셔너리 (원본은 변경하지 않음)
    """
    masked_data = {}

    for key, value in data.items():
        # 키가 PII 필드인 경우
        if key.lower() in {field.lower() for field in PII_FIELDS}:
            if isinstance(value, str):
                masked_data[key] = mask_string(value)
            elif isinstance(value, (int, float)):
                masked_data[key] = mask_string(str(value))
            else:
                masked_data[key] = "***MASKED***"
        # 중첩된 딕셔너리 처리
        elif isinstance(value, dict):
            masked_data[key] = mask_pii_in_dict(value)
        # 리스트 내부 처리
        elif isinstance(value, list):
            masked_data[key] = [
                mask_pii_in_dict(item) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            masked_data[key] = value

    return masked_data


def mask_pii_data(context_data: Dict[str, Any] | None) -> Dict[str, Any] | None:
    """
    컨텍스트 데이터에서 PII를 마스킹합니다.

    Args:
        context_data: 원본 컨텍스트 데이터

    Returns:
        마스킹 처리된 컨텍스트 데이터

    Example:
        >>> data = {"name": "홍길동", "student_id": "20231234", "score": 95}
        >>> mask_pii_data(data)
        {"name": "홍**", "student_id": "2*******", "score": 95}
    """
    if context_data is None:
        return None

    return mask_pii_in_dict(context_data)
