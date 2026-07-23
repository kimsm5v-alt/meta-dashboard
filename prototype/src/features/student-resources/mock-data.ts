/**
 * 학생 수업 자료실 mock 데이터.
 * 백엔드 연동 전까지 사용. (개인정보 없는 샘플)
 */
import type { StudentTask } from './types';

/** 학생 모드 — 배포된 과제 (목업 renderStudent) */
export const STUDENT_TASKS: StudentTask[] = [
  { t: '자기인식 워크시트', st: '미제출', dd: '07/22' },
  { t: '자기관리 목표 세우기', st: '미제출', dd: '07/24' },
  { t: '갈등 해결 시나리오', st: '완료', dd: '07/08' },
  { t: '정서 안정 호흡 활동', st: '완료', dd: '07/03' },
];
