zj# Group from IDP — 00. 개요 & Auth RP Group API 스펙

> 작성일: 2026-06-10 · 대상: **학심정(meta-dashboard)** backend
> 방향 확정: **그룹 관리(생성·수정·삭제·초대·합류)는 IDP(superplatform-auth)가 소유**하고,
> 교사는 **mypage(superplatform-mypage, 화면단)** 에서 그룹을 관리한다.
> 학심정(RP)은 **Auth RP Group API로 그룹/멤버 정보를 조회해 자체 DB(`group_info`/`group_member`)에 지속 동기화**한다.

---

## 1. 전환 모델 요약

```
[Auth(IDP)]  group_info / group_member / group_invitation / group_change_log  ← 원본(source of truth)
     ↑ 관리 UI                                  │
[mypage]  교사 그룹 생성/수정/삭제/초대,          │ RP Group API (service AT, scope=groups:read)
          학생 코드/이메일 합류                   ▼
[학심정(RP)]  ① 부트스트랩 스냅샷  ② 변경 피드 폴링  ③ 증분 상세 조회  ④ 일 1회 전체 재동기화
     │
     ▼ upsert (멱등)
학심정 DB  group_info / group_member  ← **테이블 유지, 데이터만 동기화로 채움**
     │
     ▼ 기존 코드 무변경 소비
검사(tb_dgnss_*) · 메모 · 상담 · 생기부 — cla_id/stdt_id 기반 조회 그대로
```

핵심 결정 사항:

| 항목 | 결정 |
|---|---|
| 원본(source of truth) | **Auth(IDP)** — 학심정 그룹 쓰기 API는 폐기 |
| 학심정 `group_info`/`group_member` | **유지** — Auth에서 동기화로 채움 (읽기 전용 복제본) |
| `cla_id`/`stdt_id` | **유지** — 검사·메모·상담·생기부의 외래 식별자라 변경 불가. 동기화 시 신규 그룹/학생에 학심정이 계속 채번 |
| 멤버 성명(PII) | **계속 미저장** — Auth 응답에 name이 오지만 영속화하지 않음. 기존 `UserInfoEnricher` 읽기 시점 enrich 유지 (거버넌스: 성명은 그룹 표시 목적 외 활용 금지) |
| SSE 알림(그룹 참여/퇴장 등) | **유지** — 동기화 핸들러가 기존 알림 이벤트를 발행 (단, 초대 알림은 갭 → `03-sync-design.md` §6) |
| 동기화 인프라 | 기존 `SsoEventPollingScheduler`/`sso_poll_cursor` 패턴 재사용·확장 |

회의 준비 문서(`docs/group-from-sso-meeting-prep.md`)의 Q1에 대한 답이 **(A) Auth 단일 원본 + 로컬 복제 동기화**로 확정된 형태다. 당시 "Auth에 group 개념이 없다"던 전제는 해소됨 — Auth `develop`에 `feature/group-management`가 머지되어 그룹 도메인 + RP API가 **이미 구현 완료** 상태다.

---

## 2. Auth(IDP) 측 구현 현황 (2026-06-10, develop 기준)

근거: `C:\workspace\superplatform-auth` 커밋 로그 및 코드.

| 구성 요소 | 상태 | 위치 (superplatform-auth) |
|---|---|---|
| 그룹 도메인 (group_info/member/invitation) | ✅ 완료 | `backend/core-api/.../domain/group/` |
| 변경 로그 (group_change_log, DATETIME(6)) | ✅ 완료 | migration-031 |
| RP 스냅샷 API `GET /api/v1/rp/groups` | ✅ 완료 | `RpGroupController` |
| RP 변경 피드 `GET /api/v1/rp/groups/changes` | ✅ 완료 | 〃 |
| RP 단건 조회 `GET /api/v1/rp/groups/{groupId}` | ✅ 완료 | 〃 |
| service scope `groups:read` | ✅ 화이트리스트 등록됨 | `UserAuthz.canReadGroups()` |
| **RP 동기화 가이드 문서** | ✅ 신설 | `docs/guide/03-group-sync-guide.md` |
| API 레퍼런스 v1.7.0 (RP Group API) | ✅ 발행 | `docs/guide/api-reference/dist/api-reference-v1.7.0/` |
| mypage 그룹 관리 UI | ✅ 머지됨 | superplatform-mypage `feature/group-management-ui` |

### Auth 그룹 도메인 모델 요점

- `group_info`: `id`(BIGINT PK), `tenant_id`, `owner_user_id`(교사), `status`(**ACTIVE/DELETED** soft), `school_name`, `school_level`(**ELEMENTARY/MIDDLE/HIGH/ETC**), `school_code`(NEIS, NULL), `grade`(자유텍스트 "3학년"), `class_no`(자유텍스트 "5반"), `subject`(자유텍스트, NULL), `group_name`, `invite_code`(6자리, tenant 내 UNIQUE, 무기한)
- `group_member`: `group_id`+`user_id` UNIQUE, `status`(**ACTIVE/REMOVED** soft), `join_source`(CODE/EMAIL), `joined_at`
- 권한 모델: **그룹은 교사 소유 + 학생 멤버** — 교사는 멤버로 합류 불가(403)
- 초대: 이메일 토큰(7일 TTL) + 6자리 코드 셀프조인 + **가입 시 PENDING 초대 자동합류**
- 삭제: 앱 내 삭제/제외는 모두 soft. 물리 삭제는 **회원 30일 purge 시 FK CASCADE로만** 발생 (→ 변경 이벤트가 안 생기므로 주기 재동기화로 보정해야 함)

---

## 3. RP Group API 스펙 (RP=학심정 입장 정리)

> 원문: superplatform-auth `docs/guide/03-group-sync-guide.md`, `api-reference-v1.7.0/api-spec.md`

### 3.1 인증 — Service Access Token

```
POST /oauth2/token
grant_type=client_credentials & client_id=... & client_secret=... & scope=groups:read
→ { access_token(RS256 JWT), token_type=Bearer, expires_in=3600, scope }
```

- AT 유효 1시간, RT 미제공 — 만료 시 재발급
- **학심정 oauth2_client에 `groups:read` scope가 등록돼 있어야 함** (Auth 측 운영 작업 — `03-sync-design.md` §8 요청사항)

### 3.2 ① 부트스트랩 스냅샷 — `GET /api/v1/rp/groups`

ACTIVE 그룹 + **ACTIVE 멤버 명단(publicUserId·성명 포함)**. id 키셋 페이징.

| 파라미터 | 설명 |
|---|---|
| `afterId` | 직전 응답의 `nextAfterId`. 최초 호출 시 생략 |
| `limit` | 기본 100 / 최대 500 |

응답(그룹 객체 — 단건 조회 ③도 동일 형태):

```json
{
  "items": [{
    "groupId": 12,                     // Auth BIGINT id → 학심정 sp_group_id
    "groupName": "3-5 우리반",
    "schoolName": "비상중학교",
    "schoolLevel": "MIDDLE",           // ELEMENTARY/MIDDLE/HIGH/ETC
    "schoolCode": "B100000123",        // NEIS, nullable
    "grade": "3학년",                  // 자유텍스트, nullable
    "classNo": "5반",                  // 자유텍스트, nullable
    "subject": "수학",                 // 자유텍스트, nullable
    "status": "ACTIVE",                // 스냅샷은 ACTIVE만
    "memberCount": 2,
    "updatedAt": "2026-06-09T10:00:00",
    "members": [{
      "publicUserId": "aece2418-…",    // = 학심정 user.sp_user_id
      "name": "홍길동",                // 라이브 조인 성명 — 학심정은 미저장
      "status": "ACTIVE",
      "joinedAt": "2026-06-09T10:05:00",
      "updatedAt": "2026-06-09T10:05:00"
    }],
    "ownerPublicUserId": "9dd345d5-…"  // 소유 교사 publicUserId
  }],
  "nextAfterId": 12,
  "currentSince": "2026-06-10T08:59:56"   // ★ 변경 피드 초기 커서 — 첫 페이지 값만 사용
}
```

주의:
- 응답에 **`inviteCode` 없음**, **`maxMemberCount` 없음** — 학심정 스키마 대응은 `02-schema-and-mapping.md` 참조
- `items.size < limit` → 순회 완료
- **커서는 첫 페이지의 `currentSince`만 보관** (마지막 페이지 값을 쓰면 순회 중 변경분 유실)

### 3.3 ② 변경 피드 — `GET /api/v1/rp/groups/changes`

| 파라미터 | 설명 |
|---|---|
| `since` | 직전 응답의 `nextSince` (ISO-8601). 최초엔 부트스트랩 첫 페이지의 `currentSince` |
| `limit` | 기본 500 / 최대 1000 |

```json
{
  "items": [{
    "changeType": "MEMBER_ADD",
    "groupId": 12,
    "publicUserId": "57559d93-…",      // MEMBER_* 만 값, GROUP_* 는 null
    "occurredAt": "2026-06-10T09:14:30",  // DATETIME(6) 마이크로초
    "ownerPublicUserId": "9dd345d5-…"
  }],
  "nextSince": "2026-06-10T09:14:30"
}
```

| changeType | 의미 | RP 처리 |
|---|---|---|
| `GROUP_CREATE` | 그룹 생성 | ③ 재조회 → 그룹+멤버 upsert |
| `GROUP_UPDATE` | 그룹 수정 | ③ 재조회 → upsert |
| `GROUP_DELETE` | 그룹 삭제(soft) | 로컬 그룹 비활성 (멤버는 정책 따라) |
| `MEMBER_ADD` | 멤버 합류 (코드/이메일/가입자동합류) | ③ 재조회 → 멤버 명단 전체 교체 (이벤트에 성명 없음) |
| `MEMBER_REMOVE` | 멤버 제외 (교사 제거) | 해당 publicUserId 멤버만 로컬 비활성 — 재조회 불필요 |

규약:
- 발생 시각 오름차순. 변경 없으면 `items: []` + `nextSince`는 요청값 그대로
- **안전 지연 5초**: 서버는 `now()-5s` 이전 이벤트만 노출 (미커밋 행 건너뜀 방지). **동일 이벤트 중복 전달 가능 → 모든 반영은 멱등 필수**
- `items.size == limit` → 즉시 재호출
- 폴링 주기 권장 **1~5분**
- 401 → 토큰 재발급 후 재시도 / 5xx·타임아웃 → **커서 갱신하지 않고** 다음 주기 재시도

### 3.4 ③ 증분 상세 — `GET /api/v1/rp/groups/{groupId}`

스냅샷 그룹 객체 1건과 동일 형태. **404 = 조회 시점 이전 삭제 → 로컬 삭제 처리**.

### 3.5 ④ 주기적 전체 재동기화 (Auth 권장 최소 주 1회 — 학심정은 **일 1회** 채택)

부트스트랩 재실행 + **스냅샷에 없는 로컬 동기화 데이터 삭제**. 목적:
1. **회원 30일 purge 보정** — DB CASCADE 삭제는 그룹 변경 이벤트가 안 생김 (단 1차로는 기존 DELETION 피드 폴링이 잡음 — 재동기화는 안전망)
2. 정합성 어긋남 일괄 복원

> 학심정은 비용이 미미(스냅샷 풀스캔 = 그룹 1,000개 기준 API ~10회)해 일 1회 새벽으로 운영 — 근거는 `03-sync-design.md` §5.

### 3.6 거버넌스 (Auth 문서 명시)

- 멤버 성명 제공 근거 = 그룹 멤버십 (per-RP 동의와 무관)
- IdP가 명단 조회를 감사 로그(`group_roster_access_log`)로 기록
- **성명을 그룹 표시 목적 외 활용·재제공 금지** → 학심정은 성명 미저장 정책 유지가 정확히 부합

---

## 4. 문서 구성

| 문서 | 내용 |
|---|---|
| `00-overview.md` (본 문서) | 방향 확정 + Auth RP API 스펙 |
| `01-impact-analysis.md` | 학심정 사이드 이펙트 **전수조사** (폐기 API, 이벤트/알림, cla_id/stdt_id 의존, 채번, FE) |
| `02-schema-and-mapping.md` | 스키마 변경 DDL + Auth↔학심정 필드/상태 매핑 전체 |
| `03-sync-design.md` | 동기화 구현 설계 (부트스트랩/폴링/재동기화, 멱등성, **SSE 알림 유지**, 설정, 미결사항) |

참고 선례: `docs/user-info-from-idp/00~07` (회원 PII → IDP 전환, Phase 1~6 완료) — 본 전환은 그 인프라(service AT, Enricher, 폴링 커서)를 재사용한다.
