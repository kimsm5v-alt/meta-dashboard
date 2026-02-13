/**
 * 추출된 학생 데이터 검토 테이블
 *
 * PDF에서 추출된 데이터를 교사가 검토할 수 있도록 표시.
 * 각 학생의 이름, 유형, 요인 수, 검증 상태를 보여줌.
 */

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { RawData } from '@/shared/services/storageService';
import type { ValidationResult } from '@/shared/services/pdfExtractionService';

interface DataReviewTableProps {
  rawData: RawData;
  validation: ValidationResult;
}

export const DataReviewTable: React.FC<DataReviewTableProps> = ({ rawData, validation }) => {
  const allStudents: Array<{
    className: string;
    name: string;
    id: string;
    factorCount: number;
    hasTest1: boolean;
    hasTest2: boolean;
    type: string | null;
  }> = [];

  for (const [className, classData] of Object.entries(rawData.classes)) {
    for (const student of classData.students) {
      const test1Scores = student.test1?.tScores;
      const test2Scores = student.test2?.tScores;
      const factorCount = test1Scores ? Object.keys(test1Scores).length : (test2Scores ? Object.keys(test2Scores).length : 0);
      const type = student.test1?.type || student.test2?.type || null;

      allStudents.push({
        className,
        name: student.name,
        id: student.id,
        factorCount,
        hasTest1: !!test1Scores,
        hasTest2: !!test2Scores,
        type,
      });
    }
  }

  const getStatusIcon = (factorCount: number) => {
    if (factorCount >= 35) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (factorCount >= 20) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{validation.classCount}</p>
          <p className="text-xs text-gray-500">학급</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{validation.studentCount}</p>
          <p className="text-xs text-gray-500">학생</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${validation.isValid ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <p className={`text-2xl font-bold ${validation.isValid ? 'text-emerald-600' : 'text-amber-600'}`}>
            {validation.isValid ? 'OK' : `${validation.errors.length}`}
          </p>
          <p className="text-xs text-gray-500">{validation.isValid ? '검증 통과' : '오류'}</p>
        </div>
      </div>

      {/* 경고/오류 메시지 */}
      {validation.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-700 mb-1">오류</p>
          {validation.errors.slice(0, 5).map((err, i) => (
            <p key={i} className="text-xs text-red-600">{err.message}</p>
          ))}
          {validation.errors.length > 5 && (
            <p className="text-xs text-red-500 mt-1">... 외 {validation.errors.length - 5}건</p>
          )}
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-medium text-amber-700 mb-1">주의</p>
          {validation.warnings.slice(0, 3).map((warn, i) => (
            <p key={i} className="text-xs text-amber-600">{warn.message}</p>
          ))}
          {validation.warnings.length > 3 && (
            <p className="text-xs text-amber-500 mt-1">... 외 {validation.warnings.length - 3}건</p>
          )}
        </div>
      )}

      {/* 학생 목록 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">학급</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">이름</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">유형</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">요인수</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">1차</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">2차</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allStudents.map((student, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-600">{student.className}</td>
                <td className="px-4 py-2 font-medium text-gray-900">{student.name}</td>
                <td className="px-4 py-2">
                  {student.type ? (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {student.type}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center text-gray-600">{student.factorCount}/38</td>
                <td className="px-4 py-2 text-center">
                  {student.hasTest1 ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {student.hasTest2 ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {getStatusIcon(student.factorCount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
