import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Card, Badge } from '../../../shared/components';
import { getClassById } from '../../../shared/data/mockData';
import type { Student } from '../../../shared/types';
import {
  TypeChangeChart,
  ClassInsights,
  KeywordBadges,
  SortableHeader,
  ChangeFilterButtons,
} from '../components';
import type { SortField, ChangeFilter } from '../components';
import { getStudentKeywords, getTypeChangeScore } from '../utils/typeUtils';

export const ClassDashboardPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const classData = classId ? getClassById(classId) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!classData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">학급을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 필터링 및 정렬
  const filteredAndSortedStudents = (() => {
    let filtered = classData.students.filter((s) => {
      // 검색어 필터
      if (searchTerm && !s.name.includes(searchTerm) && !s.number.toString().includes(searchTerm)) {
        return false;
      }

      const r1 = s.assessments.find(a => a.round === 1);
      const r2 = s.assessments.find(a => a.round === 2);
      const typeChange = getTypeChangeScore(r1?.predictedType, r2?.predictedType);

      // 변화 상태 필터
      if (changeFilter === 'positive' && typeChange !== 1) return false;
      if (changeFilter === 'negative' && typeChange !== -1) return false;
      if (changeFilter === 'none' && (typeChange !== 0 || !r2)) return false;
      if (changeFilter === 'not-assessed' && r2) return false;

      return true;
    });

    // 정렬
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const getValue = (student: Student) => {
          const r1 = student.assessments.find(r => r.round === 1);
          const r2 = student.assessments.find(r => r.round === 2);

          switch (sortField) {
            case 'number': return student.number;
            case 'name': return student.name;
            case 'type1': return r1?.predictedType || '';
            case 'type2': return r2?.predictedType || '';
          }
        };

        const aValue = getValue(a);
        const bValue = getValue(b);

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return sortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    return filtered;
  })();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {classData.grade}학년 {classData.classNumber}반
          </h1>
          <p className="text-gray-500">
            학생 {classData.stats?.totalStudents}명 | 검사 완료 {classData.stats?.assessedStudents}명
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TypeChangeChart classData={classData} />
        <ClassInsights classData={classData} />
      </div>

      {/* Student Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">학생 목록</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="이름/번호 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-600 font-medium">변화 상태:</p>
            <ChangeFilterButtons value={changeFilter} onChange={setChangeFilter} />
          </div>

          <div className="flex items-center justify-between text-sm pt-3">
            <span className="text-gray-600">
              {filteredAndSortedStudents.length}명 표시
              {changeFilter !== 'all' && (
                <span className="text-gray-400 ml-1">(전체 {classData.students.length}명)</span>
              )}
            </span>
            {changeFilter !== 'all' && (
              <button
                onClick={() => setChangeFilter('all')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="text-left py-3 px-4 w-24">
                  <SortableHeader
                    field="number"
                    label="번호"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="text-left py-3 px-4 w-32">
                  <SortableHeader
                    field="name"
                    label="이름"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="text-left py-3 px-4 w-32">
                  <SortableHeader
                    field="type1"
                    label="1차 유형"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="text-left py-3 px-4">1차 주요 키워드</th>
                <th className="text-left py-3 px-4 w-32">
                  <SortableHeader
                    field="type2"
                    label="2차 유형"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                </th>
                <th className="text-left py-3 px-4">2차 주요 키워드</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStudents.map((student) => {
                const r1 = student.assessments.find(a => a.round === 1);
                const r2 = student.assessments.find(a => a.round === 2);
                const keywords1 = getStudentKeywords(student, 1);
                const keywords2 = getStudentKeywords(student, 2);
                const typeChange = getTypeChangeScore(r1?.predictedType, r2?.predictedType);

                const rowBgClass = typeChange === 1
                  ? 'bg-lime-50'
                  : typeChange === -1
                  ? 'bg-red-50'
                  : '';

                return (
                  <tr
                    key={student.id}
                    onClick={() => navigate(`/dashboard/class/${classId}/student/${student.id}`)}
                    className={`border-b hover:bg-opacity-70 cursor-pointer ${rowBgClass}`}
                  >
                    <td className="py-3 px-4">{student.number}</td>
                    <td className="py-3 px-4 font-medium">{student.name}</td>
                    <td className="py-3 px-4">
                      {r1 && <Badge type={r1.predictedType}>{r1.predictedType}</Badge>}
                    </td>
                    <td className="py-3 px-4">
                      <KeywordBadges keywords={keywords1} />
                    </td>
                    <td className="py-3 px-4">
                      {r2 ? (
                        <Badge type={r2.predictedType}>{r2.predictedType}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <KeywordBadges keywords={keywords2} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ClassDashboardPage;
