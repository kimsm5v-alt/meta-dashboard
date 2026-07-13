# META 대시보드 문서 가이드

> 최종 수정일: 2026-03-12

---

## 폴더 구조

```
docs/
├── meta-test/          # 검사 도메인 지식 (검사 구조, 점수, LPA, 문항 등)
├── spec/               # 백엔드 전달용 명세서
├── design/             # 기획/설계 문서
└── guide/              # 개발 가이드
```

---

## meta-test/ — 검사 도메인

| 파일 | 내용 |
|------|------|
| [01_검사개요.md](./meta-test/01_검사개요.md) | 검사 소개, 이론적 배경 (JD-R 모형) |
| [02_검사구조.md](./meta-test/02_검사구조.md) | 5개 영역, 11개 중분류, 38개 변인 구조 |
| [03_점수체계.md](./meta-test/03_점수체계.md) | T점수, 백분위, 등급 기준, 계산식 |
| [04_문항정보.md](./meta-test/04_문항정보.md) | 124문항 구성, 응답 척도, 변인별 문항 매핑 |
| [05_결과해석.md](./meta-test/05_결과해석.md) | 등급별 해석 스크립트, 코칭 방향 |
| [06_LPA유형분류.md](./meta-test/06_LPA유형분류.md) | 3가지 유형, 분류 알고리즘, 구현 코드 |
| [07_신뢰도지표.md](./meta-test/07_신뢰도지표.md) | 사회적바람직성, 반응일관성, 연속동일반응 |
| [08_API데이터모델.md](./meta-test/08_API데이터모델.md) | TypeScript 인터페이스, API 설계, DB 스키마 |
| [09_생활기록부_기재정책.md](./meta-test/09_생활기록부_기재정책.md) | 생활기록부 기재 정책 |
| [10_지식그래프.json](./meta-test/10_지식그래프.json) | 개입 전략 지식 그래프 데이터 |
| [11_코칭경로_랭킹알고리즘.md](./meta-test/11_코칭경로_랭킹알고리즘.md) | 코칭 경로 랭킹 알고리즘 |
| [12_L3_코칭전략_설명서.md](./meta-test/12_L3_코칭전략_설명서.md) | L3 학생 대시보드 코칭 전략 설명 |
| [lpa_classifier.js](./meta-test/lpa_classifier.js) | LPA 분류 알고리즘 참조 구현 |
| [lpa_profile_data.json](./meta-test/lpa_profile_data.json) | LPA 프로파일 데이터 (38개 변인 평균) |

---

## spec/ — 백엔드 전달용 명세서

| 파일 | 내용 |
|------|------|
| [01-service-definition-ia.md](./spec/01-service-definition-ia.md) | 서비스 정의, 도메인 지식, IA |
| [02-user-flow-data-flow.md](./spec/02-user-flow-data-flow.md) | 사용자 플로우, 데이터 흐름 |
| [03-screen-spec.md](./spec/03-screen-spec.md) | 화면별 상세 명세 (20개 화면) |
| [04-data-structure-api.md](./spec/04-data-structure-api.md) | DB 테이블 설계, 신규 API 정의 |

---

## design/ — 기획/설계

| 파일 | 내용 |
|------|------|
| [PRD.md](./design/PRD.md) | 제품 요구사항 정의서 |
| [IA.md](./design/IA.md) | 정보 구조 (Information Architecture) |
| [dashboard-design.md](./design/dashboard-design.md) | 대시보드 UI 설계 |

---

## guide/ — 개발 가이드

| 파일 | 내용 |
|------|------|
| [backend-api-guide.md](./guide/backend-api-guide.md) | 백엔드 API 개발 가이드 |
| [api-endpoints.md](./guide/api-endpoints.md) | API 엔드포인트 목록 |
