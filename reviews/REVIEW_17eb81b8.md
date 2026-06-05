> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

## 코드 복잡도 분석

**분석된 파일**: 8개 / 변경된 파일: 8개


### 정상 범위 (NONE)


**`groupquerymapper.xml`** (other)

- 평균 복잡도: **0.239**

- 최대 복잡도: 0.471

- 청크 수: 2개

- 평균 사용처: 7.0곳


**권장사항:**

- 복잡도 정상 범위


**`groupcontroller.java`** (other)

- 평균 복잡도: **0.205**

- 최대 복잡도: 0.467

- 청크 수: 23개

- 평균 사용처: 24.8곳


**권장사항:**

- 파일 크기가 큼 (23개 청크) - 파일 분리 검토


**`globalexceptionhandler.java`** (config)

- 평균 복잡도: **0.196**

- 최대 복잡도: 0.466

- 청크 수: 12개

- 평균 사용처: 20.9곳


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`groupservice.java`** (other)

- 평균 복잡도: **0.160**

- 최대 복잡도: 0.471

- 청크 수: 6개

- 평균 사용처: 12.5곳


**권장사항:**

- 복잡도 정상 범위


**`groupquerymapper.java`** (other)

- 평균 복잡도: **0.144**

- 최대 복잡도: 0.461

- 청크 수: 16개

- 평균 사용처: 11.2곳


**권장사항:**

- 복잡도 정상 범위


**`client.ts`** (other)

- 평균 복잡도: **0.087**

- 최대 복잡도: 0.473

- 청크 수: 31개

- 평균 사용처: 3.0곳


**권장사항:**

- 파일 크기가 큼 (31개 청크) - 파일 분리 검토


**`sseemitterregistry.java`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.009

- 청크 수: 6개


**권장사항:**

- 복잡도 정상 범위


**`authclient.ts`** (utility)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.008

- 청크 수: 10개


**권장사항:**

- 복잡도 정상 범위


---

다음은 커밋 `17eb81b8a2a452ae813f6d439b5f34b67a5420d0`에 대한 코드 리뷰 최종 결과입니다.

---

# 코드 리뷰 — 17eb81b8

## [GOOD] 잘된 점

- **SSE 예외 처리 체계화**: `IllegalStateException`과 `IOException`을 명시적으로 catch하고, 클라이언트 끊김(Connection reset, Broken pipe)과 진짜 서버 I/O 에러를 구분하여 각각 WARN/ERROR로 로깅 레벨을 달리한 설계가 적절합니다. 죽은 emitter 정리(`completeWithError` -> `onError` -> `remove`) 흐름도 일관성 있습니다.
- **쿠키 기반 인증 전환 보안 강화**: `tokenStorage: 'cookie'`로 전환하고 `withCredentials: true`를 설정하여 XSS로 인한 access token 탈취를 방지한 점이 우수합니다.
- **includeInactive 하위 호환성 유지**: 그룹 목록 API에 새로운 파라미터를 추가하면서 `defaultValue = "false"`로 기존 동작을 그대로 유지한 점, MyBatis XML에서 `<if test="!includeInactive">` 조건문으로 SQL 동적 제어한 점이 견고합니다.

## 변경사항 요약

vs-develop 브랜치의 5개 개별 커밋(SSE 안정화/예외 처리 개선, 그룹 API includeInactive 기능, 프론트엔드 인증 토큰 저장소를 쿠키로 전환)을 feature/frontend_notification 브랜치로 병합. 총 8개 파일, 79줄 추가, 13줄 삭제.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

**1. withCredentials와 Authorization 헤더 이중 설정**

- **파일**: `frontend/src/shared/api/client.ts` (라인 39, 77-80)
- **내용**: `withCredentials: true`와 함께 요청 인터셉터에서 `Authorization: Bearer ${token}` 헤더를 함께 전송하고 있습니다. 쿠키 인증과 Bearer 토큰 인증이 혼용되고 있어, 추후 SDK가 완전히 쿠키로 전환된 후에는 불필요한 Authorization 헤더 전송으로 혼란을 줄 수 있습니다.
- **제안**: 이는 의도된 과도기적 설정일 수 있으나, `tokenStorage: 'cookie'` 전환이 완료되는 시점에 Authorization 헤더 주입 로직을 제거하거나 조건부로 설정하는 TODO 주석을 남기는 것을 권장합니다.

---

## 주요 파일 분석

### SseEmitterRegistry.java

**변경 내용**: SSE 전송 실패 시 `IllegalStateException`을 추가로 catch하고, heartbeat 전송 시 죽은 emitter를 즉시 정리하는 로직으로 개선.

**개선 제안**:
`broadcastHeartbeat()`에서 실패한 emitter를 즉시 `completeWithError`로 정리하는 방식은 좋습니다. 다만 현재 `sendTo()` 메서드에서는 같은 사용자에게 여러 emitter가 있을 때 순회 중에 emitter 리스트가 수정될 수 있는데, `CopyOnWriteArrayList`를 사용하고 있어 안전합니다.

### GlobalExceptionHandler.java

**변경 내용**: `ClientAbortException`을 WARN 레벨로 변경하고, `IOException` 핸들러를 추가하여 클라이언트 끊김(Connection reset, Broken pipe)과 서버 I/O 에러를 구분 처리.

**개선 제안**: 없음. 예외 메시지 기반 분기 로직(`msg.contains(...)`)은 간결하고 실용적입니다. 다만 `IOException`의 구체적인 하위 클래스(`SocketException` 등)가 추가로 식별 가능하지만, 현재 수준에서 충분합니다.

### GroupController / GroupService / GroupQueryMapper / XML

**변경 내용**: `/group/list` 엔드포인트에 `includeInactive` 파라미터를 추가하여 LEFT/KICKED/ARCHIVED 상태의 그룹도 조회 가능하도록 확장.

**개선 제안**: 없음. `Boolean.parseBoolean(String.valueOf(...))` 패턴은 HTTP 요청 파라미터를 안전하게 boolean으로 변환하는 적절한 방법입니다. SQL 동적 쿼리도 기존 인덱스 활용에 영향을 주지 않도록 설계되었습니다.

### client.ts / authClient.ts

**변경 내용**:
- `client.ts`: axios 인스턴스에 `withCredentials: true` 추가
- `authClient.ts`: `tokenStorage: 'cookie'`로 전환

**개선 제안**:

**파일**: `frontend/src/shared/api/client.ts` (라인 77-80)
**기존 코드**:
```typescript
const auth = getAuth();
const token = auth.getAccessToken();
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```
**권장 수정 코드** (추후 정리 시):
```typescript
// TODO: 쿠키 인증 전환 완료 후 Authorization 헤더 주입 로직 제거 예정
const auth = getAuth();
const token = auth.getAccessToken();
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

---

## 최종 평가

**결론**:
- [X] **승인 (Approved)** — Critical/High 이슈 없음

**종합 의견**: 이번 Merge 커밋은 SSE 알림 시스템의 안정성을 실질적으로 개선하고, 쿠키 기반 인증으로 보안을 강화하는 방향성 있는 변경입니다. 모든 수정 사항이 명확한 문제 인식에서 출발했으며, 하위 호환성을 유지하면서 점진적으로 개선하고 있습니다. withCredentials와 Authorization 헤더 이중 설정은 전환 과도기로 이해되며, 이후 정리 시점에 리팩토링 TODO만 남겨두면 충분합니다. Merge 승인합니다.