export interface DashboardStat {
  label: string;
  value: string;
  color: string;
  iconName: string;
}

export interface ClassSummary {
  id: string;
  name: string;
  studentCount: number;
  types: {
    warning: number;
    balance: number;
    excellent: number;
  };
}

export interface TeacherDashboardData {
  stats: DashboardStat[];
  classes: ClassSummary[];
}
