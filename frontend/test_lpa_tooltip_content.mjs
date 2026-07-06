import { readFileSync } from 'node:fs';

const file = readFileSync(new URL('./src/shared/data/lpaTooltipContent.ts', import.meta.url), 'utf8');

const required = [
  '학생유형 분포 비교',
  '비상교육은 학생을 단순한 점수로 구분하지 않고',
  'LPA는 최근 교육·심리·사회과학 연구에서 활용되는 통계 분석 기법',
  '이를 통해 선생님께서는 학생의 현재 상태를 더 입체적으로 이해하고',
  '자원소진형',
  '안전 균형형',
  '몰입자원 풍부형',
  '냉소적 무기력형',
  '정서조절 취약형',
  '자기주도 몰입형',
];

const missing = required.filter((text) => !file.includes(text));
if (missing.length > 0) {
  console.error(`Missing LPA tooltip content: ${missing.join(', ')}`);
  process.exit(1);
}

const usageFiles = [
  './src/widgets/teacher-dashboard/LPAComparisonSection.tsx',
  './src/widgets/class-dashboard/ClassDashboardV2Widget.tsx',
  './src/features/student-dashboard/ui/TypeClassification.tsx',
];

const missingImports = usageFiles.filter((path) => {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  return !source.includes('lpaTooltipContent');
});

if (missingImports.length > 0) {
  console.error(`Missing lpaTooltipContent imports: ${missingImports.join(', ')}`);
  process.exit(1);
}

console.log('LPA tooltip content contract satisfied');
