import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

const EditorContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #fff;
`;

const EMBED_BASE_URL = 'https://t-everyclass.vsaidt.com';

type Props = {
  /** 있으면 기존 슬라이드 편집, 없으면 신규(/embed/editor/new) */
  slideId?: string;
};

export const LessonEditorEmbed = ({ slideId }: Props) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    let cancelled = false;
    let handle: {
      destroy?: () => void;
      on?: (e: string, cb: (p: unknown) => void) => void;
      save?: () => Promise<void>;
    } | null = null;

    const run = async () => {
      const { createEmbed } = await import(
        /* @vite-ignore */ `${EMBED_BASE_URL}/sdk/embed/index.js`
      );
      if (cancelled || !editorRef.current) return;

      handle = createEmbed(editorRef.current, {
        embedBaseUrl: EMBED_BASE_URL,
        mode: 'editor',
        ...(slideId ? { slideId } : {}),
        getToken: async () => {
          // 백엔드가 scope=editor 토큰을 발급해야 함
          const qs = new URLSearchParams({ scope: 'editor' });
          if (slideId) qs.set('slideId', slideId);
          const res = await fetch(`/api/everyclass/embed-token?${qs}`);
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
        theme: { '--ec-color-accent': '#6C5CE7' },
        locale: 'ko-KR',
        style: { height: 600 },
      });

      handle?.on?.('saved', (p) => {
        // { slideId, thumbnail? } — 신규 저장 후 발급된 id를 라우트/상태에 반영
        console.log('저장됨', p);
      });
      handle?.on?.('dirty', (p) => console.log('변경 여부', p));
    };

    void run();
    return () => {
      cancelled = true;
      handle?.destroy?.();
    };
  }, [slideId]);

  return <EditorContainer ref={editorRef} id='slide-editor' />;
};
