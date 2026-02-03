import { useState, useEffect } from 'react';
import { Sparkles, Edit3, Copy, Download, Check, Loader2, AlertTriangle } from 'lucide-react';
import { schoolRecordService } from '@/shared/services/schoolRecordService';

interface SchoolRecordPanelProps {
  studentId: string;
  classId: string;
  tScores: number[];
  predictedType: string;
}

export const SchoolRecordPanel: React.FC<SchoolRecordPanelProps> = ({
  studentId,
  tScores,
  predictedType,
}) => {
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [editContent, setEditContent] = useState('');

  // 초기 로드 시 저장된 문구 가져오기
  useEffect(() => {
    loadSavedContent();
  }, [studentId]);

  const loadSavedContent = async () => {
    try {
      const saved = await schoolRecordService.getSavedByStudentId(studentId);
      if (saved.length > 0) {
        setContent(saved[0].content);
      }
    } catch {
      // 에러 무시
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await schoolRecordService.generate({
        studentId,
        tScores,
        predictedType,
        category: 'comprehensive',
      });
      setContent(response.content);
    } catch {
      setContent('생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setEditContent(content);
    setIsEditing(true);
  };

  const handleSave = () => {
    setContent(editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownload = () => {
    // 간단한 텍스트 파일 다운로드
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `생활기록부_${studentId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span>생활기록부</span>
        </h3>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          자동 생성
        </button>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="bg-gray-50 rounded-xl p-4 min-h-[200px]">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full h-40 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        ) : content ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Sparkles className="w-8 h-8 mb-2 stroke-1" />
            <p className="text-sm">자동 생성 버튼을 눌러</p>
            <p className="text-sm">생활기록부 문구를 생성하세요</p>
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      {content && !isEditing && (
        <div className="space-y-2">
          <button
            onClick={handleEdit}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <Edit3 className="w-4 h-4" />
              수정하기
            </span>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm text-gray-700">
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  복사하기
                </>
              )}
            </span>
            <span className="text-gray-400">→</span>
          </button>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <Download className="w-4 h-4" />
              파일 다운로드
            </span>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      )}

      {/* 경고 메시지 */}
      <div className="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          심리·정서 검사 관련 용어는 대학에서 선호하지 않을 수 있습니다.
          필요시 일반적인 표현으로 수정하여 사용하세요.
        </p>
      </div>
    </div>
  );
};
