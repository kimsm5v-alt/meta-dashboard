import { useEffect, useState } from 'react';
import { Sparkles, Download, Copy, Check, Eye, X, ArrowLeft, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { StatusBadge, FactorTag, displayStatus, type DisplayStatusKey } from './shared';
import { classSubtitle } from './schoolInfo';
import { buildRecordsCsv, downloadCsv } from './download';
import type { RecordClass, RecordStudent } from './types';

type SortKey = 'no' | 'name' | 'strength' | 'improvement' | 'status' | 'updated';
type SortState = { key: SortKey; dir: 'asc' | 'desc' };
const STATUS_ORDER: Record<DisplayStatusKey, number> = { empty: 0, inprogress: 1, done: 2 };

/** 정렬 가능한 표 헤더 셀 */
const SortableTh: React.FC<{ label: string; sortKey: SortKey; sort: SortState; onSort: (k: SortKey) => void; className?: string }> = ({ label, sortKey, sort, onSort, className = '' }) => {
  const active = sort.key === sortKey;
  return (
    <th className={`px-4 py-3 text-left ${className}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`group inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${active ? 'text-primary-600' : 'text-gray-700 hover:text-gray-900'}`}
      >
        {label}
        <span className={`inline-flex items-center justify-center w-4 h-4 rounded transition-colors ${active ? 'bg-primary-100 text-primary-600' : 'text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600'}`}>
          {active
            ? (sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" strokeWidth={2.5} /> : <ChevronDown className="w-3 h-3" strokeWidth={2.5} />)
            : <ChevronsUpDown className="w-3 h-3" strokeWidth={2.5} />}
        </span>
      </button>
    </th>
  );
};

interface Props {
  /** LNB에서 선택된 학급 */
  selectedClass: RecordClass;
  students: RecordStudent[];
  onOpenStudent: (id: string) => void;
  onBulk: (ids: string[]) => void;
  /** 전체(반 미선택)로 돌아가기 */
  onBackToAll: () => void;
}

export const ClassStatusView: React.FC<Props> = ({ selectedClass, students, onOpenStudent, onBulk, onBackToAll }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>({ key: 'no', dir: 'asc' });

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  // 학급이 바뀌면 선택/정렬 초기화
  useEffect(() => {
    setSelected([]);
    setSort({ key: 'no', dir: 'asc' });
  }, [selectedClass.id]);

  const visible = students;

  const sortVal = (s: RecordStudent): string | number => {
    switch (sort.key) {
      case 'no': return s.no;
      case 'name': return s.name;
      case 'strength': return s.strengths[0] ?? '';
      case 'improvement': return s.improvements[0] ?? '';
      case 'status': return STATUS_ORDER[displayStatus(s.status).key];
      case 'updated': return s.savedAt ?? '';
    }
  };
  const sorted = [...visible].sort((a, b) => {
    const va = sortVal(a);
    const vb = sortVal(b);
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'ko');
    return sort.dir === 'asc' ? cmp : -cmp;
  });

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

  const hasText = (s: RecordStudent) => (s.savedText ?? '').trim().length > 0;
  // 선택 학생 중 생성 문구가 있는 학생만 다운로드 대상
  const downloadTargets = students.filter((s) => selected.includes(s.id) && hasText(s));
  // 미리보기: 선택이 있으면 선택 학생 중 문구 보유자, 없으면 반 전체 중 문구 보유자
  const selectedStudents = students.filter((s) => selected.includes(s.id));
  const previewList = selected.length > 0 ? selectedStudents.filter(hasText) : students.filter(hasText);
  // 선택 중 1명 이상 문구가 있으면 활성(모두 없을 때만 비활성)
  const canPreview = previewList.length > 0;
  const download = (targets: RecordStudent[]) => {
    if (targets.length === 0) return;
    downloadCsv(`생활기록부_문구_${selectedClass.name.replace(/\s/g, '')}.csv`, buildRecordsCsv(targets));
  };

  return (
    <div className="p-6 space-y-6">
      {/* 페이지 헤더 (반 상세) + 우측 액션 버튼 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button onClick={onBackToAll} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="전체 반으로">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedClass.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{classSubtitle(selectedClass.name)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setPreviewOpen(true)}
            disabled={!canPreview}
            title={!canPreview ? '생성된 문구가 있는 학생이 없습니다' : undefined}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:text-gray-300 disabled:border-gray-200 disabled:hover:bg-white px-3.5 py-2 rounded-lg"
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

      {/* 학생 목록 카드 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">학생 목록</h2>
          <span className="text-sm text-gray-400">{selectedClass.students.length}명</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="w-12 px-4 py-3 text-center">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="w-4 h-4 accent-primary-500 align-middle" />
                </th>
                <SortableTh label="번호" sortKey="no" sort={sort} onSort={toggleSort} className="whitespace-nowrap" />
                <SortableTh label="이름" sortKey="name" sort={sort} onSort={toggleSort} className="whitespace-nowrap" />
                <SortableTh label="강점 요인 TOP 3" sortKey="strength" sort={sort} onSort={toggleSort} className="w-[26%]" />
                <SortableTh label="보완 요인 TOP 3" sortKey="improvement" sort={sort} onSort={toggleSort} className="w-[26%]" />
                <SortableTh label="작성 상태" sortKey="status" sort={sort} onSort={toggleSort} className="whitespace-nowrap" />
                <SortableTh label="최근 수정일" sortKey="updated" sort={sort} onSort={toggleSort} className="whitespace-nowrap" />
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">편집</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-center">
                    <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleOne(s.id)} className="w-4 h-4 accent-primary-500 align-middle" />
                  </td>
                  <td className="px-4 py-4"><span className="text-sm text-gray-600 whitespace-nowrap">{s.no}번</span></td>
                  <td className="px-4 py-4">
                    <button onClick={() => onOpenStudent(s.id)} className="text-sm font-medium text-gray-900 hover:text-primary-600 whitespace-nowrap">
                      {s.name}
                    </button>
                  </td>
                  <td className="px-4 py-4"><div className="flex flex-wrap gap-1">{s.strengths.map((f) => <FactorTag key={f} label={f} />)}</div></td>
                  <td className="px-4 py-4"><div className="flex flex-wrap gap-1">{s.improvements.map((f) => <FactorTag key={f} label={f} />)}</div></td>
                  <td className="px-4 py-4"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-4"><span className="text-[13px] text-gray-500 whitespace-nowrap">{s.savedAt ?? '-'}</span></td>
                  <td className="px-4 py-4 text-center">
                    <button onClick={() => onOpenStudent(s.id)} className="whitespace-nowrap text-[12.5px] font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-3 py-1.5 rounded-lg">
                      {displayStatus(s.status).action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <div className="text-center text-gray-400 text-sm py-10">해당 상태의 학생이 없습니다.</div>}
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
                  <span className="text-[12px] font-medium text-gray-400">{previewList.length}명</span>
                </div>
                <p className="text-[12px] text-gray-400 mt-1">{selectedClass.name} · {selected.length > 0 ? '선택 학생 문구' : '생성 완료 문구'}</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 space-y-2.5">
              {previewList.length === 0 ? (
                <div className="text-center text-gray-400 text-[13px] py-12 break-keep">아직 생성된 문구가 없습니다.</div>
              ) : (
                previewList.map((s) => (
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
                onClick={() => download(previewList)}
                disabled={previewList.length === 0}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 px-3.5 py-2 rounded-lg"
              >
                <Download className="w-4 h-4" /> {selected.length > 0 ? '다운로드' : '전체 다운로드'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
