/**
 * 수업 자료실(resources) 도메인 타입
 * 목업 everyclass-v2 1.html 의 데이터 모델을 TS 로 이식.
 */

// ============================================
// 공통 유니온 · 메타
// ============================================

/** 콘텐츠 출처 구분 */
export type Src = '검증' | '비검증' | '외부' | '내부';

/** SEL(사회정서학습) 5대 영역 */
export type SelArea =
  | '자기인식'
  | '자기관리'
  | '사회적인식'
  | '관계기술'
  | '책임있는의사결정';

/** 배포 수업(리포트) 상태 */
export type ReportStatus = '진행예정' | '진행중' | '완료';

/** 색상 그룹 키 (썸네일 배경) — 목업 g1~g6 */
export type ColorGroup = 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6';

/** LNB 스코프: '전체' 또는 반 이름(예: '2-3반') */
export type Scope = string;

// ============================================
// 공유 자료실 콘텐츠
// ============================================

/**
 * 공유 자료실 / 추천 / 로드맵 카드 공통 아이템.
 * LIB 는 provider·level·grade·duration·factors 가 back-fill 되고,
 * 추천/로드맵 카드는 reason 을 가진다.
 */
export interface LibItem {
  id: string;
  title: string;
  src: Src;
  sel: string; // SelArea 또는 로드맵의 '1MONTH' 같은 라벨
  g: ColorGroup;
  em: string; // 이모지 썸네일
  views?: number;
  saves?: number;
  reason?: string; // 추천 근거(강점/검사요인/로드맵)
  // LIB back-fill 메타 (taxonomy 필터용)
  provider?: string;
  level?: string[];
  grade?: string[];
  duration?: string;
  factors?: string[];
}

/** 성장 로드맵 단계 */
export interface RoadmapStage {
  stage: string; // '1단계'
  tier: string; // '펀더멘털 Ⅰ'
  title: string;
  months: string;
  tone: 'green' | 'blue' | 'pink';
  items: LibItem[];
}

// ============================================
// 나의 자료 (세트지) · 배포 수업 (리포트)
// ============================================

/**
 * 나의 자료 = 세트지 (모두 배포 전 초안).
 * 배포된 활동은 '수업 결과보기'의 Report 로 넘어가므로 여기엔 상태/대상반 필드가 없다.
 */
export interface MyLesson {
  id: string;
  title: string;
  updated: string; // 'MM/DD'
  g: ColorGroup;
  em: string;
}

/** 배포된 수업(리포트) 메타 */
export interface Report {
  id: string;
  title: string;
  cls: string;
  rstatus: ReportStatus;
  total: number; // 반 전체 인원 (상세 미연결 리포트의 fallback 배정 인원)
  g: ColorGroup;
  em: string;
  start: string; // 'MM/DD'
  end: string;
  // === 리포트 상세 (REPORT_SPEC_v2) — 참여 리포트만 연결, 진행예정은 미연결 ===
  activityMode?: '수업' | '과제'; // 실시간 수업 / 비실시간 과제
  selFactors?: string[]; // 세트지에 포함된 SEL 역량요인
  articles?: Article[]; // 페이지(아티클) 정의
  students?: StudentActivity[]; // 학생 × 세트지 활동
  responses?: ResponseData[]; // 학생 × 아티클 응답
}

// ============================================
// 실제 리포트 데이터 모델 (REPORT_SPEC_v2 / 엑셀 학습데이터_260728)
// ============================================

/** 콘텐츠 성격 */
export type Nature = '개념' | '활동' | '문항';

/** 정오 코드: 1=정답, 2=오답, 3=부분정답, 4=채점불가 */
export type Errata = 1 | 2 | 3 | 4;

/** 채점 방식: 1=자동, 2=참여(교사 수동), 3=측정 */
export type GradingType = 1 | 2 | 3;

/** 학생 활동 상태: 2=대기, 3=제출, 4=진행중, 5=완료 */
export type StatusCd = 2 | 3 | 4 | 5;

/**
 * 아티클(페이지) 정의.
 * itemType(열린 집합, 엑셀 시트2): choice·ox·tf·short·essay·drawing·audio·video·board·chain·quiz·sequence·matching·'-'.
 */
export interface Article {
  id: string;
  order: number; // 페이지 번호
  nature: Nature; // 개념 / 활동 / 문항
  itemType: string;
  title: string;
  correctAnswer?: string; // 문항(정답 있는 유형)만
  selFactor?: string; // SEL 역량요인
  gradingType: GradingType;
}

/** 응답 데이터 (학생 × 아티클) */
export interface ResponseData {
  articleId: string;
  studentId: string;
  submitAnswer: string; // 유형별 값 상이 (보기번호 / O·X / 텍스트 / 파일참조 등)
  errata: Errata;
  itemType: string;
  gradingType: GradingType;
  captureImage?: string; // 뷰어 캡처 (저장 방식 미확정 → placeholder)
}

/** 세트지 데이터 (학생 × 세트지) */
export interface StudentActivity {
  studentId: string;
  studentName: string;
  statusCd: StatusCd;
  period: { start: string; end: string };
  score?: number; // 100점 환산
  submittedAt?: string; // 제출 시각
  duration?: number; // 소요 시간(초)
}

/** 수업 데이터 (수업 참여 학생 × 세트지) 집계 요약 */
export interface ClassReportSummary {
  activityMode: '수업' | '과제';
  participantCount: number; // 하나라도 제출한 학생 수 (statusCd ∈ {3,4,5})
  assignedCount: number; // 배정 전체
  submitRate: number; // 참여/배정 × 100
  avgCorrectRate: number; // 정답 있는 문항만 평균
  unsubmittedCount: number; // statusCd=2
  avgDuration?: number; // 평균 활동 시간(초)
}

/** 한 학생의 리포트 요약 (학생별 보기 · 학생 리포트용) */
export interface StudentSummary {
  submittedArticles: number; // 제출한 아티클 수
  totalArticles: number; // 전체 아티클 수
  correctN: number; // 정답 수 (문항)
  gradedN: number; // 채점 가능 문항 수
  duration: number; // 소요 시간(초)
  submittedAt?: string;
  statusCd: StatusCd;
}

// ============================================
// 저작툴 콘텐츠 담기
// ============================================

/** 콘텐츠/템플릿 담기 항목 */
export interface ContentPickItem {
  id: string;
  t: string;
  d: string;
  ic: string;
  bg: string;
}
