import type { ObservationInput, RecordStudent } from './types';

/**
 * 생활기록부 문구 생성 (프로토타입 mock)
 * @see FEATURES_proto 260724.md §7 — 실제 LLM 연동 시 이 함수만 교체
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** '~함/~음' 종결 정리 */
const asClause = (b: string) => b.replace(/함$/, '하고').replace(/음$/, '으며');

export type RecordAction = 'generate' | 'rewrite' | 'shorten' | 'expand';

export interface GenerateResult {
  text: string;
  referencedTags: string[];
}

export async function generateRecordText(
  _student: RecordStudent,
  input: ObservationInput,
  action: RecordAction,
  counselingTexts: string[] = [],
): Promise<GenerateResult> {
  await delay(800);

  const behaviors = input.behaviorCodes;
  const scene = input.freeText?.trim();
  // 반영할 상담·관찰 기록 (짧게 모드 제외)
  const counseling = action === 'shorten' ? '' : counselingTexts[0]?.trim();

  // 행동 → 연결 문장
  const list = behaviors.length
    ? behaviors.slice(0, action === 'shorten' ? 1 : 3)
    : ['활동에 성실히 참여함'];
  const joined =
    list.length === 1
      ? list[0]
      : list.slice(0, -1).map(asClause).join(', ') + ' ' + list[list.length - 1];

  const counselingClause = counseling ? ` 상담·관찰 과정에서도 ${counseling}` : '';

  let text = '';
  if (action === 'shorten') {
    text = `${joined}.`;
  } else if (action === 'expand') {
    text = `${scene ? `${scene}. ` : ''}${joined}. 이러한 태도가 여러 활동으로 이어져 학급 생활 전반에서 긍정적으로 발휘되고 있음.${counselingClause}`;
  } else {
    // generate / rewrite
    text = `${scene ? `${scene}. ` : ''}${joined}.${counselingClause}`.trim();
  }

  const referencedTags = [
    ...input.factorCodes,
    ...behaviors.slice(0, 2),
    ...(counseling ? ['상담 기록 반영'] : []),
  ].filter(Boolean);

  return { text: text.replace(/\s+/g, ' ').trim(), referencedTags };
}

/** 검사 결과 기반 초안 (일괄 방식 A) — 관찰 입력 없이 강점 중심 */
export async function generateTestOnlyDraft(student: RecordStudent): Promise<string> {
  await delay(500);
  const [s1, s2] = student.strengths;
  const templates = [
    `${s1}과(와) 관련한 태도가 안정적으로 나타나며, ${s2} 측면에서도 성장 가능성이 확인됨. 학교생활에서 자신의 강점을 꾸준히 발휘할 것으로 기대됨.`,
    `${s1}을(를) 바탕으로 학습과 관계 상황에 참여하는 모습이 확인되며, ${s2} 영역에서 잠재력이 돋보임.`,
    `검사 결과 ${s1}, ${s2} 영역에서 강점이 두드러지며, 이를 실제 활동으로 연결해 나가는 성장이 기대됨.`,
  ];
  // 학생별로 다른 문장 (id 해시)
  let h = 0;
  for (let i = 0; i < student.id.length; i += 1) h = (h * 31 + student.id.charCodeAt(i)) >>> 0;
  return templates[h % templates.length];
}

// ── 금지어 검증 (§8) ──────────────────────────────────────
const FORBIDDEN_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /TOEIC|TOEFL|TEPS|HSK|토익|토플/gi, label: '공인어학시험' },
  { re: /대회|수상|상장|입상/g, label: '대회·수상 표현' },
  { re: /학원|과외|사교육/g, label: '사교육 기관' },
  { re: /~?인 것 같음|~?할 것으로 보임|듯함/g, label: '추측성 표현' },
  { re: /반에서 \d+등|보다 (뛰어|우수)/g, label: '비교·서열화' },
];

export interface ForbiddenHit {
  match: string;
  label: string;
}

export function checkForbiddenWords(text: string): ForbiddenHit[] {
  const hits: ForbiddenHit[] = [];
  FORBIDDEN_PATTERNS.forEach(({ re, label }) => {
    const m = text.match(re);
    if (m) m.forEach((x) => hits.push({ match: x, label }));
  });
  return hits;
}

/** 한글 기준 글자 수 */
export const countChars = (text: string) => text.replace(/\s/g, '').length;
