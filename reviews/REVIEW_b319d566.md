# 코드 리뷰 - b319d566

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`useeverycanvasembed.ts`** (utility)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.004

- 청크 수: 10개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 `feature/frontend-architecture` 브랜치의 Merge 커밋으로, 실제 코드 변경은 `useEveryCanvasEmbed.ts` 훅의 `options` 타입 정의 수정입니다. `CreateEmbedOptions` 타입에서 `brandId` 필드를 `Omit`으로 제외하여 타입 중복을 방지하고 빌드 에러를 해결하기 위한 변경입니다.

- **목적**: `useEveryCanvasEmbed` 훅의 `options` 파라미터 타입에서 `brandId`를 제외하여, 훅이 별도로 관리하는 `brandId` 파라미터와의 타입 충돌(빌드 에러)을 임시 해결
- **도메인**: 프론트엔드 (React 훅 / EveryCanvas Embed SDK 연동)
- **변경 방향**: 타입 안전성 유지(`Omit` 활용)를 통해 `brandId`의 이중 정의를 방지하고, 훅 내부에서 `brandIdRef.current`로 일관되게 주입하는 구조로 정리

---

## [GOOD] 잘된 점

1. **`Omit` 유틸리티 타입 활용**: `Omit<CreateEmbedOptions, 'brandId'>`를 사용하여 기존 타입의 나머지 필드를 그대로 유지하면서 `brandId`만 제외한 점이 타입 안전성 측면에서 적절합니다. 전체 타입을 새로 정의하지 않고 기존 타입을 재사용한 것은 유지보수에 유리합니다.
2. **훅의 책임 분리가 명확**: `brandId`를 `options`에서 제외하고 별도의 파라미터(기본값 21)로 받아 내부에서 `brandIdRef.current`로 관리하는 구조는, 훅 사용자가 `options`와 `brandId`를 혼동하지 않도록 하는 좋은 설계입니다.
3. **임시 처리임을 명시**: 주석 `/** 빌드에러 임시처리*/`을 통해 이 변경이 임시 조치임을 팀원들이 인지할 수 있게 한 점이 좋습니다.

---

## 변경사항 요약

`useEveryCanvasEmbed.ts`의 `UseEveryCanvasEmbedParams` 타입에서 `options` 필드의 타입을 `CreateEmbedOptions`에서 `Omit<CreateEmbedOptions, 'brandId'>`로 변경했습니다. 이는 훅이 이미 별도의 `brandId` 파라미터를 받아 `createEmbed` 호출 시 `brandId: brandIdRef.current`로 주입하고 있으므로, `options`에 `brandId`가 포함되어 타입이 중복 정의되는 문제를 해결한 것입니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

1. **임시 처리 주석의 구체화 및 TODO 관리**
   - **위치**: `frontend/src/features/lesson/lib/useEveryCanvasEmbed.ts` 라인 17
   - **기존 코드**:
     ```typescript
     /** 빌드에러 임시처리*/
     options: Omit<CreateEmbedOptions, 'brandId'>;
     ```
   - **개선 제안**: `/** 빌드에러 임시처리*/`라는 주석은 무엇이 빌드 에러였는지, 왜 `brandId`를 제외해야 했는지에 대한 맥락이 부족합니다. 임시 처리가 영구화되지 않도록 TODO와 함께 구체적인 이유를 명시하는 것이 좋습니다.
   - **해결 방안 (수정 코드)**:
     ```typescript
     /**
      * TODO: 빌드 에러 임시 처리 (2026-08-25)
      * - CreateEmbedOptions에 brandId가 포함되어 있으나, 훅이 별도 brandId 파라미터로 관리하므로
      *   options에서 제외하여 타입 중복을 방지함.
      * - 추후 everyCanvasEmbedSdk의 CreateEmbedOptions 타입 정의에서 brandId 제거 여부를 확인 후 정리 필요.
      */
     options: Omit<CreateEmbedOptions, 'brandId'>;
     ```

2. **`brandId` 기본값 하드코딩에 대한 상수화 검토**
   - **위치**: `frontend/src/features/lesson/lib/useEveryCanvasEmbed.ts` 라인 38
   - **기존 코드**:
     ```typescript
     brandId = 21,
     ```
   - **개선 제안**: 매직 넘버 `21`이 어떤 의미인지(브랜드 ID) 코드만으로 파악하기 어렵습니다. 상수로 추출하거나 주석을 추가하면 가독성이 향상됩니다. 다만, 이는 이번 커밋의 변경 범위가 아니므로 참고 사항으로만 제안합니다.

---

## 주요 파일 분석

### frontend/src/features/lesson/lib/useEveryCanvasEmbed.ts

**변경 내용:**
`UseEveryCanvasEmbedParams`의 `options` 타입을 `Omit<CreateEmbedOptions, 'brandId'>`로 변경하여 타입 중복을 방지.

**개선 제안:**
1. 임시 처리 주석을 TODO와 함께 구체적인 이유를 명시하도록 개선 (위 Medium 항목 참조)
2. `brandId` 기본값 `21`에 대한 상수화 또는 주석 추가 검토

---

## 최종 평가

**결론**:
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**

이번 변경은 `useEveryCanvasEmbed` 훅에서 `options`와 별도 `brandId` 파라미터 간의 타입 중복을 `Omit` 유틸리티 타입으로 해결한 적절한 수정입니다. 훅 내부에서 `brandIdRef.current`로 일관되게 주입하는 구조가 이미 잘 갖춰져 있어, 타입 레벨에서의 정리가 자연스럽게 이루어졌습니다. 다만, `/** 빌드에러 임시처리*/` 주석이 임시 처리임을 명시하고 있으므로, 추후 근본 원인(예: `CreateEmbedOptions` 타입 정의에서 `brandId` 제거 여부)을 파악하여 정식으로 정리하는 TODO를 남겨두는 것을 권장합니다. 현재 상태로는 기능적 문제가 없으며 승인 가능합니다.