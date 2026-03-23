import { CheckCircle2, Mail, UserPlus } from 'lucide-react';

interface GuestCompleteStepProps {
  email: string;
  nickname: string;
  onConvertToMember?: () => void;
  onClose: () => void;
}

export const GuestCompleteStep: React.FC<GuestCompleteStepProps> = ({
  email,
  nickname,
  onConvertToMember,
  onClose,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 완료 메시지 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">검사 완료!</h1>
          <p className="text-gray-600">
            {nickname}님, 수고하셨습니다.
          </p>
        </div>

        {/* 이메일 발송 안내 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">결과 PDF 발송 예정</h3>
              <p className="text-sm text-gray-600 mb-3">
                검사가 종료되면 아래 이메일로<br />
                결과 PDF가 발송됩니다.
              </p>
              <div className="bg-gray-50 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-500">발송 이메일</p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 회원 전환 유도 */}
        <div className="bg-gradient-to-r from-primary-50 to-indigo-50 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
              <UserPlus className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">회원가입 하시겠어요?</h3>
              <p className="text-sm text-gray-600 mb-3">
                회원이 되면 결과를 웹에서 바로 확인하고,<br />
                언제든 다시 볼 수 있어요.
              </p>
              {onConvertToMember && (
                <button
                  onClick={onConvertToMember}
                  className="w-full px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                >
                  회원으로 전환하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 종료 버튼 */}
        <button
          onClick={onClose}
          className="w-full px-6 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
        >
          종료
        </button>

        {/* 안내 문구 */}
        <p className="text-center text-xs text-gray-400 mt-6">
          ※ 메일이 도착하지 않으면 스팸함을 확인해주세요.
        </p>
      </div>
    </div>
  );
};
