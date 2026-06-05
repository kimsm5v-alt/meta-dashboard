> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - abc4e639

## 코드 복잡도 분석

변경된 파일의 복잡도 정보를 찾을 수 없습니다.
(인덱스가 생성되지 않았거나 새로운 파일일 수 있습니다)

---



## 변경 배경

이 커밋은 SuperPlatform Auth SSO 연동 설정 중 `internal-api.base-url` 값을 dev 환경(`application-vs-dev.yml`)에 명시적으로 오버라이드하는 변경입니다. 공통 `application.yml`에는 `http://localhost:8080/api/v1`이 기본값으로 설정되어 있어, dev 환경에서 이 값을 그대로 사용하면 회원정보 조회(internal API)가 모두 실패(placeholder 처리)하게 됩니다. 이를 방지하기 위해 dev 환경의 실제 Auth 서버 URL(`https://t-auth-superplatform-api.vsaidt.com/api/v1`)로 재정의합니다.

- **목적**: dev 환경에서 SuperPlatform Auth Internal API base URL을 실제 운영형 URL로 오버라이드하여 회원정보 조회(PersonInfo)가 정상 동작하도록 함
- **도메인**: 인프라 설정 (SSO/Auth 연동)
- **변경 방향**: 공통 설정의 로컬호스트 기본값을 dev 환경에 맞는 실제 URL로 재정의

## [GOOD] 잘된 점

1. **명확한 주석 처리**: "회원정보 조회용 internal API base URL. 누락 시 공통 application.yml의 기본값"이라는 주석이 누락 시 영향도를 명확히 설명하고 있어, 향후 유지보수자가 설정의 의미를 쉽게 이해할 수 있습니다. 특히 "http://localhost:8080/api/v1 로 떨어져 enrich 가 전부 placeholder 처리됨"이라는 구체적인 영향도 설명이 매우 유용합니다.

2. **환경변수 기반 설정**: `${SP_AUTH_INTERNAL_API_URL:https://t-auth-superplatform-api.vsaidt.com/api/v1}` 형태로 환경변수 주입이 가능하면서도 기본값을 제공하는 이중 안전장치를 적용했습니다. 이는 컨테이너 환경에서 유연하게 대응할 수 있게 합니다.

3. **공통 설정과의 일관성 유지**: `application.yml`의 `superplatform.auth.internal-api.base-url` 구조를 그대로 따라 dev profile에서 오버라이드하는 방식이 일관성 있습니다. Spring Boot의 profile 우선순위 메커니즘을 정확히 이해하고 활용하고 있습니다.

## 변경사항 요약

`application-vs-dev.yml`의 `superplatform.auth` 섹션에 `internal-api.base-url` 설정을 추가하여, dev 환경에서 SuperPlatform Auth Internal API의 base URL을 `https://t-auth-superplatform-api.vsaidt.com/api/v1`로 명시적으로 지정했습니다. 이 설정은 `PersonInfoClientConfig`에서 `SpAuthProperties.InternalApi.getBaseUrl()`을 통해 읽혀 `personInfoRestClient` 빈의 base URL로 사용됩니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

1. **prod profile에도 동일 설정 누락**

   `application-vs-prod.yml`에는 `superplatform.auth` 섹션이 아예 존재하지 않습니다. prod 환경에서도 공통 설정의 `http://localhost:8080/api/v1` 기본값이 그대로 사용될 위험이 있습니다. prod 배포 시 환경변수 `SP_AUTH_INTERNAL_API_URL`이 반드시 주입되어야 하는데, 이 의존성이 명시적으로 문서화되어 있지 않습니다.

   - **위치**: `application-vs-prod.yml` (전체 파일)
   - **제안**: prod profile에도 동일한 구조의 `superplatform.auth.internal-api.base-url` 설정을 추가하거나, 최소한 prod 배포 시 필요한 환경변수 목록에 `SP_AUTH_INTERNAL_API_URL`이 포함되어야 함을 문서화하는 것이 좋습니다.

2. **`service-token-scope`, `connect-timeout-ms`, `read-timeout-ms` 누락**

   공통 `application.yml`에는 `internal-api` 하위에 `service-token-scope: users:read`, `connect-timeout-ms: 2000`, `read-timeout-ms: 3000`이 정의되어 있습니다. dev profile에서 `base-url`만 오버라이드할 경우, 나머지 값들은 공통 설정을 그대로 상속받으므로 문제는 없습니다. 그러나 향후 dev 환경에서 timeout 값을 다르게 설정해야 할 경우를 대비해, 주석으로라도 이 값들이 공통 설정에서 상속됨을 명시하면 가독성이 향상됩니다.

   - **위치**: `application-vs-dev.yml` 라인 19-20
   - **제안**: `base-url` 설정 아래에 `# service-token-scope, connect-timeout-ms, read-timeout-ms는 공통 application.yml 값 상속` 정도의 주석을 추가하는 것을 검토하세요.

---

## 주요 파일 분석

### application-vs-dev.yml

**변경 내용:**
`superplatform.auth.internal-api.base-url` 설정을 추가하여 dev 환경의 Internal API URL을 `https://t-auth-superplatform-api.vsaidt.com/api/v1`로 지정.

**설정 구조 분석:**

이 설정이 실제로 사용되는 흐름은 다음과 같습니다:

1. `SpAuthProperties` 클래스가 `@ConfigurationProperties(prefix = "superplatform.auth")`를 통해 설정값을 바인딩합니다.
2. `SpAuthProperties.InternalApi` 내부 클래스가 `internal-api` 하위의 `baseUrl`, `serviceTokenScope`, `connectTimeoutMs`, `readTimeoutMs`를 매핑합니다.
3. `PersonInfoClientConfig`에서 `spAuthProperties.getInternalApi().getBaseUrl()`을 호출하여 `personInfoRestClient` 빈의 base URL로 설정합니다.
4. 이 RestClient는 회원정보 조회(PersonInfo) API 호출에 사용됩니다.

**개선 제안:**

1. prod profile에도 동일 설정 필요성 검토
   - **위치 (라인 번호)**: `application-vs-prod.yml` (전체)
   - **기존 코드**: 
```yaml
# application-vs-prod.yml에는 superplatform.auth 섹션 자체가 없음
```
   - **해결 방안 (수정 코드)**: 
```yaml
# application-vs-prod.yml에 추가 검토
superplatform:
  auth:
    internal-api:
      base-url: ${SP_AUTH_INTERNAL_API_URL:https://auth-superplatform-api.vsaidt.com/api/v1}
```
   - 단, prod URL이 위와 같은지 실제 운영팀에 확인 후 적용해야 합니다.

---

## 최종 평가

**결론**: 
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**

이 커밋은 단순하고 명확한 설정 변경으로, dev 환경에서 SSO Internal API가 정상 동작하도록 하는 필수적인 수정입니다. 주석을 통해 누락 시 영향도를 잘 설명하고 있으며, 환경변수 기반 설정으로 유연성도 확보했습니다. `PersonInfoClientConfig`에서 이 설정값을 사용하여 `personInfoRestClient` 빈을 생성하는 구조도 깔끔하게 설계되어 있습니다.

prod profile에도 동일한 설정이 필요한지 검토하는 것을 권장하지만, 현재 변경 자체는 문제없이 승인 가능합니다. dev 환경에서의 SSO 회원정보 조회 기능이 정상 동작할 것으로 예상됩니다.