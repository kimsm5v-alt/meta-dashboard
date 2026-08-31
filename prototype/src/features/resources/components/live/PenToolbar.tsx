/**
 * 필기 도구 바 — 펜 / 형광펜 / 지우개 + 색상 + 되돌리기 + 전체 지우기.
 * 도구를 다시 누르면 해제되고, 해제 상태에서는 캔버스가 입력을 받지 않는다.
 */
import { Eraser, Highlighter, Pen, Trash2, Undo2 } from 'lucide-react';
import { colorsFor, type ToolId } from './annotationTypes';

interface PenToolbarProps {
  tool: ToolId | null;
  onTool: (t: ToolId | null) => void;
  color: string;
  onColor: (c: string) => void;
  canUndo: boolean;
  onUndo: () => void;
  onClear: () => void;
}

const TOOLS: { id: ToolId; label: string; Icon: typeof Pen }[] = [
  { id: 'pen', label: '펜', Icon: Pen },
  { id: 'highlighter', label: '형광펜', Icon: Highlighter },
  { id: 'eraser', label: '지우개', Icon: Eraser },
];

const btn = (on: boolean) =>
  `flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition-colors ${
    on ? 'bg-primary-500 text-white' : 'hover:bg-white/10'
  }`;

export const PenToolbar = ({ tool, onTool, color, onColor, canUndo, onUndo, onClear }: PenToolbarProps) => (
  <>
    {TOOLS.map(({ id, label, Icon }) => (
      <button key={id} onClick={() => onTool(tool === id ? null : id)} className={btn(tool === id)} title={label}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </button>
    ))}

    {tool && tool !== 'eraser' && (
      <span className="flex items-center gap-1 pl-1">
        {colorsFor(tool).map((c) => (
          <button
            key={c}
            onClick={() => onColor(c)}
            aria-label={`색상 ${c}`}
            style={{ background: c }}
            className={`h-4 w-4 rounded-full transition-transform ${
              color === c ? 'scale-125 ring-2 ring-white' : 'ring-1 ring-white/40 hover:scale-110'
            }`}
          />
        ))}
      </span>
    )}

    <button
      onClick={onUndo}
      disabled={!canUndo}
      title="되돌리기"
      className="rounded-lg px-2 py-1 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Undo2 className="h-3.5 w-3.5" />
    </button>
    <button
      onClick={onClear}
      disabled={!canUndo}
      title="이 페이지 필기 전체 지우기"
      className="rounded-lg px-2 py-1 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  </>
);
