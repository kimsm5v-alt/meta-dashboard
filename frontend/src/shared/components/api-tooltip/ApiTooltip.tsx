/**
 * API 설명 툴팁 컴포넌트
 *
 * 백엔드 개발자가 각 기능에 필요한 API를 쉽게 파악할 수 있도록
 * 개발자 모드에서만 표시되는 배지 형태의 툴팁입니다.
 */

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useApiDevMode } from '@shared/contexts/ApiDevModeContext';

// ============================================================
// 타입 정의
// ============================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiPriority = 'high' | 'medium' | 'low';

export interface ErrorCase {
  code: number;
  message: string;
}

export interface ApiOption {
  label: string;
  endpoint: string;
  description: string;
}

export interface ApiTooltipProps {
  /** HTTP 메서드 */
  method: HttpMethod;
  /** API 엔드포인트 */
  endpoint: string;
  /** API 요약 (짧은 제목) */
  summary?: string;
  /** API 설명 */
  description: string;
  /** 구현 옵션 (기존 API 확장 vs 신규 API 등) */
  options?: ApiOption[];
  /** 우선순위 (high/medium/low) */
  priority?: ApiPriority;
  /** Request Body 예시 (JSON) */
  requestBody?: Record<string, unknown>;
  /** Response 예시 (JSON) */
  responseExample?: Record<string, unknown> | unknown[];
  /** 예외 케이스 */
  errorCases?: ErrorCase[];
  /** 현재 구현 상태 참고사항 */
  currentImpl?: string;
  /** 수정 필요한 파일 */
  relatedFiles?: string[];
  /** 자식 요소 (래핑할 컴포넌트) */
  children?: ReactNode;
  /** 배지 위치 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// ============================================================
// 스타일 상수
// ============================================================

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-emerald-100 text-emerald-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-amber-100 text-amber-700',
  PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
};

const PRIORITY_LABELS: Record<ApiPriority, { text: string; color: string }> = {
  high: { text: '🔴 높음', color: 'text-red-600' },
  medium: { text: '🟡 중간', color: 'text-amber-600' },
  low: { text: '🟢 낮음', color: 'text-emerald-600' },
};

const POSITION_CLASSES: Record<NonNullable<ApiTooltipProps['position']>, string> = {
  'top-left': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
  'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
  'bottom-left': 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
};

// ============================================================
// 컴포넌트
// ============================================================

export const ApiTooltip: React.FC<ApiTooltipProps> = ({
  method,
  endpoint,
  summary,
  description,
  options,
  priority = 'medium',
  requestBody,
  responseExample,
  errorCases,
  currentImpl,
  relatedFiles,
  children,
  position = 'top-right',
}) => {
  const { isApiDevMode } = useApiDevMode();
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 팝오버 위치 계산 (뷰포트 경계 고려)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverHeight = 500; // max-h-[500px]
      const popoverWidth = 400; // w-[400px]
      const padding = 16;

      // 기본 위치: 버튼 아래
      let top = rect.bottom + 8;
      let left = position.includes('right')
        ? Math.max(padding, rect.right - popoverWidth)
        : rect.left;

      // 하단 공간 부족 시 → 위로 표시
      if (top + popoverHeight > window.innerHeight - padding) {
        top = Math.max(padding, rect.top - popoverHeight - 8);
      }

      // 우측 경계 체크
      if (left + popoverWidth > window.innerWidth - padding) {
        left = window.innerWidth - popoverWidth - padding;
      }

      // 좌측 경계 체크
      if (left < padding) {
        left = padding;
      }

      // DOM 측정 결과를 팝오버 위치 상태로 동기화한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPopoverPosition({ top, left });
    }
  }, [isOpen, position]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 개발자 모드가 아니면 자식만 렌더링
  if (!isApiDevMode) {
    return <>{children}</>;
  }

  const priorityInfo = PRIORITY_LABELS[priority];

  return (
    <div ref={containerRef} className='relative inline-flex'>
      {children}

      {/* API 배지 */}
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={`
          absolute ${POSITION_CLASSES[position]} z-40
          px-1.5 py-0.5 text-[10px] font-bold
          bg-red-500 text-white rounded
          hover:bg-red-600 transition-colors
          shadow-md cursor-pointer
          flex items-center gap-0.5
          animate-pulse
        `}
        title='API 정보 보기'
      >
        <span className='text-[8px]'>&lt;/&gt;</span>
        API
      </button>

      {/* 팝오버 */}
      {isOpen && (
        <div
          ref={popoverRef}
          className={`
            fixed z-50
            w-[400px] max-h-[500px] overflow-auto
            bg-white rounded-lg shadow-xl border border-gray-200
            text-left
          `}
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
          }}
        >
          {/* 헤더 */}
          <div className='sticky top-0 bg-gray-50 border-b border-gray-200 p-3'>
            <div className='flex items-center justify-between mb-2'>
              <span className={`text-xs font-medium ${priorityInfo.color}`}>
                {priorityInfo.text} 우선순위
              </span>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                ✕
              </button>
            </div>
            <div className='flex items-center gap-2'>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${METHOD_COLORS[method]}`}>
                {method}
              </span>
              <span className='text-base font-semibold text-gray-900'>
                {summary || description.slice(0, 20)}
              </span>
            </div>
            <div className='flex items-center gap-1 mt-1.5'>
              <code className='text-xs font-mono text-gray-500 break-all'>{endpoint}</code>
              <span className='text-[10px] text-gray-400'>(예시)</span>
            </div>
          </div>

          {/* 본문 */}
          <div className='p-3 space-y-4 text-sm'>
            {/* 설명 */}
            <div>
              <h4 className='text-xs font-semibold text-gray-500 mb-1'>📝 설명</h4>
              <p className='text-gray-700'>{description}</p>
            </div>

            {/* 구현 옵션 */}
            {options && options.length > 0 && (
              <div>
                <h4 className='text-xs font-semibold text-gray-500 mb-2'>🔧 구현 옵션</h4>
                <div className='space-y-2'>
                  {options.map((option, idx) => (
                    <div
                      key={idx}
                      className='bg-violet-50 border border-violet-200 rounded-lg p-2.5'
                    >
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='px-1.5 py-0.5 bg-violet-600 text-white text-[10px] font-bold rounded'>
                          옵션 {idx + 1}
                        </span>
                        <span className='text-xs font-semibold text-violet-900'>
                          {option.label}
                        </span>
                      </div>
                      <code className='block text-[11px] font-mono text-violet-700 bg-violet-100 px-2 py-1 rounded mb-1.5'>
                        {option.endpoint}
                      </code>
                      <p className='text-xs text-gray-600'>{option.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Body */}
            {requestBody && (
              <div>
                <h4 className='text-xs font-semibold text-gray-500 mb-1'>📥 Request Body</h4>
                <pre className='bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-auto max-h-32'>
                  {JSON.stringify(requestBody, null, 2)}
                </pre>
                <p className='text-[10px] text-gray-400 mt-1'>* 파라미터는 예시입니다.</p>
              </div>
            )}

            {/* Response */}
            {responseExample && (
              <div>
                <h4 className='text-xs font-semibold text-gray-500 mb-1'>📤 Response (200)</h4>
                <pre className='bg-gray-900 text-gray-100 p-2 rounded text-xs overflow-auto max-h-32'>
                  {JSON.stringify(responseExample, null, 2)}
                </pre>
                <p className='text-[10px] text-gray-400 mt-1'>* 파라미터는 예시입니다.</p>
              </div>
            )}

            {/* 예외 케이스 */}
            {errorCases && errorCases.length > 0 && (
              <div>
                <h4 className='text-xs font-semibold text-gray-500 mb-1'>⚠️ 예외 케이스</h4>
                <ul className='space-y-1'>
                  {errorCases.map((error, idx) => (
                    <li key={idx} className='flex items-start gap-2 text-xs'>
                      <span className='px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-mono'>
                        {error.code}
                      </span>
                      <span className='text-gray-600'>{error.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 현재 구현 상태 */}
            {currentImpl && (
              <div>
                <h4 className='text-xs font-semibold text-gray-500 mb-1'>📎 현재 상태</h4>
                <p className='text-gray-600 text-xs'>{currentImpl}</p>
              </div>
            )}

            {/* 관련 파일 */}
            {relatedFiles && relatedFiles.length > 0 && (
              <div>
                <h4 className='text-xs font-semibold text-gray-500 mb-1'>📁 수정 필요 파일</h4>
                <ul className='space-y-0.5'>
                  {relatedFiles.map((file, idx) => (
                    <li key={idx} className='text-xs font-mono text-violet-600'>
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTooltip;
