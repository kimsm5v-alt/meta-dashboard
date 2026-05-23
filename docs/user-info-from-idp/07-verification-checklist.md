# 개발 서버 시나리오 검증 체크리스트 (Task 28 / Phase 6)

> Phase 1~3 + Phase 6 Task 27 (WireMock 통합 테스트) 완료 이후, **실제 Auth 서버와 연동된 dev 환경**에서 회귀를 검증하는 체크리스트입니다.
>
> **선행 조건**: feature/user-info-from-idp 브랜치 dev 배포 + Auth dev (`https://api-auth-dev.visangschool.com` 가정) 동작 중.

---

## 0. 사전 점검

| 항목 | 확인 방법 | OK |
|:---|:---|:---:|
| dev 서버 기동 | `curl -i https://api-meta-dev.visangschool.com/actuator/health` → 200 + `"status":"UP"` | ☐ |
| Auth Internal API 도달성 | dev 서버에서 `curl -i $AUTH_BASE_URL/oauth2/token` → 401 (인증 미부착 시 정상 응답) | ☐ |
| Service Account credentials 주입 | dev 서버 환경변수 `SP_AUTH_CLIENT_ID`, `SP_AUTH_CLIENT_SECRET` 존재 | ☐ |
| application yml `sp-auth.internal-api.base-url` | dev 값 = `https://api-auth-dev.visangschool.com/api/v1` | ☐ |
| JWKS 검증 | dev SSO 로그인 토큰으로 `/member/info` 200 | ☐ |
| 로그 수준 | `com.vs.meta.common.auth` 패키지 INFO 이상 | ☐ |

---

## 1. 시나리오 체크리스트 (7개)

각 시나리오는 ① 실행, ② 기대값 일치, ③ 로그/Auth 호출 수 확인 3단계로 검증.

### 시나리오 1 — 그룹 멤버 목록 조회 (30명 규모)

- **준비**: `member_type='STUDENT'` 30명을 보유한 group_info 1건 (dev 데이터 활용)
- **호출**: `GET /group/{groupId}/members?page=1&size=30` (교사 토큰)
- **기대**:
  - HTTP 200
  - 30명 모두 `nickname` / `email` 키가 응답에 포함
  - 응답 시간 p95 baseline + 200ms 이내 (Step 3 부하 검증과 함께)
- **로그 확인**:
  - `[PersonInfoClient] /users/batch 호출 1회` (chunk size 100 이내라 1회만)
  - 같은 요청 안에서 host nickname/email 도 동일 batch 응답에서 enrich (PersonInfoRequestCache dedup)
- **OK**: ☐

### 시나리오 2 — 그룹 멤버 1명 탈퇴 후 목록

- **준비**: 시나리오 1의 그룹에서 학생 1명의 sp_user_id 를 **Auth dev 에서 의도적으로 제거** (또는 처음부터 존재하지 않던 sp_user_id 행 INSERT)
- **호출**: 동일 멤버 목록 API
- **기대**:
  - HTTP 200 (학심정 자체는 살아있음)
  - 해당 멤버 자리의 `nickname` 값이 `"(탈퇴 회원)"`, `email` 은 null
  - 그 외 29명은 정상
- **로그 확인**:
  - `/users/batch` 응답의 `notFound` 배열에 해당 sp_user_id 1건 포함
  - WARN 또는 INFO 로그 1줄 (사용자 미존재 안내)
- **OK**: ☐

### 시나리오 3 — 검사 결과 보고서 (학급 30명)

- **준비**: 30명 학급의 DGNSS 검사 1건 (`tc_id` + `stdt_id` 정상 데이터)
- **호출**: `GET /dgnss/report/{reportId}` 또는 `GET /file/dgnss/list?...` 중 dev 에 데이터가 살아있는 endpoint
- **기대**:
  - HTTP 200
  - 30명 학생 이름이 모두 표시 (학생 nickname 또는 stdtName 필드)
  - `gm.nickname` 이 GROUP_CONCAT 으로 들어가는 3개 라인(`DgnssMapper.xml:1710/1720/1730/1792/1802/1812/3020`)도 응답에 정상 출력 — **Phase 4 DROP 전까지는 이 라인 동작 보장**
- **로그 확인**: `/users/batch` 호출 1~2회 (chunk size 100 이내)
- **OK**: ☐

### 시나리오 4 — 상담 기록 조회 (1년 이상 전 데이터)

- **준비**: dev DB 에서 1년 이상 된 counseling_info + counseling_student 행을 가진 교사
- **호출**: `GET /counseling/{id}` 또는 목록 API
- **기대**:
  - HTTP 200
  - 학생 이름이 정상 표시 (Auth 에 살아있으면 실제 이름, 아니면 placeholder `"(탈퇴 회원)"`)
- **OK**: ☐

### 시나리오 5 — 초대 이메일 발송 (회원 대상)

- **준비**: Auth 에 등록된 임의 회원 email
- **호출**: `POST /group/{groupId}/invitations` body `{"email": "<existing@user>"}`
- **기대**:
  - HTTP 200/201
  - 응답에 invitation row + `inviteeUserNo` 자동 매핑 (또는 응답 후속 enrich)
- **로그 확인**: `/users/lookup` 호출 1회 + 200 응답
- **OK**: ☐

### 시나리오 6 — 초대 이메일 발송 (비회원 대상)

- **준비**: Auth 에 등록 안 된 email (개인 mailbox 등)
- **호출**: 동일 endpoint, 비회원 email
- **기대**:
  - HTTP 200/201
  - `group_invitation.email` 컬럼에 입력 email 그대로 저장
  - `inviteeUserNo` 는 null (미매핑)
- **로그 확인**: `/users/lookup` 호출 1회 + 404 → Optional.empty 후 정상 분기
- **OK**: ☐

### 시나리오 7 — Auth 서버 일시 차단 → 페이지 로딩 동작

- **준비**: dev 환경 방화벽 또는 Auth dev 점검으로 Internal API 일시 차단 (방법: 로컬 hosts 로 Auth base-url 을 막거나, dev 인프라 담당에게 일시 차단 요청)
- **호출**: 시나리오 1 의 그룹 멤버 목록 API
- **기대**:
  - HTTP **200** (학심정 자체는 살아있음)
  - 모든 멤버 `nickname` = `"(탈퇴 회원)"`, `email` = null (PersonInfoClient placeholder fallback)
- **로그 확인**:
  - `WARN com.vs.meta.common.auth.PersonInfoClientImpl - Auth API 호출 실패 ...`
  - 5xx/timeout/IOException 메시지 출력
- **차단 해제 후**: 같은 API 재호출 → 정상 enrich 복귀
- **OK**: ☐

---

## 2. 부하 검증 (Step 3)

기준: prod 배포 전 dev 환경에서 회귀 baseline 확인. 도구는 [k6](https://k6.io/) 또는 `hey` 권장. 인증 토큰은 dev SSO 로 발급한 단일 사용자 토큰 1개로 충분.

### 검증 시나리오

| # | 시나리오 | 기준 | 측정값 |
|:---:|:---|:---|:---|
| L1 | 그룹 멤버 30명 응답 시간 (50 VUs × 60s) | p95 = baseline + 200ms 이내 | _기재_ |
| L2 | 같은 그룹 멤버 목록을 한 요청 안에서 여러 번 호출하는 endpoint (RequestCache dedup) | Auth `/users/batch` 호출 1회만 | _기재_ |
| L3 | 그룹 멤버 150명 (chunking 검증) | Auth `/users/batch` 자동 호출 2회 (100+50) | _기재_ |

### k6 스크립트 샘플 (L1)

```js
// k6 run --vus 50 --duration 60s scripts/loadtest-group-members.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export default function () {
  const res = http.get('https://api-meta-dev.visangschool.com/group/12345/members?page=1&size=30', {
    headers: {
      Authorization: `Bearer ${__ENV.TOKEN}`,
    },
  });
  check(res, {
    'status 200': (r) => r.status === 200,
    'has members': (r) => JSON.parse(r.body).data.list.length > 0,
  });
  sleep(1);
}
```

### baseline 측정 방법

main 브랜치(미반영) dev 환경에서 동일 스크립트 실행 → p95 기록 → 본 브랜치 배포 후 비교.
baseline 측정 불가 시 절대값 기준 사용 (p95 < 1.5s).

---

## 3. RequestCache & Chunking 동작 직접 확인

부하 환경 없이 단발 호출로도 검증 가능.

| 확인 항목 | 방법 | 기대 |
|:---|:---|:---|
| RequestCache dedup (한 요청 안 같은 sp_user_id 중복) | reporter + resolver 가 같은 사용자인 AiBugReport 1건 상세 조회 (`GET /admin/bug-reports/{id}`) | `/users/batch` 호출 1회만 (캐시 hit) |
| 100건 초과 자동 chunking | 학년 단위 큰 그룹(120+명) 멤버 목록 호출 | `/users/batch` 호출 2회 (100 + 잔여) |
| RequestScope 분리 | 두 번째 동일 API 요청 | `/users/batch` 다시 호출됨 (요청 간 격리) |

---

## 4. 회귀 영향도 (FE 호환성)

본 브랜치는 FE 가 사용하는 응답 키 (`nickname`, `email`, `hostNickname`, `hostEmail`, `stdtName`) 를 모두 보존합니다. 그래도 dev 환경에서 FE 와 함께 1회 손동작 확인 권장.

| 화면 | 확인 항목 | OK |
|:---|:---|:---:|
| 마이페이지 | 회원 이름/이메일 표시 | ☐ |
| 학급(그룹) 상세 | 멤버 목록 이름 + 호스트 이름 표시 | ☐ |
| 검사 결과 보고서 | 학생 이름 표시 | ☐ |
| 상담 기록 | 학생 이름 표시 | ☐ |
| AI 버그리포트 상세 | reporter + resolver 이름 표시 | ☐ |

---

## 5. 결과 기록 (실행 후 채워서 06-progress.md 에 사본 첨부)

| 항목 | 일시 | 실행자 | 결과 | 비고 |
|:---|:---|:---|:---|:---|
| 시나리오 1~7 | _기재_ | _기재_ | _/7 통과_ | |
| 부하 L1 (p95) | _기재_ | _기재_ | _ms (baseline 대비 +___ms)_ | |
| 부하 L2 (dedup) | _기재_ | _기재_ | _Auth 호출 ___ 회_ | |
| 부하 L3 (chunking) | _기재_ | _기재_ | _Auth 호출 ___ 회_ | |
| FE 호환성 손동작 | _기재_ | _기재_ | _/5 화면_ | |

---

## 6. 알려진 우려 / 후속 조치

- `PersonInfoClientImpl.getOne()` 404 처리는 현재 `body(Map.class)` 가 null 을 반환 → `toUserInfo(null)` 에서 NPE → outer catch 가 placeholder 로 회수하는 경로로 동작 (WireMock 통합 테스트로 확인). 동작은 정확하지만 의도가 흐릿하므로 후속 PR 에서 `.onStatus(...)` 람다에 명시적인 placeholder 반환을 추가하는 정리 권장.
- DgnssMapper GROUP_CONCAT 3개 라인 (`xml:1710/1720/1730/1792/1802/1812/3020`) 은 Phase 4 DDL DROP 전까지는 `gm.nickname` 컬럼 의존. Phase 4 진행 시 응답 후처리 또는 sp_user_id 기반 enrich 로 전환 필요.
- Task 28 실행 전 Task 9 (게스트 DB cleanup) 가 dev/prod 각 환경에서 적용되어 있어야 시나리오 6 의 결과가 명확함.
