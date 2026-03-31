/**
 * 학생 분석 데이터 훅 (L3 대시보드용)
 *
 * 학생 개별 T점수 데이터를 조회합니다.
 * - credentials 있음: API에서 학생 T점수 조회
 * - credentials 없음: DataContext fallback
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchStudentFullAnalysis, convertToAssessment } from '@/shared/services/dashboardService';
import { getAuthTokens } from '@/shared/services/apiClient';
import type { SchoolLevel, Student, Assessment } from '@/shared/types';
import { useData } from '@/shared/contexts/DataContext';
import { useCredentials } from './useCredentials';

export interface UseStudentAnalysisResult {
  student: Student | undefined;
  classStudents: Student[];
  classInfo: { grade: number; classNumber: number; schoolLevel: SchoolLevel } | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 학생 분석 데이터 조회
 */
export function useStudentAnalysis(
  classId: string | undefined,
  studentId: string | undefined
): UseStudentAnalysisResult {
  const { getStudentById, getClassById } = useData();
  const { schoolLevel: credSchoolLevel, hasCredentials } = useCredentials();
  const [apiStudent, setApiStudent] = useState<Student | undefined>(undefined);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<UseStudentAnalysisResult['classInfo']>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId || !classId) return;

    const parts = classId.split('-');
    const grade = parseInt(parts[0], 10) || 1;
    const classNumber = parseInt(parts[1], 10) || 1;

    // JWT 토큰 또는 credentials 확인
    const authTokens = getAuthTokens();
    const isApiMode = hasCredentials || !!authTokens?.accessToken;

    // API 모드가 아니면 DataContext fallback
    if (!isApiMode) {
      const classData = getClassById(classId);
      setClassStudents(classData?.students ?? []);
      setClassInfo(classData ? {
        grade: classData.grade,
        classNumber: classData.classNumber,
        schoolLevel: classData.schoolLevel,
      } : undefined);
      setApiStudent(getStudentById(classId, studentId));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fullAnalysis = await fetchStudentFullAnalysis(studentId, '1');

      // 유효한 데이터가 없으면 DataContext fallback
      if (!fullAnalysis.round1 && !fullAnalysis.round2) {
        const classData = getClassById(classId);
        setClassStudents(classData?.students ?? []);
        setClassInfo(classData ? {
          grade: classData.grade,
          classNumber: classData.classNumber,
          schoolLevel: classData.schoolLevel,
        } : undefined);
        setApiStudent(getStudentById(classId, studentId));
        setIsLoading(false);
        return;
      }

      const assessments: Assessment[] = [];

      if (fullAnalysis.round1) {
        assessments.push(
          convertToAssessment(studentId, 1, fullAnalysis.round1, credSchoolLevel)
        );
      }

      if (fullAnalysis.round2) {
        assessments.push(
          convertToAssessment(studentId, 2, fullAnalysis.round2, credSchoolLevel)
        );
      }

      const student: Student = {
        id: studentId,
        classId,
        number: 0,
        name: '학생',
        schoolLevel: credSchoolLevel,
        grade,
        assessments,
      };

      setApiStudent(student);
      setClassInfo({ grade, classNumber, schoolLevel: credSchoolLevel });

      const classData = getClassById(classId);
      setClassStudents(classData?.students ?? []);

    } catch (err) {
      console.error('Failed to fetch student analysis:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
      const classData = getClassById(classId);
      setClassStudents(classData?.students ?? []);
      setClassInfo(classData ? {
        grade: classData.grade,
        classNumber: classData.classNumber,
        schoolLevel: classData.schoolLevel,
      } : undefined);
    } finally {
      setIsLoading(false);
    }
  }, [classId, studentId, getClassById, getStudentById, credSchoolLevel, hasCredentials]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    student: apiStudent,
    classStudents,
    classInfo,
    isLoading,
    error,
    refetch: fetchData,
  };
}
