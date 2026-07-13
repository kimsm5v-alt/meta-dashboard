import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Download, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { Card } from '@/shared/components';
import type { Class, Assessment } from '@/shared/types';
import { FACTOR_DEFINITIONS } from '@/shared/data/factors';
import { SELFREG_FACTOR_DEFINITIONS } from '@/shared/data/selfregFactors';
import { convertToSelfregScores } from '@/shared/utils/classComparisonUtils';
import { TYPE_COLORS, getTypeChangeScore } from '../../utils/typeUtils';
import { formatAttentionTooltip } from '@/shared/utils/attentionChecker';

type TestId = 'comprehensive' | 'selfreg';
type FilterType = 'all' | 'reliability-warning' | 'need-attention' | 'type-change';

interface StudentListTabProps {
  classData: Class;
  testId: TestId;
  hasLPA: boolean;
}

// 필터 옵션 (4가지)
const FILTER_OPTIONS: { id: FilterType; label: string; description: string }[] = [
  { id: 'all', label: '전체', description: '모든 학생' },
  { id: 'reliability-warning', label: '신뢰도 주의', description: '응답 신뢰도가 낮은 학생' },
  { id: 'need-attention', label: '관심 필요', description: '관심이 필요한 학생' },
  { id: 'type-change', label: '유형 변화', description: '유형이 변화한 학생' },
];

export const StudentListTab: React.FC<StudentListTabProps> = ({
  classData,
  testId,
  hasLPA,
}) => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // 보고서 다운로드 모달 상태
  const [reportType, setReportType] = useState<'student' | 'teacher'>('student');
  const [reportRound, setReportRound] = useState<'1' | '2' | 'both'>('1');
  const [reportFormat, setReportFormat] = useState<'detail' | 'summary'>('detail');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  const hasRound2 = classData.students.some(s =>
    s.assessments.some(a => a.round === 2)
  );

  // 2차 검사 종료 여부 (모든 학생이 2차 검사 완료)
  const isRound2Completed = hasRound2 && classData.students.every(s =>
    s.assessments.some(a => a.round === 2)
  );

  // 학생 필터링
  const filteredStudents = useMemo(() => {
    return classData.students.filter(student => {
      // 검색 필터
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!student.name.toLowerCase().includes(term) &&
            !student.number.toString().includes(term)) {
          return false;
        }
      }

      // 유형 필터
      const r1 = student.assessments.find(a => a.round === 1);
      const r2 = student.assessments.find(a => a.round === 2);
      const typeChange = getTypeChangeScore(r1?.predictedType, r2?.predictedType);

      switch (filter) {
        case 'reliability-warning':
          return student.assessments.some(a => a.reliabilityWarnings.length > 0);
        case 'need-attention':
          return student.assessments.some(a => a.attentionResult.needsAttention);
        case 'type-change':
          return typeChange === 1 || typeChange === -1; // 긍정 또는 부정 변화
        default:
          return true;
      }
    });
  }, [classData.students, searchTerm, filter]);

  // 학생 클릭 핸들러
  const handleStudentClick = (studentId: string) => {
    navigate(`/dashboard/${testId}/class/${classId}/student/${studentId}`);
  };

  // 상태 배지 렌더링 (이름 옆에 인라인으로 표시)
  const renderStatusBadges = (assessment: Assessment | undefined) => {
    if (!assessment) return null;

    const hasReliability = assessment.reliabilityWarnings.length > 0;
    const hasAttention = assessment.attentionResult.needsAttention;

    if (!hasReliability && !hasAttention) return null;

    return (
      <>
        {hasReliability && (
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-red-100 text-red-600"
            title={`신뢰도 주의: ${assessment.reliabilityWarnings.join(', ')}`}
          >
            <ShieldAlert className="w-2.5 h-2.5" />
            신뢰도
          </span>
        )}
        {hasAttention && (
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-amber-100 text-amber-600"
            title={formatAttentionTooltip(assessment.attentionResult)}
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            관심
          </span>
        )}
      </>
    );
  };

  // 유형 배지 렌더링 (연한 배경 + 색상 글씨, 둥근 pill 형태)
  const renderTypeBadge = (type: string) => {
    const color = TYPE_COLORS[type] || '#9CA3AF';
    return (
      <span
        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
        style={{
          backgroundColor: `${color}18`, // 10% opacity
          color: color,
        }}
      >
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 학생 목록 영역 - 전체를 Card로 감쌈 */}
      <Card className="!p-0 overflow-hidden">
        {/* 헤더: 제목 + 툴팁 + 보고서 다운로드 */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                학생 목록 {filteredStudents.length}명
                {filter !== 'all' && (
                  <span className="text-sm font-normal text-gray-400 ml-1">(전체 {classData.students.length}명)</span>
                )}
              </h3>
              <button
                onClick={() => setShowInfoModal(true)}
                className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                title="배지 기준 안내"
              >
                <Info className="w-3 h-3 text-gray-600" />
              </button>
            </div>
            {/* 보고서 다운로드 */}
            <button
              onClick={() => setShowDownloadModal(true)}
              className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              보고서 다운로드
            </button>
          </div>
          <p className="text-sm text-gray-500">
            학생 이름을 클릭하면 개별 상세 분석으로 이동합니다.
          </p>
        </div>

        {/* 필터 + 검색 영역 */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {/* 필터 버튼들 (둥근 pill 스타일) */}
            <div className="flex items-center gap-1.5">
              {FILTER_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setFilter(option.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === option.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                  }`}
                  title={option.description}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="이름 또는 번호 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
        </div>

        {/* 학생 카드 그리드 - 5열 */}
        <div className="p-5">
          <div className="grid grid-cols-5 gap-4">
        {filteredStudents.map(student => {
          const r1 = student.assessments.find(a => a.round === 1);
          const r2 = student.assessments.find(a => a.round === 2);

          return (
            <div
              key={student.id}
              className="p-3 cursor-pointer bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-indigo-200 transition-all"
              onClick={() => handleStudentClick(student.id)}
            >
              {/* 학생 정보 헤더: 번호, 이름, 배지 (배지는 우측 정렬) */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-xs text-gray-400">{student.number}번</span>
                <span className="text-sm font-semibold text-gray-900">{student.name}</span>
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                  {renderStatusBadges(r1 || r2)}
                </div>
              </div>

              {/* LPA 유형 (2줄로 표시) */}
              {hasLPA && (
                <div className="space-y-1.5">
                  {/* 1차 유형 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 w-5">1차</span>
                    {r1 ? renderTypeBadge(r1.predictedType) : (
                      <span className="text-[11px] text-gray-300">-</span>
                    )}
                  </div>

                  {/* 2차 유형 */}
                  {hasRound2 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-5">2차</span>
                      {r2 ? renderTypeBadge(r2.predictedType) : (
                        <span className="text-[11px] text-gray-300">미실시</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* LPA가 없는 경우: 강점/관심 요인 표시 (요인명으로) */}
              {!hasLPA && r1 && (() => {
                // 자기조절학습검사: 20개 요인으로 변환
                const scores = testId === 'selfreg'
                  ? convertToSelfregScores(r1.tScores)
                  : r1.tScores;
                const factorDefs = testId === 'selfreg'
                  ? SELFREG_FACTOR_DEFINITIONS
                  : FACTOR_DEFINITIONS;

                const scoredFactors = scores
                  .map((score, idx) => ({
                    idx,
                    score,
                    name: factorDefs[idx]?.name || `요인${idx + 1}`,
                  }));

                // 강점: 점수 높은 순 (모두 positive)
                const strengths = [...scoredFactors]
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 2);

                // 관심: 점수 낮은 순 (모두 positive)
                const concerns = [...scoredFactors]
                  .sort((a, b) => a.score - b.score)
                  .slice(0, 2);

                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 shrink-0">강점</span>
                      <div className="flex flex-wrap gap-1">
                        {strengths.map(({ idx, name }) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded truncate max-w-[70px]"
                            title={name}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 shrink-0">관심</span>
                      <div className="flex flex-wrap gap-1">
                        {concerns.map(({ idx, name }) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-red-50 text-red-700 text-[10px] font-medium rounded truncate max-w-[70px]"
                            title={name}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
              </div>
            );
          })}
          </div>

          {/* 결과 없음 */}
          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>검색 조건에 맞는 학생이 없습니다.</p>
            </div>
          )}
        </div>
      </Card>

      {/* 배지 안내 팝업 */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInfoModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">배지 안내</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(85vh-60px)]">
              {/* 관심 배지 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    관심
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  학생의 38개 심리 요인 중 평균과 큰 차이를 보이는 지표가 일정 수 이상일 때 표시됩니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">표시 기준</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• 평균에서 매우 크게 벗어난 지표가 <span className="font-semibold">2개 이상</span></li>
                    <li>• 또는, 경계 수준 지표가 <span className="font-semibold">5개 이상</span></li>
                  </ul>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  배지가 뜬 학생의 결과지를 확인하거나 개별 면담을 고려해보세요.
                </p>
              </div>

              <hr className="border-gray-200" />

              {/* 신뢰도 배지 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-600">
                    <ShieldAlert className="w-4 h-4" />
                    신뢰도
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  검사 결과를 해석하기 전에, 학생이 성실하게 응답했는지 확인이 필요합니다. 아래 3개 지표 중 하나라도 '주의'로 나타나면 결과의 신뢰성이 떨어집니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">표시 기준 — 아래 3개 지표 중 하나라도 '주의'일 때</p>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold text-gray-800">1. 반응 일관성</p>
                      <ul className="text-gray-600 mt-1 space-y-0.5">
                        <li>• 동일하거나 유사한 문항에 일관되게 응답했는지 평가</li>
                        <li>• 낮을 경우, 학생이 문항을 충분히 숙고하지 않았을 가능성이 있음</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">2. 사회적 바람직성</p>
                      <ul className="text-gray-600 mt-1 space-y-0.5">
                        <li>• 타인에게 긍정적 이미지를 보이려는 응답 경향을 측정</li>
                        <li>• 점수가 높으면 실제 상태보다 긍정적으로 응답했을 가능성이 있음</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">3. 연속 동일 반응</p>
                      <ul className="text-gray-600 mt-1 space-y-0.5">
                        <li>• 특정 유형의 응답이 지나치게 반복되었는지 평가</li>
                        <li>• 많은 연속 동일 반응 문항이 있다면, 성실하게 답변하지 않았을 가능성이 있음</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  결과 해석 시 참고로만 활용하시고, 필요시 재검사나 면담으로 보완할 수 있습니다.
                </p>
              </div>

              {/* 집계 안내 */}
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800 leading-relaxed">
                  <span className="font-semibold">📌 신뢰도 주의 학생은 반 평균·유형 분포 등 대시보드 집계에서 제외됩니다.</span> 단, 반 전원이 신뢰도 주의인 경우에는 부득이 집계에 포함됩니다.
                </p>
              </div>

              {/* 공통 안내 */}
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-400 leading-relaxed">
                  두 배지 모두 학생의 상태를 단정하기 위한 것이 아닙니다. 교사의 관찰과 판단을 돕는 참고 신호로 활용해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 보고서 다운로드 모달 */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDownloadModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">보고서 다운로드</h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(85vh-130px)]">
              {/* 보고서 종류 */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">보고서 종류</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReportType('student')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      reportType === 'student'
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    학생 개별 보고서
                  </button>
                  <button
                    onClick={() => setReportType('teacher')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      reportType === 'teacher'
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    교사용 반 보고서
                  </button>
                </div>
              </div>

              {/* 차수 선택 */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">차수</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReportRound('1')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      reportRound === '1'
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    1차 검사
                  </button>
                  <button
                    onClick={() => isRound2Completed && setReportRound('2')}
                    disabled={!isRound2Completed}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      reportRound === '2'
                        ? 'bg-indigo-600 text-white'
                        : !isRound2Completed
                          ? 'border border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    2차 검사
                  </button>
                  {/* 1차+2차는 학생 개별 보고서에서만 */}
                  {reportType === 'student' && (
                    <button
                      onClick={() => isRound2Completed && setReportRound('both')}
                      disabled={!isRound2Completed}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        reportRound === 'both'
                          ? 'bg-indigo-600 text-white'
                          : !isRound2Completed
                            ? 'border border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      1차+2차
                    </button>
                  )}
                </div>
                {!isRound2Completed && hasRound2 && (
                  <p className="text-xs text-amber-600 mt-1.5">2차 검사 진행 중입니다. 종료 후 선택 가능합니다.</p>
                )}
                {!hasRound2 && (
                  <p className="text-xs text-gray-400 mt-1.5">2차 검사 미실시</p>
                )}
              </div>

              {/* 형식 선택 (학생 개별 보고서에서만) */}
              {reportType === 'student' && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">형식</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReportFormat('detail')}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        reportFormat === 'detail'
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      상세 보고서
                    </button>
                    <button
                      onClick={() => setReportFormat('summary')}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        reportFormat === 'summary'
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      요약 보고서
                    </button>
                  </div>
                </div>
              )}

              {/* 대상 학생 선택 (학생 개별 보고서인 경우만) */}
              {reportType === 'student' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">대상 학생 선택</p>
                    <button
                      onClick={() => {
                        if (selectedStudentIds.size === classData.students.length) {
                          setSelectedStudentIds(new Set());
                        } else {
                          setSelectedStudentIds(new Set(classData.students.map(s => s.id)));
                        }
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {selectedStudentIds.size === classData.students.length ? '전체 해제' : '전체 선택'}
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto p-2">
                    <div className="grid grid-cols-2 gap-1">
                      {classData.students
                        .sort((a, b) => a.number - b.number)
                        .map(student => (
                          <label
                            key={student.id}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.has(student.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedStudentIds);
                                if (e.target.checked) {
                                  newSet.add(student.id);
                                } else {
                                  newSet.delete(student.id);
                                }
                                setSelectedStudentIds(newSet);
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-500 w-6">{student.number}</span>
                            <span className="text-sm text-gray-900">{student.name}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    {selectedStudentIds.size}명 선택됨
                  </p>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  alert('보고서 다운로드 기능은 구현 예정입니다.');
                  setShowDownloadModal(false);
                }}
                disabled={reportType === 'student' && selectedStudentIds.size === 0}
                className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  reportType === 'student' && selectedStudentIds.size === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
