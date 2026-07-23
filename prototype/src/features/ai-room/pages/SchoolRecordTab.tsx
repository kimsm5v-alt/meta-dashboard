import { useState } from 'react';
import { Plus, Sparkles, Copy, Check, X } from 'lucide-react';
import { TargetPicker, type TargetSelection } from '../components/TargetPicker';
import { generateSchoolRecord } from '../services/assistantService';
import { emptySelection, getSelectedStudents } from '../utils/targets';
import type { RecordToneType } from '../types';

const TONES: RecordToneType[] = ['종합', '강점 중심', '행동·태도'];

/** B-4. 탭 2 — 생활기록부 작성 */
export const SchoolRecordTab: React.FC = () => {
  const [selection, setSelection] = useState<TargetSelection>(emptySelection());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [tone, setTone] = useState<RecordToneType>('종합');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const students = getSelectedStudents(selection);
  const activeStudent = students.find((s) => s.id === activeStudentId) ?? null;

  const handleGenerate = async () => {
    if (!activeStudent) return;
    setLoading(true);
    setResult('');
    const text = await generateSchoolRecord(activeStudent.name, tone);
    setResult(text);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[760px] mx-auto px-6 py-8">
        <h2 className="text-[18px] font-bold text-gray-900 mb-1">생활기록부 문구 작성</h2>
        <p className="text-[13px] text-gray-400 mb-6">검사 결과를 바탕으로 문구 초안을 생성합니다.</p>

        {/* 1. 대상 학생 */}
        <section className="mb-6">
          <label className="block text-[13px] font-semibold text-gray-700 mb-2">대상 학생</label>
          <div className="relative flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-white bg-primary-500 hover:bg-primary-600 px-3 py-1.5 rounded-full"
            >
              <Plus className="w-3.5 h-3.5" />
              학생 선택
            </button>
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStudentId(s.id)}
                className={`inline-flex items-center gap-1 text-[12.5px] px-2.5 py-1.5 rounded-full border transition-colors ${
                  activeStudentId === s.id
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
                }`}
              >
                {s.name}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelection((sel) => {
                      const next = { ...sel.byClass };
                      const remaining = (next[s.classId] ?? []).filter((id) => id !== s.id);
                      if (remaining.length) next[s.classId] = remaining;
                      else delete next[s.classId];
                      return { byClass: next };
                    });
                    if (activeStudentId === s.id) setActiveStudentId(null);
                  }}
                  className={activeStudentId === s.id ? 'text-white/70 hover:text-white' : 'text-primary-400 hover:text-primary-600'}
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            ))}
            {pickerOpen && (
              <TargetPicker
                selection={selection}
                onChange={setSelection}
                onClose={() => setPickerOpen(false)}
                title="학생 선택"
              />
            )}
          </div>
          {students.length > 0 && (
            <p className="text-[12px] text-gray-400 mt-2">칩을 클릭해 문구를 생성할 학생 1명을 지정하세요.</p>
          )}
        </section>

        {!activeStudent ? (
          <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-2xl">
            학생을 선택하세요
          </div>
        ) : (
          <>
            {/* 2. 문구 유형 */}
            <section className="mb-6">
              <label className="block text-[13px] font-semibold text-gray-700 mb-2">문구 유형</label>
              <div className="inline-flex bg-gray-100 rounded-xl p-1">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-colors ${
                      tone === t ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>

            {/* 3. 생성 */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 px-5 py-2.5 rounded-xl transition-colors mb-6"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? '생성 중…' : `${activeStudent.name} 문구 생성`}
            </button>

            {/* 4. 결과 */}
            {result && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-semibold text-gray-700">생성 결과</label>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-600 hover:text-primary-600 px-2.5 py-1 rounded-lg hover:bg-gray-100"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? '복사됨' : '복사'}
                  </button>
                </div>
                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  rows={7}
                  className="w-full text-[14px] leading-relaxed text-gray-800 bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary-300 resize-y"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[12px] text-gray-400">참고용 초안 · 교사 검토 후 사용하세요</p>
                  <span className="text-[12px] text-gray-400">{result.length}자</span>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
