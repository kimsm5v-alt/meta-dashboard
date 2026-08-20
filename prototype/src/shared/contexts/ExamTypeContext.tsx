import { createContext, useContext, useState, ReactNode } from 'react';

export type ExamType = 'comprehensive' | 'self-regulation';

interface ExamTypeContextValue {
  examType: ExamType;
  setExamType: (type: ExamType) => void;
}

const ExamTypeContext = createContext<ExamTypeContextValue | undefined>(undefined);

export const ExamTypeProvider = ({ children }: { children: ReactNode }) => {
  const [examType, setExamType] = useState<ExamType>('comprehensive');

  return (
    <ExamTypeContext.Provider value={{ examType, setExamType }}>
      {children}
    </ExamTypeContext.Provider>
  );
};

export const useExamType = () => {
  const context = useContext(ExamTypeContext);
  if (context === undefined) {
    throw new Error('useExamType must be used within an ExamTypeProvider');
  }
  return context;
};
