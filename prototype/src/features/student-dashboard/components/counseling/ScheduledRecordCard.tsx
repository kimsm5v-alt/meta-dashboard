import { useState } from 'react';
import { AlertCircle, Check, Edit2, Trash2 } from 'lucide-react';
import type { UnifiedCounselingRecord } from '@/shared/types';
import { SCHEDULE_TYPE_LABELS, COUNSELING_AREA_LABELS, COUNSELING_METHOD_LABELS } from '@/shared/types';
import { formatScheduleDateKr, extractTime } from '@/shared/utils/dateUtils';

interface ScheduledRecordCardProps {
  record: UnifiedCounselingRecord;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateReason: (reason: string) => void;
}

export const ScheduledRecordCard: React.FC<ScheduledRecordCardProps> = ({
  record,
  onComplete,
  onEdit,
  onDelete,
  onUpdateReason,
}) => {
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [reasonText, setReasonText] = useState(record.reason || '');

  const handleSaveReason = () => {
    onUpdateReason(reasonText);
    setIsEditingReason(false);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{formatScheduleDateKr(record.scheduledAt)}</span>
          <span className="text-sm text-gray-600">{extractTime(record.scheduledAt)}</span>
          {record.types.includes('urgent') && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-medium rounded">
              <AlertCircle className="w-3 h-3" />
              긴급
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-primary-500 hover:bg-white rounded transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {record.areas.map((area, i) => (
          <span key={`area-${i}`} className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
            {COUNSELING_AREA_LABELS[area]}
          </span>
        ))}
        {record.types.map((type, i) => (
          <span key={`type-${i}`} className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
            {SCHEDULE_TYPE_LABELS[type]}
          </span>
        ))}
        {record.methods.map((method, i) => (
          <span key={`method-${i}`} className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
            {COUNSELING_METHOD_LABELS[method]}
          </span>
        ))}
      </div>

      {/* 메모 영역 */}
      {isEditingReason ? (
        <div className="space-y-2">
          <textarea
            value={reasonText}
            onChange={e => setReasonText(e.target.value)}
            placeholder="상담 사유나 메모를 입력하세요"
            rows={2}
            className="w-full px-2 py-1.5 text-xs border border-amber-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <div className="flex gap-1 justify-end">
            <button
              onClick={() => {
                setReasonText(record.reason || '');
                setIsEditingReason(false);
              }}
              className="px-2 py-1 text-xs text-gray-500 hover:bg-white rounded"
            >
              취소
            </button>
            <button
              onClick={handleSaveReason}
              className="px-2 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsEditingReason(true)}
          className="w-full text-left text-xs text-gray-600 hover:bg-amber-100 rounded p-1.5 -m-1.5 transition-colors"
        >
          {record.reason || (
            <span className="text-gray-400 italic">메모 추가...</span>
          )}
        </button>
      )}

      {/* 완료 버튼 */}
      <button
        onClick={onComplete}
        className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors"
      >
        <Check className="w-3.5 h-3.5" />
        완료 처리
      </button>
    </div>
  );
};
