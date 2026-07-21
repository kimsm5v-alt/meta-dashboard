/**
 * 결과보기 > 학생 - 학생 결과 화면 (통합 버전)
 *
 * 기존 결과보기 + 학생 상담 기능 통합
 *
 * 구성:
 * 1. 헤더 (번호, 이름, 응시일) - 유형 배지 제거
 * 2. AI 분석 총평
 * 3. 회차 선택 탭
 * 4. 개인 학습 현황 (설문 응답 기반)
 * 5. 38개 요인 분석
 * 6. 강점/보완점 Top 3
 * 7. 학습 유형 분류 (LPA)
 * 8. 상담 기록 / 상담 이력
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md - 화면 5번
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Sparkles, Check, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import { useLayoutContext } from '@/app/LayoutV2';
import { StudentFactorAnalysis } from './StudentFactorAnalysis';
import { TypeClassification } from './TypeClassification';
import type { StudentExamResult } from '../types';
import { StudentHeader } from '@/shared/components';
import type { StudentType } from '@/shared/types';
import { CounselingMemoEditor, ObservationMemoEditor, UnifiedHistoryList } from '@/features/schedule/components';
import type { CounselingMemoData } from '@/features/schedule/components/CounselingMemoEditor';
import type { ObservationMemoData } from '@/features/schedule/components/ObservationMemoEditor';
import type { CounselingRecord, ObservationRecord } from '@/features/schedule/types';

type ViewMode = 'round1' | 'round2' | 'compare';

interface StudentResultViewProps {
  /** 학생 결과 데이터 */
  result: StudentExamResult;
  /** 반 이름 */
  className: string;
  /** 뒤로가기 핸들러 */
  onBack: () => void;
  /** 이전/다음 학생 */
  prevStudent?: { id: string; name: string };
  nextStudent?: { id: string; name: string };
  /** 학생 이동 핸들러 */
  onNavigateStudent?: (studentId: string) => void;
}

// ============================================================
// Mock 데이터 (실제 구현 시 API에서 가져옴)
// ============================================================

/** AI 총평 Mock - 유형별 분석 내용 */
const MOCK_AI_SUMMARIES: Record<StudentType, { summary: string; keywords: string[] }> = {
  // 중등 유형
  '냉소적 무기력형': {
    summary: '이 학생은 전반적으로 심리·정서적 에너지가 고갈된 상태입니다. 자아효능감과 자아존중감이 낮아 내적 동기가 부족하며, 스트레스 수준이 높고 정서 조절에 어려움을 겪고 있습니다. 부모나 교사의 기대에 대한 부담감이 높고, 학습 전략 활용이 미흡하여 학업 성취에도 영향을 받고 있으므로, 정서적 지지와 함께 작은 성공 경험을 쌓을 수 있도록 단계적 목표 설정이 필요합니다.',
    keywords: ['정서적 지지', '작은 성공 경험', '부담 완화', '자아효능감'],
  },
  '정서조절 취약형': {
    summary: '이 학생은 학습 자원은 일정 수준 갖추고 있으나, 성적 압박과 소진을 크게 느끼는 상태입니다. 학습 전략은 활용하고 있지만 감정 조절과 스트레스 관리에 어려움을 겪고 있습니다. 학습 방법 지도와 함께 정서적 안정을 위한 지원이 필요하며, 무리한 목표보다 달성 가능한 단계적 목표 설정을 권장합니다.',
    keywords: ['정서 안정', '스트레스 관리', '단계적 목표', '학습 전략'],
  },
  '자기주도 몰입형': {
    summary: '이 학생은 심리·정서적 자원이 풍부하고 학습에 대한 몰입도가 높습니다. 높은 자아효능감과 자율성을 바탕으로 주도적인 학습을 하며, 내재적 동기가 강합니다. 스트레스 상황에서도 안정적으로 대처하고, 다양한 학습 전략을 효과적으로 활용합니다. 도전적인 과제를 통해 더 큰 성장을 이끌어낼 수 있으며, 리더십 역할을 맡기면 좋습니다.',
    keywords: ['강점 활용', '도전 과제', '리더십', '심화 학습'],
  },
  // 초등 유형
  '자원소진형': {
    summary: '이 학생은 학습에 필요한 심리·정서적 자원이 상대적으로 낮고, 기대나 부담은 크게 느끼는 상태입니다. 먼저 부담을 낮추고 작은 성공 경험을 통해 학습 회복감을 키워주는 것이 필요합니다.',
    keywords: ['부담 완화', '회복감', '작은 성공', '정서적 지지'],
  },
  '안전 균형형': {
    summary: '이 학생은 전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다. 계획·점검 습관을 함께 길러주세요.',
    keywords: ['자기 점검', '계획 습관', '균형 유지', '메타인지'],
  },
  '몰입자원 풍부형': {
    summary: '이 학생은 긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 강점을 유지하면서 도전 목표와 깊이 있는 학습 경험으로 확장해주세요.',
    keywords: ['강점 유지', '도전 목표', '심화 학습', '몰입'],
  },
};

/**
 * 개인 학습 현황 Mock
 *
 * 실제 설문 문항:
 * 1. 내 학업 성적은 어느 정도인지 체크해 주세요. (매우 낮음/낮음/보통/높음/매우 높음)
 * 2. 나의 성적에 어느 정도 만족하는지 체크해 주세요. (매우 낮음/낮음/보통/높음/매우 높음)
 * 3. 다음 중 내가 공부하는 가장 중요한 이유 1가지를 체크해 주세요.
 * 4. 학교 다닐 때, 혼자 공부하는 시간(온라인 학습 제외)이 하루 평균 어느 정도인지 체크해 보세요.
 * 5. 공부와 관련된 고민이 있을 때, 가장 많이 상담하는 사람 1명을 체크해 주세요.
 */
interface LearningStatus {
  /** 학업 성적 (매우 낮음~매우 높음) */
  academicAchievement: 'very-low' | 'low' | 'mid' | 'high' | 'very-high';
  /** 성적 만족도 (매우 낮음~매우 높음) */
  gradeSatisfaction: 'very-low' | 'low' | 'mid' | 'high' | 'very-high';
  /** 공부하는 가장 중요한 이유 */
  learningMotivation: 'interest' | 'future' | 'college' | 'expectation' | 'unknown';
  /** 혼자 공부하는 시간 (하루 평균) */
  selfStudyTime: 'none' | 'under1h' | '1-2h' | '2-3h' | 'over3h';
  /** 공부 고민 상담 대상 */
  learningCounselor: 'friend' | 'teacher' | 'family' | 'counselor' | 'other';
}

const LEARNING_STATUS_LABELS = {
  academicAchievement: {
    'very-low': '매우 낮음',
    low: '낮음',
    mid: '보통',
    high: '높음',
    'very-high': '매우 높음',
  },
  gradeSatisfaction: {
    'very-low': '매우 낮음',
    low: '낮음',
    mid: '보통',
    high: '높음',
    'very-high': '매우 높음',
  },
  learningMotivation: {
    interest: '공부에 흥미를 느껴서',
    future: '나의 미래를 위해서',
    college: '대학을 가기 위해서',
    expectation: '주변 사람들의 기대 때문에',
    unknown: '솔직히 왜 하는지 모르겠다',
  },
  selfStudyTime: {
    none: '전혀 안함',
    under1h: '1시간 미만',
    '1-2h': '1시간~2시간 미만',
    '2-3h': '2시간~3시간 미만',
    over3h: '3시간 이상',
  },
  learningCounselor: {
    friend: '친구',
    teacher: '선생님',
    family: '가족',
    counselor: '상담 전문가',
    other: '기타',
  },
};

/** Mock 학습 현황 생성 */
const generateMockLearningStatus = (type: StudentType): LearningStatus => {
  // 자기주도/몰입형 (초등: 몰입자원 풍부형, 중등: 자기주도 몰입형)
  const isSelfDirected = type === '자기주도 몰입형' || type === '몰입자원 풍부형';
  // 소진/무기력형 (초등: 자원소진형, 중등: 냉소적 무기력형)
  const isStruggling = type === '냉소적 무기력형' || type === '자원소진형';

  return {
    academicAchievement: isSelfDirected ? 'high' : isStruggling ? 'low' : 'mid',
    gradeSatisfaction: isSelfDirected ? 'high' : isStruggling ? 'low' : 'mid',
    learningMotivation: isSelfDirected ? 'interest' : isStruggling ? 'unknown' : 'future',
    selfStudyTime: isSelfDirected ? '2-3h' : isStruggling ? 'under1h' : '1-2h',
    learningCounselor: isStruggling ? 'other' : 'family',
  };
};

/** Mock 상담 기록 생성 (학생별) */
const generateMockCounselingRecords = (studentId: string, studentName: string, classId: string, className: string): CounselingRecord[] => {
  const studentNum = parseInt(studentId.replace(/\D/g, ''), 10) || 1;

  // 학생별로 다른 상담 기록 세트
  const recordSets: CounselingRecord[][] = [
    // 세트 1: 학업 중심
    [
      {
        id: `cr-${studentId}-1`,
        studentId, studentName, studentNumber: studentNum, classId, className,
        scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        duration: 30, type: 'regular', area: 'academic', status: 'completed',
        reason: '중간고사 대비 학습 전략 상담',
        summary: '시험 범위 정리 방법과 오답노트 활용법에 대해 안내함. 수학, 영어 과목 집중 공략 계획 수립.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: `cr-${studentId}-2`,
        studentId, studentName, studentNumber: studentNum, classId, className,
        scheduledAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        duration: 25, type: 'follow-up', area: 'academic', status: 'completed',
        reason: '학습 계획 실천 점검',
        summary: '지난 상담 후 학습 계획 이행 상태 확인. 자기주도 학습 시간이 30분 증가함. 지속적인 격려 필요.',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    ],
    // 세트 2: 정서/교우관계
    [
      {
        id: `cr-${studentId}-1`,
        studentId, studentName, studentNumber: studentNum, classId, className,
        scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        duration: 40, type: 'urgent', area: 'peer', status: 'completed',
        reason: '또래 갈등 중재',
        summary: '같은 반 친구와의 오해로 인한 갈등 상황. 서로의 입장 경청 후 화해 유도. 추후 관계 회복 모니터링 필요.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: `cr-${studentId}-2`,
        studentId, studentName, studentNumber: studentNum, classId, className,
        scheduledAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        duration: 35, type: 'regular', area: 'emotion', status: 'completed',
        reason: '스트레스 관리 상담',
        summary: '시험 스트레스로 인한 불안감 호소. 호흡법, 이완 기법 안내. 부정적 생각 전환 연습 권유.',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        id: `cr-${studentId}-3`,
        studentId, studentName, studentNumber: studentNum, classId, className,
        scheduledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        duration: 30, type: 'initial', area: 'emotion', status: 'completed',
        reason: '학기 초 정서 점검',
        summary: '새 학기 적응 상태 양호. 학급 내 친구 2~3명과 잘 어울리는 모습. 전반적으로 밝은 태도.',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ],
    // 세트 3: 진로/가정
    [
      {
        id: `cr-${studentId}-1`,
        studentId, studentName, studentNumber: studentNum, classId, className,
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        duration: 45, type: 'regular', area: 'career', status: 'completed',
        reason: '진로 탐색 상담',
        summary: '관심 분야(IT/프로그래밍)에 대해 대화. 관련 동아리 활동 및 온라인 강좌 추천. 커리어넷 검사 안내.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: `cr-${studentId}-2`,
        studentId, studentName, studentNumber: studentNum, classId, className,
        scheduledAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        duration: 30, type: 'regular', area: 'family', status: 'completed',
        reason: '가정 내 학습 환경',
        summary: '동생과 방 공유로 집중이 어렵다고 함. 도서관/자습실 활용 권유. 가정에 학습 공간 확보 요청 예정.',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
    ],
    // 세트 4: 행동/건강
    [
      {
        id: `cr-${studentId}-1`,
        studentId, studentName, studentNumber: studentNum, classId, className,
        scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        duration: 20, type: 'urgent', area: 'behavior', status: 'completed',
        reason: '수업 중 휴대폰 사용',
        summary: '수업 집중도 저하 원인 파악. 게임 과몰입 경향 확인. 자기 조절 목표 설정 및 스스로 폰 보관 약속.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: `cr-${studentId}-2`,
        studentId, studentName, studentNumber: studentNum, classId, className,
        scheduledAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        duration: 25, type: 'regular', area: 'health', status: 'completed',
        reason: '수면 습관 상담',
        summary: '야간 게임으로 수면 부족 호소. 평균 취침 시간 새벽 1시. 수면 일기 작성 및 취침 시간 조절 목표 합의.',
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      },
    ],
    // 세트 5: 없음
    [],
  ];

  return recordSets[studentNum % recordSets.length];
};

/** Mock 관찰 기록 생성 (학생별) */
const generateMockObservationRecords = (studentId: string, studentName: string, classId: string, className: string): ObservationRecord[] => {
  const studentNum = parseInt(studentId.replace(/\D/g, ''), 10) || 1;

  // 학생별로 다른 관찰 기록 세트
  const recordSets: ObservationRecord[][] = [
    // 세트 1: 수업 태도 관찰
    [
      {
        id: `or-${studentId}-1`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'behavior',
        title: '수업 중 발표 태도',
        content: '수업 중 적극적으로 손을 들어 발표함. 질문에도 자신감 있게 대답하는 모습이 인상적.',
        observedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: `or-${studentId}-2`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'academic',
        title: '모둠 활동 참여',
        content: '모둠 활동에서 리더 역할을 자연스럽게 수행. 팀원들의 의견을 잘 조율함.',
        observedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
    ],
    // 세트 2: 또래관계 관찰
    [
      {
        id: `or-${studentId}-1`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'social',
        title: '점심시간 교우관계',
        content: '점심시간에 여러 친구들과 어울리며 대화하는 모습 관찰. 사교성이 좋은 편.',
        observedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: `or-${studentId}-2`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'social',
        title: '전학생 배려',
        content: '전학 온 학생에게 먼저 다가가 말을 건네는 모습. 배려심이 돋보임.',
        observedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      },
      {
        id: `or-${studentId}-3`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'emotion',
        title: '체육 시간 감정 조절',
        content: '체육 시간에 경기에서 지고 나서 잠시 속상해하다가 금방 털어내는 모습. 감정 조절 양호.',
        observedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      },
    ],
    // 세트 3: 학습 태도 관찰
    [
      {
        id: `or-${studentId}-1`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'academic',
        title: '자습 시간 관리',
        content: '자습 시간에 계획표대로 공부하는 모습 확인. 시간 관리 능력이 향상되고 있음.',
        observedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: `or-${studentId}-2`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'behavior',
        title: '자발적 정리 정돈',
        content: '수업 종료 후 교탁 정리를 자발적으로 도움. 책임감 있는 행동.',
        observedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      },
    ],
    // 세트 4: 정서/행동 관찰
    [
      {
        id: `or-${studentId}-1`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'emotion',
        title: '등교 시 컨디션',
        content: '아침 등교 시 표정이 어두움. 컨디션이 좋지 않아 보여 개별 확인 필요.',
        observedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: `or-${studentId}-2`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'behavior',
        title: '수업 집중도 저하',
        content: '수업 중 자주 창밖을 바라보며 멍한 모습. 집중도 저하 원인 파악 필요.',
        observedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        id: `or-${studentId}-3`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'social',
        title: '쉬는 시간 혼자 보냄',
        content: '쉬는 시간에 혼자 책을 읽으며 시간을 보냄. 또래와의 교류가 적은 편.',
        observedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      },
      {
        id: `or-${studentId}-4`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'other',
        title: '급식 식사량 변화',
        content: '급식 시 식사량이 적음. 평소와 다른 모습이라 건강 상태 확인 권장.',
        observedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    ],
    // 세트 5: 긍정적 변화
    [
      {
        id: `or-${studentId}-1`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'academic',
        title: '수업 참여도 향상',
        content: '지난달 대비 수업 참여도가 눈에 띄게 향상됨. 발표 횟수 증가.',
        observedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: `or-${studentId}-2`, studentId, studentName, studentNumber: studentNum, classId, className,
        category: 'emotion',
        title: '학교생활 적응',
        content: '친구들과 웃으며 대화하는 모습이 자주 보임. 학교생활에 적응한 듯.',
        observedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ],
    // 세트 6: 없음
    [],
  ];

  return recordSets[studentNum % recordSets.length];
};

/**
 * 38개 Depth 3 요인 정보 (소분류)
 * @see prototype/docs/meta-test/13_학습요인_정의.md
 *
 * 구조: 대분류(Depth1) > 중분류(Depth2) > 소분류(Depth3)
 * - 자아강점: 긍정적 자아, 대인관계능력
 * - 학습디딤돌: 메타인지, 학습기술, 지지적관계
 * - 학습걸림돌: 학업스트레스, 학습방해물, 학업관계스트레스
 * - 긍정적공부마음: 학업열의, 성장력
 * - 부정적공부마음: 학업소진
 */
const FACTOR_INFO = [
  // 자아강점 > 긍정적 자아 (3개)
  { id: 1, name: '자아존중감', category: '자아강점', positive: true, definition: '자신의 능력과 가치에 대한 전반적인 평가와 태도' },
  { id: 2, name: '자기효능감', category: '자아강점', positive: true, definition: '자신이 어떤 일을 성공적으로 수행할 수 있는 능력이 있다고 믿는 기대와 신념' },
  { id: 3, name: '성장마인드셋', category: '자아강점', positive: true, definition: '지능이나 능력이 노력을 통해 변화하고 성장할 수 있다고 생각하는 정도' },
  // 자아강점 > 대인관계능력 (4개)
  { id: 4, name: '자기정서인식', category: '자아강점', positive: true, definition: '나의 정서적 상태를 알아차릴 수 있는 정도' },
  { id: 5, name: '자기정서조절', category: '자아강점', positive: true, definition: '자신의 감정을 상황에 맞게 조절하고 대처할 수 있는 정도' },
  { id: 6, name: '타인정서인식', category: '자아강점', positive: true, definition: '상대방의 기분이나 처한 상황에서 느끼는 감정을 이해할 수 있는 정도' },
  { id: 7, name: '타인공감능력', category: '자아강점', positive: true, definition: '상대방의 감정, 의견, 주장 등에 대하여 자신도 동일하게 느끼는 정도' },
  // 학습디딤돌 > 메타인지 (3개)
  { id: 8, name: '계획능력', category: '학습디딤돌', positive: true, definition: '공부 목표를 세우고, 목표에 따라 순차적으로 학습을 계획하는 능력' },
  { id: 9, name: '점검능력', category: '학습디딤돌', positive: true, definition: '공부 목표 달성 정도와 공부 방법이 적절했는지를 전반적으로 파악할 수 있는 능력' },
  { id: 10, name: '조절능력', category: '학습디딤돌', positive: true, definition: '공부 과정 중에 나타난 문제를 반복하지 않도록 더 나은 공부방법을 찾아 조정하는 능력' },
  // 학습디딤돌 > 학습기술 (5개)
  { id: 11, name: '공부환경', category: '학습디딤돌', positive: true, definition: '학습에 최적화된 공부환경이 될 수 있도록 정리, 정돈하는 습관' },
  { id: 12, name: '시간관리', category: '학습디딤돌', positive: true, definition: '규칙적으로 공부할 수 있는 시간을 계획하고, 관리하는 습관' },
  { id: 13, name: '수업태도', category: '학습디딤돌', positive: true, definition: '수업에 집중하여 선생님 말씀을 경청하고, 수업에 필요한 물품을 사전에 준비하는 습관' },
  { id: 14, name: '노트하기', category: '학습디딤돌', positive: true, definition: '학습한 핵심 내용을 정리하여 기록하고, 기억하기 위해 활용하는 공부습관' },
  { id: 15, name: '시험준비', category: '학습디딤돌', positive: true, definition: '수업에 집중하여 선생님 말씀을 경청하고, 수업에 필요한 물품을 사전에 준비하는 습관' },
  // 학습디딤돌 > 지지적관계 (4개)
  { id: 16, name: '부모 의사소통', category: '학습디딤돌', positive: true, definition: '부모님과 자신의 생활과 생각에 대해 편안하게 대화하는 정도' },
  { id: 17, name: '부모 학업지지', category: '학습디딤돌', positive: true, definition: '부모님이 공부와 관련하여 자신의 의견과 노력을 지지한다고 생각하는 정도' },
  { id: 18, name: '친구 정서지지', category: '학습디딤돌', positive: true, definition: '친구들이 자신의 의견과 고민을 잘 이해하고, 들어준다고 생각하는 정도' },
  { id: 19, name: '교사 정서지지', category: '학습디딤돌', positive: true, definition: '교사가 자신의 의견과 고민을 잘 이해하며, 격려한다고 생각하는 정도' },
  // 학습걸림돌 > 학업스트레스 (3개)
  { id: 20, name: '성적부담', category: '학습걸림돌', positive: false, definition: '기대와 목표에 비해 성적이 낮게 나올 수 있다는 부담을 느끼는 정도' },
  { id: 21, name: '공부부담', category: '학습걸림돌', positive: false, definition: '공부의 필요성과 공부 방법을 알지 못하거나, 공부 양이 많아 부담을 느끼는 정도' },
  { id: 22, name: '수업부담', category: '학습걸림돌', positive: false, definition: '수업 내용이 어렵거나 지루하여 답답함이나 부담을 느끼는 정도' },
  // 학습걸림돌 > 학습방해물 (2개)
  { id: 23, name: '스마트폰 의존', category: '학습걸림돌', positive: false, definition: '스마트폰 의존도가 높아서 일상생활과 공부에 방해 받는 정도' },
  { id: 24, name: '게임 과몰입', category: '학습걸림돌', positive: false, definition: '인터넷 게임 의존도가 높아서 일상생활과 공부에 방해 받는 정도' },
  // 학습걸림돌 > 학업관계스트레스 (5개)
  { id: 25, name: '부모 성적압력', category: '학습걸림돌', positive: false, definition: '성적과 관련된 부모님의 높은 기대나 꾸중에 대해 부담감을 느끼는 정도' },
  { id: 26, name: '부모 공부부담', category: '학습걸림돌', positive: false, definition: '공부와 관련된 부모님의 비교와 압박으로 인해 부담감을 느끼는 정도' },
  { id: 27, name: '친구 공부비교', category: '학습걸림돌', positive: false, definition: '친구에 비해 성적이 떨어지는 것을 불안해 하거나 열등감을 느끼는 정도' },
  { id: 28, name: '교사 성적압력', category: '학습걸림돌', positive: false, definition: '교사의 성적비교, 꾸중에 대한 불안감, 기대에 부응하지 못한 성적으로 인한 좌절감의 정도' },
  { id: 29, name: '교사 수업부담', category: '학습걸림돌', positive: false, definition: '수업 중 교사의 질문에 답을 못하거나 수업 내용을 잘 이해하지 못할까봐 부담을 느끼는 정도' },
  // 긍정적공부마음 > 학업열의 (3개)
  { id: 30, name: '활기', category: '긍정적공부마음', positive: true, definition: '공부를 할 때 힘이 나거나 재미와 즐거움을 느끼는 정도' },
  { id: 31, name: '몰두', category: '긍정적공부마음', positive: true, definition: '시간과 장소에 관계없이 공부에 집중할 수 있는 정도' },
  { id: 32, name: '의미감', category: '긍정적공부마음', positive: true, definition: '공부하는 의미와 목적을 알고, 보람을 느끼는 정도' },
  // 긍정적공부마음 > 성장력 (3개)
  { id: 33, name: '자율성', category: '긍정적공부마음', positive: true, definition: '자기 스스로의 원칙에 따라 어떤 일을 주체적으로 결정하는 특성' },
  { id: 34, name: '유능성', category: '긍정적공부마음', positive: true, definition: '어떤 일을 남들보다 잘하는 능력이 있다는 느낌' },
  { id: 35, name: '관계성', category: '긍정적공부마음', positive: true, definition: '사람들 사이에서 관심을 주고 받으며, 그 속에서 소속감을 느끼는 정도' },
  // 부정적공부마음 > 학업소진 (3개)
  { id: 36, name: '고갈', category: '부정적공부마음', positive: false, definition: '공부 때문에 지쳐서 아무 즐거움이나 흥미가 없는 피로 상태' },
  { id: 37, name: '무능감', category: '부정적공부마음', positive: false, definition: '노력해도 성적이 만족스럽지 않고, 노력한만큼 좋은 결과가 나오지 않아 실망감을 느끼는 상태' },
  { id: 38, name: '반감-냉소', category: '부정적공부마음', positive: false, definition: '공부 흥미가 줄거나 하기 싫다고 느끼며, 공부의 필요성을 느끼지 못하는 정도' },
];

// 5대 영역 색상 (ClassResultView와 동일)
const DOMAIN_COLORS: Record<string, string> = {
  '자아강점': '#00D282',
  '학습디딤돌': '#4BC1FF',
  '긍정적공부마음': '#67A7FF',
  '학습걸림돌': '#FF849F',
  '부정적공부마음': '#FF87D4',
};

// 강점/보완점 카드 스타일 (ClassResultView와 동일)
const ACCENT_STYLES = {
  emerald: {
    cardBg: 'rgba(16, 185, 129, 0.05)',
    cardBorder: '#a7f3d0',
    rank: '#10b981',
  },
  red: {
    cardBg: 'rgba(239, 68, 68, 0.05)',
    cardBorder: '#fecaca',
    rank: '#ef4444',
  },
} as const;

export const StudentResultView: React.FC<StudentResultViewProps> = ({
  result,
  className,
  onBack,
  prevStudent,
  nextStudent,
  onNavigateStudent,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('round1');

  const hasRound2 = result.round === 2 && result.prevResult;
  const isCompare = viewMode === 'compare';

  // 현재 표시할 데이터 결정
  const currentData = viewMode === 'round1' && result.prevResult
    ? result.prevResult
    : result;

  const tScores = currentData.tScores;
  const predictedType = currentData.predictedType;
  const typeProbabilities = currentData.typeProbabilities;

  // 비교 모드용 이전 데이터
  const prevTScores = isCompare && result.prevResult ? result.prevResult.tScores : undefined;
  const prevType = isCompare && result.prevResult ? result.prevResult.predictedType : undefined;
  const prevTypeProbabilities = isCompare && result.prevResult ? result.prevResult.typeProbabilities : undefined;

  // AI 총평 데이터 (fallback: 안전 균형형)
  const aiSummary = MOCK_AI_SUMMARIES[predictedType] || MOCK_AI_SUMMARIES['안전 균형형'];

  // 개인 학습 현황
  const learningStatus = useMemo(() => generateMockLearningStatus(predictedType), [predictedType]);

  // 강점/보완점 Top 3 계산
  const { strengths, weaknesses } = useMemo(() => {
    if (!tScores || tScores.length === 0) return { strengths: [], weaknesses: [] };

    const factorsWithScores = FACTOR_INFO.map((factor, idx) => ({
      ...factor,
      score: tScores[idx] || 50,
    }));

    // 긍정 요인 중 T점수 높은 것 = 강점
    const positiveFactors = factorsWithScores.filter(f => f.positive);
    const strengthFactors = [...positiveFactors]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // 부정 요인 중 T점수 높은 것 = 보완점
    const negativeFactors = factorsWithScores.filter(f => !f.positive);
    const weaknessFactors = [...negativeFactors]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return { strengths: strengthFactors, weaknesses: weaknessFactors };
  }, [tScores]);

  // 상담 기록 (Mock)
  const counselingRecords = useMemo(() => {
    // className에서 classId 추출 (예: "2-3반" -> "group-3")
    const classNum = className.match(/(\d+)-(\d+)/)?.[2] || '1';
    const classId = `group-${classNum}`;
    return generateMockCounselingRecords(result.id, result.name, classId, className);
  }, [result.id, result.name, className]);

  // 관찰 기록 (Mock)
  const observationRecords = useMemo(() => {
    const classNum = className.match(/(\d+)-(\d+)/)?.[2] || '1';
    const classId = `group-${classNum}`;
    return generateMockObservationRecords(result.id, result.name, classId, className);
  }, [result.id, result.name, className]);

  // 상담 저장 핸들러
  const handleSaveCounseling = useCallback((data: CounselingMemoData) => {
    console.log('상담 저장:', data);
    // 실제 구현에서는 API 호출
  }, []);

  // 관찰 저장 핸들러
  const handleSaveObservation = useCallback((data: ObservationMemoData) => {
    console.log('관찰 메모 저장:', data);
    // 실제 구현에서는 API 호출
  }, []);

  // 응시일 포맷
  const formatDate = (date?: Date): string => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // 우측 컨텐츠: 학생 네비게이션 + 보고서 다운로드
  const rightContent = (
    <>
      {/* 학생 네비게이션 */}
      {onNavigateStudent && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => prevStudent && onNavigateStudent(prevStudent.id)}
            disabled={!prevStudent}
            className="px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ‹ 이전
          </button>
          <button
            onClick={() => nextStudent && onNavigateStudent(nextStudent.id)}
            disabled={!nextStudent}
            className="px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            다음 ›
          </button>
        </div>
      )}

      {/* 보고서 다운로드 */}
      <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
        <Download className="w-4 h-4" />
        보고서
      </button>
    </>
  );

  return (
    <div className="space-y-6">
      {/* 1. 헤더 - 유형 배지 제거, 응시일 추가 */}
      <div className="space-y-3">
        <StudentHeader
          studentNumber={result.number}
          studentName={result.name}
          className={className}
          onBack={onBack}
          rightContent={rightContent}
          showTypeBadge={false}
        />
        {/* 응시일 표시 */}
        <div className="flex items-center gap-6 ml-14 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>1차 검사: {formatDate(result.assessedAt)}</span>
          </div>
          {hasRound2 && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>2차 검사: {formatDate(result.assessedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. AI 분석 총평 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">AI 분석 총평</h3>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">{aiSummary.summary}</p>
        <div className="flex flex-wrap gap-2">
          {aiSummary.keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/70 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700"
            >
              #{keyword}
            </span>
          ))}
        </div>
      </div>

      {/* 3. 회차 선택 탭 */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('round1')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'round1'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          1차 검사
        </button>
        {hasRound2 && (
          <>
            <button
              onClick={() => setViewMode('round2')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'round2'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              2차 검사
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'compare'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              차수 변화
            </button>
          </>
        )}
      </div>

      {/* ================================================================ */}
      {/* 섹션 1: 학습 현황 */}
      {/* ================================================================ */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center">
          <span className="text-sm font-bold text-white">1</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">학습 현황</h2>
          <p className="text-xs text-gray-500">학생이 직접 응답한 학습 상황입니다</p>
        </div>
      </div>

      {/* 4. 개인 학습 현황 (설문 응답 기반) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-base font-semibold text-gray-900">개인 학습 현황</h3>
          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500">설문 응답</span>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">학업 성취도</p>
            <p className="text-sm font-semibold text-gray-900">
              {LEARNING_STATUS_LABELS.academicAchievement[learningStatus.academicAchievement]}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">성적 만족도</p>
            <p className="text-sm font-semibold text-gray-900">
              {LEARNING_STATUS_LABELS.gradeSatisfaction[learningStatus.gradeSatisfaction]}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">학습 동기</p>
            <p className="text-sm font-semibold text-gray-900">
              {LEARNING_STATUS_LABELS.learningMotivation[learningStatus.learningMotivation]}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">혼자 공부 시간</p>
            <p className="text-sm font-semibold text-gray-900">
              {LEARNING_STATUS_LABELS.selfStudyTime[learningStatus.selfStudyTime]}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">학습 고민 상담</p>
            <p className="text-sm font-semibold text-gray-900">
              {LEARNING_STATUS_LABELS.learningCounselor[learningStatus.learningCounselor]}
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 섹션 2: 요인 분석 */}
      {/* ================================================================ */}
      <div className="flex items-center gap-3 pt-4 mt-2 border-t border-gray-100">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
          <span className="text-sm font-bold text-white">2</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">요인 분석</h2>
          <p className="text-xs text-gray-500">38개 학습 요인의 세부 점수를 분석합니다</p>
        </div>
      </div>

      {/* 5. 38개 요인 분석 */}
      <StudentFactorAnalysis
        tScores={tScores}
        prevTScores={prevTScores}
        showCompare={isCompare}
      />

      {/* 6. 강점/보완점 Top 3 (반 결과보기와 동일한 UI) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">강점 / 보완점 Top 3</h3>

        <div className="flex gap-6">
          {/* 강점 */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
              </span>
              <h4 className="text-sm font-bold text-emerald-800">주요 강점</h4>
            </div>
            <div className="flex gap-2">
              {strengths.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 p-3 rounded-lg border"
                  style={{
                    backgroundColor: ACCENT_STYLES.emerald.cardBg,
                    borderColor: ACCENT_STYLES.emerald.cardBorder,
                  }}
                >
                  {/* 대분류 태그 */}
                  <span
                    className="text-[11px] font-semibold inline-block mb-1"
                    style={{ color: DOMAIN_COLORS[item.category] || '#9CA3AF' }}
                  >
                    #{item.category}
                  </span>

                  {/* 순위 + 요인명 */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-xs font-bold"
                      style={{ color: ACCENT_STYLES.emerald.rank }}
                    >
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  </div>

                  {/* 설명 */}
                  <p className="text-xs text-gray-500 leading-relaxed">{item.definition}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 구분선 */}
          <div className="w-px bg-gray-200 self-stretch" />

          {/* 보완점 */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-5 h-5 rounded bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-red-600" strokeWidth={2.5} />
              </span>
              <h4 className="text-sm font-bold text-red-800">주요 보완점</h4>
            </div>
            <div className="flex gap-2">
              {weaknesses.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 p-3 rounded-lg border"
                  style={{
                    backgroundColor: ACCENT_STYLES.red.cardBg,
                    borderColor: ACCENT_STYLES.red.cardBorder,
                  }}
                >
                  {/* 대분류 태그 */}
                  <span
                    className="text-[11px] font-semibold inline-block mb-1"
                    style={{ color: DOMAIN_COLORS[item.category] || '#9CA3AF' }}
                  >
                    #{item.category}
                  </span>

                  {/* 순위 + 요인명 */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-xs font-bold"
                      style={{ color: ACCENT_STYLES.red.rank }}
                    >
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                  </div>

                  {/* 설명 */}
                  <p className="text-xs text-gray-500 leading-relaxed">{item.definition}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 섹션 3: 학습 유형 */}
      {/* ================================================================ */}
      <div className="flex items-center gap-3 pt-4 mt-2 border-t border-gray-100">
        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
          <span className="text-sm font-bold text-white">3</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">학습 유형</h2>
          <p className="text-xs text-gray-500">38개 요인 패턴을 종합하여 분류한 학습자 유형입니다</p>
        </div>
      </div>

      {/* 7. 학습 유형 분류 (LPA) - TypeClassification 컴포넌트가 자체 카드 스타일 포함 */}
      <TypeClassification
        predictedType={predictedType}
        typeProbabilities={typeProbabilities}
        schoolLevel={result.schoolLevel}
        showCompare={isCompare}
        prevType={prevType}
        prevTypeProbabilities={prevTypeProbabilities}
      />

      {/* ================================================================ */}
      {/* 섹션 4: 상담 & 관찰 */}
      {/* ================================================================ */}
      <div className="flex items-center gap-3 pt-4 mt-2 border-t border-gray-100">
        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center">
          <span className="text-sm font-bold text-white">4</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">상담 & 관찰</h2>
          <p className="text-xs text-gray-500">상담 기록과 관찰 메모를 작성하고 이력을 확인합니다</p>
        </div>
      </div>

      {/* 8. 상담 기록 / 관찰 메모 (2열) + 통합 이력 (아래 1열) */}
      <div className="space-y-4">
        {/* 상단: 에디터 2열 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 상담 기록 작성 */}
          <CounselingMemoEditor
            studentId={result.id}
            studentName={result.name}
            onSave={handleSaveCounseling}
          />

          {/* 관찰 메모 작성 */}
          <ObservationMemoEditor
            studentId={result.id}
            studentName={result.name}
            onSave={handleSaveObservation}
          />
        </div>

        {/* 하단: 통합 이력 */}
        <UnifiedHistoryList
          counselingRecords={counselingRecords}
          observationRecords={observationRecords}
          studentName={result.name}
        />
      </div>

      {/* ================================================================ */}
      {/* 코칭 연결 버튼 */}
      {/* ================================================================ */}
      <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
        <CoachingLinkButton studentNumber={result.number} studentName={result.name} />
      </div>
    </div>
  );
};

/** 코칭 연결 버튼 (개별 코칭으로 이동) */
const CoachingLinkButton: React.FC<{ studentNumber: number; studentName: string }> = ({ studentNumber, studentName }) => {
  const navigate = useNavigate();
  const { setSelectedStudent, scope } = useLayoutContext();

  const handleClick = () => {
    // LNB MOCK_STUDENTS와 호환되는 id 형태로 변환 (s1, s2, ...)
    const lnbStudentId = `s${studentNumber}`;
    // 현재 학생 유지
    setSelectedStudent?.({ id: lnbStudentId, name: studentName });
    // 코칭 > 개별 코칭으로 이동 (URL 쿼리 파라미터 유지)
    const params = new URLSearchParams();
    if (scope.classId) params.set('class', scope.classId);
    params.set('student', lnbStudentId);
    const queryString = params.toString();
    navigate(`/coaching/individual${queryString ? `?${queryString}` : ''}`);
    // 스크롤 최상단으로 이동
    window.scrollTo(0, 0);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
    >
      <span>코칭 연결</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  );
};

export default StudentResultView;
