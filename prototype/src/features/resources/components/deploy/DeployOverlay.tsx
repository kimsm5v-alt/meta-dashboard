/**
 * 활동 배포 오버레이 (목업 fsDeploy + openDeployPage/setDeployMode/doDeploy).
 * ★부록A #7: 대상 반 프리셋 — scope 가 반이면 그 반 자동 선택.
 * ★부록B-P7: 배포 방식 분기 (기간=과제 / 실시간), 결과 isLive 분기.
 */
import { useState } from 'react';
import { CLASSES, GROUP_BG, MY } from '../../mock-data';
import { findContent } from '../../utils/format';
import { useResources } from '../../store/ResourcesContext';

type DeployMode = 'period' | 'live';

export const DeployOverlay = () => {
  const { overlay, closeOverlay, openOverlay, toast, setTab, scope } = useResources();
  const contentId = overlay?.contentId ?? null;
  const item = contentId ? MY.find((x) => x.id === contentId) || findContent(contentId) : null;
  const deployItem = { title: item?.title ?? '제목 없는 활동', g: item?.g ?? 'g1', em: item?.em ?? '🧩' };
  // 저작툴에서 넘어온 경우 → 헤더 브레드크럼으로 저작툴 복귀 제공
  const fromEditor = overlay?.from === 'editor';
  const backToEditor = () => openOverlay({ kind: 'editor', contentId });

  // #7 프리셋: scope 가 반이면 자동 선택
  const [classes, setClasses] = useState<string[]>(CLASSES.includes(scope) ? [scope] : []);
  const [dropOpen, setDropOpen] = useState(false);
  const [mode, setMode] = useState<DeployMode>('period');
  const [start, setStart] = useState('2026-07-15');
  const [end, setEnd] = useState('2026-07-22');
  const [deployed, setDeployed] = useState<{ isLive: boolean; classesStr: string; rangeTxt: string } | null>(null);

  const toggleClass = (c: string) => setClasses((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));

  const doDeploy = () => {
    if (classes.length === 0) {
      toast('대상 반을 선택하세요');
      return;
    }
    const isLive = mode === 'live';
    const rangeTxt = isLive
      ? '실시간 수업 · 지금 시작'
      : `${start.replace(/-/g, '.')} (14:00) ~ ${end.replace(/-/g, '.')} (14:00)`;
    setDeployed({ isLive, classesStr: classes.join(', '), rangeTxt });
    toast('배포되었습니다');
  };

  const goToReports = () => {
    closeOverlay();
    setTab('results');
    toast('수업 결과보기로 이동했어요');
  };
  const startLive = () => openOverlay({ kind: 'live', contentId });

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-gray-100">
      <div className="flex flex-none items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        {fromEditor ? (
          // 저작툴 › 활동 배포 — 클릭 시 저작툴로 복귀
          <button onClick={backToEditor} className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-gray-100" aria-label="저작툴로 돌아가기">
            <span className="text-sm font-semibold text-gray-500">‹ 저작툴</span>
            <span className="text-gray-300">›</span>
            <span className="text-base font-extrabold text-gray-900">활동 배포</span>
          </button>
        ) : (
          <>
            <button onClick={closeOverlay} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="뒤로">‹</button>
            <div className="text-base font-extrabold text-gray-900">활동 배포</div>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-auto p-6">
       <div className="flex w-full max-w-5xl gap-8">
        {/* 좌: 미리보기 */}
        <div className="w-72 flex-none">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex h-28 items-center justify-center rounded-xl text-5xl" style={{ background: GROUP_BG[deployItem.g] }}>{deployItem.em}</div>
            <div className="mt-3 text-xs text-gray-400">슬라이드 이름 · 수정 불가</div>
            <div className="mt-0.5 text-base font-bold text-gray-900">{deployItem.title}</div>
            <div className="mt-2 flex flex-wrap gap-1 text-xs text-gray-500">
              <span>🎓 초등</span><span>📖 일반</span><span>🗂️ 단일선택형</span>
            </div>
          </div>
        </div>

        {/* 우: 설정 */}
        <div className="flex-1">
          {/* 1. 대상 반 */}
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs text-white">1</span>
              대상 반 선택 <span className="font-normal text-gray-400">· 복수 선택 가능</span>
            </div>
            <div className="relative">
              <button onClick={() => setDropOpen((o) => !o)} className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                <span className={classes.length ? 'text-gray-800' : 'text-gray-400'}>{classes.length ? classes.join(', ') : '반을 선택하세요'}</span>
                <span className="text-gray-400">▾</span>
              </button>
              {dropOpen && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
                  {CLASSES.map((c) => (
                    <button key={c} onClick={() => toggleClass(c)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm ${classes.includes(c) ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'}`}>
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 text-[11px]">{classes.includes(c) ? '✓' : ''}</span>
                      {c} · 가락중학교
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. 시작 방식 */}
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs text-white">2</span>
              시작 방식
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setMode('period')} className={`rounded-xl border-2 p-3 text-left ${mode === 'period' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${mode === 'period' ? 'bg-primary-500 text-white' : 'border border-gray-300 text-transparent'}`}>✓</span>
                  <span className="text-sm font-bold text-gray-800">📅 기간 설정</span>
                </div>
                <div className="ml-7 text-xs text-gray-500">설정한 기간 동안 학생이 들어와 제출할 수 있어요</div>
                {mode === 'period' && (
                  <div className="ml-7 mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                    <span className="text-gray-400">~</span>
                    <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                  </div>
                )}
              </button>
              <button onClick={() => setMode('live')} className={`rounded-xl border-2 p-3 text-left ${mode === 'live' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${mode === 'live' ? 'bg-primary-500 text-white' : 'border border-gray-300 text-transparent'}`}>✓</span>
                  <span className="text-sm font-bold text-gray-800">🟢 수업 바로 시작하기</span>
                </div>
                <div className="ml-7 text-xs text-gray-500">학생들과 실시간으로 수업할 수 있어요</div>
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600">📤 배포하면 <b>QR · 참여 링크 · 학급 알림</b>이 자동으로 생성·발송됩니다.</div>

          {/* 배포 결과 (isLive 분기) */}
          {deployed && (
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                ✅ {deployed.isLive ? '학생들에게 배포가 완료되었습니다!' : '배포가 완료되었습니다!'}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <b>{deployed.classesStr}</b> · {deployed.isLive ? '이제 실시간 수업을 시작할 수 있습니다.' : '설정한 기간 동안 학생이 들어와 제출합니다.'}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-20 w-20 flex-none items-center justify-center rounded-lg bg-gray-900 text-3xl text-white">▨</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-primary-600">QR·참여 링크·학급 알림이 자동 생성·발송되었어요!</div>
                  <div className="mt-1.5 flex gap-1">
                    <input readOnly value="https://class.visang.co.kr/viewer/6ab0…" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500" />
                    <button onClick={() => toast('링크 복사됨')} className="flex-none rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">복사</button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
                    {['QR 코드', '참여 링크', '학급 알림 발송'].map((c) => (
                      <span key={c} className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600">{c}</span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">기간 · <b>{deployed.rangeTxt}</b></div>
                </div>
              </div>
              <button
                onClick={deployed.isLive ? startLive : goToReports}
                className="mt-4 w-full rounded-lg bg-purple-500 py-2.5 text-sm font-semibold text-white hover:bg-purple-600"
              >
                {deployed.isLive ? '▶ 수업 시작하기' : '📊 수업 결과보기로 이동'}
              </button>
            </div>
          )}
        </div>
       </div>
      </div>

      {!deployed && (
        <div className="flex flex-none justify-center border-t border-gray-200 bg-white px-4 py-3">
          <button onClick={doDeploy} className="min-w-[150px] rounded-lg bg-purple-500 py-2.5 text-sm font-semibold text-white hover:bg-purple-600">배포하기</button>
        </div>
      )}
    </div>
  );
};
