import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, BookOpen, X, Plus } from 'lucide-react';
import { Card, Button } from '@/shared/components';
import { RichTextEditor } from '../components';

const availableTags = [
  '자원소진형', '안전균형형', '몰입자원풍부형',
  '무기력형', '정서조절취약형', '자기주도몰입형',
  '수업지도', '상담', '학부모', '학급운영',
  '초등', '중등',
];

export const CommunityWritePage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      return;
    }

    setIsSubmitting(true);

    // TODO: API 호출
    await new Promise((resolve) => setTimeout(resolve, 1000));

    navigate('/community');
  };

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/community')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">글 작성</h1>
        </div>
        <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
          {isSubmitting ? '작성 중...' : '게시하기'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 에디터 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            {/* 제목 */}
            <div className="mb-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full text-2xl font-bold border-0 border-b-2 border-gray-200 pb-4 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* 본문 - Tiptap 에디터 */}
            <div className="mb-6">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="내용을 입력하세요. 다른 선생님들과 경험을 나눠보세요."
              />
            </div>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 태그 선택 */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              태그 선택 (최대 5개)
            </h3>

            {/* 선택된 태그 */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className="hover:text-primary-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 태그 목록 */}
            <div className="flex flex-wrap gap-2">
              {availableTags
                .filter((tag) => !selectedTags.includes(tag))
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    disabled={selectedTags.length >= 5}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                    {tag}
                  </button>
                ))}
            </div>
          </Card>

          {/* 관련 자료 첨부 */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              관련 자료 첨부
            </h3>
            <button
              type="button"
              className="w-full p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
            >
              <Plus className="w-5 h-5 mx-auto mb-2" />
              <span className="text-sm">자료실에서 자료 선택</span>
            </button>
            <p className="text-xs text-gray-400 mt-2">
              * 자료실 구현 후 연동 예정
            </p>
          </Card>

          {/* 작성 가이드 */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">작성 가이드</h3>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>• 학생 유형에 맞는 태그를 선택해주세요</li>
              <li>• 구체적인 사례와 방법을 공유해주세요</li>
              <li>• 개인정보는 포함하지 마세요</li>
              <li>• 관련 자료가 있다면 첨부해주세요</li>
            </ul>
          </Card>
        </div>
      </form>
    </div>
  );
};
