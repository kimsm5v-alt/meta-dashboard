# 공유 컴포넌트 가이드

> `src/shared/components/`에 위치한 재사용 가능한 UI 컴포넌트

---

## 컴포넌트 목록

| 컴포넌트 | 파일 | 설명 |
|----------|------|------|
| `Button` | Button.tsx | 기본 버튼 (primary, secondary, outline) |
| `Card` | Card.tsx | 카드 컨테이너 |
| `Modal` | Modal.tsx | 모달 다이얼로그 |
| `AlertModal` | AlertModal.tsx | 알림 모달 (info, success, warning, error) |
| `Badge` | Badge.tsx | 배지 (상태 표시) |
| `TypeBadge` | Badge.tsx | LPA 유형 배지 |
| `Loading` | Loading.tsx | 로딩 스피너 |
| `PageLoading` | Loading.tsx | 페이지 로딩 |
| `PanelLoading` | Loading.tsx | 패널 로딩 |
| `MultiSelectButtonGroup` | MultiSelectButtonGroup.tsx | 복수 선택 버튼 그룹 |

---

## Button

```tsx
import { Button } from '@/shared/components';

<Button variant="primary" size="md">버튼</Button>
<Button variant="secondary">취소</Button>
<Button variant="outline" disabled>비활성</Button>
```

### Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `variant` | `'primary' \| 'secondary' \| 'outline'` | `'primary'` | 버튼 스타일 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 버튼 크기 |
| `disabled` | `boolean` | `false` | 비활성화 상태 |

### 스타일 매핑

```typescript
const variantClasses = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};
```

---

## Card

```tsx
import { Card } from '@/shared/components';

<Card>기본 카드</Card>
<Card hoverable onClick={handleClick}>클릭 가능한 카드</Card>
<Card className="p-6">커스텀 패딩</Card>
```

### Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `hoverable` | `boolean` | `false` | 호버 효과 |
| `onClick` | `() => void` | - | 클릭 핸들러 |
| `className` | `string` | `''` | 추가 클래스 |

### 기본 스타일

```typescript
const baseClass = 'bg-white rounded-xl shadow-sm border border-gray-100 p-4';
const hoverClass = 'hover:shadow-md hover:border-gray-200 transition-all cursor-pointer';
```

---

## Modal

```tsx
import { Modal } from '@/shared/components';

<Modal isOpen={isOpen} onClose={onClose} title="모달 제목" size="lg">
  <p>모달 내용</p>
</Modal>
```

### Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `isOpen` | `boolean` | - | 모달 열림 상태 |
| `onClose` | `() => void` | - | 닫기 핸들러 |
| `title` | `string` | - | 모달 제목 (선택) |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl' \| '5xl' \| 'full'` | `'md'` | 모달 크기 |
| `showCloseButton` | `boolean` | `true` | 닫기 버튼 표시 |

### 크기 매핑

```typescript
const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  '3xl': 'max-w-4xl',
  '4xl': 'max-w-5xl',
  '5xl': 'max-w-6xl',
  full: 'max-w-7xl',
};
```

### 기능

- ESC 키로 닫기
- 배경 클릭으로 닫기
- 열릴 때 body 스크롤 방지

---

## AlertModal

```tsx
import { AlertModal } from '@/shared/components';

<AlertModal
  isOpen={showAlert}
  onClose={() => setShowAlert(false)}
  title="알림"
  message="작업이 완료되었습니다."
  type="success"
  confirmText="확인"
/>
```

### Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `isOpen` | `boolean` | - | 모달 열림 상태 |
| `onClose` | `() => void` | - | 닫기 핸들러 |
| `title` | `string` | - | 알림 제목 |
| `message` | `string` | - | 알림 메시지 |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'warning'` | 알림 유형 |
| `confirmText` | `string` | `'확인'` | 확인 버튼 텍스트 |

### 유형별 스타일

| 유형 | 아이콘 | 배경색 | 아이콘색 |
|------|--------|--------|----------|
| `info` | Info | `bg-blue-100` | `text-blue-600` |
| `success` | CheckCircle | `bg-emerald-100` | `text-emerald-600` |
| `warning` | AlertCircle | `bg-amber-100` | `text-amber-600` |
| `error` | XCircle | `bg-red-100` | `text-red-600` |

---

## Badge / TypeBadge

```tsx
import { Badge, TypeBadge } from '@/shared/components';

<Badge variant="success">완료</Badge>
<Badge variant="warning">대기중</Badge>
<TypeBadge type="자원소진형" />
```

### Badge Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `variant` | `'default' \| 'success' \| 'warning' \| 'error'` | `'default'` | 배지 스타일 |
| `type` | `string` | - | LPA 유형 (유형별 색상 자동 적용) |
| `className` | `string` | `''` | 추가 클래스 |

### TypeBadge

- LPA 유형명을 받아 자동으로 색상 적용
- `TYPE_COLOR_CLASSES` (lpaProfiles.ts) 참조

---

## Loading / PageLoading / PanelLoading

```tsx
import { Loading, PageLoading, PanelLoading } from '@/shared/components';

<Loading size="md" text="로딩 중..." />
<PageLoading text="데이터를 불러오는 중..." />
<PanelLoading height="h-60" />
```

### Loading Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 스피너 크기 |
| `text` | `string` | - | 로딩 텍스트 |

### 변형

| 컴포넌트 | 용도 | 기본 높이 |
|----------|------|-----------|
| `Loading` | 인라인 스피너 | - |
| `PageLoading` | 페이지 전체 로딩 | `min-h-[400px]` |
| `PanelLoading` | 패널/섹션 로딩 | `h-40` |

---

## MultiSelectButtonGroup

```tsx
import { MultiSelectButtonGroup } from '@/shared/components';

<MultiSelectButtonGroup
  label="상담 유형"
  required
  items={['regular', 'urgent', 'follow-up']}
  selected={selectedTypes}
  onToggle={handleToggle}
  labelMap={{ regular: '정기상담', urgent: '긴급상담', 'follow-up': '후속상담' }}
  alertKey="urgent"
  size="md"
/>
```

### Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `label` | `string` | - | 레이블 |
| `required` | `boolean` | `false` | 필수 표시 |
| `items` | `T[]` | - | 선택 가능한 항목 |
| `selected` | `T[]` | - | 선택된 항목 |
| `onToggle` | `(item: T) => void` | - | 토글 핸들러 |
| `labelMap` | `Record<T, string>` | - | 항목별 라벨 매핑 |
| `alertKey` | `T` | - | 선택 시 빨간색 표시할 항목 |
| `size` | `'sm' \| 'md'` | `'md'` | 버튼 크기 |

---

## 공통 디자인 패턴

### 카드 기본 스타일

```tsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
```

### 카드 내 섹션 분리

```tsx
<div className="border-b border-gray-200 pb-6 mb-6">
```

### 그라데이션 배경 (AI Insight)

```tsx
<div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-xl p-6">
```

### 좌우 비율 레이아웃 (40:60)

```tsx
<div className="grid grid-cols-1 md:grid-cols-5 gap-8">
  <div className="md:col-span-2">{/* 40% */}</div>
  <div className="md:col-span-3">{/* 60% */}</div>
</div>
```

---

## 차트 공통 설정

```tsx
// Recharts Y축 (T점수 범위)
<YAxis domain={[20, 80]} />

// 기준선 (전국 평균)
<ReferenceLine y={50} stroke="#888" strokeDasharray="3 3" label="전국 평균" />

// 막대 차트 둥근 모서리
<Bar radius={[0, 4, 4, 0]} />

// 도넛 차트
<Pie innerRadius={70} outerRadius={110} paddingAngle={2} cornerRadius={4} />
```

---

**Last Updated**: 2026-03-04
