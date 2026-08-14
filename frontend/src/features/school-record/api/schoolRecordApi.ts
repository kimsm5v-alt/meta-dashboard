import { apiClient } from '@shared/api';
import {
  DRAFT_STATUS_CODE,
  DRAFT_STATUS_FROM_CODE,
  type DraftStatus,
  type ObservationPayload,
  type RecordDraftDetail,
  type RecordDraftSummary,
} from '../types';

interface RawDraftSummary {
  studentId: string;
  status: string;
  strengths: string[] | null;
  improvements: string[] | null;
  savedAt: string;
}

interface RawDraftDetail {
  id: number;
  studentId: string;
  classId: string;
  status: string;
  source: string | null;
  content: string | null;
  previousContent: string | null;
  generatedText: string | null;
  strengths: string[] | null;
  improvements: string[] | null;
  observationInput: ObservationPayload | null;
  createdAt: string;
  savedAt: string;
}

export interface SaveDraftPayload {
  studentId: string;
  classId: string;
  status: DraftStatus;
  content?: string;
  strengths?: string[];
  improvements?: string[];
  observationInput?: ObservationPayload;
}

const toSummary = (raw: RawDraftSummary): RecordDraftSummary => ({
  studentId: raw.studentId,
  status: DRAFT_STATUS_FROM_CODE[raw.status] ?? 'EMPTY',
  strengths: raw.strengths,
  improvements: raw.improvements,
  savedAt: raw.savedAt,
});

const toDetail = (raw: RawDraftDetail): RecordDraftDetail => ({
  id: raw.id,
  studentId: raw.studentId,
  classId: raw.classId,
  status: DRAFT_STATUS_FROM_CODE[raw.status] ?? 'EMPTY',
  source: raw.source as RecordDraftDetail['source'],
  content: raw.content,
  previousContent: raw.previousContent,
  generatedText: raw.generatedText,
  strengths: raw.strengths,
  improvements: raw.improvements,
  observationInput: raw.observationInput,
  createdAt: raw.createdAt,
  savedAt: raw.savedAt,
});

export const schoolRecordApi = {
  /** GET /api/school-records/class/{classId} — 반 단위 경량 리스트(작업본 있는 학생만) */
  getClassDraftList: async (classId: string): Promise<RecordDraftSummary[]> => {
    const response = await apiClient.get<RawDraftSummary[]>(`/api/school-records/class/${classId}`);
    return response.resultData.map(toSummary);
  },

  /** GET /api/school-records/student/{studentId}/draft — 학생 1명 상세(작업본 없으면 null) */
  getStudentDraft: async (studentId: string): Promise<RecordDraftDetail | null> => {
    const response = await apiClient.get<RawDraftDetail | null>(
      `/api/school-records/student/${studentId}/draft`,
    );
    return response.resultData ? toDetail(response.resultData) : null;
  },

  /** POST /api/school-records/draft — UPSERT. status는 DraftStatus를 서버 코드로 변환해 전송. */
  saveDraft: async (payload: SaveDraftPayload): Promise<void> => {
    await apiClient.post('/api/school-records/draft', {
      studentId: payload.studentId,
      classId: payload.classId,
      // EMPTY는 서버에 행이 없는 상태를 뜻하는 프런트 전용 값이라 절대 전송되지 않는다(types.ts 주석 참고).
      status: DRAFT_STATUS_CODE[payload.status as Exclude<DraftStatus, 'EMPTY'>],
      content: payload.content,
      strengths: payload.strengths,
      improvements: payload.improvements,
      observationInput: payload.observationInput,
    });
  },

  /** DELETE /api/school-records/{id} — 작업본 삭제("처음부터") */
  deleteDraft: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/school-records/${id}`);
  },
};
