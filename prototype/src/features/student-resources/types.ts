/**
 * 학생 수업 자료실(student-resources) 도메인 타입.
 * 교사용 resources 에서 분리한 학생 모드 전용.
 */

/** 학생에게 배포된 과제 */
export interface StudentTask {
  t: string;
  st: '미제출' | '완료';
  dd: string; // 마감 'MM/DD'
}
