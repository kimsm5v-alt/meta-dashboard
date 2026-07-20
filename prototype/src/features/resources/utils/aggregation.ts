/**
 * 리포트 집계 — 순수 함수 (기획서 6장 "집계 API").
 * 목업 everyclass-v2 1.html 의 결정적 mock 응답 생성/집계 로직 이식.
 * 목록 카드·상세 요약·슬라이드/학생 뷰가 모두 이 함수들을 단일 소스로 사용 → 수치 정합.
 */
import { hashKey } from './hash';
import { SLIDE_SETS, DEFAULT_SLIDES, STUDENTS } from '../mock-data';
import type { Report, Slide, SlideResponse, StudentStats, SlideDist } from '../types';

/** 세트지 슬라이드 정의 조회 */
export function slideSet(r: Report): Slide[] {
  return SLIDE_SETS[r.id] || DEFAULT_SLIDES;
}

/** 문항형 슬라이드 포함 여부 (정답률 표시 조건) */
export function hasGraded(r: Report): boolean {
  return slideSet(r).some((s) => s.k === '문항형');
}

/** 반 전체 참여 인원 (진행예정=0, 완료≈82%+, 진행중≈55%+) */
export function participation(r: Report): number {
  if (r.rstatus === '진행예정') return 0;
  const h = hashKey(r.id + r.cls);
  const ratio = r.rstatus === '완료' ? 0.82 + (h % 16) / 100 : 0.55 + (h % 30) / 100;
  return Math.min(r.total, Math.round(r.total * ratio));
}

/** 제출 학생 표본 (participation 비율과 정합, STUDENTS 8명 기준) */
export function submitters(r: Report): string[] {
  const all = STUDENTS[r.cls] || [];
  const n = Math.min(all.length, Math.round((participation(r) / Math.max(1, r.total)) * all.length));
  return all
    .map((s) => ({ s, h: hashKey(r.id + s) }))
    .sort((a, b) => a.h - b.h)
    .slice(0, n)
    .map((x) => x.s);
}

/** 한 학생의 특정 슬라이드 응답 (결정적) */
export function slideResponse(r: Report, sIdx: number, student: string): SlideResponse {
  const slide = slideSet(r)[sIdx];
  const joined = submitters(r).includes(student);
  const h = hashKey(r.id + '|' + sIdx + '|' + student);
  if (!joined || h % 100 >= 88) return { submitted: false, value: null, correct: null, timeSec: 0 };
  const timeSec = 18 + (h % 150);
  if (slide.k === '문항형') {
    const correct = h % 100 < 68; // 약 68% 정답
    let pick = slide.correct;
    if (!correct && slide.options.length > 1) {
      const wrongs = slide.options.map((_, i) => i).filter((i) => i !== slide.correct);
      pick = wrongs[h % wrongs.length];
    }
    return { submitted: true, value: slide.options[pick], correct: pick === slide.correct, timeSec };
  }
  const pool = slide.pool.length ? slide.pool : ['응답'];
  return { submitted: true, value: pool[h % pool.length], correct: null, timeSec };
}

/** 한 학생 종합 통계 */
export function studentStats(r: Report, student: string): StudentStats {
  const set = slideSet(r);
  const resps = set.map((_, i) => slideResponse(r, i, student));
  const answered = resps.filter((x) => x.submitted).length;
  const graded = resps.filter((x, i) => set[i].k === '문항형' && x.submitted);
  const correctN = graded.filter((x) => x.correct).length;
  const timeSec = resps.reduce((a, x) => a + x.timeSec, 0);
  return { resps, answered, total: set.length, gradedTotal: graded.length, correctN, timeSec, joined: answered > 0 };
}

/** 응답 완성도(%) — 제출 학생 평균 응답 비율 */
export function completeness(r: Report): number {
  const sub = submitters(r);
  if (!sub.length) return 0;
  const arr = sub.map((s) => studentStats(r, s));
  return Math.round((arr.reduce((a, st) => a + st.answered / st.total, 0) / arr.length) * 100);
}

/** 평균 활동 시간(초) */
export function avgTime(r: Report): number {
  const sub = submitters(r);
  if (!sub.length) return 0;
  const arr = sub.map((s) => studentStats(r, s));
  return Math.round(arr.reduce((a, st) => a + st.timeSec, 0) / arr.length);
}

/** 정답률(%) — student 지정 시 개인, 미지정 시 전체. 문항형 없으면 null */
export function accuracy(r: Report, student?: string): number | null {
  if (!hasGraded(r)) return null;
  const list = student ? [student] : submitters(r);
  let c = 0;
  let t = 0;
  list.forEach((s) => {
    const st = studentStats(r, s);
    c += st.correctN;
    t += st.gradedTotal;
  });
  return t ? Math.round((c / t) * 100) : 0;
}

/** 슬라이드별 응답 인원 (반 전체 스케일, ≤ total) */
export function slideResponded(r: Report, sIdx: number): number {
  const p = participation(r);
  if (!p) return 0;
  const h = hashKey(r.id + 'S' + sIdx);
  const ratio = 0.72 + (h % 26) / 100;
  return Math.min(p, Math.round(p * ratio));
}

/** 문항형 슬라이드 선택지 분포 (표본 기준) */
export function slideDist(r: Report, sIdx: number): SlideDist {
  const slide = slideSet(r)[sIdx];
  if (slide.k !== '문항형') return { counts: [], answered: 0 };
  const sub = submitters(r);
  const counts = slide.options.map(() => 0);
  let answered = 0;
  sub.forEach((s) => {
    const rr = slideResponse(r, sIdx, s);
    if (rr.submitted && rr.value != null) {
      answered++;
      const i = slide.options.indexOf(rr.value);
      if (i >= 0) counts[i]++;
    }
  });
  return { counts, answered };
}

/** 활동형 슬라이드 응답 표본 (이름:응답값) */
export function slideSamples(r: Report, sIdx: number, limit = 6): { s: string; v: string }[] {
  const out: { s: string; v: string }[] = [];
  for (const s of submitters(r)) {
    const rr = slideResponse(r, sIdx, s);
    if (rr.submitted && rr.value != null) {
      out.push({ s, v: rr.value });
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** 슬라이드 단위 정답률(%) — 문항형만 */
export function slideAccuracy(r: Report, sIdx: number): number | null {
  const slide = slideSet(r)[sIdx];
  if (slide.k !== '문항형') return null;
  const d = slideDist(r, sIdx);
  const ans = Math.max(1, d.answered);
  return Math.round((d.counts[slide.correct] / ans) * 100);
}
