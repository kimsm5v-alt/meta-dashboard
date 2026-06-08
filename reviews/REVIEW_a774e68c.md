# 코드 리뷰 - a774e68c

## 코드 복잡도 분석

변경된 파일의 복잡도 정보를 찾을 수 없습니다.
(인덱스가 생성되지 않았거나 새로운 파일일 수 있습니다)

---



## 변경 배경

이 커밋은 SSO 인증 서버의 internal API base-url 설정값이 환경별 설정 파일(application-vs-dev.yml 등)에서 하드코딩된 `server-url` 값을 올바르게 참조하지 못하는 문제를 해결하기 위한 수정입니다.

- **목적**: 환경별 YML에서 `server-url`만 정의하면 `internal-api.base-url`이 자동으로 derive되도록 수정
- **도메인**: 인프라 / 설정 (Configuration)
- **변경 방향**: 환경변수 참조(`${SP_AUTH_SERVER_URL:...}`)에서 Spring 프로퍼티 직접 참조(`${superplatform.auth.server-url}`)로 변경

## [GOOD] 잘된 점

- **문제 인식이 명확함**: 기존 `${SP_AUTH_SERVER_URL:...}` 방식은 환경변수 기반이라 환경별 YML에 하드코딩된 `server-url` 값을 참조하지 못하는 문제를 정확히 파악하고 수정함
- **Spring Boot 메커니즘 활용**: `${superplatform.auth.server-url}`와 같이 동일한 프로퍼티 트리의 값을 직접 참조하는 방식은 Spring Boot의 표준 프로퍼티 참조 기능을 올바르게 활용한 방법임
- **주석이 상세함**: 변경 이유와 주의사항을 주석에 명확히 기록하여, 이후 유지보수자가 의도를 쉽게 파악할 수 있도록 함

## 변경사항 요약

`application.yml`에서 `superplatform.auth.internal-api.base-url`의 기본값(placeholder)을 `${SP_AUTH_SERVER_URL:http://localhost:8080}/api/v1`에서 `${superplatform.auth.server-url}/api/v1`로 변경. 이로써 환경별 YML에서 `server-url`만 설정해도 internal API URL이 자동 derive됨.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)
없음

### High (우선 수정 권장)
없음

### Medium (개선 권장)
없음

---

## 주요 파일 분석

### `backend/src/main/resources/application.yml` (137~147번째 줄)

**변경 내용:**
`internal-api.base-url`의 기본값(placeholder) 참조 방식을 환경변수(`${SP_AUTH_SERVER_URL:...}`)에서 Spring 프로퍼티(`${superplatform.auth.server-url}`)로 변경.

**변경 전 코드 (라인 139):**
```yaml
base-url: ${SP_AUTH_INTERNAL_API_URL:${SP_AUTH_SERVER_URL:http://localhost:8080}/api/v1}
```

**변경 후 코드 (라인 147):**
```yaml
base-url: ${SP_AUTH_INTERNAL_API_URL:${superplatform.auth.server-url}/api/v1}
```

**변경의 핵심 차이점:**
- 기존: `${SP_AUTH_SERVER_URL:http://localhost:8080}`는 환경변수 `SP_AUTH_SERVER_URL`을 참조하며, 이 값이 설정되지 않으면 `http://localhost:8080`을 기본값으로 사용
- 변경 후: `${superplatform.auth.server-url}`는 동일한 YML 파일 내 `superplatform.auth.server-url` 프로퍼티 값을 직접 참조

**왜 이 변경이 필요한가:**
환경별 설정 파일(예: `application-vs-dev.yml`)에서 `superplatform.auth.server-url`을 하드코딩해도, 기존 방식은 환경변수 `${SP_AUTH_SERVER_URL:...}`를 참조하기 때문에 해당 하드코딩 값이 derive되지 않았습니다. 변경 후에는 Spring의 프로퍼티 참조 메커니즘을 통해 동일한 프로퍼티 트리의 값을 직접 읽어오므로, 환경별 YML에서 `server-url`만 정의하면 `internal-api.base-url`이 자동으로 따라가게 됩니다.

**개선 제안:**
별도의 개선이 필요하지 않습니다. 변경이 단순하고 명확하며, Spring Boot의 프로퍼티 참조 메커니즘을 올바르게 사용하고 있습니다.

---

## 최종 평가

**결론**: 
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**
변경 범위가 작고 명확하며, Spring Boot 설정 메커니즘을 올바르게 이해하고 적용한 적절한 수정입니다. 주석을 통해 변경 의도를 충분히 설명한 점도 좋습니다. 별도의 수정 없이 승인 가능합니다.