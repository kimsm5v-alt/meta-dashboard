/**
 * 관찰 메모 에디터
 *
 * 학생에 대한 간단한 관찰 기록 작성
 * - 카테고리 선택 (행동, 학습, 교우관계, 정서, 기타)
 * - 관찰 일자 선택
 * - 내용 작성
 */

import { useState } from 'react';
import { Save } from 'lucide-react';
import type { ObservationCategory } from '../types';
import { OBSERVATION_CATEGORY_LABELS } from '../types';

interface ObservationMemoEditorProps {
  studentId: string;
  studentName: string;
  onSave?: (data: ObservationMemoData) => void;
}

export interface ObservationMemoData {
  studentId: string;
  category: ObservationCategory;
  date: string;
  title: string;
  content: string;
}

// 오늘 날짜를 YYYY-MM-DD 형식으로
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const ObservationMemoEditor: React.FC<ObservationMemoEditorProps> = ({
  studentId,
  onSave,
}) => {
  const [category, setCategory] = useState<ObservationCategory>('behavior');
  const [date, setDate] = useState<string>(getTodayString());
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    try {
      const data: ObservationMemoData = {
        studentId,
        category,
        date,
        title: title.trim(),
        content: content.trim(),
      };
      onSave?.(data);
      // 저장 후 초기화
      setTitle('');
      setContent('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">관찰 메모</h3>

      {/* 카테고리 + 날짜 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* 관찰 영역 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            관찰 영역
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ObservationCategory)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            {Object.entries(OBSERVATION_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 관찰 일자 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            관찰 일자
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      {/* 관찰 기록명 */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          관찰 기록명
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 수업 중 발표 태도, 모둠 활동 참여..."
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>

      {/* 관찰 내용 */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          관찰 내용
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="관찰한 내용을 간단히 기록해주세요..."
          rows={6}
          className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
        />
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!title.trim() || !content.trim() || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
};

export default ObservationMemoEditor;
