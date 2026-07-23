import type { NotificationCategory } from '../types/notification';

interface TabConfig {
  id: NotificationCategory;
  label: string;
}

const TABS: TabConfig[] = [
  { id: 'exam', label: '검사' },
  { id: 'group', label: '그룹' },
];

interface NotificationTabsProps {
  active: NotificationCategory;
  unreadByCategory: Record<NotificationCategory, number>;
  onChange: (category: NotificationCategory) => void;
}

function formatCount(count: number): string {
  if (count >= 100) return '99+';
  return String(count);
}

export const NotificationTabs: React.FC<NotificationTabsProps> = ({
  active,
  unreadByCategory,
  onChange,
}) => {
  return (
    <div className="flex border-b border-gray-100 px-2">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const count = unreadByCategory[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] transition-colors ${
              isActive
                ? 'font-medium text-gray-900 border-b-2 border-primary-600 -mb-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {count > 0 && (
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-medium rounded-full leading-none ${
                  isActive ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {formatCount(count)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default NotificationTabs;
