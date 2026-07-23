> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 0838db5b

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 3개


### 정상 범위 (NONE)


**`pdfdownloadservice.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.009

- 청크 수: 18개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 `vs-develop` 브랜치를 `feature/frontend` 브랜치로 병합(Merge)한 것으로, 크게 두 가지 변경을 포함합니다: (1) 민감한 API 키가 포함된 `frontend/.env.development` 파일을 삭제하고 `.gitignore`에 등록하여 보안을 강화, (2) `downloadAllPdf` 함수의 ZIP 다운로드 로직을 2단계(URL 조회 후 실제 다운로드)로 분리하여 대용량 파일 처리 안정성을 개선.

- **목적**: 민감 정보(API 키, 서비스 키)의 Git 형상 관리 제거 및 ZIP 파일 다운로드 프로세스 개선
- **도메인**: 보안(인프라) / API(비즈니스 로직)
- **변경 방향**: `.env.development`를 `.gitignore`에 등록하여 실수로 커밋되는 것을 방지하고, ZIP 다운로드를 JSON 응답에서 URL을 먼저 받은 후 `/pfile-download` 프록시를 통해 실제 파일을 다운로드하는 2단계 방식으로 개선

---

## [GOOD] 잘된 점

**1. 민감 정보 보호 조치**

`frontend/.env.development` 파일에는 `VITE_GEMINI_API_KEY=AIzaSyB6thtA3zjXSD0ARP8YjVaKPdUugdR5z8g`와 같은 실제 API 키와 `VITE_QCH_SERVICE_KEY=meta-service-fe` 같은 서비스 키가 포함되어 있었습니다. 이 파일을 삭제하고 `.gitignore`에 `.env.development`와 `frontend/.env.development` 패턴을 추가한 것은 적절한 보안 조치입니다. Git에 한번이라도 커밋된 민감 정보는 히스토리에서 완전히 제거하기 어렵지만, 향후 재커밋을 방지하는 것은 중요합니다.

**2. 2단계 ZIP 다운로드 로직 개선**

기존에는 `/api/dgnss/dgnss-download-all` 엔드포인트가 직접 blob을 반환했다면, 이제 JSON 응답에서 `zipFileUrl`을 먼저 받고 `/pfile-download` 프록시를 통해 실제 파일을 다운로드하는 방식으로 변경되었습니다. 이는 대용량 ZIP 파일을 안정적으로 처리하기 위한 아키텍처 개선으로 보입니다. 특히 `openBlobFromUrl` 함수(라인 27-35)에서 이미 검증된 `/files/pfile-download` 프록시 패턴을 재사용하여 일관성을 유지한 점이 좋습니다.

**3. 명시적인 에러 처리**

`zipFileUrl`이 없을 경우 `throw new Error('ZIP 파일 URL을 받지 못했습니다.')`로 명시적인 예외를 던져, 실패 상황을 조기에 감지할 수 있습니다. 이는 서버 응답 구조가 변경되었을 때 디버깅에 큰 도움이 됩니다.

---

## 변경사항 요약

- `.gitignore`에 `.env.development`와 `frontend/.env.development` 패턴 추가 (2줄)
- `frontend/.env.development` 파일 삭제 (12줄, Git 추적 제거)
- `downloadAllPdf` 함수의 ZIP 다운로드 로직을 2단계(URL 조회 + 프록시 다운로드)로 변경 (17줄 수정)

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. jwtToken이 URL 쿼리 파라미터와 Authorization 헤더에 중복 전달됨**

- **위치**: `frontend/src/shared/services/pdfDownloadService.ts`, 라인 131-133
- **기존 코드**:
```typescript
const downloadUrl = `${ENV.API_URL}/files/pfile-download?url=${encodeURIComponent(zipFileUrl)}&jwtToken=${jwtToken}`;
const response = await axios.get(downloadUrl, {
  headers: { Authorization: `Bearer ${jwtToken}` },
  responseType: 'blob',
});
```

- **문제점**: `jwtToken`이 URL 쿼리 파라미터(`&jwtToken=...`)와 HTTP 헤더(`Authorization: Bearer ...`)로 동시에 전달되고 있습니다. URL에 토큰을 포함하면 다음과 같은 문제가 있습니다:
  - 서버 액세스 로그에 토큰이 그대로 기록되어 보안 위험
  - 브라우저 히스토리나 Referer 헤더를 통해 토큰이 노출될 가능성
  - 일반적으로 Bearer 토큰 인증 방식에서는 Authorization 헤더만으로 충분

- **참고**: `openBlobFromUrl` 함수(라인 32)도 동일한 패턴(`&jwtToken=${jwtToken}`)을 사용하고 있어 일관성은 있지만, 이는 기존 코드의 문제를 그대로 답습한 것입니다.

- **해결 방안**: 서버가 URL 쿼리 파라미터 방식의 `jwtToken`을 요구한다면 현재 방식이 불가피할 수 있습니다. 그러나 가능하다면 Authorization 헤더만 사용하도록 서버와 협의하거나, URL 파라미터를 제거하는 방향으로 개선하는 것이 좋습니다. **서버 스펙 확인이 필요하여 수정 코드 제시는 보류합니다.**

**2. `openBlobFromUrl` 함수와 중복되는 다운로드 로직**

- **위치**: `frontend/src/shared/services/pdfDownloadService.ts`, 라인 27-35 (`openBlobFromUrl`) vs 라인 130-133 (Step 3-2)
- **문제점**: `openBlobFromUrl` 함수는 이미 `/files/pfile-download`를 통해 blob을 받아 새 탭에서 여는 로직을 캡슐화하고 있습니다. 그런데 `downloadAllPdf`의 Step 3-2에서는 동일한 URL 구성과 axios 호출을 중복 작성하고 있습니다. `openBlobFromUrl`은 `URL.createObjectURL` 후 `a.click()`으로 새 탭을 열지만, `downloadAllPdf`는 `downloadBlob`으로 파일 다운로드를 수행하므로 목적이 다릅니다. 그러나 URL 생성과 axios 호출 부분은 공통 로직으로 추출할 수 있습니다.

- **해결 방안**: `/files/pfile-download`를 통해 blob을 받는 공통 헬퍼 함수를 추출하는 것을 고려하세요. 예를 들어:
```typescript
async function fetchBlobFromPfile(url: string, jwtToken: string): Promise<Blob> {
  const downloadUrl = `${ENV.API_URL}/files/pfile-download?url=${encodeURIComponent(url)}&jwtToken=${jwtToken}`;
  const response = await axios.get(downloadUrl, {
    headers: { Authorization: `Bearer ${jwtToken}` },
    responseType: 'blob',
  });
  return response.data as Blob;
}
```

### Medium (개선 권장)

**1. `.env.example` 파일 제공 권장**

- **설명**: `frontend/.env.development` 파일을 삭제하면서 개발자들이 어떤 환경 변수가 필요한지 알 수 없게 되었습니다. 프로젝트 루트나 `frontend/` 디렉토리에 `.env.example` 파일을 추가하여 필요한 환경 변수 목록을 제공하는 것을 권장합니다. 단, 실제 API 키 값은 제외하고 빈 값이나 예시 값만 포함해야 합니다.

- **해결 방안 (수정 코드)**: `frontend/.env.example` 신규 파일 생성
```
# API
VITE_API_URL=https://t-meta-api.vsaidt.com
VITE_AGENT_API_URL=https://t-meta-agent-api.vsaidt.com

# Superplatform Auth
VITE_SP_AUTH_URL=https://t-auth-superplatform-api.vsaidt.com
VITE_SP_CLIENT_ID=test-service
VITE_SP_MYPAGE_URL=https://t-mypage-superplatform.vsaidt.com

# QCH Logging
VITE_ENABLE_QCH_LOGGING=true
VITE_QCH_BASE_URL=https://t-qch.vsaidt.com
VITE_QCH_SERVICE_KEY=meta-service-fe
VITE_QCH_ENV=dev

# Gemini (선택 - 실제 키는 개발자가 직접 발급)
# VITE_GEMINI_API_KEY=your_key_here
```

---

## 주요 파일 분석

### frontend/.env.development (삭제)

**변경 내용**: 민감한 API 키(GEMINI_API_KEY, QCH_SERVICE_KEY 등)가 포함된 환경 설정 파일을 Git 추적에서 제거하고 `.gitignore`에 등록.

**분석**: 이 파일에는 `VITE_GEMINI_API_KEY=AIzaSyB6thtA3zjXSD0ARP8YjVaKPdUugdR5z8g`와 같은 실제 API 키가 평문으로 저장되어 있었습니다. Git에 커밋된 후 삭제했더라도, 이전 커밋 히스토리에는 여전히 키가 남아있습니다. 따라서 이 키는 무효화(revoke)하고 새로운 키를 발급받아 사용하는 것이 안전합니다. 또한 `.gitignore`에 등록했더라도, 이미 Git이 추적 중인 파일은 `.gitignore`만으로 무시되지 않으므로 `git rm --cached` 명령어로 스테이징 영역에서도 제거했는지 확인이 필요합니다.

### frontend/src/shared/services/pdfDownloadService.ts

**변경 내용**: `downloadAllPdf` 함수의 ZIP 다운로드 로직을 2단계로 분리.

**분석**: 변경된 로직의 흐름은 다음과 같습니다:

1. **Step 1**: `GET /api/dgnss/pdf/search`로 미생성 PDF 대상 학생 조회
2. **Step 2**: 학생별로 `POST /api/dgnss/pdf` 또는 `POST /api/dgnss/summary/pdf`로 PDF 생성 요청
3. **Step 3-1**: `GET /api/dgnss/dgnss-download-all`로 ZIP 파일 URL 조회 (JSON 응답)
4. **Step 3-2**: 조회된 URL로 `GET /files/pfile-download?url=...&jwtToken=...` 호출하여 실제 ZIP 파일 다운로드

기존 코드는 Step 3에서 `axiosInstance.get`으로 직접 blob을 받았지만, 변경된 코드는 JSON 응답에서 `zipFileUrl`을 추출한 후 `/pfile-download` 프록시를 통해 다운로드합니다. 이 방식의 장점은:
- ZIP 파일 생성과 다운로드를 분리하여 타임아웃 문제 완화
- `/pfile-download` 프록시가 이미 검증된 다운로드 경로이므로 안정성 확보
- `openBlobFromUrl` 함수와 동일한 다운로드 패턴 사용으로 일관성 유지

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전반적으로 변경 방향은 적절하며, 특히 민감 정보 보호와 ZIP 다운로드 프로세스 개선은 긍정적입니다. 다만, `jwtToken`이 URL 쿼리 파라미터와 Authorization 헤더에 중복 전달되는 부분은 보안 관점에서 개선이 필요합니다. 서버 스펙에 따라 URL 파라미터 방식이 불가피할 수 있으므로, 팀 내에서 확인 후 조치하시기 바랍니다.

또한 삭제된 `.env.development`를 대체할 `.env.example` 파일을 추가하면 신규 개발자 온보딩에 도움이 될 것입니다. 그리고 이미 Git 히스토리에 노출된 `GEMINI_API_KEY`는 반드시 무효화하고 새로운 키로 교체하는 것을 권장합니다.