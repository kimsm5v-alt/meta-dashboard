/**
 * 학생 정보 저장 서비스
 *
 * TODO: 백엔드 API 개발 완료 후 실제 API와 연결
 */

import type { StudentInfo } from '@shared/types';

/**
 * 학생 정보 저장
 *
 * TODO: 백엔드 개발자와 협의하여 API 엔드포인트 및 파라미터 확정
 *
 * 예상 엔드포인트:
 * - PUT /api/group/member/info (GroupMember 업데이트)
 * - POST /api/dgnss/st/student-info (검사 시작 시 학생 정보 저장)
 *
 * @param dgnssResultId 검사 결과 ID
 * @param info 학생 정보
 */
export const saveStudentInfo = async (
  dgnssResultId: number,
  info: StudentInfo,
): Promise<boolean> => {
  // TODO: 백엔드 API 연결
  // const response = await apiClient.post('/dgnss/st/student-info', {
  //   dgnssResultId,
  //   schoolName: info.schoolName,
  //   grade: info.grade,
  //   classNumber: info.classNumber,
  //   studentNumber: info.studentNumber,
  //   name: info.name,
  //   gender: info.gender,
  // });
  // return response.success;

  // 임시: localStorage에 저장
  console.log('[studentInfoService] 학생 정보 저장 (임시):', { dgnssResultId, info });
  try {
    const key = `student_info_${dgnssResultId}`;
    localStorage.setItem(key, JSON.stringify(info));
    return true;
  } catch (error) {
    console.error('[studentInfoService] localStorage 저장 실패:', error);
    return false;
  }
};

/**
 * 저장된 학생 정보 조회
 *
 * TODO: 백엔드 API에서 조회하도록 변경
 *
 * @param dgnssResultId 검사 결과 ID
 */
export const getStoredStudentInfo = (dgnssResultId: number): StudentInfo | null => {
  // TODO: 백엔드 API에서 조회
  // const response = await apiClient.get(`/dgnss/st/student-info?dgnssResultId=${dgnssResultId}`);
  // return response.resultData;

  // 임시: localStorage에서 조회
  try {
    const key = `student_info_${dgnssResultId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as StudentInfo;
    }
    return null;
  } catch (error) {
    console.error('[studentInfoService] localStorage 조회 실패:', error);
    return null;
  }
};
