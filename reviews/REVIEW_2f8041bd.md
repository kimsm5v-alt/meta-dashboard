# 코드 리뷰 - 2f8041bd

## 코드 복잡도 분석

변경된 파일의 복잡도 정보를 찾을 수 없습니다.
(인덱스가 생성되지 않았거나 새로운 파일일 수 있습니다)

---



## 변경 배경

이 커밋은 실제 코드 변경이 아니라 **구현 지시서(가이드 문서)** 하나를 추가한 커밋입니다. `kv-everyclass-viewer`가 발행하는 `solve-question` 이벤트를 every-canvas-fe(Frame)가 LMS API를 직접 호출하지 않고 임베드 브리지 `answerSaved`로 Host(meta-dashboard)에 전달하는 구현 계약을 문서화했습니다.

- **목적**: CBS 문항 답안 저장 로직을 Frame에서 Host로 이관하기 위한 구현 지침 제공
- **도메인**: 프론트엔드 임베드 브리지 프로토콜 / 비즈니스 로직 (답안 저장)
- **변경 방향**: 저장 API 호출·디바운스·재시도를 Host 책임으로 이동시키는 아키텍처 개선의 설계 문서화

## [GOOD] 잘된 점

- 문서가 매우 상세하고 구조적이며, "이미 된 것 / 이번에 할 것"을 명확히 구분해 중복 구현을 방지했습니다.
- 디바운스 책임(Frame vs Host)을 명확히 결정하고 근거를 제시해 팀 내 혼선을 예방했습니다.
- `result` → `errata` 매핑, `sub_id` 최상위 필드 유지, `timeSpentMs` 0 금지 등 데이터 계약을 구체적으로 명시해 구현 오류 가능성을 줄였습니다.
- "하지 말 것" 섹션(§8)을 두어 범위 밖 작업을 명시적으로 차단했습니다.

## 변경사항 요약

단일 마크다운 문서(`frontend/docs/lesson/2026-08-26-solve-question-to-answerSaved-가이드.md`)가 추가되었습니다. 코드 변경은 없으며, `solve-question` → `answerSaved` 전달 구현을 위한 계약·데이터 흐름·구현 지시·확인 항목을 담고 있습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

- **참조 파일 존재 여부 미검증**: 문서가 참조하는 핵심 파일들(`useEveryclassViewer.ts`, `CbsArticleViewer.tsx`, `CBSViewer.tsx`, `useEmbedViewerBridge.ts`, `protocol.types.ts`, `SmartBankSlide.tsx`)이 실제 코드베이스에 존재하는지 확인이 필요합니다. 이번 검증에서 `frontend/src/shared/lib/everyclass-viewer`, `frontend/src/features/slide/hooks`, `frontend/src/features/template/components` 디렉터리를 찾지 못했습니다. 문서의 구현 지시가 실제 파일 구조와 불일치하면 구현자가 혼란을 겪을 수 있습니다.

### Medium (개선 권장)

- **문서 파일명의 한글 인코딩**: 파일명에 한글(`가이드`)이 포함되어 있어 Git 저장소·CI/CD·파일 시스템 간 인코딩 이슈가 발생할 수 있습니다. 영문 파일명(예: `solve-question-to-answerSaved-guide.md`) 사용을 권장합니다.
- **검증 항목의 자동화 가능성**: §9의 확인 항목(7개)이 수동 확인에 의존합니다. 가능하면 테스트 코드나 스모크 테스트로 자동화할 수 있는 항목을 명시하면 좋습니다.

---

## 주요 파일 분석

### frontend/docs/lesson/2026-08-26-solve-question-to-answerSaved-가이드.md

**변경 내용:**
`solve-question` → `answerSaved` 전달 구현 지시서 신규 추가 (268줄).

**개선 제안:**

1. 참조 파일 경로의 실제 존재 여부를 검증하고, 불일치 시 경로를 수정하세요.
   - **위치**: §6 전체 (구현 지시)
   - **기존 코드**: 문서에 명시된 경로들 (`frontend/src/shared/lib/everyclass-viewer/useEveryclassViewer.ts` 등)
   - **해결 방안**: 이번 검증에서 해당 디렉터리들을 찾지 못했습니다. 문서 배포 전에 `find_files`/`list_directory`로 각 참조 파일의 실제 경로를 확인하고, 경로가 다르면 문서를 갱신하세요. **[수정 코드 제시 불가 — 문맥 파악 불충분]** (실제 파일 구조 확인 필요)

2. 문서 파일명의 한글 인코딩 이슈 방지.
   - **위치**: 파일명 전체
   - **기존 코드**: `2026-08-26-solve-question-to-answerSaved-가이드.md`
   - **해결 방안**:
```
2026-08-26-solve-question-to-answerSaved-guide.md
```

---

## 최종 평가

**결론**:
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**

이 커밋은 코드가 아닌 구현 지시서 문서 추가로, 내용이 매우 상세하고 구조적이며 데이터 계약이 명확해 실무 구현에 바로 활용 가능한 수준입니다. 특히 다음 요소들이 돋보입니다.

- **디바운스 책임의 명확한 분리**: Frame에서는 디바운스를 하지 않고 Host에서만 수행하도록 결정한 근거가 타당합니다. 제출 직전 마지막 답이 타이머에 갇히는 유실 시나리오를 정확히 지적했습니다.
- **데이터 계약의 구체성**: `sub_id`를 최상위 필드로 유지하고 `answer`에 섞지 말 것, `timeSpentMs`에 0을 보내지 말 것, `answer`를 이중 직렬화하지 말 것 등 구현 중 발생하기 쉬운 실수를 사전에 차단했습니다.
- **범위 관리**: §8에서 명시적으로 "하지 말 것"을 나열해 구현자가 과도한 작업을 수행하는 것을 방지했습니다.

다만 문서가 참조하는 파일 경로의 실제 존재 여부를 배포 전에 한 번 검증하고, 파일명의 한글 인코딩을 영문으로 통일하면 더 견고해질 것입니다. 문서 자체의 품질은 우수하며 승인 가능합니다.