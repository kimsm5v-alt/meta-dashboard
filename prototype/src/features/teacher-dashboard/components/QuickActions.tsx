/**
 * 홈 > SEL 워크스페이스
 *
 * 사회정서 교육을 위한 카테고리별 메뉴 그룹
 */

import { useNavigate } from 'react-router-dom';
import { Users, ClipboardList, BarChart3, Heart, BookOpen } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  // Mock 데이터 - 실제로는 props나 context에서 가져와야 함
  const myGroupsCount = 4;

  const categories = [
    {
      id: 'classroom',
      title: '학급 운영',
      icon: '🏫',
      description: '반과 학생 관리',
      color: 'from-blue-50 to-blue-100 border-blue-200',
      items: [
        {
          id: 'group-management',
          label: '그룹 관리',
          icon: Users,
          path: '/group',
          iconColor: 'text-blue-600',
        },
      ],
    },
    {
      id: 'diagnosis',
      title: '학습심리정서검사',
      icon: '📊',
      description: '학생 이해하기',
      color: 'from-green-50 to-green-100 border-green-200',
      items: [
        {
          id: 'exam-management',
          label: '검사 관리',
          icon: ClipboardList,
          path: '/exam/management',
          iconColor: 'text-green-600',
        },
        {
          id: 'exam-result',
          label: '결과 보기',
          icon: BarChart3,
          path: '/exam/result',
          iconColor: 'text-green-600',
        },
      ],
    },
    {
      id: 'support',
      title: '성장 지원',
      icon: '💡',
      description: '맞춤형 교육',
      color: 'from-purple-50 to-purple-100 border-purple-200',
      items: [
        {
          id: 'coaching',
          label: '코칭',
          icon: Heart,
          path: '/coaching',
          iconColor: 'text-purple-600',
        },
        {
          id: 'lesson',
          label: '수업 자료실',
          icon: BookOpen,
          path: '/lesson',
          iconColor: 'text-purple-600',
        },
      ],
    },
  ];

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          💚 사회정서 교육 워크스페이스
        </h2>
        <p className="text-sm text-gray-500">학생 한 명 한 명의 마음을 이해하고 성장을 돕습니다</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 나의 그룹 카드 - 진한색 배경 */}
        <button
          onClick={() => navigate('/group')}
          className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 transition-all hover:shadow-xl hover:from-primary-700 hover:to-primary-800 group text-left"
        >
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-white/90 mb-2">나의 그룹</p>
              <p className="text-4xl font-bold text-white">{myGroupsCount}</p>
              <p className="text-sm text-white/80 mt-2">관리 중인 반</p>
            </div>
          </div>
        </button>

        {/* 기존 카테고리 카드들 - 세로 3줄 배치 */}
        <div className="md:col-span-3 grid grid-cols-1 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`bg-gradient-to-br ${category.color} rounded-xl border p-5 transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{category.title}</h3>
                    <p className="text-xs text-gray-600">{category.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {category.items.map((item) => {
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className="w-28 px-4 py-2.5 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 hover:border-gray-400 transition-all hover:shadow-sm group"
                      >
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
