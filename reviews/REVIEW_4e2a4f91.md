# 코드 리뷰 - 4e2a4f91

## 코드 복잡도 분석

변경된 파일의 복잡도 정보를 찾을 수 없습니다.
(인덱스가 생성되지 않았거나 새로운 파일일 수 있습니다)

---



## 변경 배경

이 커밋은 `docs/group-from-idp/04-data-migration.md` 문서의 A1 섹션(학심정 DB export)에 대한 SQL 쿼리 변경입니다. 학심정 DB에서 Auth로 그룹 데이터를 이관(backfill)할 때, `sp_user_id`가 NULL인 레거시 행(회원 전환 전 데이터)을 export에서 자동 제외하도록 필터 조건을 추가하였습니다.

- **목적**: `sp_user_id`가 없는 레거시 행을 이관 대상에서 제외하여, Auth가 식별 불가능한 데이터가 넘어가지 않도록 방지
- **변경 방향**: 기존 `use_yn='Y'` 단일 조건에서 `sp_user_id IS NOT NULL` + `status='ACTIVE'` 조건으로 강화하여 V2(호스트 매핑불가), V3(교사 멤버), V4(sp 없는 멤버)를 자동 필터링

## 변경사항 요약

두 개의 export SQL 쿼리(groups.csv, members.csv)에 필터 조건이 추가되었습니다:

1. **groups.csv**: `hu.sp_user_id IS NOT NULL AND hu.status = 'ACTIVE'` 조건 추가
2. **members.csv**: 호스트 조건 재적용(제외된 그룹의 멤버 보호) + `mu.role_code = 'STUDENT'` + `mu.sp_user_id IS NOT NULL` 조건 추가

---

## [ISSUE] 발견된 이슈

**없음.** SQL 쿼리 변경 사항은 명확한 정책(2026-06)에 근거하며, 다음과 같은 이유로 적절합니다:

### 1. groups.csv — 호스트 필터의 정확성

```sql
-- 변경 전
WHERE gi.use_yn = 'Y';

-- 변경 후
WHERE gi.use_yn = 'Y'
  AND hu.sp_user_id IS NOT NULL
  AND hu.status = 'ACTIVE';
```

- `sp_user_id IS NOT NULL`: 회원 전환 전 레거시 호스트(탈퇴자 포함)를 정확히 제외
- `status = 'ACTIVE'`: 비활성 호스트의 그룹도 함께 제외 (이중 안전장치)
- V2(매핑 불가 호스트) 검증 쿼리와 조건이 일치하여 검증-export 간 불일치 없음

### 2. members.csv — 호스트 조건 재적용의 안전성

```sql
-- 변경 전
SELECT gi.cla_id, mu.sp_user_id AS member_public_user_id, gm.joined_at
  FROM group_member gm
  JOIN group_info gi ON gi.group_id = gm.group_id AND gi.use_yn = 'Y'
  JOIN `user` mu ON mu.user_no = gm.user_no
 WHERE gm.status = 'ACTIVE';

-- 변경 후
SELECT gi.cla_id, mu.sp_user_id AS member_public_user_id, gm.joined_at
  FROM group_member gm
  JOIN group_info gi ON gi.group_id = gm.group_id AND gi.use_yn = 'Y'
  JOIN `user` hu ON hu.user_no = gi.host_user_no
                 AND hu.sp_user_id IS NOT NULL AND hu.status = 'ACTIVE'
  JOIN `user` mu ON mu.user_no = gm.user_no
 WHERE gm.status = 'ACTIVE'
   AND mu.role_code = 'STUDENT'
   AND mu.sp_user_id IS NOT NULL;
```

- **호스트 조건 재적용(hu JOIN)**: groups.csv에서 제외된 그룹의 멤버가 members.csv에 딸려나오는 것을 방지. 이는 `group_info`의 `use_yn='Y'` 조건만으로는 부족한 경우(호스트는 비활성이나 그룹은 아직 `use_yn='Y'`인 엣지 케이스)를 대비한 안전장치
- **`mu.role_code = 'STUDENT'`**: V3(교사 멤버)를 정확히 제외. Auth는 교사의 멤버 합류를 403 차단하므로, 이 조건이 없으면 import 시 오류 발생
- **`mu.sp_user_id IS NOT NULL`**: V4(sp 없는 멤버) 제외. 회원 전환 전 레거시 멤버 데이터를 걸러냄

### 3. 검증 기준 명시

> 이관 후 검증(STEP 5 backfill·STEP 6 부트스트랩)의 대조 기준은 V1 전체 건수가 아니라 **이 필터를 통과한 migratable 건수**다 (제외분만큼 차이남 — 정상).

이 주석은 운영자가 검증 시 혼동하지 않도록 제외된 데이터만큼 건수 차이가 발생하는 것이 정상임을 명확히 알려줍니다. V1(전체 대상)과 export 결과의 차이가 버그가 아니라 정책에 의한 의도된 차이임을 문서화한 점이 좋습니다.

---

## [CHECK] 확인 사항

- [x] 문법 오류 없음 (SQL 구문 정상, 모든 JOIN 조건 올바름)
- [x] 명백한 버그 없음 (세 가지 이슈 V2/V3/V4를 단일 쿼리로 일괄 처리)
- [x] 기본적인 코드 스타일 준수 (주석으로 정책 근거 명시)

---

## 최종 평가

**결론**: 
- [x] [OK] **승인 (Approved)**

**코멘트:**
SQL export 쿼리에 `sp_user_id IS NOT NULL`, `status='ACTIVE'`, `role_code='STUDENT'` 조건을 추가하여 V2/V3/V4 레거시 데이터를 자동 제외하도록 개선한 문서 변경입니다. 특히 members.csv에서 호스트 조건을 재적용(`JOIN user hu`)하여 제외된 그룹의 멤버가 딸려오는 것을 방지한 점이 안전장치로서 적절합니다. 검증 기준을 migratable 건수로 명시하여 운영자의 혼란을 방지한 것도 좋은 문서화입니다. 별도의 데이터 클렌징 없이 동일 필터를 prod에서도 사용 가능하다는 정책도 명확합니다.