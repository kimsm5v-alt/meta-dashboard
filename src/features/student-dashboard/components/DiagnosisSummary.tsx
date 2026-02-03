import { useState, useEffect } from 'react';
import { generateAISummary, getSubCategoryResults } from '../../../shared/utils/summaryGenerator';
import type { StudentType } from '../../../shared/types';
import { Sparkles } from 'lucide-react';

interface DiagnosisSummaryProps {
  tScores: number[];
  studentType: StudentType;
}

export const DiagnosisSummary: React.FC<DiagnosisSummaryProps> = ({
  tScores,
  studentType,
}) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const subCategoryResults = getSubCategoryResults(tScores);
        const aiSummary = await generateAISummary(subCategoryResults, studentType);
        setSummary(aiSummary);
      } catch {
        setSummary('총평을 생성하는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [tScores, studentType]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-semibold text-gray-800">AI 분석 총평</h3>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-sm text-gray-500">AI가 분석 중입니다...</p>
          </div>
        </div>
      ) : (
        <div className="relative bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-indigo-600 border border-indigo-200">
              <Sparkles className="w-3 h-3" />
              <span>AI Insight</span>
            </div>
          </div>
          <p className="text-gray-800 whitespace-pre-line leading-relaxed text-[15px] pr-20">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
};

export default DiagnosisSummary;
