import { Bell } from 'lucide-react';

export const NotificationEmpty: React.FC = () => {
  return (
    <div className="py-14 px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
          <Bell className="w-[22px] h-[22px] text-gray-300" strokeWidth={2} />
        </div>
        <p className="text-sm text-gray-400">아직 알림이 없어요</p>
      </div>
    </div>
  );
};

export default NotificationEmpty;
