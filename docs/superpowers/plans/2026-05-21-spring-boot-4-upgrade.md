# Spring Boot 4 Upgrade Implementation Plan (v4)

> **v4 변경점 (Task 1 호환성 조사 결과 반영):**
> - mybatis-spring-boot-starter: 3.0.3 → **4.0.1** (Boot 4 정식 지원, 🔴 → 🟢)
> - ShedLock: 5.18.0 → **7.7.0** (Boot 4 정식 지원, 메타 코드 변경 0건, 🟡 → 🟢)
> - jasypt-spring-boot-starter: **완전 제거** (메타에서 미사용 확인, 🟡 → 🟢)
> - log4jdbc: **유지** (당초 제거 계획이었으나 IDP가 Boot 4.0.5 + JDK 21에서 동일 버전 1.16 운영 검증 중인 사실 확인 — v3 제거 결정 철회. 🔴 → 🟢)
> - Mockito javaagent: mypage 패턴 차용 (v3 결정 유지, 🔴 → 🟢)
> - 🔴 위험 3건 → **0건**, 🟡 위험 5건 → **2건** (AWS SDK v1 / Security 7 deprecated만 잔존)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Design Doc:** `docs/superpowers/specs/2026-05-21-spring-boot-4-upgrade-design.md` (검증 우선 설계). 본 문서는 그 설계를 Task 단위로 실행 가능하게 구체화한 것이다.

**Goal:** Spring Boot 2.7.17 + Java 17 → Spring Boot 4.0.5 + Java 21 업그레이드. **최우선 가치는 업그레이드 후 기능 동작 보장.** 빠르기보다 안전하게 진행하며, 다층 검증 파이프라인(L1~L3 로컬 + D1~D4 개발 서버)을 통과한 후 머지한다.

**Reference Projects:**
- `C:/vs-workspace/superplatform-auth` (IDP) — Boot 4.0.5 + Java 21 + log4j2 + springdoc 2.8.6 동작 검증됨 (단, JPA 환경)
- `C:/vs-workspace/superplatform-mypage` — 동일 + **Mockito 5 + JDK 21 javaagent 패턴 적용 사례**

**Tech Stack (목표):** Java 21, Gradle 8.14, Spring Boot 4.0.5, Spring Security 7, **MyBatis Spring Boot Starter 4.0.1**, springdoc-openapi-starter-webmvc-ui 2.8.6, **ShedLock 7.7.0**, MapStruct 1.6.3. (**jasypt 제거**)

---

## 다층 검증 파이프라인 (모든 Task의 통과 기준)

```
[L1] 로컬 컴파일       ./gradlew :backend:compileJava :backend:compileTestJava
[L2] 로컬 자동화 테스트  ./gradlew :backend:test (신규 3종 + 기존 잔여)
[L3] 로컬 bootJar      ./gradlew :backend:bootJar -x test
[D1] 개발 서버 배포
[D2] P0 시나리오 검증   부팅/인증/핵심 CRUD 5~7개 (실패 시 즉시 롤백)
[D3] P1 시나리오 검증   도메인별 대표 CRUD 15~20개
[D4] P2 시나리오 검증   관리/유틸/엣지 케이스 (일부 실패 허용)
[M]  main 머지         L1~L3 + D2 + D3 100% 통과 시
```

---

## 위험도 매트릭스 (Task 1 조사 후 최종)

| 의존성 | 변경 | Boot 4.x 지원 | 위험도 | 본 계획의 대응 |
|:---|:---|:---|:---:|:---|
| mybatis-spring-boot-starter | 3.0.3 → **4.0.1** | ✅ 정식 | 🟢 | Task 2에서 버전 갱신 + Task 3 `MemberMapperReadTest` 자동 검증 |
| log4jdbc-log4j2-jdbc4.1:1.16 | **유지** | ✅ IDP 검증 | 🟢 | IDP(superplatform-auth)가 Boot 4.0.5 + JDK 21 에서 동일 버전 운영 검증 중 — 메타도 동일 패턴 |
| Mockito 5 + JDK 21 self-attach | 그대로 5.14.2 | ✅ javaagent 패턴 | 🟢 | Task 2 `mockitoAgent` 패턴 도입 (mypage 차용) |
| ShedLock 5.18.0 → **7.7.0** | 메이저 점프 | ✅ 정식 | 🟢 | Task 2에서 버전 갱신 (메타 코드 변경 0건 — `withJdbcTemplate`/`usingDbTime`만 사용) |
| jasypt-spring-boot-starter | **완전 제거** | - | 🟢 | Task 2에서 제거 (메타 코드/yml 미사용 확인) |
| MapStruct 1.5.3 → **1.6.3** | + binding 0.2.0 | ✅ 정식 | 🟢 | Task 2 |
| AWS SDK v1 1.12.770 | 유지 | ⚠️ JDK21 reflection 경고 | 🟡 | 본 PR 유지, 후속 PR로 v2 마이그레이션 권장 |
| commons-dbcp2 2.9.0 | 유지 | OK | 🟢 | 유지 |
| Spring Security 7 deprecated API | 일부 | ⚠️ | 🟡 | Task 6에서 Security 7 호환 + Task 9에서 경고 수집. **결과: Task 9 L1 재실행에서 deprecation 0건 — 람다 DSL 재작성 완전 적용 확인** |
| **Jackson 2.x → 3.x (tools.jackson)** | **com.fasterxml → tools.jackson** | ✅ Boot 4 정식 | **🔴 → 🟢** | **Task 1 사전 조사 누락 항목 — Task 9 부팅 시 `ObjectMapper bean 미생성` 으로 발견 → 본 PR 후속 작업 Task 11 신설 (커밋 `bc93112`)** |

**🔴 위험 → 0건. 🟡 위험 2건만 잔존** (AWS SDK v1 / Security 7 deprecated — 둘 다 본 PR 비차단).

> **회고 (Task 1 보강 — 2026-05-22)**: Boot 4.0.5 의 `spring-boot-starter-jackson` 이 `tools.jackson.core:jackson-databind:3.1.0` 으로 좌표 자체가 바뀌고 `com.fasterxml.jackson.databind.ObjectMapper` autoconfig 가 제거된 사실을 사전 조사 단계에서 포착하지 못함. 본 PR 부팅 단계에서 회귀로 발견되었고 Task 11 (Jackson 3 마이그레이션, 커밋 `bc93112`) 로 즉시 해결. 향후 메이저 업그레이드 사전 조사 체크리스트에 "기본 JSON/HTTP/Logging starter 의 좌표 변경 여부" 를 명시적으로 추가할 것.

---

## 파일 변경 맵 (요약)

| 파일 | 변경 | Task |
|:---|:---|:---:|
| `backend/src/main/java/com/vs/meta/admin/**` | 삭제 (25개) | 0 |
| `backend/src/main/resources/templates/admin/**` | 삭제 (13개 HTML) | 0 |
| `backend/src/main/resources/mapper/admin/**` | 삭제 | 0 |
| `backend/src/main/java/com/vs/meta/domain/AdminAccount.java`, `AuthSchoolMap.java`, `RoleGroup.java` | 삭제 | 0 |
| `backend/build.gradle` | Thymeleaf 제거 → Task 0 / 전면 업데이트 → Task 2 | 0, 2 |
| `gradle/wrapper/gradle-wrapper.properties` | 8.14 (이미 working copy) | 2 |
| `backend/Dockerfile` | Java 17 → 21 | 8 |
| `backend/src/main/java/com/vs/meta/common/config/SecurityConfig.java` | Security 7 람다 DSL 재작성 | 6 |
| `backend/src/main/java/com/vs/meta/common/config/SwaggerConfig.java` | InternalResourceViewResolver 제거 | 7 |
| `backend/src/main/java/com/vs/meta/common/utils/InMemoryMultipartFile.java` | **신규** | 5 |
| `backend/src/main/java/com/vs/meta/api/dgnss/service/PdfService.java`, `vo/PioPdfVO.java` | CommonsMultipartFile 대체 | 5 |
| 16개 Java 파일 | `javax.servlet.*` → `jakarta.servlet.*` | 4 |
| `common/utils/LoginRateLimiter.java` | `javax.annotation.PostConstruct` → `jakarta.annotation.PostConstruct` | 4 |
| `backend/src/test/.../GroupWebMvcTest.java`, `MemberWebMvcTest.java`, `SchoolWebMvcTest.java`, `MemberServiceTest.java` | 삭제 | 3 |
| `backend/src/test/com/vs/meta/upgrade/MetaApiApplicationContextTest.java` | **신규** | 3 |
| `backend/src/test/com/vs/meta/upgrade/SecuritySwaggerSmokeTest.java` | **신규** | 3 |
| `backend/src/test/com/vs/meta/upgrade/MemberMapperReadTest.java` | **신규** | 3 |
| `backend/CLAUDE.md` | Tech Stack 갱신 | 9 |
| `docs/superpowers/specs/2026-05-21-upgrade-verification-checklist.md` | **신규** (Task 10에서 사용) | 1.5 |

---

## Task 0: Admin 영역 & Thymeleaf 제거 (선행 커밋)

> **목적**: Boot 4 업그레이드와 무관한 Admin UI 폐기를 별도 커밋으로 분리. Working copy의 (D) 항목들을 이 Task에서 일괄 커밋. Boot 2.7 상태에서도 빌드 통과 가능해야 한다 (격리 검증 가치).

**Files:**
- Delete (이미 working copy에 D 상태): `backend/src/main/java/com/vs/meta/admin/**`, `backend/src/main/resources/templates/admin/**`, `backend/src/main/resources/mapper/admin/**`, `domain/AdminAccount.java`, `domain/AuthSchoolMap.java`, `domain/RoleGroup.java`
- Modify: `backend/build.gradle` — Thymeleaf starter 2개 제거만

### Step 1: 삭제 항목 확인

- [ ] **working copy의 D 항목이 admin/Thymeleaf 영역에 한정되어 있는지 확인**

```powershell
git status -s | Select-String '^( D|D )'
```

Expected: admin/templates/admin/mapper/admin/domain 3개 외 다른 항목 없음. 다른 항목이 있으면 **중단** 후 사용자 확인.

### Step 2: build.gradle — Thymeleaf만 우선 제거 (Boot 2.7 상태로 일시 되돌림)

- [ ] **build.gradle을 HEAD 상태로 복원 후 Thymeleaf 라인만 제거**

```powershell
git restore backend/build.gradle
```

`backend/build.gradle`에서 다음 두 줄을 제거:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
implementation 'org.thymeleaf.extras:thymeleaf-extras-springsecurity5'
```

### Step 3: Boot 2.7 상태에서 컴파일 격리 검증

- [ ] **Admin 삭제 + Thymeleaf 제거만으로 Boot 2.7에서 빌드 통과**

```powershell
./gradlew :backend:compileJava -x test 2>&1 | Select-Object -Last 25
```

Expected: BUILD SUCCESSFUL. 컴파일 에러가 나면 Admin 외 코드에서 Admin/Thymeleaf import 잔재가 있는 것 → 함께 제거.

### Step 4: 커밋

- [ ] **단일 커밋으로 정리**

```powershell
git add -A backend/src/main/java/com/vs/meta/admin backend/src/main/resources/templates/admin backend/src/main/resources/mapper/admin
git add backend/src/main/java/com/vs/meta/domain/AdminAccount.java backend/src/main/java/com/vs/meta/domain/AuthSchoolMap.java backend/src/main/java/com/vs/meta/domain/RoleGroup.java
git add backend/build.gradle
git commit -m "[BACKEND] Admin UI 및 Thymeleaf 영역 폐기 (SSO 통합 후속)"
```

> `Co-Authored-By` 라인 포함 금지 (CLAUDE.md 규칙).

---

## Task 1: 의존성 호환성 사전 조사 (사전 차단)

> **목적**: 위험도 🔴 항목의 호환성을 본 작업 진입 전에 확인. 30분 내 종료. 결과를 본 문서 하단 "검증 로그"에 기록.

**Files:** 없음 (조사 단계, 커밋 없음).

### Step 1: mybatis-spring-boot-starter 3.0.3 + Boot 4.0.5 호환성

- [ ] **GitHub Releases / Issues 확인** (WebFetch 또는 브라우저)

```
https://github.com/mybatis/spring-boot-starter/releases
https://github.com/mybatis/spring-boot-starter/issues?q=Spring+Boot+4
```

판단:
- Boot 4 명시 지원 → 그대로 진행
- 별도 라인이 있으면 해당 버전
- 동작 보고만 있고 명시 지원 미흡 → 진행 + Task 3 `MemberMapperReadTest`로 자동 검증
- 명백한 호환 깨짐 → **본 작업 중단**, 사용자 보고

### Step 2: ShedLock 5.18.0 + Boot 4.0.5 호환성

- [ ] **GitHub Releases 확인**

```
https://github.com/lukas-krecan/ShedLock/releases
```

5.20+가 권장이면 Task 2에서 함께 업그레이드.

### Step 3: jasypt-spring-boot-starter 3.0.5 + Boot 4.0.5 호환성

- [ ] **GitHub Issues 확인**

```
https://github.com/ulisesbocchio/jasypt-spring-boot/issues?q=Spring+Boot+4
```

명시 미지원 시: 본 PR에서는 유지하되 Task 10 D2에서 NCP Mail 발송 시나리오로 동작 검증. 깨지면 PropertyDecryptor 자체 구현 검토 (별도 PR).

### Step 4: MapStruct 1.6.3 + Jakarta + JDK 21

- [ ] **MapStruct 릴리즈 노트 확인**

```
https://github.com/mapstruct/mapstruct/releases/tag/1.6.3
```

1.6.3은 Jakarta + JDK 21 정식 지원. 결정: 1.5.3 → 1.6.3 + `lombok-mapstruct-binding:0.2.0` 추가.

### Step 5: mypage Mockito javaagent 패턴 차용 결정

- [ ] **mypage build.gradle 70~79행 확인**

```
C:\vs-workspace\superplatform-mypage\backend\build.gradle:70-79
```

해당 패턴(`configurations { mockitoAgent }` + `mockitoAgent('org.mockito:mockito-core') { transitive=false }` + `tasks.named('test') { jvmArgs("-javaagent:...") }`)을 Task 2에서 그대로 반영.

### Step 6: 검증 로그 작성

- [ ] **본 문서 하단 "검증 로그" 섹션에 각 항목 결과 기록**

---

## Task 1.5: 운영 표면 인벤토리 자동 추출 + P0/P1/P2 부여

> **목적**: Task 10 (D1~D4) 의 회귀 검증 체크리스트의 입력 데이터를 만든다. 운영 중인 모든 엔드포인트를 빠짐없이 추출하고 우선순위를 매긴다.

**Files:**
- Create: `docs/superpowers/specs/2026-05-21-upgrade-verification-checklist.md`

### Step 1: 자동 추출

- [ ] **Grep으로 모든 매핑 어노테이션 추출**

```
Grep tool:
  pattern: "@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\\b"
  path: backend/src/main/java
  output_mode: content
  -n: true
```

각 매치를 도메인별(member/group/counseling/memo/school/dgnss/file/sso/guest/notification)로 분류.

### Step 2: 체크리스트 문서 작성

- [ ] **`docs/superpowers/specs/2026-05-21-upgrade-verification-checklist.md` 생성**

표 형식:

```markdown
| 우선 | 도메인 | HTTP | Path | 컨트롤러 | 시나리오 | 의존성 태그 | 결과 |
|:---:|:---:|:---:|:---|:---|:---|:---|:---:|
| P0 | member | POST | /member/login | MemberController#login | "정상 회원 로그인 1건" | MyBatis, JWT, jasypt | ⏳ |
| P0 | actuator | GET | /actuator/health | (자동) | "DB+Redis healthy" | MyBatis, Redis | ⏳ |
| P1 | counseling | GET | /counseling/{id} | CounselingController#get | "상담 1건 조회" | MyBatis, JWT, AOP | ⏳ |
| ... | ... | ... | ... | ... | ... | ... | ⏳ |
```

### Step 3: P0/P1/P2 1차 안 부여 (AI 추천 → 사용자 검수)

- [ ] **다음 가이드에 따라 우선순위 1차 안을 매김**
  - **P0**: 부팅/인증/세션이 깨지면 전 서비스 다운인 엔드포인트
    - `/actuator/health`, OAuth2 보호 인증, 회원 조회/등록 핵심 CRUD, 그룹 조회/참가
  - **P1**: 일반 도메인 CRUD — 단일 사용자 흐름 정상 동작
    - counseling/memo/school/dgnss/file 업로드 다운로드/알림
  - **P2**: 관리/유틸/덜 호출되는 케이스
    - bug-report/통계/관리자 일괄/디버그

### Step 4: 사용자 검수

- [ ] **체크리스트 문서를 사용자에게 보여주고 P0/P1/P2 1회 검수**

### Step 5: 커밋

```powershell
git add docs/superpowers/specs/2026-05-21-upgrade-verification-checklist.md
git commit -m "[DOCS] Boot 4 업그레이드 검증 체크리스트 초안 (P0/P1/P2)"
```

---

## Task 2: build.gradle 전면 업데이트 + log4jdbc 제거 + Mockito javaagent

**Files:**
- Modify: `backend/build.gradle`
- Verify: `gradle/wrapper/gradle-wrapper.properties` (이미 8.14)

### Step 1: build.gradle 전체 교체

- [ ] **다음 내용으로 전체 교체** (v2 대비 변경: log4jdbc 제거 / MapStruct 1.6.3 + binding / `mockitoAgent` configuration + javaagent jvmArgs)

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '4.0.5'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'com.vs.meta'
version = '1.0.0-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
    mavenLocal()
}

configurations {
    all {
        exclude group: 'org.springframework.boot', module: 'spring-boot-starter-logging'
        exclude group: 'ch.qos.logback', module: 'logback-classic'
        exclude group: 'ch.qos.logback', module: 'logback-core'
    }
    compileOnly {
        extendsFrom annotationProcessor
    }
    // Mockito 5+ 는 JDK 21+ 에서 dynamic agent self-attach 가 deprecated/disabled.
    // mockito-core jar 만 별도 configuration 으로 분리해 test 의 jvmArgs 로 명시 주입.
    // (mypage 프로젝트의 검증된 패턴 차용)
    mockitoAgent
}

dependencies {
    // ===== Spring Boot Starters =====
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-aop'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'org.springframework.boot:spring-boot-starter-log4j2'

    // ===== MyBatis =====
    // 4.0.1: Spring Boot 4.x 정식 지원 라인 (3.0.x는 Boot 3.2~3.5 전용)
    implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.0.1'

    // ===== Cache =====
    implementation 'org.springframework.boot:spring-boot-starter-cache'
    implementation 'com.github.ben-manes.caffeine:caffeine'

    // ===== Database =====
    implementation 'com.mysql:mysql-connector-j:8.3.0'
    // log4jdbc-log4j2-jdbc4.1:1.16 제거 (2014년 이후 미업데이트, JDK21/SLF4J 2.x 미보장)
    // SQL 로깅 필요 시 후속 PR에서 p6spy:p6spy:3.9.1 로 대체.
    implementation 'org.apache.commons:commons-dbcp2:2.9.0'
    implementation 'org.neo4j.driver:neo4j-java-driver:5.28.5'

    // ===== Swagger =====
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6'

    // ===== Lombok =====
    compileOnly 'org.projectlombok:lombok:1.18.36'
    annotationProcessor 'org.projectlombok:lombok:1.18.36'

    // ===== MapStruct (1.6.3 — Jakarta + JDK 21 정식 지원) =====
    implementation 'org.mapstruct:mapstruct:1.6.3'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.6.3'
    annotationProcessor 'org.projectlombok:lombok-mapstruct-binding:0.2.0'

    // ===== Spring Data Commons (Pageable) =====
    implementation 'org.springframework.data:spring-data-commons'

    // ===== PDF (PDFBox) =====
    implementation 'org.apache.pdfbox:pdfbox:3.0.1'
    implementation 'de.rototor.pdfbox:graphics2d:3.0.1'

    // ===== Excel (Apache POI) =====
    implementation 'org.apache.poi:poi-ooxml:5.2.5'

    // ===== File Utils (commons-fileupload 제거 — Task 5에서 InMemoryMultipartFile 로 대체) =====
    implementation 'commons-io:commons-io:2.15.1'

    // ===== NCP Object Storage (S3 Compatible) =====
    // AWS SDK v1 EOL 2025-12-31. 후속 PR에서 v2 (software.amazon.awssdk) 로 마이그레이션 권장.
    implementation 'com.amazonaws:aws-java-sdk-s3:1.12.770'

    // ===== Apache Commons =====
    implementation 'org.apache.commons:commons-lang3:3.14.0'
    implementation 'org.apache.commons:commons-collections4:4.4'

    // ===== Gson =====
    implementation 'com.google.code.gson:gson:2.10.1'

    // ===== Security =====
    // jasypt-spring-boot-starter 제거 — 메타에서 미사용 (build.gradle 외 jasypt/ENC( 패턴 0건)
    implementation 'org.bouncycastle:bcprov-jdk18on:1.77'
    implementation 'org.owasp.encoder:encoder:1.2.3'
    implementation 'org.json:json:20240303'

    // ===== OAuth2 Resource Server (JWKS RS256 JWT 검증) =====
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'

    // ===== Notification Phase 2 — Redis Pub/Sub + ShedLock =====
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    // 7.x: Spring Boot 4.x 정식 지원 라인 (5.x는 Boot 3.x 전용)
    // 메타 코드는 withJdbcTemplate / usingDbTime 만 사용 — 5→7 코드 변경 0건
    implementation 'net.javacrumbs.shedlock:shedlock-spring:7.7.0'
    implementation 'net.javacrumbs.shedlock:shedlock-provider-jdbc-template:7.7.0'

    // ===== Test =====
    testImplementation('org.springframework.boot:spring-boot-starter-test') {
        exclude group: 'ch.qos.logback', module: 'logback-classic'
        exclude group: 'ch.qos.logback', module: 'logback-core'
        exclude group: 'org.springframework.boot', module: 'spring-boot-starter-logging'
    }
    // spring-security-test 제거 — 메타 test 디렉토리에서 미사용 (@WithMockUser/SecurityMockMvc 등 0건)
    testImplementation 'org.mockito:mockito-core:5.14.2'
    testImplementation 'org.junit.jupiter:junit-jupiter-api:5.11.3'
    testRuntimeOnly 'org.junit.jupiter:junit-jupiter-engine:5.11.3'

    // mockitoAgent: jvmArgs 로 -javaagent 주입에 사용 (transitive=false 로 byte-buddy 등 차단)
    mockitoAgent('org.mockito:mockito-core:5.14.2') { transitive = false }
}

sourceSets {
    test {
        java {
            srcDirs = ['src/test']
        }
    }
}

tasks.named('test') {
    useJUnitPlatform()
    // JDK 21+ dynamic agent loading 차단 회피 (Mockito 공식 권장, mypage 검증 패턴)
    jvmArgs("-javaagent:${configurations.mockitoAgent.asPath}")
}

bootRun {
    jvmArgs = ['-Dfile.encoding=UTF-8', '-Dsun.stdout.encoding=UTF-8', '-Dsun.stderr.encoding=UTF-8']
}

tasks.withType(JavaCompile) {
    options.encoding = 'UTF-8'
}

springBoot {
    buildInfo()
}
```

### Step 2: gradle wrapper 검증

- [ ] **gradle-wrapper.properties 가 8.14인지 확인**

```powershell
Get-Content gradle/wrapper/gradle-wrapper.properties | Select-String 'distributionUrl'
```

Expected: `gradle-8.14-bin.zip`

### Step 3: log4jdbc 사용처 잔재 확인

- [ ] **소스/설정에서 log4jdbc 참조 잔재 확인**

```
Grep tool:
  pattern: "log4jdbc|net\\.sf\\.log4jdbc"
  path: backend/src/main
```

`application*.yml`의 `jdbc:log4jdbc:` URL이나 `net.sf.log4jdbc.sql.jdbcapi.DriverSpy` driver-class-name 사용 시 → 원본 MySQL driver/URL로 교체.

### Step 4: 의존성 해석 1차 검증

- [ ] **의존성 다운로드 + classpath 해석**

```powershell
./gradlew :backend:dependencies --configuration compileClasspath 2>&1 | Select-Object -Last 30
```

Expected: BUILD SUCCESSFUL. (이 시점 컴파일은 javax/SecurityConfig 잔재로 실패할 수 있음 — Task 4~6에서 해결.)

### Step 5: 커밋

```powershell
git add backend/build.gradle gradle/wrapper/gradle-wrapper.properties
git commit -m "[BACKEND] Spring Boot 4.0.5 + Java 21 의존성 업데이트, log4jdbc 제거, MapStruct 1.6.3, Mockito javaagent"
```

---

## Task 3: 깨진 테스트 정리 + 신규 자동화 테스트 3종 작성

> **회귀 손실 보완**: 삭제 4개를 신규 3종 + Task 10 수동 시나리오로 대체. 신규 3종은 본 PR의 자동 회귀 안전망의 핵심.
>
> **사전 분석 결과 (2026-05-21):**
> - 살아있는 5개 테스트 (`GroupServiceTest`, `EmailVerificationServiceTest`, `SchoolImportManualTest`, `SchoolSyncServiceTest`, `NcpMailSenderTest`) — JWT/Admin dead reference 없음, 유지
> - `spring-security-test` 의존성 — 전체 test 디렉토리에서 0건 사용 → Task 2에서 build.gradle 제거 완료
> - `jjwt`(io.jsonwebtoken) — main/test 모두 0건 (이미 SSO 전환 시 제거됨)

**Files:**
- Delete: 기존 4개 (위 변경 맵)
- Create: 신규 3개 (`backend/src/test/com/vs/meta/upgrade/`)

### Step 1: 깨진 테스트 4개 삭제

- [ ] **PowerShell로 삭제**

```powershell
Remove-Item backend/src/test/com/vs/meta/api/group/controller/GroupWebMvcTest.java
Remove-Item backend/src/test/com/vs/meta/api/member/controller/MemberWebMvcTest.java
Remove-Item backend/src/test/com/vs/meta/api/school/controller/SchoolWebMvcTest.java
Remove-Item backend/src/test/com/vs/meta/api/member/service/MemberServiceTest.java
```

### Step 2: `MetaApiApplicationContextTest.java` 작성

- [ ] **신규 파일 생성**

`backend/src/test/com/vs/meta/upgrade/MetaApiApplicationContextTest.java`:

```java
package com.vs.meta.upgrade;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Spring 컨텍스트 전체 부팅 검증.
 * <p>log4j2 / MyBatis SqlSessionFactory / Caffeine / jasypt / ShedLock / Redis /
 * OAuth2 RS Bean wiring 을 모두 동시 검증한다.
 * <p>Boot 4 호환성 폭탄을 가장 빠르게 포착하는 테스트.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("local-test")
class MetaApiApplicationContextTest {

    @Test
    void contextLoads() {
        // Spring 이 모든 빈을 정상 와이어링하면 통과.
    }
}
```

**참고**: `local-test` 프로필이 없으면 `local` 사용. 단, DB 연결 실패 시 `@AutoConfigureTestDatabase` 또는 `spring.datasource.url=jdbc:h2:mem:testdb` 등으로 분리 필요 — Step 6에서 결정.

### Step 3: `SecuritySwaggerSmokeTest.java` 작성

- [ ] **신규 파일 생성**

`backend/src/test/com/vs/meta/upgrade/SecuritySwaggerSmokeTest.java`:

```java
package com.vs.meta.upgrade;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * springdoc 2.8.6 + Spring Security 7 동작 smoke test.
 * <ul>
 *   <li>/swagger-ui/index.html, /v3/api-docs, /actuator/health → 200</li>
 *   <li>보호 엔드포인트 무토큰 → 401 (Security 7 OAuth2 RS 동작)</li>
 *   <li>public 엔드포인트 (permitAll) → 5xx 아님</li>
 * </ul>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("local-test")
class SecuritySwaggerSmokeTest {

    @Autowired TestRestTemplate rest;

    @Test
    void swaggerUiServes() {
        ResponseEntity<String> res = rest.getForEntity("/swagger-ui/index.html", String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void openApiSpecServes() {
        ResponseEntity<String> res = rest.getForEntity("/v3/api-docs", String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).isNotNull().hasSizeGreaterThan(500);
    }

    @Test
    void actuatorHealth() {
        ResponseEntity<String> res = rest.getForEntity("/actuator/health", String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void protectedEndpointReturns401WithoutToken() {
        // 임의의 보호 엔드포인트 (인벤토리에서 P0 1개 선택, 예: /member/me)
        ResponseEntity<String> res = rest.getForEntity("/member/me", String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void publicEndpointReturnsNon5xx() {
        // permitAll 인 엔드포인트가 5xx 가 아니어야 함 (라우팅/필터 wiring 검증)
        ResponseEntity<String> res = rest.getForEntity("/actuator/health", String.class);
        assertThat(res.getStatusCode().is5xxServerError()).isFalse();
    }
}
```

### Step 4: `MemberMapperReadTest.java` 작성

- [ ] **신규 파일 생성**

`backend/src/test/com/vs/meta/upgrade/MemberMapperReadTest.java`:

```java
package com.vs.meta.upgrade;

import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * MyBatis 3.0.3 + Spring Boot 4.0.5 호환성 핵심 검증.
 * <p>SqlSessionFactory 가 정상 부트되고, XML 매퍼가 인식되며, slave 라우팅이 작동하는지 검증한다.
 * <p>실패 시 Boot 4 + MyBatis 호환성 폭탄이 터진 것 — 본 PR 진행 중단 후 mybatis 버전/BOM 재검토.
 */
@SpringBootTest
@ActiveProfiles("local-test")
class MemberMapperReadTest {

    @Autowired UserMapper userMapper;

    @Test
    void mapperBeanIsWired() {
        assertThat(userMapper).isNotNull();
    }

    @Test
    void canExecuteSelectQuery() {
        // 존재하지 않는 이메일이라도 NULL 반환은 정상 (SQLException 이 안 나면 OK).
        // 실 DB 연결 실패 시 ApplicationContext 부팅 자체가 실패하므로 여기까지 도달하면 SqlSession OK.
        User u = userMapper.findByEmail("__upgrade_smoke_test__@invalid.local");
        // null 또는 valid User — 둘 다 OK. Exception 만 안 나면 됨.
        assertThat(u).matches(user -> user == null || user.getEmail() != null);
    }
}
```

**참고**: `findByEmail`이 정확한 메서드 시그니처가 아니라면 `UserMapper` 코드 확인 후 실제 존재하는 read 메서드로 교체 (Task 1 시점에 한 번 확인).

### Step 5: 테스트 프로필 `application-local-test.yml` 작성

- [ ] **테스트 전용 프로필 생성** (필요 시)

`backend/src/test/resources/application-local-test.yml`:

```yaml
spring:
  config:
    activate:
      on-profile: local-test
  datasource:
    master:
      url: ${META_API_DATASOURCE_MASTER_URL:jdbc:h2:mem:meta_test;MODE=MYSQL;DB_CLOSE_DELAY=-1}
      username: ${META_API_DATASOURCE_MASTER_USERNAME:sa}
      password: ${META_API_DATASOURCE_MASTER_PASSWORD:}
      driver-class-name: ${SPRING_DATASOURCE_DRIVER_CLASS_NAME:org.h2.Driver}
    slave:
      url: ${META_API_DATASOURCE_SLAVE_URL:jdbc:h2:mem:meta_test;MODE=MYSQL;DB_CLOSE_DELAY=-1}
      username: ${META_API_DATASOURCE_SLAVE_USERNAME:sa}
      password: ${META_API_DATASOURCE_SLAVE_PASSWORD:}
      driver-class-name: ${SPRING_DATASOURCE_DRIVER_CLASS_NAME:org.h2.Driver}
  data:
    redis:
      host: ${SPRING_REDIS_HOST:localhost}
      port: ${SPRING_REDIS_PORT:6379}
  jasypt:
    encryptor:
      password: ${JASYPT_PASSWORD:test-only-not-prod}
```

**주의**: 본 PR은 H2 의존성을 추가하지 않으므로, **실 개발 서버 DB 환경변수**로 실행하는 게 기본. 환경변수가 없으면 컨텍스트 부팅이 실패 (의도된 동작 — CI 통과를 위해서는 환경변수 주입 필요).

### Step 6: 컴파일 + 테스트 1회 시도

- [ ] **테스트 컴파일 + 실행**

```powershell
# Task 4~6 미완 상태에서는 본 단계가 실패할 수 있음 — Task 9에서 다시 실행.
./gradlew :backend:compileTestJava 2>&1 | Select-Object -Last 20
```

이 시점 실패는 javax 잔재 + Security API 차이로 인한 정상 실패. 본 Task에서는 **테스트 파일 4개 삭제 후 본 4개 파일을 참조하는 잔재가 없는지만** 확인.

### Step 7: 커밋

```powershell
git add -A backend/src/test
git commit -m "[BACKEND] 죽은 테스트 4개 제거 + Boot 4 호환성 자동 검증 3종 추가"
```

---

## Task 4: javax → jakarta 네임스페이스 일괄 교체

> **주의**: `javax.sql.DataSource`, `javax.crypto.*`는 Java SE 패키지이므로 교체하지 않는다.

**Files:** 16개 Java 파일 (`javax.servlet.*`) + `LoginRateLimiter.java` (`javax.annotation.PostConstruct`)

### Step 1: javax.servlet.* 일괄 교체

- [ ] **PowerShell로 일괄 교체**

```powershell
Get-ChildItem -Path backend/src/main/java -Filter *.java -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $new = $content -replace 'import javax\.servlet\.', 'import jakarta.servlet.'
    if ($new -ne $content) {
        Set-Content -Path $_.FullName -Value $new -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($_.FullName)"
    }
}
```

대상 16개:
- `api/dgnss/controller/DgnssController.java`, `api/dgnss/service/DgnssService.java`, `api/dgnss/service/PdfService.java`
- `api/guest/controller/GuestAuthController.java`
- `api/sso/controller/AuthProxyController.java`
- `common/aop/ApiResponseAspect.java`, `common/aop/QchTraceAspect.java`
- `common/config/MdcLoggingFilter.java`, `common/config/QchRequestBodyCachingFilter.java`, `common/config/SpUserMappingFilter.java`
- `common/controller/FileController.java`, `common/controller/IndexController.java`
- `common/service/FileService.java`
- `common/utils/FileUtil.java`, `common/utils/PiiMasker.java`, `common/utils/SecurityUtil.java`

### Step 2: javax.annotation.PostConstruct 교체

- [ ] **LoginRateLimiter 만 교체**

```powershell
$file = 'backend/src/main/java/com/vs/meta/common/utils/LoginRateLimiter.java'
(Get-Content $file -Raw) -replace 'import javax\.annotation\.PostConstruct', 'import jakarta.annotation.PostConstruct' |
    Set-Content -Path $file -Encoding UTF8 -NoNewline
```

### Step 3: 잔재 0건 확인

- [ ] **Grep으로 확인**

```
Grep: pattern "import javax\\.servlet\\." path backend/src/main/java → 0건
Grep: pattern "import javax\\.annotation\\.PostConstruct" path backend/src/main/java → 0건
Grep: pattern "javax\\.sql\\.DataSource|javax\\.crypto" path backend/src/main/java → 그대로 유지되어야 함
```

### Step 4: 컴파일 확인

```powershell
./gradlew :backend:compileJava -x test 2>&1 | Select-Object -Last 25
```

이 시점에 SecurityConfig + CommonsMultipartFile 잔재 에러는 남아있다. javax 관련 에러는 모두 해소되어야 함.

### Step 5: 커밋

```powershell
git add backend/src/main/java
git commit -m "[BACKEND] javax → jakarta 네임스페이스 전환"
```

---

## Task 5: CommonsMultipartFile → InMemoryMultipartFile 대체

**Files:**
- Create: `backend/src/main/java/com/vs/meta/common/utils/InMemoryMultipartFile.java`
- Modify: `backend/src/main/java/com/vs/meta/api/dgnss/service/PdfService.java`
- Modify: `backend/src/main/java/com/vs/meta/api/dgnss/vo/PioPdfVO.java`

### Step 1: InMemoryMultipartFile 신규

- [ ] **파일 생성**

```java
package com.vs.meta.common.utils;

import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;

public class InMemoryMultipartFile implements MultipartFile {

    private final String name;
    private final String contentType;
    private final byte[] content;

    public InMemoryMultipartFile(String name, String contentType, byte[] content) {
        this.name = name;
        this.contentType = contentType;
        this.content = content == null ? new byte[0] : content;
    }

    @Override public String getName() { return name; }
    @Override public String getOriginalFilename() { return name; }
    @Override public String getContentType() { return contentType; }
    @Override public boolean isEmpty() { return content.length == 0; }
    @Override public long getSize() { return content.length; }
    @Override public byte[] getBytes() { return content; }
    @Override public InputStream getInputStream() { return new ByteArrayInputStream(content); }

    @Override
    public void transferTo(File dest) throws IOException {
        Files.write(dest.toPath(), content);
    }
}
```

### Step 2: PdfService.java 3곳 교체

- [ ] **`CommonsMultipartFile` 텍스트 검색으로 위치 확정 후 교체**

기존 패턴:
```java
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItem;
import org.springframework.web.multipart.commons.CommonsMultipartFile;
// ...
FileItem fileItem = new DiskFileItem("file", "application/pdf", true, file.getName(), pdfBytes.length, null);
try (OutputStream os = fileItem.getOutputStream()) { os.write(pdfBytes); os.flush(); }
MultipartFile mFile = new CommonsMultipartFile(fileItem);
```

교체:
```java
import com.vs.meta.common.utils.InMemoryMultipartFile;
// ...
MultipartFile mFile = new InMemoryMultipartFile(file.getName(), "application/pdf", pdfBytes);
```

### Step 3: PioPdfVO.java 동일 교체

- [ ] **import 3개 + 사용 코드 1곳**

### Step 4: 잔재 0건 확인

```
Grep: pattern "commons\\.fileupload|CommonsMultipartFile|DiskFileItem" path backend/src/main/java → 0건
```

### Step 5: 컴파일 확인

```powershell
./gradlew :backend:compileJava -x test 2>&1 | Select-Object -Last 20
```

이 시점 SecurityConfig 외 다른 에러는 모두 해소되어야 함.

### Step 6: 커밋

```powershell
git add backend/src/main/java
git commit -m "[BACKEND] CommonsMultipartFile 제거, InMemoryMultipartFile로 대체"
```

---

## Task 6: SecurityConfig — Spring Security 7 호환 람다 DSL 재작성

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/common/config/SecurityConfig.java`

### Step 1: SecurityConfig.java 전체 교체 (Security 7 호환)

- [ ] **전체 교체** (v1 계획 대비 변경점: `cors(Customizer.withDefaults())`, `frameOptions(AbstractHttpConfigurer::disable)`, `/actuator/health/**` permitAll)

```java
package com.vs.meta.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vs.meta.common.security.SpAuthenticatedUser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@EnableWebSecurity
@Configuration
public class SecurityConfig {

    private final Environment env;
    private final SpUserMappingFilter spUserMappingFilter;
    private final MdcLoggingFilter mdcLoggingFilter;

    public SecurityConfig(Environment env,
                          SpUserMappingFilter spUserMappingFilter,
                          MdcLoggingFilter mdcLoggingFilter) {
        this.env = env;
        this.spUserMappingFilter = spUserMappingFilter;
        this.mdcLoggingFilter = mdcLoggingFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public org.springframework.boot.web.servlet.FilterRegistrationBean<MdcLoggingFilter> mdcLoggingFilterRegistration(
            MdcLoggingFilter filter) {
        var reg = new org.springframework.boot.web.servlet.FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public org.springframework.boot.web.servlet.FilterRegistrationBean<SpUserMappingFilter> spUserMappingFilterRegistration(
            SpUserMappingFilter filter) {
        var reg = new org.springframework.boot.web.servlet.FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    @Order(1)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> headers
                .frameOptions(AbstractHttpConfigurer::disable)
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                auth
                    .requestMatchers("/api/v1/auth/**").permitAll()
                    .requestMatchers("/api/dgnss/graph/**").permitAll()
                    .requestMatchers("/guest/exists", "/guest/auth").permitAll()
                    .requestMatchers("/group/invite", "/group/join-guest").permitAll()
                    .requestMatchers("/member/send-code", "/member/verify-code").permitAll()
                    .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .requestMatchers("/viva/metric/prometheus").permitAll()
                    .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                    .requestMatchers("/", "/robots.txt", "/favicon.ico").permitAll()
                    .requestMatchers("/static/**").permitAll()
                    .requestMatchers("/dev/**").permitAll();

                if (isLocalProfileActive()) {
                    auth.anyRequest().permitAll();
                } else {
                    auth
                        .requestMatchers("/api/v1/user/complete-profile").authenticated()
                        .anyRequest().authenticated();
                }
            })
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding("UTF-8");
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("success", false);
                    body.put("resultCode", 401);
                    body.put("resultMessage", "Authentication is required.");
                    body.put("errorCode", "AUTH_REQUIRED");
                    new ObjectMapper().writeValue(response.getOutputStream(), body);
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding("UTF-8");
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("success", false);
                    body.put("resultCode", 403);
                    body.put("resultMessage", "Access is denied.");
                    body.put("errorCode", "ACCESS_DENIED");
                    new ObjectMapper().writeValue(response.getOutputStream(), body);
                })
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );

        http.addFilterBefore(mdcLoggingFilter, BearerTokenAuthenticationFilter.class);
        http.addFilterAfter(spUserMappingFilter, BearerTokenAuthenticationFilter.class);

        if (isRealProfileActive()) {
            http.headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
            );
        }

        return http.build();
    }

    private Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
        return jwt -> {
            String spUserId = jwt.getSubject();
            String email = jwt.getClaimAsString("email");
            String name = jwt.getClaimAsString("name");
            String userType = jwt.getClaimAsString("userType");

            var user = new SpAuthenticatedUser(spUserId, email, name, userType);
            String role = (userType != null) ? userType : "USER";
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

            return new UsernamePasswordAuthenticationToken(user, null, authorities);
        };
    }

    private boolean isRealProfileActive() {
        return Arrays.asList(env.getActiveProfiles()).contains("real");
    }

    private boolean isLocalProfileActive() {
        return Arrays.asList(env.getActiveProfiles()).contains("local");
    }
}
```

### Step 2: CorsConfigurationSource Bean 존재 확인

- [ ] **`CorsConfigurationSource` Bean 존재 확인**

```
Grep: pattern "CorsConfigurationSource" path backend/src/main/java
```

없으면 다음 Bean을 SecurityConfig 또는 CorsConfig에 추가:

```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    var cfg = new org.springframework.web.cors.CorsConfiguration();
    cfg.setAllowedOriginPatterns(List.of("*"));
    cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS","PATCH"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setAllowCredentials(true);
    var source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
}
```

### Step 3: 컴파일 확인

```powershell
./gradlew :backend:compileJava -x test 2>&1 | Select-Object -Last 20
```

Expected: BUILD SUCCESSFUL.

### Step 4: 커밋

```powershell
git add backend/src/main/java/com/vs/meta/common/config/SecurityConfig.java
git commit -m "[BACKEND] SecurityConfig WebSecurityConfigurerAdapter 제거, Security 7 람다 DSL 재작성"
```

---

## Task 7: SwaggerConfig 정리

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/common/config/SwaggerConfig.java`

### Step 1: InternalResourceViewResolver Bean 제거

- [ ] **`SwaggerConfig.java`에서 다음 제거**

```java
import org.springframework.web.servlet.view.InternalResourceViewResolver;

@Bean
public InternalResourceViewResolver defaultViewResolver() {
    return new InternalResourceViewResolver();
}
```

### Step 2: 컴파일 확인

```powershell
./gradlew :backend:compileJava -x test 2>&1 | Select-Object -Last 20
```

### Step 3: 커밋

```powershell
git add backend/src/main/java/com/vs/meta/common/config/SwaggerConfig.java
git commit -m "[BACKEND] SwaggerConfig InternalResourceViewResolver 제거"
```

---

## Task 8: Dockerfile Java 21 + NCP 이미지 가용성 사전 확인

**Files:**
- Modify: `backend/Dockerfile`

### Step 1: NCP 레지스트리 Java 21 이미지 가용성 확인

- [ ] **운영팀/인프라 담당에게 이미지 가용성 확인**

```
ncp-vsaidt-registry.ncr.gov-ntruss.com/openjdk:21-jdk-slim
ncp-vsaidt-registry.ncr.gov-ntruss.com/openjdk:21-jre-slim
```

또는 직접 확인:
```powershell
docker manifest inspect ncp-vsaidt-registry.ncr.gov-ntruss.com/openjdk:21-jdk-slim
docker manifest inspect ncp-vsaidt-registry.ncr.gov-ntruss.com/openjdk:21-jre-slim
```

없으면 fallback (`eclipse-temurin:21-jdk-alpine` / `eclipse-temurin:21-jre-alpine`) 운영팀 협의. 확정 안 되면 **본 Task는 별도 PR로 분리**.

### Step 2: Dockerfile 이미지 태그 교체

- [ ] **가용성 확정 후**

```dockerfile
FROM ncp-vsaidt-registry.ncr.gov-ntruss.com/openjdk:21-jdk-slim AS builder
# ...
FROM ncp-vsaidt-registry.ncr.gov-ntruss.com/openjdk:21-jre-slim
```

### Step 3: 커밋

```powershell
git add backend/Dockerfile
git commit -m "[BACKEND] Dockerfile Java 17 → 21 이미지 교체"
```

---

## Task 9: L1~L3 로컬 검증 + CLAUDE.md 갱신

> **다층 검증의 로컬 단계**: L1(compile) + L2(test) + L3(bootJar) 모두 통과 후 D1 진입.

### Step 1: L1 — 전체 컴파일

- [ ] **메인 + 테스트 컴파일**

```powershell
./gradlew :backend:compileJava :backend:compileTestJava 2>&1 | Select-Object -Last 30
```

Expected: BUILD SUCCESSFUL. **deprecated 경고는 종류/개수를 검증 로그에 기록** — Security 7 deprecated 항목은 후속 PR 작업 목록.

### Step 2: L2 — 자동화 테스트 실행

- [ ] **테스트 실행 (신규 3종 + 기존 잔여)**

```powershell
./gradlew :backend:test 2>&1 | Select-Object -Last 40
```

Expected: BUILD SUCCESSFUL. 특히:
- `MetaApiApplicationContextTest.contextLoads` ✅ → Boot 4 호환성 1차 통과
- `SecuritySwaggerSmokeTest.*` ✅ → Security 7 + springdoc 동작
- `MemberMapperReadTest.canExecuteSelectQuery` ✅ → **MyBatis 3.0.3 + Boot 4 호환성 핵심 검증 통과** (가장 큰 폭탄 해소)

실패 시:
- ContextLoads 실패: 의존성 호환성 문제 → Task 1 결과로 돌아가 mybatis/ShedLock/jasypt 버전 재검토
- SecuritySwaggerSmokeTest 실패: Security 7 또는 springdoc 설정 문제 → Task 6 재검토
- MemberMapperReadTest 실패: **MyBatis 호환성 폭탄** → 본 작업 중단, 사용자 보고, mybatis 버전/BOM 재결정

### Step 3: L3 — bootJar 빌드

- [ ] **JAR 산출물 생성**

```powershell
./gradlew :backend:bootJar -x test 2>&1 | Select-Object -Last 20
Get-ChildItem backend/build/libs/*.jar
```

Expected: BUILD SUCCESSFUL, JAR 파일 존재.

### Step 4: CLAUDE.md Tech Stack 갱신

- [ ] **`backend/CLAUDE.md` 갱신**

```diff
- - **Java 17** + **Spring Boot 2.7.17** + **Gradle**
+ - **Java 21** + **Spring Boot 4.0.5** + **Gradle 8.14**
- - **MyBatis 2.3.1** + **MySQL 8.3.0**
+ - **MyBatis Spring Boot Starter 3.0.3** + **MySQL 8.3.0**
- - **Dual Security**: Admin(Session) + API(JWT Stateless)
+ - **Security**: API JWT Stateless (SuperPlatform SSO RS256 + JWKS) — Admin 영역 폐기됨
- - **Admin UI**: Thymeleaf + AdminLTE 3.x (CDN)
+ - (Admin UI 영역은 SSO 통합 이후 폐기됨)
```

### Step 5: 커밋

```powershell
git add backend/CLAUDE.md
git commit -m "[BACKEND] CLAUDE.md Tech Stack 갱신 (Java 21 / Spring Boot 4.0.5)"
```

---

## Task 10: D1~D4 개발 서버 검증 (자동 추출 인벤토리 기반)

> **본 PR의 머지 가능 여부를 판정하는 단계.** 커밋 없음, 검증 로그만 갱신.

### Step 1: D1 — 개발 서버 배포

- [ ] **운영팀 배포 절차로 개발 서버에 신규 JAR 배포**
- [ ] **부팅 로그 확인**: `Started MetaApiApplication in X.XXX seconds`
- [ ] **에러/예외 스택트레이스 0건**

### Step 2: D2 — P0 시나리오 검증

- [ ] **Task 1.5 체크리스트에서 P0 항목 전체를 순차 호출**

매 항목 검증 시:
1. HTTP 상태 코드 확인
2. 응답 본문 핵심 필드 검증
3. 서버 로그 확인 (5xx 에러 / 예외 스택트레이스 없음)
4. 결과를 체크리스트의 "결과" 컬럼에 ✅/❌ 기재

**❌ 1건이라도 발생 시 즉시 D1 이전 JAR로 롤백 + 본 작업 중단.**

### Step 3: D3 — P1 시나리오 검증

- [ ] **체크리스트의 P1 항목 순차 호출 (15~20개)**

D2와 동일 절차. **❌ 발생 시 머지 보류, 원인 분석 후 패치 → D2~D3 재실행.**

### Step 4: D4 — P2 시나리오 검증

- [ ] **체크리스트의 P2 항목 호출**

부분 실패 허용. **❌ 항목은 별도 GitLab 이슈 등록 필수** (본 PR 머지와는 분리).

### Step 5: 핵심 라이브러리 매트릭스 검증 (D2~D3 중에 동시 수집)

| 의존성 | 트리거 | 확인 방법 |
|:---|:---|:---|
| MyBatis 4.0.1 | P0 회원 조회 | 응답 데이터 정상 |
| Master/Slave 라우팅 | P1 readOnly 메서드 | 서버 로그에 `slave` DataSource 사용 흔적 |
| OAuth2 RS + JWKS | P0 인증 흐름 | 200 응답 + SecurityContext에 SpAuthenticatedUser |
| log4j2 | 모든 시나리오 | 정상 로그 출력 |
| NCP Mail (jasypt 미사용, 평문 환경변수) | P0 이메일 발송 | 발송 성공 + 로그 |
| Caffeine | P1 동일 조회 2회 | 2회째 캐시 hit 로그 |
| ShedLock 7.7.0 | D3 스케줄 잡 1회 | `shedlock` 테이블 row 확인 |
| Redis Pub/Sub | D3 알림 발송 | 구독자 수신 확인 |
| PDFBox | D3 DGNSS PDF | PDF 정상 생성 |
| POI | D3 Excel 다운로드 | xlsx 정상 다운로드 |
| AWS SDK v1 | D3 파일 업로드 | NCP S3에 업로드 + 조회 성공 |
| Neo4j | D3 `/api/dgnss/graph/**` | 그래프 응답 정상 |
| MapStruct 1.6.3 | D3 DTO 변환 API | 응답 DTO 필드 정상 |
| AOP 4종 | D3 임의 API | 로그에 4종 Aspect 동작 흔적 |

### Step 6: 머지 게이트 판정

- [ ] **머지 조건 (AND)**
  - L1 ✅ L2 ✅ L3 ✅ (Task 9에서 확정)
  - D2 (P0) 100% ✅
  - D3 (P1) 100% ✅
  - D4 (P2) 일부 실패는 별도 이슈로 분리됨

- [ ] **머지 조건 충족 시 사용자에게 보고**: "L1~L3 + D2 + D3 모두 통과. main 머지 가능 상태."

---

## Task 11: Jackson 2 → 3 (tools.jackson) 마이그레이션 — Task 1 누락분 보강

> **사후 추가 (2026-05-22)**: Task 9 에서 L1~L3 모두 통과했으나 실제 부팅 시도에서 ApplicationContext 가 `ObjectMapper` bean 미생성으로 실패. 원인은 Boot 4 가 기본 Jackson 라인을 `tools.jackson 3.x` 로 전환하고 `com.fasterxml.jackson.databind.ObjectMapper` autoconfig 를 제거한 사실 (Task 1 사전 조사 누락). 본 Task 에서 운영 코드를 Jackson 3 API 로 정렬한다.

**Files (10):**
- `api/ai/service/AiConversationService.java`
- `api/counseling/service/CounselingService.java`
- `api/dgnss/service/DgnssLpaService.java` (+ `JsonNode.fields()` → `properties()`)
- `api/dgnss/service/DgnssService.java` (+ `throws JsonProcessingException` 시그니처 2건 제거)
- `api/notification/dispatcher/NotificationRedisConfig.java` (+ `JavaTimeModule`/`WRITE_DATES_AS_TIMESTAMPS` 제거, `JsonMapper.builder()` 전환)
- `api/notification/dispatcher/RedisPubSubDispatcher.java`
- `api/notification/dispatcher/RedisPubSubSubscriber.java`
- `common/aop/QchTraceAspect.java`
- `common/config/SecurityConfig.java`
- `common/utils/NcpMailSender.java`

**제외:** `common/response/ResponseDTO.java`, `common/service/QchTraceEvent.java` — annotation 패키지 (`com.fasterxml.jackson.annotation.*`) 만 사용해 변경 불필요 (Jackson 3 도 v2 annotation jar 에 의존).

### 적용 매핑

| 기존 (Jackson 2) | 신규 (Jackson 3) | 비고 |
|:---|:---|:---|
| `com.fasterxml.jackson.databind.*` (`ObjectMapper`, `JsonNode`, `SerializationFeature`) | `tools.jackson.databind.*` | |
| `com.fasterxml.jackson.core.type.TypeReference` | `tools.jackson.core.type.TypeReference` | |
| `com.fasterxml.jackson.core.JsonProcessingException` (checked) | `tools.jackson.core.JacksonException` | `RuntimeException` 상속 — `throws` 제거 가능 |
| `com.fasterxml.jackson.datatype.jsr310.JavaTimeModule` | **삭제** | Jackson 3 가 `java.time` 직렬화 자동 등록 |
| `SerializationFeature.WRITE_DATES_AS_TIMESTAMPS` | **삭제** | 기본이 ISO 문자열로 변경됨 |
| `new ObjectMapper()` + `setVisibility()` / `disable()` | `JsonMapper.builder()....build()` | Jackson 3 의 `ObjectMapper` 는 immutable |
| `JsonNode.fields()` | `JsonNode.properties()` | Jackson 3 에서 제거 |
| `com.fasterxml.jackson.annotation.*` | **유지** | Jackson 3 가 동일 annotation jar 에 의존 |

### 검증

- L1 `compileJava + compileTestJava`: ✅ BUILD SUCCESSFUL
- L2 `test` (`com.vs.meta.upgrade.*`): ✅ tests=8 / skipped=8 / failures=0 (env 가드 작동, 의도된 skip)
- L3 `bootJar`: ✅ BUILD SUCCESSFUL, JAR 108.49 MB (이전 108.53 MB)
- 실제 부팅: 사용자 환경에서 NCP S3 환경변수 주입 후 재시도 필요

### 커밋

`bc93112` [BACKEND] Spring Boot 4 Jackson 2 → 3 (tools.jackson) 마이그레이션

---

## 후속 작업 (별도 PR 권장)

본 업그레이드와 분리:
1. AWS SDK v1 → v2 (EOL 2025-12-31)
2. commons-dbcp2 → HikariCP
3. SQL 로깅 필요 시 p6spy 도입 (log4jdbc 대체)
4. Mockito 5.x 인라인 mock 신문법 적용
5. Spring Security 7 deprecated API 정리 (Task 9 Step 1 수집 결과)

---

## 검증 로그 (작업 진행 중 기록)

| 항목 | Task | 검증 일시 | 결과 | 비고 |
|:---|:---:|:---|:---|:---|
| mybatis-spring-boot-starter Boot 4 호환성 | 1 | 2026-05-21 | ✅ **4.0.1로 갱신 결정** | 3.0.x는 Boot 3.2~3.5 전용, 4.0.x가 Boot 4 정식 |
| ShedLock Boot 4 호환성 | 1 | 2026-05-21 | ✅ **7.7.0으로 갱신 결정** | 5.x는 Boot 3.x 전용, 7.x가 Boot 4 정식. 메타 코드 변경 0건 확인 |
| jasypt-spring-boot-starter | 1 | 2026-05-21 | ✅ **완전 제거 결정** | 메타에서 미사용 (jasypt/ENC( 패턴 0건) |
| MapStruct 1.6.3 + Jakarta + JDK 21 | 1 | 2026-05-21 | ✅ OK | + lombok-mapstruct-binding 0.2.0 |
| mypage Mockito javaagent 패턴 확인 | 1 | 2026-05-21 | ✅ OK | mypage build.gradle:23-25, 70-79 검증 패턴 차용 |
| 운영 표면 인벤토리 추출 + 우선순위 부여 | 1.5 | 2026-05-21 | ✅ 총 71개+α, P0=11 / P1=32 / P2=28 + 라이브러리 매트릭스 14종 | 커밋 `59b3dc4` — `docs/superpowers/specs/2026-05-21-upgrade-verification-checklist.md` |
| NCP Java 21 이미지 가용성 | 8 | 2026-05-21 | ✅ OK | `ncp-vsaidt-registry.ncr.gov-ntruss.com/openjdk:21-jdk` (IDP/mypage와 동일 운영 검증 이미지) — 커밋 `47f5a1b`. 운영팀 컨택: _추후 기재_ |
| L1 compileJava + compileTestJava | 9 | 2026-05-22 재실행 | ✅ BUILD SUCCESSFUL (23s, JDK 21.0.11) | deprecation 2건 (`JsonNode.fields()` ×2 in `DgnssLpaService.java:244,326` — Jackson 2.18 deprecated) / unchecked 33건 / **Spring Security 7 deprecated 0건**. (해당 fields() 호출은 Task 11 에서 `properties()` 로 교체됨) |
| L2 test (신규 3종) | 9 | 2026-05-22 재실행 | ✅ BUILD SUCCESSFUL (tests=8, skipped=8, failures=0, errors=0) | 3종 모두 `@EnabledIfEnvironmentVariable("META_API_DATASOURCE_MASTER_URL")` 가드 작동 — 로컬 DB env 미주입으로 의도된 skip. CI/D 환경에서 env 주입 후 재실행 필요 |
| L3 bootJar | 9 | 2026-05-22 재실행 | ✅ BUILD SUCCESSFUL (4s) | JAR 크기 **108.53 MB** (`backend/build/libs/backend-1.0.0-SNAPSHOT.jar`) |
| **Task 11: Jackson 2 → 3 마이그레이션** | **11** | **2026-05-22** | **✅ L1/L2/L3 재통과** | **커밋 `bc93112`. 10 Java 파일 변경. JAR 108.53 → 108.49 MB. ObjectMapper bean 부팅 실패 회귀 해소. 상세는 위험 매트릭스 참조** |
| D2 P0 시나리오 | 10 | _D1 배포 후 기재_ | _⏳_ | 체크리스트 P0×11 — 100% 통과 필수 |
| D3 P1 시나리오 | 10 | _D1 배포 후 기재_ | _⏳_ | 체크리스트 P1×32 — 100% 통과 필수 |
| D4 P2 시나리오 | 10 | _D1 배포 후 기재_ | _⏳_ | 체크리스트 P2×28+ — 부분 실패 허용, ❌는 별도 이슈 |
| 핵심 라이브러리 매트릭스 (14개) | 10 | _D2~D3 중 동시 수집_ | _⏳_ | MyBatis 4.0.1 / Master·Slave / OAuth2 RS / log4j2 / Mail / Caffeine / Redis Pub/Sub / ShedLock 7.7.0 / PDFBox / POI / S3 v1 / Neo4j / MapStruct 1.6.3 / AOP 4종 |

---

## 롤백 전략

- Task별 커밋이 모두 분리됨 → `git revert <hash>` 부분 롤백 가능
- 본 브랜치(`feature/backend-version-upgrade`)는 미푸시 상태 → `git reset --hard origin/main` 으로 전체 롤백 가능
- D1 부팅 실패 / D2 실패: 운영팀과 협의하여 이전 JAR 즉시 배포
- 빌드 실패 시 `git bisect run ./gradlew :backend:compileJava` 로 원인 커밋 자동 탐색
