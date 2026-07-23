import type { ClassItem } from '../types';

/**
 * 학급 / 학생 mock 데이터
 * - LayoutV2 의 mock 반/학생 구성과 톤을 맞춤 (추후 API 연동)
 */
export const MOCK_CLASSES: ClassItem[] = [
  {
    id: '6-1',
    name: '6학년 1반',
    students: [
      { id: '6-1-1', no: 1, name: '고우진', tag: '관심' },
      { id: '6-1-2', no: 2, name: '김서연', tag: '' },
      { id: '6-1-3', no: 3, name: '박지호', tag: '' },
      { id: '6-1-4', no: 4, name: '최수아', tag: '관심' },
      { id: '6-1-5', no: 5, name: '정예준', tag: '' },
      { id: '6-1-6', no: 6, name: '강하은', tag: '' },
      { id: '6-1-7', no: 7, name: '조민서', tag: '' },
      { id: '6-1-8', no: 8, name: '윤시우', tag: '관심' },
      { id: '6-1-9', no: 9, name: '장도윤', tag: '' },
      { id: '6-1-10', no: 10, name: '임지아', tag: '' },
    ],
  },
  {
    id: '6-2',
    name: '6학년 2반',
    students: [
      { id: '6-2-1', no: 1, name: '한서준', tag: '' },
      { id: '6-2-2', no: 2, name: '오하린', tag: '관심' },
      { id: '6-2-3', no: 3, name: '신유나', tag: '' },
      { id: '6-2-4', no: 4, name: '권준우', tag: '' },
      { id: '6-2-5', no: 5, name: '송지원', tag: '' },
      { id: '6-2-6', no: 6, name: '백서윤', tag: '관심' },
      { id: '6-2-7', no: 7, name: '고은우', tag: '' },
      { id: '6-2-8', no: 8, name: '문채원', tag: '' },
    ],
  },
  {
    id: '5-3',
    name: '5학년 3반',
    students: [
      { id: '5-3-1', no: 1, name: '양시온', tag: '' },
      { id: '5-3-2', no: 2, name: '배하율', tag: '' },
      { id: '5-3-3', no: 3, name: '허지후', tag: '관심' },
      { id: '5-3-4', no: 4, name: '남윤서', tag: '' },
      { id: '5-3-5', no: 5, name: '심현우', tag: '' },
      { id: '5-3-6', no: 6, name: '안소율', tag: '' },
    ],
  },
];
