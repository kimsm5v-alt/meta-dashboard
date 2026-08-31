/**
 * 리포트 상세 표시 규칙 — 성격(개념/활동/문항) × itemType 을 화면 표현으로 옮기는 곳.
 * 통일 카드의 4-슬롯 매핑(responseCell)과 페이지별 보기의 분기(renderMode)를 한 파일에 모아 둔다.
 */
import type { Article, ResponseData, Errata } from '../../../types';

// ============================================
// 페이지별 보기 분기
// ============================================

/**
 * 아티클 표현 방식.
 *  concept  개념 — 조회 여부만
 *  choice   보기가 있는 문항(choice/ox/tf) — 분포 바 + 학생별 카드
 *  text     글로 답한 것(essay/short/board/quiz) — 답안을 펼쳐 읽는다
 *  drawing  그리기 — 캡처 썸네일 그리드
 *  media    녹음/녹화 — 재생 + 길이
 *  plain    그 외 — 통일 카드만
 */
export type RenderMode = 'concept' | 'choice' | 'text' | 'drawing' | 'media' | 'plain';

const TEXT_TYPES = ['essay', 'short', 'board', 'quiz', 'chain'];
const CHOICE_TYPES = ['choice', 'ox', 'tf'];

export function renderMode(article: Article): RenderMode {
  if (article.nature === '개념') return 'concept';
  if (article.itemType === 'drawing') return 'drawing';
  if (article.itemType === 'audio' || article.itemType === 'video') return 'media';
  // 보기 분포는 자동채점 문항일 때만 의미가 있다 (활동 선택형은 정답이 없다)
  if (CHOICE_TYPES.includes(article.itemType) && article.nature === '문항') return 'choice';
  if (TEXT_TYPES.includes(article.itemType)) return 'text';
  if (CHOICE_TYPES.includes(article.itemType)) return 'text';
  return 'plain';
}

// ============================================
// 통일 카드 셀 매핑
// ============================================

/** 통일 카드용 셀 정보 — 성격/유형별 표시 규칙을 한 곳에 */
export interface CellInfo {
  submitted: boolean;
  /** 표시용 응답값 (개념=조회함/안 봄, 활동=응답/제출함, 문항=제출한 원본) */
  value: string;
  /** 정오 슬롯 활성 조건 — 자동채점 문항이거나 교사가 채점한 활동 */
  gradable: boolean;
  /** 제출된 채점 대상일 때만 채워짐 */
  errata?: Errata;
  correctAnswer?: string;
  /** 교사 수동 채점 대상(제출된 활동) — 아직 미채점이면 '채점 대기' */
  manual: boolean;
  /** 녹음·녹화 길이(초) */
  mediaSec?: number;
}

/**
 * (아티클, 응답) → 카드 셀.
 * @param grade 교사가 이번 세션에 매긴 수동 채점 (있으면 errata 를 덮어쓴다)
 */
export function responseCell(article: Article, resp?: ResponseData, grade?: Errata): CellInfo {
  const submitted = resp != null;
  const auto = article.nature === '문항' && article.correctAnswer != null;
  const manual = submitted && article.nature === '활동' && article.gradingType === 2;

  let value: string;
  if (article.nature === '개념') value = submitted ? '조회함' : '안 봄';
  else if (!submitted) value = '미제출';
  else value = resp!.submitAnswer || '제출함';

  const errata = auto && submitted ? resp!.errata : manual ? grade : undefined;

  return {
    submitted,
    value,
    gradable: auto || (manual && grade != null),
    errata,
    correctAnswer: article.correctAnswer,
    manual,
    mediaSec: resp?.mediaSec,
  };
}
