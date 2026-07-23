/**
 * 학생 상담 - 상담 기록 에디터
 *
 * 상담 내용 기록 및 저장
 * - 상담 유형, 영역, 방법
 * - 일자, 시간, 소요시간
 * - 상담 내용
 */

import { useState } from 'react';
import { Save } from 'lucide-react';
import type { CounselingType, CounselingArea, CounselingMethod } from '../types';
import { COUNSELING_TYPE_LABELS, COUNSELING_AREA_LABELS, COUNSELING_METHOD_LABELS } from '../types';

interface CounselingMemoEditorProps {
  studentId: string;
  studentName: string;
  onSave?: (data: CounselingMemoData) => void;
}

export interface CounselingMemoData {
  studentId: string;
  type: CounselingType;
  area: CounselingArea;
  method: CounselingMethod;
  date: string;
  time: string;
  duration: number;
  content: string;
  followUpNeeded: boolean;
  followUpDate?: Date;
}

// 오늘 날짜를 YYYY-MM-DD 형식으로
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// 현재 시간을 HH:MM 형식으로 (30분 단위로 반올림)
const getCurrentTimeString = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes() < 30 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

export const CounselingMemoEditor: React.FC<CounselingMemoEditorProps> = ({
  studentId,
  onSave,
}) => {
  const [type, setType] = useState<CounselingType>('regular');
  const [area, setArea] = useState<CounselingArea>('academic');
  const [method, setMethod] = useState<CounselingMethod>('face-to-face');
  const [date, setDate] = useState<string>(getTodayString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
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
        method,
        date,
        time,
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
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">상담 기록</h3>

      {/* 상담 정보 - 1행: 유형, 영역, 방법 */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* 상담 유형 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            상담 유형
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CounselingType)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
          <label className="block text-xs font-medium text-gray-600 mb-1">
            상담 영역
          </label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as CounselingArea)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {Object.entries(COUNSELING_AREA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* 상담 방법 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            상담 방법
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as CounselingMethod)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {Object.entries(COUNSELING_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 상담 정보 - 2행: 일자, 시간, 소요시간 */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* 상담 일자 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            상담 일자
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* 상담 시간 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            상담 시간
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* 소요 시간 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            소요 시간
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          상담 내용
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="상담 내용을 기록해주세요..."
          rows={6}
          className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        />
      </div>

      {/* 후속 상담 필요 + 저장 */}
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
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
};

export default CounselingMemoEditor;
