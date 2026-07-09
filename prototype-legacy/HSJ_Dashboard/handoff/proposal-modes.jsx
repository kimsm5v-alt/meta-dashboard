/* HSJ Dashboard — Overview Mode Tabs
 * Lives in the global header. Switches between 3 overview design proposals
 * for 학습종합검사 결과보기. The actual variant rendering happens in
 * page-comp-overview.jsx + overview-variants.jsx.
 */

const PROPOSAL_META = [
  {
    id: 'compare',
    label: 'A안 · 비교 분석',
    short: 'A안',
  },
  {
    id: 'clean',
    label: 'B안 · 우선순위 + 라인',
    short: 'B안',
  },
];

function ProposalTabs({ mode, setMode }) {
  return (
    <div className="proposal-tabs">
      {PROPOSAL_META.map(p => (
        <button
          key={p.id}
          className={'proposal-tabs__btn' + (mode === p.id ? ' is-active' : '')}
          onClick={() => setMode(p.id)}
          title={p.label}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { ProposalTabs, PROPOSAL_META });
