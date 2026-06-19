# Group from IDP — 01. 사이드 이펙트 전수조사

> 그룹 쓰기(생성/합류/초대/수정/삭제/강퇴/탈퇴)가 Auth(mypage)로 이관되고 학심정은 동기화 수신만 할 때,
> 영향받는 **모든** 코드를 전수조사한 결과. (조사 기준: 2026-06-10 vs-develop)

---

## 1. 폐기/변경 대상 API 엔드포인트 (`GroupController`)

`backend/src/main/java/com/vs/meta/api/group/controller/GroupController.java`

| 엔드포인트 | 라인 | 처리 | 사유 |
|---|---|---|---|
| `POST /group/create` | 42-53 | **폐기** | 그룹 생성은 mypage→Auth |
| `POST /group/join` | 55-66 | **폐기** | 코드 합류는 mypage→Auth |
| `GET /group/list` | 68-84 | **유지** | 동기화된 로컬 테이블 조회 — 무변경 |
| `GET /group/detail` | 86-97 | **유지** | 〃 |
| `GET /group/invite` (코드로 그룹 조회) | 99-106 | **폐기** | 합류 플로우 자체가 mypage로 이동 |
| `PUT /group/update` | 108-119 | **폐기** | 수정은 mypage→Auth |
| `POST /group/member/leave` | 121-131 | **폐기** | ⚠️ Auth에 학생 자발 탈퇴 기능 없음 (`03-sync-design.md` §9 미결) |
| `POST /group/member/kick` | 133-143 | **폐기** | 제외는 mypage→Auth (MEMBER_REMOVE로 수신) |
| `DELETE /group/delete` | 145-152 | **폐기** | 삭제는 mypage→Auth (GROUP_DELETE로 수신) |
| `POST /group/invite/email` | 156-169 | **폐기** | 초대는 Auth 소유 (`group_invitation` + 토큰 + 자동합류) |
| `GET /group/invite/list` | 171-179 | **폐기** | 〃 (초대 목록은 mypage에서) |
| `DELETE /group/invite/{invitationId}` | 181-188 | **폐기** | 〃 |

> 폐기 방식: 컨트롤러/서비스 메서드 제거. (FE가 단계적으로 전환된다면 한시적 410 Gone 응답도 가능 — cutover 전략에 따름)

### 함께 정리되는 서비스 로직

`GroupService` (`api/group/service/GroupService.java`):

| 메서드 | 라인 | 처리 |
|---|---|---|
| `createGroup()` | 49-115 | 폐기. 단 내부의 **tc_id lazy 채번**(75-79)과 **cla_id/invite_code 채번**(82-83)은 동기화 핸들러로 이전 |
| `joinGroupAsPlayer()` | 117-231 | 폐기. 단 **stdt_id lazy 채번**(148-152) · **member_no 채번**(192-193) · **activeDgnss 자동 등록**(175-182, 216-223) · **StudentJoinedGroupEvent 발행**(188, 240)은 동기화 핸들러로 이전 — §4·§5 |
| `leaveGroup()` | 313-349 | 폐기 (T2 알림 거취는 §5) |
| `kickMember()` | 351-387 | 폐기 (S5 알림은 MEMBER_REMOVE 핸들러로 이전) |
| `findGroupByInviteCode()` | 389-431 | 폐기 |
| `updateGroup()` / `deleteGroup()` | 433-490 | 폐기 |
| `findGroupList()` / `findGroupDetail()` | 269-311 | **유지** (읽기) |
| `registerActiveDgnssIfNeeded()` | 248-266 | **유지 + 동기화 핸들러에서 호출** (§4) |
| `enrichMaps()` / `enrichMap()` | 507-554 | **유지** (읽기 enrich) |

`GroupInvitationService` (`api/group/service/GroupInvitationService.java`): **전체 폐기** (sendInvitation/getInvitationList/cancelInvitation — 라인 43-169). NCP 그룹 초대 메일 발송도 함께 (Auth가 자체 발송).

`GroupInvitation` 도메인 + `GroupInvitationMapper`(Java/XML) + `group_invitation` 테이블: **폐기 대상** (DROP은 별도 Phase — `02-schema-and-mapping.md` §5).

---

## 2. cla_id 의존 전수 (전부 **유지** — 동기화가 cla_id를 계속 공급해야 하는 근거)

cla_id는 그룹의 레거시 식별자로, 아래 도메인이 **FK 없이** 결합돼 있다. **동기화로 들어오는 신규 그룹에도 학심정이 cla_id를 채번**해 줘야 이들이 전부 무변경으로 동작한다.

### 2.1 검사 (가장 critical) — `mapper/dgnss/DgnssMapper.xml`

| 쿼리 | 라인 | cla_id 사용 |
|---|---|---|
| `selectAllStdtList` | 8-12 | `group_info` JOIN, `WHERE gi.cla_id` — 학급 전체 학생 |
| `selectDgnssStdtList` | 18-21 | `WHERE tdi.cla_id` — 검사 응시 학생 |
| `selectTcDgnssInfo` | 103 | `WHERE a1.cla_id` — 교사 검사 정보 |
| `selectActvStdtCnt` | 113 | `WHERE gi.cla_id` — 활성 학생 수 |
| `selectTargetStList` / `selectEligibleTargetStListForOrd1/2` | 155, 166, 186 | `WHERE gi.cla_id` — 검사 대상자 |
| `selectTcDgnssStartPreview` | 311 | `WHERE gi.cla_id` |
| `selectTcId` | 321 | `WHERE gi.cla_id` — 그룹에서 교사 tc_id 역조회 |
| `selectTcDgnssInfoOne` | 406 | `WHERE a1.cla_id` |

→ `tb_dgnss_info.cla_id`는 검사를 학급에 묶는 유일한 키. **group_info 행이 로컬에 존재(동기화)하고 cla_id가 있어야 검사 도메인 전체가 동작.**

### 2.2 상담/메모/생기부

| 위치 | 라인 | 내용 |
|---|---|---|
| `CounselingInfoMapper.xml` `findByClaIdOrderByScheduledAtDesc` | 46 | cla_id+tc_id로 상담 목록 |
| `CounselingStudentMapper.xml` | 10, 16, 46 | cla_id 저장/조회 |
| `CounselingService.getByClassId()/create()` | 58, 113 | cla_id 파라미터 |
| `MemoInfoMapper.xml` | 8, 30, 43, 50 | cla_id 저장/조회 |
| `MemoService.createMemo()` | 83 | cla_id 저장 |
| `SchoolRecordInfoMapper.xml` | 8, 41 | cla_id 저장 |
| `SchoolRecordService.createSchoolRecord()` | 74 | cla_id 저장 |

### 2.3 그룹 자체 조회 (유지되는 읽기 경로)

- `GroupQueryMapper.xml`: `findGroupList`(8) · `findGroupDetail`(63) · `findActiveDgnssId`(86) · Admin 쿼리들(97-178)
- `GroupInfoMapper.findByClaId`(48)

---

## 3. stdt_id 의존 전수 (전부 **유지** — 동기화가 stdt_id를 계속 공급해야 하는 근거)

| 도메인 | 위치 | 내용 |
|---|---|---|
| 검사 | `DgnssMapper.xml` 8, 18, 28-40(DELETE), 151-186, 231, 244, 543, 550 | 검사 대상/결과(`tb_dgnss_result_info.stdt_id`) 전부 stdt_id 키 |
| 상담 | `CounselingStudentMapper.xml` 21, 35 | 상담-학생 매핑 |
| 메모 | `MemoInfoMapper.xml` 30 | 학생별 메모 |
| 생기부 | `SchoolRecordInfoMapper.xml` 25 | 학생별 생기부 |
| 그룹 | `GroupMemberMapper.xml` 10, 25, 61, 69 / `GroupQueryMapper.xml` 40, 187 | 멤버 식별 |

### stdt_id 채번 지점 (현재 2곳 → 동기화 핸들러가 3번째)

1. `GroupService.joinGroupAsPlayer()` 148-152 — **폐기되므로** 이 채번 경로가 사라짐
2. `SsoUserRegistrationService.register()` 51-52 — 학생 역할로 **학심정에 첫 로그인** 시 채번 (유지)
3. **(신규 필요)** 동기화 핸들러: MEMBER_ADD로 들어온 학생이 **학심정에 로그인한 적 없으면 user 행 자체가 없음** → 동기화가 user 행 + stdt_id를 선제 생성해야 함 (`03-sync-design.md` §4 ensureUser)

> ⚠️ **이것이 본 전환의 숨은 핵심 사이드 이펙트.** 기존엔 "학심정 로그인 → 그룹 참가" 순서가 보장됐지만, 이제 학생이 mypage에서 그룹에 합류한 뒤 **학심정에 한 번도 안 들어온 상태**로 동기화가 도착한다. user 행이 없으면 `group_member.user_no`(FK)·stdt_id를 채울 수 없고, 교사 화면의 학급 명단/검사 대상자에서 누락된다.

### tc_id 채번 지점 (현재 2곳 → 동일 이슈)

1. `GroupService.createGroup()` 75-79 — 폐기로 소멸
2. `SsoUserRegistrationService.register()` 49-50 — 유지
3. **(신규 필요)** 동기화 핸들러: `ownerPublicUserId`의 교사가 학심정 미가입이면 user 행 + tc_id 선제 생성

---

## 4. 검사 자동 등록 (`registerActiveDgnssIfNeeded`) — 동기화로 이전 필수

`GroupService.java` 248-266:

- 학생이 그룹에 합류하면 해당 학급의 **활성 검사**(`tb_dgnss_info` WHERE `cla_id` AND `dgnss_at='Y'`, `GroupQueryMapper.xml` 82-90)에 학생을 자동 등록 (`dgnssService.tcDgnssRestart`)
- 이미 결과가 있으면 건너뜀 (`dgnssService.existsDgnssResult`)
- 현재 호출처: `joinGroupAsPlayer()` 175-182(신규), 216-223(재가입) — **둘 다 폐기됨**

→ **MEMBER_ADD 동기화 핸들러가 동일 호출을 수행해야** "합류 즉시 검사 응시 가능" 플로우가 유지된다. 누락 시: 교사가 검사를 시작한 뒤 합류한 학생이 응시 화면에서 검사를 못 받는 회귀 발생.

⚠️ 지연 사이드 이펙트: 폴링 주기(1~5분)+안전지연(5초)만큼 자동 등록도 늦어짐. "방금 합류 → 즉시 응시" 시나리오에서 최대 폴링 주기만큼 대기 발생 (`03-sync-design.md` §9 미결 — 보완책 포함).

---

## 5. 알림(SSE) 흐름 전수 — **기능 유지 요건**

현재: 그룹 액션 → Spring 이벤트 → `NotificationEventHandler` → `notification` 저장 + Redis Pub/Sub → SSE.

| 이벤트 | 발행처 (폐기됨) | 리스너 | 알림 | 수신자 | 전환 후 |
|---|---|---|---|---|---|
| `StudentJoinedGroupEvent` | `joinGroupAsPlayer()` 188, 240 | `onStudentJoined` 138-154 | T1 "%s 학생이 '%s' 그룹에 참여했습니다." `/groups/{claId}` | 그룹 교사 | ✅ **MEMBER_ADD 핸들러가 발행** (신규 INSERT/재활성 시에만 — 중복 수신 멱등 가드) |
| `StudentLeftGroupEvent` | `leaveGroup()` 342 | `onStudentLeft` 161-177 | T2 "%s 학생이 그룹을 탈퇴했습니다." | 그룹 교사 | ⚠️ Auth에 자발 탈퇴 없음 → 발생 경로 소멸. MEMBER_REMOVE는 교사 제거라 T2 의미와 다름 (§9 미결) |
| `StudentKickedEvent` | `kickMember()` 381 | `onStudentKicked` 206-221 | S5 "%s 그룹에서 퇴장 되었어요." `/student/groups` | 제외된 학생 | ✅ **MEMBER_REMOVE 핸들러가 발행** |
| `GroupInvitedEvent` | `GroupInvitationService.sendInvitation()` 95 | `onGroupInvited` 184-199 | S4 "%s 그룹에 초대 되었어요." | 초대받은 학생 | ❌ **갭** — Auth 변경 피드에 INVITE 이벤트 없음. 대안은 `03-sync-design.md` §6.3 |

이벤트 레코드 위치: `api/notification/event/` 4개 파일. 리스너: `api/notification/listener/NotificationEventHandler.java`.

핵심 구현 요건:
1. **알림 멱등성**: 변경 피드는 동일 이벤트를 중복 전달할 수 있음 → 알림은 **upsert가 실제 상태 변화를 일으킨 경우에만** 발행 (no-op upsert 시 발행 금지). 데이터 멱등성과 별개로 챙겨야 할 부분.
2. **studentNickname**: 기존 발행부는 enricher로 이름을 채워 이벤트에 담았음(`joinGroupAsPlayer` 187, 227-228) → 동기화 핸들러도 동일하게 `UserInfoEnricher`(또는 RP 응답의 name을 일회성 사용 — 영속화 금지) 후 발행.
3. **지연**: 알림이 실시간 → 폴링 주기만큼 지연됨. UX 허용치 검토 필요 (§9).

---

## 6. user 테이블 연동

- `group_info.host_user_no` → `user.user_no` (FK, NOT NULL)
- `group_member.user_no` → `user.user_no` (FK, NULL 허용 — 과거 게스트용이었으나 게스트 폐기됨)
- user 행 생성 시점: `SsoUserRegistrationService.register()` 36-71 — **학심정 첫 로그인 시** sp_user_id 기준 자동 생성 (role_code, tc_id/stdt_id 채번 포함)
- §3에서 본 대로 동기화 핸들러가 **로그인 전 학생/교사의 user 행을 선제 생성**해야 함 (✅ 확정 — `provisioned='Y'` 마커, `02-schema-and-mapping.md` §7). `SsoUserRegistrationService`는 로그인 컨텍스트(SpAuthenticatedUser) 의존이므로 **publicUserId+역할만으로 생성하는 신규 메서드** 필요 (`03-sync-design.md` §4)
- ⚠️ 역방향 충돌: 프로비저닝된 학생이 나중에 **학심정 첫 로그인** 시 `SsoUserRegistrationService.register()`가 신규 INSERT를 시도하면 `sp_user_id` UNIQUE 충돌 → **기존 행 재사용 + provisioned='N' 전환**으로 수정 필요
- 탈퇴 cascade(`SsoUserWithdrawalService` 44-57)는 그대로 유효: 회원 탈퇴 시 `group_member.withdrawByUserNo`(WITHDRAWN) + `group_info.deactivateByHostUserNo`. 단 Auth 쪽도 purge 시 CASCADE 삭제 → 주기 재동기화가 양쪽 잔차를 정리

---

## 7. 정원/출석번호

| 항목 | 현재 | 전환 후 |
|---|---|---|
| `max_member_count` 정원 체크 (`joinGroupAsPlayer` 143-145) | 학심정이 합류 시 검사 | **Auth가 검사** (합류 자체가 Auth에서 발생). RP 응답에 maxMemberCount 없음 → 학심정 컬럼은 DEFAULT 잔존(미사용). 검사 로직 소멸 |
| `member_no` 출석번호 (`joinGroupAsPlayer` 192-193, MAX+1) | 합류 시 채번, 멤버 목록 `ORDER BY member_no` | Auth에 개념 없음 → **동기화 핸들러가 신규 멤버에 MAX+1 채번 유지** (조회 정렬 호환) |

---

## 8. invite_code

- 채번: `IdGenerator.generateInviteCode()` (UUID 앞 6자) — `createGroup()` 폐기와 함께 소멸
- `group_info.invite_code`는 **NOT NULL + UNIQUE** — 그런데 **RP 응답에 Auth inviteCode가 없음** → 동기화 INSERT가 불가능해지는 스키마 충돌
- 처리: `02-schema-and-mapping.md` §2 — 컬럼 NULL 허용으로 완화(권장) 또는 더미 채번
- 잔여 사용처는 전부 폐기 플로우(`findByInviteCodeAndUseYn`, 초대 메일) — 정리 시 함께 제거

---

## 9. Frontend / Prototype 영향

`frontend/src/features/groups/api/groupService.ts` 기준 (prototype도 동일 구조):

| FE 함수 | 호출 API | 전환 후 |
|---|---|---|
| `createGroup`(173) `updateGroup`(255) `deleteGroup`(273) | 쓰기 API | **제거** → mypage 링크/이동으로 대체 |
| `joinGroup`(335) `getGroupByInviteCode`(282) | 합류 | **제거** → mypage |
| `sendEmailInvitation`(431) `getGroupInvitations`(455) `cancelEmailInvitation`(488) | 초대 | **제거** → mypage |
| `kickMember`(399) `leaveGroup`(414) | 멤버 관리 | **제거** → mypage |
| `getMyGroups`(210) `getGroupDetail`(222) | 읽기 | **유지** (데이터 출처만 동기화 테이블로 바뀜 — FE 무감지) |
| `joinGroupAsGuest`(363) `getGuestGroupInfo`(309) | 게스트 | 이미 폐기된 영역 — 잔존 코드 정리 |

화면: `GroupListPage.tsx`(목록 — 생성 버튼 제거), `GroupDetailPage.tsx`(상세 — 초대/강퇴/수정/삭제 UI 제거), `JoinGroupPage.tsx`(**페이지 폐기**). 그룹 관리 진입점은 mypage URL로 연결.

> FE 변경 규모는 회원 PII 전환 때의 FE 변경 사례와 유사 — 별도 FE 작업 항목으로 분리 권장.

---

## 10. Admin 영향

`GroupQueryMapper.xml`의 Admin 쿼리(`findAdminGroupList` 97- 등)는 읽기 전용 → **유지**. 단 Admin에서 그룹을 수정/비활성하는 기능이 있다면(현재 조회만 확인됨) Auth 원본과 충돌하므로 금지로 명문화.

---

## 11. 영향 요약 매트릭스

| 영역 | 영향도 | 작업 |
|---|---|---|
| GroupController/Service 쓰기 12종 | 🔴 폐기 | API 제거 + FE 연동 해제 |
| 동기화 신규 (스냅샷/피드/재동기화) | 🔴 신규 | `03-sync-design.md` |
| user 선제 생성 (ensureUser) | 🔴 신규 | tc_id/stdt_id 채번 포함 |
| 알림 4종 | 🟡 이전 2 / 미결 1 / 갭 1 | T1·S5 이전, T2 미결, S4 갭 |
| activeDgnss 자동 등록 | 🟡 이전 | MEMBER_ADD 핸들러로 |
| 검사/메모/상담/생기부 (cla_id/stdt_id 소비) | 🟢 무변경 | 동기화가 식별자 공급을 보장하면 됨 |
| 그룹 읽기 API (/list /detail) | 🟢 무변경 | |
| group_invitation 테이블/코드 | 🔴 폐기 | 별도 Phase DROP |
| invite_code 컬럼 | 🟡 완화 | NOT NULL 해제 |
| FE 그룹 관리 화면 | 🔴 대거 수정 | 별도 작업 |
| sso_poll_cursor / 토큰 provider | 🟡 확장 | GROUP_CHANGES 행, groups:read scope |
