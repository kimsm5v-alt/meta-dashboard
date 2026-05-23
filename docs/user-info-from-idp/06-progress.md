# IDP 회원정보 API 전환 — 진행 상황

**브랜치**: `feature/user-info-from-idp` (vs-develop 분기, 미푸시)
**spec**: `04-design.md`
**plan**: `05-plan.md`
**작업 시작**: 2026-05-22 (주말)

---

## Phase 1 — 인프라 ✅ 완료

| Task | 제목 | 커밋 | 상태 |
|:---:|:---|:---|:---:|
| 1 | HasUserInfo 인터페이스 + UserInfo record | `264d645` | ✅ |
| 2 | ServiceAccessTokenProvider + AuthApiException + yml internal-api | `98e913e` | ✅ |
| 3 | PersonInfoClient + Impl + Config (RestClient, 100건 chunking) | `725e573` | ✅ |
| 4 | PersonInfoRequestCache (@RequestScope) | `c46de18` | ✅ |
| 5 | UserInfoEnricher + 5 단위 테스트 | `f75e3f3` | ✅ |

**검증**:
- `UserInfoEnricherTest` 5/5 passing
- spec compliance + code quality review 모두 ✅
- **Auth API spec 일치 확인** (`superplatform-auth/docs/guide/api-reference/api-spec.md`): client_credentials grant, /users/batch 응답(users + notFound), Bearer 인증 모두 일치

---

## Phase 2 — 게스트 영역 폐기 ⏳ 진행 중

| Task | 제목 | 커밋 | 상태 | 비고 |
|:---:|:---|:---|:---:|:---|
| 6 | BE 게스트 코드 삭제 (api/guest, mapper/guest, GuestConversionLog) + SecurityConfig | `99e9457` | ✅ | GroupService.joinGroupAsGuest + GroupController POST /group/join-guest 동반 제거 |
| 7 | EmailVerification 폐기 (Controller/Service/Mapper/Domain/XML/Test) + SecurityConfig | `81bf69c` | ✅ | GroupService dead field + GroupServiceTest dead test 동반 제거 |
| ~~8~~ | ~~FE 게스트 영역 삭제~~ | (skipped) | 🚫 | **사용자 영역 외** — 별도 PR 또는 FE 담당자 진행 |
| 9 | DB 게스트 데이터 삭제 + 테이블 DROP | (적용 대기) | ⏳ | SQL: `migrations/01-guest-cleanup.sql` |

### Task 9 — DB 적용 이력

| 환경 | 실행 일시 | 실행자 | guest_member 삭제 | 비고 |
|:---|:---|:---|:---:|:---|
| 로컬 (podman) | _대기_ | - | - | - |
| dev | _대기_ | - | - | - |
| prod | _대기_ | - | - | - |

### Phase 2 잔여 정리 (orphan dead code, Phase 4 또는 후속 정리)
- `GroupMemberMapper.updateGuestToStudent`, `findActiveGuestByGroupIdAndEmail`
- `GroupQueryMapper.findGuestMembersByEmail`
- `SecurityUtil.isGuestAuthenticated`, `getCurrentGuestId`

---

## Phase 3 — 응답 조합 layer 적용 ⏳ 예정

| Task | 제목 | 상태 |
|:---:|:---|:---:|
| 10 | User 도메인 + UserMapper SELECT 정리 (PII 컬럼 미선택) | ⏳ |
| 11 | MemberInfoDto + MemberController/Service enrich | ⏳ |
| 12 | GroupService 멤버 목록/상세 enrich (가장 큰 영향) | ⏳ |
| 13 | GroupInvitationService initiator enrich | ⏳ |
| 14 | CounselingService stdt_name enrich | ⏳ |
| 15 | DgnssService 검사 보고서 enrich (DgnssMapper 30+ 라인) | ⏳ |
| 16 | AiBugReportService nested UserSlot enrich (reporter+resolver) | ⏳ |
| 17 | SsoUserQueryService 동기화 로직 제거 + Registration 정리 | ⏳ |
| 18 | FileMapper 등 잔재 정리 + Phase 3 통합 검증 | ⏳ |

---

## Phase 4 — DDL DROP (Point of No Return) ⏳ 예정

| Task | 제목 | 상태 |
|:---:|:---|:---:|
| 19 | 운영 DB 사전 백업 | ⏳ |
| 20 | user 테이블 email/nickname/gender DROP | ⏳ |
| 21 | group_member 테이블 nickname/email/gender DROP | ⏳ |
| 22 | counseling_student.stdt_name DROP | ⏳ |
| 23 | Domain 필드 제거 + Mapper 잔재 최종 정리 | ⏳ |
| 24 | 최종 DB 검증 (PII 0건 확인) | ⏳ |

---

## Phase 5 — 프론트엔드 정리 🚫 **본 작업 범위 외**

| Task | 제목 | 상태 |
|:---:|:---|:---:|
| ~~25~~ | ~~User 타입 정리 + UserName placeholder 컴포넌트~~ | 🚫 사용자 영역 외 |
| ~~26~~ | ~~영향 컴포넌트 매핑 수정 (~30 파일)~~ | 🚫 사용자 영역 외 |

→ FE 담당자가 별도 PR로 진행 또는 별도 일정 협의.

---

## Phase 6 — 검증 ⏳ 예정

| Task | 제목 | 상태 |
|:---:|:---|:---:|
| 27 | WireMock 기반 통합 테스트 | ⏳ |
| 28 | 개발 서버 시나리오 검증 (7개 + 부하) | ⏳ |
| 29 | CLAUDE.md 갱신 + 최종 정리 | ⏳ |

---

## 후속 작업 (별도 PR)

- **tc_id / stdt_id → sp_user_id 통일** (04-design.md §10.1) — 본 PR 완료 후 5~8주 별도 작업

---

## 환경 정보

### Working copy 변경 (커밋 안 함, 로컬 setup)
- `backend/src/main/resources/application-local.yml` — Boot 4 부팅용 cloud.aws/neo4j IPv6
- `frontend/package.json`, `package-lock.json` — 누락 deps 보강
- `frontend/.env.development.local` — VITE_API_URL=localhost:8081 (.gitignore)

### Podman 컨테이너 (PC 재부팅 시 `podman machine start` + `podman start mysql-meta redis-meta neo4j-meta` 필요)
- `mysql-meta` MySQL 8.3.0 — host 5006
- `redis-meta` Redis 7-alpine — host 6379
- `neo4j-meta` Neo4j 5 — bolt 7687, browser 7474
