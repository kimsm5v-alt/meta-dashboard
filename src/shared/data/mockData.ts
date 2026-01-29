import type { Teacher, Class, Student, Assessment, StudentType } from '../types';

// 목업 교사
export const MOCK_TEACHER: Teacher = {
  id: 'teacher-001',
  name: '김교사',
  classes: [],
};

// 목업 학급
export const MOCK_CLASSES: Class[] = [
  {
    id: 'class-6-2',
    schoolLevel: '초등',
    grade: 6,
    classNumber: 2,
    teacherId: 'teacher-001',
    students: [],
    stats: {
      totalStudents: 29,
      assessedStudents: 28,
      typeDistribution: {
        '자원소진형': { count: 7, percentage: 25.0 },
        '안전균형형': { count: 13, percentage: 46.4 },
        '몰입자원풍부형': { count: 8, percentage: 28.6 },
      },
      needAttentionCount: 3,
      round1Completed: true,
      round2Completed: true,
    },
  },
  {
    id: 'class-6-3',
    schoolLevel: '초등',
    grade: 6,
    classNumber: 3,
    teacherId: 'teacher-001',
    students: [],
    stats: {
      totalStudents: 30,
      assessedStudents: 27,
      typeDistribution: {
        '자원소진형': { count: 15, percentage: 55.6 },
        '안전균형형': { count: 7, percentage: 25.9 },
        '몰입자원풍부형': { count: 5, percentage: 18.5 },
      },
      needAttentionCount: 8,
      round1Completed: true,
      round2Completed: false,
    },
  },
  {
    id: 'class-6-4',
    schoolLevel: '초등',
    grade: 6,
    classNumber: 4,
    teacherId: 'teacher-001',
    students: [],
    stats: {
      totalStudents: 31,
      assessedStudents: 29,
      typeDistribution: {
        '자원소진형': { count: 4, percentage: 13.8 },
        '안전균형형': { count: 8, percentage: 27.6 },
        '몰입자원풍부형': { count: 17, percentage: 58.6 },
      },
      needAttentionCount: 1,
      round1Completed: true,
      round2Completed: false,
    },
  },
  {
    id: 'class-6-5',
    schoolLevel: '초등',
    grade: 6,
    classNumber: 5,
    teacherId: 'teacher-001',
    students: [],
    stats: {
      totalStudents: 28,
      assessedStudents: 27,
      typeDistribution: {
        '자원소진형': { count: 8, percentage: 29.6 },
        '안전균형형': { count: 15, percentage: 55.6 },
        '몰입자원풍부형': { count: 4, percentage: 14.8 },
      },
      needAttentionCount: 3,
      round1Completed: true,
      round2Completed: true,
    },
  },
];

// T점수 생성
const generateTScores = (type: StudentType): number[] => {
  const baseScores: Record<string, number[]> = {
    '자원소진형': [38,38,37,42,43,44,41,45,44,44,45,46,42,46,49,43,42,43,43,53,52,59,53,60,58,57,60,63,57,42,50,44,43,36,39,56,59,57],
    '안전균형형': [52,51,51,50,48,49,47,47,45,48,47,46,48,47,50,49,50,49,49,57,55,66,58,70,65,48,54,55,53,35,38,34,31,23,29,51,48,52],
    '몰입자원풍부형': [56,56,54,54,54,55,54,57,57,58,57,55,56,56,53,54,55,54,55,66,64,75,63,76,68,45,47,47,47,31,35,29,30,23,24,46,45,43],
  };
  const base = baseScores[type] || baseScores['안전균형형'];
  return base.map(score => Math.max(20, Math.min(80, score + Math.floor(Math.random() * 11) - 5)));
};

// 학생 생성
const createMockStudent = (classId: string, number: number, type: StudentType, hasRound2: boolean = true, round2Type?: StudentType): Student => {
  const names = ['김민준','이서연','박지호','최수아','정예준','강하은','조민서','윤지우','임서진','한도윤','오지민','서하늘','권예린','신동현','황지원','안서윤','송민재','전유진','장하린','유준서','남지아','홍서영','백승우','류하윤','문도현','양시은','배준혁','곽민아','허서준','노수빈'];
  const studentId = `${classId}-student-${number.toString().padStart(2, '0')}`;

  const assessments: Assessment[] = [{
    id: `${studentId}-r1`,
    studentId,
    round: 1,
    assessedAt: new Date('2026-03-15'),
    tScores: generateTScores(type),
    predictedType: type,
    typeConfidence: 75 + Math.floor(Math.random() * 20),
    typeProbabilities: { '자원소진형': type === '자원소진형' ? 80 : 10, '안전균형형': type === '안전균형형' ? 80 : 10, '몰입자원풍부형': type === '몰입자원풍부형' ? 80 : 10 },
    deviations: [],
  }];

  if (hasRound2) {
    const finalType = round2Type || type;
    assessments.push({
      id: `${studentId}-r2`,
      studentId,
      round: 2,
      assessedAt: new Date('2026-09-20'),
      tScores: generateTScores(finalType),
      predictedType: finalType,
      typeConfidence: 75 + Math.floor(Math.random() * 20),
      typeProbabilities: { '자원소진형': finalType === '자원소진형' ? 80 : 10, '안전균형형': finalType === '안전균형형' ? 80 : 10, '몰입자원풍부형': finalType === '몰입자원풍부형' ? 80 : 10 },
      deviations: [],
    });
  }

  return { id: studentId, classId, number, name: names[number - 1] || `학생${number}`, schoolLevel: '초등', grade: 6, assessments };
};

// 학급별 학생 생성
const createClassStudents = (classId: string, stats: Class['stats']): Student[] => {
  if (!stats) return [];
  const students: Student[] = [];
  let num = 1;

  // class-6-2: 2차 완료반, 유형 변화 + 미실시 포함
  if (classId === 'class-6-2') {
    // 자원소진형 7명 (1차 기준) → 2차: 5명 자원소진형, 2명 안전균형형(긍정 변화)
    for (let i = 0; i < 7; i++) {
      const round2Type = i < 5 ? '자원소진형' : '안전균형형';
      students.push(createMockStudent(classId, num++, '자원소진형', true, round2Type));
    }
    // 안전균형형 13명 (1차 기준) → 2차: 10명 안전균형형, 2명 자원소진형(부정), 1명 미실시
    for (let i = 0; i < 13; i++) {
      if (i < 10) {
        students.push(createMockStudent(classId, num++, '안전균형형', true, '안전균형형'));
      } else if (i < 12) {
        students.push(createMockStudent(classId, num++, '안전균형형', true, '자원소진형'));
      } else {
        students.push(createMockStudent(classId, num++, '안전균형형', false));
      }
    }
    // 몰입자원풍부형 8명 (1차 기준) → 2차: 6명 몰입자원풍부형, 2명 안전균형형(약간 부정)
    for (let i = 0; i < 8; i++) {
      const round2Type = i < 6 ? '몰입자원풍부형' : '안전균형형';
      students.push(createMockStudent(classId, num++, '몰입자원풍부형', true, round2Type));
    }
  }
  // class-6-3: 2차 미진행
  else if (classId === 'class-6-3') {
    const types: StudentType[] = ['자원소진형', '안전균형형', '몰입자원풍부형'];
    for (const type of types) {
      const count = stats.typeDistribution[type]?.count || 0;
      for (let i = 0; i < count; i++) {
        students.push(createMockStudent(classId, num++, type, false));
      }
    }
  }
  // class-6-4: 2차 진행중 (50% 완료)
  else if (classId === 'class-6-4') {
    const types: StudentType[] = ['자원소진형', '안전균형형', '몰입자원풍부형'];
    for (const type of types) {
      const count = stats.typeDistribution[type]?.count || 0;
      for (let i = 0; i < count; i++) {
        const hasRound2 = i % 2 === 0;
        students.push(createMockStudent(classId, num++, type, hasRound2));
      }
    }
  }
  // class-6-5: 2차 완료반
  else if (classId === 'class-6-5') {
    const types: StudentType[] = ['자원소진형', '안전균형형', '몰입자원풍부형'];
    for (const type of types) {
      const count = stats.typeDistribution[type]?.count || 0;
      for (let i = 0; i < count; i++) {
        students.push(createMockStudent(classId, num++, type, true));
      }
    }
  }
  // 기타 반
  else {
    const types: StudentType[] = ['자원소진형', '안전균형형', '몰입자원풍부형'];
    for (const type of types) {
      const count = stats.typeDistribution[type]?.count || 0;
      for (let i = 0; i < count; i++) {
        const hasRound2 = stats.round2Completed || false;
        students.push(createMockStudent(classId, num++, type, hasRound2));
      }
    }
  }

  return students;
};

// 데이터 초기화
MOCK_CLASSES.forEach(cls => { cls.students = createClassStudents(cls.id, cls.stats); });
MOCK_TEACHER.classes = MOCK_CLASSES;

// 조회 함수
export const getClassById = (classId: string): Class | undefined => MOCK_CLASSES.find(c => c.id === classId);
export const getStudentById = (classId: string, studentId: string): Student | undefined => getClassById(classId)?.students.find(s => s.id === studentId);

export default { teacher: MOCK_TEACHER, classes: MOCK_CLASSES, getClassById, getStudentById };
