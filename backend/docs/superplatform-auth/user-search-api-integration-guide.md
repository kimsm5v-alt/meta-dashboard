# RP 전달용 — 회원 조회 API 연동 가이드 (검색 + 상세)

- 작성: 2026-08-11
- 대상: 통합인증(auth)에서 **회원을 이름·이메일·닉네임으로 찾고, 이메일까지 확인해야 하는 RP**
- 요청: 학심정
- 이 문서는 **자족형**이다 — auth 저장소 접근 없이 이 문서만으로 연동할 수 있다

> **이 파일은 전달 사본이다. 여기서 수정하지 말 것.**
>
> 정본은 auth 팀이 관리한다 — `superplatform-auth` · `docs/20260811-RP-회원조회-API-연동가이드.md`.
> 내용이 틀렸거나 API 가 바뀐 것 같으면 **이 파일을 고치지 말고 auth 팀에 알려 주세요.**
> 여기서 고치면 정본과 갈라져 다음 사람이 어느 쪽이 맞는지 알 수 없게 됩니다.

---

## 0. 요약 — API 2종 + 토큰 1회

```
① POST /oauth2/token                    service AT 발급 (1시간, 캐시해서 재사용)
② GET  /api/v1/users/search             이름·이메일·닉네임 부분일치 → 후보 목록
③ POST /api/v1/users/batch              ★ 여러 건 상세 (최대 100) — 여기서 이메일 확인
   GET  /api/v1/users/{publicUserId}       단건 상세 (1명만 필요할 때)
```

**②의 응답에는 이메일이 없다.** 의도된 최소 응답이며, 이메일이 필요하면 ③을 호출한다.

> **검색 결과 여러 건의 이메일이 필요하면 반드시 `batch` 를 쓸 것.**
> 단건 조회를 후보 수만큼 반복하면 요청이 N 배로 늘고 PII 노출 구간도 그만큼 늘어난다.

| 호스트 | 환경 |
|--------|------|
| `https://t-auth-api.vschool.at` | 개발 |
| `https://auth-api.vschool.at` | 운영 (배포 시 재확인 권장) |

> **게이트웨이(`t-gw.vschool.at`)를 쓰지 않는다.** 이 API 들은 서버 간(S2S) 호출이고
> GW 경로는 브라우저 흐름용이다.

---

## 1. 사전 조건 — 클라이언트 등록 확인

auth 운영자에게 아래 두 값을 확인받아야 한다. **둘 다 동작에 직접 영향을 준다.**

| 항목 | 필요한 값 | 틀리면 |
|------|-----------|--------|
| `scopes` | **`users:read` 포함** | 토큰은 발급되지만 API 호출 시 **403** |
| `consent_required` | 아래 표 참조 | 검색 범위가 달라진다 |

### `consent_required` 가 결과 범위를 바꾼다

| 값 | 검색·조회 대상 |
|----|----------------|
| `true` | **우리 RP 가입자만** (active SERVICE 동의자). 다른 RP 가입자는 검색에 안 나오고 상세 조회는 404 |
| `false` | **같은 tenant 전체 회원** |

**어느 쪽이 우리 RP 의 의도인지 먼저 합의할 것.** `false` 면 검색어 없이 호출했을 때
전체 회원이 페이징으로 열린다(§6 ② 참조).

---

## 2. service AT 발급

`grant_type=client_credentials`. **1시간 TTL, refresh token 없음**(RFC 6749 §4.4.3).
만료되면 다시 발급한다.

```bash
curl -X POST 'https://t-auth-api.vschool.at/oauth2/token' \
  -u '<client_id>:<client_secret>' \
  -d 'grant_type=client_credentials'
```

클라이언트 인증은 RFC 6749 §2.3.1 대로 **두 방식 모두 지원**한다.

- `client_secret_basic` — 위 예시의 `-u` (**권장** · secret 이 URL·body 에 남지 않음)
- `client_secret_post` — body 에 `client_id`·`client_secret` 동봉

### 응답 — RFC 표준 형식이다 (snake_case)

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6InN1cGVycGxhdGZvcm0tYXV0aC0yMDI2MDgifQ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "users:read"
}
```

> **주의 — 이 응답만 `ApiResponse` 래퍼가 없다.** 토큰 엔드포인트는 RFC 규격을 따르므로
> `success`/`data` 로 감싸지지 않고 필드도 snake_case 다.
> 아래 회원 조회 API 들은 `{ "success": ..., "data": ... }` 래퍼 + camelCase 다.

`scope` 에 `users:read` 가 없으면 등록이 잘못된 것이다 — 이 시점에 확인하면 뒤에서 403 을 안 만난다.

---

## 3. API ① 검색 — `GET /api/v1/users/search`

이름·이메일·닉네임 **부분일치**로 후보를 찾는다.

```bash
curl -G 'https://t-auth-api.vschool.at/api/v1/users/search' \
  -H 'Authorization: Bearer <access_token>' \
  --data-urlencode 'keyword=김철수' \
  --data-urlencode 'status=ACTIVE' \
  -d 'page=0' -d 'size=20'
```

| 파라미터 | 필수 | 기본값 | 설명 |
|---|---|---|---|
| `keyword` | X | — | **이메일·이름·닉네임 부분일치** (소문자 비교). **비우면 검색 우회 = 전체 목록** |
| `status` | X | 전체 | `ACTIVE` · `SUSPENDED` · `WITHDRAWN` |
| `page` | X | `0` | 0-based |
| `size` | X | `20` | 페이지 크기 |

정렬은 **최근 가입순(`created_at DESC`) 고정**이다. 변경할 수 없다.

### 응답

```json
{
  "success": true,
  "message": null,
  "data": {
    "items": [
      {
        "publicUserId": "d0dd548c-8f3a-4c21-9b7e-1a2b3c4d5e6f",
        "name": "김철수",
        "nickname": "철수쌤",
        "userType": "TEACHER",
        "status": "ACTIVE"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

**필드는 5개뿐이고 이메일이 없다.** DB 기본키도 포함되지 않는다(의도적 — tenant 경계 보호).

### 동명이인 처리가 필요하다

이름은 유일하지 않다. `keyword=김철수` 는 동명이인을 모두 돌려준다.
응답에 이메일이 없으므로 **`userType`·`nickname` 으로 1차 구분**하고, 그래도 모호하면
후보별로 §4 를 호출해 이메일로 확정해야 한다.

---

## 4. API ② 상세 — 이메일을 확인하는 단계

**검색 결과가 여러 건이면 `batch`, 한 명이면 단건**을 쓴다.

### 4-1. 여러 건 — `POST /api/v1/users/batch` ★ 권장

`publicUserId` 를 **최대 100건**까지 한 번에 조회한다.

```bash
curl -X POST 'https://t-auth-api.vschool.at/api/v1/users/batch' \
  -H 'Authorization: Bearer <access_token>' \
  -H 'Content-Type: application/json' \
  -d '{"publicUserIds":["d0dd548c-8f3a-4c21-9b7e-1a2b3c4d5e6f","a1b2c3d4-...."]}'
```

응답은 **두 배열**로 나뉜다.

```json
{
  "success": true,
  "data": {
    "users": [
      { "publicUserId": "d0dd548c-...", "name": "김철수", "email": "chulsoo@school.edu",
        "userType": "TEACHER", "status": "ACTIVE", "maskedReason": "NONE" }
    ],
    "notFound": ["a1b2c3d4-...."]
  }
}
```

| 필드 | 내용 |
|---|---|
| `users` | 조회된 회원 — 각 항목은 §4-2 의 단건 응답과 같은 구조 |
| `notFound` | **찾지 못한 `publicUserId` 목록** |

> **`notFound` 를 반드시 확인할 것.** `consent_required=true` RP 면 **다른 RP 가입자도
> `notFound` 에 합쳐진다** — "없는 사용자" 와 "우리 RP 가입자가 아님" 이 구분되지 않는다.
> 요청 순서와 `users` 순서가 같다고 가정하지 말고 `publicUserId` 로 매칭할 것.

제약 — `publicUserIds` 는 **비어 있을 수 없고(`@NotEmpty`) 100건 초과 시 400** 이다.
검색 `size` 를 100 이하로 두면 페이지 하나가 batch 한 번에 대응된다.

### 4-2. 단건 — `GET /api/v1/users/{publicUserId}`

한 명만 필요할 때 쓴다.

```bash
curl 'https://t-auth-api.vschool.at/api/v1/users/d0dd548c-8f3a-4c21-9b7e-1a2b3c4d5e6f' \
  -H 'Authorization: Bearer <access_token>'
```

### 응답

```json
{
  "success": true,
  "data": {
    "publicUserId": "d0dd548c-8f3a-4c21-9b7e-1a2b3c4d5e6f",
    "name": "김철수",
    "nickname": "철수쌤",
    "email": "chulsoo@school.edu",
    "schoolName": "비상초등학교",
    "schoolGrade": "ELEMENTARY",
    "schoolCode": "B100000123",
    "profileImageUrl": "https://.../profile.png",
    "userType": "TEACHER",
    "status": "ACTIVE",
    "maskedReason": "NONE"
  }
}
```

### ⚠ `maskedReason` 을 반드시 확인할 것

`consent_required=true` RP 가 **동의하지 않은 사용자**를 조회하면 **200 으로 응답되지만 PII 가 비어 있다.**

```json
{
  "success": true,
  "data": {
    "publicUserId": "d0dd548c-...",
    "name": null, "nickname": null, "email": null,
    "schoolName": null, "schoolGrade": null, "schoolCode": null, "profileImageUrl": null,
    "userType": "TEACHER",
    "status": "ACTIVE",
    "maskedReason": "NOT_CONSENTED"
  }
}
```

| `maskedReason` | 의미 | RP 가 할 일 |
|---|---|---|
| `NONE` | 정상 — PII 제공 | 그대로 사용 |
| `NOT_CONSENTED` | 우리 RP 에 동의하지 않은 사용자 | 이름·이메일이 `null` — 화면에 빈 값이 뜨지 않게 처리 |
| `WITHDRAWN` | 탈퇴 사용자 | 동일 |

**404 가 아니라 200 이다.** 성공으로 흘려보내면 화면에 이름이 비어 보인다.
`name`·`email` 이 `null` 일 수 있다는 전제로 만들어야 한다.

---

## 5. 전체 흐름 예시

```js
const BASE = 'https://t-auth-api.vschool.at';
let token = null, tokenExpiresAt = 0;

async function getServiceToken() {
  // 1시간 TTL — 만료 60초 전까지 재사용
  if (token && Date.now() < tokenExpiresAt - 60_000) return token;

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${BASE}/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`,
               'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`토큰 발급 실패: ${res.status}`);

  const t = await res.json();                 // snake_case · 래퍼 없음
  token = t.access_token;
  tokenExpiresAt = Date.now() + t.expires_in * 1000;
  return token;
}

/** 래퍼 해제 + 401 1회 재시도 공통 처리. */
async function authCall(path, { params, body } = {}) {
  const url = new URL(BASE + path);
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const send = async () => fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${await getServiceToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let res = await send();
  if (res.status === 401) { token = null; res = await send(); }   // AT 만료 → 1회 재시도
  if (!res.ok) throw new Error(`${path} ${res.status}`);

  const json = await res.json();              // { success, message, data }
  if (!json.success) throw new Error(json.message ?? '조회 실패');
  return json.data;
}

/** 이름·이메일·닉네임으로 후보를 찾고, 이메일까지 채워 반환한다. */
async function findMembers(keyword) {
  if (!keyword || !keyword.trim()) {
    throw new Error('검색어는 필수입니다');       // ← 빈 검색어 차단 (§6 ②)
  }

  // ① 검색 — size 는 batch 상한(100) 이하로
  const list = await authCall('/api/v1/users/search',
    { params: { keyword: keyword.trim(), status: 'ACTIVE', page: 0, size: 20 } });
  if (list.items.length === 0) return [];

  // ② 이메일이 필요하면 batch 한 번 — 개별 조회를 N 번 하지 않는다
  const ids = list.items.map(i => i.publicUserId);
  const detail = await authCall('/api/v1/users/batch', { body: { publicUserIds: ids } });

  // 순서를 신뢰하지 말고 publicUserId 로 매칭
  const byId = new Map(detail.users.map(u => [u.publicUserId, u]));
  const notFound = new Set(detail.notFound);

  return list.items.map(item => {
    const u = byId.get(item.publicUserId);
    if (!u) {
      // notFound — 미존재 또는 "우리 RP 가입자 아님". 구분 불가
      return { publicUserId: item.publicUserId, name: item.name, email: null,
               unavailable: notFound.has(item.publicUserId) };
    }
    return {
      publicUserId: u.publicUserId,
      name: u.name,                            // masked 면 null
      email: u.email,                          // masked 면 null
      masked: u.maskedReason !== 'NONE',
    };
  });
}
```

> **이메일이 화면에 꼭 필요한지 먼저 판단할 것.** 목록에서는 이름·닉네임·`userType` 으로
> 보여주고, 사용자가 한 명을 고른 뒤에 단건 조회로 이메일을 확인하는 흐름이면
> PII 노출 구간이 가장 짧다. 위 예시는 "목록에 이메일이 필요한 경우" 다.

---

## 6. 반드시 지킬 것

### ① 이메일을 이미 알고 있다면 검색을 쓰지 말 것

이메일이 확정된 상태에서 식별자만 필요하면 **전용 API 가 따로 있다.**

```bash
curl -X POST 'https://t-auth-api.vschool.at/api/v1/users/lookup' \
  -H 'Authorization: Bearer <access_token>' \
  -H 'Content-Type: application/json' \
  -d '{"email":"chulsoo@school.edu"}'
```

```json
{ "success": true, "data": { "publicUserId": "d0dd548c-...", "status": "ACTIVE" } }
```

**이메일을 body 로 받는다** — querystring 을 쓰지 않는 이유는 PII 가 access log·proxy log·
브라우저 history 에 남지 않게 하려는 것이다. 정확 일치·단건이라 동명이인 문제도 없다.

### ② 빈 검색어를 서버로 보내지 말 것

`keyword` 가 비면 **검색이 우회되어 전체 목록**이 온다. `consent_required=false` 면
tenant 전체 회원이 페이징으로 열린다. 빈 문자열 전송도 같다 — **RP 화면에서 막을 것.**

### ③ 이름도 PII 다

`search` 는 `keyword` 를 querystring 으로 받으므로 **이름이 URL 에 남는다.**
프록시·게이트웨이 액세스 로그에 축적되므로, RP 쪽 로깅에서 이 URL 을 그대로 남기지 않도록 한다.

### ④ 토큰을 매 요청마다 발급하지 말 것

1시간 TTL 이다. 만료 전 재사용하고, 401 을 받으면 1회 재발급 후 재시도한다(§5 코드 참조).

### ⑤ 탈퇴 사용자 — `status: "WITHDRAWN"`

탈퇴 후 **30일 grace 기간에는 조회에 매칭된다.** `status` 를 확인하지 않고 정상 회원으로
처리하면 안 된다. grace 종료 후 hard purge 되면 404 다.

`lookup` 을 쓰는 경우 grace 중인 사용자는 응답에 `withdrawnAt`·`resumeAt` 이 함께 온다.

---

## 7. 오류 처리

| 상태 | 원인 | 대응 |
|---|---|---|
| 400 | `lookup` 이메일 형식·255자 초과 · **`batch` 의 `publicUserIds` 가 비었거나 100건 초과** | 입력 검증 |
| 401 | AT 만료·무효 | 재발급 후 **1회** 재시도 |
| 403 | `users:read` 스코프 없음 **또는 사용자 AT 으로 호출** | 이 API 들은 **service AT 전용**. 로그인 사용자 토큰으로는 호출 불가 |
| 404 | 미존재 · hard purge 완료 · **다른 RP 가입자**(`consent_required=true`) | 단건 조회·`lookup` 에서만. 아래 주의 |

**404 를 "없는 사용자" 로 단정하지 말 것.** `consent_required=true` 면 "우리 RP 가입자가
아님" 도 404 다. 응답만으로는 두 경우를 구분할 수 없다(의도된 정보 최소화).

**`batch` 는 404 를 내지 않는다.** 찾지 못한 건은 200 응답의 `notFound` 배열에 담긴다 —
일부만 실패해도 요청 전체가 실패하지 않는다. 같은 이유로 `notFound` 도 "미존재" 와
"우리 RP 가입자 아님" 이 섞여 있어 구분되지 않는다.

---

## 부록. enum 값

| 항목 | 값 |
|---|---|
| `status` / `UserStatus` | `ACTIVE` · `SUSPENDED` · `WITHDRAWN` |
| `userType` | `UNSET` · `TEACHER` · `STUDENT` · `ADMIN` |
| `maskedReason` | `NONE` · `NOT_CONSENTED` · `WITHDRAWN` |
| `schoolGrade` | `KINDERGARTEN` · `ELEMENTARY` · `MIDDLE` · `HIGH` · `SPECIAL` · `UNIVERSITY` · `ETC` |
| service scope | `users:read` · `users:delete` · `groups:read` · `events:read` |

`schoolGrade` 는 교사는 *근무 학교*, 학생은 *재학 학교* 기준이다(동일 enum).

---

## 문의 전 확인 목록

1. `oauth2_client` 에 `users:read` 가 부여됐는가 → 토큰 응답의 `scope` 로 확인
2. `consent_required` 가 우리 RP 의 의도와 맞는가 → 검색 범위가 달라진다
3. 호출 호스트가 `*-auth-api.*` 인가 → GW(`t-gw.*`)로 호출하면 안 된다
4. `maskedReason` 과 `status` 를 코드에서 분기하고 있는가
