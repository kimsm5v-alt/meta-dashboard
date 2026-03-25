import { ReactNode } from 'react';

interface MinimalLayoutProps {
  children: ReactNode;
}

/**
 * 사이드바/헤더 없는 최소 레이아웃
 * 랜딩 페이지, 로그인 페이지 등에서 사용
 */
export const MinimalLayout: React.FC<MinimalLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};
