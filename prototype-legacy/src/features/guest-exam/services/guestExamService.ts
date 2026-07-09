/**
 * 게스트용 검사 서비스
 * 학생용 서비스를 재사용
 */

export {
  getStudentExamList as getGuestExamList,
  getStatusLabel,
  getStatusColor,
} from '@/features/student-exam/services/studentExamService';
