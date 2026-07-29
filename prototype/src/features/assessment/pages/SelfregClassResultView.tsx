/**
 * 자기조절학습검사 > 결과보기 > 반 결과 화면
 *
 * 학습종합검사(ClassResultView)와 동일한 구조
 * - LPA 유형 분포 제외
 * - 20개 요인 기준 분석 (3개 영역)
 * - 테마 색상: 틸(#009F88)
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle, Info, Search, ArrowRight, FileText, X, Download } from 'lucide-react';
import { useLayoutContext } from '@/app/LayoutV2';
import type { StudentExamResult } from '../types';
import {
  SELFREG_FACTOR_DEFINITIONS,
  SELFREG_DOMAIN_COLORS,
  SELFREG_DOMAIN_SOFT_COLORS,
  SELFREG_MAIN_CATEGORIES,
  SELFREG_SUB_CATEGORY_FACTORS,
  type SelfregCategory,
} from '@/shared/data/selfregFactors';

interface SelfregClassResultViewProps {
  className: string;
  onBack: () => void;
  onStudentClick: (studentId: string) => void;
  students?: StudentExamResult[];
}

// Mock 학교 정보
const MOCK_SCHOOL_INFO = {
  schoolName: '한빛중학교',
  eduLevel: '중학교',
};

// 자기조절검사용 20개 요인 목업 T점수 생성
const generateSelfregScores = (comprehensiveTScores: number[]): number[] => {
  const mapping: Array<number | number[]> = [
    2, 1, [19, 20], 25, 26, [35, 36],
    7, 8, 9, [7, 8, 9], [0, 1], [19, 20, 21],
    22, [17, 18], [19, 21], 10, 11, 12, 13, 14,
  ];

  return mapping.map((source) => {
    if (typeof source === 'number') {
      const val = comprehensiveTScores[source] ?? 50;
      if ([25, 26].includes(source)) return Math.round(100 - val);
      return Math.round(val);
    } else {
      const avg = source.reduce((sum, i) => sum + (comprehensiveTScores[i] ?? 50), 0) / source.length;
      if (source.includes(35) || source.includes(36)) return Math.round(100 - avg);
      return Math.round(avg);
    }
  });
};

// 학년/반 파싱
const parseClassName = (name: string) => {
  const match = name.match(/(\d+)-(\d+)/);
  if (match) {
    return `${match[1]}학년 ${match[2]}반`;
  }
  return name;
};

// 학생 목록 필터 타입
type StudentFilterType = 'all' | '신뢰도 주의' | '상담 및 지도 필요';

// 6개 중분류 정의 (학습종합검사 CategoryBarChart와 동일한 형식)
const SELFREG_SUB_CATEGORY_ORDER = [
  { id: 'learningMotivation', name: '학습원동력', area: '동기전략' as SelfregCategory, color: SELFREG_DOMAIN_COLORS['동기전략'] },
  { id: 'emotionControl', name: '정서조절', area: '동기전략' as SelfregCategory, color: SELFREG_DOMAIN_COLORS['동기전략'] },
  { id: 'metaCognition', name: '메타인지', area: '인지전략' as SelfregCategory, color: SELFREG_DOMAIN_COLORS['인지전략'] },
  { id: 'cognitiveLearningSkill', name: '인지적학습기술', area: '인지전략' as SelfregCategory, color: SELFREG_DOMAIN_COLORS['인지전략'], breakLine: ['인지적', '학습기술'] },
  { id: 'behaviorControl', name: '행동조절', area: '행동전략' as SelfregCategory, color: SELFREG_DOMAIN_COLORS['행동전략'] },
  { id: 'behavioralLearningSkill', name: '행동적학습기술', area: '행동전략' as SelfregCategory, color: SELFREG_DOMAIN_COLORS['행동전략'], breakLine: ['행동적', '학습기술'] },
];

// 중분류별 하위요인 인덱스 매핑 (SELFREG_SUB_CATEGORY_FACTORS와 동일)
const SUB_CATEGORY_TO_FACTOR_INDICES: Record<string, number[]> = {
  '학습원동력': [0, 1, 2],
  '정서조절': [3, 4, 5],
  '메타인지': [6, 7, 8],
  '인지적학습기술': [9, 10, 11],
  '행동조절': [12, 13, 14],
  '행동적학습기술': [15, 16, 17, 18, 19],
};

export const SelfregClassResultView: React.FC<SelfregClassResultViewProps> = ({
  className,
  onBack,
  onStudentClick,
  students = [],
}) => {
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);
  const [studentFilter, setStudentFilter] = useState<StudentFilterType>('all');
  const [studentSearch, setStudentSearch] = useState('');

  const hasRound2 = students.some(s => s.round === 2);

  // 응시 현황 (round > 0인 학생이 응시 완료)
  const assessmentStats = useMemo(() => {
    const total = students.length;
    const completed = students.filter(s => s.round && s.round > 0).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [students]);

  // 신뢰도 주의 학생 수
  const reliabilityWarningCount = useMemo(() => {
    return students.filter(s => s.hasReliabilityWarning).length;
  }, [students]);

  // 상담 필요 학생 수
  const needsAttentionCount = useMemo(() => {
    return students.filter(s => s.needsAttention).length;
  }, [students]);

  // 반 평균 T점수 계산 (20개 요인)
  const classAverageScores = useMemo(() => {
    if (students.length === 0) return Array(20).fill(50);

    const studentSelfregScores = students.map(s => generateSelfregScores(s.tScores));
    const avgScores: number[] = [];

    for (let i = 0; i < 20; i++) {
      const sum = studentSelfregScores.reduce((acc, scores) => acc + (scores[i] || 50), 0);
      avgScores.push(Math.round(sum / students.length));
    }

    return avgScores;
  }, [students]);

  // 영역별 평균 계산 (대분류)
  const domainAverages = useMemo(() => {
    const result: Record<SelfregCategory, number> = {
      '동기전략': 0,
      '인지전략': 0,
      '행동전략': 0,
    };

    SELFREG_FACTOR_DEFINITIONS.forEach((factor, idx) => {
      result[factor.category] += classAverageScores[idx] || 50;
    });

    result['동기전략'] = Math.round(result['동기전략'] / 6);
    result['인지전략'] = Math.round(result['인지전략'] / 6);
    result['행동전략'] = Math.round(result['행동전략'] / 8);

    return result;
  }, [classAverageScores]);

  // 중분류별 평균 점수 계산
  const subCategoryScores = useMemo(() => {
    const scores: Record<string, number> = {};
    SELFREG_SUB_CATEGORY_ORDER.forEach((subCat) => {
      const indices = SUB_CATEGORY_TO_FACTOR_INDICES[subCat.name] || [];
      if (indices.length === 0) {
        scores[subCat.id] = 50;
      } else {
        const sum = indices.reduce((acc, idx) => acc + (classAverageScores[idx] || 50), 0);
        scores[subCat.id] = Math.round(sum / indices.length);
      }
    });
    return scores;
  }, [classAverageScores]);

  // 강점/보완점 Top 3
  const { strengths, weaknesses } = useMemo(() => {
    const factorsWithScores = SELFREG_FACTOR_DEFINITIONS.map((factor, idx) => ({
      ...factor,
      score: classAverageScores[idx] || 50,
    }));

    const sorted = [...factorsWithScores].sort((a, b) => b.score - a.score);
    return {
      strengths: sorted.slice(0, 3),
      weaknesses: sorted.slice(-3).reverse(),
    };
  }, [classAverageScores]);

  // 필터링된 학생 목록
  const filteredStudents = useMemo(() => {
    let result = students;

    if (studentFilter === '신뢰도 주의') {
      result = result.filter(s => s.hasReliabilityWarning);
    } else if (studentFilter === '상담 및 지도 필요') {
      result = result.filter(s => s.needsAttention);
    }

    if (studentSearch.trim()) {
      const query = studentSearch.trim().toLowerCase();
      result = result.filter(
        s => s.name.toLowerCase().includes(query) || String(s.number).includes(query)
      );
    }

    return result;
  }, [students, studentFilter, studentSearch]);

  // 보고서 다운로드 모달 상태
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'class' | 'student'>('class');
  const [reportRound, setReportRound] = useState<1 | 2>(1);
  const [reportFormat, setReportFormat] = useState<'detail' | 'summary'>('detail');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [modalStudentSearch, setModalStudentSearch] = useState('');

  const modalFilteredStudents = useMemo(() => {
    if (!modalStudentSearch.trim()) return students;
    const term = modalStudentSearch.toLowerCase();
    return students.filter(
      s => s.name.toLowerCase().includes(term) || s.number.toString().includes(term)
    );
  }, [students, modalStudentSearch]);

  const handleToggleAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleConfirmDownload = () => {
    const roundText = reportRound === 1 ? '1차' : '2차';
    const typeText = reportType === 'class' ? '학급용' : '교사용';
    const formatText = reportFormat === 'detail' ? '상세' : '요약';
    const studentText = reportType === 'class' ? `${selectedStudents.length}명` : '전체';

    alert(
      `${roundText} ${typeText} ${formatText} 보고서 다운로드\n대상: ${studentText}\n\n프로토타입에서는 실제 다운로드가 구현되지 않았습니다.`
    );
    setShowReportModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{className}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {MOCK_SCHOOL_INFO.schoolName} · {MOCK_SCHOOL_INFO.eduLevel} {parseClassName(className)}
            </p>
          </div>
        </div>

        {/* 보고서 다운로드 버튼 */}
        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <FileText className="w-5 h-5" />
          보고서 다운로드
        </button>
      </div>

      {/* 1. 학급 요약 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">학급 요약</h3>
        <div className="grid grid-cols-4 gap-4">
          {/* 응시 현황 */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">응시 현황</p>
            <p className="text-lg font-semibold text-gray-900">
              {assessmentStats.completed} / {assessmentStats.total}명
            </p>
            <p className="text-xs text-teal-600 font-medium">{assessmentStats.rate}%</p>
          </div>

          {/* 검사 회차 */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">검사 회차</p>
            <p className="text-lg font-semibold text-gray-900">{hasRound2 ? '2' : '1'}차 검사</p>
            <p className="text-xs text-blue-600 font-medium">완료</p>
          </div>

          {/* 상담 및 지도 필요 */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">상담 및 지도 필요</p>
            <p className="text-lg font-semibold text-gray-900">{needsAttentionCount}명</p>
            <p className="text-xs text-orange-600 font-medium">상담 권장</p>
          </div>

          {/* 신뢰도 */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">신뢰도</p>
            <p className="text-lg font-semibold text-gray-900">{reliabilityWarningCount}명</p>
            <p className="text-xs text-orange-600 font-medium">
              {reliabilityWarningCount > 0 ? '주의 필요' : '양호'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. 종합 결과 요약 (6개 중분류 막대 그래프) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">종합 결과 요약</h3>
            <p className="text-sm text-gray-500 mt-1">
              6개 중분류 하위요인의 반 평균 T점수입니다.
            </p>
          </div>
          {/* 회차 토글 */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedRound(1)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                selectedRound === 1
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              1차 검사
            </button>
            <button
              onClick={() => setSelectedRound(2)}
              disabled={!hasRound2}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                selectedRound === 2
                  ? 'bg-teal-600 text-white'
                  : hasRound2
                    ? 'text-gray-600 hover:bg-gray-200'
                    : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              2차 검사 {!hasRound2 && '예정'}
            </button>
          </div>
        </div>

        {/* 막대 차트 */}
        <SelfregSubCategoryBarChart scores={subCategoryScores} />

        {/* 참고 문구 */}
        <div className="mt-4 px-4 py-2 bg-gray-50 rounded-lg text-xs text-gray-600">
          <strong className="text-gray-700">참고!</strong> T점수 50은 전국 평균입니다. 50 이상이면 평균 이상, 이하이면 평균 이하입니다.
        </div>
      </div>

      {/* 3. 우리 반 강점/보완점 Top 3 + 학생 목록 (통합 섹션) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* 섹션 헤더 - 회차 토글 */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900">학급 분석 및 학생 목록</h3>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedRound(1)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                selectedRound === 1
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              1차 검사
            </button>
            <button
              onClick={() => setSelectedRound(2)}
              disabled={!hasRound2}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                selectedRound === 2
                  ? 'bg-teal-600 text-white'
                  : hasRound2
                    ? 'text-gray-600 hover:bg-gray-200'
                    : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              2차 검사 {!hasRound2 && '예정'}
            </button>
          </div>
        </div>

        {/* 우리 반 강점/보완점 Top 3 */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">우리 반 강점 / 보완점 Top 3</h4>
          <div className="flex gap-6">
            {/* 강점 */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                </span>
                <span className="text-sm font-bold text-emerald-800">주요 강점</span>
              </div>
              <div className="flex gap-2">
                {strengths.map((item, index) => (
                  <SelfregFactorCard key={index} item={item} index={index} accent="emerald" />
                ))}
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-px bg-gray-200 self-stretch" />

            {/* 보완점 */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-5 h-5 rounded bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-3 h-3 text-red-600" strokeWidth={3} />
                </span>
                <span className="text-sm font-bold text-red-800">주요 보완점</span>
              </div>
              <div className="flex gap-2">
                {weaknesses.map((item, index) => (
                  <SelfregFactorCard key={index} item={item} index={index} accent="red" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-100 my-5" />

        {/* 학생 목록 */}
        {students.length > 0 && (
          <div>
            {/* 헤더 */}
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-700">학생 목록</h4>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                  <p className="text-gray-200 leading-relaxed">
                    학생 카드를 클릭하면 개별 상세 분석으로 이동합니다.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 mb-4">학생별 강점/보완점 요인을 확인하세요. 카드 클릭 시 상세 분석으로 이동합니다.</p>

            {/* 필터 및 검색 영역 */}
            <div className="flex items-center justify-between mb-4">
              {/* 필터 버튼 그룹 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setStudentFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    studentFilter === 'all'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setStudentFilter('신뢰도 주의')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    studentFilter === '신뢰도 주의'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  신뢰도 주의
                </button>
                <button
                  onClick={() => setStudentFilter('상담 및 지도 필요')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    studentFilter === '상담 및 지도 필요'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  상담 및 지도 필요
                </button>
              </div>

              {/* 검색창 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름/번호 검색"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 w-48 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                해당 조건에 맞는 학생이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-3">
                {filteredStudents.map((student) => {
                  const selfregScores = generateSelfregScores(student.tScores);
                  // round가 0이면 미응시 (1 이상이면 응시 완료)
                  const hasNoAssessment = !student.round || student.round === 0;

                  // 학생별 강점/보완점 계산
                  const studentFactorsWithScores = SELFREG_FACTOR_DEFINITIONS.map((factor, idx) => ({
                    ...factor,
                    score: selfregScores[idx] || 50,
                  }));
                  const sortedFactors = [...studentFactorsWithScores].sort((a, b) => b.score - a.score);
                  const studentStrength = sortedFactors[0];
                  const studentWeakness = sortedFactors[sortedFactors.length - 1];

                  return (
                    <div
                      key={student.id}
                      onClick={() => onStudentClick(student.id)}
                      className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-teal-200 transition-colors cursor-pointer"
                    >
                      {/* 첫 줄: 번호 + 이름 + 배지 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-gray-500">{student.number}번</span>
                          <span className="font-semibold text-sm text-gray-900">{student.name}</span>
                        </div>
                        {!hasNoAssessment && (student.needsAttention || student.hasReliabilityWarning) && (
                          <div className="flex gap-1">
                            {student.needsAttention && (
                              <span
                                className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-medium border border-amber-200 text-amber-600"
                                title={student.attentionReason}
                              >
                                상담 및 지도 필요
                              </span>
                            )}
                            {student.hasReliabilityWarning && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-red-200 text-red-500"
                                title={student.reliabilityWarningReason}
                              >
                                신뢰도
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 강점/보완점 요인 표시 */}
                      {hasNoAssessment ? (
                        <span className="text-xs text-gray-400 italic">응시 전</span>
                      ) : (
                        <div className="space-y-1.5 text-xs">
                          {/* 대표 강점 */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400 flex-shrink-0">대표 강점</span>
                            <span
                              className="px-1.5 py-0.5 rounded-full text-[10px] font-medium truncate"
                              style={{
                                backgroundColor: SELFREG_DOMAIN_SOFT_COLORS[studentStrength.category],
                                color: SELFREG_DOMAIN_COLORS[studentStrength.category],
                              }}
                              title={studentStrength.name}
                            >
                              {studentStrength.name}
                            </span>
                          </div>
                          {/* 대표 보완점 */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400 flex-shrink-0">대표 보완점</span>
                            <span
                              className="px-1.5 py-0.5 rounded-full text-[10px] font-medium truncate"
                              style={{
                                backgroundColor: SELFREG_DOMAIN_SOFT_COLORS[studentWeakness.category],
                                color: SELFREG_DOMAIN_COLORS[studentWeakness.category],
                              }}
                              title={studentWeakness.name}
                            >
                              {studentWeakness.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 보고서 다운로드 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">보고서 다운로드</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 내용 */}
            <div className="px-6 py-4 space-y-4">
              {/* 보고서 종류 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  보고서 종류
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReportType('class')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      reportType === 'class'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    학급 개별 보고서
                  </button>
                  <button
                    onClick={() => setReportType('student')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      reportType === 'student'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    교사용 보고서
                  </button>
                </div>
              </div>

              {/* 차수 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">차수</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReportRound(1)}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      reportRound === 1
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    1차 검사
                  </button>
                  <button
                    onClick={() => setReportRound(2)}
                    disabled={!hasRound2}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      reportRound === 2
                        ? 'bg-teal-600 text-white'
                        : hasRound2
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    2차 검사
                  </button>
                </div>
              </div>

              {/* 형식 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">형식</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReportFormat('detail')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      reportFormat === 'detail'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    상세 보고서
                  </button>
                  <button
                    onClick={() => setReportFormat('summary')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      reportFormat === 'summary'
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    요약 보고서
                  </button>
                </div>
              </div>

              {/* 대상 학생 선택 */}
              {reportType === 'class' && students.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">
                      대상 학생 선택
                    </label>
                    <button
                      onClick={handleToggleAllStudents}
                      className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                    >
                      {selectedStudents.length === students.length ? '전체 선택 해제' : '전체 선택'}
                    </button>
                  </div>

                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="이름 또는 번호 검색..."
                      value={modalStudentSearch}
                      onChange={(e) => setModalStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-0">
                      {modalFilteredStudents.map((student) => (
                        <label
                          key={student.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-r border-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleToggleStudent(student.id)}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-700">
                            {student.number}. {student.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    {selectedStudents.length}명 선택됨
                  </p>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDownload}
                disabled={reportType === 'class' && selectedStudents.length === 0}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  reportType === 'class' && selectedStudents.length === 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                <Download className="w-4 h-4" />
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 코칭 연결 버튼 */}
      <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
        <ClassCoachingLinkButton className={className} />
      </div>
    </div>
  );
};

/** 코칭 연결 버튼 */
const ClassCoachingLinkButton: React.FC<{ className: string }> = () => {
  const navigate = useNavigate();
  const { scope } = useLayoutContext();

  const handleClick = () => {
    const params = new URLSearchParams();
    if (scope.classId) params.set('class', scope.classId);
    const queryString = params.toString();
    navigate(`/coaching/class${queryString ? `?${queryString}` : ''}`);
    window.scrollTo(0, 0);
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
    >
      <span>학급 코칭 연결</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  );
};

// 6개 중분류 막대 차트 (학습종합검사 CategoryBarChart와 동일한 구조)
interface SelfregSubCategoryBarChartProps {
  scores: Record<string, number>;
}

const SelfregSubCategoryBarChart: React.FC<SelfregSubCategoryBarChartProps> = ({ scores }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const pad = { l: 70, r: 16, t: 16, b: 90 };
  const n = SELFREG_SUB_CATEGORY_ORDER.length; // 6개
  const colGap = 20;
  const innerW = containerWidth - pad.l - pad.r;
  const colW = Math.max(40, (innerW - colGap * (n - 1)) / n);
  const barW = Math.min(50, colW);
  const height = 360;
  const plotH = height - pad.t - pad.b;

  const yOf = (t: number) => pad.t + (1 - t / 100) * plotH;

  // 막대 색상 결정 (모두 긍정 요인이므로 높을수록 좋음)
  const getBarTone = (t: number) => {
    const isNormal = t >= 40 && t < 60;
    if (isNormal) {
      return { fill: '#EDEDF0', stroke: '#D4D4D8', labelColor: '#71717A' };
    }
    const isHigh = t >= 60;
    if (isHigh) {
      return { fill: '#E3F4E9', stroke: '#A9DCBC', labelColor: '#16A34A' };
    }
    return { fill: '#FDE7E4', stroke: '#F0B5AC', labelColor: '#DC2626' };
  };

  const bands = [
    { from: 70, to: 100, label: '매우높음', fill: '#FFFFFF' },
    { from: 60, to: 70, label: '높음', fill: '#FFFFFF' },
    { from: 40, to: 60, label: '보통', fill: '#F7F7F8' },
    { from: 30, to: 40, label: '낮음', fill: '#FFFFFF' },
    { from: 0, to: 30, label: '매우낮음', fill: '#FFFFFF' },
  ];

  // 영역별 그룹 (중분류 인덱스 기준)
  const areaGroups = useMemo(() => {
    const groups: { area: SelfregCategory; color: string; cols: typeof SELFREG_SUB_CATEGORY_ORDER }[] = [];
    let currentArea: SelfregCategory | '' = '';
    let currentGroup: typeof SELFREG_SUB_CATEGORY_ORDER = [];

    SELFREG_SUB_CATEGORY_ORDER.forEach((cat, idx) => {
      if (cat.area !== currentArea) {
        if (currentGroup.length > 0 && currentArea) {
          groups.push({ area: currentArea, color: SELFREG_DOMAIN_COLORS[currentArea], cols: currentGroup });
        }
        currentArea = cat.area;
        currentGroup = [cat];
      } else {
        currentGroup.push(cat);
      }
      if (idx === SELFREG_SUB_CATEGORY_ORDER.length - 1 && currentArea) {
        groups.push({ area: currentArea, color: SELFREG_DOMAIN_COLORS[currentArea], cols: currentGroup });
      }
    });

    return groups;
  }, []);

  const totalW = pad.l + innerW + pad.r;

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <svg width={totalW} height={height} className="block">
        {/* 등급 배경 밴드 */}
        {bands.map((b) => {
          const y = yOf(b.to);
          const h = yOf(b.from) - yOf(b.to);
          return (
            <g key={b.label}>
              <rect x={pad.l} y={y} width={innerW} height={h} fill={b.fill} />
              <text x={pad.l - 32} y={y + h / 2 + 4} textAnchor="end" fontSize="10" fill="#A1A1A8" fontWeight="600">
                {b.label}
              </text>
            </g>
          );
        })}

        {/* 수평선 */}
        {[0, 20, 40, 50, 60, 80, 100].map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              y1={yOf(t)}
              x2={pad.l + innerW}
              y2={yOf(t)}
              stroke={t === 50 ? '#009F88' : '#E5E5E7'}
              strokeWidth={t === 50 ? 1.3 : 0.7}
              strokeDasharray={t === 50 ? '4 4' : '0'}
            />
            <text x={pad.l - 8} y={yOf(t) + 4} textAnchor="end" fontSize="10.5" fill="#71717A">
              {t}
            </text>
          </g>
        ))}

        {/* 전국 평균 안내 */}
        <text x={totalW - pad.r} y={20} textAnchor="end" fontSize={11} fill="#9CA3AF">
          점선: T=50 (전국 평균)
        </text>

        {/* 막대 */}
        {SELFREG_SUB_CATEGORY_ORDER.map((cat, idx) => {
          const t = scores[cat.id] || 50;
          const x = pad.l + idx * (colW + colGap);
          const barH = (t / 100) * plotH;
          const barX = x + (colW - barW) / 2;
          const y = yOf(t);
          const tone = getBarTone(t);

          return (
            <g key={cat.id}>
              <rect
                x={barX}
                y={y}
                width={barW}
                height={barH}
                rx="3"
                fill={tone.fill}
                stroke={tone.stroke}
                strokeWidth={1}
              >
                <title>{`${cat.name} T ${t}`}</title>
              </rect>
              <text
                x={x + colW / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                fill={tone.labelColor}
              >
                {t}
              </text>
              <text x={x + colW / 2} y={height - pad.b + 16} textAnchor="middle" fontSize="10" fill="#52525B">
                {cat.breakLine ? (
                  <>
                    <tspan x={x + colW / 2} dy="0">
                      {cat.breakLine[0]}
                    </tspan>
                    <tspan x={x + colW / 2} dy="12">
                      {cat.breakLine[1]}
                    </tspan>
                  </>
                ) : (
                  cat.name
                )}
              </text>
            </g>
          );
        })}

        {/* 영역 라벨 (하단) */}
        {(() => {
          let colIdx = 0;
          return areaGroups.map((g) => {
            const startX = pad.l + colIdx * (colW + colGap);
            const endX = pad.l + (colIdx + g.cols.length - 1) * (colW + colGap) + colW;
            colIdx += g.cols.length;

            return (
              <g key={g.area}>
                <line
                  x1={startX}
                  y1={height - pad.b + 56}
                  x2={endX}
                  y2={height - pad.b + 56}
                  stroke={g.color}
                  strokeWidth="2"
                />
                <text
                  x={(startX + endX) / 2}
                  y={height - pad.b + 72}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill={g.color}
                >
                  {g.area}
                </text>
              </g>
            );
          });
        })()}
      </svg>
    </div>
  );
};

// 강점/보완점 카드 스타일
const ACCENT_STYLES = {
  emerald: {
    cardBg: 'rgba(16, 185, 129, 0.05)',
    cardBorder: '#a7f3d0',
    rank: '#10b981',
    score: '#059669',
  },
  red: {
    cardBg: 'rgba(239, 68, 68, 0.05)',
    cardBorder: '#fecaca',
    rank: '#ef4444',
    score: '#dc2626',
  },
} as const;

// 강점/보완점 요인 카드
interface SelfregFactorCardProps {
  item: { name: string; category: SelfregCategory; description: string; score: number };
  index: number;
  accent: 'emerald' | 'red';
}

const SelfregFactorCard: React.FC<SelfregFactorCardProps> = ({ item, index, accent }) => {
  const styles = ACCENT_STYLES[accent];
  const domainColor = SELFREG_DOMAIN_COLORS[item.category];

  return (
    <div
      className="flex-1 p-3 rounded-lg border"
      style={{
        backgroundColor: styles.cardBg,
        borderColor: styles.cardBorder,
      }}
    >
      {/* 영역 태그 */}
      <span
        className="text-[11px] font-semibold inline-block mb-1"
        style={{ color: domainColor }}
      >
        #{item.category}
      </span>

      {/* 순위 + 요인명 */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="text-xs font-bold"
          style={{ color: styles.rank }}
        >
          {index + 1}
        </span>
        <p className="text-sm font-semibold text-gray-800">{item.name}</p>
      </div>

      {/* 설명 */}
      <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
    </div>
  );
};

export default SelfregClassResultView;
