/**
 * 학생용 검사 목록 서비스
 * exam/api/examService의 fetchStudentExamList를 재사용하여 UI 타입으로 변환
 */

import { fetchStudentExamList } from '@features/exam/api/examService';
import type { StudentExamItem } from '@features/exam/types';
import type { StudentExamListItem, ExamStatus } from '../types';
import { mapExamStatus } from '../types';
import { withRecommendedMonth } from '../utils/deriveExamMeta';

const TOTAL_QUESTIONS = 124;

function mapToListItem(item: StudentExamItem, ordNo: number): StudentExamListItem {
  const status = mapExamStatus(item.dgnssAt, item.submAt, item.eakAt);
  const isFinished = status === 'completed' || status === 'result_ready';

  // 검사지 종류에 따라 검사명 생성 (응시 플로우 색상 구분 및 카드 표시에 사용)
  const paperLabel = item.paperIdx === '2' ? '자기조절학습검사' : '학습종합검사';

  return {
    dgnssId: item.dgnssId,
    dgnssResultId: item.dgnssResultId,
    ordNo,
    paperIdx: item.paperIdx,
    name: `${ordNo}차 ${paperLabel}`,
    status,
    progress: isFinished ? 100 : 0,
    answeredCount: isFinished ? TOTAL_QUESTIONS : 0,
    totalQuestions: TOTAL_QUESTIONS,
    submittedAt: item.submDt,
    hasResult: status === 'result_ready',
    recommendedMonth: '',
  };
}

/** 학생/게스트 검사 목록 조회 — 권장월 파생까지 적용해서 반환.
 * 잠금(locked) 파생은 여러 반 결과를 합친 뒤에도 반별 범위를 구분해야 하므로
 * MyExamListPage.tsx의 loadExams에서 그룹 매핑과 함께 적용한다. */
export async function getStudentExamList(
  claId: string,
  stdtId: string,
): Promise<StudentExamListItem[]> {
  const items = await fetchStudentExamList(claId, stdtId);
  const mapped = items.map((item) => mapToListItem(item, item.ordNo));
  return withRecommendedMonth(mapped);
}

/** 검사 상태 라벨 */
export function getStatusLabel(status: ExamStatus): string {
  switch (status) {
    case 'waiting':
      return '대기중';
    case 'in_progress':
      return '진행중';
    case 'completed':
      return '결과 대기중';
    case 'result_ready':
      return '결과 확인 가능';
    case 'not_submitted':
      return '미응시';
    case 'locked':
      return '잠금';
    default:
      return '알 수 없음';
  }
}

/** 검사 상태 색상 (Emotion에서 사용할 색상값 직접 반환) */
export function getStatusColor(status: ExamStatus): {
  bg: string;
  text: string;
} {
  switch (status) {
    case 'waiting':
      return { bg: '#eff6ff', text: '#2563eb' };
    case 'in_progress':
      return { bg: '#fffbeb', text: '#d97706' };
    case 'completed':
      return { bg: '#eef2ff', text: '#4f46e5' };
    case 'result_ready':
      return { bg: '#f0fdf4', text: '#16a34a' };
    case 'not_submitted':
      return { bg: '#fef2f2', text: '#dc2626' };
    case 'locked':
      return { bg: '#f3f4f6', text: '#9ca3af' };
    default:
      return { bg: '#f3f4f6', text: '#4b5563' };
  }
}

/** 상태별 안내 문구 — 프로토타입 EXAM_STATUS_MESSAGE와 동일 문구 사용 */
export function getStatusMessage(status: ExamStatus): string | null {
  switch (status) {
    case 'completed':
      return '선생님이 검사를 종료하면 결과를 확인할 수 있어요';
    case 'not_submitted':
      return '응시 기간이 종료되어 미응시 처리되었어요';
    case 'locked':
      return '1차를 제출하면 응시할 수 있어요';
    default:
      return null;
  }
}

/** 학생 결과 조회 (Mock) */
export async function fetchStudentResult(
  _stdtId: string,
  _round: string,
): Promise<{ tScores: number[]; reliabilityWarnings: string[] }> {
  // Mock 데이터 반환 (랜덤 T점수 38개)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        tScores: Array(38)
          .fill(0)
          .map(() => Math.random() * 30 + 35), // 35~65 범위 랜덤
        reliabilityWarnings: [],
      });
    }, 500); // 0.5초 지연으로 로딩 상태 테스트
  });
}
