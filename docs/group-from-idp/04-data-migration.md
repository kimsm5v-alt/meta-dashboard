# Group from IDP — 04. 기존 그룹 데이터 → Auth 마이그레이션(backfill) 분석

> 질문: 학심정 DB에 이미 있는 `group_info`/`group_member` 데이터를 IDP(Auth) 쪽으로 이관할 수 있는가?
> **결론: 가능하다.** 회원 PII 전환이 완료돼 있어 식별자 매핑이 성립하기 때문. 단 전제조건 4개와 freeze window 가 필요하다.

---

## 1. 왜 가능한가 — 식별자 매핑이 성립

마이그레이션의 성패는 "학심정 그룹의 사람들을 Auth가 알아볼 수 있느냐"인데:

```
group_info.host_user_no ──→ user.sp_user_id ──→ Auth platform_user.public_user_id  ✅
group_member.user_no    ──→ user.sp_user_id ──→ Auth platform_user.public_user_id  ✅
```

회원 전환(`feature/user-info-from-idp`)이 끝나 **모든 활성 사용자가 sp_user_id 를 보유** — Auth 가 100% resolve 가능.

**예외 (자동으로 무해함)**: 탈퇴자는 `markWithdrawn` 이 sp_user_id 를 NULL 로 비워 매핑 불가. 그러나
- 탈퇴 호스트의 그룹은 이미 `use_yn='N'` (탈퇴 cascade) → 이관 대상(활성 그룹) 아님
- 탈퇴 멤버십은 WITHDRAWN → 이관 대상(ACTIVE 멤버) 아님

→ **ACTIVE 만 이관**하면 매핑 실패 케이스가 구조적으로 없음.

## 2. 필드 매핑 — 학심정 → Auth (역방향)

### group_info → Auth group_info

| 학심정 | Auth | 변환 |
|---|---|---|
| `group_nm` | `group_name` | 그대로 |
| `school_level` (elementary/middle/high) | `school_level` (ELEMENTARY/MIDDLE/HIGH) | 대문자 매핑 — 1:1, ETC 케이스 없음 ✅ |
| `grade` ("3") | `grade` (자유텍스트) | 그대로 가능 (Auth 가 자유텍스트라 "3"도 유효). 표시 통일 원하면 "3학년" 가공 |
| `class_number` (5) | `class_no` (자유텍스트) | "5" 또는 "5반" |
| `school_code` / `school_name` | 동일 | 그대로 (둘 다 NEIS 기반) |
| — | `subject` | NULL (학심정에 없음) |
| `use_yn='Y'` | `status=ACTIVE` | N 은 이관 제외 |
| `host_user_no` | `owner_user_id` | sp_user_id 경유 resolve |
| `invite_code` | `invite_code` | ⚠️ **재채번 필요** — §4 충돌 #1 |
| `max_member_count` | (Auth 정원) | Auth 정원 정책 확인 후 매핑 또는 기본값 |
| `cla_id` | ❌ Auth 에 없음 | **manifest 로 보존** — §3 |
| `group_desc`, `member_no`(출석번호) | ❌ Auth 에 없음 | 학심정에 잔존 (이관 안 함 — 무손실) |

### group_member → Auth group_member

| 학심정 | Auth | 변환 |
|---|---|---|
| `user_no` | `user_id` | sp_user_id 경유 resolve |
| `status=ACTIVE` | `status=ACTIVE` | **ACTIVE 만 이관** (LEFT/KICKED/ARCHIVED/WITHDRAWN 은 학심정 이력으로만 보존) |
| `joined_at` | `joined_at` | 그대로 |
| — | `join_source` | 학심정에 없음 → `'CODE'` 일괄 (마이그레이션 표식 값 협의 가능) |

## 3. 실행 경로 — 누가 어떻게 (핵심: manifest)

**Auth RP API 는 읽기 전용**이라 학심정이 직접 밀어넣을 방법이 없음 → Auth 팀의 import 가 필요:

```
① 학심정: export 추출 (JSON — 그룹+ACTIVE 멤버, sp_user_id 기준)        [학심정]
② Auth: import 스크립트 — tenant_id 부여, owner/member resolve,
        invite_code 재채번, group_change_log 기록 없이 직접 적재          [Auth팀]
③ Auth: ★ 매핑 manifest 반환 — { claId ↔ 신규 Auth groupId } 목록        [Auth팀]
④ 학심정: manifest 로 기존 행에 sp_group_id backfill UPDATE              [학심정]
⑤ 학심정: GROUP_SYNC_ENABLED=true → 부트스트랩
```

**③ manifest 가 전체의 핵심**입니다. Auth 스키마에 cla_id 가 없으므로, "어느 Auth 그룹이 어느 학심정 그룹인지"는 import 도구만 알 수 있음 → 반드시 산출물로 받아야 ④ 가 가능. (대안: Auth import 가 한시적으로 external_ref 컬럼/파라미터를 받아주면 manifest 불요 — Auth 팀 협의)

**⑤ 가 안전한 이유**: backfill 후 부트스트랩의 `findBySpGroupId` 가 **기존 행을 찾아 UPDATE** → 새 행을 만들지 않음 → **cla_id 불변**. 멤버도 같은 데이터의 왕복이라 (group_id, user_no) 매치 → no-op upsert.

## 4. 발견된 충돌/엣지 3가지

| # | 충돌 | 내용 | 처리 |
|---|---|---|---|
| 1 | **invite_code 문자셋** | 학심정 코드 = UUID 앞 6자 hex (0/1 포함). Auth 규칙 = A-Z0-9 에서 **0/O/1/I 제외** + tenant 내 UNIQUE → 기존 코드 다수가 Auth 규칙 위반 | Auth 가 import 시 **재채번**. 기존 안내된 코드는 무효 — 전환 후 합류는 mypage 신규 코드라 실질 영향 없음 (학생 공지만) |
| 2 | **교사 멤버 행** | Auth 는 교사의 멤버 합류를 403 차단. 학심정 group_member 에 role_code=TEACHER 사용자가 멤버로 들어간 행이 있으면 import 거부됨 | 사전 검증 쿼리(§5 V3)로 전수 확인 → 있으면 제외 목록 협의 |
| 3 | **이중 생성 (운영 리스크)** | freeze 없이 진행하면 교사가 mypage 에서 같은 반을 새로 만들어 중복 그룹 발생 | **freeze window 필수** — §6 절차 + 교사 공지 ("X일까지 그룹 생성은 기존 학심정에서만/금지") |

## 5. 사전 검증 쿼리 (이관 가능성 점검 — 운영 DB에서 실행)

```sql
-- V1. 이관 대상 규모
SELECT COUNT(*) AS active_groups FROM group_info WHERE use_yn='Y';
SELECT COUNT(*) AS active_members FROM group_member gm
  JOIN group_info gi ON gi.group_id = gm.group_id AND gi.use_yn='Y'
 WHERE gm.status='ACTIVE';

-- V2. 매핑 불가 호스트 (0건이어야 정상 — 탈퇴 cascade 가 잘 돌았다면)
SELECT gi.group_id, gi.cla_id FROM group_info gi
  JOIN `user` u ON u.user_no = gi.host_user_no
 WHERE gi.use_yn='Y' AND (u.sp_user_id IS NULL OR u.status <> 'ACTIVE');

-- V3. 교사 멤버 행 (Auth 403 충돌 — 0건 확인 필요)
SELECT gm.id, gm.group_id, gm.user_no FROM group_member gm
  JOIN `user` u ON u.user_no = gm.user_no
 WHERE gm.status='ACTIVE' AND u.role_code <> 'STUDENT';

-- V4. sp_user_id 없는 ACTIVE 멤버 (0건이어야 정상)
SELECT gm.id FROM group_member gm
  JOIN `user` u ON u.user_no = gm.user_no
 WHERE gm.status='ACTIVE' AND u.sp_user_id IS NULL;
```

## 6. Cutover 절차 (freeze window — 새벽/점검 시간 권장)

| 순서 | 작업 | 주체 | 검증 |
|---|---|---|---|
| 0 | §5 사전 검증 (V2~V4 = 0건) | 학심정 | |
| 1 | 학심정 그룹 쓰기 차단 (P4 폐기 배포 또는 점검 모드) | 학심정 | 쓰기 API 4xx |
| 2 | export 추출 (§7 E1) | 학심정 | 건수 = V1 |
| 3 | Auth import + invite_code 재채번 | Auth팀 | Auth 측 건수 일치 |
| 4 | manifest 수령 → sp_group_id backfill (§7 B1) | 학심정 | backfill 건수 = V1 그룹 수 |
| 5 | `GROUP_SYNC_ENABLED=true` → 부트스트랩 | 학심정 | 보정 0건에 수렴 (기존 행 no-op upsert) |
| 6 | FE 전환 배포 (그룹 관리 → mypage) | 학심정 | |

롤백 포인트: ④ 까지는 학심정 DB 영향이 sp_group_id 컬럼뿐 — `UPDATE group_info SET sp_group_id=NULL` 로 즉시 롤백 가능. ⑤ 이후는 동기화가 돌기 시작하므로 플래그 off + Auth 측 import 데이터 삭제 협의.

## 7. SQL 초안

```sql
-- E1. export (학심정 → Auth 전달용 JSON 변환 전 원천)
SELECT gi.cla_id, gi.group_nm, gi.school_level, gi.grade, gi.class_number,
       gi.school_code, gi.school_name, gi.max_member_count,
       hu.sp_user_id AS owner_public_user_id,
       gm.joined_at, mu.sp_user_id AS member_public_user_id
  FROM group_info gi
  JOIN `user` hu ON hu.user_no = gi.host_user_no
  LEFT JOIN group_member gm ON gm.group_id = gi.group_id AND gm.status='ACTIVE'
  LEFT JOIN `user` mu ON mu.user_no = gm.user_no
 WHERE gi.use_yn='Y'
 ORDER BY gi.group_id, gm.member_no;

-- B1. backfill (manifest 적용 — manifest 를 임시 테이블로 적재 후)
-- CREATE TEMPORARY TABLE mig_manifest (cla_id VARCHAR(64) PRIMARY KEY, sp_group_id BIGINT NOT NULL);
-- LOAD ... (Auth 팀 manifest)
UPDATE group_info gi
  JOIN mig_manifest m ON m.cla_id = gi.cla_id
   SET gi.sp_group_id = m.sp_group_id, gi.updated_by = 0
 WHERE gi.sp_group_id IS NULL;
```

## 8. 이관(B안) vs 동결(A안) — 이관이 우월한 이유

| | **B안: backfill 이관** | A안: 동결 + mypage 재생성 |
|---|---|---|
| 검사/상담/메모/생기부 이력 | ✅ **연속** — sp_group_id 가 기존 행에 붙어 cla_id 불변 | ❌ 단절 — 새 그룹 = 새 cla_id, 기존 이력은 옛 그룹에 고립 |
| 학생 행동 | 없음 (멤버십 그대로 이관) | 전원 재합류 필요 (새 코드/초대) |
| 교사 행동 | 없음 | 전 그룹 수동 재생성 |
| 필요 작업 | Auth import 스크립트 + manifest + freeze | 없음 (방치) |
| 리스크 | invite_code 재채번, freeze 협의 | 운영 혼란 (두 그룹 체계), 이력 단절 민원 |

→ **B안(이관) 권장.** 데이터 연속성이 학심정의 핵심 가치(검사 이력)와 직결되고, 기술적 충돌은 §4 세 개뿐이며 전부 처리 가능.

## 부록 A. 순수 SQL 이관 경로 (Auth DB 직접 적재 — Auth 담당자 실행)

> import 스크립트 없이 **쿼리만으로** 이관하는 경로. Auth DB 에 직접 INSERT 하므로
> 앱 불변식(교사 멤버 차단·코드 규칙)을 우회한다 — 검증 쿼리(A2)로 반드시 대체할 것.
> 전제: Auth DB 백업 완료, freeze window 내 실행, `@tenant` = 학심정 tenant_id 확인.

### A1. 학심정 DB — export (CSV 2개)

```sql
-- groups.csv
SELECT gi.cla_id, gi.group_nm, gi.school_level, gi.grade, gi.class_number,
       gi.school_code, gi.school_name, hu.sp_user_id AS owner_public_user_id, gi.created_at
  FROM group_info gi
  JOIN `user` hu ON hu.user_no = gi.host_user_no
 WHERE gi.use_yn = 'Y';

-- members.csv (ACTIVE 만)
SELECT gi.cla_id, mu.sp_user_id AS member_public_user_id, gm.joined_at
  FROM group_member gm
  JOIN group_info gi ON gi.group_id = gm.group_id AND gi.use_yn = 'Y'
  JOIN `user` mu ON mu.user_no = gm.user_no
 WHERE gm.status = 'ACTIVE';
```

### A2. Auth DB — 스테이징 + 검증

```sql
CREATE TABLE mig_group_stage (
    cla_id               VARCHAR(64) PRIMARY KEY,
    group_name           VARCHAR(100) NOT NULL,
    school_level         VARCHAR(20)  NOT NULL,   -- 학심정 소문자 그대로 적재 후 본적재 시 UPPER()
    grade                VARCHAR(20)  NULL,
    class_no             VARCHAR(20)  NULL,
    school_code          VARCHAR(10)  NULL,
    school_name          VARCHAR(100) NULL,
    owner_public_user_id VARCHAR(64)  NOT NULL,
    created_at           DATETIME     NOT NULL,
    invite_code          VARCHAR(8)   NULL,
    UNIQUE KEY uk_stage_code (invite_code)
);
CREATE TABLE mig_member_stage (
    cla_id                VARCHAR(64) NOT NULL,
    member_public_user_id VARCHAR(64) NOT NULL,
    joined_at             DATETIME    NULL,
    PRIMARY KEY (cla_id, member_public_user_id)
);
-- LOAD DATA LOCAL INFILE 'groups.csv' / 'members.csv' 적재

-- [검증 1] owner resolve 실패 — 0건이어야 진행
SELECT s.cla_id FROM mig_group_stage s
  LEFT JOIN platform_user pu ON pu.public_user_id = s.owner_public_user_id
 WHERE pu.id IS NULL;

-- [검증 2] member resolve 실패 — 0건이어야 진행
SELECT m.cla_id, m.member_public_user_id FROM mig_member_stage m
  LEFT JOIN platform_user pu ON pu.public_user_id = m.member_public_user_id
 WHERE pu.id IS NULL;

-- [검증 3] 교사 멤버 (Auth 불변식: 교사는 멤버 불가 — 앱이면 403, SQL 은 통과하므로 직접 차단)
SELECT m.cla_id, m.member_public_user_id FROM mig_member_stage m
  JOIN platform_user pu ON pu.public_user_id = m.member_public_user_id
 WHERE pu.user_type = 'TEACHER';   -- 발견 시 해당 행 제외 협의

-- [검증 4] owner 가 교사인지 (그룹은 교사 소유)
SELECT s.cla_id FROM mig_group_stage s
  JOIN platform_user pu ON pu.public_user_id = s.owner_public_user_id
 WHERE pu.user_type <> 'TEACHER';
```

### A3. Auth DB — invite_code 재채번 (Auth 규칙: A-Z0-9 에서 0/O/1/I 제외 32자, tenant 내 UNIQUE)

```sql
SET @cs = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
-- 채번 (충돌 시 NULL 로 비우고 이 블록 재실행 — 수렴할 때까지)
UPDATE mig_group_stage
   SET invite_code = CONCAT(
        SUBSTRING(@cs, FLOOR(1 + RAND()*32), 1), SUBSTRING(@cs, FLOOR(1 + RAND()*32), 1),
        SUBSTRING(@cs, FLOOR(1 + RAND()*32), 1), SUBSTRING(@cs, FLOOR(1 + RAND()*32), 1),
        SUBSTRING(@cs, FLOOR(1 + RAND()*32), 1), SUBSTRING(@cs, FLOOR(1 + RAND()*32), 1))
 WHERE invite_code IS NULL;

-- 기존 Auth 코드와 충돌분 비우기 → 위 UPDATE 재실행 (보통 1~2회로 수렴)
UPDATE mig_group_stage s
  JOIN group_info g ON g.tenant_id = @tenant AND g.invite_code = s.invite_code
   SET s.invite_code = NULL;
SELECT COUNT(*) AS remaining FROM mig_group_stage WHERE invite_code IS NULL;  -- 0 이면 다음 단계
```

### A4. Auth DB — 본 적재 + manifest

```sql
-- 그룹 적재 (grade/class_no 는 Auth 가 자유텍스트라 학심정 값 그대로도 유효 — 표시 통일 시 '학년'/'반' 접미)
INSERT INTO group_info (tenant_id, owner_user_id, status, school_name, school_level,
                        school_code, grade, class_no, subject, group_name, invite_code,
                        created_at, updated_at)
SELECT @tenant, pu.id, 'ACTIVE', s.school_name, UPPER(s.school_level),
       s.school_code, s.grade, s.class_no, NULL, s.group_name, s.invite_code,
       s.created_at, NOW()
  FROM mig_group_stage s
  JOIN platform_user pu ON pu.public_user_id = s.owner_public_user_id;

-- ★ manifest — 재채번 invite_code 가 상관키 (Auth 에 cla_id 컬럼이 없는 문제의 SQL 해법)
SELECT g.id AS sp_group_id, s.cla_id
  FROM group_info g
  JOIN mig_group_stage s ON s.invite_code = g.invite_code
 WHERE g.tenant_id = @tenant;
-- → manifest.csv 로 추출, 학심정에 전달

-- 멤버 적재
INSERT INTO group_member (group_id, user_id, status, join_source, joined_at, created_at, updated_at)
SELECT g.id, pu.id, 'ACTIVE', 'CODE', COALESCE(m.joined_at, NOW()), NOW(), NOW()
  FROM mig_member_stage m
  JOIN mig_group_stage s  ON s.cla_id = m.cla_id
  JOIN group_info g       ON g.tenant_id = @tenant AND g.invite_code = s.invite_code
  JOIN platform_user pu   ON pu.public_user_id = m.member_public_user_id
 WHERE pu.user_type <> 'TEACHER';   -- 검증 3 방어 중복

-- 건수 대조 (학심정 V1 과 일치 확인) 후 스테이징 정리
-- DROP TABLE mig_group_stage, mig_member_stage;
```

> ⚠️ 직접 INSERT 는 `group_change_log` 를 남기지 않는다 — **의도된 동작** (남기면 학심정 부트스트랩 직후
> 피드 폴링이 전 그룹을 재조회하는 무해한 소음 발생, §9 #12). 정원 검사도 우회되므로 필요 시 별도 점검.

### A5. 학심정 DB — backfill (manifest 적용)

```sql
CREATE TABLE mig_manifest (cla_id VARCHAR(64) PRIMARY KEY, sp_group_id BIGINT NOT NULL UNIQUE);
-- LOAD DATA LOCAL INFILE 'manifest.csv' 적재

UPDATE group_info gi
  JOIN mig_manifest m ON m.cla_id = gi.cla_id
   SET gi.sp_group_id = m.sp_group_id, gi.updated_by = 0
 WHERE gi.sp_group_id IS NULL;

-- 검증: backfill 건수 = 활성 그룹 수
SELECT COUNT(*) FROM group_info WHERE sp_group_id IS NOT NULL;
DROP TABLE mig_manifest;
```

이후 `GROUP_SYNC_ENABLED=true` → 부트스트랩이 backfill 된 행을 `findBySpGroupId` 로 찾아
**기존 행 no-op upsert** (cla_id 불변 = 검사/상담/메모 이력 연속). 신규 행 생성 없음을 보정 로그 0건으로 확인.

---

## 9. Auth팀 추가 요청사항 (03 §8 에 합산)

9. **그룹 bulk import 스크립트** 작성 가능 여부 + 일정 — export JSON 포맷 협의
10. import 시 **manifest(claId↔groupId) 반환** 또는 external_ref 수용
11. invite_code 재채번 정책 확인 (기존 코드 무효화 공지 문구 협의)
12. import 가 `group_change_log` 를 남기지 않는지 확인 — 남기면 부트스트랩 직후 피드 폴링이 전 그룹을 재조회하는 무해하지만 시끄러운 동작 발생
