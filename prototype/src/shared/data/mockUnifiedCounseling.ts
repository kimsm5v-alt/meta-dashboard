/**
 * 통합 상담 기록 Mock 데이터
 *
 * 상담 일정(Schedule)과 학생 대시보드 상담 기록(CounselingRecord)을 통합하여 관리합니다.
 * 양방향 연동을 지원합니다:
 * - 상담 일정 페이지에서 등록 → 학생 대시보드에서 조회 가능
 * - 학생 대시보드에서 등록 → 상담 일정 페이지에서 조회 가능
 *
 * 실제 샘플 데이터(mockData.ts)와 동기화되어 있습니다.
 */

import type {
  UnifiedCounselingRecord,
  CreateUnifiedCounselingInput,
  UpdateUnifiedCounselingInput,
  CompleteUnifiedCounselingInput,
  CounselingStudent,
} from '@/shared/types';
import { MOCK_CLASSES } from '@/shared/data/mockData';

// ============================================================
// 상담일정용 학급 목록 (mockData.ts에서 동적 생성)
// ============================================================

export interface ScheduleClass {
  id: string;
  grade: number;
  classNumber: number;
  label: string;
}

export const SCHEDULE_CLASSES: ScheduleClass[] = MOCK_CLASSES.map(cls => ({
  id: cls.id,
  grade: cls.grade,
  classNumber: cls.classNumber,
  label: `${cls.grade}학년 ${cls.classNumber}반`,
}));

// ============================================================
// 학급별 학생 목록 (mockData.ts에서 동적 생성)
// ============================================================

export const SCHEDULE_STUDENTS: Record<string, CounselingStudent[]> = {};

MOCK_CLASSES.forEach(cls => {
  SCHEDULE_STUDENTS[cls.id] = cls.students.map(student => ({
    id: student.id,
    name: student.name,
    number: student.number,
    classId: cls.id,
  }));
});

// ============================================================
// 학급별 색상
// ============================================================

const CLASS_COLOR_PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

export const CLASS_COLORS: Record<string, string> = {};

MOCK_CLASSES.forEach((cls, index) => {
  CLASS_COLORS[cls.id] = CLASS_COLOR_PALETTE[index % CLASS_COLOR_PALETTE.length];
});

// ============================================================
// 날짜 헬퍼 함수
// ============================================================

const today = new Date();
const getDateString = (daysOffset: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

// ============================================================
// 헬퍼 함수: 특정 학급의 학생 가져오기
// ============================================================

const getStudent = (classId: string, studentNumber: number): CounselingStudent | null => {
  const students = SCHEDULE_STUDENTS[classId];
  if (!students) return null;
  return students.find(s => s.number === studentNumber) || null;
};

// 첫 번째 학급 ID (기본값용)
const firstClassId = SCHEDULE_CLASSES[0]?.id || 'class-6-2';
const secondClassId = SCHEDULE_CLASSES[1]?.id || firstClassId;
const thirdClassId = SCHEDULE_CLASSES[2]?.id || firstClassId;
const fourthClassId = SCHEDULE_CLASSES[3]?.id || firstClassId;

// ============================================================
// 초기 통합 상담 기록 데이터
// ============================================================

const createInitialRecords = (): UnifiedCounselingRecord[] => {
  const records: UnifiedCounselingRecord[] = [];

  // ========== 예정된 상담 (scheduled) ==========

  // 첫 번째 학급 상담
  const s1 = getStudent(firstClassId, 1);
  if (s1) {
    records.push({
      id: 'sch-001',
      students: [s1],
      classId: firstClassId,
      scheduledAt: `${getDateString(0)} 09:30`,
      types: ['regular'],
      areas: ['academic'],
      methods: ['face-to-face'],
      status: 'scheduled',
      reason: '학업 성취도 점검 및 학습 계획 상담',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 두 번째 학급 긴급 상담 (2명)
  const s2a = getStudent(secondClassId, 2);
  const s2b = getStudent(secondClassId, 3);
  if (s2a && s2b) {
    records.push({
      id: 'sch-002',
      students: [s2a, s2b],
      classId: secondClassId,
      scheduledAt: `${getDateString(0)} 11:00`,
      types: ['urgent'],
      areas: ['peer', 'emotion'],
      methods: ['face-to-face'],
      status: 'scheduled',
      reason: '교우관계 갈등 중재',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 세 번째 학급 후속 상담
  const s3 = getStudent(thirdClassId, 5);
  if (s3) {
    records.push({
      id: 'sch-003',
      students: [s3],
      classId: thirdClassId,
      scheduledAt: `${getDateString(0)} 14:00`,
      types: ['follow-up'],
      areas: ['emotion'],
      methods: ['face-to-face'],
      status: 'scheduled',
      reason: '지난 상담 이후 경과 확인',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 네 번째 학급 초기 상담
  const s4 = getStudent(fourthClassId, 1);
  if (s4) {
    records.push({
      id: 'sch-004',
      students: [s4],
      classId: fourthClassId,
      scheduledAt: `${getDateString(1)} 10:00`,
      types: ['initial'],
      areas: ['career'],
      methods: ['face-to-face'],
      status: 'scheduled',
      reason: '진로 탐색 상담',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 첫 번째 학급 전화 상담
  const s5 = getStudent(firstClassId, 6);
  if (s5) {
    records.push({
      id: 'sch-005',
      students: [s5],
      classId: firstClassId,
      scheduledAt: `${getDateString(1)} 13:30`,
      types: ['regular'],
      areas: ['family'],
      methods: ['phone'],
      status: 'scheduled',
      reason: '가정환경 변화에 따른 적응 상담',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 두 번째 학급 그룹 상담 (3명)
  const s6a = getStudent(secondClassId, 8);
  const s6b = getStudent(secondClassId, 9);
  const s6c = getStudent(secondClassId, 10);
  if (s6a && s6b && s6c) {
    records.push({
      id: 'sch-006',
      students: [s6a, s6b, s6c],
      classId: secondClassId,
      scheduledAt: `${getDateString(2)} 09:00`,
      types: ['regular'],
      areas: ['behavior'],
      methods: ['group'],
      status: 'scheduled',
      reason: '그룹 행동 개선 프로그램',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 세 번째 학급 긴급 상담
  const s7 = getStudent(thirdClassId, 11);
  if (s7) {
    records.push({
      id: 'sch-007',
      students: [s7],
      classId: thirdClassId,
      scheduledAt: `${getDateString(2)} 15:00`,
      types: ['urgent'],
      areas: ['health'],
      methods: ['face-to-face'],
      status: 'scheduled',
      reason: '건강 관련 긴급 상담',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 네 번째 학급 화상 상담
  const s8 = getStudent(fourthClassId, 4);
  if (s8) {
    records.push({
      id: 'sch-008',
      students: [s8],
      classId: fourthClassId,
      scheduledAt: `${getDateString(3)} 11:30`,
      types: ['follow-up'],
      areas: ['academic'],
      methods: ['video'],
      status: 'scheduled',
      reason: '학습 전략 점검',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 첫 번째 학급 정기 상담
  const s9 = getStudent(firstClassId, 13);
  if (s9) {
    records.push({
      id: 'sch-009',
      students: [s9],
      classId: firstClassId,
      scheduledAt: `${getDateString(4)} 10:30`,
      types: ['regular'],
      areas: ['other'],
      methods: ['face-to-face'],
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 네 번째 학급 긴급 중재 (2명)
  const s10a = getStudent(fourthClassId, 7);
  const s10b = getStudent(fourthClassId, 8);
  if (s10a && s10b) {
    records.push({
      id: 'sch-010',
      students: [s10a, s10b],
      classId: fourthClassId,
      scheduledAt: `${getDateString(4)} 14:30`,
      types: ['urgent'],
      areas: ['peer'],
      methods: ['face-to-face'],
      status: 'scheduled',
      reason: '또래 갈등 긴급 중재',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 두 번째 학급 초기 상담
  const s11 = getStudent(secondClassId, 15);
  if (s11) {
    records.push({
      id: 'sch-011',
      students: [s11],
      classId: secondClassId,
      scheduledAt: `${getDateString(7)} 09:30`,
      types: ['initial'],
      areas: ['emotion'],
      methods: ['face-to-face'],
      status: 'scheduled',
      reason: '정서 지원 초기 상담',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 세 번째 학급 진로 상담
  const s12 = getStudent(thirdClassId, 16);
  if (s12) {
    records.push({
      id: 'sch-012',
      students: [s12],
      classId: thirdClassId,
      scheduledAt: `${getDateString(8)} 13:00`,
      types: ['regular'],
      areas: ['career'],
      methods: ['face-to-face'],
      status: 'scheduled',
      reason: '진로 목표 설정 상담',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 네 번째 학급 가정 연계 상담
  const s13 = getStudent(fourthClassId, 11);
  if (s13) {
    records.push({
      id: 'sch-013',
      students: [s13],
      classId: fourthClassId,
      scheduledAt: `${getDateString(9)} 15:30`,
      types: ['follow-up'],
      areas: ['family'],
      methods: ['phone'],
      status: 'scheduled',
      reason: '가정 연계 후속 상담',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 첫 번째 학급 추가 상담
  const s14 = getStudent(firstClassId, 4);
  if (s14) {
    records.push({
      id: 'sch-014',
      students: [s14],
      classId: firstClassId,
      scheduledAt: `${getDateString(1)} 16:00`,
      types: ['regular'],
      areas: ['academic'],
      methods: ['face-to-face'],
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 세 번째 학급 긴급 정서 상담
  const s15 = getStudent(thirdClassId, 3);
  if (s15) {
    records.push({
      id: 'sch-015',
      students: [s15],
      classId: thirdClassId,
      scheduledAt: `${getDateString(3)} 09:00`,
      types: ['urgent'],
      areas: ['emotion'],
      methods: ['face-to-face'],
      status: 'scheduled',
      reason: '정서적 어려움 긴급 상담',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // ========== 완료된 상담 (completed) ==========

  // 첫 번째 학급 1번 학생 완료 상담
  const c1 = getStudent(firstClassId, 1);
  if (c1) {
    records.push({
      id: 'cr-1',
      students: [c1],
      classId: firstClassId,
      scheduledAt: '2026-01-15 14:00',
      duration: 30,
      types: ['initial'],
      areas: ['academic'],
      methods: ['face-to-face'],
      status: 'completed',
      summary: '1차 검사 결과를 바탕으로 학습 태도에 대해 상담함. 메타인지 영역이 낮게 나와 자기 점검 습관의 필요성을 설명함. 특히 시험 전 계획 세우기와 학습 후 복습 점검에 대해 구체적인 방법을 안내함.',
      nextSteps: '매일 학습 일지 작성하기, 2주 후 점검 상담 예정',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
    });
  }

  // 첫 번째 학급 1번 학생 후속 상담
  const c2 = getStudent(firstClassId, 1);
  if (c2) {
    records.push({
      id: 'cr-2',
      students: [c2],
      classId: firstClassId,
      scheduledAt: '2026-01-29 15:30',
      duration: 20,
      types: ['follow-up'],
      areas: ['academic'],
      methods: ['face-to-face'],
      status: 'completed',
      summary: '학습 일지 작성 점검. 일주일 중 5일 작성 완료. 자기 점검 능력이 조금씩 향상되고 있음. 수학 과목에서 어려움을 느끼고 있어 방과후 보충 수업 권유함.',
      nextSteps: '방과후 수학 보충수업 참여, 다음 주 진도 점검',
      createdAt: new Date('2026-01-29'),
      updatedAt: new Date('2026-01-29'),
    });
  }

  // 첫 번째 학급 2번 학생 진로 상담
  const c3 = getStudent(firstClassId, 2);
  if (c3) {
    records.push({
      id: 'cr-3',
      students: [c3],
      classId: firstClassId,
      scheduledAt: '2026-01-20 11:00',
      duration: 30,
      types: ['initial'],
      areas: ['career'],
      methods: ['face-to-face'],
      status: 'completed',
      summary: '진로 탐색 상담. 과학에 관심이 많아 과학자가 되고 싶다고 함. 관련 직업군과 필요한 역량에 대해 안내하고, 과학 동아리 활동 권유함.',
      nextSteps: '과학 동아리 가입, 관련 도서 읽기',
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date('2026-01-20'),
    });
  }

  // 첫 번째 학급 3번 학생 교우관계 상담
  const c4 = getStudent(firstClassId, 3);
  if (c4) {
    records.push({
      id: 'cr-4',
      students: [c4],
      classId: firstClassId,
      scheduledAt: '2026-01-18 14:30',
      duration: 40,
      types: ['urgent'],
      areas: ['peer', 'emotion'],
      methods: ['face-to-face'],
      status: 'completed',
      summary: '친구들 사이에서 갈등이 있다고 호소. 상황 파악을 위해 관련 학생들과 개별 면담 예정. 담임으로서 교실 내 분위기 개선을 위한 활동 계획 수립.',
      nextSteps: '관련 학생 면담, 학급 화합 프로그램 진행',
      createdAt: new Date('2026-01-18'),
      updatedAt: new Date('2026-01-18'),
    });
  }

  // 첫 번째 학급 3번 학생 후속 상담
  const c5 = getStudent(firstClassId, 3);
  if (c5) {
    records.push({
      id: 'cr-5',
      students: [c5],
      classId: firstClassId,
      scheduledAt: '2026-01-25 15:00',
      duration: 30,
      types: ['follow-up'],
      areas: ['peer'],
      methods: ['face-to-face'],
      status: 'completed',
      summary: '지난주 면담 이후 상황 점검. 관련 학생들과 화해 과정을 거쳤고, 현재는 관계가 많이 개선됨. 학생 본인도 자신감을 되찾아가는 모습.',
      createdAt: new Date('2026-01-25'),
      updatedAt: new Date('2026-01-25'),
    });
  }

  return records;
};

// ============================================================
// Mock 데이터 스토어 (인메모리)
// ============================================================

let unifiedRecords = createInitialRecords();

// 헬퍼 함수
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================
// 통합 상담 Mock 서비스
// ============================================================

export const mockUnifiedCounselingService = {
  /**
   * 모든 상담 기록 조회 (상담 일정 페이지용)
   */
  getAll: async (): Promise<UnifiedCounselingRecord[]> => {
    await delay(200);
    return [...unifiedRecords].sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );
  },

  /**
   * 학생별 상담 기록 조회 (학생 대시보드용)
   * @param studentId 학생 ID (class-6-2-student-01 형식)
   */
  getByStudentId: async (studentId: string): Promise<UnifiedCounselingRecord[]> => {
    await delay(200);
    return unifiedRecords
      .filter(r => r.students.some(s => s.id === studentId))
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  },

  /**
   * 학급별 상담 기록 조회
   */
  getByClassId: async (classId: string): Promise<UnifiedCounselingRecord[]> => {
    await delay(200);
    return unifiedRecords
      .filter(r => r.classId === classId)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  },

  /**
   * 상태별 상담 기록 조회
   */
  getByStatus: async (status: 'scheduled' | 'completed' | 'cancelled'): Promise<UnifiedCounselingRecord[]> => {
    await delay(200);
    return unifiedRecords
      .filter(r => r.status === status)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  },

  /**
   * 단일 상담 기록 조회
   */
  getById: async (id: string): Promise<UnifiedCounselingRecord | null> => {
    await delay(150);
    return unifiedRecords.find(r => r.id === id) || null;
  },

  /**
   * 상담 기록 생성
   */
  create: async (input: CreateUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    await delay(300);
    const newRecord: UnifiedCounselingRecord = {
      ...input,
      id: generateId('ucr'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    unifiedRecords.push(newRecord);
    return newRecord;
  },

  /**
   * 상담 기록 수정
   */
  update: async (id: string, input: UpdateUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    await delay(300);
    const index = unifiedRecords.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Record not found');

    unifiedRecords[index] = {
      ...unifiedRecords[index],
      ...input,
      updatedAt: new Date(),
    };
    return unifiedRecords[index];
  },

  /**
   * 예정 상담을 완료 처리
   */
  complete: async (id: string, data: CompleteUnifiedCounselingInput): Promise<UnifiedCounselingRecord> => {
    await delay(300);
    const index = unifiedRecords.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Record not found');

    unifiedRecords[index] = {
      ...unifiedRecords[index],
      status: 'completed',
      duration: data.duration,
      summary: data.summary,
      nextSteps: data.nextSteps,
      updatedAt: new Date(),
    };
    return unifiedRecords[index];
  },

  /**
   * 상담 취소
   */
  cancel: async (id: string): Promise<void> => {
    await delay(200);
    const index = unifiedRecords.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Record not found');

    unifiedRecords[index] = {
      ...unifiedRecords[index],
      status: 'cancelled',
      updatedAt: new Date(),
    };
  },

  /**
   * 상담 기록 삭제
   */
  delete: async (id: string): Promise<void> => {
    await delay(200);
    unifiedRecords = unifiedRecords.filter(r => r.id !== id);
  },
};

// ============================================================
// 학급별 상담 통계 계산
// ============================================================

export const getClassScheduleStats = (records: UnifiedCounselingRecord[]) => {
  const stats: Record<string, { total: number; urgent: number; followUp: number }> = {};

  SCHEDULE_CLASSES.forEach(cls => {
    stats[cls.id] = { total: 0, urgent: 0, followUp: 0 };
  });

  records.forEach(record => {
    if (stats[record.classId]) {
      stats[record.classId].total++;
      if (record.types.includes('urgent')) stats[record.classId].urgent++;
      if (record.types.includes('follow-up')) stats[record.classId].followUp++;
    }
  });

  return stats;
};
