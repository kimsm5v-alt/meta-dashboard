import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { SITUATIONS, SITUATION_BEHAVIORS } from './data';
import { generateRecordText, generateTestOnlyDraft } from './service';
import type { GenerationSource, RecordStudent } from './types';

interface Props {
  students: RecordStudent[]; // 선택된 학생들
  onBack: () => void;
  onApply: (updates: { id: string; text: string; source: GenerationSource }[]) => void;
  onEditStudent: (id: string) => void;
}

type Phase = 'method' | 'commonForm' | 'progress' | 'result';
const SOURCE_LABEL: Record<GenerationSource, string> = {
  TEST_ONLY: '검사 결과',
  COMMON_CONTEXT: '공통 상황',
  INDIVIDUAL_OBSERVATION: '학생별 관찰',
};

export const BulkGenerateView: React.FC<Props> = ({ students, onBack, onApply, onEditStudent }) => {
  const [phase, setPhase] = useState<Phase>('method');
  const [method, setMethod] = useState<GenerationSource>('TEST_ONLY');

  // 공통 상황(방식 B)
  const [commonSituation, setCommonSituation] = useState<string>('GROUP_ACTIVITY');
  const [activityText, setActivityText] = useState('');
  const [commonBehaviors, setCommonBehaviors] = useState<string[]>([]);

  // 진행/결과
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, string>>({});

  const commonBehaviorOpts = useMemo(() => SITUATION_BEHAVIORS[commonSituation] ?? [], [commonSituation]);

  const runBulk = async () => {
    setPhase('progress');
    setDoneIds([]);
    const out: Record<string, string> = {};
    for (const s of students) {
      let text = '';
      if (method === 'TEST_ONLY') {
        text = await generateTestOnlyDraft(s);
      } else if (method === 'COMMON_CONTEXT') {
        const res = await generateRecordText(
          s,
          { factorCodes: s.strengths.slice(0, 1), situationCodes: [commonSituation], behaviorCodes: commonBehaviors, freeText: activityText },
          'generate',
        );
        text = res.text;
      } else {
        const res = await generateRecordText(
          s,
          { factorCodes: s.strengths.slice(0, 1), situationCodes: ['CLASS_PARTICIPATION'], behaviorCodes: (SITUATION_BEHAVIORS.CLASS_PARTICIPATION ?? []).slice(0, 2), freeText: '' },
          'generate',
        );
        text = res.text;
      }
      out[s.id] = text;
      setResults({ ...out });
      setDoneIds((p) => [...p, s.id]);
    }
    // 생성 완료 → 즉시 자동 저장
    onApply(students.map((s) => ({ id: s.id, text: out[s.id], source: method })));
    setPhase('result');
  };

  // ── 방식 선택 ──────────────────────────────────────────
  if (phase === 'method') {
    const methods: { key: GenerationSource; title: string; desc: string }[] = [
      { key: 'TEST_ONLY', title: '검사 결과만으로 초안 만들기', desc: '강점·성장 가능성 중심 초안을 빠르게 생성' },
      { key: 'COMMON_CONTEXT', title: '공통 상황을 추가하여 만들기', desc: '학급 프로젝트·발표 등 함께한 활동 반영' },
      { key: 'INDIVIDUAL_OBSERVATION', title: '학생별 관찰 정보를 확인한 뒤 만들기', desc: '소수 학생을 각각 확인하며 생성' },
    ];
    return (
      <Frame onBack={onBack}>
        <h2 className="text-[18px] font-bold text-gray-900 mb-1">선택한 {students.length}명의 문구를 어떻게 만들까요?</h2>
        <p className="text-[13px] text-gray-400 mb-5">추천은 안내이며 방식을 강제하지 않습니다.</p>
        <div className="space-y-2.5">
          {methods.map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                method === m.key ? 'border-primary-400 bg-primary-50/50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className={`w-4 h-4 rounded-full border-[5px] mt-0.5 flex-shrink-0 ${method === m.key ? 'border-primary-500' : 'border-gray-300'}`} />
              <span>
                <span className="block text-[14px] font-semibold text-gray-800">{m.title}</span>
                <span className="block text-[12.5px] text-gray-500 mt-0.5">{m.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onBack} className="text-[13.5px] text-gray-500 px-4 py-2">취소</button>
          <button
            onClick={() => (method === 'COMMON_CONTEXT' ? setPhase('commonForm') : runBulk())}
            className="text-[13.5px] font-semibold text-white bg-primary-500 hover:bg-primary-600 px-5 py-2 rounded-lg"
          >
            다음
          </button>
        </div>
      </Frame>
    );
  }

  // ── 방식 B: 공통 상황 폼 ───────────────────────────────
  if (phase === 'commonForm') {
    return (
      <Frame onBack={() => setPhase('method')}>
        <h2 className="text-[18px] font-bold text-gray-900 mb-4">공통 상황을 입력하세요</h2>
        <label className="block text-[13px] font-semibold text-gray-700 mb-2">공통 상황</label>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {SITUATIONS.filter((s) => s.code !== 'ETC').map((s) => (
            <button
              key={s.code}
              onClick={() => { setCommonSituation(s.code); setCommonBehaviors([]); }}
              className={`text-[12.5px] px-2.5 py-1.5 rounded-full border ${commonSituation === s.code ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="block text-[13px] font-semibold text-gray-700 mb-2">활동 또는 장면</label>
        <input
          value={activityText}
          onChange={(e) => setActivityText(e.target.value)}
          placeholder="예) 학급 프로젝트 발표 준비"
          className="w-full text-[13px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary-300 mb-4"
        />
        <label className="block text-[13px] font-semibold text-gray-700 mb-2">공통 행동 <em className="text-gray-400 not-italic font-normal">(최소 1개)</em></label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {commonBehaviorOpts.map((b) => (
            <button
              key={b}
              onClick={() => setCommonBehaviors((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]))}
              className={`text-[12.5px] px-2.5 py-1.5 rounded-full border break-keep ${commonBehaviors.includes(b) ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {b}
            </button>
          ))}
        </div>
        <p className="text-[11.5px] text-gray-400 break-keep">공통 상황이 모든 학생에게 동일한 행동을 의미하지 않도록, 실제 참여한 학생에게만 적용해 주세요.</p>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setPhase('method')} className="text-[13.5px] text-gray-500 px-4 py-2">이전</button>
          <button
            onClick={runBulk}
            disabled={commonBehaviors.length === 0}
            className="text-[13.5px] font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 px-5 py-2 rounded-lg"
          >
            생성 시작
          </button>
        </div>
      </Frame>
    );
  }

  // ── 진행 ───────────────────────────────────────────────
  if (phase === 'progress') {
    return (
      <Frame onBack={onBack}>
        <h2 className="text-[18px] font-bold text-gray-900 mb-1">{students.length}명의 문구를 만들고 있습니다</h2>
        <p className="text-[13px] text-primary-600 font-semibold mb-4">{doneIds.length} / {students.length} 완료</p>
        <div className="space-y-1.5">
          {students.map((s) => {
            const done = doneIds.includes(s.id);
            const active = !done && doneIds.length === students.findIndex((x) => x.id === s.id);
            return (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                <span className="text-[13px] text-gray-700">{s.no}번 {s.name}</span>
                {done ? (
                  <span className="inline-flex items-center gap-1 text-[12px] text-emerald-600"><Check className="w-3.5 h-3.5" /> 완료</span>
                ) : active ? (
                  <span className="inline-flex items-center gap-1 text-[12px] text-primary-600"><Loader2 className="w-3.5 h-3.5 animate-spin" /> 생성 중</span>
                ) : (
                  <span className="text-[12px] text-gray-400">대기</span>
                )}
              </div>
            );
          })}
        </div>
      </Frame>
    );
  }

  // ── 결과 (자동 저장됨) ─────────────────────────────────
  return (
    <Frame onBack={onBack}>
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <h2 className="text-[18px] font-bold text-gray-900">생성 완료 · {students.length}명</h2>
          <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-emerald-600">
            <Check className="w-3.5 h-3.5" /> 생성한 문구가 자동 저장되었습니다. 필요하면 학생별로 수정할 수 있어요.
          </p>
        </div>
        <button onClick={onBack} className="flex-shrink-0 text-[13px] font-semibold text-white bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-lg">
          목록으로
        </button>
      </div>
      <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 mt-4">
        {students.map((s) => (
          <div key={s.id} className="px-3.5 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-semibold text-gray-800">{s.no}번 {s.name}</span>
              <span className="text-[10.5px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{SOURCE_LABEL[method]}</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600"><Check className="w-3 h-3" /> 저장됨</span>
              <button onClick={() => onEditStudent(s.id)} className="text-[11.5px] text-primary-600 hover:underline ml-auto">수정</button>
            </div>
            <p className="text-[13px] leading-relaxed text-gray-700 break-keep">{results[s.id]}</p>
          </div>
        ))}
      </div>
      <p className="text-[11.5px] text-gray-400 mt-3 break-keep">검사 결과를 바탕으로 만든 참고 문구입니다. 학생의 실제 학교생활 모습을 확인한 뒤 활용해 주세요.</p>
    </Frame>
  );
};

const Frame: React.FC<{ onBack: () => void; children: React.ReactNode }> = ({ onBack, children }) => (
  <div className="h-full overflow-y-auto">
    <div className="max-w-[760px] mx-auto px-6 py-6">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft className="w-4 h-4" /> 뒤로
      </button>
      {children}
    </div>
  </div>
);
