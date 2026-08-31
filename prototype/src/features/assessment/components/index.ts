// 검사 전체 현황 (화면 1)
export { SummaryCards } from './SummaryCards';
export { ExamOverviewTable } from './ExamOverviewTable';

// 검사관리 - 반 전체 (화면 2)
export { ExamStatusCard } from './ExamStatusCard';
export { RoundTabs } from './RoundTabs';
export { StudentStatusTable } from './StudentStatusTable';
export { ExamManagementView } from './ExamManagementView';

// 결과보기 - 반 전체 (화면 3-1)
export { ClassResultView } from './ClassResultView';

// 결과보기 - 학생 (화면 5번)
export { StudentFactorAnalysis } from './StudentFactorAnalysis';
export { TypeClassification } from './TypeClassification';
export { StudentResultView } from './StudentResultView';

// 자기조절학습검사용 컴포넌트
export { SelfregStudentResultView } from './SelfregStudentResultView';
export { SelfregOverviewChart } from './SelfregOverviewChart';
export { SrlProfileTable } from './SrlProfileTable';

// 학습전략검사 결과 리포트
export { StrategyReport, StrategyRadarChart, StrategyCard, DonutGauge } from './StrategyReport';
export type { ReportData, Score, DomainResult, LevelType } from './StrategyReport';

// 변화추적 (화면 6번)
export { ClassTrackingView } from './ClassTrackingView';
export { StudentTrackingView } from './StudentTrackingView';

// 자기조절학습검사 변화추적
export { SelfregClassTrackingView } from './SelfregClassTrackingView';
export type { SelfregStudentChangeData, SelfregClassChangeSummary } from './SelfregClassTrackingView';
export { SelfregStudentTrackingView } from './SelfregStudentTrackingView';
