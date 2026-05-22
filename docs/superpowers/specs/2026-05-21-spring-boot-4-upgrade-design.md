# Spring Boot 4 Upgrade — Verification-First Design

**Date:** 2026-05-21
**Branch:** `feature/backend-version-upgrade`
**Author:** brainstorming session (Opus 4.7)
**Reference Projects:** `superplatform-auth` (IDP), `superplatform-mypage`

---

## 1. 문제 정의

학심정(meta-dashboard) 백엔드를 **Spring Boot 2.7.17 + Java 17 → Spring Boot 4.0.5 + Java 21**로 업그레이드한다. 단순 버전 점프가 아니라 다음 위험을 동반한다:

1. **Spring Framework 6 + 7 두 메이저 변경이 한 번에 일어남** (Jakarta 전환 + Security 7)
2. **MyBatis-Spring-Boot-Starter 3.0.3의 Boot 4.x 공식 지원 미명시** (위험도 🔴 최상)
3. **운영 표면이 매우 넓음** — MyBatis, log4j2, jasypt, ShedLock, Caffeine, Redis Pub/Sub, AWS SDK v1 (NCP S3), PDFBox, POI, Neo4j, OAuth2 Resource Server, MapStruct, AOP 4종, Master/Slave 라우팅 데이터소스
4. **로컬에서 전체 스택 구동이 어려움** — 검증은 개발 서버 배포 후 수행
5. **회귀 안전망 약함** — WebMvcTest 4개를 삭제해야 컴파일 통과 (이미 SSO 전환 시 jjwt 의존성 제거됨)
6. **Admin 영역 폐기 작업이 working copy에 섞여 있음** — 업그레이드와 분리 필요

본 설계의 최우선 가치는 **"업그레이드 후 기능 동작 보장"** — 빠르기보다 안전하게.

## 2. 레퍼런스 프로젝트 검증 매트릭스

| 검증 항목 | IDP (superplatform-auth) | mypage (superplatform-mypage) | 메타 적용 가능 여부 |
|:---|:---:|:---:|:---|
| Java 21 toolchain | ✅ | ✅ | ✅ |
| Spring Boot 4.0.5 | ✅ | ✅ | ✅ |
| dependency-management 1.1.7 | ✅ | ✅ | ✅ |
| log4j2 starter + logback 제외 | ✅ | ✅ | ✅ |
| springdoc 2.8.6 | ✅ | (없음) | 🟡 메타에서 1차 검증 |
| OAuth2 Resource Server | (없음) | ✅ | ✅ |
| **JPA** | ✅ | ✅ | ❌ 메타는 MyBatis |
| **MyBatis** | (없음) | (없음) | ⚠️ **자체 검증 필수** |
| **Mockito 5 + JDK 21 javaagent** | (검증 안 됨) | ✅ | ⚠️ **누락된 핵심 — 본 설계에서 추가** |

→ **결론**: IDP/mypage가 검증한 안전구간은 활용하되, MyBatis 영역은 메타가 자체 검증해야 하며, 그것이 본 설계의 최대 리스크 포인트.

## 3. 다층 검증 파이프라인

### 3.1 단계 정의

```
[L1] 로컬 컴파일       ./gradlew :backend:compileJava :backend:compileTestJava
[L2] 로컬 자동화 테스트  ./gradlew :backend:test (신규 3종 + 기존)
[L3] 로컬 bootJar      ./gradlew :backend:bootJar -x test
[D1] 개발 서버 배포     (운영팀 절차)
[D2] P0 시나리오 검증   부팅/인증/핵심 CRUD 5~7개 → ❌면 즉시 롤백
[D3] P1 시나리오 검증   도메인별 대표 CRUD 15~20개
[D4] P2 시나리오 검증   관리/유틸/엣지 케이스 (실패 일부 허용)
[M]  main 머지         L1~L3 + D2 + D3 100% 통과 시
```

### 3.2 단계별 진행 원칙

- **L1~L3**: 로컬에서 모두 통과해야 D1 진입. 하나라도 깨지면 진행 중단.
- **D2**: 위험도 🔴 의존성 시나리오 우선 (MyBatis CRUD, OAuth2 JWT 인증, Master/Slave 라우팅, 부팅 자체). 실패 시 즉시 이전 JAR로 롤백.
- **D3**: 도메인 회귀 검증. P1 중 1개라도 실패 시 머지 보류, 원인 분석.
- **D4**: 실패 가능. 별도 이슈로 분리, 본 업그레이드 PR과 무관하게 진행.

## 4. 자동화 안전망 (L2 영역)

### 4.1 신규 테스트 3종

위치: `backend/src/test/com/vs/meta/upgrade/`

| 파일명 | 어노테이션 | 검증 의도 |
|:---|:---|:---|
| `MetaApiApplicationContextTest.java` | `@SpringBootTest` (web=NONE) | Spring 컨텍스트 전체 부팅 검증. log4j2 / MyBatis SqlSessionFactory / Caffeine / jasypt / ShedLock / Redis / OAuth2 RS Bean wiring 모두 동시 검증. Boot 4 호환성 1차 폭탄을 조기 포착. |
| `SecuritySwaggerSmokeTest.java` | `@SpringBootTest(webEnvironment=RANDOM_PORT)` + `TestRestTemplate` | (1) `/swagger-ui/index.html` 200, (2) `/v3/api-docs` 200 & non-empty, (3) `/actuator/health` 200, (4) **임의 보호 엔드포인트** 무토큰 401, (5) public 엔드포인트 200/4xx (5xx 아님) |
| `MemberMapperReadTest.java` | `@SpringBootTest(profiles="local-test")` + `@Sql` 데이터 또는 개발 서버 slave DB | **MyBatis 3.0.3 + Boot 4.0.5 호환성 핵심 검증**. `userMapper.findByEmail("...")` 1회 SELECT 성공. Slave 라우팅이 작동하면 보너스. |

### 4.2 Mockito 5 + JDK 21 javaagent 패턴 (mypage 차용)

`backend/build.gradle`에 추가:

```groovy
configurations {
    mockitoAgent
}
dependencies {
    mockitoAgent('org.mockito:mockito-core:5.14.2') { transitive = false }
}
tasks.named('test') {
    useJUnitPlatform()
    jvmArgs("-javaagent:${configurations.mockitoAgent.asPath}")
}
```

**근거**: JDK 21+부터 dynamic agent self-attach가 deprecated/disabled. mypage 프로젝트가 이미 동일 패턴 적용 중. 메타의 v2 계획에 누락되어 있었음.

## 5. 운영 표면 인벤토리 (D2~D4 영역)

### 5.1 자동 추출

```
Grep tool:
  pattern: "@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\b"
  path: backend/src/main/java
  output_mode: content
  -n: true
```

추출 결과를 `docs/superpowers/specs/2026-05-21-upgrade-verification-checklist.md` 에 표로 저장.

### 5.2 인벤토리 컬럼

| 우선순위 | 도메인 | HTTP/Path | 메서드 시그니처 | 시나리오 한 줄 | 의존성 태그 | 검증 결과 |
|:---:|:---|:---|:---|:---|:---|:---:|
| P0/P1/P2 | member, group, ... | `POST /member/...` | `MemberController#createMember` | "회원 가입 1건 성공" | MyBatis, JWT | ✅/❌/⏳ |

### 5.3 우선순위 가이드

- **P0**: 부팅/인증/세션이 깨지면 전체 서비스 동작 불가능한 엔드포인트
  - `/actuator/health`, OAuth2 보호 인증 흐름, 회원 조회/등록 핵심 CRUD, 그룹 조회/참가
- **P1**: 일반 도메인 CRUD — 단일 사용자 흐름의 정상 동작 확인
  - counseling, memo, school, dgnss(검사), file 업로드/다운로드, 알림
- **P2**: 관리/유틸/덜 자주 호출되는 케이스 — 회귀 시 운영 부담은 있으나 즉시 차단 사유는 아님
  - bug-report, 통계, 관리자 일괄 처리, 디버그 페이지

### 5.4 우선순위 부여 방식

본 설계 승인 후, **자동 추출된 인벤토리에 1차 P0/P1/P2 안을 AI가 제시 → 사용자(개발자)가 검수**. 30분 내 완료 목표.

## 6. 핵심 라이브러리 동작 검증 매트릭스 (D2~D3 단계 의무)

| 의존성 | 검증 트리거 시나리오 | 단계 | 위험도 |
|:---|:---|:---:|:---:|
| MyBatis 3.0.3 SqlSession + Mapper XML | 회원 조회 API 1회 (`GET /member/...` 등) | D2 | 🔴 |
| DynamicRoutingDataSource (Master/Slave) | `@Transactional(readOnly=true)` 메서드 호출 후 slave 로그 확인 | D2 | 🔴 |
| OAuth2 RS + JWKS RS256 | 실제 SP JWT로 보호 엔드포인트 200 응답 | D2 | 🔴 |
| log4j2 + log4j2-spring.xml | 모든 D2 시나리오 로그가 정상 출력 | D2 | 🟡 |
| jasypt 3.0.5 | jasypt prop 사용하는 동작 (NCP Mail 발송 dry-run) | D2 | 🟡 |
| Caffeine | 동일 조회 2회 → 2번째 캐시 hit 로그 | D3 | 🟢 |
| ShedLock 5.18.0 | 스케줄 잡 실행 → `shedlock` 테이블 row 생성/갱신 확인 | D3 | 🟡 |
| Redis Pub/Sub | 알림 publish/subscribe 시나리오 | D3 | 🟡 |
| PDFBox 3.0.1 | DGNSS 검사 결과 PDF 생성 1건 | D3 | 🟡 |
| Apache POI 5.2.5 | Excel 다운로드 1건 (학교 일괄 등) | D3 | 🟢 |
| AWS SDK v1 (NCP S3) | 파일 업로드 + 다운로드 1회 (`FileController`) | D3 | 🟡 |
| Neo4j Driver 5.28.5 | 그래프 API (`/api/dgnss/graph/**`) 1건 | D3 | 🟢 |
| MapStruct 1.6.3 | DTO 변환 일어나는 API 1건 (counseling/group) | D3 | 🟡 |
| AOP 4종 (ApiResponseAspect / TransactionAspect / QchTraceAspect / RetryAspect) | 임의 API 호출 후 로그에 모두 흔적 | D3 | 🟡 |

## 7. 머지 게이트 & 롤백 정책

### 7.1 머지 조건 (AND)

- L1 (compileJava + compileTestJava) ✅
- L2 (test) ✅ — 신규 3개 + 기존 잔여
- L3 (bootJar) ✅
- D2 (P0 시나리오) — **100% 통과**
- D3 (P1 시나리오) — **100% 통과**
- D4 (P2 시나리오) — **부분 실패 허용** (실패 항목은 별도 이슈 등록 필수)

### 7.2 롤백 트리거

- L1~L3 실패: 해당 Task 커밋 revert 또는 working copy 수정으로 즉시 복구
- D1 부팅 실패 / D2 실패: 운영팀과 협의하여 **이전 JAR 즉시 배포**, 본 PR은 추가 작업 후 재배포
- D3 일부 실패: 머지 보류, 원인 분석. 패치 후 D2~D3 재실행

### 7.3 부분 머지 금지

Task 0(Admin 제거) 커밋만 단독 머지 X. **본 PR의 모든 커밋은 한 묶음으로만 머지** (단, 운영팀 합의 시 Task 0만 사전 머지하는 옵션은 별도 논의 가능 — 현 시점 기본값 금지).

## 8. 변경 작업 단위 (Task 분해 — plan v3로 구체화)

| Task | 제목 | 분리 커밋 |
|:---:|:---|:---|
| 0 | Admin 디렉토리 + Thymeleaf 영역 폐기 (선행) | ✅ |
| 1 | 의존성 호환성 사전 조사 (mybatis/ShedLock/jasypt + mypage Mockito 패턴) | 조사 only |
| 1.5 | 운영 표면 인벤토리 자동 추출 + P0/P1/P2 부여 | ✅ |
| 2 | build.gradle 전면 업데이트 (Boot 4.0.5, log4jdbc 제거, MapStruct 1.6.3, Mockito javaagent) | ✅ |
| 3 | 깨진 테스트 4개 삭제 + 신규 자동화 테스트 3종 작성 | ✅ |
| 4 | javax → jakarta 네임스페이스 일괄 교체 | ✅ |
| 5 | CommonsMultipartFile → InMemoryMultipartFile 대체 | ✅ |
| 6 | SecurityConfig Security 7 호환 람다 DSL 재작성 | ✅ |
| 7 | SwaggerConfig InternalResourceViewResolver 제거 | ✅ |
| 8 | Dockerfile Java 21 이미지 + NCP 가용성 사전 확인 | ✅ |
| 9 | L1~L3 로컬 검증 (컴파일/테스트/bootJar) + CLAUDE.md 갱신 | ✅ |
| 10 | D1~D4 개발 서버 검증 (자동 추출 인벤토리 기반) | (커밋 없음, 검증 로그) |
| 11 | **Jackson 2 → 3 (tools.jackson) 마이그레이션 — Task 1 누락분 보강** | ✅ (커밋 `bc93112`, 2026-05-22) |

## 9. 후속 작업 (별도 PR 권장)

- AWS SDK v1 → v2 마이그레이션 (EOL 2025-12-31)
- commons-dbcp2 → HikariCP
- SQL 로깅 필요 시 p6spy 도입 (log4jdbc 대체)
- Mockito 5.x 인라인 mock 신문법 도입
- Security 7 deprecated API 정리 (L1 단계에서 발견된 항목)

## 10. 위험도 매트릭스 (요약)

| 의존성 / 변경 | 위험도 | 본 설계의 안전망 |
|:---|:---:|:---|
| mybatis-spring-boot-starter 3.0.3 + Boot 4 | 🔴 | Task 1 사전 조사 + L2 `MemberMapperReadTest` + D2 회원 CRUD 검증 |
| log4jdbc 1.16 (2014 미업데이트) | 🔴 | Task 2에서 제거 |
| Mockito 5 + JDK 21 self-attach 경고 | 🔴 | Task 2에서 mypage 패턴 차용 |
| jasypt 3.0.5 + Boot 4 | 🟡 | Task 1 조사 + D2 NCP Mail 발송 시나리오 |
| ShedLock 5.18.0 + Boot 4 | 🟡 | Task 1 조사 + D3 스케줄 잡 검증 |
| MapStruct 1.5.3 Jakarta 호환 | 🟡 | Task 2에서 1.6.3 + `lombok-mapstruct-binding` |
| AWS SDK v1 1.12.770 + JDK 21 | 🟡 | 본 PR에서 유지, 후속 v2 마이그레이션 |
| commons-dbcp2 2.9.0 | 🟢 | 유지 |
| Spring Security 7 deprecated API | 🟡 | Task 6에서 Security 7 호환 패턴 적용 + L1 단계 경고 수집 |
| Admin 영역 폐기와 업그레이드 혼재 | 🟡 | Task 0 별도 커밋 분리 (git bisect 가능성 확보) |

## 11. 본 설계가 보장하지 않는 것

- **운영 부하 검증 없음**: D2~D4는 기능 정상 동작만 확인. JVM 21에서 GC 패턴 변경, log4j2 v2 출력 패턴 변화 등 성능/관측 영향은 별도 검증.
- **SP IDP 측 변경 없음 가정**: SP JWT의 claim 구조와 JWKS endpoint가 본 PR 진행 중에 바뀌면 즉시 보고하고 일시 보류.
- **DB 스키마 변경 없음**: 본 PR은 코드/의존성만 변경. DDL 변경 동반 시 별도 PR.

## 12. 후속 단계

본 spec 승인 후:
1. `plans/2026-05-21-spring-boot-4-upgrade.md` 를 v3로 갱신 (Task 0~10 구체화 + 본 설계 결정사항 통합)
2. 운영 표면 인벤토리 자동 추출 → P0/P1/P2 1차 안 제시
3. 사용자 검수 후 Task 0부터 순차 실행
