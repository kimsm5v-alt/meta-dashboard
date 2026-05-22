# 영향도 매핑 — 자동 추출 결과

**기준 시점**: 2026-05-22
**추출 도구**: Grep
**범위**: backend/src/main/java, backend/src/main/resources/mapper, frontend/src

---

## 1. 백엔드 도메인 클래스 — 필드 제거 대상

| 파일 | 제거 대상 필드 | 비고 |
|:---|:---|:---|
| `domain/User.java:17,18` | `email`, `nickname` | sp_user_id만 남김 |
| `domain/GroupMember.java:20,21` | `nickname`, `email` | gender는 유지 |
| `domain/GroupInvitation.java:16` | `email` | 초대 흐름 재설계 결정 필요 |
| `domain/CounselingStudent.java:15` | `stdtName` | 이력 보존 결정 필요 |

**유지 (제거 대상 아님)**:
- `EmailVerification.java:15` — 게스트 이메일 인증 (유지)
- `AdminAccount.java:15,17` — Admin 별도 테이블 (유지)

---

## 2. 백엔드 Java 호출 위치 (15곳)

### 2.1 SsoUserQueryService.java (5곳)

라인 52, 54, 61, 62, 71 — **SSO 로그인 시 JWT email/name을 user 테이블에 동기화하는 로직**.

```java
if (nicknameChanged) user.setNickname(spUser.name());  // line 61
if (emailChanged)    user.setEmail(spUser.email());    // line 62
```

→ **이 동기화 로직 자체 제거 대상** (DB에 안 저장하므로). SSO 첫 로그인 시 user 생성도 sp_user_id만 저장.

### 2.2 MemberService.java + MemberController.java (4곳)

`MemberService.java:45,46`, `MemberController.java:57,58` — `/member/info` 응답에 email/nickname 포함.

```java
result.put("email", user.getEmail());
result.put("nickname", user.getNickname());
```

→ **Auth API 호출로 대체**. `/member/info`에서 sp_user_id로 Auth `/api/v1/users/{publicUserId}` 호출 후 응답 조합.

### 2.3 GroupService.java (8곳)

라인 166, 167, 186, 197, 198, 223, 416, 473 — **그룹 멤버 비정규화 복사 + 알림 메시지 닉네임**.

```java
existing.setNickname(user.getNickname());  // 166 — group_member 동기화
existing.setEmail(user.getEmail());        // 167
.nickname(user.getNickname())              // 197 — INSERT 시 복사
.email(user.getEmail())                    // 198
publishStudentJoined(groupInfo, user.getNickname());  // 223 — 알림 메시지
member.getNickname()                       // 416 — 표시용
host.getNickname()                         // 473 — 방장 닉네임
```

→ **비정규화 INSERT/UPDATE 제거** (group_member.nickname/email 컬럼 자체 제거되므로). **알림 메시지의 닉네임은 publish 시점에 Auth 호출 필요**.

### 2.4 GroupInvitationService.java:127 (1곳)

```java
map.put("email", inv.getEmail());  // 초대 응답에 email 포함
```

→ **초대 흐름 재설계 결정 필요** (group_invitation.email 자체 처리).

### 2.5 GuestAuthService.java:100 (1곳)

```java
String nickname = guest.getNickname();
```

→ **게스트는 Auth에 계정 없음** — 본 작업의 게스트 처리 결정에 따라 다름.

### 2.6 CounselingService.java:354 (1곳)

```java
sm.put("name", s.getStdtName());  // 상담 학생 이름
```

→ **이력성 데이터 결정에 따라**.

### 2.7 (영향 없음) AdminUserDetailsService.java:28

```java
admin.getEmail()  // admin_account 테이블 — 별도, 영향 없음
```

---

## 3. 백엔드 MyBatis XML — 매퍼별 영향

### 3.1 DgnssMapper.xml — 가장 큰 영향 (30+ 라인)

라인 244, 457, **1002 (`gm.nickname AS MEM_NM`)**, 1679, 1705~3762 (다수).

**패턴**:
- `gm.nickname AS MEM_NM` — 검사 보고서/대시보드 학생 이름 표시
- `COALESCE(gm.nickname, tdri.stdt_id)` — 닉네임 없으면 stdtId 표시 (fallback)
- `IFNULL(gm.nickname, '')` — 빈 처리
- `tu.nickname AS tcNm` — 교사 닉네임 (1939)
- `gm.email AS email` — 이메일 노출 (1956)

→ **본 매퍼가 가장 광범위 수정 대상**. 모든 nickname/email 컬럼 SELECT 제거 + 응답 조합 단계에서 Auth batch 호출.

### 3.2 GroupMemberMapper.xml (15라인)

라인 10, 11, 24, 58, 59, 67, 68, 92, 97, 102, 120, 121, 124 — **resultMap, INSERT, UPDATE, SELECT 전반**.

→ **컬럼 자체 제거**. CRUD 쿼리 전부 수정.

### 3.3 GroupQueryMapper.xml (15라인)

라인 39, 40, 73, 96, 97, 103 (`WHERE gm.email = #{email}`), 128, 129, 137, 138 (LIKE 검색), 160, 161, 192, 193, 206, 207.

→ **그룹 목록/상세 쿼리 전반 수정**. **`OR u.nickname LIKE / u.email LIKE` (라인 137, 138, 160, 161)는 Java 호출 0건 = dead query → 정리 시 제거 대상**.

### 3.4 UserMapper.xml (8라인)

라인 8, 9, 22, 30, 37, 68, 87, 100, 101, 108, 109 — **user 테이블 CRUD 전반**.

→ resultMap에서 email/nickname 제거, INSERT/UPDATE 컬럼 제거. **라인 68, 87의 `email/nickname LIKE` 검색은 Java 호출 0건 = dead query → 정리 시 제거 대상**.

### 3.5 AiBugReportMapper.xml (4라인)

라인 76, 77, 78, 79, 106, 107 — `reporter.email, reporter.nickname, resolver.email, resolver.nickname` JOIN.

→ **reporter_no/resolver_no(user_no)로 ID만 SELECT + 응답 조합 시 Auth batch 호출**.

### 3.6 GroupInvitationMapper.xml (4라인)

라인 8, 22, 24, 44 — **`email` 컬럼 INSERT/SELECT**.

→ 초대 흐름 재설계 결정에 따라 컬럼 제거 또는 publicUserId 저장 방식 변경.

### 3.7 CounselingStudentMapper.xml (3라인)

라인 9, 16, 44 — `stdt_name` resultMap + INSERT.

→ 이력성 데이터 결정에 따라.

### 3.8 FileMapper.xml (2라인)

라인 45, 158 — `gm_st.nickname` JOIN.

→ nickname 컬럼 제거 시 자연 수정 대상.

### 3.9 (영향 없음, 유지)
- `AdminAccountMapper.xml` — Admin 테이블
- `EmailVerificationMapper.xml` — 게스트 이메일 인증

---

## 4. 프론트엔드 영향 — 30+ 파일

`.email|.nickname|.name|stdtName|MEM_NM` 패턴 매치 (30 파일 + 추가 가능성).

> ⚠️ `.name`은 false positive 많음 (groupName, schoolName 등). 본 표는 **수정 가능성 있는 파일**의 단순 목록 — 구현 시점에 정확 매핑 필요.

| 영역 | 파일 (대표) | 변경 가능성 |
|:---|:---|:---|
| **타입 정의** | `shared/types/*` | User 타입에서 email/name 제거 (응답 DTO로 분리) |
| **인증** | `features/auth/model/AuthContext.tsx` | SDK getUser()와 별도로 학심정 user 데이터 분리 |
| **그룹** | `features/groups/api/groupService.ts` (11곳) | 그룹 멤버 응답 처리 변경 |
| **그룹** | `features/groups/ui/JoinCodeModal.tsx`, `GroupInviteModal.tsx`, `CreateGroupModal.tsx` | 이메일 입력/표시 |
| **검사** | `features/assessment/ui/AssessmentList.tsx`, `DataReviewTable.tsx`, `ExamStartPreviewModal.tsx` | 학생 이름 표시 |
| **학생 검사** | `features/student-exam/ui/StudentGroupsPage.tsx`, `MyResultPage.tsx`, `MyExamListPage.tsx` | 본인/그룹원 표시 |
| **게스트** | `features/guest-exam/ui/GuestExamListPage.tsx`, `GuestCompletePage.tsx`, `GuestExamCard.tsx` | 게스트 이름/이메일 |
| **상담/일정** | `features/schedule/ui/*` (5개) | 학생 이름 표시 |
| **대시보드** | `features/teacher-dashboard/`, `features/class-dashboard/`, `widgets/class-dashboard/` | 학생 목록 이름 |
| **AI** | `widgets/ai-room/AIRoomHeader.tsx` | 사용자 이름 |
| **assessment-v2** | `features/assessment-v2/ui/DeleteGroupModal.tsx` 등 | (assessment 신규 라인) |

총 **약 30개 파일, 77+ 라인** (head 30 기준). 전수 매핑은 구현 단계에서 보강.

---

## 5. Auth API 커버리지 검증 — **100% 커버**

| 학심정 사용 케이스 | 호출 위치 | Auth 매칭 API |
|:---|:---|:---|
| sp_user_id 단건 조회 (이름/이메일 표시) | DgnssMapper, GroupQueryMapper 등 SELECT 라인 다수 | `GET /api/v1/users/{publicUserId}` ✅ |
| 그룹 멤버 일괄 조회 (학급 30명) | GroupQueryMapper 멤버 목록, DgnssMapper 보고서 | `POST /api/v1/users/batch` (100건) ✅ |
| **이메일 정확 매칭** (5곳) | SsoUserMigrationService, EmailVerificationService, GroupInvitationService, GroupService:237, GuestAuthService:56 | `POST /api/v1/users/lookup` (service AT) ✅ |

**dead query (Admin 폐기 잔재)**: UserMapper LIKE 2곳 + GroupQueryMapper LIKE 4곳 — Java 호출 0건. **이름/이메일 LIKE 검색 기능 자체가 학심정에 없음** → Auth에 LIKE API 신규 요청 **불필요**.

→ **Auth가 이미 제공하는 3개 API로 모든 사용 케이스 100% 커버**.

| 부가 확인 | Auth 제공 여부 |
|:---|:---:|
| 탈퇴/익명화된 사용자 표시 (`notFound[]`) | ✅ (batch 응답에 포함) |
| 30일 grace 중 WITHDRAWN 사용자 lookup 응답 (`resumeAt`) | ✅ |
| hard purge 완료된 사용자 | ✅ 404 (단건) / `notFound[]` (배치) |

---

## 6. 영향 규모 추정 (수정 라인 단위)

| 영역 | 라인 수 추정 |
|:---|:---:|
| 백엔드 Java | ~30라인 (실제 매치) + DTO/매핑 추가 분 |
| MyBatis XML | **~80라인** (DgnssMapper 30+, GroupMember 15, GroupQuery 15, User 8, 기타) |
| 도메인 클래스 | 4개 클래스, 약 8필드 |
| 프론트엔드 | **~80라인 + 30 파일** |
| **신규 코드 (PersonInfoClient + 캐시 등)** | **~300~500라인** |
| DDL/마이그레이션 | ~5개 ALTER TABLE + 데이터 이관 검증 |

**총 작업량**: 일정 추정 시 분석서의 "5~8주" 추정과 일치. 본 작업은 주말 + 평일 분산 작업 권장.

---

## 7. 결정 항목과의 연결

| 결정 항목 (00-overview 4장) | 영향 라인 |
|:---|:---|
| **A. 캐시 정책** | PersonInfoClient 구현 방식 결정 — 모든 호출 라인 영향 |
| **B. 게스트 처리** | GuestAuthService.java:100, GroupMember의 게스트 nickname/email 라인 |
| **C. 이력성 데이터** | CounselingStudentMapper.xml 3라인, GuestConversionLogMapper |
| **D. Admin 검색** | ~~LIKE 6라인~~ → 학심정에서 사용 안 함 (dead query). **결정 항목에서 제외**. |
| **E. group_invitation.email** | GroupInvitationService.java:127, GroupInvitationMapper.xml 4라인 |
| **F. PersonInfoClient 아키텍처** | 모든 백엔드 응답 라인의 변경 패턴 결정 |
