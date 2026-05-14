import { apiClient } from '@shared/api';

export interface BugReportPayload {
  conversationId: number;
  messageId?: number | null;
  errorType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description?: string;
}

export interface BugReportListItem {
  id: number;
  conversationId: number;
  messageId?: number;
  conversationTitle?: string;
  errorType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  description?: string;
  screenshotUrl?: string;
  reportedAt: string;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
}

export interface BugReportDetail extends BugReportListItem {
  reportedBy?: number;
  conversation?: { id: number; title: string; mode: string; contextLabel: string };
  message?: { id: number; role: string; content: string };
  reporterEmail?: string;
}

interface MyReportsResponse {
  items: BugReportListItem[];
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
}

export const errorReportService = {
  submit: async (payload: BugReportPayload, screenshot?: File): Promise<void> => {
    const formData = new FormData();
    formData.append('conversationId', String(payload.conversationId));
    if (payload.messageId != null) formData.append('messageId', String(payload.messageId));
    formData.append('errorType', payload.errorType);
    formData.append('severity', payload.severity);
    if (payload.description) formData.append('description', payload.description);
    if (screenshot) formData.append('screenshot', screenshot);
    await apiClient.post<void>('/api/ai/bug-reports', formData);
  },

  // page: 1-indexed, size 고정 5
  getMyReports: async (userNo: number, page = 1, status?: string): Promise<MyReportsResponse> => {
    let url = `/api/ai/bug-reports/my?userNo=${userNo}&page=${page}`;
    if (status) url += `&status=${status}`;
    const res = await apiClient.get<MyReportsResponse>(url);
    return res.resultData;
  },

  getDetail: async (id: number): Promise<BugReportDetail> => {
    const res = await apiClient.get<BugReportDetail>(`/api/ai/bug-reports/${id}`);
    return res.resultData;
  },
};
