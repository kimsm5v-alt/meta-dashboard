/**
 * 학생 상담 - 학생 선택 - 상담 메모 에디터
 *
 * 상담 내용 기록 및 저장
 */

import { useState } from 'react';
import { FileText, Save, Clock, Tag } from 'lucide-react';
import type { CounselingType, CounselingArea } from '../types';
import { COUNSELING_TYPE_LABELS, COUNSELING_AREA_LABELS } from '../types';

interface CounselingMemoEditorProps {
  studentId: string;
  studentName: string;
  onSave?: (data: CounselingMemoData) => void;
}

export interface CounselingMemoData {
  studentId: string;
  type: CounselingType;
  area: CounselingArea;
  duration: number;
  content: string;
  followUpNeeded: boolean;
  followUpDate?: Date;
}

export const CounselingMemoEditor: React.FC<CounselingMemoEditorProps> = ({
  studentId,
  studentName,
  onSave,
}) => {
  const [type, setType] = useState<CounselingType>('regular');
  const [area, setArea] = useState<CounselingArea>('academic');
  const [duration, setDuration] = useState<number>(30);
  const [content, setContent] = useState<string>('');
  const [followUpNeeded, setFollowUpNeeded] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      const data: CounselingMemoData = {
        studentId,
        type,
        area,
        duration,
        content: content.trim(),
        followUpNeeded,
      };
      onSave?.(data);
      // 저장 후 초기화
      setContent('');
      setFollowUpNeeded(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary-600" />
        <h3 className="text-base font-semibold text-gray-900">상담 기록</h3>
        <span className="text-sm text-gray-500">- {studentName}</span>
      </div>

      {/* 상담 정보 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* 상담 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Tag className="w-4 h-4 inline mr-1" />
            상담 유형
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CounselingType)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {Object.entries(COUNSELING_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 상담 영역 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            상담 영역
          </label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as CounselingArea)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {Object.entries(COUNSELING_AREA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 상담 시간 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Clock className="w-4 h-4 inline mr-1" />
            상담 시간
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={15}>15분</option>
            <option value={30}>30분</option>
            <option value={45}>45분</option>
            <option value={60}>60분</option>
            <option value={90}>90분</option>
          </select>
        </div>
      </div>

      {/* 상담 내용 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          상담 내용
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="상담 내용을 기록해주세요..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      {/* 후속 상담 필요 */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={followUpNeeded}
            onChange={(e) => setFollowUpNeeded(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">후속 상담 필요</span>
        </label>

        <button
          onClick={handleSave}
          disabled={!content.trim() || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
};

export default CounselingMemoEditor;
