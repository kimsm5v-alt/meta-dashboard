# 코드 리뷰 - 0dee9f8a

## 코드 복잡도 분석

**분석된 파일**: 3개 / 변경된 파일: 4개


### 정상 범위 (NONE)


**`school_record_policy.py`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.008

- 청크 수: 5개


**권장사항:**

- 복잡도 정상 범위


**`school_record_service.py`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.010

- 청크 수: 10개


**권장사항:**

- 복잡도 정상 범위


**`test_school_record.py`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.010

- 청크 수: 33개


**권장사항:**

- 파일 크기가 큼 (33개 청크) - 파일 분리 검토


---


## 변경 배경

생활기록부 문구 생성 시 요인 검사 결과의 T점수를 LLM에 전달하기 전에 "질적 수준" 레벨로 변환하는 로직에서, 부적 요인(점수가 낮을수록 긍정적인 요인, 예: 시험불안·학업스트레스)의 방향 보정이 누락되어 있던 문제를 해결하는 커밋입니다.

- **목적**: `is_positive=False`인 부적 요인의 T점수를 `100 - t_score`로 뒤집어 매핑함으로써, 반환되는 레벨이 항상 "이 요인이 얼마나 긍정적으로 나타나는가"를 의미하도록 보정
- **도메인**: 비즈니스 로직 (생활기록부 문구 생성 서비스)
- **변경 방향**: 프론트엔드 `computeStudentProfile.ts`의 `meritScore(factor.isPositive ? avgT : 100-avgT)` 계산과 동일한 보정 방식을 백엔드에도 일관되게 적용

---

## [GOOD] 잘된 점

1. **프론트엔드와의 보정 로직 일치**: `meritScore` 계산과 동일한 `100 - t_score` 방식을 채택하여 프론트/백엔드 간 방향 해석의 불일치를 제거했습니다. `school_record_policy.py`의 docstring에 프론트엔드 파일 경로와 계산식을 명시하여 추적성을 확보했습니다.

2. **하위 호환성 유지**: `is_positive: bool = True` 기본값을 두어 기존 호출부(파라미터 미전달)의 동작을 그대로 보존했습니다. 테스트에서도 `t_score_to_level(75) == t_score_to_level(75, True)`로 기본값 호환성을 명시적으로 검증합니다.

3. **테스트 커버리지 확보**: 부적 요인 방향 보정(25→매우높음, 63→낮음, 75→매우낮음)과 기본값 호환성을 모두 검증했습니다. 기존 테스트 `test_user_message_hides_raw_tscore`도 "시험불안: 높음"에서 "시험불안: 낮음"으로 기대값을 수정하여 실제 동작 변화를 반영했습니다.

4. **문서화 충실**: README에 `is_positive` 방향 보정의 원리, 요청/응답 예시, 그리고 LLM의 어휘 연상 한계(시험불안이 "불안감을 이겨내려는 성실함"으로 서술되는 현상)까지 솔직하게 기록했습니다.

---

## 변경사항 요약

`t_score_to_level` 함수에 `is_positive` 파라미터를 추가하여 부적 요인의 T점수를 뒤집어 매핑하고, `school_record_service.py`의 두 호출부(strengths/improvements)에 `factor.is_positive`를 전달했습니다. 이에 대한 테스트와 README 문서가 함께 갱신되었습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

1. **`is_positive` 필드의 기본값 안전성**

`FactorLevel` 모델의 `is_positive` 필드가 `Field(True, ...)` 기본값을 가지므로, 프론트가 `is_positive`를 누락하고 보내면 부적 요인이 정적 요인으로 잘못 해석될 여지가 있습니다.

- **위치**: `agent/app/models/school_record.py` 라인 44
- **기존 코드**:
```python
is_positive: bool = Field(True, description="정적 요인 여부(부적 요인은 해석 방향이 반대)")
```
- **해결 방안 (수정 코드)**:
```python
is_positive: bool = Field(..., description="정적 요인 여부(부적 요인은 해석 방향이 반대)")
```

`Field(..., ...)`로 변경하면 필수 필드가 되어 누락 시 Pydantic 검증 오류가 발생합니다. 다만 이는 프론트와의 API 계약 변경이므로, 프론트가 항상 `is_positive`를 전송하는지 확인 후 적용해야 합니다. 기본값을 유지하면서 안전장치를 두려면 서비스 계층에서 `is_positive`가 명시적으로 전달됐는지 검증하는 방식도 고려할 수 있습니다.

2. **경계값 테스트 보강**

현재 테스트는 25, 63, 75 세 값만 검증합니다. 경계값(70, 60, 40, 30)에서의 방향 보정이 정확한지 추가 검증하면 좋습니다.

- **위치**: `agent/tests/test_school_record.py` `test_t_score_to_level_reverses_for_negative_factors` 함수
- **기존 코드**:
```python
assert t_score_to_level(25, is_positive=False) == "매우높음"  # 100-25=75
assert t_score_to_level(63, is_positive=False) == "낮음"  # 100-63=37
assert t_score_to_level(75, is_positive=False) == "매우낮음"  # 100-75=25
```
- **해결 방안 (수정 코드)**:
```python
assert t_score_to_level(25, is_positive=False) == "매우높음"  # 100-25=75
assert t_score_to_level(30, is_positive=False) == "매우높음"  # 100-30=70 (경계)
assert t_score_to_level(40, is_positive=False) == "높음"  # 100-40=60 (경계)
assert t_score_to_level(60, is_positive=False) == "보통"  # 100-60=40 (경계)
assert t_score_to_level(70, is_positive=False) == "낮음"  # 100-70=30 (경계)
assert t_score_to_level(63, is_positive=False) == "낮음"  # 100-63=37
assert t_score_to_level(75, is_positive=False) == "매우낮음"  # 100-75=25
```

경계값(30, 40, 60, 70)을 추가해도 기존 assert와 충돌하지 않으며, `t_score_to_level`의 분기 경계(`>=70`, `>=60`, `>=40`, `>=30`)를 정확히 검증합니다.

---

## 주요 파일 분석

### agent/app/core/school_record_policy.py

**변경 내용:**
`t_score_to_level`에 `is_positive` 파라미터를 추가하고 부적 요인에 대해 `100 - t_score`로 뒤집어 매핑.

**분석:**
```python
def t_score_to_level(t_score: float, is_positive: bool = True) -> str:
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
```

핵심 로직은 `effective = t_score if is_positive else (100 - t_score)` 한 줄입니다. 이 방식의 장점은:
- LLM이 38개 요인 각각의 심리학적 해석 방향을 스스로 추측하지 않아도 됩니다.
- 반환되는 레벨이 항상 "이 요인이 얼마나 긍정적으로 나타나는가"를 의미하므로 프롬프트 작성이 단순해집니다.
- 프론트엔드 `meritScore` 계산과 동일한 보정 방식을 사용하므로 방향 해석의 불일치가 없습니다.

### agent/app/services/school_record_service.py

**변경 내용:**
`_user_message`의 strengths/improvements 두 루프에서 `t_score_to_level(factor.t_score, factor.is_positive)`로 호출하도록 수정.

**분석:**
```python
if student.strengths:
    lines.append("\n# 검사 결과 — 강점 요인")
    for factor in student.strengths:
        lines.append(f"- {factor.name}: {t_score_to_level(factor.t_score, factor.is_positive)}")

if student.improvements:
    lines.append("\n# 검사 결과 — 성장이 기대되는 요인")
    lines.append(
        "(이 요인들은 부족한 점이 아니라, 스스로 조절하고 노력한 모습으로 서술할 대상입니다)"
    )
    for factor in student.improvements:
        lines.append(f"- {factor.name}: {t_score_to_level(factor.t_score, factor.is_positive)}")
```

두 호출부 모두 일관되게 `factor.is_positive`를 전달하고 있어 정확합니다. `strengths`와 `improvements` 모두 동일한 보정 로직을 적용하므로, 프론트가 방향을 반영해 분류한 버킷에 관계없이 레벨의 의미가 일관됩니다.

### agent/tests/test_school_record.py

**변경 내용:**
부적 요인 방향 보정 테스트 추가 및 기존 테스트 기대값 수정.

**분석:**
```python
def test_t_score_to_level_reverses_for_negative_factors():
    assert t_score_to_level(25, is_positive=False) == "매우높음"  # 100-25=75
    assert t_score_to_level(63, is_positive=False) == "낮음"  # 100-63=37
    assert t_score_to_level(75, is_positive=False) == "매우낮음"  # 100-75=25
    assert t_score_to_level(75) == t_score_to_level(75, is_positive=True)
```

기존 테스트 `test_user_message_hides_raw_tscore`에서 "시험불안: 높음"을 "시험불안: 낮음"으로 수정한 것은 실제 동작 변화를 정확히 반영한 것입니다. 시험불안(t_score=63.0, is_positive=False)은 `100-63=37`로 뒤집혀 "낮음"이 되는데, 이는 원점수가 높을수록(불안이 심할수록) 오히려 레벨은 낮게 나와야 맞다는 논리와 일치합니다.

---

## 최종 평가

**결론**: 
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**

부적 요인의 방향 보정을 프론트엔드와 동일한 방식으로 일관되게 적용하고, 하위 호환성과 테스트까지 잘 챙긴 견고한 변경입니다. `is_positive` 필수화와 경계값 테스트 보강은 선택적 개선 사항으로, 현재 상태로도 충분히 승인 가능한 수준입니다. 특히 README에 LLM의 어휘 연상 한계까지 솔직하게 기록한 점은 실무에서 중요한 문서화 습관으로 평가할 만합니다.