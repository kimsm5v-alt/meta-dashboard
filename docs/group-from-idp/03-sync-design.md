# Group from IDP — 03. 동기화 구현 설계

> 기존 SSO 폴링 인프라(`SsoEventPollingScheduler`/`sso_poll_cursor`/`SpServiceTokenProvider`)를 재사용·확장한다.
> Auth 가이드(superplatform-auth `docs/guide/03-group-sync-guide.md`)의 규약을 RP 입장에서 구현으로 옮긴 문서.

---

## 1. 컴포넌트 구성 (신규/확장)

```
com.vs.meta.api.sso (확장)
├── client/
│   ├── SpServiceTokenProvider          (기존 — events:read) 
│   ├── SpGroupTokenProvider 또는 scope 파라미터화   ← 신규/변경 §7
│   └── RpGroupClient                    ← 신규: /api/v1/rp/groups 3종 호출
├── scheduler/
│   ├── SsoEventPollingScheduler        (기존 15분 — 회원 피드)
│   ├── GroupSyncScheduler               ← 신규: 변경 피드 폴링 (1~5분) + ShedLock
│   └── GroupFullResyncScheduler         ← 신규: 일 1회(새벽) 전체 재동기화 + ShedLock
├── service/
│   ├── GroupSyncService                 ← 신규: 부트스트랩/피드 반영/재동기화 오케스트레이션
│   ├── GroupUpsertService               ← 신규: upsert + 알림 발행 + activeDgnss (02 §6 의사코드)
│   └── SsoUserProvisioningService       ← 신규: ensureUser(publicUserId, role) — user 행 선제 생성
└── mapper/
    └── SsoPollCursorMapper             (기존 — GROUP_CHANGES 행 재사용)
```

신규 DTO: `RpGroupDto`(그룹+멤버), `RpGroupChangeDto`(피드 아이템), `RpGroupPageDto`(items/nextAfterId/currentSince), `RpGroupChangeFeedDto`(items/nextSince).

---

## 2. RpGroupClient — Auth 호출부

| 메서드 | HTTP | 비고 |
|---|---|---|
| `snapshot(afterId, limit)` | `GET {base}/rp/groups?afterId=&limit=100` | 부트스트랩/재동기화 |
| `changes(since, limit)` | `GET {base}/rp/groups/changes?since=&limit=500` | since는 ISO-8601, **마이크로초 포함 포맷** (`yyyy-MM-dd'T'HH:mm:ss.SSSSSS`) — Auth occurredAt이 DATETIME(6) |
| `detail(groupId)` | `GET {base}/rp/groups/{id}` | **404를 예외가 아닌 "삭제됨" 신호로 처리** |

- base-url: 기존 `superplatform.auth.internal-api.base-url` 재사용 (`/api/v1`)
- 인증: `Authorization: Bearer {service AT(groups:read)}` — §7
- 401 → 토큰 invalidate 후 1회 재시도 (기존 `callWithTokenRetry` 패턴, `SsoEventPollService` 103-111)
- 타임아웃: 기존 internal-api 설정(연결 2s/읽기 3s) 재사용하되, 스냅샷 페이지는 멤버 포함이라 클 수 있음 → 읽기 타임아웃 별도 상향 검토 (예: 10s)

---

## 3. 부트스트랩 (최초 1회)

트리거: `sso_poll_cursor.GROUP_CHANGES.last_since IS NULL`이면 폴링 스케줄러가 피드 대신 부트스트랩을 수행.

```
firstPageSince = null
afterId = null
loop:
    page = client.snapshot(afterId, 100)
    for rp in page.items: groupUpsertService.upsertGroupFromRp(rp)   # 부트스트랩 중엔 알림 발행 억제 §6.4
    if firstPageSince == null: firstPageSince = page.currentSince    # ★ 첫 페이지 값만
    afterId = page.nextAfterId
until page.items.size < 100
UPDATE sso_poll_cursor SET last_since = firstPageSince WHERE feed_type='GROUP_CHANGES'
```

- 페이지 단위 트랜잭션 (그룹 1페이지 = 1 TX). 중단 시 처음부터 재실행해도 upsert 멱등이라 안전. 단 `last_since`는 **전체 완료 후에만** 기록 (미완료 표식 유지)
- 부트스트랩 직후부터 변경 피드가 스냅샷 조회 중 변경분을 메움 (currentSince가 첫 페이지 시점이므로)

---

## 4. 변경 피드 폴링 (`GroupSyncScheduler`)

- cron: **1분** 권장 (`0 */1 * * * *`) — 알림(SSE) 유지 요건 때문에 회원 피드(15분)보다 짧게. 최종 주기는 운영 결정 (Auth 권장 1~5분)
- ShedLock: `@SchedulerLock(name = "pollGroupChanges", lockAtMostFor = "PT5M", lockAtLeastFor = "PT10S")`
- 플래그: `GROUP_SYNC_ENABLED` (기본 false — `SSO_POLL_ENABLED`와 동일 컨벤션)

```
poll():
    cursor = cursorMapper.findByFeedType('GROUP_CHANGES')
    if cursor.lastSince == null: bootstrap(); return
    loop:
        feed = client.changes(cursor.lastSince, 500)
        if feed.items.isEmpty(): break
        # ── 단일 TX 시작 ──────────────────────────────
        groupIdsToRefetch = {}   # GROUP_CREATE/UPDATE/MEMBER_ADD → groupId 중복 제거
        for ev in feed.items (occurredAt ASC):
            switch ev.changeType:
                GROUP_CREATE, GROUP_UPDATE, MEMBER_ADD → groupIdsToRefetch.add(ev.groupId)
                GROUP_DELETE   → deactivateGroup(ev.groupId)                  # use_yn='N' (멱등)
                MEMBER_REMOVE  → removeMember(ev.groupId, ev.publicUserId)    # KICKED 전이 시 S5 알림
        for gid in groupIdsToRefetch:
            rp = client.detail(gid)
            if rp == null(404): deactivateGroup(gid)        # 조회 전 삭제됨
            else: upsertGroupFromRp(rp)                      # 신규/재활성 멤버 → T1 알림 + activeDgnss
        cursorMapper.updateCursor('GROUP_CHANGES', feed.nextSince, NOW(), feed.items.size)
        # ── TX 커밋 (이벤트 반영 + 커서 저장 = 동일 트랜잭션, Auth 가이드 요구) ──
        if feed.items.size < 500: break                      # limit 미만 = 수신 완료
        # size == limit → 루프 계속 (즉시 재호출)
```

핵심 규약 이행:
- **이벤트 반영 + 커서 저장 = 동일 TX** — 반영 후 커서 저장 전 장애 → 재기동 시 동일 이벤트 재수신 → 멱등 흡수
- **중복 제거 후 그룹당 1회 재조회** (같은 배치에 같은 그룹 이벤트 다수)
- **미보유 groupId** → detail 재조회가 자연 해소 (404면 비활성)
- 5xx/타임아웃 → 커서 미갱신, 예외 로그 후 다음 주기 catch-up (기존 `SsoEventPollingScheduler` 36-39 패턴)
- 알림 발행은 TX 커밋 후가 이상적 (`@TransactionalEventListener(AFTER_COMMIT)` — 기존 `NotificationEventHandler`가 이미 이 패턴인지 확인 후 동일하게)

---

## 5. 전체 재동기화 — 일 1회 새벽 (`GroupFullResyncScheduler`)

- cron: **일 1회 새벽** (`0 0 4 * * *`), ShedLock 별도
- 주기 결정 근거: Auth 가이드의 "주 1회"는 **권장 최소치**. 재동기화는 3차 방어선(1차=변경 피드 1분, 2차=DELETION 피드 15분)이므로 주기는 "드문 이상 상황의 최대 방치 기간"을 정할 뿐인데, 비용이 스냅샷 풀스캔(그룹 1,000개 기준 API ~10회)으로 미미해 방치 기간을 7일→1일로 줄이는 대가가 사실상 없음. 단 전량 명단 조회는 Auth가 감사 로그(`group_roster_access_log`)를 남기므로 **일 1회 주기를 Auth팀에 사전 공유** (§8 #8)
- **보정 건수 로그/알람 필수**: 정상 운영이면 재동기화는 매번 보정 0건이어야 함. 보정이 반복 발생하면 주기 문제가 아니라 **1·2차 피드 처리에 버그가 있다는 신호** — 보정된 그룹/멤버/유저 건수를 로그로 남기고 임계 초과 시 알람
- 절차: 부트스트랩과 동일 순회 + **마감 정리**:

```
seenSpGroupIds = {}; seenMemberKeys = {}
(스냅샷 순회하며 upsert + seen 채움. 첫 페이지 currentSince 보관)
# 마감 정리 — 동기화 행(sp_group_id IS NOT NULL)만 대상. 레거시 불가침
UPDATE group_info SET use_yn='N'
 WHERE sp_group_id IS NOT NULL AND use_yn='Y' AND sp_group_id NOT IN (seen)
→ 각 비활성화 그룹은 로그 (운영 추적)
ACTIVE 멤버 중 seen에 없는 (group, user) → KICKED 전이      # 30일 purge 보정
# 프로비저닝 행 정리 (02 §7) — 보유 근거(멤버십) 소멸 시 삭제
DELETE FROM user
 WHERE provisioned='Y'
   AND NOT EXISTS (SELECT 1 FROM group_member gm
                    WHERE gm.user_no = user.user_no AND gm.status='ACTIVE')
   AND NOT EXISTS (SELECT 1 FROM group_info gi
                    WHERE gi.host_user_no = user.user_no AND gi.use_yn='Y')
커서를 첫 페이지 currentSince로 리셋
```

- 목적 (Auth 가이드): ① 회원 30일 purge의 CASCADE 삭제(이벤트 미생성) 보정 ② 누적 정합성 복원
- 재동기화 중 알림: **억제** (대량 보정이 알림 폭주로 이어지면 안 됨) — §6.4

---

## 6. SSE 알림 유지 설계 (요구사항)

### 6.1 유지되는 알림

| 알림 | 트리거 (전환 후) | 발행 위치 |
|---|---|---|
| T1 "%s 학생이 '%s' 그룹에 참여" → 교사 | MEMBER_ADD 반영 결과 **실제 INSERT/재활성** | `GroupUpsertService.syncMembers` |
| S5 "%s 그룹에서 퇴장" → 학생 | MEMBER_REMOVE / 명단 누락 반영 결과 **실제 KICKED 전이** | 〃 + `removeMember` |

- 기존 이벤트 레코드(`StudentJoinedGroupEvent`, `StudentKickedEvent`)와 리스너(`NotificationEventHandler` 138-154, 206-221) **무변경 재사용** — 발행 주체만 GroupService → GroupUpsertService로 교체
- `studentNickname` 채움: RP 응답의 `name`을 **알림 메시지 조립에 일회성 사용** (영속화 금지). MEMBER_REMOVE처럼 응답에 이름이 없을 땐 `UserInfoEnricher`로 채움 (기존 `leaveGroup` 341 패턴)
- 알림 멱등성: 상태 무변경(no-op) upsert에서는 **절대 발행하지 않음** — 피드 중복 전달이 알림 중복으로 새지 않게 하는 핵심 가드

### 6.2 지연 특성 변화 (UX 고지 필요)

| | 기존 | 전환 후 |
|---|---|---|
| 참여/퇴장 알림 | 액션 즉시 (동기 발행) | **폴링 주기(1분 권장) + 안전 지연 5초** 내외 |

### 6.3 ❌ 갭: 초대 알림 (S4 "%s 그룹에 초대 되었어요")

- Auth 변경 피드에 **초대(INVITE) 이벤트가 없음** (GROUP_CREATE/UPDATE/DELETE + MEMBER_ADD/REMOVE 뿐)
- 초대 자체가 Auth 소유가 됐고, Auth는 초대 시 **자체 메일을 발송**함 (mypage 랜딩 링크)
- 선택지:
  - (a) **Auth팀에 `MEMBER_INVITE` 이벤트 추가 요청** → 수신 시 S4 발행 (기능 완전 유지) — §8 요청사항 #3
  - (b) S4 알림 폐기 — 초대 고지는 Auth 메일로 갈음 (학심정 인앱 알림만 사라짐)
  - → 정책 결정 필요. 알림 유지가 명시 요구사항이므로 **(a) 권장**
- 참고: 기존 S4는 "초대 대상이 이미 학심정 회원일 때만" 발행되던 알림 (`sendInvitation` 95 — lookupByEmail 성공 시) — 갭의 실사용 영향은 제한적일 수 있음

### 6.4 T2(자발 탈퇴 → 교사 알림) 거취

- Auth 그룹 모델에 **학생 자발 탈퇴(self-leave)가 없음** (교사 제거만 존재) → 탈퇴라는 행위 자체가 소멸
- (a) T2 폐기 (행위가 없으니 알림도 없음 — 자연스러움)
- (b) Auth에 self-leave 기능이 추가되면 그때 MEMBER_REMOVE와 구분되는 이벤트로 복원
- → 미결 #2

### 6.5 부트스트랩/재동기화 중 알림 억제

초기 적재(수백 그룹 × 수십 멤버)와 주간 보정에서 T1/S5가 폭주하면 안 됨 → `GroupUpsertService`에 `suppressNotifications` 모드. 피드 폴링 경로에서만 알림 활성.

---

## 7. 인증 토큰 — scope 확장

현재 두 개의 service AT provider가 존재:

| Provider | scope | 용도 |
|---|---|---|
| `ServiceAccessTokenProvider` (common.auth) | `users:read` (`application.yml` service-token-scope) | PersonInfoClient (회원 조회) |
| `SpServiceTokenProvider` (api.sso.client) | `events:read` | 회원 이벤트 피드 |

그룹 피드는 **`groups:read`** 가 필요. 선택지:
- (a) `SpServiceTokenProvider`를 scope 파라미터화 (provider 인스턴스/캐시를 scope별 분리) — 권장
- (b) `service-token-scope: "users:read groups:read"`처럼 단일 토큰에 복수 scope — Auth가 교집합 발급하므로 가능하나, scope 변경이 기존 호출에 영향 주는지 확인 필요

⚠️ **선결**: Auth DB `oauth2_client`의 학심정 client 행에 `groups:read` scope 등록 (Auth 측 운영 작업 — §8 #1). 미등록 시 토큰 발급이 401.

설정 추가(안):

```yaml
# application.yml
group-sync:
  enabled: ${GROUP_SYNC_ENABLED:false}
  poll-cron: "0 */1 * * * *"
  resync-cron: "0 0 4 * * *"        # 일 1회 새벽 (§5 근거)
  snapshot-limit: 100      # max 500
  feed-limit: 500          # max 1000
```

---

## 8. Auth(IDP)팀 요청/확인 사항

1. **학심정 oauth2_client에 `groups:read` scope 등록** (dev/prod 각각)
2. 학심정 tenant 확인 — RP API는 service AT의 client→tenant로 자동 스코핑되는지 (cross-tenant 방어 확인됨: `findAllByIdInAndTenantId`)
3. **(요청) 변경 피드에 `MEMBER_INVITE` 이벤트 추가** — S4 인앱 알림 유지용 (§6.3)
4. (확인) 학생 자발 탈퇴(self-leave) 로드맵 — T2 알림/탈퇴 UX 거취 결정에 필요 (§6.4)
5. (확인) 기존 학심정 그룹의 Auth backfill 지원 여부/책임 — `02 §5` (a)안이면 불필요
6. (확인) RP 응답에 `maxMemberCount` 추가 가능 여부 — 학심정 표시용 (없어도 무방)
7. (확인) 피드 polling 주기 1분이 Auth 부하 관점에서 허용되는지 (가이드는 1~5분)
8. (공유) 전체 재동기화를 **일 1회 새벽**으로 운영 예정 (가이드 권장 주 1회보다 짧음) — 전량 명단 조회가 매일 감사 로그로 남는 점 사전 인지 요청

---

## 9. 미결사항 (구현 착수 전 결정 필요)

> ✅ **확정 (2026-06-11)** — 미로그인 사용자 처리: **user 행 선제 INSERT (provisioned 마커)** 로 결정.
> 근거·라이프사이클·기각된 대안(late binding)은 `02-schema-and-mapping.md` §7.
> 구현 시 필수: ① `SsoUserRegistrationService` 첫 로그인 합류(기존 행 재사용 + provisioned='N') — 누락 시 UNIQUE 충돌,
> ② 일간 전체 재동기화의 프로비저닝 행 정리(§5), ③ DELETION 폴링은 무수정 (기존 cascade가 커버).

| # | 사안 | 선택지 | 권고 |
|---|---|---|---|
| 1 | **기존 학심정 그룹 데이터 거취** | (a) 동결+신규는 mypage 생성 / (b) Auth backfill | Auth팀 협의 전까지 (a) 가정. cla_id 보존으로 기존 검사/상담 데이터는 어느 쪽이든 안전 |
| 2 | T2(자발 탈퇴) 알림/기능 | 폐기 vs Auth 기능 추가 대기 | 폐기 (Auth에 행위 자체가 없음) |
| 3 | `schoolLevel=ETC` 그룹 | enum 추가+검사 skip vs 동기화 제외 | enum 추가 + 검사 자동등록 skip |
| 4 | S4(초대) 알림 | Auth MEMBER_INVITE 이벤트 요청 vs 폐기 | Auth 요청 (알림 유지 요구사항) |
| 5 | "합류 직후 즉시 검사 응시" 지연 | 폴링 1분 수용 vs 보완책 | 1분 수용 우선. 부족하면: 검사 응시 진입 시점에 해당 학생 멤버십을 Auth에 동기 확인(detail 1회)하는 on-demand 보강 |
| 6 | 폐기 API 처리 방식 | 즉시 제거 vs 한시 410 | FE 전환과 동시 배포면 즉시 제거 |
| 7 | 폴링 주기 | 1분 vs 5분 | 1분 (알림 UX) — Auth 부하 협의(§8 #7) 후 확정 |

---

## 10. 구현 순서 (Phase — 회원 PII 전환의 단계 분리 원칙 준수)

| Phase | 내용 | 롤백 |
|---|---|---|
| **P1. 스키마 준비** | migration 01 (sp_group_id, invite_code 완화, subject, 커서 행) | 가능 (컬럼 추가/완화만) |
| **P2. 동기화 구현** | RpGroupClient + GroupSyncService/UpsertService + ensureUser + 스케줄러 2종. `GROUP_SYNC_ENABLED=false`로 배포 → dev에서 켜고 부트스트랩 검증 | 가능 (플래그 off) |
| **P3. 알림 연결** | T1/S5 발행 이전 + 부트스트랩 억제 검증. S4는 Auth 이벤트 추가 후 | 가능 |
| **P4. 쓰기 API 폐기** | GroupController 쓰기 12종 + GroupInvitationService 제거, FE 전환 배포와 동시 | 코드 롤백 가능 |
| **P5. 정리 (PoNR)** | group_invitation DROP(백업 후), invite_code 관련 잔여 코드 제거 | **불가** — 백업 필수 |

검증 체크리스트 (Auth 가이드 운영 점검 + 학심정 고유):
- [ ] 동일 이벤트 2회 반영 = 1회 반영 (데이터/알림 모두)
- [ ] 커서가 이벤트 반영과 동일 TX로 저장되는가
- [ ] `items.size == limit` 즉시 재호출
- [ ] 401 재발급 재시도 / 5xx 커서 미갱신
- [ ] 일 1회 전체 재동기화 + 레거시(sp_group_id NULL) 불가침 + 보정 건수 0건(비0이면 피드 버그 조사)
- [ ] ensureUser로 생성된 학생이 검사 대상자 목록(`selectTargetStList`)에 나타나는가
- [ ] MEMBER_ADD 후 activeDgnss 자동 등록 → 학생 응시 화면 진입 가능
- [ ] T1/S5 SSE 수신 (폴링 지연 내)
- [ ] 멤버 성명이 DB 어디에도 영속화되지 않는가 (거버넌스)
