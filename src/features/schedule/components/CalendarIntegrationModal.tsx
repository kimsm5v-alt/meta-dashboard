import { ExternalLink, Download, Info } from 'lucide-react';
import { Modal, Button } from '@/shared/components';

interface CalendarIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 아이콘 SVG
const GoogleCalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path fill="#4285F4" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z" opacity="0.1" />
    <path fill="#4285F4" d="M12 7v5l4.25 2.52.75-1.27-3.5-2.08V7z" />
    <rect fill="#FBBC04" x="11" y="3" width="2" height="4" />
    <rect fill="#34A853" x="17" y="11" width="4" height="2" />
    <rect fill="#EA4335" x="11" y="17" width="2" height="4" />
    <rect fill="#4285F4" x="3" y="11" width="4" height="2" />
  </svg>
);

const AppleCalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <rect fill="#FF3B30" x="2" y="4" width="20" height="18" rx="2" />
    <rect fill="#fff" x="2" y="8" width="20" height="14" rx="1" />
    <rect fill="#FF3B30" x="6" y="2" width="2" height="4" rx="1" />
    <rect fill="#FF3B30" x="16" y="2" width="2" height="4" rx="1" />
    <text x="12" y="18" textAnchor="middle" fill="#FF3B30" fontSize="8" fontWeight="bold">31</text>
  </svg>
);

export const CalendarIntegrationModal: React.FC<CalendarIntegrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGoogleConnect = () => {
    // TODO: Google Calendar OAuth 연동
    alert('Google Calendar 연동 기능은 추후 구현 예정입니다.');
  };

  const handleAppleConnect = () => {
    // TODO: Apple Calendar 연동
    alert('Apple Calendar 연동 기능은 추후 구현 예정입니다.');
  };

  const handleExportICS = () => {
    // TODO: ICS 파일 내보내기 구현
    alert('ICS 파일 내보내기 기능은 추후 구현 예정입니다.');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="캘린더 연동" size="md">
      <div className="space-y-4">
        {/* Google Calendar */}
        <button
          onClick={handleGoogleConnect}
          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <GoogleCalendarIcon />
            <div className="text-left">
              <div className="font-medium text-gray-900">Google Calendar</div>
              <div className="text-sm text-gray-500">Google 계정으로 연동</div>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors">
            연동
          </span>
        </button>

        {/* Apple Calendar */}
        <button
          onClick={handleAppleConnect}
          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AppleCalendarIcon />
            <div className="text-left">
              <div className="font-medium text-gray-900">Apple Calendar</div>
              <div className="text-sm text-gray-500">iCloud 계정으로 연동</div>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors">
            연동
          </span>
        </button>

        {/* 구분선 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-sm text-gray-500">또는</span>
          </div>
        </div>

        {/* ICS 내보내기 */}
        <button
          onClick={handleExportICS}
          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">ICS 파일 내보내기</div>
              <div className="text-sm text-gray-500">
                다른 캘린더 앱에서 가져오기
              </div>
            </div>
          </div>
          <ExternalLink className="w-5 h-5 text-gray-400" />
        </button>

        {/* 개인정보 보호 안내 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                개인정보 보호 안내
              </h4>
              <p className="text-sm text-blue-700">
                외부 캘린더 연동 시 학생 실명은 자동으로 익명 ID(예: 학생A, 학생B)로
                변환되어 내보내집니다. 학생의 개인정보는 외부로 전송되지 않습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="mt-6 pt-4 border-t">
        <Button variant="secondary" onClick={onClose} className="w-full">
          닫기
        </Button>
      </div>
    </Modal>
  );
};
