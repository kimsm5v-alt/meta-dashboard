import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, Badge } from '../../../shared/components';
import { getClassById } from '../../../shared/data/mockData';
import { getTypeDeviations } from '../../../shared/utils/lpaClassifier';
import { FACTOR_DEFINITIONS } from '../../../shared/data/factors';
import type { Student } from '../../../shared/types';
import { TypeChangeChart, ClassInsights } from '../components';

// Keyword interface
interface Keyword {
  name: string;
  isPositive: boolean;
  direction: 'positive' | 'negative';
}

// Extract top 3 keywords for a student in a specific round
const getStudentKeywords = (student: Student, round: 1 | 2): Keyword[] => {
  const assessment = student.assessments.find(a => a.round === round);
  if (!assessment) return [];

  const deviations = getTypeDeviations(
    assessment.tScores,
    assessment.predictedType,
    student.schoolLevel,
    3
  );

  return deviations.map(dev => {
    const factor = FACTOR_DEFINITIONS[dev.index];
    return {
      name: factor.name,
      isPositive: factor.isPositive,
      direction: dev.direction,
    };
  });
};

// Determine keyword color based on factor type and direction
const getKeywordColor = (isPositive: boolean, direction: 'positive' | 'negative') => {
  if (isPositive) {
    return direction === 'positive' ? 'text-blue-600' : 'text-red-500';
  } else {
    return direction === 'positive' ? 'text-red-500' : 'text-blue-600';
  }
};

// KeywordBadges component
const KeywordBadges: React.FC<{ keywords: Keyword[] }> = ({ keywords }) => {
  if (keywords.length === 0) return <span className="text-gray-400 text-xs">-</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((kw, idx) => {
        const colorClass = getKeywordColor(kw.isPositive, kw.direction);
        return (
          <span key={idx} className={`text-xs font-medium ${colorClass}`}>
            {kw.name}
            {idx < keywords.length - 1 && ','}
          </span>
        );
      })}
    </div>
  );
};

// 유형 변화 판단 (긍정: 1, 부정: -1, 변화없음: 0)
const getTypeChange = (type1?: string, type2?: string): number => {
  if (!type1 || !type2) return 0;
  if (type1 === type2) return 0;

  const typeScore: Record<string, number> = {
    '자원소진형': 1,
    '안전균형형': 2,
    '몰입자원풍부형': 3,
  };

  const score1 = typeScore[type1] || 0;
  const score2 = typeScore[type2] || 0;

  if (score2 > score1) return 1; // 긍정 변화
  if (score2 < score1) return -1; // 부정 변화
  return 0;
};

export const ClassDashboardPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [changeFilter, setChangeFilter] = useState<'all' | 'positive' | 'negative' | 'none' | 'not-assessed'>('all');
  const [sortField, setSortField] = useState<'number' | 'name' | 'type1' | 'type2' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const classData = classId ? getClassById(classId) : undefined;

  // 페이지 로드 시 스크롤 최상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!classData) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">학급을 찾을 수 없습니다.</p></div>;
  }

  // Filter and sort students
  const filteredAndSortedStudents = (() => {
    // 1. 필터링
    let filtered = classData.students.filter((s) => {
      // 검색어 필터
      if (searchTerm && !s.name.includes(searchTerm) && !s.number.toString().includes(searchTerm)) {
        return false;
      }

      const r1 = s.assessments.find(a => a.round === 1);
      const r2 = s.assessments.find(a => a.round === 2);
      const typeChange = getTypeChange(r1?.predictedType, r2?.predictedType);

      // 변화 상태 필터
      if (changeFilter !== 'all') {
        if (changeFilter === 'positive' && typeChange !== 1) return false;
        if (changeFilter === 'negative' && typeChange !== -1) return false;
        if (changeFilter === 'none' && (typeChange !== 0 || !r2)) return false;
        if (changeFilter === 'not-assessed' && r2) return false;
      }

      return true;
    });

    // 2. 정렬
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        const aR1 = a.assessments.find(r => r.round === 1);
        const aR2 = a.assessments.find(r => r.round === 2);
        const bR1 = b.assessments.find(r => r.round === 1);
        const bR2 = b.assessments.find(r => r.round === 2);

        switch (sortField) {
          case 'number':
            aValue = a.number;
            bValue = b.number;
            break;
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'type1':
            aValue = aR1?.predictedType || '';
            bValue = bR1?.predictedType || '';
            break;
          case 'type2':
            aValue = aR2?.predictedType || '';
            bValue = bR2?.predictedType || '';
            break;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue);
        const bStr = String(bValue);
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  })();

  // 정렬 핸들러
  const handleSort = (field: 'number' | 'name' | 'type1' | 'type2') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
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
          <h1 className="text-2xl font-bold text-gray-900">{classData.grade}학년 {classData.classNumber}반</h1>
          <p className="text-gray-500">학생 {classData.stats?.totalStudents}명 | 검사 완료 {classData.stats?.assessedStudents}명</p>
        </div>
      </div>

      {/* 2칸 그리드: 유형 분포 + 학급 특성 */}
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
            <input type="text" placeholder="이름/번호 검색" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border rounded-lg text-sm" />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 pb-4 border-b">
          {/* 변화 상태 필터 */}
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-600 font-medium">변화 상태:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setChangeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  changeFilter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setChangeFilter('positive')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  changeFilter === 'positive'
                    ? 'bg-sky-500 text-white'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                }`}
              >
                긍정 변화
              </button>
              <button
                onClick={() => setChangeFilter('negative')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  changeFilter === 'negative'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                부정 변화
              </button>
              <button
                onClick={() => setChangeFilter('none')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  changeFilter === 'none'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                변화 없음
              </button>
              <button
                onClick={() => setChangeFilter('not-assessed')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  changeFilter === 'not-assessed'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                2차 미실시
              </button>
            </div>
          </div>

          {/* 필터 결과 표시 */}
          <div className="flex items-center justify-between text-sm pt-3">
            <span className="text-gray-600">
              {filteredAndSortedStudents.length}명 표시
              {changeFilter !== 'all' &&
                <span className="text-gray-400 ml-1">(전체 {classData.students.length}명)</span>
              }
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="text-left py-3 px-4 w-24">
                  <button
                    onClick={() => handleSort('number')}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                  >
                    번호
                    {sortField === 'number' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <ArrowUp className="w-3 h-3 opacity-30" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 w-32">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                  >
                    이름
                    {sortField === 'name' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <ArrowUp className="w-3 h-3 opacity-30" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 w-32">
                  <button
                    onClick={() => handleSort('type1')}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                  >
                    1차 유형
                    {sortField === 'type1' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <ArrowUp className="w-3 h-3 opacity-30" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4">1차 주요 키워드</th>
                <th className="text-left py-3 px-4 w-32">
                  <button
                    onClick={() => handleSort('type2')}
                    className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                  >
                    2차 유형
                    {sortField === 'type2' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <ArrowUp className="w-3 h-3 opacity-30" />
                    )}
                  </button>
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

                // 유형 변화 판단
                const typeChange = getTypeChange(r1?.predictedType, r2?.predictedType);
                const rowBgClass = typeChange === 1 ? 'bg-sky-50' : typeChange === -1 ? 'bg-red-50' : '';

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
