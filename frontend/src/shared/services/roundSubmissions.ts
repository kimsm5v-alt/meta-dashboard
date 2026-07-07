export interface StudentSubmission {
  stdtId: string;
}

export const createSubmittedStudentIdSet = (studentInfoList: StudentSubmission[]): Set<string> =>
  new Set(studentInfoList.map((info) => info.stdtId));

export const hasSubmittedRound = (studentId: string, submittedStudentIds: Set<string>): boolean =>
  submittedStudentIds.has(studentId);
