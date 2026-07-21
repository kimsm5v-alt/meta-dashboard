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

/** 세트지(나의 자료) 상태 */
export type MyStatus = '임시저장' | '배포됨' | '완료';

/** 배포 수업(리포트) 상태 */
export type ReportStatus = '진행예정' | '진행중' | '완료';

/** 배포 진행 방식 */
export type DeployType = '실시간' | '과제';

/** 슬라이드 종류: 활동형(개방·정답없음) / 문항형(정답있음) */
export type SlideKind = '활동형' | '문항형';

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

/** 나의 자료 = 세트지 */
export interface MyLesson {
  id: string;
  title: string;
  status: MyStatus;
  cls: string | null; // 배포 대상 반 (미배포는 null)
  updated: string; // 'MM/DD'
  g: ColorGroup;
  em: string;
  type: DeployType | null;
}

/** 배포된 수업(리포트) 메타 */
export interface Report {
  id: string;
  title: string;
  cls: string;
  rstatus: ReportStatus;
  total: number; // 반 전체 인원
  g: ColorGroup;
  em: string;
  start: string; // 'MM/DD'
  end: string;
}

// ============================================
// 리포트 상세 — 슬라이드 정의
// ============================================

/** 활동형 슬라이드(개방형, 정답 없음) */
export interface OpenSlide {
  t: string;
  k: '활동형';
  pool: string[]; // 응답 표본 풀
}

/** 문항형 슬라이드(정답 있음) */
export interface GradedSlide {
  t: string;
  k: '문항형';
  options: string[];
  correct: number; // 정답 인덱스
}

export type Slide = OpenSlide | GradedSlide;

/** 한 학생의 특정 슬라이드 응답(결정적 mock) */
export interface SlideResponse {
  submitted: boolean;
  value: string | null;
  correct: boolean | null; // 문항형만 유의미
  timeSec: number;
}

/** 한 학생의 리포트 종합 통계 */
export interface StudentStats {
  resps: SlideResponse[];
  answered: number;
  total: number;
  gradedTotal: number;
  correctN: number;
  timeSec: number;
  joined: boolean;
}

/** 문항형 슬라이드 선택지 분포 */
export interface SlideDist {
  counts: number[];
  answered: number;
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
