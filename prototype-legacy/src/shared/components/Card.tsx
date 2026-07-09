import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = false }) => {
  const baseClass = 'bg-white rounded-xl shadow-sm border border-gray-100 p-4';
  const hoverClass = hoverable ? 'hover:shadow-md hover:border-gray-200 transition-all cursor-pointer' : '';
  return (
    <div className={`${baseClass} ${hoverClass} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};
