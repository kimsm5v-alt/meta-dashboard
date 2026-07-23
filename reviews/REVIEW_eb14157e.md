> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - eb14157e

## 코드 복잡도 분석

**분석된 파일**: 4개 / 변경된 파일: 6개


### 정상 범위 (NONE)


**`dgnssgraphservice.java`** (other)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.008

- 청크 수: 8개


**권장사항:**

- 복잡도 정상 범위


**`authproxycontroller.java`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.005

- 청크 수: 4개


**권장사항:**

- 복잡도 정상 범위


**`exampage.tsx`** (component)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.013

- 청크 수: 40개


**권장사항:**

- 파일 크기가 큼 (40개 청크) - 파일 분리 검토


**`examguidestep.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.009

- 청크 수: 109개


**권장사항:**

- 파일 크기가 큼 (109개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 **Kong API 게이트웨이 전환**에 따른 전방위 대응과 **DGNSs(진단검사) 그래프 응답 개선**을 동시에 진행한 변경입니다.

- **목적**: 게이트웨이 경로 변경으로 인한 CORS/쿠키/인증 문제 해결 + DGNSs 코칭경로(ModerationPath) 응답을 강점/보완점 각 1개씩으로 축소하고 zFactorType 필드 추가
- **도메인**: 인프라(게이트웨이 전환), 인증(SSO), 비즈니스 로직(DGNSs 그래프), UI(시험 가이드)
- **변경 방향**: 게이트웨이 prefix(`/v1/meta`) 대응을 위해 API URL 변경, RT 쿠키 path를 `/`로 확장, 디버깅 로그 강화; DGNSs는 기존 보완점 전체 경로에서 강점/보완점 대표 1개씩으로 전략 변경

---

## [GOOD] 잘된 점

**1. RT 쿠키 path 변경에 대한 상세한 rationale 문서화**

`AuthProxyController.java`에서 RT 쿠키 path를 `/api/v1/auth`에서 `/`로 변경하면서, 그 이유를 주석으로 명확히 남겼습니다. 게이트웨이가 경로 앞에 `/v1/meta` prefix를 붙이면 브라우저가 보는 실제 경로(`/v1/meta/api/v1/auth/refresh`)와 쿠키 path(`/api/v1/auth`)가 불일치하여 쿠키가 전송되지 않는 문제를 정확히 진단하고, `"/"`로 설정하면 게이트웨이 유무와 무관하게 항상 동작한다는 결론을 도출했습니다. 또한 `RT_COOKIE_PATH` 상수로 추출하여 `setRefreshTokenCookie`와 `clearRefreshTokenCookie` 두 메서드에서 일관성 있게 사용한 점이 좋습니다.

```java
// RT 쿠키 path = "/" : 게이트웨이가 경로 앞에 prefix(/v1/meta)를 붙여도 refresh 요청에 실리도록 한다.
//   (path="/api/v1/auth" 로 좁히면 브라우저가 보는 /v1/meta/api/v1/auth/refresh 와 안 맞아 쿠키 미전송 → 로그인 루프)
//   백엔드는 자신의 게이트웨이 prefix 를 모르므로 "/" 로 두는 게 게이트웨이 유무와 무관하게 안전.
private static final String RT_COOKIE_PATH = "/";
```

**2. 디버깅 로그의 보안 의식**

`[TOKEN-DBG]` 로그에서 code, codeVerifier, clientSecret 값 자체는 절대 로깅하지 않고 존재 여부만(`codePresent`, `verifierPresent`) boolean으로 출력하여 보안을 고려했습니다. OAuth2 토큰 교환 과정에서 민감 정보가 로그에 노출되는 것을 방지하면서도, 파라미터가 정상적으로 전달되었는지 확인할 수 있도록 한 실용적인 접근입니다.

```java
log.info("[TOKEN-DBG] codePresent={}, verifierPresent={}, redirectUri={}, clientId={}",
        body.get("code") != null, body.get("codeVerifier") != null,
        body.get("redirectUri"), spAuth.getClientId());
```

**3. `addTopModerationPath` 메서드 추출로 코드 구조 개선**

기존에는 weaknesses 리스트를 순회하며 모든 보완점에 대해 `queryModerationPathsByZFactor`를 호출했으나, 이제는 강점/보완점 각각의 대표 1개만 처리하면 되므로 별도 메서드로 분리했습니다. `category` 파라미터를 통해 "strength"/"weakness"를 구분하여 응답에 포함시키는 설계가 깔끔합니다.

```java
private void addTopModerationPath(List<Map<String, Object>> out, String className, String schoolLevel,
                                  Map<String, Object> factor, String category) {
    List<Map<String, Object>> paths =
            queryModerationPathsByZFactor(className, schoolLevel, MapUtils.getString(factor, "factorName", ""));
    if (!paths.isEmpty()) {
        Map<String, Object> path = paths.get(0);
        path.put("category", category);
        out.add(path);
    }
}
```

**4. `zFactorType` 필드 추가의 일관성**

`queryModerationPathsByZFactor`, `queryModerationPaths`, `mapModerationPathRow` 세 곳에 동일한 `m.z_factor_type AS zFactorType` 필드를 추가하여, 모든 ModerationPath 조회 경로에서 일관된 응답 구조를 유지했습니다. 이는 FE에서 zFactorType을 활용한 UI 표시(예: 정적/부적 요인에 따른 색상 구분)를 가능하게 합니다.

---

## 변경사항 요약

(1) **DGNSs 그래프 서비스**: 코칭경로를 보완점 전체 목록에서 강점 최상위 1개 + 보완점 최상위 1개로 축소하고, `zFactorType` 필드를 응답에 추가했습니다.

(2) **SSO 인증**: RT 쿠키 path를 `/`로 변경하여 게이트웨이 prefix 문제 해결, 토큰 교환/갱신 실패 시 IdP 응답 바디를 로깅하도록 디버깅 강화.

(3) **인프라 설정**: Redis username을 빈 문자열로 override하여 NCP Cloud DB Redis의 password-only AUTH 호환성 확보, 프론트엔드 API URL을 Kong 게이트웨이 경유로 변경.

(4) **시험 가이드 UI**: `StudentExamContext.schoolLevel` 타입을 구체적인 union 타입으로 좁히고, context 모드에서 `contextGradeOptions`를 올바르게 사용하도록 수정, GradeSelect 스타일 개선.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음. 명백한 버그나 보안 취약점, 데이터 손실 가능성은 발견되지 않았습니다.

### High (우선 수정 권장)

**1. `addTopModerationPath`에서 `paths.get(0)`의 대표 경로 선정 기준이 비즈니스 의도와 불일치**

- **파일**: `DgnssGraphService.java`
- **위치 (라인 번호)**: 322
- **기존 코드**:
```java
if (!paths.isEmpty()) {
    Map<String, Object> path = paths.get(0); // 요인별 대표 1개
    path.put("category", category);
    out.add(path);
}
```

- **문제 분석**: `queryModerationPathsByZFactor`의 Cypher 쿼리는 `ORDER BY m.id`로 정렬합니다. 즉, `paths.get(0)`는 단순히 Neo4j 노드 ID가 가장 작은(가장 먼저 생성된) ModerationPath일 뿐입니다. 주석에는 "요인별 대표 1개"라고 되어 있지만, "대표"로서의 비즈니스 기준(예: 가장 일반적인 경로, 가장 높은 설명력을 가진 경로, 가장 최근에 업데이트된 경로 등)이 전혀 반영되지 않았습니다.

- **영향**: 특정 요인(Z)에 대해 여러 ModerationPath가 존재할 경우, 항상 ID가 가장 작은(가장 오래된) 경로만 반환됩니다. 이는 FE에서 사용자에게 보여주는 코칭 전략이 항상 고정되어, 실제로 더 적합한 최신 경로가 무시될 수 있습니다.

- **해결 방안**: 대표 경로 선정 기준을 비즈니스 요구사항에 따라 명확히 정의하고, Cypher 쿼리의 `ORDER BY` 조건을 변경하세요. 예를 들어:
  - 가장 최근에 생성된 경로를 대표로 사용: `ORDER BY m.created_at DESC`
  - 가중치가 가장 높은 경로를 대표로 사용: `ORDER BY m.weight DESC`
  - 특정 path_type 우선: `ORDER BY CASE m.path_type WHEN 'recommended' THEN 0 ELSE 1 END, m.id`

  또는 주석을 실제 동작에 맞게 수정하여 오해를 방지하세요.

**2. `ExamGuideStep.tsx`에서 `schoolLevel` 상태와 `studentExamContext.schoolLevel` 간 이중 상태 관리로 불필요한 리렌더**

- **파일**: `ExamGuideStep.tsx`
- **위치 (라인 번호)**: 654-658
- **기존 코드**:
```typescript
useEffect(() => {
    if (studentExamContext?.schoolLevel) {
      setSchoolLevel(studentExamContext.schoolLevel);
    }
}, [studentExamContext?.schoolLevel]);
```

- **문제 분석**: `schoolLevel` 상태는 `useState<SchoolLevel>('')`로 선언되어 있고, `gradeOptions` 계산(`const gradeOptions = GRADE_OPTIONS[schoolLevel] ?? [];`)에 사용됩니다. 그런데 `studentExamContext` 모드(라인 756 이후)에서는 `gradeOptions`가 전혀 사용되지 않고, 대신 `contextGradeOptions = GRADE_OPTIONS[ctxLevel || editableSchoolLevel]`가 사용됩니다. 즉, `studentExamContext` 모드에서 `schoolLevel` 상태는 dead state입니다.

  이 `useEffect`는 `studentExamContext` 객체가 변경될 때마다(참조 동일성 기준) `setSchoolLevel`을 호출하여 불필요한 리렌더를 유발합니다. `studentExamContext`는 `ExamPage.tsx`에서 매 렌더마다 새 객체로 생성되므로(`{ ordNo: ..., schoolName: ..., ... }`), 이 `useEffect`는 사실상 매 렌더마다 실행됩니다.

- **영향**: `studentExamContext` 모드에서 컴포넌트가 리렌더될 때마다 불필요한 상태 업데이트가 발생하여 성능에 미미한 영향을 줍니다. 또한 `schoolLevel` 상태가 변경되면 첫 번째 `useEffect`(라인 646-648)도 함께 트리거되어 `formData.grade`를 초기화하는 부수 효과가 발생할 수 있습니다.

- **해결 방안**: `studentExamContext` 모드에서는 `schoolLevel` 상태가 필요하지 않으므로, 이 `useEffect`를 제거하거나 조건부로만 실행되도록 변경하세요. `schoolLevel` 상태는 `showInfoForm` 모드(비-context 모드)에서만 관리하면 됩니다.

  ```typescript
  // studentExamContext 모드에서는 schoolLevel 상태가 contextGradeOptions로 대체되므로 동기화 불필요
  // useEffect(() => {
  //   if (studentExamContext?.schoolLevel) {
  //     setSchoolLevel(studentExamContext.schoolLevel);
  //   }
  // }, [studentExamContext?.schoolLevel]);
  ```

### Medium (개선 권장)

**1. `AuthProxyController` 디버깅 로그의 지속성 문제**

- **파일**: `AuthProxyController.java`
- **위치 (라인 번호)**: 61-63, 78
- **기존 코드**:
```java
log.info("[TOKEN-DBG] codePresent={}, verifierPresent={}, redirectUri={}, clientId={}",
        body.get("code") != null, body.get("codeVerifier") != null,
        body.get("redirectUri"), spAuth.getClientId());
...
log.warn("토큰 교환 실패: {} body={}", e.getStatusCode(), e.getResponseBodyAsString());
```

- **문제 분석**:
  1. `[TOKEN-DBG]` 로그가 `info` 레벨로 설정되어 있어, 게이트웨이 전환 디버깅이 완료된 후에도 운영 환경에서 계속 출력됩니다. 불필요한 로그 노이즈가 발생합니다.
  2. `e.getResponseBodyAsString()`은 `WebClientResponseException`의 응답 바디를 한 번만 읽을 수 있는 스트림 기반 메서드입니다. 로그 프레임워크가 지연 평가(lazy evaluation)하거나, 동일 예외 객체가 catch 블록 내에서 재사용될 경우 두 번째 호출에서 빈 문자열을 반환할 위험이 있습니다.

- **해결 방안**:
  1. 게이트웨이 전환 안정화 후 `[TOKEN-DBG]` 로그를 `debug` 레벨로 낮추거나 제거하는 TODO 주석을 추가하세요.
  2. `e.getResponseBodyAsString()`의 반환값을 로컬 변수에 저장하여 사용하세요:
  ```java
  String errorBody = e.getResponseBodyAsString();
  log.warn("토큰 교환 실패: {} body={}", e.getStatusCode(), errorBody);
  ```

**2. `ExamGuideStep.tsx` GradeSelect 스타일 변경으로 인한 레이아웃 영향**

- **파일**: `ExamGuideStep.tsx`
- **위치 (라인 번호)**: 301
- **기존 코드**:
```css
min-width: 436px;  →  width: 100%;
```

- **문제 분석**: `min-width: 436px`에서 `width: 100%`로 변경되었습니다. 이는 반응형 대응을 위한 것으로 보이나, `GradeSelect`가 부모 컨테이너의 너비에 완전히 의존하게 되어, 부모가 충분히 넓지 않은 환경(예: 모바일, 좁은 사이드바)에서 select 박스가 비정상적으로 작아질 수 있습니다. 특히 `appearance: none`으로 브라우저 기본 스타일을 제거했기 때문에, 최소 너비 보장이 없으면 select 화살표 아이콘과 텍스트가 겹칠 수 있습니다.

- **해결 방안**: `min-width`와 `width: 100%`를 함께 사용하거나, `min-width`를 더 작은 값(예: `200px`)으로 설정하여 극단적인 축소를 방지하세요:
```css
width: 100%;
min-width: 200px;
```

---

## 주요 파일 분석

### DgnssGraphService.java

**변경 내용:**
코칭경로(ModerationPath) 응답을 보완점 전체 목록에서 강점 최상위 1개 + 보완점 최상위 1개로 축소하고, `zFactorType` 필드를 응답에 추가했습니다.

**변경 전 로직:**
```java
// 기존: weaknesses 모든 항목에 대해 queryModerationPathsByZFactor 호출
for (Map<String, Object> w : weaknesses) {
    moderationPaths.addAll(
            queryModerationPathsByZFactor(className, schoolLevel, MapUtils.getString(w, "factorName", "")));
}
```

**변경 후 로직:**
```java
// 변경: 강점 최상위 1개 + 보완점 최상위 1개만 처리
if (!strengths.isEmpty()) {
    addTopModerationPath(moderationPaths, className, schoolLevel, strengths.get(0), "strength");
}
if (!weaknesses.isEmpty()) {
    addTopModerationPath(moderationPaths, className, schoolLevel, weaknesses.get(0), "weakness");
}
```

**개선 제안 요약:**
1. `paths.get(0)`의 대표 경로 선정 기준(`ORDER BY m.id`)이 비즈니스 의도와 불일치하므로, 적절한 정렬 기준을 추가하거나 주석을 수정하세요.
2. `mapModerationPathRow`에서 `zFactorType`이 빈 문자열로 반환될 경우 FE에서의 처리를 고려하세요.

### AuthProxyController.java

**변경 내용:**
RT 쿠키 path를 `/`로 변경하고, 토큰 교환/갱신 실패 시 IdP 응답 바디를 로깅하도록 디버깅을 강화했습니다.

**변경 전:**
```java
log.warn("토큰 교환 실패: {}", e.getStatusCode());
```

**변경 후:**
```java
log.warn("토큰 교환 실패: {} body={}", e.getStatusCode(), e.getResponseBodyAsString());
```

**개선 제안 요약:**
1. `[TOKEN-DBG]` 로그는 게이트웨이 전환 안정화 후 `debug` 레벨로 낮추거나 제거하는 TODO를 추가하세요.
2. `e.getResponseBodyAsString()`은 단일 읽기 위험이 있으므로 로컬 변수에 저장하여 사용하세요.

### ExamGuideStep.tsx

**변경 내용:**
`StudentExamContext`의 `schoolLevel` 타입을 구체적인 union 타입(`'elementary' | 'middle' | 'high' | ''`)으로 좁히고, context 모드에서 `contextGradeOptions`를 올바르게 사용하도록 수정했으며, GradeSelect 스타일을 개선했습니다.

**타입 개선:**
```typescript
// 변경 전
schoolLevel?: string;

// 변경 후
schoolLevel?: SchoolLevel;  // 'elementary' | 'middle' | 'high' | ''
```

**GradeSelect 스타일 개선:**
```css
/* 변경 전 */
min-width: 436px;

/* 변경 후 */
width: 100%;
appearance: none;
-webkit-appearance: none;
-moz-appearance: none;
background-image: url('data:image/svg+xml;utf8,...');
background-repeat: no-repeat;
background-position: right 1rem center;
```

**개선 제안 요약:**
1. `schoolLevel` 상태와 `studentExamContext.schoolLevel` 간 이중 상태 관리로 불필요한 리렌더가 발생하므로, `useEffect`를 제거하세요.
2. GradeSelect에 `min-width` 하한선을 추가하여 극단적인 축소를 방지하세요.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전반적으로 게이트웨이 전환에 따른 실용적인 대응과 DGNSs 응답 구조 개선이 잘 이루어졌습니다. 특히 RT 쿠키 path 변경에 대한 상세한 rationale 문서화, 디버깅 로그의 보안 의식, `addTopModerationPath` 메서드 추출로 인한 코드 구조 개선은 긍정적으로 평가됩니다.

다만 두 가지 High 이슈는 수정을 권장합니다:

1. **`addTopModerationPath`에서 `paths.get(0)`의 대표 경로 선정 기준**: `ORDER BY m.id`는 단순히 가장 오래된 경로를 선택할 뿐, "대표 경로"로서의 비즈니스 의미를 갖지 않습니다. 적절한 정렬 기준(예: 가중치, 생성일, path_type 우선순위)을 추가하거나, 주석을 실제 동작에 맞게 수정하세요.

2. **`ExamGuideStep.tsx`의 이중 상태 관리**: `studentExamContext` 모드에서 `schoolLevel` 상태는 dead state이며, 불필요한 `useEffect`로 인해 매 렌더마다 `setSchoolLevel`이 호출됩니다. 해당 `useEffect`를 제거하여 불필요한 리렌더를 방지하세요.

이 두 가지 이슈만 해결되면 충분히 승인 가능한 수준의 커밋입니다.