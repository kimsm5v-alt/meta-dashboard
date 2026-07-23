> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 6cf0867a

## 코드 복잡도 분석

**분석된 파일**: 6개 / 변경된 파일: 6개


### 정상 범위 (NONE)


**`drawpdfservice.java`** (other)

- 평균 복잡도: **0.235**

- 최대 복잡도: 0.470

- 청크 수: 16개

- 평균 사용처: 31.4곳


**권장사항:**

- 복잡도 정상 범위


**`dgnssgraphservice.java`** (other)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.008

- 청크 수: 8개


**권장사항:**

- 복잡도 정상 범위


**`useconversations.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.010

- 청크 수: 66개


**권장사항:**

- 파일 크기가 큼 (66개 청크) - 파일 분리 검토


**`datahelperservice.ts`** (utility)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.008

- 청크 수: 32개


**권장사항:**

- 파일 크기가 큼 (32개 청크) - 파일 분리 검토


**`schoolrecordpanel.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.007

- 청크 수: 59개


**권장사항:**

- 파일 크기가 큼 (59개 청크) - 파일 분리 검토


**`aichatpanel.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.004

- 청크 수: 48개


**권장사항:**

- 파일 크기가 큼 (48개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 세 가지 독립적인 변경을 포함합니다: (1) 백엔드 DgnssGraphService의 API 응답 페이로드 경량화, (2) PDF 생성 시 teacherNm 필드명 오류 수정, (3) 프론트엔드 AI 채팅/데이터헬퍼/생활기록부 생성 API 호출 시 사용자 식별자를 `user.id`에서 `user.email`로 변경하고, `userId` 파라미터를 관련 함수들에 전파한 변경입니다.

- **목적**: API 응답 최적화, 필드명 불일치 버그 수정, 사용자 식별 방식 통일
- **도메인**: 백엔드(API 응답/PDF 생성) + 프론트엔드(AI 에이전트 연동)
- **변경 방향**: 불필요한 응답 데이터 제거로 네트워크 비용 절감, 실제 데이터 필드명으로 정정, 사용자 식별자를 `id`에서 `email`로 일원화

---

## [GOOD] 잘된 점

**1. 응답 페이로드 경량화 의도가 명확하게 문서화됨**

`stripInternal` 메서드에 추가된 주석이 매우 좋습니다. FE에서 실제 사용하는 필드(`factorName`, `individualT`)와 중복/미사용 필드(`groupT`, `deviation`, `direction`)를 명시적으로 구분하여 제거 사유를 문서화했습니다. 이는 유지보수자가 추후 "왜 이 필드가 없지?"라는 의문을 가질 때 즉시 답을 얻을 수 있게 해줍니다.

```java
// 강점/보완점은 FE에서 factorName·individualT만 사용. 나머지는 미사용(groupT·deviation·direction은
// typeDeviations의 typeMean·diff·direction과 중복)이라 응답에서 제외한다.
```

**2. PDF 필드명 버그 수정이 정확함**

`DrawPdfService.java`에서 `teacherNm` → `tcNm` 변경은 실제 DB/API 응답 구조에 맞춘 정정입니다. 기존 코드는 `MapUtils.getString(userInfo, "teacherNm", "김비상")`으로 잘못된 키를 조회하여 항상 기본값인 "김비상"이 출력되는 버그가 있었습니다. 이를 `tcNm`으로 수정하여 실제 데이터가 출력되도록 했습니다.

**3. userId 전달 시 하위 호환성 유지**

`dataHelperService.ts`의 `getDataHelperAnswer`와 `getDataHelperFreeAnswer` 모두 `userId?`를 optional 파라미터(`string | undefined`)로 추가했습니다. 이는 기존 호출자에 영향을 주지 않으면서 새로운 기능을 추가하는 좋은 방식입니다.

```typescript
export const getDataHelperFreeAnswer = async (
  question: string,
  data: StudentData,
  userId?: string,  // optional로 추가
): Promise<string> => {
```

---

## 변경사항 요약

| 파일 | 변경 내용 |
|------|----------|
| `DgnssGraphService.java` | `stripInternal()`에서 `need` 외에 `factorType`, `groupT`, `deviation`, `direction` 필드 제거 |
| `DrawPdfService.java` | PDF 검사해석 전문가명 필드 `teacherNm` → `tcNm` 수정 |
| `useConversations.ts` | `callAssistantStream` 호출 시 `user.id` → `user.email`로 변경 |
| `dataHelperService.ts` | 두 함수에 `userId?` 파라미터 추가 및 `agentChat`에 전달 |
| `AiChatPanel.tsx` | `useAuth` 훅 도입, `user?.email`을 API 호출 시 전달 |
| `SchoolRecordPanel.tsx` | `useAuth` 훅 도입, `user?.email`을 `agentChatStream`에 전달 |

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

**없음**

### High (우선 수정 권장)

**없음**

### Medium (개선 권장)

**1. `SchoolRecordPanel.tsx`에서 `agentChatStream` 호출 시 contextData가 null로 고정됨**

- **위치**: `SchoolRecordPanel.tsx` 라인 685-693
- **문제 분석**: `agentChatStream`의 4번째 파라미터(`contextData`)가 `null`로 하드코딩되었습니다. 반면 `AiChatPanel.tsx`에서 호출하는 `getDataHelperAnswer`/`getDataHelperFreeAnswer`는 내부적으로 `contextData`에 `SYSTEM_PROMPT_DATA_HELPER`와 `studentContext`를 구성하여 전달합니다.

  `agentApiService.ts`의 `AgentQuery` 인터페이스를 보면 `context_data`가 별도 필드로 존재합니다:
  ```typescript
  interface AgentQuery {
    text: string;
    session_id: string;
    context_data?: Record<string, unknown> | null;
    userId?: string;
  }
  ```

  그러나 현재 `agentChatStream`의 구현을 보면 `context_data`는 단순히 요청 바디에 포함되어 전달될 뿐, `fullPrompt`에 포함된 내용과 별도로 처리되는 특별한 로직이 없습니다. `SchoolRecordPanel`은 `fullPrompt`에 `systemPrompt`와 `userMessage`를 모두 평문으로 포함시키고 있어, 현재 시점에서는 기능상 문제가 없습니다.

  **개선 제안**: 향후 `agentChatStream`이 `context_data`를 별도로 처리(예: 시스템 메시지 분리, 토큰 할당 최적화)하게 될 경우를 대비하여, `dataHelperService.ts`처럼 `contextData`를 구성하여 전달하는 방식으로 통일하는 것을 고려하세요. 다만 현재는 기능 회귀가 아니므로 즉시 수정이 아닌 개선 권장 사항입니다.

  **[수정 코드 제시 불가 -- 문맥 파악 불충분]**: `buildSimpleRecordMessages`가 반환하는 `systemPrompt`와 `userMessage`를 분리하여 `context_data`에 담는 방식으로 변경하려면, 백엔드 에이전트가 `context_data`를 어떻게 처리하는지 추가 확인이 필요합니다.

**2. `DgnssGraphService.stripInternal()`에서 `factorType` 제거 시 영향 범위**

- **위치**: `DgnssGraphService.java` 라인 315
- **문제 분석**: `factorType` 필드가 제거되었습니다. 주석에 따르면 FE에서 `factorName`과 `individualT`만 사용한다고 명시되어 있습니다. `factorType`은 요인의 유형(강점/보완점 등)을 구분하는 식별자 역할을 할 수 있습니다.

  실제로 `stripInternal` 메서드의 호출부를 확인한 결과, 이 메서드는 "유형별 특이점 응답용"으로만 사용되며, 상위 레벨에서 이미 `strengths`/`weaknesses`로 분류된 후 전달됩니다. 따라서 `factorType`이 없어도 FE에서 유형을 구분하는 데 문제가 없습니다.

  **결론**: 현재 상태로 충분하며, 추후 FE에서 요인 유형별 필터링이나 스타일링이 필요해질 경우에만 추가를 고려하세요.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**:

이 커밋은 전반적으로 안정적이고 명확한 변경입니다. 특히 `stripInternal`의 주석 문서화는 유지보수성을 크게 향상시켰고, `dataHelperService`의 optional 파라미터 처리는 하위 호환성을 고려한 좋은 접근입니다. `SchoolRecordPanel`의 `agentChatStream` contextData 전달 방식은 현재 기능상 문제가 없으므로, 향후 일관성 개선이 필요할 때만 검토하셔도 충분합니다. 승인 조건부 통과를 권장합니다.