import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, User, Tag, BookOpen } from 'lucide-react';
import { Card, Button } from '@/shared/components';

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  likeCount: number;
}

export const CommunityDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState('');

  // 임시 Mock 데이터
  const post = {
    id: postId,
    title: '자원소진형 학생에게 효과적이었던 동기부여 방법',
    content: `안녕하세요. 6학년을 담임하고 있는 교사입니다.

자원소진형 학생들에게 효과적이었던 동기부여 방법을 공유합니다.

## 1. 작은 성공 경험 쌓기
매일 달성 가능한 작은 목표를 설정하고, 달성할 때마다 칭찬과 격려를 해주었습니다.
처음에는 "오늘 수학 문제 3개 풀기" 같은 아주 작은 목표로 시작했어요.

## 2. 감정 일기 쓰기
하루에 한 줄이라도 자신의 감정을 적어보게 했습니다.
"오늘 기분이 어땠어?"라고 물어보며 자연스럽게 대화를 이끌어갔어요.

## 3. 1:1 면담 시간 확보
일주일에 한 번, 10분씩이라도 개별 면담 시간을 가졌습니다.
학업 이야기보다는 관심사나 고민에 대해 이야기를 나눴어요.

이런 방법들을 꾸준히 적용하니 학생의 태도가 조금씩 변화하는 것을 느낄 수 있었습니다.
다른 선생님들도 좋은 방법 있으시면 공유해주세요!`,
    author: '김선생님',
    createdAt: '2024-03-15',
    likeCount: 24,
    tags: ['자원소진형', '동기부여', '초등'],
    relatedResources: [
      { id: '1', title: '자원소진형 학생 코칭 가이드' },
    ],
  };

  const comments: Comment[] = [
    {
      id: '1',
      author: '이선생님',
      content: '정말 좋은 방법이네요! 저도 비슷한 방법을 써봤는데, 감정 일기가 특히 효과적이었어요.',
      createdAt: '2024-03-15',
      likeCount: 5,
    },
    {
      id: '2',
      author: '박선생님',
      content: '1:1 면담 시간 확보가 현실적으로 어려운데, 쉬는 시간을 활용하시나요?',
      createdAt: '2024-03-16',
      likeCount: 2,
    },
  ];

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      // TODO: API 호출
      setNewComment('');
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/community')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">글 상세</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 본문 */}
          <Card>
            {/* 태그 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-50 text-primary-600 rounded"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h2>

            {/* 작성자 정보 */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{post.author}</p>
                <p className="text-sm text-gray-500">{post.createdAt}</p>
              </div>
            </div>

            {/* 본문 내용 */}
            <div className="prose prose-gray max-w-none">
              <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">
                {post.content}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-4 pt-6 border-t border-gray-100 mt-6">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{post.likeCount + (isLiked ? 1 : 0)}</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                <Share2 className="w-5 h-5" />
                공유
              </button>
            </div>
          </Card>

          {/* 댓글 섹션 */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              댓글 {comments.length}개
            </h3>

            {/* 댓글 입력 */}
            <form onSubmit={handleSubmitComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성해주세요..."
                className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button type="submit" disabled={!newComment.trim()}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  댓글 작성
                </Button>
              </div>
            </form>

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{comment.author}</p>
                      <p className="text-xs text-gray-500">{comment.createdAt}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm ml-11">{comment.content}</p>
                  <div className="flex items-center gap-2 mt-2 ml-11">
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                      <Heart className="w-3 h-3" />
                      {comment.likeCount}
                    </button>
                    <button className="text-xs text-gray-400 hover:text-gray-600">
                      답글
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 관련 자료 */}
          {post.relatedResources.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                관련 자료
              </h3>
              <ul className="space-y-2">
                {post.relatedResources.map((resource) => (
                  <li key={resource.id}>
                    <button
                      onClick={() => navigate(`/resources/${resource.id}`)}
                      className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* 작성자 정보 */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">작성자</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{post.author}</p>
                <p className="text-sm text-gray-500">교사</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
