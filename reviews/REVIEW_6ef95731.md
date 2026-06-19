> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 6ef95731

## 코드 복잡도 분석

**분석된 파일**: 11개 / 변경된 파일: 13개


### 정상 범위 (NONE)


**`groupservice.java`** (other)

- 평균 복잡도: **0.137**

- 최대 복잡도: 0.471

- 청크 수: 7개

- 평균 사용처: 10.7곳


**권장사항:**

- 복잡도 정상 범위


**`personinfocachestoretest.java`** (store)

- 평균 복잡도: **0.006**

- 최대 복잡도: 0.009

- 청크 수: 4개


**권장사항:**

- Store 파일은 높은 연결도가 정상적임


**`groupservice.ts`** (other)

- 평균 복잡도: **0.006**

- 최대 복잡도: 0.013

- 청크 수: 49개


**권장사항:**

- 파일 크기가 큼 (49개 청크) - 파일 분리 검토


**`personinfoclientimpl.java`** (other)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.006

- 청크 수: 3개


**권장사항:**

- 복잡도 정상 범위


**`userinfoenricher.java`** (other)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.008

- 청크 수: 2개


**권장사항:**

- 복잡도 정상 범위


**`userinfoenrichertest.java`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.013

- 청크 수: 12개


**권장사항:**

- 복잡도 정상 범위


**`userslot.java`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.017

- 청크 수: 9개


**권장사항:**

- 복잡도 정상 범위


**`index.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.010

- 청크 수: 93개


**권장사항:**

- 파일 크기가 큼 (93개 청크) - 파일 분리 검토


**`userinfo.java`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.001

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`studentmanagementpanel.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.004

- 청크 수: 7개


**권장사항:**

- 복잡도 정상 범위


**`hasuserinfo.java`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.000

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 **그룹 멤버 리스트에서 학심정(meta-dashboard)에 SERVICE 동의하지 않은 사용자의 PII(이름/이메일) 노출을 차단**하기 위한 변경입니다. Auth(IDP)의 `/api/v1/users/batch` 응답에 `maskedReason` enum을 추가하고, 이를 enrich 체인(`UserInfo` -> `UserInfoEnricher` -> `HasUserInfo` 구현체 -> `GroupService`)을 통해 FE까지 전파하여, FE에서 미동의 사용자에 대해 이름/이메일 전체 마스킹 + 안내 툴팁을 표시하도록 합니다.

- **목적**: 미동의 사용자 PII 마스킹 및 사유별 UI 분기
- **도메인**: 백엔드 Auth enrich 로직 + 프론트엔드 UI
- **변경 방향**: Auth 응답의 `maskedReason`을 enrich 체인 전반에 걸쳐 투명하게 전파하고, FE에서 사유 기반 조건부 렌더링 수행

## [GOOD] 잘된 점

1. **end-to-end 데이터 전파 설계가 명확함**: `UserInfo` record -> `UserInfoEnricher` -> `HasUserInfo` 인터페이스 -> `UserSlot` -> `GroupService` -> FE API 타입 -> UI 컴포넌트로 이어지는 데이터 흐름이 단방향으로 깔끔하게 설계되어 추적이 용이합니다. 각 계층이 자신의 책임(파싱, 변환, 전파, 렌더링)만 수행하고 있어 관심사 분리가 잘 되어 있습니다.

2. **`HasUserInfo` 인터페이스에 `default` 메서드 활용**: `setMaskedReason`을 default no-op으로 선언하여, 기존 `HasUserInfo` 구현체(예: 다른 DTO)에 영향을 주지 않으면서 필요한 곳(`UserSlot`)만 override하는 확장 포인트 설계가 적절합니다. 이는 인터페이스 진화(interface evolution) 패턴의 좋은 예시입니다.

3. **설계 문서의 철저함**: `07-member-consent-masking.md` 문서는 배경, 문제 정의, 채널 분석(A: /batch enrich, B: RP Group API roster), 대안 검토(change feed vs /batch 실시간), 작업 분해까지 상세히 기술되어 있어, 이 변경의 의사결정 과정을 투명하게 공유하고 있습니다. 특히 "왜 provisioned/revoke 피드로 판단하지 않는가"에 대한 명확한 근거 제시가 인상적입니다.

## 변경사항 요약

- **백엔드**: `UserInfo` record에 `maskedReason` 필드 추가, `PersonInfoClientImpl`에서 Auth 응답 파싱 로직 수정, `UserInfoEnricher`/`UserSlot`/`GroupService`에 maskedReason 전파 로직 추가
- **프론트엔드**: `GroupMember` 타입에 `maskedReason` 추가, `StudentManagementPanel`에서 `NOT_CONSENTED` 분기 마스킹 UI 구현
- **문서**: 설계 문서(`07-member-consent-masking.md`) 및 Auth 팀 문의 문서(`batch-api-maskedreason-inquiry.html`) 추가

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `PersonInfoClientImpl`에서 `maskedReason` null 체크가 이중으로 중복됨**

`callBatchOnce()` 메서드와 `toUserInfo()` 메서드에서 동일한 패턴의 null 체크가 중복 사용되고 있습니다.

- **위치**: `PersonInfoClientImpl.java` L97, L157
- **기존 코드** (`callBatchOnce` 내, L96-L98):
  ```java
  String reason = (String) u.getOrDefault("maskedReason", "NONE");
  ...
  reason != null ? reason : "NONE"
  ```
- **기존 코드** (`toUserInfo` 내, L156-L158):
  ```java
  String reason = (String) data.getOrDefault("maskedReason", "NONE");
  ...
  reason != null ? reason : "NONE"
  ```
- **문제 분석**: `getOrDefault("maskedReason", "NONE")`는 맵에 키가 없으면 `"NONE"`을 반환합니다. 그런데 `(String)` 캐스팅 후 `reason != null ? reason : "NONE"` 삼항 연산자를 한 번 더 적용하고 있어, `getOrDefault`의 기본값이 무의미해집니다. 실제로 `(String) u.get("maskedReason")`가 null일 때 `"NONE"`으로 보정하려는 의도라면, `getOrDefault` 대신 `get`을 쓰고 삼항 연산자만 남기거나, 반대로 `getOrDefault`만 쓰고 삼항 연산자를 제거하는 것이 일관성 있고 가독성이 좋습니다.

  현재 코드는 `getOrDefault`가 `"NONE"`을 반환했는데도 삼항 연산자가 `"NONE" != null ? "NONE" : "NONE"`을 다시 평가하는 불필요한 연산을 수행합니다. 기능적으로는 문제가 없지만, 코드 리뷰 시 혼란을 줄 수 있고 유지보수성을 떨어뜨립니다.

- **해결 방안**: `getOrDefault`를 `get`으로 변경하여 의도를 명확히 합니다.

  ```java
  // callBatchOnce 내 (L96)
  String reason = (String) u.get("maskedReason");
  // toUserInfo 내 (L156)
  String reason = (String) data.get("maskedReason");
  // UserInfo 생성자 호출 시 (L102, L161)
  reason != null ? reason : "NONE"
  ```

  또는 반대로 `getOrDefault`만 사용하고 삼항 연산자를 제거하는 방법도 있습니다:
  ```java
  String reason = (String) u.getOrDefault("maskedReason", "NONE");
  // UserInfo 생성자 호출 시 reason을 그대로 사용
  ```

  두 방법 모두 기능적으로 동일하지만, 전자(`get` + 삼항 연산자)가 "키가 있지만 값이 null인 경우"와 "키가 아예 없는 경우"를 구분하지 않고 동일하게 `"NONE"`으로 처리한다는 의도를 더 명확히 전달합니다.

**2. `StudentManagementPanel.tsx`에서 `WITHDRAWN`/`NOT_FOUND` 사유에 대한 UI 처리가 누락됨**

`GroupMember.maskedReason` 타입은 `'NONE' | 'NOT_CONSENTED' | 'WITHDRAWN' | 'NOT_FOUND'`로 4가지 값을 가지지만, `MemberRow` 컴포넌트는 `NOT_CONSENTED`만 분기하고 있습니다.

- **위치**: `StudentManagementPanel.tsx` L85-L86
- **기존 코드**:
  ```tsx
  const consentPending = member.maskedReason === 'NOT_CONSENTED';
  ```
- **문제 분석**: `WITHDRAWN`(탈퇴)이나 `NOT_FOUND`(존재하지 않음)인 경우에도 `consentPending`이 `false`가 되어 일반 멤버처럼 `member.name`을 그대로 표시하게 됩니다. `WITHDRAWN`이나 `NOT_FOUND`인 멤버는 `name`이 `null` 또는 `"(탈퇴 회원)"`일 가능성이 높습니다. 현재 코드에서는 `consentPending`이 `false`이므로 `member.name`을 그대로 출력하는데, `name`이 `null`이면 빈 문자열(`''`)로 표시되거나 `"(탈퇴 회원)"`이 그대로 노출될 수 있습니다.

  구체적인 실행 경로를 추적해보면:
  - `maskedReason === 'WITHDRAWN'`인 멤버: `consentPending = false` -> `<p className="name">`에 `member.name` 출력 -> `member.name`이 `null`이면 `''`로 fallback(`groupService.ts` L147: `m.nickname ?? ''`) -> 빈 이름으로 표시됨
  - `maskedReason === 'NOT_FOUND'`인 멤버: 동일한 경로 -> `GroupService`에서 `"(탈퇴 회원)"`을 nicknameKey에 설정하므로 `"(탈퇴 회원)"`이 그대로 노출됨

  설계 문서(`07-member-consent-masking.md` §6)에 따르면 `WITHDRAWN`은 "별도 표기", `NOT_FOUND`는 "일반 placeholder"로 처리되어야 합니다.

- **해결 방안**: `maskedReason`이 `NONE`이 아닌 모든 경우에 대해 적절한 fallback 처리를 추가합니다.

  ```tsx
  const consentPending = member.maskedReason === 'NOT_CONSENTED';
  const isMasked = member.maskedReason && member.maskedReason !== 'NONE';
  
  // ...
  <p className="name" style={isMasked ? { color: '#9CA3AF' } : undefined}>
    {consentPending ? (
      <>
        {'****'}
        <span
          title={CONSENT_PENDING_TOOLTIP}
          aria-label={CONSENT_PENDING_TOOLTIP}
          style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 4, color: '#9CA3AF', cursor: 'help', verticalAlign: 'middle' }}
        >
          <Info size={13} />
        </span>
      </>
    ) : isMasked ? (
      '(탈퇴 회원)'
    ) : (
      member.name
    )}
    {!consentPending && !isMasked && member.memberType === 'guest' && (
      <span className="guest-badge">게스트</span>
    )}
  </p>
  {consentPending ? (
    <p className="email" style={{ color: '#9CA3AF' }}>****@****</p>
  ) : isMasked ? (
    <p className="email" style={{ color: '#9CA3AF' }}>-</p>
  ) : member.email && (
    <p className="email">{member.email}</p>
  )}
  ```

  이 수정은 `WITHDRAWN`/`NOT_FOUND` 상태의 멤버가 화면에 깨져 보이는 것을 방지하고, 설계 문서의 표시 사양과 일관성을 유지합니다.

### Medium (개선 권장)

**1. `groupService.ts`의 `toFrontendMember`에서 `maskedReason` 타입 캐스팅**

- **위치**: `groupService.ts` L148
- **기존 코드**:
  ```ts
  maskedReason: m.maskedReason as GroupMember['maskedReason'],
  ```
- **문제**: `BackendGroupMember.maskedReason`은 `string` 타입(optional)이고, `GroupMember.maskedReason`은 유니온 타입(`'NONE' | 'NOT_CONSENTED' | 'WITHDRAWN' | 'NOT_FOUND'`)입니다. `as` 캐스팅은 런타임 검증 없이 타입 단언만 하므로, 백엔드가 예상치 못한 값(예: 오타, 새로운 enum 값)을 보내면 타입 안전성이 깨집니다. 런타임에 유효한 값인지 검증하는 헬퍼 함수를 두거나, 타입 가드를 사용하는 것이 더 안전합니다.

  ```ts
  const VALID_MASKED_REASONS = ['NONE', 'NOT_CONSENTED', 'WITHDRAWN', 'NOT_FOUND'] as const;
  type MaskedReason = (typeof VALID_MASKED_REASONS)[number];
  
  const toMaskedReason = (reason?: string): MaskedReason | undefined => {
    if (reason && VALID_MASKED_REASONS.includes(reason as MaskedReason)) {
      return reason as MaskedReason;
    }
    return undefined;
  };
  
  // 사용
  maskedReason: toMaskedReason(m.maskedReason),
  ```

  이렇게 하면 백엔드가 예상치 못한 값을 보내도 `undefined`로 안전하게 fallback되어, 타입 안전성과 런타임 안정성을 모두 확보할 수 있습니다.

**2. `PersonInfoClientImpl.callBatchOnce()`에서 3가지 경로 처리의 복잡도**

`callBatchOnce` 메서드는 3가지 경로(정상 users, notFound, 응답 누락)를 모두 처리하고 있습니다. 각 경로의 의미와 maskedReason 설정을 주석으로 명시하면 유지보수에 도움이 됩니다.

- **위치**: `PersonInfoClientImpl.java` L85-L108
- **제안**: 각 블록에 간단한 주석 추가
  ```java
  // 1) 정상 응답 users — Auth가 PII와 maskedReason을 함께 내려줌
  users.forEach(u -> { ... });
  
  // 2) notFound — 진짜 없는 사용자 (hard purge / 잘못된 id)
  notFound.forEach(id -> map.put(id, UserInfo.placeholder(id)));
  
  // 3) 응답에 아예 없는 경우 — fallback (네트워크 오류 등)
  chunk.forEach(id -> map.putIfAbsent(id, UserInfo.placeholder(id)));
  ```

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**:
전체적인 아키텍처와 데이터 흐름 설계는 매우 잘 되어 있습니다. `HasUserInfo` 인터페이스의 default 메서드 활용, end-to-end 데이터 전파 설계, 철저한 설계 문서화는 높은 수준의 엔지니어링 품질을 보여줍니다. 다만 **High 이슈 2건**은 실제 운영 환경에서 버그로 이어질 가능성이 있어 수정을 권장합니다.

첫 번째 이슈(`getOrDefault` + 삼항 연산자 이중 null 체크)는 기능적으로는 문제가 없지만, 코드 리뷰 시 혼란을 주고 유지보수성을 떨어뜨립니다. 두 번째 이슈(FE에서 `WITHDRAWN`/`NOT_FOUND` 사유 미처리)는 `WITHDRAWN`/`NOT_FOUND` 상태의 멤버가 화면에 빈 이름이나 `"(탈퇴 회원)"`이 그대로 노출되는 실제 버그로 이어질 수 있습니다. 이 두 이슈를 해결한 후 승인하는 것이 좋겠습니다.