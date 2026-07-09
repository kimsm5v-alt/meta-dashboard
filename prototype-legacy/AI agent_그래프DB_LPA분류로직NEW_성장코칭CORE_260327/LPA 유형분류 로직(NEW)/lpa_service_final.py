"""
LPA 유형 분류 서비스 — Python 레퍼런스 구현
==============================================
META 학습종합검사 38개 요인 T점수 → 3유형 분류

사용법:
    from lpa_service_final import classify_student

    result = classify_student(
        scores={"자아존중감": 52.0, "자기효능감": 50.9, ...},
        school="elementary"
    )
    # → {"predicted_type": "안전 균형형", "probabilities": {...}, "school_type": "elementary"}
"""

import json
import math
import os

# ─── 파라미터 로드 ─────────────────────────────────────────────────────────────

_PARAMS = None

def _load_params():
    global _PARAMS
    if _PARAMS is None:
        json_path = os.path.join(os.path.dirname(__file__), "lpa_model_params.json")
        with open(json_path, "r", encoding="utf-8") as f:
            _PARAMS = json.load(f)
    return _PARAMS


# ─── 핵심 분류 함수 ───────────────────────────────────────────────────────────

def classify_student(scores: dict, school: str = "elementary") -> dict:
    """
    T점수 38개(key-value)를 받아 LPA 유형 분류.

    Args:
        scores: {"자아존중감": 52.0, "자기효능감": 50.9, ...} 형태의 T점수 38개
        school: "elementary" (초등) 또는 "middle" (중등)

    Returns:
        {
            "predicted_type": str,           # 예측 유형명
            "probabilities": {str: float},   # 각 유형별 사후확률
            "school_type": str               # 학교급
        }

    Raises:
        ValueError: school_type이 잘못되었거나, scores 키가 38개가 아닌 경우
    """
    params = _load_params()

    if school not in params:
        raise ValueError(f"school_type은 'elementary' 또는 'middle'이어야 합니다. 입력값: '{school}'")

    p = params[school]
    feature_order = params["feature_order"]

    # 입력 검증
    missing = [name for name in feature_order if name not in scores]
    if missing:
        raise ValueError(f"누락된 요인: {missing}")

    # key-value → 배열 변환
    score_arr = [float(scores[name]) for name in feature_order]

    class_names = list(p["means"].keys())
    variances = p["variances"]

    # 로그 사후확률 계산
    log_posteriors = []
    for cls in class_names:
        means = p["means"][cls]
        prior = p["priors"][cls]

        log_lik = 0.0
        for i in range(38):
            diff = score_arr[i] - means[i]
            log_lik += -0.5 * (diff * diff / variances[i] + math.log(2 * math.pi * variances[i]))

        log_posteriors.append(log_lik + math.log(prior))

    # Log-Sum-Exp 정규화
    max_val = max(log_posteriors)
    exp_vals = [math.exp(lp - max_val) for lp in log_posteriors]
    sum_exp = sum(exp_vals)
    probs = [ev / sum_exp for ev in exp_vals]

    best_idx = probs.index(max(probs))

    return {
        "predicted_type": class_names[best_idx],
        "probabilities": {class_names[i]: round(probs[i], 6) for i in range(3)},
        "school_type": school,
    }


# ─── 데모 ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("LPA 분류 서비스 — Python 레퍼런스 구현 데모")
    print("=" * 60)

    # 초등 안전 균형형 테스트
    test_ele = {
        "자아존중감": 52, "자기효능감": 51, "성장마인드셋": 51,
        "자기정서인식": 50, "자기정서조절": 48, "타인정서인식": 49, "타인공감능력": 47,
        "계획능력": 47, "점검능력": 45, "조절능력": 48,
        "공부환경": 47, "시간관리": 46, "수업태도": 48, "노트하기": 47, "시험준비": 50,
        "부모 의사소통": 49, "부모 학업지지": 50, "친구 정서지지": 49, "교사 정서지지": 49,
        "활기": 46, "몰두": 47, "의미감": 47,
        "자율성": 47, "유능성": 50, "관계성": 51,
        "성적부담": 49, "공부부담": 51, "수업부담": 51,
        "스마트폰 의존": 50, "게임 과몰입": 49,
        "부모 성적압력": 50, "부모 공부부담": 50, "친구 공부비교": 49, "교사 성적압력": 48, "교사 수업부담": 49,
        "고갈": 51, "무능감": 48, "반감-냉소": 52,
    }
    result = classify_student(test_ele, "elementary")
    print(f"\n[초등 테스트] 예측: {result['predicted_type']}")
    for k, v in result["probabilities"].items():
        print(f"  {k:12s}: {v*100:.1f}%")

    # 중등 자기주도 몰입형 테스트
    test_mid = {
        "자아존중감": 57, "자기효능감": 57, "성장마인드셋": 56,
        "자기정서인식": 56, "자기정서조절": 53, "타인정서인식": 52, "타인공감능력": 53,
        "계획능력": 54, "점검능력": 54, "조절능력": 55,
        "공부환경": 54, "시간관리": 53, "수업태도": 58, "노트하기": 55, "시험준비": 50,
        "부모 의사소통": 56, "부모 학업지지": 57, "친구 정서지지": 53, "교사 정서지지": 57,
        "활기": 58, "몰두": 57, "의미감": 57,
        "자율성": 55, "유능성": 57, "관계성": 55,
        "성적부담": 40, "공부부담": 39, "수업부담": 39,
        "스마트폰 의존": 45, "게임 과몰입": 44,
        "부모 성적압력": 44, "부모 공부부담": 44, "친구 공부비교": 44, "교사 성적압력": 43, "교사 수업부담": 42,
        "고갈": 43, "무능감": 40, "반감-냉소": 40,
    }
    result = classify_student(test_mid, "middle")
    print(f"\n[중등 테스트] 예측: {result['predicted_type']}")
    for k, v in result["probabilities"].items():
        print(f"  {k:12s}: {v*100:.1f}%")
