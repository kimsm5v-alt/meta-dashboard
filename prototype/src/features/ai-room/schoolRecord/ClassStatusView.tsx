import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, ChevronDown, Download, Copy, Check, Eye, X } from 'lucide-react';
import { StatusBadge, LpaBadge, FactorTag, displayStatus, type DisplayStatusKey } from './shared';
import { buildRecordsCsv, downloadCsv } from './download';
import type { RecordClass, RecordStudent } from './types';

interface Props {
  classes: RecordClass[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  students: RecordStudent[];
  onOpenStudent: (id: string) => void;
  onBulk: (ids: string[]) => void;
}

type FilterKey = 'ALL' | DisplayStatusKey;
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'empty', label: '미작성' },
  { key: 'inprogress', label: '작성 중' },
  { key: 'done', label: '작성 완료' },
];

export const ClassStatusView: React.FC<Props> = ({ classes, selectedClassId, onSelectClass, students, onOpenStudent, onBulk }) => {
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [selected, setSelected] = useState<string[]>([]);
  const [classOpen, setClassOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const classRef = useRef<HTMLDivElement>(null);

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? classes[0];

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (classRef.current && !classRef.current.contains(e.target as Node)) setClassOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const counts = useMemo(() => {
    const c = { total: students.length, empty: 0, inprogress: 0, done: 0 };
    students.forEach((s) => { c[displayStatus(s.status).key] += 1; });
    return c;
  }, [students]);

  const visible = filter === 'ALL' ? students : students.filter((s) => displayStatus(s.status).key === filter);
  const allVisibleSelected = visible.length > 0 && visible.every((s) => selected.includes(s.id));

  const toggleAll = () => {
    setSelected(allVisibleSelected ? selected.filter((id) => !visible.some((s) => s.id === id)) : [...new Set([...selected, ...visible.map((s) => s.id)])]);
  };
  const toggleOne = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const copyText = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
  };

  useEffect(() => {
    if (!previewOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [previewOpen]);

  // 선택 학생 중 생성 문구가 있는 학생만 다운로드 대상
  const downloadTargets = students.filter((s) => selected.includes(s.id) && (s.savedText ?? '').trim().length > 0);
  // 미리보기 대상 — 반 전체 중 생성 문구가 있는 학생
  const previewTargets = students.filter((s) => (s.savedText ?? '').trim().length > 0);
  const download = (targets: RecordStudent[]) => {
    if (targets.length === 0) return;
    downloadCsv(`생활기록부_문구_${selectedClass.group}_${selectedClass.name.replace(/\s/g, '')}.csv`, buildRecordsCsv(targets));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[900px] mx-auto px-6 py-6">
        <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mb-3">
        {/* 학급 선택 */}
        <div ref={classRef} className="relative inline-block">
          <button
            onClick={() => setClassOpen((v) => !v)}
            className="inline-flex items-center gap-2 text-[14px] font-bold text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3.5 py-2 rounded-xl"
          >
            {selectedClass.group}
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-200/70 px-1.5 py-0.5 rounded-md">{selectedClass.name}</span>
            <span className="text-[11px] font-medium text-gray-400">{selectedClass.students.length}명</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {classOpen && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onSelectClass(c.id); setClassOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3.5 py-2 text-[13.5px] hover:bg-gray-50 ${
                    c.id === selectedClassId ? 'text-primary-600 font-semibold' : 'text-gray-700'
                  }`}
                >
                  <span>{c.group}</span>
                  <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${c.id === selectedClassId ? 'text-primary-600 bg-primary-50' : 'text-gray-500 bg-gray-100'}`}>{c.name}</span>
                  <span className="text-[11px] text-gray-400 ml-auto">{c.students.length}명</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="w-px h-5 bg-gray-200" />
        {/* 필터 (인원 수 포함) */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const n = f.key === 'ALL' ? counts.total : counts[f.key];
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  active ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f.label}
                <span className={`text-[11px] font-semibold ${active ? 'text-white/80' : 'text-gray-400'}`}>{n}</span>
              </button>
            );
          })}
        </div>
        </div>

        {/* 선택 액션 바 */}
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-[13px] text-gray-600 cursor-pointer">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="w-4 h-4 accent-primary-500" />
            전체 선택
          </label>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <button onClick={() => setSelected([])} className="text-[12.5px] text-gray-500 hover:text-gray-700 px-2 py-1.5">
                {selected.length}명 선택 해제
              </button>
            )}
            <button
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-3.5 py-2 rounded-lg"
            >
              <Eye className="w-4 h-4" />
              문구 미리보기
            </button>
            <button
              onClick={() => download(downloadTargets)}
              disabled={downloadTargets.length === 0}
              title={downloadTargets.length === 0 ? '생성 문구가 있는 학생을 선택하세요' : undefined}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:text-gray-300 disabled:border-gray-200 disabled:hover:bg-white px-3.5 py-2 rounded-lg"
            >
              <Download className="w-4 h-4" />
              문구 다운로드{downloadTargets.length > 0 ? ` (${downloadTargets.length})` : ''}
            </button>
            <button
              onClick={() => onBulk(selected)}
              disabled={selected.length === 0}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 px-3.5 py-2 rounded-lg"
            >
              <Sparkles className="w-4 h-4" />
              선택 학생 문구 만들기
            </button>
          </div>
        </div>

        {/* 학생 표 */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[12px]">
                <th className="w-10 py-2.5"></th>
                <th className="text-left px-2 py-2.5 font-semibold">학생</th>
                <th className="text-left px-2 py-2.5 font-semibold">LPA 유형</th>
                <th className="text-left px-2 py-2.5 font-semibold">강점 요인 TOP 3</th>
                <th className="text-left px-2 py-2.5 font-semibold w-24">작성 상태</th>
                <th className="w-20 px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-primary-50/30">
                  <td className="text-center">
                    <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleOne(s.id)} className="w-4 h-4 accent-primary-500" />
                  </td>
                  <td className="px-2 py-2.5">
                    <button onClick={() => onOpenStudent(s.id)} className="font-semibold text-gray-800 hover:text-primary-600">
                      {s.no}번 {s.name}
                    </button>
                  </td>
                  <td className="px-2 py-2.5"><LpaBadge type={s.lpaType} /></td>
                  <td className="px-2 py-2.5"><div className="flex flex-wrap gap-1">{s.strengths.map((f) => <FactorTag key={f} label={f} />)}</div></td>
                  <td className="px-2 py-2.5"><StatusBadge status={s.status} /></td>
                  <td className="px-2 py-2.5 text-right">
                    <button onClick={() => onOpenStudent(s.id)} className="whitespace-nowrap text-[12.5px] font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-3 py-1.5 rounded-lg">
                      {displayStatus(s.status).action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <div className="text-center text-gray-400 text-[13px] py-10">해당 상태의 학생이 없습니다.</div>}
        </div>
      </div>

      {/* 생성 문구 미리보기 (모달) */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPreviewOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[560px] max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="flex items-start justify-between p-5 pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  <span className="text-[14.5px] font-bold text-gray-900">문구 미리보기</span>
                  <span className="text-[12px] font-medium text-gray-400">{previewTargets.length}명</span>
                </div>
                <p className="text-[12px] text-gray-400 mt-1">{selectedClass.group} · {selectedClass.name} · 생성 완료 문구</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 space-y-2.5">
              {previewTargets.length === 0 ? (
                <div className="text-center text-gray-400 text-[13px] py-12 break-keep">아직 생성된 문구가 없습니다.</div>
              ) : (
                previewTargets.map((s) => (
                  <div key={s.id} className="border border-gray-200 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-gray-800">{s.no}번 {s.name}{s.savedAt ? <span className="ml-1.5 text-[11px] font-normal text-gray-400">· {s.savedAt}</span> : null}</span>
                      <button
                        onClick={() => copyText(s.id, s.savedText ?? '')}
                        className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-primary-600 px-2 py-1 rounded-lg hover:bg-gray-50"
                      >
                        {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === s.id ? '복사됨' : '복사'}
                      </button>
                    </div>
                    <p className="text-[13px] leading-[1.75] text-gray-700 whitespace-pre-wrap break-keep">{s.savedText}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-5 pt-3 mt-2.5 border-t border-gray-100">
              <button onClick={() => setPreviewOpen(false)} className="text-[13px] font-medium text-gray-600 hover:bg-gray-100 px-3.5 py-2 rounded-lg">닫기</button>
              <button
                onClick={() => download(previewTargets)}
                disabled={previewTargets.length === 0}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 px-3.5 py-2 rounded-lg"
              >
                <Download className="w-4 h-4" /> 전체 다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
