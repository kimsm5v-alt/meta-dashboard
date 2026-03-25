/**
 * 검사 메타데이터 로컬 저장소
 *
 * API에서 제공하지 않는 학년/반 정보를 로컬에 저장하고 조회
 */

const STORAGE_KEY = 'meta_assessment_meta';

export interface AssessmentMeta {
  grade: number;
  classNumber: number;
}

type AssessmentMetaMap = Record<number, AssessmentMeta>; // dgnssId → meta

/** 전체 메타데이터 조회 */
function getAll(): AssessmentMetaMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/** 전체 메타데이터 저장 */
function saveAll(data: AssessmentMetaMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** 검사 메타데이터 저장 */
export function saveAssessmentMeta(dgnssId: number, meta: AssessmentMeta): void {
  const all = getAll();
  all[dgnssId] = meta;
  saveAll(all);
}

/** 검사 메타데이터 조회 */
export function getAssessmentMeta(dgnssId: number): AssessmentMeta | null {
  const all = getAll();
  return all[dgnssId] ?? null;
}

/** 검사 메타데이터 삭제 */
export function removeAssessmentMeta(dgnssId: number): void {
  const all = getAll();
  delete all[dgnssId];
  saveAll(all);
}
