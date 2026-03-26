/**
 * localStorage 기반 업로드 데이터 영속화 서비스
 *
 * PDF 업로드로 추출된 RawData를 localStorage에 저장/조회/삭제.
 * RawData(변환 전 JSON)를 저장하여 transformFullData()로 재변환 가능.
 */

// ============================================================
// 타입 정의
// ============================================================

interface RawTestData {
  status: string;
  date?: string;
  rawScores?: Record<string, number> | null;
  tScores?: Record<string, number> | null;
  type?: string | null;
  reliability?: string[] | null;
}

interface RawStudent {
  id: string;
  name: string;
  test1: RawTestData;
  test2: RawTestData;
}

interface RawClass {
  teacher: string;
  examStatus?: { test1?: string; test2?: string };
  students: RawStudent[];
}

export interface RawData {
  examInfo: {
    name: string;
    year: number;
    school: string;
    grade: number;
  };
  classes: Record<string, RawClass>;
}

export interface UploadMetadata {
  fileName: string;
  fileSize: number;
  extractionMethod: 'gemini';
  studentCount: number;
  classCount: number;
}

export interface StoredUploadData {
  version: 1;
  uploadedAt: string;
  rawData: RawData;
  metadata: UploadMetadata;
}

// ============================================================
// 상수
// ============================================================

const STORAGE_KEY = 'meta_dashboard_uploaded_data';

// ============================================================
// CRUD 함수
// ============================================================

export const saveUploadedData = (rawData: RawData, metadata: UploadMetadata): void => {
  const stored: StoredUploadData = {
    version: 1,
    uploadedAt: new Date().toISOString(),
    rawData,
    metadata,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
};

export const loadUploadedData = (): StoredUploadData | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredUploadData;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearUploadedData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const hasUploadedData = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};
