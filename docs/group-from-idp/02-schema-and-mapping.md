# Group from IDP — 02. 스키마 변경 & 필드 매핑

> `group_info` / `group_member`는 **유지**한다. Auth 데이터를 받기 위한 최소 컬럼 추가 + 제약 완화만 수행.

---

## 1. 스키마 변경 요약

| 테이블 | 변경 | 이유 |
|---|---|---|
| `group_info` | `sp_group_id BIGINT NULL UNIQUE` 추가 | Auth `groupId` 매핑 = 동기화 upsert 키. 레거시(학심정 생성) 행은 NULL |
| `group_info` | `invite_code` NOT NULL 해제 | RP 응답에 inviteCode 없음 — 동기화 INSERT 불가 충돌 해소 |
| `group_info` | `subject VARCHAR(50) NULL` 추가 (선택) | Auth 신규 필드 (과목). 표시용 |
| `group_info` | `grade` 의미 완화 (타입 변경 없음, VARCHAR(10)→VARCHAR(20) 검토) | Auth는 자유텍스트 "3학년" — §3.2 |
| `group_member` | (변경 없음 — 단 `user_no`를 upsert 키로 사용) | sp_user_id는 user 테이블 resolve 경유 (§4) |
| `group_invitation` | **폐기 예정** (Phase 분리, 백업 후 DROP) | Auth가 초대 소유 |
| `sso_poll_cursor` | `GROUP_CHANGES` 행 추가 + `last_since` DATETIME(6) 검토 | 변경 피드 커서. Auth `occurredAt`이 마이크로초 정밀도 |

## 2. DDL 초안

```sql
-- ============================================================
-- group-from-idp migration 01: 동기화 수신 준비 (롤백 가능 단계)
-- ============================================================

-- 1) Auth 그룹 매핑 키
ALTER TABLE group_info
    ADD COLUMN sp_group_id BIGINT NULL COMMENT 'Auth(IDP) group_info.id — 동기화 upsert 키. NULL=학심정 자체 생성(레거시)' AFTER cla_id,
    ADD UNIQUE KEY uk_group_sp_group_id (sp_group_id);

-- 2) invite_code 완화 (Auth 응답에 미포함)
ALTER TABLE group_info
    MODIFY COLUMN invite_code VARCHAR(20) NULL COMMENT '초대 코드 — Auth 이관 후 신규 그룹은 NULL (코드 합류는 mypage)';

-- 3) Auth 신규 필드 (표시용, 선택)
ALTER TABLE group_info
    ADD COLUMN subject VARCHAR(50) NULL COMMENT '과목 (Auth 자유텍스트)' AFTER class_number;

-- 4) grade 자유텍스트 수용 (Auth "3학년" 등)
ALTER TABLE group_info
    MODIFY COLUMN grade VARCHAR(20) NOT NULL COMMENT '학년 — 숫자 문자열 권장, Auth 원문은 파싱 실패 시 원문 저장';

-- 5) 변경 피드 커서 행
--    (last_since 컬럼이 DATETIME이면 DATETIME(6)로 정밀도 상향 권장 — 중복 수신 폭만 줄어듦, 필수는 아님)
ALTER TABLE sso_poll_cursor
    MODIFY COLUMN last_since DATETIME(6) NULL COMMENT '다음 폴링 since (마이크로초 정밀도)';

-- 6) 미로그인 사용자 프로비저닝 마커 (§7)
ALTER TABLE `user`
    ADD COLUMN provisioned CHAR(1) NOT NULL DEFAULT 'N'
        COMMENT 'Y=그룹 동기화로 선제 생성(학심정 미로그인). 보유 근거=그룹 멤버십. 첫 로그인 시 N 전환, 멤버십 소멸 시 재동기화가 행 삭제';

INSERT INTO sso_poll_cursor (feed_type, last_since, last_polled_at, last_item_count)
VALUES ('GROUP_CHANGES', NULL, NULL, 0)
ON DUPLICATE KEY UPDATE feed_type = feed_type;  -- 재실행 멱등
```

> `last_since=NULL`은 "부트스트랩 미완료" 표식으로 사용 — 부트스트랩 완료 시 첫 페이지 `currentSince`로 채움 (`03-sync-design.md` §3).

```sql
-- ============================================================
-- group-from-idp migration 02 (별도 Phase, Point of No Return):
-- 학심정 자체 초대 폐기 — 백업 후 실행
-- ============================================================
-- CREATE TABLE group_invitation_backup_2026xxxx AS SELECT * FROM group_invitation;
DROP TABLE IF EXISTS group_invitation;
```

---

## 3. 필드 매핑 — `group_info`

| Auth RP 응답 | 학심정 `group_info` | 변환 규칙 |
|---|---|---|
| `groupId` (BIGINT) | `sp_group_id` (신규) | 그대로. **upsert 키** |
| — | `cla_id` | **학심정 채번 유지** — 신규 그룹 INSERT 시 `IdGenerator.generateClaId()` (UUID32). 기존 행은 불변. 검사/메모/상담/생기부가 이 값에 결합 |
| `ownerPublicUserId` (UUID) | `host_user_no` | `user.sp_user_id`로 resolve → `user_no`. 미존재 시 **ensureUser(TEACHER)** 선제 생성 (`03-sync-design.md` §4) |
| `groupName` | `group_nm` | 그대로 (VARCHAR(100) 동일) |
| — | `group_desc` | Auth에 없음 → 신규 그룹 NULL, 기존 행 보존 |
| `schoolLevel` | `school_level` | **enum 매핑**: `ELEMENTARY`→`elementary`, `MIDDLE`→`middle`, `HIGH`→`high`, **`ETC`→ ⚠️ 매핑 불가** — §3.1 |
| `grade` ("3학년", nullable) | `grade` (NOT NULL) | **숫자 추출 파싱**: `"3학년"`→`"3"`. 파싱 실패/NULL → 원문 저장 또는 `"0"` — §3.2 |
| `classNo` ("5반", nullable) | `class_number` (INT NOT NULL) | **숫자 추출 파싱**: `"5반"`→`5`. 실패/NULL → `0` — §3.2 |
| `schoolCode` (NEIS, nullable) | `school_code` | 그대로. ⚠️ FK(`school_info.school_code`) 존재 — **미등록 코드면 NULL로 저장** (FK 위반 방지). school_info는 NEIS 기반이므로 대부분 일치 예상 |
| `schoolName` | `school_name` | 그대로 |
| `subject` (nullable) | `subject` (신규) | 그대로 |
| `status` (`ACTIVE`) | `use_yn` | `ACTIVE`→`'Y'`. `GROUP_DELETE` 이벤트→`'N'` (기존 deleteGroup과 동일 — 멤버 행은 불변, 조회가 use_yn 조인이라 자연 제외) |
| `updatedAt` | `updated_at` | 참고용 (학심정 컬럼은 ON UPDATE 자동) |
| `memberCount` | — | 파생값, 미저장 |
| — | `invite_code` | 신규 그룹 NULL (§2). 기존 행 보존 |
| — | `invite_link_token` | NULL 유지 (폐기 흐름) |
| — | `max_member_count` | DEFAULT 유지 (정원 검사는 Auth 책임 — 학심정 미사용) |
| — | `created_by`/`updated_by` | `0` (system) — 기존 컨벤션 |

### 3.1 ⚠️ `schoolLevel=ETC` 매핑 불가

학심정 `SchoolLevel` enum(elementary/middle/high)은 검사 로직(`SchoolLevel.fromCode(...).getLegacyGrade()` — `GroupService.registerActiveDgnssIfNeeded` 259)에 사용된다. Auth의 `ETC`(대학·특수학교 등)는 대응값이 없음.

선택지:
- (a) `etc` 값을 학심정 enum에 추가하되 **검사 자동 등록은 skip** (검사 학교급 매핑 불가) — 권장
- (b) ETC 그룹은 동기화 자체를 skip — 교사 화면에서 그룹이 안 보이는 부작용
- → 정책 결정 필요 (`03-sync-design.md` §9 미결 #3)

### 3.2 ⚠️ grade/classNo 자유텍스트

Auth는 자유텍스트("3학년", "5반", 혹은 "사랑반" 같은 비정형)를 허용한다. 학심정은 `grade` 숫자 문자열 + `class_number` INT를 가정한 코드가 있을 수 있다.

- 파싱 규칙: 정규식 `\d+` 첫 매치 추출. `"3학년"`→3 ✅, `"5반"`→5 ✅, `"사랑반"`→실패
- 실패 시: `grade`는 **원문 저장**(표시 호환), `class_number`는 `0`
- 검사 grade 파라미터는 `school_level`에서 유도(`getLegacyGrade`)하므로 **grade 컬럼 파싱 실패가 검사를 깨지는 않음** (확인됨 — `registerActiveDgnssIfNeeded` 259)
- 전수 확인 필요: grade/class_number를 숫자로 가정하고 연산하는 다른 코드 존재 여부 → 현재 조사 범위에선 표시/정렬 용도만 확인됨

---

## 4. 필드 매핑 — `group_member`

| Auth `members[]` | 학심정 `group_member` | 변환 규칙 |
|---|---|---|
| `publicUserId` (UUID) | `user_no` | `user.sp_user_id` resolve → 미존재 시 **ensureUser(STUDENT)** 선제 생성 (stdt_id 채번 포함). **upsert 키 = (group_id, user_no)** — 기존 UK `uk_gm_group_user` 그대로 활용 |
| — | `stdt_id` | **ensureUser가 보장** — user.stdt_id를 복사 (기존 `joinGroupAsPlayer` 201과 동일 패턴) |
| `name` | ❌ **미저장** | PII 미저장 정책 + Auth 거버넌스(표시 목적 외 활용 금지). 읽기 시 `UserInfoEnricher` 유지. 알림 발행 시에만 일회성 사용 가능 |
| `status` (`ACTIVE`) | `status` | `ACTIVE`→`ACTIVE`. **MEMBER_REMOVE / 명단에서 사라짐 → `KICKED`** (Auth REMOVED=교사 제거 ≈ 학심정 KICKED) — §4.1 |
| `joinedAt` | `joined_at` | 그대로 |
| `updatedAt` | — | 미저장 (참고용) |
| — | `member_type` | `'STUDENT'` 고정 (게스트 폐기됨, Auth도 학생만 멤버) |
| — | `member_no` (출석번호) | **학심정 채번 유지** — 신규 INSERT 시 `MAX(member_no)+1` (기존 192-193 로직 이전). 멤버 목록 정렬 호환 |
| — | `created_by`/`updated_by` | `0` (system) |

### 4.1 상태 매핑표

| Auth 상태/이벤트 | 학심정 `group_member.status` | 비고 |
|---|---|---|
| `ACTIVE` (스냅샷/상세) | `ACTIVE` | 신규 INSERT 또는 비ACTIVE→재활성 |
| `MEMBER_REMOVE` 이벤트 | `KICKED` + `left_at=NOW()` | 교사 제거. S5 알림 발행 지점 |
| 스냅샷/상세 명단에서 사라짐 (이벤트 없이) | `KICKED` 처리 | 전체 교체 시. (Auth REMOVED 멤버는 스냅샷에 안 옴) |
| (Auth 측 회원 purge — CASCADE 삭제) | 주간 재동기화에서 정리 | 변경 이벤트 미생성 구간 |
| `WITHDRAWN` (학심정 자체 — SSO 탈퇴 cascade) | 유지 | `SsoUserWithdrawalService` 기존 동작과 공존. 재동기화 시 Auth 스냅샷에 없으면 그대로 비활성 유지 |
| `LEFT` (자발 탈퇴) | **신규 발생 경로 없음** | Auth에 self-leave 없음. 기존 LEFT 행은 보존 |

---

## 5. 레거시(학심정 자체 생성) 그룹과의 공존

- `sp_group_id IS NULL` = 레거시 행, `IS NOT NULL` = 동기화 행
- **동기화 로직은 sp_group_id 기반으로만 작동** — 레거시 행을 절대 건드리지 않음 (일간 전체 재동기화의 "스냅샷에 없으면 삭제" 규칙도 `sp_group_id IS NOT NULL` 범위로 한정)
- 기존 데이터 거취 (미결 — `03-sync-design.md` §9):
  - (a) 레거시 그룹은 읽기 전용으로 동결, 교사가 mypage에서 신규 생성 (데이터 이관 없음)
  - (b) 기존 그룹을 Auth로 backfill (Auth팀과 이관 절차/책임 협의 필요)
  - 어느 쪽이든 **cla_id가 보존되므로 기존 검사/상담/메모 데이터는 안전**. (b)의 경우 backfill된 Auth 그룹과 레거시 행을 잇는 매핑 작업(sp_group_id 채움)이 추가로 필요

---

## 6. 시퀀스 요약 (upsert 알고리즘 의사코드)

```
upsertGroupFromRp(rp):                          # rp = RP 응답 그룹 객체
    g = groupInfoMapper.findBySpGroupId(rp.groupId)
    hostUserNo = ensureUser(rp.ownerPublicUserId, TEACHER).userNo
    if g == null:
        INSERT group_info(sp_group_id=rp.groupId, cla_id=generateClaId(),
                          host_user_no=hostUserNo, group_nm, school_level=map(rp.schoolLevel),
                          grade=parseGrade(rp.grade), class_number=parseClassNo(rp.classNo),
                          school_code=fkSafe(rp.schoolCode), school_name, subject,
                          invite_code=NULL, use_yn='Y', created_by=0)
    else:
        UPDATE 필드들 (cla_id/sp_group_id 불변)
    syncMembers(g, rp.members)

syncMembers(g, rpMembers):
    locals = groupMemberMapper.findByGroupId(g.groupId)          # 전체 (status 무관)
    for m in rpMembers (status==ACTIVE):
        u = ensureUser(m.publicUserId, STUDENT)                  # user 행 + stdt_id 보장
        gm = locals.find(user_no == u.userNo)
        if gm == null:
            INSERT group_member(group_id, user_no=u.userNo, stdt_id=u.stdtId,
                                member_type='STUDENT', member_no=MAX+1,
                                status='ACTIVE', joined_at=m.joinedAt)
            → publish StudentJoinedGroupEvent (T1)               # 실제 INSERT 시에만
            → registerActiveDgnssIfNeeded(g.claId, g.schoolLevel, u.stdtId)
        elif gm.status != 'ACTIVE' and gm.status != 'WITHDRAWN':
            UPDATE status='ACTIVE', left_at=NULL
            → publish StudentJoinedGroupEvent (T1)
            → registerActiveDgnssIfNeeded(...)
    for gm in locals (status=='ACTIVE'):
        if gm.user_no not in rpMembers.resolvedUserNos:
            UPDATE status='KICKED', left_at=NOW()
            → publish StudentKickedEvent (S5)                    # 실제 전이 시에만

ensureUser(publicUserId, role):
    u = userMapper.findBySpUserId(publicUserId)
    if u != null: return u                                       # (role 불일치 시 로그만 — 변경 안 함)
    id = (role==TEACHER) ? generateTcId() : generateStdtId()
    INSERT user(sp_user_id, role_code=role, tc_id|stdt_id=id, status='ACTIVE',
                provisioned='Y', created_by=0)                   # §7 프로비저닝
    return user
```

> 멱등성: 모든 분기가 "현재 상태와 다를 때만 변경+알림" — 변경 피드 중복 전달(안전 지연 5초 경계)을 자연 흡수.

---

## 7. 미로그인 사용자 프로비저닝 (✅ 확정 2026-06-11)

mypage에서 그룹에 합류한 학생(또는 그룹 소유 교사)은 **학심정에 로그인한 적 없는 상태**로 동기화에 도착할 수 있다.
→ ensureUser가 **user 행을 선제 INSERT**한다 (`provisioned='Y'`).

### 정책 근거 (검토 결론)

- 저장되는 것은 **가명 식별자 매핑뿐** (`sp_user_id`, `role_code`, `tc_id`/`stdt_id`) — user 테이블에 PII 컬럼 자체가 없음 (Phase 4 DROP 완료)
- 동의 없는 학생의 식별자 보유는 **group_member에 이미 불가피** (동기화의 목적) — user 행 추가가 민감도를 높이지 않음
- 보유 근거는 Auth 거버넌스가 명시한 **그룹 멤버십** (per-RP 동의와 무관)
- 학심정의 핵심 민감정보(심리검사 결과)는 **학생이 직접 응시해야만 생성** — 프로비저닝 행 자체는 민감정보를 만들지 않음
- 검토했던 대안(late binding — user 행을 만들지 않고 group_member에 sp_user_id 직접 보관, 첫 로그인 시 결합)은 스키마 수술(upsert 키 변경, host_user_no 완화, stdt_id 입양, DELETION 핸들러 확장)이 큰 데 비해 실익이 없어 기각

### 라이프사이클

| 시점 | 동작 |
|---|---|
| 동기화 — 명단의 학생/소유 교사가 user에 없음 | INSERT `provisioned='Y'` (tc_id/stdt_id 채번 포함) |
| **첫 로그인 (=동의)** | `SsoUserRegistrationService`가 sp_user_id 기존 행 발견 → **신규 생성하지 않고 재사용** + `provisioned='N'` 전환. ⚠️ 이 합류 로직이 없으면 sp_user_id UNIQUE 충돌로 첫 로그인 500 |
| 통합회원 탈퇴 +30일 | **기존 DELETION 폴링 cascade가 그대로 처리** (`applyWithdraw` → markWithdrawn + 멤버십 정리) — 수정 불필요 |
| 그룹에서 빠짐 (탈퇴는 안 함) | 일간 전체 재동기화가 정리(03 §5): `provisioned='Y'` AND ACTIVE 멤버십 0건 → **user 행 삭제** (보유 근거 소멸 = 데이터 소멸) |
| REVOCATION(연결끊기) | provisioned 행엔 발생 불가 (연결한 적 없음) — 해당 없음 |
