# Prototype 협업 가이드 (기획자용)

> 개발 지식 없이도 따라할 수 있는 Git 협업 가이드입니다.

## 폴더 구조

```
meta-dashboard/
├── prototype/          ← ✅ 고도화 작업 (기획자 3명)
├── prototype-legacy/   ← 📦 현재 운영 버전 백업 (참고용, 수정 X)
├── frontend/           ← 프론트엔드 개발자
└── backend/            ← 백엔드 개발자
```

### 중요

- `prototype/` → **고도화 작업은 여기서**
- `prototype-legacy/` → **운영 버전 참고만** (절대 수정 X)

---

## 브랜치 구조

### 핵심 규칙

> **vs-develop에서 직접 작업하지 마세요!**
> 반드시 **본인 브랜치**를 만들어서 작업해야 합니다.

### 왜 각자 브랜치가 필요한가요?

```
❌ 잘못된 방식: vs-develop에서 직접 작업
vs-develop
    └── 3명이 여기서 동시에 작업하면?
        → 서로 코드 덮어씀
        → 충돌 지옥
        → 누가 뭘 바꿨는지 모름

✅ 올바른 방식: 각자 브랜치에서 작업
vs-develop (기준 브랜치 - 직접 작업 X, 머지만 함)
    │
    ├── feat/v2-exam-counseling   ← 김새미 (여기서 작업)
    ├── feat/v2-lesson            ← 문승민 (여기서 작업)
    └── feat/v2-ai-assistant      ← 김다영 (여기서 작업)
```

### 브랜치 설명

| 브랜치 | 용도 | 직접 작업? |
|--------|------|-----------|
| `vs-prod` | 운영 서버 | ❌ 절대 금지 |
| `vs-develop` | 개발 서버 (머지용) | ❌ 직접 작업 금지 |
| `feat/v2-본인브랜치` | 본인 작업용 | ✅ 여기서 작업 |

### 작업 흐름 요약

```
1. 본인 브랜치에서 작업 (feat/v2-xxx)
        ↓
2. 작업 완료 → GitLab에 push
        ↓
3. MR(Merge Request) 생성: feat/v2-xxx → vs-develop
        ↓
4. 리뷰 후 머지 → vs-develop에 반영됨
        ↓
5. 다른 사람 변경사항 받기: vs-develop pull → 본인 브랜치에 merge
```

---

## 작업 시작 전 체크리스트

### 1. 본인 브랜치 확인

VS Code 좌측 하단에서 현재 브랜치를 확인하세요.

```
본인 브랜치가 맞는지 꼭 확인!
예: feat/v2-exam-counseling
```

### 2. 최신 코드 받기 (매일 작업 시작 전)

```bash
# 1. 기준 브랜치로 이동
git checkout vs-develop

# 2. 최신 코드 받기
git pull gitlab vs-develop

# 3. 본인 브랜치로 이동
git checkout feat/v2-본인브랜치명

# 4. 최신 코드 합치기
git merge vs-develop
```

---

## 폴더 구조 및 담당 영역

### 기본 규칙

- **본인 담당 폴더에서만 작업하세요**
- `shared/` 폴더는 공용입니다 → 수정 전 팀에 공유 필수!
- `prototype-legacy/`는 **절대 수정하지 마세요** (참고용)

### 폴더 구조

```
prototype/src/
├── app/                    ← ⚠️ 공용 (Layout, routes)
├── assets/                 ← ⚠️ 공용 (이미지, 아이콘)
├── features/               ← ✅ 각자 담당 폴더에서 작업
│   ├── exam-management/    ← 김새미
│   ├── exam-result/        ← 김새미
│   ├── exam-tracking/      ← 김새미
│   ├── counseling/         ← 김새미
│   ├── coaching/           ← 김새미
│   ├── lesson-resources/   ← 문승민
│   ├── my-lesson/          ← 문승민
│   └── ai-assistant/       ← 김다영
└── shared/                 ← ⚠️ 공용 (수정 시 팀 공유)
    ├── components/         ← 공통 컴포넌트
    ├── hooks/              ← 공통 훅
    ├── types/              ← 공통 타입
    └── utils/              ← 공통 유틸
```

### 담당 영역 분배

| 기획자 | 브랜치 | 담당 GNB | 담당 Features |
|--------|--------|----------|--------------|
| 김새미 | `feat/v2-exam-counseling` | 검사, 상담·코칭 | `exam-management/`, `exam-result/`, `exam-tracking/`, `counseling/`, `coaching/` |
| 문승민 | `feat/v2-lesson` | 수업 | `lesson-resources/`, `my-lesson/` |
| 김다영 | `feat/v2-ai-assistant` | AI어시스턴트 | `ai-assistant/` |

---

## 작업 흐름

### Step 1: 본인 브랜치에서 작업

```bash
# 본인 브랜치인지 확인
git branch

# 코드 수정 후 저장
```

### Step 2: 변경사항 커밋

```bash
# 변경된 파일 확인
git status

# 모든 변경사항 추가
git add .

# 커밋 메시지 작성
git commit -m "[PROTOTYPE] 작업 내용 간단히"
```

#### 커밋 메시지 예시

```
[PROTOTYPE] feat: 학생 대시보드 그래프 추가
[PROTOTYPE] fix: 버튼 클릭 안되는 버그 수정
[PROTOTYPE] refactor: 코드 정리
```

### Step 3: GitLab에 올리기

```bash
git push gitlab feat/v2-본인브랜치명
```

### Step 4: 머지 요청 (MR)

1. GitLab 사이트 접속
2. "Create merge request" 버튼 클릭
3. `feat/v2-본인브랜치명` → `vs-develop` 선택
4. 리뷰어 지정 후 생성

---

## 주의사항

### 절대 하지 말 것

| 금지 사항 | 이유 |
|----------|------|
| `vs-prod` 브랜치에서 작업 | 운영 서버에 바로 반영됨 |
| `vs-develop` 브랜치에서 직접 작업 | 다른 사람과 충돌, 코드 꼬임 |
| `prototype-legacy/` 폴더 수정 | 운영 버전 참고용 (읽기 전용) |
| 다른 사람 폴더 수정 | 충돌 발생 |
| `shared/` 폴더 무단 수정 | 다른 사람 코드가 깨질 수 있음 |

### 반드시 할 것

| 필수 사항 | 이유 |
|----------|------|
| 작업 전 브랜치 확인 | 잘못된 브랜치에 커밋 방지 |
| 매일 최신 코드 pull | 충돌 최소화 |
| `shared/` 수정 시 팀 공유 | 충돌 방지 |
| 작은 단위로 자주 커밋 | 문제 발생 시 복구 쉬움 |

---

## 운영 이슈 발생 시 (참고)

현재 운영 버전 관련 수정이 필요하면:

1. `prototype-legacy/` 폴더에서 해당 코드 확인
2. 개발자에게 전달 → `frontend/` 또는 `backend/`에서 수정

---

## 문제 상황 대처법

### "내 코드가 사라졌어요!"

브랜치가 바뀌었을 가능성이 높습니다.

```bash
# 현재 브랜치 확인
git branch

# 본인 브랜치로 이동
git checkout feat/v2-본인브랜치명
```

### "충돌(Conflict)이 발생했어요!"

1. 당황하지 말고 팀에 공유
2. 충돌 파일 확인
3. 함께 해결 (혼자 해결하려다 더 꼬일 수 있음)

### "커밋을 잘못했어요!"

```bash
# 마지막 커밋 취소 (변경사항은 유지)
git reset --soft HEAD~1
```

### "모르겠어요!"

1. **일단 멈추기** - 더 건드리지 않기
2. **팀에 공유** - 현재 상황 알리기
3. **도움 요청** - 함께 해결

---

## VS Code 꿀팁

### 브랜치 확인/변경

- 좌측 하단에 현재 브랜치명 표시됨
- 클릭하면 브랜치 변경 가능

### Git 변경사항 확인

- 좌측 사이드바 > 소스 제어 (세 번째 아이콘)
- 변경된 파일 목록 확인 가능

### 터미널 열기

- `Ctrl + `` (백틱) 또는 상단 메뉴 > 터미널 > 새 터미널

---

## 연락처

문제 발생 시 바로 연락주세요!

- 슬랙: #meta-dashboard-dev
- 담당자: (담당자 이름)

---

**최종 수정일**: 2026-07-09
