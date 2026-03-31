import styled from '@emotion/styled';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Heading2 } from 'lucide-react';

const Container = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ToolbarButton = styled.button<{ $isActive: boolean }>`
  padding: 0.5rem;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $isActive, theme }) => ($isActive ? theme.colors.gray[200] : 'transparent')};
  color: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[600] : theme.colors.gray[600])};
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 1.25rem;
  background: ${({ theme }) => theme.colors.gray[300]};
  margin: 0 0.25rem;
`;

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = '내용을 입력하세요...',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-gray max-w-none min-h-[350px] p-4 focus:outline-none',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL을 입력하세요', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <Container>
      {/* 툴바 */}
      <Toolbar>
        <ToolbarButton
          type='button'
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          $isActive={editor.isActive('heading', { level: 2 })}
          title='제목'
        >
          <Heading2 className='w-4 h-4' />
        </ToolbarButton>
        <ToolbarButton
          type='button'
          onClick={() => editor.chain().focus().toggleBold().run()}
          $isActive={editor.isActive('bold')}
          title='굵게'
        >
          <Bold className='w-4 h-4' />
        </ToolbarButton>
        <ToolbarButton
          type='button'
          onClick={() => editor.chain().focus().toggleItalic().run()}
          $isActive={editor.isActive('italic')}
          title='기울임'
        >
          <Italic className='w-4 h-4' />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          type='button'
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          $isActive={editor.isActive('bulletList')}
          title='글머리 기호'
        >
          <List className='w-4 h-4' />
        </ToolbarButton>
        <ToolbarButton
          type='button'
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          $isActive={editor.isActive('orderedList')}
          title='번호 매기기'
        >
          <ListOrdered className='w-4 h-4' />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          type='button'
          onClick={setLink}
          $isActive={editor.isActive('link')}
          title='링크'
        >
          <LinkIcon className='w-4 h-4' />
        </ToolbarButton>
      </Toolbar>

      {/* 에디터 영역 */}
      <EditorContent editor={editor} />
    </Container>
  );
};
