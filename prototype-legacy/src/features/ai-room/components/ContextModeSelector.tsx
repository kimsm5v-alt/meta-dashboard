import { Users, School, UserCheck } from 'lucide-react';
import type { ContextMode } from '../types';

interface ContextModeSelectorProps {
  mode: ContextMode;
  onChange: (mode: ContextMode) => void;
}

const MODES: { value: ContextMode; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'all', label: '전체', icon: School, description: '모든 담당 학급' },
  { value: 'class', label: '반 선택', icon: Users, description: '특정 반 선택' },
  { value: 'student', label: '학생 선택', icon: UserCheck, description: '학생 복수 선택' },
];

export const ContextModeSelector: React.FC<ContextModeSelectorProps> = ({ mode, onChange }) => {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      {MODES.map(({ value, label, icon: Icon }) => {
        const isActive = mode === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              isActive
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
