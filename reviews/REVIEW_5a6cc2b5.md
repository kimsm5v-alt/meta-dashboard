> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 5a6cc2b5

## 코드 복잡도 분석

**분석된 파일**: 8개 / 변경된 파일: 18개


### 정상 범위 (NONE)


**`dgnssmapper.xml`** (other)

- 평균 복잡도: **0.243**

- 최대 복잡도: 0.475

- 청크 수: 2개

- 평균 사용처: 7.0곳


**권장사항:**

- 복잡도 정상 범위


**`apiresponseaspect.java`** (other)

- 평균 복잡도: **0.237**

- 최대 복잡도: 0.467

- 청크 수: 2개

- 평균 사용처: 29.5곳


**권장사항:**

- 복잡도 정상 범위


**`dgnssmapper.java`** (other)

- 평균 복잡도: **0.226**

- 최대 복잡도: 0.466

- 청크 수: 165개

- 평균 사용처: 33.6곳


**권장사항:**

- 파일 크기가 큼 (165개 청크) - 파일 분리 검토


**`dgnsscontroller.java`** (other)

- 평균 복잡도: **0.218**

- 최대 복잡도: 0.470

- 청크 수: 24개

- 평균 사용처: 26.9곳


**권장사항:**

- 파일 크기가 큼 (24개 청크) - 파일 분리 검토


**`securityconfig.java`** (config)

- 평균 복잡도: **0.200**

- 최대 복잡도: 0.464

- 청크 수: 14개

- 평균 사용처: 22.4곳


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`dgnssservice.java`** (other)

- 평균 복잡도: **0.152**

- 최대 복잡도: 0.474

- 청크 수: 50개

- 평균 사용처: 17.6곳


**권장사항:**

- 파일 크기가 큼 (50개 청크) - 파일 분리 검토


**`neo4jdriverconfig.java`** (config)

- 평균 복잡도: **0.009**

- 최대 복잡도: 0.010

- 청크 수: 2개


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`dgnssgraphservice.java`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.004

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 프론트엔드 알림(notification) 기능을 구현하기 위한 초기 설정 작업입니다. 알림 관련 API 서비스, 타입 정의, Pinia 스토어, 컴포넌트 기본 구조를 생성하여 사용자에게 알림을 표시할 수 있는 기반을 마련했습니다.

- **목적**: 프론트엔드 알림 시스템 구축 (API 연동, 상태 관리, UI 컴포넌트)
- **도메인**: 프론트엔드 (UI, 상태 관리, API 통신)
- **변경 방향**: 신규 기능 추가 (알림 기능의 전체 레이어를 한 번에 구현)

---

## [GOOD] 잘된 점

- **레이어 분리**: 타입 정의(`types`), API 서비스(`services`), 상태 관리(`stores`), UI 컴포넌트(`components`)를 명확히 분리하여 관심사 분리 원칙을 잘 지켰습니다. 각 레이어가 독립적으로 테스트 가능하고 유지보수하기 쉬운 구조입니다.
- **Pinia 스토어 사용**: Vue 3의 공식 상태 관리 라이브러리인 Pinia를 사용하여 알림 상태를 중앙에서 관리함으로써, 여러 컴포넌트에서 일관된 데이터를 참조할 수 있습니다.
- **컴포넌트 분할**: `NotificationBell`, `NotificationList`, `NotificationItem`으로 컴포넌트를 세분화하여 각 컴포넌트의 책임을 명확히 했습니다. 이는 재사용성과 테스트 용이성을 높여줍니다.

---

## 변경사항 요약

총 7개 파일이 추가/수정되었습니다. 알림 타입 정의(`types/notification.ts`), API 서비스(`services/notification.service.ts`), Pinia 스토어(`stores/notification.ts`), 메인 컴포넌트(`NotificationBell.vue`), 알림 목록 컴포넌트(`NotificationList.vue`), 알림 아이템 컴포넌트(`NotificationItem.vue`), 그리고 라우터(`router/index.ts`)에 알림 페이지가 추가되었습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `NotificationItem.vue` - `NotificationType` enum과 문자열 비교 불일치**

`notification.type` 값을 문자열(`'info'`, `'warning'`)과 직접 비교하고 있습니다. `NotificationType` enum이 숫자형(`0`, `1`, `2`)으로 정의되어 있으므로, 이 비교는 항상 `false`를 반환하여 모든 알림이 `else` 블록의 `?`로 표시됩니다.

- **위치**: `src/components/notification/NotificationItem.vue`, 라인 2-4
- **기존 코드**:
```vue
<span v-if="notification.type === 'info'">i</span>
<span v-else-if="notification.type === 'warning'">!</span>
<span v-else>?</span>
```
- **해결 방안 (수정 코드)**:
```vue
<span v-if="notification.type === NotificationType.INFO">i</span>
<span v-else-if="notification.type === NotificationType.WARNING">!</span>
<span v-else>?</span>
```
템플릿에서 `NotificationType` enum을 사용하려면 `<script setup>` 내부에 import하여 로컬 변수로 할당해야 합니다:
```typescript
import { NotificationType } from '@/types/notification';
```

**2. `NotificationList.vue` - `v-for` 키로 배열 인덱스 사용**

`v-for` 디렉티브에서 `:key`로 배열 인덱스(`index`)를 사용하고 있습니다. 알림 목록은 동적으로 추가/제거/재정렬될 가능성이 높으므로, 고유 식별자를 key로 사용해야 Reactivity와 DOM 재사용 측면에서 안전합니다. 인덱스를 key로 사용하면 알림이 삭제되거나 순서가 변경될 때 Vue의 Virtual DOM이 잘못된 노드를 재사용하여 렌더링 버그가 발생할 수 있습니다.

- **위치**: `src/components/notification/NotificationList.vue`, 라인 2
- **기존 코드**:
```vue
<li v-for="(notification, index) in notifications" :key="index">
```
- **해결 방안 (수정 코드)**:
```vue
<li v-for="notification in notifications" :key="notification.id">
```

**3. `NotificationBell.vue` - Props 전달 의미 불일치**

`NotificationList` 컴포넌트에 `notifications` prop을 전달할 때, `store.notifications`(전체 알림)가 아닌 `store.unreadNotifications`(읽지 않은 알림만)를 전달하고 있습니다. prop 이름은 `notifications`이지만 실제로는 읽지 않은 알림만 전달되므로, prop 이름과 데이터의 의미가 일치하지 않습니다. 이는 코드 가독성을 떨어뜨리고 유지보수 시 혼란을 야기할 수 있습니다.

- **위치**: `src/components/notification/NotificationBell.vue`, 라인 5
- **기존 코드**:
```vue
<NotificationList :notifications="store.unreadNotifications" />
```
- **해결 방안 (수정 코드)**:
```vue
<NotificationList :notifications="store.notifications" />
```
또는 `NotificationList`의 prop 이름을 `unreadNotifications`로 변경하는 방법도 있습니다. 하지만 `NotificationList`가 범용적으로 사용될 가능성을 고려하면 `notifications` prop을 유지하고, 필터링은 부모에서 명시적으로 전달하는 것이 더 명확합니다.

### Medium (개선 권장)

**1. `notification.service.ts` - 에러 처리 부재**

API 호출 시 `.catch()` 또는 `try/catch` 블록이 없어 네트워크 오류나 서버 에러 발생 시 처리되지 않습니다. 호출부(store)에서 에러를 처리할 수도 있지만, 서비스 레이어에서 기본적인 에러 핸들링을 제공하는 것이 좋습니다.

- **위치**: `src/services/notification.service.ts`, 라인 5-7
- **기존 코드**:
```typescript
async getNotifications(): Promise<Notification[]> {
  const response = await api.get('/notifications');
  return response.data;
}
```
- **해결 방안 (수정 코드)**:
```typescript
async getNotifications(): Promise<Notification[]> {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    console.error('[NotificationService] Failed to fetch notifications:', error);
    throw error;
  }
}
```

**2. `stores/notification.ts` - 낙관적 업데이트(optimistic update) 누락**

`markAsRead` 호출 시 서버 응답을 기다린 후에만 로컬 상태를 업데이트하고 있습니다. 사용자 경험을 위해 낙관적 업데이트를 적용하고, 실패 시 롤백하는 패턴을 고려할 수 있습니다.

- **위치**: `src/stores/notification.ts`, 라인 15-20
- **기존 코드**:
```typescript
async markAsRead(id: number) {
  await notificationService.markAsRead(id);
  const notification = this.notifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
  }
}
```
- **해결 방안 (수정 코드)**:
```typescript
async markAsRead(id: number) {
  const notification = this.notifications.find(n => n.id === id);
  if (!notification) return;
  
  const previousReadStatus = notification.read;
  notification.read = true; // 낙관적 업데이트
  
  try {
    await notificationService.markAsRead(id);
  } catch (error) {
    notification.read = previousReadStatus; // 실패 시 롤백
    console.error('[NotificationStore] Failed to mark as read:', error);
  }
}
```

**3. `types/notification.ts` - Enum 값 타입 불일치 가능성**

`NotificationType` enum 값이 숫자형(`0`, `1`, `2`)으로 정의되어 있습니다. API 응답에서 문자열(`'info'`, `'warning'`, `'error'`)로 내려올 가능성을 고려하여, enum을 문자열 값으로 정의하거나 파싱 로직을 추가하는 것이 좋습니다.

- **위치**: `src/types/notification.ts`, 라인 1-5
- **기존 코드**:
```typescript
export enum NotificationType {
  INFO = 0,
  WARNING = 1,
  ERROR = 2,
}
```
- **해결 방안 (수정 코드)**:
```typescript
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}
```

---

## 주요 파일 분석

### `src/types/notification.ts`
**변경 내용:** 알림 데이터 구조와 열거형(enum) 타입 정의 (신규 파일)

**분석:**
- `Notification` 인터페이스는 `id`, `type`, `message`, `read`, `createdAt` 필드를 포함하여 알림 데이터의 기본 구조를 잘 정의했습니다.
- `NotificationType` enum이 숫자형으로 정의되어 있어, API 응답과의 타입 불일치 가능성이 있습니다. 문자열 enum으로 변경하거나 API 응답을 파싱하는 로직이 필요합니다.

### `src/services/notification.service.ts`
**변경 내용:** 알림 API 호출 서비스 (신규 파일)

**분석:**
- `getNotifications()`, `markAsRead()` 두 가지 메서드를 제공하여 기본적인 CRUD 중 읽기(R)와 업데이트(U)를 지원합니다.
- 에러 처리와 배치(batch) 처리가 누락되었습니다. `markMultipleAsRead()` 메서드를 추가하여 여러 알림을 한 번에 읽음 처리할 수 있도록 확장하는 것이 좋습니다.

### `src/components/notification/NotificationBell.vue`
**변경 내용:** 알림 벨 아이콘 컴포넌트 (신규 파일)

**분석:**
- `NotificationList` 컴포넌트를 포함하는 컨테이너 역할을 합니다.
- 읽지 않은 알림 개수를 뱃지로 표시하는 로직이 없습니다. 일반적인 알림 벨 UI 패턴을 고려하여 뱃지 표시를 추가하는 것이 좋습니다.

### `src/components/notification/NotificationList.vue`
**변경 내용:** 알림 목록 렌더링 컴포넌트 (신규 파일)

**분석:**
- `notifications` prop을 받아 리스트로 렌더링합니다.
- `v-for` key로 인덱스를 사용하고 있어 동적 목록에서 렌더링 버그 가능성이 있습니다.
- 빈 상태(empty state) 처리가 없어 알림이 없을 때 빈 화면이 표시됩니다.

### `src/components/notification/NotificationItem.vue`
**변경 내용:** 개별 알림 아이템 컴포넌트 (신규 파일)

**분석:**
- 개별 알림의 타입에 따라 아이콘을 표시하는 로직이 있습니다.
- `NotificationType` enum과 문자열 비교 불일치로 인해 모든 알림이 `?`로 표시되는 버그가 있습니다.
- `read` 상태에 따른 시각적 구분(예: 읽지 않은 알림은 굵은 글씨, 배경색 차이)이 없습니다.

---

## 최종 평가

**결론**: 
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

알림 기능의 전체 레이어(타입, 서비스, 스토어, 컴포넌트)를 한 번에 구성한 점은 좋은 접근입니다. 전반적인 구조와 설계 방향은 적절하며, 초기 구현 단계에서 발견된 몇 가지 이슈만 해결하면 됩니다.

다만, 다음 3가지 High 이슈는 실제 동작에 영향을 줄 수 있으므로 반드시 수정 후 승인을 권장합니다:

1. **`NotificationItem.vue`**: `NotificationType` enum과 문자열 비교 불일치로 인해 모든 알림이 `?`로 표시되는 버그
2. **`NotificationList.vue`**: `v-for` key로 인덱스 사용으로 인한 잠재적 렌더링 버그
3. **`NotificationBell.vue`**: `unreadNotifications`를 `notifications` prop으로 전달하는 의미적 불일치

위 3가지 이슈를 수정한 후에는 정상적으로 동작할 것으로 예상됩니다. 수고하셨습니다.