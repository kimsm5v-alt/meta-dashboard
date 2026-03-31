import { useState, useEffect } from 'react';
import { Plus, X, Info } from 'lucide-react';
import type { ObservationMemo, CreateObservationMemoInput } from '@/shared/types';
import { memoService } from '@/shared/services/memoService';
import { formatDateShort } from '@/shared/utils/dateUtils';
import { PanelLoading } from '@/shared/components';

interface ObservationMemoPanelProps {
  studentId: string;
  classId: string;
}

// 11개 중분류 요인 태그 (대분류 색상 종속)
const FACTOR_TAGS = [
  // 자아강점 (#00D282 계열)
  { key: 'positive-self', label: '긍정적자아', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'interpersonal', label: '대인관계능력', color: 'bg-emerald-100 text-emerald-700' },
  // 학습디딤돌 (#4BC1FF 계열)
  { key: 'metacognition', label: '메타인지', color: 'bg-sky-100 text-sky-700' },
  { key: 'study-skills', label: '학습기술', color: 'bg-sky-100 text-sky-700' },
  { key: 'supportive', label: '지지적관계', color: 'bg-sky-100 text-sky-700' },
  // 긍정적공부마음 (#67A7FF 계열)
  { key: 'academic-enthusiasm', label: '학업열의', color: 'bg-blue-100 text-blue-700' },
  { key: 'growth', label: '성장력', color: 'bg-blue-100 text-blue-700' },
  // 학습걸림돌 (#FF849F 계열)
  { key: 'academic-stress', label: '학업스트레스', color: 'bg-rose-100 text-rose-700' },
  { key: 'learning-obstacle', label: '학습방해요인', color: 'bg-rose-100 text-rose-700' },
  { key: 'relationship-stress', label: '학업관계스트레스', color: 'bg-rose-100 text-rose-700' },
  // 부정적공부마음 (#FF87D4 계열)
  { key: 'burnout', label: '학업소진', color: 'bg-pink-100 text-pink-700' },
] as const;

interface FormData {
  date: string;
  situation: string;
  content: string;
  tag: string;
}

export const ObservationMemoPanel: React.FC<ObservationMemoPanelProps> = ({
  studentId,
  classId,
}) => {
  const [memos, setMemos] = useState<ObservationMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    situation: '',
    content: '',
    tag: '',
  });

  useEffect(() => {
    loadMemos();
  }, [studentId]);

  const loadMemos = async () => {
    setLoading(true);
    try {
      const data = await memoService.getByStudentId(studentId);
      setMemos(data);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      situation: '',
      content: '',
      tag: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.content.trim()) return;

    // 상황 + 내용 + 태그를 content에 합쳐서 저장
    const fullContent = formData.situation
      ? `[${formData.situation}] ${formData.content}${formData.tag ? `\n#${formData.tag}` : ''}`
      : `${formData.content}${formData.tag ? `\n#${formData.tag}` : ''}`;

    const input: CreateObservationMemoInput = {
      studentId,
      classId,
      date: formData.date,
      category: 'behavior',
      content: fullContent,
      isImportant: false,
    };

    if (editingId) {
      await memoService.update(editingId, { content: fullContent, date: formData.date });
    } else {
      await memoService.create(input);
    }

    resetForm();
    loadMemos();
  };

  const handleEdit = (memo: ObservationMemo) => {
    // 파싱해서 폼에 채우기
    const content = memo.content;
    const tagMatch = content.match(/#(\S+)$/);
    const tag = tagMatch ? tagMatch[1] : '';
    const contentWithoutTag = tagMatch ? content.replace(/#\S+$/, '').trim() : content;

    const situationMatch = contentWithoutTag.match(/^\[([^\]]+)\]\s*/);
    const situation = situationMatch ? situationMatch[1] : '';
    const mainContent = situationMatch
      ? contentWithoutTag.replace(/^\[([^\]]+)\]\s*/, '')
      : contentWithoutTag;

    setFormData({
      date: memo.date,
      situation,
      content: mainContent,
      tag,
    });
    setEditingId(memo.id);
    setShowForm(true);
  };


  const parseMemo = (content: string) => {
    const tagMatch = content.match(/#(\S+)$/);
    const tag = tagMatch ? tagMatch[1] : '';
    const contentWithoutTag = tagMatch ? content.replace(/#\S+$/, '').trim() : content;

    const situationMatch = contentWithoutTag.match(/^\[([^\]]+)\]\s*/);
    const situation = situationMatch ? situationMatch[1] : '';
    const mainContent = situationMatch
      ? contentWithoutTag.replace(/^\[([^\]]+)\]\s*/, '')
      : contentWithoutTag;

    return { situation, content: mainContent, tag };
  };

  const getTagColor = (tag: string) => {
    const found = FACTOR_TAGS.find(t => t.label === tag);
    return found?.color || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <PanelLoading />;
  }

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">관찰 메모</h3>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          메모 추가
        </button>
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {editingId ? '메모 수정' : '새 관찰 메모'}
            </span>
            <button
              onClick={resetForm}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              placeholder="상황 (예: 수학시간)"
              value={formData.situation}
              onChange={e => setFormData({ ...formData, situation: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <textarea
            placeholder="관찰 내용을 입력하세요..."
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          {/* 태그 선택 */}
          <div>
            <p className="text-xs text-gray-500 mb-2">태그 선택 (선택사항)</p>
            <div className="flex flex-wrap gap-1.5">
              {FACTOR_TAGS.map(tag => (
                <button
                  key={tag.key}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      tag: formData.tag === tag.label ? '' : tag.label,
                    })
                  }
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    formData.tag === tag.label
                      ? `${tag.color} ring-2 ring-offset-1 ring-gray-400`
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.content.trim()}
              className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {editingId ? '수정' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* 메모 목록 */}
      <div className="space-y-3">
        {memos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">아직 관찰 메모가 없습니다.</p>
          </div>
        ) : (
          memos.map(memo => {
            const parsed = parseMemo(memo.content);
            return (
              <div
                key={memo.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900">
                      {formatDateShort(memo.date)}
                    </span>
                    {parsed.situation && (
                      <span className="text-xs text-gray-400">
                        {parsed.situation}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(memo)}
                    className="text-xs text-gray-400 hover:text-primary-500 transition-colors"
                  >
                    편집
                  </button>
                </div>
                <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                  {parsed.content}
                </p>
                {parsed.tag && (
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTagColor(parsed.tag)}`}>
                    #{parsed.tag}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 안내 메시지 */}
      <div className="flex gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg">
        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          태그를 추가하면 검사 요인과 자동 연결됩니다.
        </p>
      </div>
    </div>
  );
};
