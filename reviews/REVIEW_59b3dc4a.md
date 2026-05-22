> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 59b3dc4a

## 코드 복잡도 분석

변경된 파일의 복잡도 정보를 찾을 수 없습니다.
(인덱스가 생성되지 않았거나 새로운 파일일 수 있습니다)

---



## 변경 배경

이 커밋은 meta-dashboard 백엔드의 **Spring Boot 2.7.17 + Java 17 → Spring Boot 4.0.5 + Java 21** 업그레이드를 위한 상세 실행 계획(Implementation Plan v4)과 검증 우선 설계 문서(Verification-First Design)를 추가한 문서 커밋입니다.

- **목적**: Spring Boot 2→4 메이저 점프(2개 메이저 버전, Jakarta 전환, Security 7)를 안전하게 수행하기 위한 Task 단위 실행 계획 수립
- **도메인**: 인프라 / 백엔드 아키텍처 / 문서
- **변경 방향**: 단순 버전 업그레이드가 아닌, 다층 검증 파이프라인(L1~L3 로컬 + D1~D4 개발 서버)을 통과해야 머지하는 **검증 우선(Verification-First)** 접근법 채택. Task 1에서 호환성 조사 결과를 반영하여 위험도 RED 3건을 모두 GREEN으로 전환한 점이 핵심 개선점

---

## [GOOD] 잘된 점

1. **검증 우선 설계(Verification-First Design)의 명확한 정의**: 단순히 "버전 올리기"가 아니라, L1~L3 로컬 검증 + D1~D4 개발 서버 검증을 통과해야 머지하는 파이프라인을 문서화한 점이 매우 실용적입니다. 특히 D2(P0) 실패 시 즉시 롤백하는 명시적 게이트는 운영 안정성에 큰 도움이 됩니다.

2. **위험도 매트릭스의 체계적 관리**: Task 1에서 사전 조사한 결과를 바탕으로 RED 3건 → 0건, YELLOW 5건 → 2건으로 위험도를 낮춘 후 계획을 수립한 점이 인상적입니다. 특히 log4jdbc 유지 결정(IDP 검증 사실 확인 후 v3의 제거 결정을 철회)과 jasypt 완전 제거 결정은 데이터 기반 의사결정의 좋은 예시입니다.

3. **Task 분리의 완성도**: Admin 영역 폐기(Task 0)를 업그레이드와 분리하고, 각 Task가 독립적으로 커밋 가능하도록 설계되어 `git revert`를 통한 부분 롤백이 가능합니다. 또한 `git bisect`를 활용한 원인 커밋 자동 탐색 전략까지 명시된 점이 고급집니다.

4. **회귀 손실 보완 전략**: WebMvcTest 4개 삭제로 인한 회귀 안전망 약화를 신규 테스트 3종(`MetaApiApplicationContextTest`, `SecuritySwaggerSmokeTest`, `MemberMapperReadTest`)으로 보완한 설계가 현명합니다. 특히 `MemberMapperReadTest`는 MyBatis 호환성 폭탄을 가장 빠르게 포착하는 테스트로, 실패 시 "본 작업 중단"이라는 명확한 판단 기준을 제시합니다.

---

## 변경사항 요약

- `docs/superpowers/plans/2026-05-21-spring-boot-4-upgrade.md` (신규, 1326줄): Spring Boot 4 업그레이드 실행 계획 v4 — Task 0~10까지의 상세 단계, 파일 변경 맵, 검증 파이프라인, 롤백 전략 포함
- `docs/superpowers/specs/2026-05-21-spring-boot-4-upgrade-design.md` (신규, 216줄): 검증 우선 설계 문서 — 문제 정의, 레퍼런스 프로젝트 검증 매트릭스, 다층 검증 파이프라인 정의

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

**없음** — 이 커밋은 실행 코드가 아닌 문서(plan/spec)만 포함하므로, 버그나 보안 취약점이 존재하지 않습니다.

### High (우선 수정 권장)

**없음** — 문서 커밋으로서 High 수준의 이슈는 발견되지 않았습니다.

### Medium (개선 권장)

#### 1. Task 1.5 Step 1: 엔드포인트 자동 추출 시 클래스 레벨 @RequestMapping 누락 가능성

**변경 내용:**
Task 1.5의 Step 1에서 엔드포인트 추출을 위한 Grep 패턴으로 `@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\\b`를 제시하고 있습니다.

**개선 제안:**
`@RequestMapping`은 메서드 레벨뿐 아니라 **클래스 레벨**에도 사용될 수 있습니다. 클래스 레벨 `@RequestMapping`만 있고 메서드 레벨에는 하위 매핑(`@GetMapping` 등)만 있는 경우, 현재 패턴으로는 클래스 레벨의 base path가 누락될 수 있습니다.

- **위치**: `docs/superpowers/plans/2026-05-21-spring-boot-4-upgrade.md`, Task 1.5 Step 1
- **기존 코드**:
```
Grep tool:
  pattern: "@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\\b"
  path: backend/src/main/java
  output_mode: content
  -n: true
```
- **해결 방안**: 
  클래스 레벨 `@RequestMapping`을 별도 추출하여 메서드 레벨 매핑과 조합하는 후처리 단계를 Step 1에 추가하거나, 최소한 다음과 같은 주의사항을 문서에 명시하는 것을 제안합니다:

  > **주의**: 클래스 레벨 `@RequestMapping`은 위 Grep으로 포착되지만, 해당 클래스의 메서드 레벨 매핑과의 조합(base path + method path)은 별도 후처리가 필요합니다. 예: `@RequestMapping("/api/v1/member")` 클래스 + `@GetMapping("/{id}")` 메서드 → 실제 엔드포인트는 `GET /api/v1/member/{id}`

#### 2. Task 3 Step 5: H2 의존성 미포함으로 인한 테스트 실행 불가능성

**변경 내용:**
Task 3 Step 5에서 테스트 전용 프로필 `application-local-test.yml`을 작성하되, "본 PR은 H2 의존성을 추가하지 않으므로, 실 개발 서버 DB 환경변수로 실행하는 게 기본"이라고 명시하고 있습니다.

**개선 제안:**
로컬 개발 환경에서 환경변수 없이도 테스트가 실행될 수 있도록, H2 의존성을 `testImplementation`으로 추가하는 것을 고려해야 합니다. 현재 설계대로라면 CI/CD 파이프라인에서도 개발 서버 DB 환경변수가 필요하여, CI 환경 구성이 복잡해집니다.

- **위치**: `docs/superpowers/plans/2026-05-21-spring-boot-4-upgrade.md`, Task 3 Step 5
- **기존 코드**:
```yaml
spring:
  datasource:
    master:
      url: ${META_API_DATASOURCE_MASTER_URL:jdbc:h2:mem:meta_test;MODE=MYSQL;DB_CLOSE_DELAY=-1}
```
- **해결 방안**: 
  build.gradle에 다음 의존성을 추가하는 것을 Task 2 또는 Task 3에 포함시키는 것을 제안합니다:
```groovy
  // ===== Test (H2 for local-test profile) =====
  testImplementation 'com.h2database:h2:2.2.224'
```
  이렇게 하면 `application-local-test.yml`의 H2 fallback URL이 실제로 동작하며, CI/CD에서도 별도 환경변수 설정 없이 테스트가 가능합니다. 단, H2의 MySQL 호환 모드(`MODE=MYSQL`)가 실제 MySQL과 완전히 동일하지는 않으므로, `MemberMapperReadTest`의 `canExecuteSelectQuery`는 실제 DB 연결을 검증하지 못한다는 한계는 문서에 명시되어야 합니다.

#### 3. Task 6 Step 2: CorsConfigurationSource Bean 조건부 추가의 위험성

**변경 내용:**
Task 6 Step 2에서 `CorsConfigurationSource` Bean의 존재를 Grep으로 확인하고, 없으면 추가하도록 안내하고 있습니다.

**개선 제안:**
이 Bean의 존재 여부는 SecurityConfig의 `cors(Customizer.withDefaults())`가 정상 동작하는지에 직접적인 영향을 줍니다. `withDefaults()`는 `CorsConfigurationSource` Bean이 없으면 빈 CORS 설정을 사용하므로, 의도치 않게 CORS가 모두 차단될 수 있습니다.

- **위치**: `docs/superpowers/plans/2026-05-21-spring-boot-4-upgrade.md`, Task 6 Step 2
- **해결 방안**: 
  "없으면 추가"라는 조건부 로직 대신, **항상 SecurityConfig 내에 `CorsConfigurationSource` Bean을 명시적으로 정의**하는 것을 제안합니다. 이렇게 하면:
  1. CORS 설정이 항상 일관되게 동작함
  2. 기존에 CorsConfig가 별도 파일로 존재하더라도 중복 정의 시 Spring이 `@ConditionalOnMissingBean` 없이 충돌을 일으키므로, 오히려 중복을 조기에 발견할 수 있음

  ```java
  @Bean
  CorsConfigurationSource corsConfigurationSource() {
      var cfg = new org.springframework.web.cors.CorsConfiguration();
      cfg.setAllowedOriginPatterns(List.of("*"));
      cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
      cfg.setAllowedHeaders(List.of("*"));
      cfg.setAllowCredentials(true);
      var source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
      source.registerCorsConfiguration("/**", cfg);
      return source;
  }
  ```

#### 4. Task 9 Step 4: CLAUDE.md의 MyBatis 버전 불일치 (3.0.3 vs 4.0.1)

**변경 내용:**
Task 9 Step 4에서 CLAUDE.md의 Tech Stack을 갱신할 때, MyBatis 버전을 `MyBatis Spring Boot Starter 3.0.3`으로 표기하고 있습니다.

**개선 제안:**
Task 2의 build.gradle에서는 `mybatis-spring-boot-starter:4.0.1`로 설정되어 있습니다. CLAUDE.md에는 **4.0.1**로 표기되어야 일관성이 유지됩니다.

- **위치**: `docs/superpowers/plans/2026-05-21-spring-boot-4-upgrade.md`, Task 9 Step 4
- **기존 코드**:
```diff
+- - **MyBatis Spring Boot Starter 3.0.3** + **MySQL 8.3.0**
```
- **해결 방안**: 
```diff
+- - **MyBatis Spring Boot Starter 4.0.1** + **MySQL 8.3.0**
```

---

## 주요 파일 분석

### `docs/superpowers/plans/2026-05-21-spring-boot-4-upgrade.md`

**변경 내용:**
Spring Boot 4 업그레이드를 위한 10개 Task로 구성된 상세 실행 계획 (1326줄)

**개선 제안:**

1. **Task 3 Step 5: H2 의존성 미포함으로 인한 테스트 실행 불가능성**
   - **위치**: Task 3 Step 5
   - **기존 코드**: `application-local-test.yml`에서 H2 URL을 fallback으로 설정했으나, build.gradle에 H2 의존성이 없어 실제로는 H2 드라이버를 찾지 못해 컨텍스트 부팅 실패
   - **해결 방안**: 위 Medium #2에서 제안한 대로, build.gradle에 `testImplementation 'com.h2database:h2:2.2.224'` 추가를 Task 2 또는 Task 3에 포함

2. **Task 6 Step 2: CorsConfigurationSource Bean 조건부 추가의 위험성**
   - **위치**: Task 6 Step 2
   - **기존 코드**: "없으면 추가"라는 조건부 로직
   - **해결 방안**: 위 Medium #3에서 제안한 대로, 항상 명시적 Bean 정의로 변경

3. **Task 9 Step 4: MyBatis 버전 불일치 (3.0.3 vs 4.0.1)**
   - **위치**: Task 9 Step 4
   - **기존 코드**: `MyBatis Spring Boot Starter 3.0.3`
   - **해결 방안**: `MyBatis Spring Boot Starter 4.0.1`로 수정

### `docs/superpowers/specs/2026-05-21-spring-boot-4-upgrade-design.md`

**변경 내용:**
검증 우선 설계 문서 (216줄) — 문제 정의, 레퍼런스 프로젝트 검증 매트릭스, 다층 검증 파이프라인 정의

**개선 제안:**

1. **레퍼런스 프로젝트 검증 매트릭스의 MyBatis 항목 보강**
   - **위치**: 섹션 2 "레퍼런스 프로젝트 검증 매트릭스"
   - **기존 코드**: MyBatis 항목이 "자체 검증 필수"로만 표기
   - **해결 방안**: MyBatis 4.0.1의 Boot 4 호환성에 대한 구체적인 검증 기준(예: `MemberMapperReadTest` 통과 기준, MyBatis 3.x→4.x의 breaking change 체크리스트)을 추가하여, 단순히 "자체 검증"이라는 추상적 표현을 구체화하는 것을 제안합니다.

---

## 최종 평가

**결론**: 
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**
이 커밋은 문서(plan/spec)만 포함하므로 코드 레벨의 버그는 존재하지 않습니다. 전체적으로 매우 체계적이고 실용적인 업그레이드 계획이며, 특히 검증 우선 접근법과 위험도 매트릭스의 체계적 관리는 높이 평가할 만합니다. 다만, 위에서 제안한 4가지 Medium 수준의 개선점(Task 1.5 엔드포인트 추출 보완, H2 의존성 추가, CorsConfigurationSource 명시적 정의, MyBatis 버전 불일치 수정)을 반영하면 계획의 완성도가 더욱 높아질 것으로 보입니다. 특히 **H2 의존성 미포함**은 실제 실행 시 테스트 실패로 이어질 가능성이 높으므로, Task 2 또는 Task 3에 반영을 권장합니다.