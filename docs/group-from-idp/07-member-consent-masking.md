# Group from IDP — 07. 미동의 사용자 PII 마스킹 설계 (그룹 멤버/오너)

> 작성일: 2026-06-18 · 대상: **superplatform-auth(IDP)** + **학심정(meta-dashboard, RP)**
> 스코프: **그룹 멤버 리스트(+그룹 오너) 표시에서, 학심정에 SERVICE 동의하지 않은 사용자의 이름/이메일 노출 차단.**

---

## 0. 배경 & 문제

- 학심정은 그룹/멤버를 Auth에서 동기화하고, **표시 시점에 이름/이메일을 `/batch`로 enrich**한다(학심정 DB는 PII 미저장).
- 현재 **`UserInfoEnricher`는 동의 여부와 무관하게 전원 name/email을 채운다** → 교사 그룹 멤버 리스트에 **학심정 미동의 멤버의 PII가 그대로 노출**.
- 추가로 **RP Group API 응답(`RpMemberResponse`)에 멤버 `name`이 포함**되어, 동기화 경로로도 이름이 내려온다(현재 알림 문구 일회성 사용).
- 정보보안셀 기준: **평문 PII를 RP DB에 저장하는 게 아니면 마스킹으로 충분**. 학심정은 PII 비저장이므로 **표시 마스킹**이면 요건 충족.

### 왜 provisioned / revoke 피드로 판단하지 않는가
- `provisioned` 컬럼: 동기화 선제생성 마커. **첫 로그인 시 Y→N로, 비실시간** — "지금 이 사용자가 동의했나"의 권위 소스가 아님.
- REVOCATION 폴링: 연결끊기/탈퇴 cascade용. 동의 *상태*를 실시간 반영하는 신호가 아님.
- → **두 기능은 기존 용도로 유지**하되, **마스킹 판단의 신호로는 쓰지 않는다.**

---

## 1. 설계 원칙

1. **노출 규칙**: 학심정 화면에 나타나는 사용자(그룹 멤버·오너)의 **이름/이메일은 그 사용자가 학심정 SERVICE 동의를 가졌을 때만** 노출. 미동의 → 마스킹.
2. **권위 소스**: Auth `user_service_consent` — `existsByUserIdAndClientIdAndAgreementType(userId, 학심정clientId, SERVICE, active)`. (철회자는 미동의 취급)
3. **계산 시점 = serve 시점(실시간)**: Auth가 데이터를 내려줄 때 호출 RP(`clientId`) 기준으로 계산. 학심정에 저장된 플래그로 판단하지 않는다(아래 §4).
4. **그룹 속성 ≠ 개인 PII**: 그룹명/학교/학년/반/과목/초대코드는 개인 PII가 아니므로 **항상 동기화·표시**. 마스킹 대상은 **사람의 이름/이메일**뿐.

---

## 2. PII가 학심정으로 가는 채널 (2개) — 둘 다 동의 기준 적용

| 채널 | 무엇 | 시점 | 처리 |
|---|---|---|---|
| **A. `/batch` (표시 enrich)** | name/email | **표시 시점(실시간)** | 호출 RP 미동의 사용자는 **null/placeholder** 반환 → 표시 마스킹의 **1차·실시간 방어선** |
| **B. RP Group API roster (`RpMemberResponse.name`)** | name | 동기화 시점 | 미동의 멤버는 **`name=null`** + `consented` 플래그 → 알림 문구 누출 방지 + 동기화 신호 제공 |

> **핵심**: 교사가 화면에서 보는 이름은 **채널 A(`/batch`)** 에서 온다. 그래서 **표시 마스킹의 권위·실시간 보장은 채널 A가 책임진다.** 채널 B는 동기화/알림 경로 보호용.

---

## 3. Auth(IDP) 변경

### 3.1 `/batch` (사용자 조회) — 동의 필터 + 마스킹 사유 enum (표시 마스킹·툴팁의 핵심)
- `POST /api/v1/users/batch` (학심정 service token, client=학심정).
- **호출 RP에 SERVICE 동의하지 않은 publicUserId는 name/email을 null로 반환** + **마스킹 사유 enum `maskedReason`** 을 같이 내려줌.
- 토큰에서 호출 client_id를 알 수 있으므로 RP별 동의 계산 가능.

**`maskedReason` enum (확장 가능):**

| 값 | 의미 | name/email | FE 처리 |
|---|---|---|---|
| `NONE` (또는 필드 없음) | 정상 (동의 회원) | 실제값 | 그대로 표시 |
| `NOT_CONSENTED` | 학심정 미동의(미연동) | null | 전체 마스킹 + **(i) 툴팁**(§6) |
| `WITHDRAWN` | 탈퇴 회원 | null | "(탈퇴 회원)" 표기 |
| `NOT_FOUND` | 조회 실패/미존재 | null | 일반 placeholder |

- 효과: 학심정 표시 이름은 **항상 실시간 정확**(동의 변화 즉시 반영, staleness 없음). **`maskedReason`으로 미동의/탈퇴/오류를 구분**해 각기 다른 표시(툴팁 등) 가능. 향후 사유 추가도 enum 확장으로 흡수.

### 3.2 RP Group API — `RpMemberResponse` 동의 반영
- `RpMemberResponse`에 **`consented`(boolean)** 추가 — 멤버별 `existsByUserIdAndClientIdAndAgreementType(userId, clientId, SERVICE, active)`.
- **미동의 멤버는 `name=null`** 로 내려줌(roster에서도 이름 미제공).
- 적용 지점: `RpGroupService.listGroups`(스냅샷, L107 부근) + `getGroup`(단건, L255 부근) — `clientId`는 이미 보유(감사로그 기록 중).
- 멤버 일괄 동의 조회는 N+1 피하게 **배치 조회**(userId 목록 → 동의 보유 set) 권장.

### 3.3 그룹 오너(교사)가 학심정 미동의인 경우 ← 질문 ①
- **그룹 자체는 항상 동기화**한다 — 그룹 속성은 개인 PII가 아니고, **동의한 학생 멤버가 검사에 그룹을 써야** 하므로 오너 동의와 무관하게 제공.
- **오너의 이름**만 동의 게이트: `ownerPublicUserId`는 그대로 주되, 학심정이 오너 이름을 표시할 때는 **채널 A(`/batch`) 동의 필터**로 자동 마스킹됨.
- (선택) 일관성을 위해 `RpGroupResponse`에 **`ownerConsented`** 플래그 추가 가능 — 다만 오너 이름 표시 마스킹은 `/batch`가 이미 커버하므로 필수는 아님.
- 정리: **그룹 레코드 = 항상 / 오너 이름 = 동의 시만.**

### 3.4 동의 상태 placeholder 구분 (표시 문구)
- `/batch`가 미제공 시 학심정 enricher는 `UserInfo.placeholder`("(탈퇴 회원)")를 쓴다.
- **미동의(아직 연동 안 함)** 와 **탈퇴**는 표시 의미가 다르므로, `/batch` 응답에 사유 구분(예: `maskedReason: NOT_CONSENTED | WITHDRAWN`) 또는 학심정 표시값 분리 검토. (§6 표시값 결정)

---

## 4. 학심정(RP) 변경

### 4.1 표시 마스킹 + 툴팁 — `/batch` 결과 신뢰 + `maskedReason` 전파
- Auth `/batch`가 미동의자 name/email을 null로 주면, **`UserInfoEnricher`가 자연 마스킹**.
- **`maskedReason`(enum)을 enrich 대상(`HasUserInfo`/멤버 DTO)에 전파** → 그룹 멤버 DTO에 노출 → FE가 사유별 표시 판단.
- **그룹상세 학생 리스트(StudentManagementPanel)**: `maskedReason == NOT_CONSENTED` 멤버는
  - **이름·이메일 전체 마스킹**(부분마스킹 X)
  - 옆에 **(i) 툴팁** 노출 — 문구는 §6 고정.
  - (`WITHDRAWN`/`NOT_FOUND`는 각기 다른 표기 — 툴팁 대상 아님)

### 4.2 roster 동의 신호 수신 (동기화 경로)
- `RpMemberDto`에 **`consented`** 추가, `RpGroupClient.parseGroup`에서 파싱.
- **`name=null`** 로 오면 합류 알림(`StudentJoinedGroupEvent`) 문구에서 이름 누출 안 됨(기존 "name은 알림 일회성" 정책과 정합).
- **저장 정책**: `consented`를 group_member에 영속화할지는 **선택**. 영속화하더라도 **마스킹 권위로 쓰지 않는다**(§5 staleness). 통계/비표시 로직 용도에 한해.

### 4.3 그룹/오너
- 그룹은 항상 수신·표시. 오너 이름은 §4.1로 자동 마스킹.

---

## 5. change log 폴링과의 결합 ← 질문 ②

### 핵심 판단
- 변경 피드(`GET /api/v1/rp/groups/changes`)의 changeType은 **구조 변경**뿐: `GROUP_CREATE/UPDATE/DELETE`, `MEMBER_ADD/REMOVE`.
- **동의/철회(consent grant/revoke)는 구조 변경이 아니라 피드에 들어오지 않는다.**
- 따라서 **"동의 플래그를 동기화로 받아 저장 → 그걸로 마스킹"은 stale** 해진다(멤버가 나중에 동의/철회해도 그룹/멤버 구조가 안 바뀌면 재조회 트리거가 없음 → 다음 일일 재동기화까지 옛 값).

### 결론 — 폴링은 그대로, 마스킹은 표시 시점으로
1. **change 피드 폴링은 현행 유지** — 구조 변경(그룹/멤버 add/remove)만 처리. **CONSENT 이벤트 타입 추가 불필요.**
2. **표시 마스킹은 §3.1 `/batch`(표시 시점 실시간)** 가 책임 → 동의 변화가 **다음 화면 로드에 즉시 반영**(폴링 주기와 무관).
3. roster의 `consented`/`name=null`은 **serve 시점 실시간**이라 그 순간 정확. 학심정이 저장하면 다음 동기화까지 stale하므로 **마스킹 권위로 쓰지 않음**.
4. **일일 전체 재동기화**(기존)는 저장 플래그(저장한다면)와 roster name의 **정합성 보정 안전망**으로 그대로 동작.

> 한 줄: **동의 상태는 "동기화로 끌어와 저장"하지 말고, 데이터 줄 때마다 Auth가 실시간 계산해 반영**(roster serve + /batch). change 피드는 구조 변경 전용으로 둔다.

### (대안) 정밀 실시간이 더 필요하면
- Auth 변경 피드에 `CONSENT_GRANT/REVOKE` changeType을 추가하는 방법도 있으나, **표시 경로가 `/batch` 실시간이면 불필요**. 비용 대비 효용 낮음 → 현 설계에서는 채택 안 함.

---

## 6. 표시 사양 (그룹상세 학생 리스트) — 확정

`maskedReason == NOT_CONSENTED` 멤버는 **이름·이메일 전체 마스킹** + **(i) 툴팁** 노출. (부분마스킹 `김○○`는 식별 가능해 사용 안 함)

**툴팁 문구 (고정):**
> ⓘ 학습심리정서검사를 아직 시작하지 않은 학생입니다.
> 학생이 최초 1회 로그인하여, 사이트 사용에 동의할 수 있게 안내해주세요.
> 자세한 내용은 그룹 관리에서 확인할 수 있습니다.

- **이름 표시값**: 전체 마스킹(예: `비공개` 또는 `●●●`) + (i) 아이콘. 이메일: 빈값/`-`.
- **기타 엣지**:
  - **멤버 수(count)**: 미동의 멤버도 포함(마스킹만, 명단 제외 아님). 합의: 평문 저장만 아니면 마스킹으로 OK.
  - **합류 알림**: 미동의 멤버는 roster `name=null` → 알림 이름 없이 또는 보류 정책 검토.
  - **미동의 vs 탈퇴 구분**: `/batch` `maskedReason`(`NOT_CONSENTED` vs `WITHDRAWN`)으로 구분 → 미동의만 위 툴팁, 탈퇴는 별도 표기.
  - **오너 미동의**: 그룹은 보이되 오너 이름만 마스킹(학생에게 "선생님 OOO" 노출 시).

---

## 7. 작업 분해

### Auth (superplatform-auth)
1. `/api/v1/users/batch` — 호출 RP 미동의 publicUserId의 name/email null + **`maskedReason` enum**(NONE/NOT_CONSENTED/WITHDRAWN/NOT_FOUND). **표시 마스킹·툴팁 핵심.**
2. `RpMemberResponse` += `consented`; 미동의 시 `name=null`. `RpGroupService` 2곳 배치 동의 조회 적용.
3. (선택) `RpGroupResponse` += `ownerConsented`.
4. 동의 조회는 `UserServiceConsentRepository.existsByUserIdAndClientIdAndAgreementType(...active)` 배치화.

### 학심정 (meta-dashboard)
5. `RpMemberDto` += `consented`, `RpGroupClient.parseGroup` 파싱. (저장은 선택, 마스킹 권위로 미사용)
6. **`UserInfo`/`HasUserInfo`에 `maskedReason`(enum) 추가** — `/batch` 사유를 enrich 시 멤버 DTO로 전파.
7. **FE 그룹상세 학생 리스트(`StudentManagementPanel`)**: `maskedReason == NOT_CONSENTED` 멤버 → 이름·이메일 전체 마스킹 + **(i) 툴팁**(§6 고정 문구).
8. 합류 알림 문구가 `name=null` 안전한지 점검.

### 변경 없음
- change 피드 폴링 로직(구조 변경 전용) · `provisioned` 컬럼 · REVOCATION 폴링 — **그대로 유지.**

---

## 8. 요약

| 질문 | 답 |
|---|---|
| 멤버 동의 판단 | Auth가 **serve 시점 실시간** 계산 (provisioned/revoke 아님) |
| 표시 마스킹 권위 | **`/batch` 동의 필터 + `maskedReason` enum**(표시 시점 실시간, staleness 없음) |
| 그룹상세 학생 리스트 | 미동의 멤버 **이름·이메일 전체 마스킹 + (i) 툴팁**(고정 문구) |
| roster(`RpMemberResponse`) | `consented` + 미동의 `name=null` (알림 보호·동기화 신호) |
| 그룹정보 / 오너 미동의 | **그룹은 항상 동기화**, **오너 이름만 동의 게이트**(/batch) |
| change 폴링과 결합 | **현행 유지(구조 변경 전용)**. 동의는 /batch 실시간으로 해결 → CONSENT 이벤트 불필요 |
| provisioned/revoke | 기존 용도 **유지**, 마스킹 판단엔 미사용 |
