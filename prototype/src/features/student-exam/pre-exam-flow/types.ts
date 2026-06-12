/**
 * 검사 응시 전 플로우 타입 정의
 *
 * 1단계: 검사 안내 및 동의
 * 2단계: 기본 정보 입력
 */

import type { ExamType } from '../types';

/** 검사 응시 전 플로우 단계 */
export type PreExamStep = 'guide' | 'info';

/** 검사 종류별 테마 색상 */
export interface ExamTheme {
  /** 포인트 컬러 (뱃지, 번호, 체크아이콘) */
  pointColor: string;
  /** 액션 컬러 (버튼, 체크박스, 선택, 인풋 포커스) */
  actionColor: string;
  /** 이름 */
  name: string;
}

/** 검사 종류별 테마 정의 */
export const EXAM_THEME: Record<ExamType, ExamTheme> = {
  comp: {
    pointColor: '#9D53E1',   // 학습종합검사 - 보라
    actionColor: '#7C5CF0',
    name: '학습종합검사',
  },
  self: {
    pointColor: '#009F88',   // 자기조절학습검사 - 청록
    actionColor: '#009F88',
    name: '자기조절학습검사',
  },
};

/** 학교급 타입 */
export type SchoolLevel = 'elementary' | 'middle' | 'high' | '';

/** 학교급별 학년 범위 */
export const GRADE_OPTIONS: Record<Exclude<SchoolLevel, ''>, number[]> = {
  elementary: [1, 2, 3, 4, 5, 6],
  middle: [1, 2, 3],
  high: [1, 2, 3],
};

/** 학교급 라벨 */
export const SCHOOL_LEVEL_LABELS: Record<Exclude<SchoolLevel, ''>, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
};

/** 학생 기본 정보 (2단계 입력) */
export interface StudentBasicInfo {
  /** 출석번호 */
  studentNumber: string;
  /** 이름 */
  name: string;
  /** 성별 */
  gender: 'M' | 'F' | '';
}

/** 그룹 정보 */
export interface GroupInfo {
  /** 학교명 (항상 제공됨) */
  schoolName: string;
  /** 학교급 (비어있을 수 있음) */
  schoolLevel?: SchoolLevel;
  /** 학년 (비어있을 수 있음) */
  grade?: string;
  /** 반 (비어있을 수 있음) */
  classNumber?: string;
}

/** 그룹 정보 잠금 상태 (서버에서 제공된 항목인지 여부) */
export interface GroupInfoLocked {
  /** 학교급 잠금 여부 */
  schoolLevel: boolean;
  /** 학년 잠금 여부 */
  grade: boolean;
  /** 반 잠금 여부 */
  classNumber: boolean;
}

/** 동의 항목 */
export interface ConsentItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
}

/** 개인정보 동의 상태 */
export interface ConsentState {
  /** 개인정보 수집 및 이용 동의 */
  privacy: boolean;
  /** 민감정보 수집 및 이용 동의 */
  sensitive: boolean;
  /** 법정대리인 동의서 제출 확인 */
  guardian: boolean;
}

/** 검사 응시 전 플로우 Props */
export interface PreExamFlowProps {
  /** 검사 종류 */
  examType: ExamType;
  /** 검사 회차 */
  round: number;
  /** 검사명 */
  examName: string;
  /** 그룹 정보 */
  groupInfo: GroupInfo;
  /** 검사 시작 핸들러 */
  onStartExam: (studentInfo: StudentBasicInfo) => void;
  /** 검사 목록으로 돌아가기 */
  onBack: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
}
