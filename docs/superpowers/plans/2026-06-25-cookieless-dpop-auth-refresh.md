# Cookieless + DPoP 인증 refresh 전환 — 학심정(RP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development 또는 superpowers:executing-plans.
> 이 문서는 **학심정(meta-dashboard) RP 측 변경**만 다룬다. 핵심 작업(Auth 서버 + SDK)은 별도 문서:
> `superplatform-auth/docs/superpowers/plans/2026-06-25-cookieless-dpop-auth-refresh.md`.
> 개념/배경 공유본(HTML): `superplatform-auth/docs/cookieless-dpop-auth-refresh.html`.

**Goal:** 학심정의 토큰 refresh가 SameSite 크로스사이트로 깨지는 문제를, RP 코드 변경을 최소화하며 해결한다. (실제 메커니즘 = 쿠키리스 전환 + Auth/SDK의 DPoP. 학심정은 그 위에 얹히기만 한다.)

**Architecture:** 학심정은 **SDK init 플래그/버전과 BFF의 헤더 통과**만 손댄다. 비즈니스 로직·`client_secret`·BFF 구조는 그대로 유지. 모든 트래픽은 Kong 경유(WAF 유지).

**Tech Stack:** Vite/React FE(`frontend`) · Spring BFF(`backend`, `AuthProxyController`).

## Global Constraints

- RP 비즈니스 로직 변경 0. 허용 변경 = (a) SDK `tokenStorage` 플래그, (b) dev env 1줄, (c) BFF `DPoP` 헤더 통과 1~2줄, (d) SDK 버전업.
- `client_secret`·confidential client·BFF(`AuthProxyController`) **유지**. public client 전환 안 함.
- 모든 인터넷 트래픽 Kong 경유 유지(WAF 단일화). 콩 우회 직접호출은 임시였고 Phase 0에서 원복.
- 커밋 메시지에 `Co-Authored-By` 트레일러 금지.

## 의존성
- Phase 1(학1.1)의 BFF 헤더 통과는 **Auth 측 DPoP 검증(별도 문서 Task A1.5)이 배포된 뒤** 의미가 있다. Auth 배포 → SDK 배포 → 학심정 검증 순.

---

# PHASE 0 — 쿠키리스 전환 (즉시 해소)

**효과:** SDK가 RT를 쿠키 대신 body로 보냄 → SameSite 무관 → Kong 경유로 refresh 정상(전 브라우저). Auth/BFF 코드 변경 0.
**리스크:** RT가 localStorage에 저장돼 XSS 노출 가능 — SSO 세션 바인딩(≤12h)으로 한정, Phase 1(DPoP)에서 제거.

### Task 학0.1: SDK tokenStorage 를 localStorage(쿠키리스)로

**Files:** Modify `frontend/src/shared/lib/authClient.ts:99`
- [ ] **Step 1:** `tokenStorage: 'cookie'` → `tokenStorage: 'localStorage'` (주석: 쿠키리스 → SameSite 회피, Kong 경유 유지).
- [ ] **Step 2:** `cd frontend && npx tsc --noEmit` → 에러 0.
- [ ] **Step 3:** Commit: `fix(fe): SDK tokenStorage localStorage(쿠키리스) — refresh SameSite 회피`

### Task 학0.2: dev VITE_API_URL 을 Kong 경유로 원복 (WAF 복구)

**Files:** Modify `frontend/.env.development:VITE_API_URL`
> 쿠키리스가 되면 크로스사이트 쿠키 문제가 사라지므로, 임시로 콩을 우회했던(`t-meta-api.vsaidt.com`) dev API base를 Kong 경유로 되돌려 WAF 커버를 복구한다.
- [ ] **Step 1:** `VITE_API_URL=https://t-meta-api.vsaidt.com` → `VITE_API_URL=https://t-gw.vschool.at/v1/meta`.
- [ ] **Step 2:** Commit: `revert(fe): dev VITE_API_URL Kong 경유 원복 — 쿠키리스로 우회 불필요(WAF 복구)`

### Task 학0.3: Phase 0 검증 (dev)
- [ ] **Step 1:** dev 재배포 + 재로그인.
- [ ] **Step 2:** AT 만료(15분) 후 복귀 → `POST .../api/v1/auth/refresh` **200** + 새 토큰 수신(RT는 body 경유).
- [ ] **Step 3:** **Safari/Firefox**에서도 refresh 정상 확인(서드파티 쿠키 차단 환경).
- [ ] **Step 4:** complete-profile 튕김 없음(이미 폐기) + 로그인 유지 확인.

---

# PHASE 1 — DPoP 대응 (RP는 헤더 통과 + SDK 버전업)

> Auth/SDK의 DPoP 구현(별도 문서)이 선행되어야 함. 학심정 측은 아래 둘뿐.

### Task 학1.1: BFF — DPoP 헤더 Auth 로 통과(pass-through)

**Files:** Modify `backend/src/main/java/com/vs/meta/api/sso/controller/AuthProxyController.java` (`token`, `refresh`)
**Interfaces:** Consumes 인바운드 요청의 `DPoP` 헤더 → `superPlatformAuthWebClient` 호출에 relay.
- [ ] **Step 1:** `token()`·`refresh()`의 WebClient 호출에 인바운드 `DPoP` 헤더를 그대로 전달(`request.getHeader("DPoP")` non-null 시 `.header("DPoP", ...)`).
- [ ] **Step 2:** `./gradlew :backend:compileJava` 성공.
- [ ] **Step 3:** Commit: `feat(be): AuthProxy 가 DPoP 헤더를 Auth 로 통과`

### Task 학1.2: SDK 버전업 (FE 로직 0줄)

**Files:** Modify `frontend/package.json`(auth-client SDK 버전) — 로직 변경 없음
- [ ] **Step 1:** DPoP 지원 SDK 버전으로 올림. (CDN 로드 방식이면 `index.html`/CDN 핀 버전 갱신)
- [ ] **Step 2:** 빌드 + 로그인/대시보드 스모크.
- [ ] **Step 3:** Commit: `chore(fe): auth-client SDK 버전업 — DPoP refresh 지원`

### Task 학1.3: Phase 1 검증 (학심정 dev)
- [ ] **Step 1:** 재로그인 → 신규 RT가 jkt 바인딩되는지(Auth DB `refresh_token.dpop_jkt` 채워짐) 확인.
- [ ] **Step 2:** AT 만료 후 refresh → DPoP proof 검증 통과(정상 갱신).
- [ ] **Step 3:** Safari/Firefox 포함 동작 확인.

---

## 비고
- 콩(Kong): 학심정 작업으로 인한 콩 로직 변경 없음. (AT는 평범한 Bearer 유지 → JWKS 검증 그대로)
- ST_SESSION/idle: 우리 작업과 독립(이미 Bearer sid로 크로스사이트 안전). 별도 변경 없음.
- 참조: 결정 원장·전체 그림은 공유 HTML, Auth/SDK 상세는 superplatform-auth 계획서.
