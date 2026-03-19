import { X } from 'lucide-react';
import type { UnifiedCounselingRecord } from '@/shared/types';
import { COUNSELING_AREA_LABELS, COUNSELING_METHOD_LABELS } from '@/shared/types';
import { formatScheduleDateKr, extractTime } from '@/shared/utils/dateUtils';

interface CompletionData {
  duration: number;
  summary: string;
  nextSteps: string;
}

interface CompletionModalProps {
  record: UnifiedCounselingRecord;
  data: CompletionData;
  onChange: (data: CompletionData) => void;
  onComplete: () => void;
  onClose: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  record,
  data,
  onChange,
  onComplete,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-5 m-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">상담 완료 처리</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 상담 정보 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">
              {formatScheduleDateKr(record.scheduledAt)} {extractTime(record.scheduledAt)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {record.areas.map(a => COUNSELING_AREA_LABELS[a]).join(', ')} | {record.methods.map(m => COUNSELING_METHOD_LABELS[m]).join(', ')}
            </p>
          </div>

          {/* 소요 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              소요 시간 (분)
            </label>
            <input
              type="number"
              value={data.duration}
              onChange={e => onChange({ ...data, duration: parseInt(e.target.value) || 30 })}
              min={5}
              max={180}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 상담 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              상담 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={data.summary}
              onChange={e => onChange({ ...data, summary: e.target.value })}
              placeholder="상담 내용을 입력하세요"
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 후속 조치 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              후속 조치 (선택)
            </label>
            <textarea
              value={data.nextSteps}
              onChange={e => onChange({ ...data, nextSteps: e.target.value })}
              placeholder="후속 조치 사항을 입력하세요"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onComplete}
            disabled={!data.summary.trim()}
            className="flex-1 px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            완료 처리
          </button>
        </div>
      </div>
    </div>
  );
};
