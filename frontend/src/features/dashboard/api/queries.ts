import { useQuery } from '@tanstack/react-query';
import type { ClassSummary, DashboardStat } from '../model/types';

// Mock data — API 연동 시 apiClient.get('/teacher/stats') 로 교체
const mockStats: DashboardStat[] = [
  { label: '전체 학생', value: '128', color: '#3B82F6', iconName: 'Users' },
  { label: '검사 완료', value: '96', color: '#22C55E', iconName: 'CheckCircle' },
  { label: '관심 필요', value: '12', color: '#F59E0B', iconName: 'AlertTriangle' },
  { label: '평균 향상', value: '+5.2', color: '#8B5CF6', iconName: 'TrendingUp' },
];

const mockClasses: ClassSummary[] = [
  {
    id: '1',
    name: '1학년 1반',
    studentCount: 32,
    types: { warning: 3, balance: 20, excellent: 9 },
  },
  {
    id: '2',
    name: '1학년 2반',
    studentCount: 30,
    types: { warning: 2, balance: 18, excellent: 10 },
  },
  {
    id: '3',
    name: '2학년 1반',
    studentCount: 33,
    types: { warning: 4, balance: 22, excellent: 7 },
  },
  {
    id: '4',
    name: '2학년 2반',
    studentCount: 33,
    types: { warning: 3, balance: 21, excellent: 9 },
  },
];

export const useTeacherStats = () => {
  return useQuery({
    queryKey: ['teacher', 'stats'],
    queryFn: async (): Promise<DashboardStat[]> => mockStats,
  });
};

export const useTeacherClasses = () => {
  return useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: async (): Promise<ClassSummary[]> => mockClasses,
  });
};
