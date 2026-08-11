import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { LessonLibraryHeader } from '@widgets/lesson';

const Page = styled.section`
  /* padding: ${({ theme }) => theme.spacing.md} 20px 0; */
`;

const SlideContainer = styled.div`
  height: 600px;
  width: 100%;
`;

const EMBED_BASE_URL = 'https://t-everyclass.vsaidt.com';
const SLIDE_ID = 'slide_123';

export const LessonLibraryPage = () => {
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = slideRef.current;
    if (!el) return;

    let cancelled = false;
    let handle: {
      destroy?: () => void;
      on?: (event: string, cb: (p: unknown) => void) => void;
    } | null = null;

    const run = async () => {
      const { createEmbed } = await import(
        /* @vite-ignore */ `${EMBED_BASE_URL}/sdk/embed/index.js`
      );

      if (cancelled || !slideRef.current) return;

      handle = createEmbed(slideRef.current, {
        embedBaseUrl: EMBED_BASE_URL,
        slideId: SLIDE_ID,
        getToken: async () => {
          const res = await fetch(`/api/everyclass/embed-token?slideId=${SLIDE_ID}`);
          return (await res.json()).token;
        },
      });

      handle?.on?.('slideChanged', (p) => console.log('이동', p));
    };

    void run();

    return () => {
      cancelled = true;
      handle?.destroy?.();
    };
  }, []);

  return (
    <Page>
      <LessonLibraryHeader />
      {/* <SlideContainer ref={slideRef} id='slide' /> */}
    </Page>
  );
};

export default LessonLibraryPage;
