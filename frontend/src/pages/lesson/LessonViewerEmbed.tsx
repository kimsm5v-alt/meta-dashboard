import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

const SlideContainer = styled.div`
  height: 600px; /* 또는 뷰포트에 맞게 100% */
  width: 100%;
`;

const EMBED_BASE_URL = 'https://t-everyclass.vsaidt.com';

type Props = { slideId: string };

export const LessonViewerEmbed = ({ slideId }: Props) => {
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = slideRef.current;
    if (!el) return;

    let cancelled = false;
    let handle: {
      destroy?: () => void;
      on?: (e: string, cb: (p: unknown) => void) => void;
    } | null = null;

    const run = async () => {
      const { createEmbed } = await import(
        /* @vite-ignore */ `${EMBED_BASE_URL}/sdk/embed/index.js`
      );
      if (cancelled || !slideRef.current) return;

      handle = createEmbed(slideRef.current, {
        embedBaseUrl: EMBED_BASE_URL,
        mode: 'viewer',
        slideId,
        getToken: async () => {
          // 백엔드가 scope=viewer 토큰을 발급해야 함
          const res = await fetch(
            `/api/everyclass/embed-token?scope=viewer&slideId=${encodeURIComponent(slideId)}`,
          );
          if (!res.ok) {
            throw new Error(`embed-token 발급 실패: ${res.status}`);
          }
          const json = (await res.json()) as {
            token?: string;
            resultData?: { token?: string };
          };
          const token = json.token ?? json.resultData?.token;
          if (!token) {
            throw new Error('embed-token 응답에 token 이 없습니다.');
          }
          return token;
        },
      });

      handle?.on?.('slideChanged', (p) => console.log('수업 슬라이드 이동', p));
      handle?.on?.('completed', (p) => console.log('수업 완료', p));
    };

    void run();
    return () => {
      cancelled = true;
      handle?.destroy?.();
    };
  }, [slideId]);

  return <SlideContainer ref={slideRef} id='slide-viewer' />;
};
