> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - bde9a29b

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`agent_service.py`** (other)

- 평균 복잡도: **0.233**

- 최대 복잡도: 0.464

- 청크 수: 6개

- 평균 사용처: 9.3곳


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 Meta Dashboard의 AI 에이전트 서비스(`agent/app/services/agent_service.py`)에 **Neo4j 그래프 데이터베이스 기반 Tool Calling 기능**을 추가하는 핵심 변경입니다. 기존에는 단순히 LLM에 질의-응답만 수행하던 에이전트가, 이제 LPA(학습자 특성) 유형별 조절/매개 경로 및 T-Score 평균을 Neo4j에서 조회하여 학생 맞춤형 피드백을 생성할 수 있도록 확장되었습니다.

- **목적**: AI 에이전트가 Neo4j 그래프 DB의 학습자 데이터를 Tool Calling으로 조회하여 데이터 기반 맞춤형 피드백을 제공
- **도메인**: 비즈니스 로직 (AI Agent Orchestration + Graph DB 연동)
- **변경 방향**: 단순 Chat Completion -> Tool Calling 기반 ReAct Agent 패턴으로 진화, 코드 중복 제거를 통한 유지보수성 향상

---

## [GOOD] 잘된 점

**1. `_build_messages` 메서드 분리로 DRY 원칙 준수**

`run_agent`와 `run_agent_stream`에서 공통으로 사용되던 메시지 구성 로직(히스토리 조회, PII 마스킹, 시스템 프롬프트 구성, 메시지 리스트 조립)을 별도 메서드로 추출했습니다. 이로 인해:

- 시스템 프롬프트 변경 시 한 곳만 수정하면 됩니다.
- 두 메서드 간의 코드 중복이 제거되어 유지보수성이 향상되었습니다.
- 향후 새로운 실행 모드(예: 배치 처리)가 추가되어도 `_build_messages`를 재사용할 수 있습니다.

**2. Tool Calling 루프의 명확한 구조화**

`run_agent` 메서드의 Tool Calling 루프는 다음과 같이 명확한 단계로 구성되어 있습니다:

1. LLM 호출 (`self.router.acompletion` with `tools=self.tools`)
2. 응답 메시지를 `messages` 리스트에 추가
3. Tool Call 여부 확인 (`getattr(response_message, "tool_calls", None)`)
4. Tool Call이 없으면 종료 (`break`)
5. Tool Call이 있으면 각 도구 실행 (`self.tool_map[func_name].ainvoke(arguments)`)
6. 실행 결과를 `messages`에 `"role": "tool"`로 추가
7. `max_iterations` 초과 시 강제 종료

이 구조는 ReAct Agent 패턴의 표준 구현을 따르며, 각 단계가 명확히 분리되어 있어 디버깅과 확장이 용이합니다.

**3. 스트리밍 모드에서의 Tool Call 버퍼링 처리**

`run_agent_stream`에서 스트리밍 청크로 분할되어 들어오는 Tool Call 정보를 `tool_call_buffer` 딕셔너리로 안전하게 조립하는 방식은 LiteLLM의 스트리밍 응답 특성을 잘 이해하고 구현한 점입니다. 특히 `index` 필드를 키로 사용하여 여러 Tool Call이 동시에 들어올 때도 각각을 독립적으로 조립할 수 있도록 설계되었습니다.

```python
tool_call_buffer = {}

for tc in delta.tool_calls:
    idx = getattr(tc, "index", 0)
    if idx not in tool_call_buffer:
        tool_call_buffer[idx] = {"id": "", "name": "", "arguments": ""}
    
    if getattr(tc, "id", None):
        tool_call_buffer[idx]["id"] += tc.id
    if getattr(tc, "function", None):
        if getattr(tc.function, "name", None):
            tool_call_buffer[idx]["name"] += tc.function.name
        if getattr(tc.function, "arguments", None):
            tool_call_buffer[idx]["arguments"] += tc.function.arguments
```

---

## 변경사항 요약

`agent/app/services/agent_service.py` 파일에서 다음과 같은 변경이 이루어졌습니다:

1. `_build_messages` 메서드 분리로 코드 중복 제거
2. `run_agent`에 Tool Calling 루프 추가 (최대 5회 반복)
3. `run_agent_stream`에 스트리밍 Tool Calling 지원 추가
4. Neo4j 그래프 도구 4종(`get_lpa_class_info`, `get_moderation_paths`, `get_mediation_paths`, `get_factor_scores`)을 OpenAI Tool 형식으로 변환하여 주입
5. 예외 처리 메시지 간소화

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

**없음**

명백한 버그, 보안 취약점, 데이터 손실 가능성은 발견되지 않았습니다.

### High (우선 수정 권장)

**1. `run_agent_stream`에서 예외 발생 시 히스토리 미저장**

`run_agent_stream`은 `async generator`로 동작합니다. 현재 구현에서 히스토리 저장은 Tool Call 없이 응답이 왔을 때만 수행됩니다:

```python
if not tool_call_buffer:
    final_content = content_buffer
    history.add_user_message(text)
    history.add_ai_message(final_content)
    break
```

하지만 다음과 같은 경우에는 히스토리가 저장되지 않습니다:

- **`max_iterations` 초과 시**: `yield "에이전트가 최대 허용 횟수 내에 답변을 완료하지 못했습니다."`만 수행되고 히스토리 저장 없음
- **예외 발생 시**: `yield f"Error: {str(e)}"`만 수행되고 히스토리 저장 없음

반면 `run_agent`는 예외 발생 후에도 항상 히스토리를 저장합니다:

```python
except Exception as e:
    logger.error(f"Unexpected error: {str(e)}", exc_info=True)
    answer = "예상치 못한 오류가 발생했습니다."

history.add_user_message(text)  # 항상 실행됨
history.add_ai_message(answer)  # 항상 실행됨
```

이 불일치로 인해 스트리밍 모드에서 오류 발생 시 사용자의 질문과 에러 응답이 세션에 기록되지 않아, 후속 대화에서 맥락이 누락됩니다. 사용자가 동일한 질문을 반복하면 에이전트는 이전 시도가 실패했다는 사실을 알 수 없습니다.

**수정 방안**: `run_agent_stream`의 `except` 블록과 `max_iterations` 초과 시에도 히스토리를 저장하도록 수정해야 합니다.

```python
if iterations >= self.max_iterations:
    error_msg = "에이전트가 최대 허용 횟수 내에 답변을 완료하지 못했습니다."
    history.add_user_message(text)
    history.add_ai_message(error_msg)
    yield error_msg
    
except Exception as e:
    logger.error(f"Streaming error in agent service: {str(e)}", exc_info=True)
    error_msg = f"Error: {str(e)}"
    history.add_user_message(text)
    history.add_ai_message(error_msg)
    yield error_msg
```

**2. `run_agent_stream`에서 Tool Call 이후 최종 응답의 히스토리 미저장**

`run_agent_stream`의 현재 로직 흐름을 추적해보면:

1. 첫 번째 LLM 호출 -> Tool Call 발생 -> `tool_call_buffer`에 데이터가 있음 -> `if not tool_call_buffer:` 조건을 통과하지 못함 -> Tool Call 실행 -> `iterations += 1` -> 루프 재진입
2. 두 번째 LLM 호출 -> Tool Call 없이 텍스트 응답만 옴 -> `tool_call_buffer`가 비어있음 -> `final_content = content_buffer` 할당 -> `history.add_user_message(text)`와 `history.add_ai_message(final_content)` 실행 -> `break`

이 흐름은 정상적으로 보이지만, **첫 번째 LLM 호출에서 텍스트와 Tool Call이 함께 오는 경우** 문제가 발생합니다. 이 경우 `content_buffer`에는 텍스트가 있고 `tool_call_buffer`에도 데이터가 있으므로, `if not tool_call_buffer:` 조건을 통과하지 못해 히스토리가 저장되지 않습니다. 이후 두 번째 루프에서 최종 응답이 와도, `history.add_ai_message(final_content)`는 실행되지만 `history.add_user_message(text)`는 첫 번째 루프에서 이미 실행되지 않았으므로 사용자 메시지가 누락됩니다.

**수정 방안**: 히스토리 저장 로직을 루프 외부로 분리하거나, 최종 응답 수신 시점을 명확히 판별할 수 있는 플래그를 도입해야 합니다.

### Medium (개선 권장)

**1. `run_agent`의 Tool Call 결과 메시지에 `name` 필드 누락**

`run_agent`에서 Tool Call 결과를 메시지에 추가할 때:

```python
messages.append({
    "role": "tool",
    "tool_call_id": tool_call.id,
    "name": func_name,  # 포함됨
    "content": result_str
})
```

Diff 상으로는 `name` 필드가 포함되어 있어 정상입니다. (초기 분석에서 착오가 있었습니다. 이 부분은 문제없습니다.)

**2. 예외 메시지가 지나치게 간소화됨**

이전 코드에서는 예외별로 사용자에게 구체적인 조치를 안내하는 메시지를 제공했습니다:

| 예외 유형 | 이전 메시지 | 현재 메시지 |
|---|---|---|
| AuthenticationError | "API 키 인증 오류가 발생했습니다. 관리자에게 문의하세요. (.env 파일의 API 키를 확인하십시오)" | "API 키 인증 오류가 발생했습니다. 관리자에게 문의하세요." |
| RateLimitError | "현재 요청이 많아 일시적으로 서비스 제한이 발생했습니다. 잠시 후 다시 시도해주세요." | "현재 요청이 많아 일시적으로 서비스 제한이 발생했습니다." |
| Timeout | "응답 시간이 초과되었습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요." | "응답 시간이 초과되었습니다." |
| APIError | "AI 서비스 연동 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." | "AI 서비스 연동 중 오류가 발생했습니다." |

사용자 경험 측면에서 이전 메시지가 더 유용합니다. 특히 `AuthenticationError`의 경우 `.env 파일 확인`이라는 구체적인 조치 방법을 알려주는 것이 중요합니다. 사용자가 API 키 문제를 인지하지 못하고 반복적으로 시도하는 상황을 방지할 수 있습니다.

**수정 방안**: 사용자에게 구체적인 조치 방법을 포함한 메시지로 복원하는 것을 검토합니다.

---

## 최종 평가

**결론**: 
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전체적인 아키텍처와 설계 방향은 매우 훌륭합니다. `_build_messages` 분리를 통한 DRY 원칙 준수, Tool Calling 루프의 명확한 구조화, 스트리밍 버퍼링 처리 등 기본적인 구현 품질이 높습니다. 특히 `neo4j_tools.py`의 도구들이 `@tool` 데코레이터와 명확한 docstring, 타입 힌트를 갖추고 있어 확장성과 가독성이 좋습니다.

다만 `run_agent_stream`에서 **Tool Call 이후 최종 응답의 히스토리 미저장**과 **예외 발생 시 히스토리 미저장**이라는 두 가지 High 이슈가 확인되었습니다. 이는 스트리밍 모드에서 세션 맥락이 손실되어 후속 대화 품질에 직접적인 영향을 미칠 수 있습니다. 특히 사용자가 동일한 질문을 반복할 때 에이전트가 이전 시도의 실패를 인지하지 못하는 상황이 발생할 수 있습니다.

이 두 이슈는 비교적 간단한 수정(히스토리 저장 로직 추가)으로 해결 가능하므로, 배포 전에 반드시 수정을 권장합니다. 수정 후에는 `run_agent`와 `run_agent_stream` 간의 일관성이 확보되어 더 안정적인 서비스 운영이 가능할 것입니다.