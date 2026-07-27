import type { RecordStudent } from './types';
import { displayStatus } from './shared';

const csvCell = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;

/** 선택 학생들의 생성 문구를 CSV(Excel 호환)로 변환 */
export function buildRecordsCsv(students: RecordStudent[]): string {
  const header = ['번호', '이름', 'LPA 유형', '강점 요인 TOP 3', '보완 요인 TOP 3', '작성 상태', '생성 문구'];
  const rows = students.map((s) => [
    String(s.no),
    s.name,
    s.lpaType,
    s.strengths.join(', '),
    s.improvements.join(', '),
    displayStatus(s.status).label,
    s.savedText ?? '',
  ]);
  // BOM 포함 → Excel에서 한글 깨짐 방지
  return '\uFEFF' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

/** 브라우저에서 파일 다운로드 */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
