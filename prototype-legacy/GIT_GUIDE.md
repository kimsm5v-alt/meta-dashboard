# Prototype 협업 가이드 (기획자용)

> 개발 지식 없이도 따라할 수 있는 Git 협업 가이드입니다.

## 브랜치 구조 이해하기

브랜치는 **같은 폴더의 다른 버전**이라고 생각하면 됩니다.

| 브랜치 | 용도 | 누가 쓰나요? |
|--------|------|-------------|
| `vs-prod` | 운영 서버 (체험단 사용 중) | 배포 담당자만 |
| `vs-develop` | 현재 버전 유지보수 | 핫픽스 담당자 |
| `vs-develop-v2` | 고도화 버전 개발 | 기획자 3명 |

### 중요한 개념

```
vs-develop-v2 (고도화 기준 브랜치)
    │
    ├── feat/v2-exam-counseling   ← 김새미 (검사, 상담·코칭)
    ├── feat/v2-lesson            ← 문승민 (수업)
    └── feat/v2-ai-assistant      ← 김다영 (AI어시스턴트)
```

- 각자 **본인 브랜치에서만 작업**합니다
- 작업 완료 후 `vs-develop-v2`로 **머지(합치기)** 합니다
- 다른 사람 브랜치는 건드리지 않습니다

---

## 작업 시작 전 체크리스트

### 1. 본인 브랜치 확인

VS Code 좌측 하단에서 현재 브랜치를 확인하세요.

```
본인 브랜치가 맞는지 꼭 확인!
예: feat/v2-student-dashboard
```

### 2. 최신 코드 받기 (매일 작업 시작 전)

```bash
# 1. 고도화 기준 브랜치로 이동
git checkout vs-develop-v2

# 2. 최신 코드 받기
git pull gitlab vs-develop-v2

# 3. 본인 브랜치로 이동
git checkout feat/v2-본인브랜치명

# 4. 최신 코드 합치기
git merge vs-develop-v2
```

---

## 폴더 구조 및 담당 영역

### 기본 규칙

- **본인 담당 폴더에서만 작업하세요**
- `shared/` 폴더는 공용입니다 → 수정 전 팀에 공유 필수!

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

### Step 4: 머지 요청 (PR)

1. GitLab 사이트 접속
2. "Create merge request" 버튼 클릭
3. `feat/v2-본인브랜치명` → `vs-develop-v2` 선택
4. 리뷰어 지정 후 생성

---

## 주의사항

### 절대 하지 말 것

| 금지 사항 | 이유 |
|----------|------|
| `vs-prod` 브랜치에서 작업 | 운영 서버에 바로 반영됨 |
| `vs-develop` 브랜치에서 작업 | 현재 버전과 섞임 |
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
