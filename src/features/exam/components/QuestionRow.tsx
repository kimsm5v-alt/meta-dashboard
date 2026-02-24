import { LikertScale } from './LikertScale';

interface QuestionRowProps {
  questionNo: number;
  questionText: string;
  selectedValue: string;
  onSelect: (value: string) => void;
  isSaving?: boolean;
}

export const QuestionRow: React.FC<QuestionRowProps> = ({
  questionNo,
  questionText,
  selectedValue,
  onSelect,
  isSaving = false,
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl p-4 md:p-5 border transition-all
        ${selectedValue ? 'border-primary-200 bg-primary-50/30' : 'border-gray-100'}
        ${isSaving ? 'opacity-70' : ''}
      `}
    >
      {/* 모바일: 세로 레이아웃 */}
      <div className="md:hidden space-y-3">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-bold flex items-center justify-center">
            {questionNo}
          </span>
          <p className="text-gray-800 text-sm leading-relaxed flex-1">{questionText}</p>
        </div>
        <LikertScale
          selectedValue={selectedValue}
          onSelect={onSelect}
          disabled={isSaving}
        />
      </div>

      {/* 데스크톱: 가로 레이아웃 */}
      <div className="hidden md:flex items-center gap-4">
        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-600 font-bold flex items-center justify-center">
          {questionNo}
        </span>
        <p className="flex-1 text-gray-800 leading-relaxed min-w-0">{questionText}</p>
        <div className="flex-shrink-0 w-[400px]">
          <LikertScale
            selectedValue={selectedValue}
            onSelect={onSelect}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
};
