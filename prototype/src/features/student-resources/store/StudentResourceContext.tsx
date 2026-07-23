/**
 * 학생 수업 자료실 경량 스토어 — 토스트만 제공.
 * 교사용 ResourcesContext 의존을 끊고 feature 를 self-contained 로 유지한다.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface StudentResourceContextValue {
  toastMsg: string | null;
  toast: (msg: string) => void;
}

const StudentResourceContext = createContext<StudentResourceContextValue | null>(null);

export function useStudentResource(): StudentResourceContextValue {
  const ctx = useContext(StudentResourceContext);
  if (!ctx) throw new Error('useStudentResource must be used within <StudentResourceProvider>');
  return ctx;
}

export function StudentResourceProvider({ children }: { children: ReactNode }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1900);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  return (
    <StudentResourceContext.Provider value={{ toastMsg, toast }}>
      {children}
    </StudentResourceContext.Provider>
  );
}
