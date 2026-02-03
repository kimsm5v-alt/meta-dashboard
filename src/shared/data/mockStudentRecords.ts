/**
 * 학생별 상담 기록 및 관찰 메모 Mock 데이터
 */

import type {
  CounselingRecord,
  ObservationMemo,
  SavedSchoolRecord,
} from '@/shared/types';

// ============================================================
// 상담 기록 Mock 데이터
// ============================================================

export const mockCounselingRecords: CounselingRecord[] = [
  // class-6-2 학생 1번 (김민준)
  {
    id: 'cr-1',
    studentId: 'class-6-2-student-01',
    classId: 'class-6-2',
    scheduledAt: '2026-01-15 14:00',
    duration: 30,
    type: 'initial',
    area: 'academic',
    method: 'face-to-face',
    summary: '1차 검사 결과를 바탕으로 학습 태도에 대해 상담함. 메타인지 영역이 낮게 나와 자기 점검 습관의 필요성을 설명함. 특히 시험 전 계획 세우기와 학습 후 복습 점검에 대해 구체적인 방법을 안내함.',
    nextSteps: '매일 학습 일지 작성하기, 2주 후 점검 상담 예정',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'cr-2',
    studentId: 'class-6-2-student-01',
    classId: 'class-6-2',
    scheduledAt: '2026-01-29 15:30',
    duration: 20,
    type: 'follow-up',
    area: 'academic',
    method: 'face-to-face',
    summary: '학습 일지 작성 점검. 일주일 중 5일 작성 완료. 자기 점검 능력이 조금씩 향상되고 있음. 수학 과목에서 어려움을 느끼고 있어 방과후 보충 수업 권유함.',
    nextSteps: '방과후 수학 보충수업 참여, 다음 주 진도 점검',
    createdAt: new Date('2026-01-29'),
    updatedAt: new Date('2026-01-29'),
  },
  // class-6-2 학생 2번 (이서연)
  {
    id: 'cr-3',
    studentId: 'class-6-2-student-02',
    classId: 'class-6-2',
    scheduledAt: '2026-01-20 11:00',
    duration: 30,
    type: 'initial',
    area: 'career',
    method: 'face-to-face',
    summary: '진로 탐색 상담. 과학에 관심이 많아 과학자가 되고 싶다고 함. 관련 직업군과 필요한 역량에 대해 안내하고, 과학 동아리 활동 권유함.',
    nextSteps: '과학 동아리 가입, 관련 도서 읽기',
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-20'),
  },
  // class-6-2 학생 3번 (박지호)
  {
    id: 'cr-4',
    studentId: 'class-6-2-student-03',
    classId: 'class-6-2',
    scheduledAt: '2026-01-18 14:30',
    duration: 40,
    type: 'urgent',
    area: 'peer',
    method: 'face-to-face',
    summary: '친구들 사이에서 갈등이 있다고 호소. 상황 파악을 위해 관련 학생들과 개별 면담 예정. 담임으로서 교실 내 분위기 개선을 위한 활동 계획 수립.',
    nextSteps: '관련 학생 면담, 학급 화합 프로그램 진행',
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-01-18'),
  },
  {
    id: 'cr-5',
    studentId: 'class-6-2-student-03',
    classId: 'class-6-2',
    scheduledAt: '2026-01-25 15:00',
    duration: 30,
    type: 'follow-up',
    area: 'peer',
    method: 'face-to-face',
    summary: '지난주 면담 이후 상황 점검. 관련 학생들과 화해 과정을 거쳤고, 현재는 관계가 많이 개선됨. 학생 본인도 자신감을 되찾아가는 모습.',
    createdAt: new Date('2026-01-25'),
    updatedAt: new Date('2026-01-25'),
  },
];

// ============================================================
// 관찰 메모 Mock 데이터
// ============================================================

export const mockObservationMemos: ObservationMemo[] = [
  // class-6-2 학생 1번 (김민준)
  {
    id: 'memo-1',
    studentId: 'class-6-2-student-01',
    classId: 'class-6-2',
    date: '2026-01-20',
    category: 'behavior',
    content: '수업 시간에 집중력이 높아짐. 특히 수학 시간에 적극적으로 질문함. 이전보다 노트 정리도 꼼꼼하게 하는 모습.',
    isImportant: false,
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-20'),
  },
  {
    id: 'memo-2',
    studentId: 'class-6-2-student-01',
    classId: 'class-6-2',
    date: '2026-01-25',
    category: 'social',
    content: '모둠 활동에서 리더 역할을 자처함. 친구들의 의견을 경청하고 조율하는 모습이 인상적. 갈등 상황에서도 차분하게 대처함.',
    isImportant: true,
    createdAt: new Date('2026-01-25'),
    updatedAt: new Date('2026-01-25'),
  },
  {
    id: 'memo-3',
    studentId: 'class-6-2-student-01',
    classId: 'class-6-2',
    date: '2026-01-28',
    category: 'emotion',
    content: '최근 표정이 밝아지고 친구들과 잘 어울림. 쉬는 시간에 친구들과 웃으며 대화하는 모습이 자주 목격됨.',
    isImportant: false,
    createdAt: new Date('2026-01-28'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: 'memo-4',
    studentId: 'class-6-2-student-01',
    classId: 'class-6-2',
    date: '2026-02-01',
    category: 'academic',
    content: '수학 단원평가에서 85점 획득. 이전 평가 대비 15점 상승. 꾸준히 노력한 결과가 성적으로 나타남.',
    isImportant: true,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
  },
  // class-6-2 학생 2번 (이서연)
  {
    id: 'memo-5',
    studentId: 'class-6-2-student-02',
    classId: 'class-6-2',
    date: '2026-01-22',
    category: 'academic',
    content: '과학 수업 시간에 실험 과정을 매우 꼼꼼하게 기록함. 관찰력이 뛰어나고 호기심이 많음.',
    isImportant: false,
    createdAt: new Date('2026-01-22'),
    updatedAt: new Date('2026-01-22'),
  },
  {
    id: 'memo-6',
    studentId: 'class-6-2-student-02',
    classId: 'class-6-2',
    date: '2026-01-27',
    category: 'behavior',
    content: '청소 시간에 자발적으로 어려운 구역을 맡아서 청소함. 책임감 있는 행동.',
    isImportant: false,
    createdAt: new Date('2026-01-27'),
    updatedAt: new Date('2026-01-27'),
  },
  // class-6-2 학생 3번 (박지호)
  {
    id: 'memo-7',
    studentId: 'class-6-2-student-03',
    classId: 'class-6-2',
    date: '2026-01-19',
    category: 'emotion',
    content: '아침에 우울해 보이는 표정. 친구 관계에서 어려움을 겪고 있는 것 같음. 관심을 갖고 지켜볼 필요 있음.',
    isImportant: true,
    createdAt: new Date('2026-01-19'),
    updatedAt: new Date('2026-01-19'),
  },
  {
    id: 'memo-8',
    studentId: 'class-6-2-student-03',
    classId: 'class-6-2',
    date: '2026-01-30',
    category: 'social',
    content: '친구들과 화해 이후 밝아진 모습. 점심시간에 친구들과 함께 어울려 노는 모습이 보임.',
    isImportant: false,
    createdAt: new Date('2026-01-30'),
    updatedAt: new Date('2026-01-30'),
  },
];

// ============================================================
// 저장된 생기부 문구 Mock 데이터
// ============================================================

export const mockSavedSchoolRecords: SavedSchoolRecord[] = [
  // class-6-2 학생 1번 (김민준)
  {
    id: 'sr-1',
    studentId: 'class-6-2-student-01',
    classId: 'class-6-2',
    category: 'comprehensive',
    content: '학습에 대한 열의가 있으며, 자기 점검 능력이 발전하고 있는 학생임. 모둠 활동에서 리더십을 발휘하며 친구들과 원만하게 소통하는 모습을 보임. 어려움이 있어도 포기하지 않고 끈기 있게 도전하는 자세가 돋보임.',
    createdAt: new Date('2026-01-30'),
  },
  {
    id: 'sr-2',
    studentId: 'class-6-2-student-01',
    classId: 'class-6-2',
    category: 'learning',
    content: '수업에 적극적으로 참여하며, 모르는 부분은 질문을 통해 해결하려는 태도가 돋보임. 학습 일지를 꾸준히 작성하며 자기 주도적 학습 습관을 형성해 나가고 있음.',
    createdAt: new Date('2026-01-28'),
  },
  // class-6-2 학생 2번 (이서연)
  {
    id: 'sr-3',
    studentId: 'class-6-2-student-02',
    classId: 'class-6-2',
    category: 'comprehensive',
    content: '과학 분야에 대한 높은 관심과 탐구심을 가지고 있으며, 실험 활동에서 세심한 관찰력을 보임. 진로에 대한 뚜렷한 목표 의식이 있어 꾸준히 관련 활동에 참여하고 있음.',
    createdAt: new Date('2026-01-25'),
  },
  {
    id: 'sr-4',
    studentId: 'class-6-2-student-02',
    classId: 'class-6-2',
    category: 'personality',
    content: '책임감이 강하고 맡은 일은 끝까지 완수하는 성실한 태도를 보임. 다른 사람을 배려하는 마음이 있어 친구들에게 신뢰를 받고 있음.',
    createdAt: new Date('2026-01-27'),
  },
  // class-6-2 학생 3번 (박지호)
  {
    id: 'sr-5',
    studentId: 'class-6-2-student-03',
    classId: 'class-6-2',
    category: 'socialSkills',
    content: '또래 관계에서 어려움을 겪기도 했으나, 이를 극복하며 대인관계 능력이 크게 성장함. 갈등 상황에서 상대방의 입장을 이해하려 노력하고, 화해를 위한 적극적인 자세를 보임.',
    createdAt: new Date('2026-01-31'),
  },
];

// ============================================================
// Mock 데이터 스토어 (인메모리)
// ============================================================

let counselingRecords = [...mockCounselingRecords];
let observationMemos = [...mockObservationMemos];
let savedSchoolRecords = [...mockSavedSchoolRecords];

// 헬퍼 함수
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================
// 상담 기록 Mock 함수
// ============================================================

export const mockCounselingService = {
  getByStudentId: async (studentId: string): Promise<CounselingRecord[]> => {
    await delay(300);
    return counselingRecords
      .filter(r => r.studentId === studentId)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  },

  getById: async (id: string): Promise<CounselingRecord | null> => {
    await delay(200);
    return counselingRecords.find(r => r.id === id) || null;
  },

  create: async (input: Omit<CounselingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<CounselingRecord> => {
    await delay(300);
    const newRecord: CounselingRecord = {
      ...input,
      id: generateId('cr'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    counselingRecords.push(newRecord);
    return newRecord;
  },

  update: async (id: string, input: Partial<CounselingRecord>): Promise<CounselingRecord> => {
    await delay(300);
    const index = counselingRecords.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Record not found');

    counselingRecords[index] = {
      ...counselingRecords[index],
      ...input,
      updatedAt: new Date(),
    };
    return counselingRecords[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay(200);
    counselingRecords = counselingRecords.filter(r => r.id !== id);
  },
};

// ============================================================
// 관찰 메모 Mock 함수
// ============================================================

export const mockMemoService = {
  getByStudentId: async (studentId: string): Promise<ObservationMemo[]> => {
    await delay(300);
    return observationMemos
      .filter(m => m.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  create: async (input: Omit<ObservationMemo, 'id' | 'createdAt' | 'updatedAt'>): Promise<ObservationMemo> => {
    await delay(300);
    const newMemo: ObservationMemo = {
      ...input,
      id: generateId('memo'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    observationMemos.push(newMemo);
    return newMemo;
  },

  update: async (id: string, input: Partial<ObservationMemo>): Promise<ObservationMemo> => {
    await delay(300);
    const index = observationMemos.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Memo not found');

    observationMemos[index] = {
      ...observationMemos[index],
      ...input,
      updatedAt: new Date(),
    };
    return observationMemos[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay(200);
    observationMemos = observationMemos.filter(m => m.id !== id);
  },
};

// ============================================================
// 생기부 문구 Mock 함수
// ============================================================

export const mockSchoolRecordService = {
  getSavedByStudentId: async (studentId: string): Promise<SavedSchoolRecord[]> => {
    await delay(300);
    return savedSchoolRecords
      .filter(r => r.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  save: async (input: Omit<SavedSchoolRecord, 'id' | 'createdAt'>): Promise<SavedSchoolRecord> => {
    await delay(300);
    const newRecord: SavedSchoolRecord = {
      ...input,
      id: generateId('sr'),
      createdAt: new Date(),
    };
    savedSchoolRecords.push(newRecord);
    return newRecord;
  },

  delete: async (id: string): Promise<void> => {
    await delay(200);
    savedSchoolRecords = savedSchoolRecords.filter(r => r.id !== id);
  },
};
