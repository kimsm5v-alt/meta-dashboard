import { StudentMockHeader } from '../components/StudentMockHeader';

export const StudentNotificationMockPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentMockHeader />
      <main className="mt-16 p-6">
        <div className="max-w-4xl mx-auto text-sm text-gray-400">
          학생 알림 Mock — 상단 Bell 버튼을 눌러 패널을 확인하세요.
        </div>
      </main>
    </div>
  );
};

export default StudentNotificationMockPage;
