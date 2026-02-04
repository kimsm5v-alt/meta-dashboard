import { useState, useEffect } from 'react';
import { Plus, Mic, Calendar, X, Lightbulb } from 'lucide-react';
import type { CounselingRecord, CreateCounselingRecordInput } from '@/shared/types';
import { counselingService } from '@/shared/services/counselingService';

interface CounselingRecordPanelProps {
  studentId: string;
  classId: string;
}

interface FormData {
  date: string;
  title: string;
  content: string;
}

export const CounselingRecordPanel: React.FC<CounselingRecordPanelProps> = ({
  studentId,
  classId,
}) => {
  const [records, setRecords] = useState<CounselingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
  });

  useEffect(() => {
    loadRecords();
  }, [studentId]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await counselingService.getByStudentId(studentId);
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      content: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    const input: CreateCounselingRecordInput = {
      studentId,
      classId,
      scheduledAt: `${formData.date} 09:00`,
      duration: 30,
      type: 'regular',
      area: 'academic',
      method: 'face-to-face',
      summary: `${formData.title}\n\n${formData.content}`,
    };

    if (editingId) {
      await counselingService.update(editingId, { summary: input.summary });
    } else {
      await counselingService.create(input);
    }

    resetForm();
    loadRecords();
  };

  const handleEdit = (record: CounselingRecord) => {
    const [title, ...contentParts] = record.summary.split('\n\n');
    setFormData({
      date: record.scheduledAt.split(' ')[0],
      title: title || '',
      content: contentParts.join('\n\n') || record.summary,
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr.split(' ')[0]);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getTitle = (summary: string) => {
    const firstLine = summary.split('\n')[0];
    return firstLine.length > 30 ? firstLine.slice(0, 30) + '...' : firstLine;
  };

  const getPreview = (summary: string) => {
    const lines = summary.split('\n\n');
    const content = lines.length > 1 ? lines.slice(1).join(' ') : summary;
    return content.length > 50 ? content.slice(0, 50) + '...' : content;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">상담 기록</h3>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 기록
        </button>
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {editingId ? '기록 수정' : '새 상담 기록'}
            </span>
            <button
              onClick={resetForm}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <input
            type="text"
            placeholder="제목 (예: 학업 스트레스 관련 상담)"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          <textarea
            placeholder="상담 내용을 입력하세요..."
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.content.trim()}
              className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {editingId ? '수정' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* 기록 목록 */}
      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">아직 상담 기록이 없습니다.</p>
          </div>
        ) : (
          records.map(record => {
            const isExpanded = expandedId === record.id;
            const [title, ...contentParts] = record.summary.split('\n\n');
            const content = contentParts.join('\n\n');

            return (
              <div
                key={record.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : record.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    {formatDate(record.scheduledAt)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
                    className="text-xs text-gray-400 hover:text-primary-500 transition-colors"
                  >
                    편집
                  </button>
                </div>
                <h4 className="font-medium text-gray-900 text-sm mb-1">
                  {isExpanded ? title : getTitle(record.summary)}
                </h4>
                {isExpanded ? (
                  <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {content || record.summary}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {getPreview(record.summary)}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 음성 녹음 안내 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-blue-700 mb-2">
              음성 녹음으로 상담 기록을 작성할 수 있습니다.
            </p>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors">
              <Mic className="w-3.5 h-3.5" />
              음성으로 기록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
