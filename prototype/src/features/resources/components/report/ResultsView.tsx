/**
 * 수업 결과보기 (목업 renderResults). 목록 ↔ 상세 인라인 전환.
 * rdReport 있으면 리포트 상세(Phase 5), 없으면 현황 + 목록.
 *
 * 미제출 학생 강조는 요약 패널 ↔ 카드 그리드가 공유해야 하므로 여기서 소유한다.
 * (필터가 아니라 강조라 상태 필터 축과 충돌하지 않는다 → 컨텍스트로 올릴 필요 없음)
 */
import { useEffect, useState } from 'react';
import { useResources } from '../../store/ResourcesContext';
import { StatusPanel } from './StatusPanel';
import { ReportFilterChips } from './ReportFilterChips';
import { ReportCardGrid } from './ReportCardGrid';
import { ReportDetail } from './ReportDetail';

export const ResultsView = () => {
  const { rdReport, scope } = useResources();
  const [highlightStudent, setHighlightStudent] = useState<string | null>(null);

  // 반이 바뀌면 다른 반 학생이 선택된 채로 남지 않게 해제
  useEffect(() => setHighlightStudent(null), [scope]);

  if (rdReport) return <ReportDetail />;

  return (
    <div>
      <div className="mt-5">
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900">수업 결과보기</h2>
        <p className="mt-0.5 text-sm text-gray-500">배포한 활동의 참여 현황을 한눈에 보고, 활동별 리포트로 상세 결과를 확인하세요.</p>
      </div>
      <StatusPanel selected={highlightStudent} onSelect={setHighlightStudent} />
      <ReportFilterChips />
      <ReportCardGrid highlightStudent={highlightStudent} />
    </div>
  );
};
