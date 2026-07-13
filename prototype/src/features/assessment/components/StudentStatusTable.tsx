/**
 * 검사관리 (반 전체) - 학생 응시 현황 테이블
 *
 * 번호, 이름, 응시상태, 응시일시
 */

import { useState, useMemo } from 'react';
import { Search, Check, Clock, ArrowUpDown } from 'lucide-react';
import type { StudentExamStatus } from '../types';

interface StudentStatusTableProps {
  students: StudentExamStatus[];
}

type SortField = 'number' | 'name' | 'status' | 'submittedAt';
type SortDirection = 'asc' | 'desc';

/** 날짜 포맷팅 */
const formatDate = (date?: Date): string => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const StudentStatusTable: React.FC<StudentStatusTableProps> = ({ students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'pending'>('all');

  // 필터링 및 정렬
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // 검색 필터
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.number.toString().includes(term)
      );
    }

    // 상태 필터
    if (filterStatus === 'submitted') {
      result = result.filter((s) => s.submitted);
    } else if (filterStatus === 'pending') {
      result = result.filter((s) => !s.submitted);
    }

    // 정렬
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'number':
          comparison = a.number - b.number;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ko');
          break;
        case 'status':
          comparison = (a.submitted ? 1 : 0) - (b.submitted ? 1 : 0);
          break;
        case 'submittedAt':
          const aTime = a.submittedAt?.getTime() || 0;
          const bTime = b.submittedAt?.getTime() || 0;
          comparison = aTime - bTime;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [students, searchTerm, filterStatus, sortField, sortDirection]);

  // 정렬 토글
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 통계
  const submittedCount = students.filter((s) => s.submitted).length;
  const pendingCount = students.length - submittedCount;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">학생 응시 현황</h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>전체 {students.length}명</span>
            <span className="text-green-600">응시 {submittedCount}명</span>
            <span className="text-orange-600">미응시 {pendingCount}명</span>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="flex items-center gap-4">
          {/* 검색 */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="이름 또는 번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'all' as const, label: '전체' },
              { value: 'submitted' as const, label: '응시' },
              { value: 'pending' as const, label: '미응시' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterStatus === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('number')}
              >
                <div className="flex items-center gap-1">
                  번호
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  이름
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center gap-1">
                  응시상태
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('submittedAt')}
              >
                <div className="flex items-center gap-1">
                  응시일시
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                    {student.number}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{student.name}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  {student.submitted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      <Check className="w-3.5 h-3.5" />
                      응시완료
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      미응시
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {formatDate(student.submittedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">해당 조건에 맞는 학생이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default StudentStatusTable;
