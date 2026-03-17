import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PenSquare, Heart, MessageCircle, User, Tag } from 'lucide-react';
import { Card, Button } from '@/shared/components';

// 임시 Mock 데이터
interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  tags: string[];
}

const mockPosts: Post[] = [
  {
    id: '1',
    title: '자원소진형 학생에게 효과적이었던 동기부여 방법',
    content: '안녕하세요. 6학년을 담임하고 있는 교사입니다. 자원소진형 학생들에게 효과적이었던 동기부여 방법을 공유합니다...',
    author: '김선생님',
    createdAt: '2024-03-15',
    likeCount: 24,
    commentCount: 8,
    tags: ['자원소진형', '동기부여', '초등'],
  },
  {
    id: '2',
    title: '검사 결과를 학부모 상담에 활용하는 팁',
    content: '학부모 상담 시 검사 결과를 어떻게 설명하면 좋을지 고민하시는 분들이 많으실 것 같아요...',
    author: '이선생님',
    createdAt: '2024-03-14',
    likeCount: 18,
    commentCount: 5,
    tags: ['학부모상담', '검사활용'],
  },
  {
    id: '3',
    title: '정서조절취약형 학생 대상 그룹 활동 사례',
    content: '정서조절취약형 학생들과 함께 진행한 그룹 활동 사례를 공유합니다. 주 1회 30분씩...',
    author: '박선생님',
    createdAt: '2024-03-13',
    likeCount: 31,
    commentCount: 12,
    tags: ['정서조절취약형', '그룹활동', '중등'],
  },
];

type SortOption = 'latest' | 'popular';

export const CommunityListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = [...new Set(mockPosts.flatMap((post) => post.tags))];

  const filteredPosts = mockPosts
    .filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !selectedTag || post.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return b.likeCount - a.likeCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">교사 커뮤니티</h1>
          <p className="text-gray-500 mt-1">다른 선생님들과 경험을 나누고 소통하세요</p>
        </div>
        <Button onClick={() => navigate('/community/write')}>
          <PenSquare className="w-4 h-4 mr-2" />
          글 작성
        </Button>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 정렬 */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('latest')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'latest'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'popular'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            인기순
          </button>
        </div>

        {/* 검색 */}
        <div className="relative flex-1 max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="글 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* 태그 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTag(null)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
            !selectedTag
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
              selectedTag === tag
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Tag className="w-3 h-3" />
            {tag}
          </button>
        ))}
      </div>

      {/* 게시글 목록 */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card
            key={post.id}
            hoverable
            onClick={() => navigate(`/community/${post.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2 hover:text-primary-600 cursor-pointer">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.content}</p>

                {/* 태그 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 메타 정보 */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </span>
                  <span>{post.createdAt}</span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {post.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {post.commentCount}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredPosts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500">게시글이 없습니다</p>
        </div>
      )}
    </div>
  );
};
