/**
 * 대시보드 데이터 서비스 (API Mock)
 *
 * 실제 백엔드 API로 교체 가능한 추상화 레이어.
 * 현재: full_sample_data.json 기반 mock
 * 추후: VITE_USE_API=true 설정 시 실제 API 호출
 */

import type { Class, Student, Teacher } from '@/shared/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const USE_API = import.meta.env.VITE_USE_API === 'true';

// Lazy-loaded mock 데이터 스토어
let _mockStore: { classes: Class[]; teacher: Teacher } | null = null;

const getMockStore = async (): Promise<{ classes: Class[]; teacher: Teacher }> => {
  if (!_mockStore) {
    const rawData = await import('@/shared/data/full_sample_data.json');
    const { transformFullData } = await import('@/shared/data/dataTransformer');
    const { classes, teacher: teacherInfo } = transformFullData(rawData.default || rawData);

    _mockStore = {
      classes,
      teacher: {
        id: teacherInfo.id,
        name: teacherInfo.name,
        classes,
      },
    };
  }
  return _mockStore;
};

const delay = (ms: number = 100): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const dataService = {
  /** 전체 학급 목록 조회 */
  getClasses: async (): Promise<Class[]> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/classes`);
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    }

    await delay();
    const store = await getMockStore();
    return store.classes;
  },

  /** 교사 정보 조회 */
  getTeacher: async (): Promise<Teacher> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/teacher`);
      if (!response.ok) throw new Error('Failed to fetch teacher');
      return response.json();
    }

    await delay();
    const store = await getMockStore();
    return store.teacher;
  },

  /** 학급 상세 조회 */
  getClassById: async (classId: string): Promise<Class | undefined> => {
    if (USE_API) {
      const response = await fetch(`${API_BASE}/api/classes/${classId}`);
      if (!response.ok) return undefined;
      return response.json();
    }

    await delay();
    const store = await getMockStore();
    return store.classes.find(c => c.id === classId);
  },

  /** 학생 상세 조회 */
  getStudentById: async (
    classId: string,
    studentId: string,
  ): Promise<Student | undefined> => {
    if (USE_API) {
      const response = await fetch(
        `${API_BASE}/api/classes/${classId}/students/${studentId}`,
      );
      if (!response.ok) return undefined;
      return response.json();
    }

    await delay();
    const store = await getMockStore();
    const cls = store.classes.find(c => c.id === classId);
    return cls?.students.find(s => s.id === studentId);
  },
};
