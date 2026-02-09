import type { OAuthProvider } from '@/shared/types';
import vivasamLogo from '@/assets/vivasam_logo_symbol.svg';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}

const PROVIDER_CONFIG: Record<OAuthProvider, {
  name: string;
  bgClass: string;
  iconBg: string;
  icon: string;
  iconImage?: string;
}> = {
  vivasam: {
    name: '비바샘 계정으로 로그인',
    bgClass: 'bg-blue-800 hover:bg-blue-900 text-white',
    iconBg: 'bg-white',
    icon: '',
    iconImage: vivasamLogo,
  },
  google: {
    name: 'Google로 계속하기',
    bgClass: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
    iconBg: 'bg-white',
    icon: 'G',
  },
  kakao: {
    name: '카카오로 계속하기',
    bgClass: 'bg-[#FEE500] hover:bg-[#FDD800] text-[#191919]',
    iconBg: 'bg-[#3C1E1E]',
    icon: 'K',
  },
  naver: {
    name: '네이버로 계속하기',
    bgClass: 'bg-[#03C75A] hover:bg-[#02B550] text-white',
    iconBg: 'bg-[#02A84D]',
    icon: 'N',
  },
};

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onClick,
  disabled,
  primary,
}) => {
  const config = PROVIDER_CONFIG[provider];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-medium
        transition-all duration-200
        ${config.bgClass}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${primary ? 'shadow-lg shadow-blue-800/25' : ''}
      `}
    >
      {/* 아이콘 */}
      {config.iconImage ? (
        <span className="w-6 h-6 bg-white rounded-md flex items-center justify-center border border-sky-200">
          <img src={config.iconImage} alt="" className="w-4 h-4" />
        </span>
      ) : (
        <span
          className={`
            w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold
            ${provider === 'google' ? 'text-red-500' : ''}
            ${provider === 'kakao' ? 'text-[#191919]' : ''}
            ${provider === 'naver' ? 'text-white' : ''}
          `}
        >
          {config.icon}
        </span>
      )}
      <span>{config.name}</span>
    </button>
  );
};
