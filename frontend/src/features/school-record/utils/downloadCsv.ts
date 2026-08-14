export interface CsvRow {
  no: number;
  name: string;
  strengths: string[];
  improvements: string[];
  statusLabel: string;
  content: string;
}

const csvCell = (value: string): string => `"${(value ?? '').replace(/"/g, '""')}"`;

/** 선택 학생들의 생성 문구를 CSV(Excel 호환)로 변환 — prototype download.ts와 동일 컬럼 */
export function buildRecordsCsv(rows: CsvRow[]): string {
  const header = ['번호', '이름', '강점 요인 TOP 3', '보완 요인 TOP 3', '작성 상태', '생성 문구'];
  const body = rows.map((row) => [
    String(row.no),
    row.name,
    row.strengths.join(', '),
    row.improvements.join(', '),
    row.statusLabel,
    row.content,
  ]);
  // BOM 포함 → Excel에서 한글 깨짐 방지
  return '﻿' + [header, ...body].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

/** 브라우저에서 파일 다운로드 */
export function downloadCsv(filename: string, csv: string): void {
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
