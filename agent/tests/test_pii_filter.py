"""
PII 마스킹 기능 테스트
"""
from app.utils.pii_filter import mask_pii_data, mask_string


def test_mask_string():
    """문자열 마스킹 테스트"""
    assert mask_string("홍길동") == "홍**"
    assert mask_string("20231234") == "2*******"
    assert mask_string("test@example.com", show_first=4) == "test************"
    print("✅ mask_string 테스트 통과")


def test_mask_pii_data_simple():
    """간단한 PII 데이터 마스킹 테스트"""
    data = {
        "name": "홍길동",
        "student_id": "20231234",
        "score": 95
    }

    masked = mask_pii_data(data)

    assert masked["name"] == "홍**"
    assert masked["student_id"] == "2*******"
    assert masked["score"] == 95  # PII 아닌 필드는 그대로
    print("✅ 간단한 PII 마스킹 테스트 통과")


def test_mask_pii_data_nested():
    """중첩된 PII 데이터 마스킹 테스트"""
    data = {
        "student": {
            "name": "김철수",
            "studentId": "20231111",
            "phone": "010-1234-5678"
        },
        "scores": {"math": 95, "science": 88},
        "recent_comment": "수학에 매우 흥미를 보임"
    }

    masked = mask_pii_data(data)

    assert masked["student"]["name"] == "김**"
    assert masked["student"]["studentId"] == "2*******"
    assert masked["student"]["phone"] == "0************"
    assert masked["scores"]["math"] == 95
    assert masked["recent_comment"] == "수학에 매우 흥미를 보임"
    print("✅ 중첩된 PII 마스킹 테스트 통과")


def test_mask_pii_data_with_list():
    """리스트를 포함한 PII 데이터 마스킹 테스트"""
    data = {
        "students": [
            {"name": "학생1", "score": 90},
            {"name": "학생2", "score": 85}
        ]
    }

    masked = mask_pii_data(data)

    assert masked["students"][0]["name"] == "학**"
    assert masked["students"][1]["name"] == "학**"
    assert masked["students"][0]["score"] == 90
    print("✅ 리스트 PII 마스킹 테스트 통과")


def test_mask_pii_data_none():
    """None 입력 테스트"""
    assert mask_pii_data(None) is None
    print("✅ None 입력 테스트 통과")


if __name__ == "__main__":
    print("="*50)
    print("PII 마스킹 유닛 테스트 시작")
    print("="*50)

    test_mask_string()
    test_mask_pii_data_simple()
    test_mask_pii_data_nested()
    test_mask_pii_data_with_list()
    test_mask_pii_data_none()

    print("\n" + "="*50)
    print("✅ 모든 테스트 통과!")
    print("="*50)
