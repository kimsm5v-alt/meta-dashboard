import { TYPE_COLOR_CLASSES } from '../data/lpaProfiles';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  type?: string;
  className?: string;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  error: 'bg-red-100 text-red-700',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', type, className = '' }) => {
  const colorClass = type ? TYPE_COLOR_CLASSES[type] || variantClasses.default : variantClasses[variant];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${colorClass} ${className}`}>
      {children}
    </span>
  );
};

export const TypeBadge: React.FC<{ type: string }> = ({ type }) => <Badge type={type}>{type}</Badge>;
