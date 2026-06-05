> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 25f812d6

## 코드 복잡도 분석

**분석된 파일**: 2개 / 변경된 파일: 4개


### 정상 범위 (NONE)


**`client.ts`** (other)

- 평균 복잡도: **0.082**

- 최대 복잡도: 0.473

- 청크 수: 33개

- 평균 사용처: 2.8곳


**권장사항:**

- 파일 크기가 큼 (33개 청크) - 파일 분리 검토


**`qchlogger.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.006

- 청크 수: 12개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 프론트엔드에서 발생하는 모든 API 호출에 대해 QCH(Query/Click History) 로그 적재 시스템을 도입하기 위한 변경입니다. 기존에는 API 호출에 대한 로깅 인프라가 전혀 없어 장애 추적과 사용자 행동 분석이 어려웠습니다.

- **목적**: API 호출 성공/실패 시점의 메타데이터(지연시간, 상태코드, 에러메시지)를 외부 로그 수집 시스템(QCH)에 적재하여 모니터링 및 디버깅 기반 마련
- **도메인**: API 클라이언트 인프라 (로깅/모니터링)
- **변경 방향**: Axios 인터셉터에 QCH 로깅 훅을 추가하고, fire-and-forget 방식의 독립적인 fetch 기반 로거를 신규 작성하여 기존 API 클라이언트와의 순환 참조를 차단

---

## [GOOD] 잘된 점

**1. 순환 참조 차단 설계**

`logApiEvent` 함수가 axios가 아닌 raw `fetch`를 사용하여, QCH 로깅 자체가 다시 axios 인터셉터를 트리거하는 순환 참조를 원천 차단한 점이 매우 적절합니다. `qchLogger.ts`의 상단 주석에도 이 의도가 명확히 문서화되어 있습니다.

```typescript
// raw fetch 사용 (apiClient 재귀 차단)
// fire-and-forget + 500ms timeout
// 실패해도 앱 흐름에 영향 없음 (swallow)
```

**2. Fire-and-forget + 타임아웃**

`AbortController`로 500ms 타임아웃을 걸고 `.catch(() => undefined)`로 모든 실패를 무시(silent swallow)하여, 로깅 실패가 메인 API 호출 흐름에 전혀 영향을 주지 않도록 설계된 점이 견고합니다.

```typescript
const controller = new AbortController();
const timer = window.setTimeout(() => controller.abort(), 500);

void fetch(`${baseUrl}/api/v1/ingest/app-log`, {
  method: 'POST',
  headers,
  body: JSON.stringify(payload),
  signal: controller.signal,
})
  .catch(() => undefined)
  .finally(() => window.clearTimeout(timer));
```

**3. 민감정보 자동 Redaction**

`authorization`, `token`, `password`, `secret` 등 민감 키를 재귀적으로 `[REDACTED]` 처리하는 `redact()` 함수를 payload 전송 전에 적용하여 보안을 고려했습니다. 중첩 객체까지 재귀 탐색하므로 실수로 민감정보가 로그에 노출될 위험을 줄였습니다.

```typescript
const REDACT_KEYS = ['authorization', 'cookie', 'password', 'token', 'secret'];

function redact(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const key = k.toLowerCase();
    if (REDACT_KEYS.some((r) => key.includes(r))) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = redact(v);
    }
  }
  return out;
}
```

**4. 환경변수 기반 Feature Flag**

`VITE_ENABLE_QCH_LOGGING=true`로 로깅 활성화를 제어할 수 있어, 개발/운영 환경에서 유연하게 on/off 가능합니다. 또한 `VITE_QCH_BASE_URL`, `VITE_QCH_SERVICE_KEY`, `VITE_QCH_ENV`를 별도로 분리하여 환경별로 다른 QCH 서버를 바라볼 수 있습니다.

---

## 변경사항 요약

- `.env.development` / `.env.production`에 QCH 관련 환경변수 4종(`VITE_ENABLE_QCH_LOGGING`, `VITE_QCH_BASE_URL`, `VITE_QCH_SERVICE_KEY`, `VITE_QCH_ENV`) 추가
- `client.ts`의 요청 인터셉터에 QCH clientCallId 생성 및 `X-QCH-*` 헤더 주입 로직 추가
- `client.ts`의 응답 성공 인터셉터에 `I_API_CALL_OK` 코드의 INFO 로그 전송 로직 추가
- `client.ts`의 응답 실패 인터셉터에 `E_API_NETWORK` 또는 `E_API_CALL_FAIL` 코드의 ERROR 로그 전송 로직 추가
- `qchLogger.ts` 신규 생성: `createClientCallId`, `buildQchRequestHeaders`, `logApiEvent` 세 가지 함수 구현

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. 응답 실패 인터셉터에서 `error.config`가 `undefined`일 가능성**

- **위치**: `frontend/src/shared/api/client.ts`, 라인 157-160
- **기존 코드**:
```typescript
const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
...
const qch = originalRequest._qch;
```

- **문제 분석**: Axios의 `error` 객체는 네트워크 에러(예: CORS 오류, DNS 조회 실패, 네트워크 단절) 시 `config` 속성이 누락된 경우가 실제로 보고됩니다. 이 경우 `originalRequest`가 `undefined`가 되어 `originalRequest._qch` 접근 시 `TypeError: Cannot read properties of undefined`가 발생합니다. 더 큰 문제는 이 `TypeError`가 `try/catch`로 감싸져 있지 않아, 이후 `Promise.reject(new ApiError(status, message, resultCode))`까지 도달하지 못한다는 점입니다. 즉, 네트워크 에러 상황에서 정작 에러 핸들링이 실패하는 역설이 발생합니다.

- **해결 방안**:
```typescript
const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; _qch?: { clientCallId: string; startedAt: number } }) | undefined;
const qch = originalConfig?._qch;
```

이후 `if (qch)` 블록은 이미 존재하므로, `originalRequest` 변수명을 `originalConfig`로 변경하고 옵셔널 체이닝(`?.`)만 추가하면 됩니다. `_retry` 접근도 `originalConfig?._retry`로 변경해야 합니다.

**2. `getOrCreateTraceId()`가 `buildQchRequestHeaders`와 `logApiEvent`에서 중복 호출됨**

- **위치**: `frontend/src/shared/logging/qchLogger.ts`, 라인 97 및 라인 109
- **문제**: 요청 인터셉터에서 `buildQchRequestHeaders(clientCallId)`를 호출할 때 이미 `getOrCreateTraceId()`가 실행되어 `X-QCH-Trace-Id` 헤더가 생성됩니다. 그런데 `logApiEvent()` 함수 내부에서도 `getOrCreateTraceId()`를 다시 호출합니다. 동일 세션에서는 같은 traceId를 반환하므로 기능상 문제는 없지만, 요청 시점의 traceId를 로깅 시점에도 재사용하는 것이 개념적으로 더 일관성 있습니다.

- **해결 방안 (선택 사항)**: `config._qch`에 `traceId` 필드를 추가하여 `buildQchRequestHeaders`에서 생성한 traceId를 저장하고, `logApiEvent`에서 이를 재사용하는 구조로 변경할 수 있습니다. 현재 구조도 동작에는 문제가 없으므로 Medium 수준의 제안입니다.

### Medium (개선 권장)

**1. `encodeURIComponent`로 intent 값 인코딩 시 백엔드 디코딩 규약 필요**

- **위치**: `frontend/src/shared/logging/qchLogger.ts`, 라인 115
- **내용**: `headers['X-QCH-Intent'] = encodeURIComponent(event.intent)`에서 `encodeURIComponent`는 `%ED%...` 형태로 인코딩합니다. HTTP 헤더 값은 ASCII가 기본이므로 인코딩 자체는 합리적이나, 백엔드에서 이 값을 사용할 때 `decodeURIComponent`를 호출해야 원래 값을 얻을 수 있습니다. 백엔드와의 인터페이스 규약이 명확히 정의되어 있다면 문제없으나, 코드만 봐서는 이 인코딩 규약이 백엔드에 전달되었는지 확인이 어렵습니다. 주석이나 API 문서에 이 규약을 명시하는 것을 권장합니다.

**2. QCH 로깅 코드가 인터셉터 로직과 강하게 결합됨**

- **위치**: `frontend/src/shared/api/client.ts`, 라인 100-104 (요청), 라인 120-133 (성공 응답), 라인 160-183 (실패 응답)
- **내용**: QCH 로깅 코드가 Axios 인터셉터 콜백 내부에 인라인으로 직접 작성되어 있습니다. 로깅 로직이 복잡해지거나 다른 로깅 채널이 추가될 경우 인터셉터가 비대해질 수 있습니다. 별도의 `qchRequestInterceptor`, `qchResponseInterceptor` 함수를 만들어 `axiosInstance.interceptors.request.use(qchRequestInterceptor)` 형태로 분리하면 유지보수성이 향상됩니다. 현재 규모에서는 과도한 추상화일 수 있으므로, 향후 로깅 요구사항이 확장될 때 리팩토링을 고려하세요.

---

## 주요 파일 분석

### `frontend/src/shared/logging/qchLogger.ts` (신규 파일)

**변경 내용:**
QCH 로그 적재를 위한 전용 유틸리티 모듈 신규 생성. `createClientCallId`, `buildQchRequestHeaders`, `logApiEvent` 세 가지 함수를 제공.

**핵심 설계 분석:**

1. **`createClientCallId()`**: `crypto.randomUUID()`를 우선 사용하고, fallback으로 `Date.now() + Math.random()` 조합을 사용합니다. 각 API 호출을 고유하게 식별하는 clientCallId를 생성합니다.

2. **`getOrCreateTraceId()`**: `sessionStorage`에 traceId를 저장하여 브라우저 세션 동안 유지합니다. `sessionStorage` 접근 실패 시에도 fallback을 제공하여 견고성을 확보했습니다. 다만 catch 블록에서 생성된 ID가 `sess-` prefix 없이 생성되어 포맷 일관성이 깨집니다.

3. **`buildQchRequestHeaders()`**: 백엔드 API 호출 시 첨부할 `X-QCH-Trace-Id`, `X-QCH-Action-Id`, `X-QCH-Client-Call-Id` 헤더를 생성합니다. 이를 통해 백엔드에서도 동일한 traceId로 로그를 연계할 수 있습니다.

4. **`logApiEvent()`**: 환경변수로 활성화 여부와 endpoint를 제어합니다. `fire-and-forget` 패턴으로 500ms 타임아웃을 적용하여 메인 로직에 영향을 주지 않습니다. `redact()` 함수로 민감정보를 자동 마스킹합니다.

### `frontend/src/shared/api/client.ts` (수정 파일)

**변경 내용:**
요청 인터셉터에 QCH clientCallId 생성 및 헤더 주입 로직 추가. 응답 성공/실패 인터셉터에 각각 `logApiEvent` 호출 추가.

**핵심 설계 분석:**

1. **요청 인터셉터 (라인 97-104)**: `createClientCallId()`로 고유 ID 생성, `performance.now()`로 시작 시각 기록, `buildQchRequestHeaders()`로 백엔드 전달용 헤더 생성. 이 세 정보를 `config._qch`에 저장하여 응답 인터셉터에서 재사용합니다.

2. **응답 성공 인터셉터 (라인 120-133)**: `config._qch`에서 clientCallId와 시작 시각을 꺼내 `performance.now() - startedAt`으로 실제 지연시간을 계산합니다. `I_API_CALL_OK` 코드로 INFO 로그를 전송합니다.

3. **응답 실패 인터셉터 (라인 160-183)**: 네트워크 에러와 HTTP 에러를 구분하여 각각 `E_API_NETWORK` / `E_API_CALL_FAIL` 코드로 ERROR 로그를 전송합니다. `errorMessage` 필드에 실제 에러 메시지를 포함하여 디버깅에 활용할 수 있도록 했습니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전반적으로 QCH 로깅 도입을 위한 설계가 견고하고 실용적입니다. 특히 raw fetch 사용으로 순환 참조를 차단하고, fire-and-forget + 타임아웃으로 메인 로직에 영향을 주지 않도록 한 점, 민감정보 redaction을 적용한 점 등이 돋보입니다.

다만 **응답 실패 인터셉터에서 `error.config`가 `undefined`일 경우 `TypeError`가 발생하여 에러 전파 자체가 깨질 수 있는 위험**이 있습니다. 이는 네트워크 에러 상황에서 정작 에러 핸들링이 실패하는 역설을 초래할 수 있습니다. `error.config`에 옵셔널 체이닝(`?.`)을 추가하여 이 문제를 수정한 후 승인을 권장합니다.

위 High 이슈 1번만 수정되면, 나머지는 코드 품질 향상을 위한 선택적 제안에 불과하므로 즉시 머지 가능한 상태가 됩니다.