import { useState } from 'react';
import { ArrowLeft, Sparkles, Copy, Check, RotateCcw, Pencil, AlertTriangle, History, Save } from 'lucide-react';
import { FactorTag } from './shared';
import { classSubtitle } from './schoolInfo';
import { FACTOR_INFO, FREETEXT_PLACEHOLDER, MOCK_COUNSELING } from './data';
import { generateRecordText, checkForbiddenWords, countChars, type RecordAction } from './service';
import type { ObservationInput, RecordStudent } from './types';

interface Props {
  student: RecordStudent;
  onBack: () => void;
  onPatch: (patch: Partial<RecordStudent>) => void;
}

/** 생성 기준 입력 시그니처 — 요인·행동·장면·상담 선택이 바뀌면 값이 달라짐 */
const inputSig = (inp: ObservationInput): string =>
  JSON.stringify({
    f: [...inp.factorCodes].sort(),
    b: [...inp.behaviorCodes].sort(),
    t: (inp.freeText ?? '').trim(),
    c: [...(inp.counselingRefs ?? [])].sort(),
  });

export const StudentWritingView: React.FC<Props> = ({ student, onBack, onPatch }) => {
  const [input, setInput] = useState<ObservationInput>(student.input);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ text: string; tags: string[] } | null>(
    student.savedText ? { text: student.savedText, tags: [] } : null,
  );
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPrev, setShowPrev] = useState(false);
  const [tempSaved, setTempSaved] = useState(false);
  // 결과 생성 시점의 입력 시그니처 (이후 입력이 바뀌면 '다시 생성' 안내)
  const [genSig, setGenSig] = useState<string | null>(student.savedText ? inputSig(student.input) : null);

  const allFactors = [...student.strengths, ...student.improvements];
  const counselingRecords = MOCK_COUNSELING[student.scopeId] ?? [];
  const reflectedRefs = input.counselingRefs ?? [];

  // 입력은 로컬 상태로만 유지 (자동저장 X) — 임시저장/생성/저장 시에만 반영
  const patch = (p: Partial<ObservationInput>) => {
    setInput((prev) => ({ ...prev, ...p }));
    if (tempSaved) setTempSaved(false);
  };

  // ① 체크박스 — 선택한 요인만 하단 질문 노출
  const toggleFactor = (f: string) => {
    if (input.factorCodes.includes(f)) {
      const rec = FACTOR_INFO[f]?.recommendedBehaviors ?? [];
      patch({ factorCodes: input.factorCodes.filter((x) => x !== f), behaviorCodes: input.behaviorCodes.filter((b) => !rec.includes(b)) });
    } else {
      patch({ factorCodes: [...input.factorCodes, f] });
    }
  };

  const toggleBehavior = (b: string) =>
    patch({ behaviorCodes: input.behaviorCodes.includes(b) ? input.behaviorCodes.filter((x) => x !== b) : [...input.behaviorCodes, b] });

  const toggleCounseling = (id: string) =>
    patch({ counselingRefs: reflectedRefs.includes(id) ? reflectedRefs.filter((x) => x !== id) : [...reflectedRefs, id] });

  const selectedFactors = allFactors.filter((f) => input.factorCodes.includes(f));
  const canGenerate = input.behaviorCodes.length >= 1;
  const hasDraftInput = input.factorCodes.length > 0 || input.behaviorCodes.length > 0 || (input.freeText ?? '').trim().length > 0 || reflectedRefs.length > 0;
  const hasInput = Boolean(result) || hasDraftInput;

  // 임시저장 — 누른 경우에만 '작성 중'으로 표시 (기존 완료 상태는 유지)
  const handleTempSave = () => {
    if (!hasDraftInput) return;
    onPatch({ input, status: student.status === 'EMPTY' ? 'INPUTTING' : student.status, savedAt: '방금' });
    setTempSaved(true);
    setTimeout(() => setTempSaved(false), 2500);
  };

  const runGenerate = async (action: RecordAction) => {
    if (!canGenerate) return;
    setGenerating(true);
    onPatch({ status: 'GENERATING' });
    const counselingTexts = counselingRecords.filter((r) => reflectedRefs.includes(r.id)).map((r) => r.summary);
    const res = await generateRecordText(student, input, action, counselingTexts);
    setResult({ text: res.text, tags: res.referencedTags });
    setGenSig(inputSig(input));
    setEditMode(false);
    setGenerating(false);
    onPatch({ generatedText: res.text, status: 'DRAFT', input });
  };

  const handleSave = () => {
    const text = editMode ? editText : result?.text ?? '';
    if (!text) return;
    onPatch({ previousSavedText: student.savedText, savedText: text, status: editMode ? 'EDITED' : 'DRAFT', savedAt: '방금', input });
    setEditMode(false);
    setResult({ text, tags: result?.tags ?? [] });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editMode ? editText : result?.text ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = () => {
    const prev = student.previousSavedText;
    if (!prev) return;
    onPatch({ savedText: prev, previousSavedText: student.savedText, status: 'DRAFT' });
    setResult({ text: prev, tags: [] });
    setGenSig(inputSig(input));
    setEditMode(false);
    setShowPrev(false);
  };

  const reset = () => {
    const cleared = { factorCodes: [], situationCodes: [], behaviorCodes: [], freeText: '', counselingRefs: [] };
    setInput(cleared);
    setResult(null);
    setGenSig(null);
    setEditMode(false);
    onPatch({ input: cleared, generatedText: undefined, status: 'EMPTY' });
  };

  const currentText = editMode ? editText : result?.text ?? '';
  const forbidden = currentText ? checkForbiddenWords(currentText) : [];
  // 생성 이후 입력이 바뀌면 결과가 오래됨 → 다시 생성 안내
  const stale = Boolean(result) && genSig !== null && inputSig(input) !== genSig;

  return (
    <div className="p-6">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="학급 현황">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900">{student.no}번 {student.name}</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">{classSubtitle(student.className)}</p>
            </div>
          </div>
          {hasInput && (
            <button onClick={reset} className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600">
              <RotateCcw className="w-3.5 h-3.5" /> 처음부터
            </button>
          )}
        </div>

        <div className="space-y-3.5">
        {/* ① 검사 결과 요인 선택 + 선생님이 관찰한 모습 (한 박스, 구분선) */}
        <Section step="1" title="검사 결과에서 살펴볼 요인" subtitle="실제로 관찰한 요인을 선택하면 아래에 관찰 질문이 나타납니다.">
          <div className="space-y-4">
            <FactorPickRow label="강점 요인 TOP 3" factors={student.strengths} selected={input.factorCodes} onToggle={toggleFactor} />
            <FactorPickRow label="보완 요인 TOP 3" factors={student.improvements} selected={input.factorCodes} onToggle={toggleFactor} />
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4">
            <header className="flex items-start gap-2.5 mb-3.5">
              <span className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">2</span>
              <div className="pt-0.5">
                <h4 className="text-[15px] font-bold text-gray-900 leading-none">선생님이 관찰한 모습</h4>
                <p className="text-[12px] text-gray-400 mt-1.5 break-keep">선택한 요인의 관찰 질문에 답하고, 필요하면 구체적 장면을 적어 주세요.</p>
              </div>
            </header>
            {selectedFactors.length === 0 ? (
              <div className="text-center py-6 text-[13px] text-gray-400 bg-gray-50 rounded-xl break-keep">위에서 관찰한 요인을 선택하면 질문이 나타납니다.</div>
            ) : (
              <div className="space-y-3">
                {selectedFactors.map((f) => {
                  const info = FACTOR_INFO[f];
                  if (!info) return null;
                  return (
                    <div key={f} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-2.5">
                        <FactorTag label={f} />
                        <span className="text-[13.5px] font-medium text-gray-800 break-keep">{info.question}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {info.recommendedBehaviors.map((b) => {
                          const on = input.behaviorCodes.includes(b);
                          return (
                            <button
                              key={b}
                              onClick={() => toggleBehavior(b)}
                              className={`flex items-center gap-2 text-left text-[13px] px-3 py-2.5 rounded-lg border transition-colors ${
                                on ? 'border-primary-300 bg-primary-50 text-primary-700 font-semibold' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 ${on ? 'bg-primary-500 border-primary-500' : 'bg-white border-gray-300'}`}>
                                {on && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                              </span>
                              <span className="break-keep">{b}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 구체적 장면 */}
            <StepLabel className="mt-4">구체적인 장면이 있다면 적어주세요 <em className="text-gray-400 not-italic">(선택)</em></StepLabel>
            <textarea
              value={input.freeText ?? ''}
              onChange={(e) => patch({ freeText: e.target.value })}
              rows={2}
              maxLength={100}
              placeholder={FREETEXT_PLACEHOLDER[student.schoolLevel]}
              className="w-full text-[13px] px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary-300 resize-none placeholder:text-gray-400"
            />

            <div className="flex items-center justify-end gap-2.5 mt-3">
              {tempSaved && (
                <span className="inline-flex items-center gap-1 text-[12px] text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> 임시저장되었습니다
                </span>
              )}
              <button
                onClick={handleTempSave}
                disabled={!hasDraftInput}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:text-gray-300 disabled:border-gray-200 px-3.5 py-1.5 rounded-lg"
              >
                <Save className="w-3.5 h-3.5" /> 임시저장
              </button>
            </div>
          </div>
        </Section>

        {/* ② 상담·관찰 기록 (참고) */}
        {counselingRecords.length > 0 && (
          <section className="bg-[#f3f6fb] border border-blue-100 rounded-2xl p-5">
            <header className="mb-3">
              <h3 className="flex items-center gap-1.5 text-[15px] font-bold text-gray-900 leading-none">
                상담·관찰 기록
                <span className="text-[11px] font-medium text-gray-400">참고 · {counselingRecords.length}건</span>
              </h3>
              <p className="text-[12px] text-gray-400 mt-1.5 break-keep">문구에 반영할 기록을 선택하세요.</p>
            </header>
            <div className="space-y-1.5">
              {counselingRecords.map((r) => {
                const on = reflectedRefs.includes(r.id);
                return (
                  <label key={r.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${on ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={on} onChange={() => toggleCounseling(r.id)} className="w-4 h-4 accent-primary-500 flex-shrink-0" />
                    <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">{r.category}</span>
                    <span className="text-[13px] text-gray-700 break-keep flex-1 min-w-0 truncate">{r.summary}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{r.date}</span>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* AI 생성 문구 — 결과물이므로 번호 없음 */}
        <Section
          title="AI 생성 문구"
          subtitle="선택한 정보로 참고 문구를 생성합니다. 생성 후 편집·저장할 수 있어요."
          headerRight={student.previousSavedText ? (
            <button onClick={() => setShowPrev((v) => !v)} className="inline-flex items-center gap-1 text-[12.5px] text-gray-500 hover:text-primary-600">
              <History className="w-3.5 h-3.5" /> 이전 문구 보기
            </button>
          ) : undefined}
        >
          {/* 직전 문구 확인·복원 (헤더 '이전 문구 보기' 토글) */}
          {showPrev && student.previousSavedText && (
            <div className="mb-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-semibold text-gray-500">이전 저장 문구{student.savedAt ? ` · ${student.savedAt} 저장` : ''}</span>
                <button onClick={handleRestore} className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary-600 hover:bg-primary-50 px-2 py-1 rounded-lg">
                  <RotateCcw className="w-3 h-3" /> 현재 문구로 복원
                </button>
              </div>
              <p className="text-[13px] leading-relaxed text-gray-600 break-keep">{student.previousSavedText}</p>
            </div>
          )}
          {!result && (
            <div className="mb-3">
              <button onClick={() => runGenerate('generate')} disabled={!canGenerate || generating} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 px-4 py-2 rounded-lg">
                <Sparkles className="w-4 h-4" />
                {generating ? '문구 생성 중…' : '문구 생성'}
              </button>
              {!canGenerate && <p className="text-[12px] text-gray-400 mt-2">관찰한 요인을 선택하고 관련 행동을 1개 이상 골라 주세요.</p>}
            </div>
          )}
          {stale && (
            <div className="mb-2.5 flex items-center justify-between gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-[12px] text-primary-700 break-keep">
                <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" /> 입력 내용이 바뀌었어요. 최신 내용으로 다시 생성할 수 있어요.
              </span>
              <button
                onClick={() => runGenerate('generate')}
                disabled={generating || !canGenerate}
                className="inline-flex items-center gap-1.5 flex-shrink-0 text-[12.5px] font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 px-3 py-1.5 rounded-lg"
              >
                <Sparkles className="w-3.5 h-3.5" /> {generating ? '생성 중…' : '다시 생성'}
              </button>
            </div>
          )}
          {!result ? (
            <div className="text-center py-6 text-[13px] text-gray-400 bg-gray-50 rounded-xl break-keep">관찰한 모습을 선택하면 AI가 참고 문구를 제안합니다.</div>
          ) : (
            <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-4">
              {editMode ? (
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} className="w-full text-[14px] leading-relaxed text-gray-800 border border-primary-200 rounded-lg px-3 py-2 outline-none focus:border-primary-400 resize-y" />
              ) : (
                <p className="text-[14px] leading-[1.75] text-gray-800 whitespace-pre-wrap">{result.text}</p>
              )}
              {forbidden.length > 0 && (
                <div className="mt-2 flex items-start gap-1.5 text-[12px] text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>기재 유의 표현: {forbidden.map((f) => `‘${f.match}’(${f.label})`).join(', ')}</span>
                </div>
              )}
              <div className="flex justify-end mt-2">
                <span className="text-[11px] text-gray-400">{countChars(currentText)}자</span>
              </div>
            </div>
          )}

          {result && (
            <div className="flex flex-wrap items-center justify-end gap-2 mt-3">
              <ActionBtn onClick={() => runGenerate('rewrite')} disabled={generating}>다른 표현</ActionBtn>
              <ActionBtn onClick={handleCopy}>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} 복사
              </ActionBtn>
              {editMode ? (
                <ActionBtn onClick={() => setEditMode(false)}>편집 취소</ActionBtn>
              ) : (
                <ActionBtn onClick={() => { setEditMode(true); setEditText(result.text); }}>
                  <Pencil className="w-3.5 h-3.5" /> 문구 수정
                </ActionBtn>
              )}
              <button onClick={handleSave} className="text-[13px] font-semibold text-white bg-primary-500 hover:bg-primary-600 px-3.5 py-2 rounded-lg">저장</button>
            </div>
          )}
        </Section>
        </div>
      </div>
    </div>
  );
};

// ── 서브 컴포넌트 ──────────────────────────────────────────
const Section: React.FC<{ step?: string; title: string; subtitle?: string; headerRight?: React.ReactNode; children: React.ReactNode }> = ({ step, title, subtitle, headerRight, children }) => (
  <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,20,50,0.04)]">
    <header className="flex items-start justify-between gap-2.5 mb-3.5">
      <div className="flex items-start gap-2.5">
        {step && <span className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">{step}</span>}
        <div className="pt-0.5">
          <h3 className="text-[15px] font-bold text-gray-900 leading-none">{title}</h3>
          {subtitle && <p className="text-[12px] text-gray-400 mt-1.5 break-keep">{subtitle}</p>}
        </div>
      </div>
      {headerRight && <div className="flex-shrink-0">{headerRight}</div>}
    </header>
    {children}
  </section>
);

const StepLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`text-[13.5px] font-semibold text-gray-700 mb-2 ${className}`}>{children}</div>
);

const ActionBtn: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
  <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600 disabled:opacity-40 px-3 py-2 rounded-lg">
    {children}
  </button>
);

/** 강점/보완 요인 선택 (체크박스 칩) */
const FactorPickRow: React.FC<{ label: string; factors: string[]; selected: string[]; onToggle: (f: string) => void }> = ({ label, factors, selected, onToggle }) => (
  <div>
    <div className="text-[12px] font-bold text-gray-500 mb-2">{label}</div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {factors.map((f) => {
        const on = selected.includes(f);
        const desc = FACTOR_INFO[f]?.description;
        return (
          <button
            key={f}
            onClick={() => onToggle(f)}
            className={`w-full flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg border transition-colors ${
              on ? 'border-primary-300 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <span className={`mt-0.5 w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 ${on ? 'bg-primary-500 border-primary-500' : 'bg-white border-gray-300'}`}>
              {on && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </span>
            <span className="min-w-0">
              <span className={`block text-[13px] ${on ? 'font-semibold text-primary-700' : 'font-medium text-gray-800'}`}>{f}</span>
              {desc && <span className="block text-[11.5px] text-gray-400 mt-0.5 leading-snug break-keep">{desc}</span>}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);
