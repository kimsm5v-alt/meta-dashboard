import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Search, Info, BookOpen, X, ShieldAlert, AlertTriangle, Download } from 'lucide-react';
import styled from '@emotion/styled';
import { Card } from '@shared/components';
import { useData } from '@shared/contexts/DataContext';
import { useAuth } from '@features/auth/model/AuthContext';
import { useClassStudents, useSelfregClassAnalysis, useApiConfig } from '@features/api';
import { computeClassProfile } from '@features/class-dashboard/model/useClassProfile';
import { FACTOR_DEFINITIONS, DOMAIN_GROUPS, SUB_CATEGORY_FACTORS } from '@shared/data/factors';
import {
  SELFREG_FACTOR_DEFINITIONS,
  SELFREG_DOMAIN_STRUCTURE,
  SELFREG_DOMAIN_COLORS,
  SELFREG_SUB_CATEGORY_FACTORS,
} from '@shared/data/selfregFactors';
import { TYPE_COLORS } from '@shared/data/lpaProfiles';
import { DOMAIN_COLORS } from '@shared/data/lpaProfiles';
import {
  downloadAllPdf,
  downloadStudentPdf,
  downloadTeacherReportPdf,
} from '@shared/services/pdfDownloadService';
import { fetchStudentInfoList, fetchTeacherExams } from '@shared/services/dashboardService';
import type { Class, Student } from '@shared/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TestId = 'comprehensive' | 'selfreg';

interface ProfileItem {
  category: string;
  parentCategory: string;
  avgT: number;
  isPositive: boolean;
  categoryScript: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// 학습종합검사 11개 중분류 (frontend SUB_CATEGORY_FACTORS 기준)
const COMP_CATEGORY_ORDER = [
  { name: '긍정적자아', area: '자아강점', color: '#00D282' },
  { name: '대인관계능력', area: '자아강점', color: '#00D282' },
  { name: '메타인지', area: '학습디딤돌', color: '#4BC1FF' },
  { name: '학습기술', area: '학습디딤돌', color: '#4BC1FF' },
  { name: '지지적관계', area: '학습디딤돌', color: '#4BC1FF' },
  { name: '학업열의', area: '긍정적공부마음', color: '#67A7FF' },
  { name: '성장력', area: '긍정적공부마음', color: '#67A7FF' },
  { name: '학업스트레스', area: '학습걸림돌', color: '#FF849F' },
  { name: '학습방해물', area: '학습걸림돌', color: '#FF849F' },
  { name: '학업관계스트레스', area: '학습걸림돌', color: '#FF849F' },
  { name: '학업소진', area: '부정적공부마음', color: '#FF87D4' },
];

// 자기조절학습검사 6개 중분류
const SELFREG_CATEGORY_ORDER = [
  { name: '학습원동력', area: '동기전략', color: '#9F91F8' },
  { name: '정서조절', area: '동기전략', color: '#9F91F8' },
  { name: '메타인지', area: '인지전략', color: '#4BC1FF' },
  { name: '인지적학습기술', area: '인지전략', color: '#4BC1FF' },
  { name: '행동조절', area: '행동전략', color: '#FF8A94' },
  { name: '행동적학습기술', area: '행동전략', color: '#FF8A94' },
];

const AREA_META: Record<string, { color: string; polarity: 'positive' | 'negative' }> = {
  자아강점: { color: '#00D282', polarity: 'positive' },
  학습디딤돌: { color: '#4BC1FF', polarity: 'positive' },
  긍정적공부마음: { color: '#67A7FF', polarity: 'positive' },
  학습걸림돌: { color: '#FF849F', polarity: 'negative' },
  부정적공부마음: { color: '#FF87D4', polarity: 'negative' },
};

const SELFREG_AREA_META: Record<string, { color: string; polarity: 'positive' | 'negative' }> = {
  동기전략: { color: '#9F91F8', polarity: 'positive' },
  인지전략: { color: '#4BC1FF', polarity: 'positive' },
  행동전략: { color: '#FF8A94', polarity: 'positive' },
};

const LPA_TYPES_ELEMENTARY = ['자원소진형', '안전 균형형', '몰입자원 풍부형'];
const LPA_TYPES_MIDDLE = ['냉소적 무기력형', '정서조절 취약형', '자기주도 몰입형'];
const DONUT_ORDER_ELEMENTARY = ['몰입자원 풍부형', '안전 균형형', '자원소진형'];
const DONUT_ORDER_MIDDLE = ['자기주도 몰입형', '정서조절 취약형', '냉소적 무기력형'];

const RECOMMENDED_ACTIVITIES = [
  { id: 'emotion', title: '감정 온도계 활동', description: '매일 아침 자신의 감정 상태를 체크하고 공유하는 활동입니다.' },
  { id: 'peer', title: '또래 학습 멘토링', description: '학습 강점이 다른 학생끼리 짝을 이루어 서로 가르치는 활동입니다.' },
  { id: 'meta', title: '메타인지 학습일지', description: '매주 학습 과정을 돌아보고 다음 주 계획을 세우는 활동입니다.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Styled Components
// ─────────────────────────────────────────────────────────────────────────────

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const BackBtn = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
  &:hover { background: ${({ theme }) => theme.colors.gray[100]}; }
`;

const HeaderContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.375rem;
`;

const BreadcrumbBadge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  background: ${({ $color }) => $color};
`;

const BreadcrumbText = styled.span<{ $active?: boolean }>`
  font-size: 0.8125rem;
  color: ${({ $active, theme }) => ($active ? '#111827' : theme.colors.gray[500])};
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PageSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const ReportBtn = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  border: ${({ $primary }) => ($primary ? 'none' : `1px solid #E5E7EB`)};
  background: ${({ $primary }) => ($primary ? '#4F46E5' : 'white')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#374151')};
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

// KPI Cards
const KpiRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
`;

const KpiCard = styled(Card)`
  padding: 1.25rem 1.5rem;
`;

const KpiLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.375rem;
`;

const KpiValue = styled.p<{ $color?: string; $small?: boolean }>`
  font-size: ${({ $small, theme }) => ($small ? theme.typography.fontSize.xl : theme.typography.fontSize['2xl'])};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $color, theme }) => $color ?? theme.colors.gray[900]};
  line-height: 1.2;
`;

const KpiSub = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-top: 0.25rem;
`;

// Pill Tabs
const TabContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 999px;
  padding: 0.25rem;
  width: fit-content;
`;

const TabBtn = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: all 0.15s;
  background: ${({ $active, theme }) => ($active ? theme.colors.background.paper : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.gray[900] : theme.colors.gray[500])};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadows.sm : 'none')};
  &:hover { color: ${({ theme }) => theme.colors.gray[900]}; }
`;

// Round Toggle
const RoundToggle = styled.div`
  display: flex;
  gap: 0.25rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.25rem;
`;

const RoundBtn = styled.button<{ $active: boolean; $disabled?: boolean }>`
  padding: 0.375rem 0.875rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition: all 150ms;
  background: ${({ $active, theme }) => ($active ? theme.colors.background.paper : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.gray[900] : theme.colors.gray[600])};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadows.sm : 'none')};
`;

// Note box
const NoteBox = styled.div<{ $variant?: 'gray' | 'green' }>`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  margin-top: 0.75rem;
  background: ${({ $variant }) => ($variant === 'green' ? '#F0FDF4' : '#F9FAFB')};
  color: ${({ $variant }) => ($variant === 'green' ? '#166534' : '#52525B')};
  border: 1px solid ${({ $variant }) => ($variant === 'green' ? '#BBF7D0' : '#E5E7EB')};
`;

// TOP3 cards
const Top3Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
`;

const Top3Header = styled.div<{ $variant: 'strength' | 'weakness' }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: 800;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  background: ${({ $variant }) => ($variant === 'strength' ? '#F2FBF6' : '#FFF5F3')};
  color: ${({ $variant }) => ($variant === 'strength' ? '#059669' : '#EF4444')};
`;

const Top3Icon = styled.span<{ $variant: 'strength' | 'weakness' }>`
  width: 1.125rem;
  height: 1.125rem;
  border-radius: 50%;
  background: white;
  color: ${({ $variant }) => ($variant === 'strength' ? '#059669' : '#EF4444')};
  display: grid;
  place-items: center;
  font-size: 0.6875rem;
  font-weight: 800;
`;

const Top3Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
`;

const Top3Card = styled.div<{ $variant: 'strength' | 'weakness' }>`
  border-radius: 0.75rem;
  padding: 0.75rem;
  border: 1px solid ${({ $variant }) => ($variant === 'strength' ? '#C8E9D2' : '#FFD5CC')};
  background: ${({ $variant }) => ($variant === 'strength' ? '#F2FBF6' : '#FFF5F3')};
`;

const Top3Tag = styled.div<{ $color: string }>`
  font-size: 0.65625rem;
  font-weight: 700;
  color: ${({ $color }) => $color};
  margin-bottom: 0.25rem;
`;

const Top3Name = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: 800;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.25rem;
`;

const Top3Desc = styled.div`
  font-size: 0.71875rem;
  color: ${({ theme }) => theme.colors.gray[600]};
  line-height: 1.5;
`;

// Activities
const ActivitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const ActivityCard = styled.div`
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.background.paper};
  transition: all 0.15s;
  &:hover {
    border-color: #A5B4FC;
    background: #EEF2FF20;
  }
`;

const ActivityTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.375rem;
`;

const ActivityDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.5;
  margin-bottom: 0.5rem;
`;

const ActivityBtn = styled.button`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: #4F46E5;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  &:hover { color: #4338CA; }
`;

// Student card grid
const StudentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  @media (max-width: 1100px) { grid-template-columns: repeat(4, 1fr); }
  @media (max-width: 860px) { grid-template-columns: repeat(3, 1fr); }
`;

const StudentCard = styled.div`
  padding: 0.75rem;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border-color: #A5B4FC;
  }
`;

const StudentCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
`;

const StudentCardName = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  line-height: 1.3;
`;

const StudentBadges = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
`;

const MiniAttnBadge = styled.span`
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: #FFFBEB;
  color: #D97706;
  border: 1px solid #FDE68A;
`;

const MiniRelBadge = styled.span`
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
`;

const TypePill = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.1875rem 0.625rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}18;
`;


const TypeLabel = styled.span`
  font-size: 0.625rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

// Filter pills
const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const FilterPill = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  border: 1px solid ${({ $active, theme }) => ($active ? '#4F46E5' : theme.colors.gray[200])};
  background: ${({ $active }) => ($active ? '#EEF2FF' : 'white')};
  color: ${({ $active, theme }) => ($active ? '#4F46E5' : theme.colors.gray[600])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ $active, theme }) => ($active ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal)};
  cursor: pointer;
  transition: all 0.12s;
  &:hover { border-color: #4F46E5; color: #4F46E5; }
`;

// Factor modal
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ModalBox = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  max-width: 42rem;
  width: 100%;
  margin: 1rem;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ModalCloseBtn = styled.button`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.gray[400]};
  &:hover { background: ${({ theme }) => theme.colors.gray[100]}; color: ${({ theme }) => theme.colors.gray[600]}; }
`;

const ModalBody = styled.div`
  overflow-y: auto;
  flex: 1;
`;

// Search
const SearchWrapper = styled.div`
  position: relative;
  width: 220px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: white;
  outline: none;
  &:focus { border-color: #6366F1; box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.gray[400]};
`;

// PDF progress
const PdfOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PdfCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  padding: 2rem;
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: center;
`;

const PdfBarTrack = styled.div`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: 999px;
  overflow: hidden;
`;

const PdfBarFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: #6366F1;
  border-radius: 999px;
  transition: width 0.3s;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 10rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

// ─────────────────────────────────────────────────────────────────────────────
// ProfileLineChart (SVG port from prototype)
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileLineChartProps {
  scores: Record<string, number>;
  prevScores?: Record<string, number> | null;
  level: 'factor' | 'category';
  sessionNo: number;
  onFactorClick?: (id: string, name: string) => void;
  testId?: TestId;
}

const ProfileChartWrap = styled.div`
  overflow-x: auto;
`;

const ProfileLineChart = ({
  scores,
  prevScores = null,
  level = 'factor',
  sessionNo = 1,
  onFactorClick,
  testId = 'comprehensive',
}: ProfileLineChartProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(900);

  useEffect(() => {
    let rafId = 0;
    const measure = () => {
      const el = wrapRef.current;
      if (!el) return;
      const next = Math.round(el.getBoundingClientRect().width);
      setContainerW(prev => (Math.abs(next - prev) > 2 ? next : prev));
    };
    measure();
    const onResize = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(measure); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize); };
  }, []);

  const currentAreaMeta = testId === 'selfreg' ? SELFREG_AREA_META : AREA_META;
  const currentAreaOrder = testId === 'selfreg'
    ? ['동기전략', '인지전략', '행동전략']
    : ['자아강점', '학습디딤돌', '긍정적공부마음', '학습걸림돌', '부정적공부마음'];

  const items = useMemo(() => {
    const result: Array<{
      id: string; name: string; area: string; areaIdx: number;
      cat: string; catIdx: number; t: number; prev: number | null;
    }> = [];

    if (testId === 'selfreg') {
      SELFREG_DOMAIN_STRUCTURE.forEach((domain, areaIdx) => {
        const area = domain.id;
        domain.subCategories.forEach((subCat, catIdx) => {
          if (level === 'factor') {
            subCat.factors.forEach(f => {
              result.push({ id: f.name, name: f.name, area, areaIdx, cat: subCat.name, catIdx,
                t: scores[f.name] ?? 50, prev: prevScores ? (prevScores[f.name] ?? null) : null });
            });
          } else {
            result.push({ id: subCat.name, name: subCat.name, area, areaIdx, cat: subCat.name, catIdx,
              t: scores[subCat.name] ?? 50, prev: prevScores ? (prevScores[subCat.name] ?? null) : null });
          }
        });
      });
    } else {
      const sortedGroups = [...DOMAIN_GROUPS].sort((a, b) =>
        currentAreaOrder.indexOf(a.domain) - currentAreaOrder.indexOf(b.domain));
      sortedGroups.forEach((group, areaIdx) => {
        const area = group.domain;
        group.subCategories.forEach((cat, catIdx) => {
          if (level === 'factor') {
            const factors = FACTOR_DEFINITIONS.filter(f => f.subCategory === cat);
            factors.forEach(f => {
              result.push({ id: f.name, name: f.name, area, areaIdx, cat, catIdx,
                t: scores[f.name] ?? 50, prev: prevScores ? (prevScores[f.name] ?? null) : null });
            });
          } else {
            result.push({ id: cat, name: cat, area, areaIdx, cat, catIdx,
              t: scores[cat] ?? 50, prev: prevScores ? (prevScores[cat] ?? null) : null });
          }
        });
      });
    }
    return result;
  }, [scores, prevScores, level, testId, currentAreaOrder]);

  const areaW = 78; const catW = 104; const nameW = level === 'factor' ? 110 : 0;
  const scoreW = 46; const changeW = 54;
  const labelW = areaW + catW + nameW;
  const headerH = 34; const rowH = 28;
  const W = Math.max(620, containerW);
  const chartX = labelW;
  const chartW = W - labelW - scoreW - changeW;
  const tMin = 10; const tMax = 90;
  const xOf = (t: number) => chartX + ((Math.max(tMin, Math.min(tMax, t)) - tMin) / (tMax - tMin)) * chartW;
  const totalH = headerH + items.length * rowH + 6;
  const yOfRow = (i: number) => headerH + i * rowH;

  const areaRuns = useMemo(() => {
    const runs: Array<{ start: number; end: number }> = [];
    let start = 0;
    for (let i = 1; i <= items.length; i++) {
      if (i === items.length || items[i].area !== items[start].area) { runs.push({ start, end: i - 1 }); start = i; }
    }
    return runs;
  }, [items]);

  const catRuns = useMemo(() => {
    const runs: Array<{ start: number; end: number }> = [];
    let start = 0;
    for (let i = 1; i <= items.length; i++) {
      if (i === items.length || items[i].cat !== items[start].cat) { runs.push({ start, end: i - 1 }); start = i; }
    }
    return runs;
  }, [items]);

  const segments = useMemo(() => {
    const calcX = (t: number) => chartX + ((Math.max(tMin, Math.min(tMax, t)) - tMin) / (tMax - tMin)) * chartW;
    return areaRuns.map(run => {
      const pts: Array<{ x: number; y: number; color: string }> = [];
      for (let i = run.start; i <= run.end; i++) {
        const item = items[i];
        const meta = currentAreaMeta[item.area];
        pts.push({ x: calcX(item.t), y: yOfRow(i) + rowH / 2, color: meta?.color || '#666' });
      }
      return pts;
    });
  }, [items, areaRuns, chartX, chartW, tMin, tMax, rowH, currentAreaMeta]);

  const WRAP: Record<string, string[]> = {
    학습디딤돌: ['학습', '디딤돌'], 긍정적공부마음: ['긍정적', '공부마음'],
    학습걸림돌: ['학습', '걸림돌'], 부정적공부마음: ['부정적', '공부마음'],
  };

  if (items.length === 0) return <EmptyState>데이터가 없습니다</EmptyState>;

  return (
    <ProfileChartWrap ref={wrapRef}>
      <svg width={W} height={totalH} style={{ display: 'block' }}>
        <rect x={xOf(40)} y={0} width={xOf(60) - xOf(40)} height={totalH} fill="#F2F3F5" />
        <g>
          {[{ l: '매우 낮음', c: 20 }, { l: '낮음', c: 35 }, { l: '보통', c: 50 }, { l: '높음', c: 65 }, { l: '매우 높음', c: 80 }].map(b => (
            <text key={b.l} x={xOf(b.c)} y={13} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#71717A">{b.l}</text>
          ))}
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(t => (
            <text key={t} x={xOf(t)} y={27} textAnchor="middle" fontSize="9" fill="#A1A1A8">{t}</text>
          ))}
          <text x={labelW + chartW + scoreW / 2} y={20} textAnchor="middle" fontSize="11" fontWeight="800" fill="#3F3F46">{sessionNo}차</text>
          <text x={labelW + chartW + scoreW + changeW / 2} y={20} textAnchor="middle" fontSize="11" fontWeight="800" fill="#3F3F46">변화</text>
        </g>
        {[30, 40, 60, 70].map(t => (
          <line key={'gb' + t} x1={xOf(t)} y1={headerH} x2={xOf(t)} y2={totalH} stroke="#D4D4D8" strokeWidth="1" strokeDasharray="3 3" />
        ))}
        {items.map((_, i) => (
          <line key={i} x1={areaW + catW} y1={yOfRow(i)} x2={W} y2={yOfRow(i)} stroke="#EFEFF1" strokeWidth="0.8" />
        ))}
        {catRuns.slice(1).map((run, i) => (
          <line key={'cb' + i} x1={0} y1={yOfRow(run.start)} x2={areaW + catW} y2={yOfRow(run.start)} stroke="#EFEFF1" strokeWidth="0.8" />
        ))}
        {level === 'factor' && onFactorClick && items.map((it, i) => (
          <rect key={'hit' + i} x={0} y={yOfRow(i)} width={W} height={rowH} fill="transparent" style={{ cursor: 'pointer' }} onClick={() => onFactorClick(it.id, it.name)}>
            <title>{it.name} · 클릭하여 학생별 점수 보기</title>
          </rect>
        ))}
        <line x1={0} y1={totalH} x2={W} y2={totalH} stroke="#E5E5E7" />
        {areaRuns.map((run, i) => {
          const area = items[run.start].area;
          const meta = currentAreaMeta[area];
          const y0 = yOfRow(run.start); const y1 = yOfRow(run.end + 1); const cy = (y0 + y1) / 2;
          const lines = WRAP[area] || [area];
          return (
            <g key={'a' + i}>
              <rect x={0} y={y0} width={areaW} height={y1 - y0} fill={`${meta?.color || '#666'}15`} />
              <rect x={0} y={y0} width={3} height={y1 - y0} fill={meta?.color || '#666'} />
              <text x={areaW / 2 + 1} y={cy - (lines.length > 1 ? 7 : 0)} textAnchor="middle" fontSize="12" fontWeight="800" fill={meta?.color || '#666'}>
                {lines.map((ln, li) => <tspan key={li} x={areaW / 2 + 1} dy={li === 0 ? 0 : 14}>{ln}</tspan>)}
              </text>
            </g>
          );
        })}
        {catRuns.map((run, i) => {
          const cat = items[run.start].cat;
          const y0 = yOfRow(run.start); const y1 = yOfRow(run.end + 1); const cy = (y0 + y1) / 2;
          return (
            <g key={'c' + i}>
              <line x1={areaW} y1={y0} x2={areaW} y2={y1} stroke="#E5E5E7" />
              <text x={areaW + catW / 2} y={cy + 4} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#52525B">{cat}</text>
            </g>
          );
        })}
        <line x1={areaW + catW} y1={headerH} x2={areaW + catW} y2={totalH} stroke="#E5E5E7" />
        {level === 'factor' && items.map((it, i) => (
          <text key={'n' + i} x={areaW + catW + 10} y={yOfRow(i) + rowH / 2 + 4} fontSize="11.5" fill="#3F3F46">{it.name}</text>
        ))}
        {level === 'factor' && <line x1={labelW} y1={headerH} x2={labelW} y2={totalH} stroke="#E5E5E7" />}
        {segments.map((pts, si) => {
          if (pts.length < 2) return null;
          const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
          return <path key={si} d={path} fill="none" stroke={pts[0].color} strokeWidth="2" />;
        })}
        {items.map((it, i) => {
          const meta = currentAreaMeta[it.area];
          return <circle key={'d' + i} cx={xOf(it.t)} cy={yOfRow(i) + rowH / 2} r="4" fill={meta?.color || '#666'} stroke="#fff" strokeWidth="1.5"><title>{it.name} T {it.t}</title></circle>;
        })}
        <line x1={labelW + chartW} y1={0} x2={labelW + chartW} y2={totalH} stroke="#E5E5E7" />
        {items.map((it, i) => (
          <text key={'s' + i} x={labelW + chartW + scoreW / 2} y={yOfRow(i) + rowH / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#27272A">{it.t}</text>
        ))}
        <line x1={labelW + chartW + scoreW} y1={0} x2={labelW + chartW + scoreW} y2={totalH} stroke="#E5E5E7" />
        {items.map((it, i) => {
          if (it.prev == null) return <text key={'ch' + i} x={labelW + chartW + scoreW + changeW / 2} y={yOfRow(i) + rowH / 2 + 4} textAnchor="middle" fontSize="11" fill="#D4D4D8">–</text>;
          const d = it.t - it.prev;
          const meta = currentAreaMeta[it.area];
          const isNeg = meta?.polarity === 'negative';
          const good = isNeg ? d < 0 : d > 0;
          const color = d === 0 ? '#A1A1A8' : good ? '#2ECC71' : '#E74C3C';
          return <text key={'ch' + i} x={labelW + chartW + scoreW + changeW / 2} y={yOfRow(i) + rowH / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{d > 0 ? '▲' : d < 0 ? '▼' : '–'}{d !== 0 ? Math.abs(d) : ''}</text>;
        })}
      </svg>
      <NoteBox $variant="gray">
        {testId === 'selfreg'
          ? <span><strong>참고!</strong> 자기조절학습검사의 모든 요인은 <strong>정적 요인</strong>으로, 점수가 <strong>높을수록</strong> 좋습니다.</span>
          : <span><strong>참고!</strong> 학습걸림돌 · 부정적공부마음은 <strong>부적 요인</strong>으로, 점수가 <strong>낮을수록</strong> 좋습니다. &nbsp;|&nbsp; <span style={{ color: '#2ECC71' }}>▲</span> 긍정 &nbsp; <span style={{ color: '#E74C3C' }}>▼</span> 부정</span>
        }
      </NoteBox>
    </ProfileChartWrap>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CategoryBarChart (SVG port from prototype)
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryBarChartProps {
  scores: Record<string, number>;
  testId?: TestId;
}

const BarChartWrap = styled.div`
  overflow-x: auto;
`;

const CategoryBarChart = ({ scores, testId = 'comprehensive' }: CategoryBarChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const categoryOrder = testId === 'selfreg' ? SELFREG_CATEGORY_ORDER : COMP_CATEGORY_ORDER;
  const areaMetaMap = testId === 'selfreg' ? SELFREG_AREA_META : AREA_META;

  const pad = { l: 44, r: 16, t: 16, b: 90 };
  const n = categoryOrder.length;
  const colGap = 10;
  const innerW = containerWidth - pad.l - pad.r;
  const colW = Math.max(22, (innerW - colGap * (n - 1)) / n);
  const barW = Math.min(30, colW);
  const height = 360;
  const plotH = height - pad.t - pad.b;
  const yOf = (t: number) => pad.t + (1 - t / 100) * plotH;

  const bands = [
    { from: 70, to: 100, label: '매우높음', fill: '#EAF6EE' },
    { from: 60, to: 70, label: '높음', fill: '#F2FAF4' },
    { from: 40, to: 60, label: '보통', fill: '#F7F7F8' },
    { from: 30, to: 40, label: '낮음', fill: '#FEF4EC' },
    { from: 0, to: 30, label: '매우낮음', fill: '#FDEEEC' },
  ];

  const areaGroups = useMemo(() => {
    const groups: { area: string; color: string; count: number; startIdx: number }[] = [];
    let currentArea = '';
    let currentCount = 0;
    let currentStart = 0;
    categoryOrder.forEach((cat, idx) => {
      if (cat.area !== currentArea) {
        if (currentArea) groups.push({ area: currentArea, color: areaMetaMap[currentArea]?.color || '#666', count: currentCount, startIdx: currentStart });
        currentArea = cat.area; currentCount = 1; currentStart = idx;
      } else { currentCount++; }
      if (idx === categoryOrder.length - 1) groups.push({ area: currentArea, color: areaMetaMap[currentArea]?.color || '#666', count: currentCount, startIdx: currentStart });
    });
    return groups;
  }, [categoryOrder, areaMetaMap]);

  const totalW = pad.l + innerW + pad.r;

  return (
    <BarChartWrap ref={containerRef}>
      <svg width={totalW} height={height} style={{ display: 'block' }}>
        {bands.map(b => {
          const y = yOf(b.to); const h = yOf(b.from) - yOf(b.to);
          return (
            <g key={b.label}>
              <rect x={pad.l} y={y} width={innerW} height={h} fill={b.fill} />
              <text x={pad.l + 6} y={y + 13} fontSize="10" fill="#A1A1A8" fontWeight="600">{b.label}</text>
            </g>
          );
        })}
        {[0, 20, 40, 50, 60, 80, 100].map(t => (
          <g key={t}>
            <line x1={pad.l} y1={yOf(t)} x2={pad.l + innerW} y2={yOf(t)} stroke={t === 50 ? '#9CA3AF' : '#E5E5E7'} strokeWidth={t === 50 ? 1.3 : 0.7} strokeDasharray={t === 50 ? '4 4' : '0'} />
            <text x={pad.l - 8} y={yOf(t) + 4} textAnchor="end" fontSize="10.5" fill="#71717A">{t}</text>
          </g>
        ))}
        {categoryOrder.map((cat, idx) => {
          const t = scores[cat.name] ?? 50;
          const x = pad.l + idx * (colW + colGap);
          const barH = (t / 100) * plotH;
          const barX = x + (colW - barW) / 2;
          const y = yOf(t);
          const mid = Math.ceil(cat.name.length / 2);
          return (
            <g key={cat.name}>
              <rect x={barX} y={y} width={barW} height={barH} rx="3" fill={cat.color} opacity="0.9">
                <title>{cat.name} T {t}</title>
              </rect>
              <text x={x + colW / 2} y={y - 5} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={cat.color}>{t}</text>
              <text x={x + colW / 2} y={height - pad.b + 16} textAnchor="middle" fontSize="10" fill="#52525B">
                {cat.name.length > 5
                  ? (<><tspan x={x + colW / 2} dy="0">{cat.name.slice(0, mid)}</tspan><tspan x={x + colW / 2} dy="12">{cat.name.slice(mid)}</tspan></>)
                  : cat.name}
              </text>
            </g>
          );
        })}
        {(() => {
          let colIdx = 0;
          return areaGroups.map(g => {
            const startX = pad.l + colIdx * (colW + colGap);
            const endX = pad.l + (colIdx + g.count - 1) * (colW + colGap) + colW;
            colIdx += g.count;
            return (
              <g key={g.area}>
                <line x1={startX} y1={height - pad.b + 56} x2={endX} y2={height - pad.b + 56} stroke={g.color} strokeWidth="2" />
                <text x={(startX + endX) / 2} y={height - pad.b + 72} textAnchor="middle" fontSize="11" fontWeight="800" fill={g.color}>{g.area}</text>
              </g>
            );
          });
        })()}
      </svg>
      {testId === 'comprehensive' ? (
        <NoteBox $variant="gray"><span><strong>참고!</strong> 학습 걸림돌·부정적 공부마음은 <strong>부적 요인</strong>으로, 점수가 <strong>낮을수록</strong> 좋습니다.</span></NoteBox>
      ) : (
        <NoteBox $variant="green"><span><strong>참고!</strong> 자기조절학습검사의 모든 요인은 <strong>정적 요인</strong>으로, 점수가 <strong>높을수록</strong> 좋습니다.</span></NoteBox>
      )}
    </BarChartWrap>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CoreSummaryTab
// ─────────────────────────────────────────────────────────────────────────────

const SectionCard = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const SectionBody = styled.div`
  padding: 1.5rem;
`;

const DonutWrap = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const DonutItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const DonutTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.75rem;
`;

const DonutFlex = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const DonutLegendList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const DonutLegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const DonutDot = styled.span<{ $color: string }>`
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $color }) => $color};
`;

const DonutCount = styled.span`
  margin-left: auto;
  font-weight: 600;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  tabular-nums: true;
`;

const DonutEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

interface CoreSummaryTabProps {
  classData: Class;
  testId: TestId;
  selfregRound1?: number[] | null;
  selfregRound2?: number[] | null;
}

const CoreSummaryTab = ({ classData, testId, selfregRound1, selfregRound2 }: CoreSummaryTabProps) => {
  const [summaryRound, setSummaryRound] = useState<1 | 2>(1);

  const isMiddleSchool = classData.schoolLevel === '중등';
  const donutOrder = isMiddleSchool ? DONUT_ORDER_MIDDLE : DONUT_ORDER_ELEMENTARY;

  const hasRound1 = testId === 'selfreg'
    ? !!selfregRound1
    : classData.students.some(s => s.assessments.some(a => a.round === 1));
  const hasRound2 = testId === 'selfreg'
    ? !!selfregRound2
    : classData.students.some(s => s.assessments.some(a => a.round === 2));

  // LPA distribution (comprehensive only)
  const getDistribution = (round: 1 | 2) => {
    const typeOrder = isMiddleSchool ? LPA_TYPES_MIDDLE : LPA_TYPES_ELEMENTARY;
    const dist: Record<string, number> = {};
    typeOrder.forEach(t => { dist[t] = 0; });
    classData.students.forEach(s => {
      const a = s.assessments.find(a => a.round === round);
      if (a && dist[a.predictedType] !== undefined) dist[a.predictedType]++;
    });
    return dist;
  };

  const dist1 = testId === 'comprehensive' && hasRound1 ? getDistribution(1) : null;
  const dist2 = testId === 'comprehensive' && hasRound2 ? getDistribution(2) : null;

  // Category scores
  const categoryScores = useMemo<Record<string, number>>(() => {
    const scores: Record<string, number> = {};
    if (testId === 'selfreg') {
      const activeScores = summaryRound === 1 ? selfregRound1 : (selfregRound2 ?? selfregRound1);
      if (!activeScores) return scores;
      SELFREG_CATEGORY_ORDER.forEach(cat => {
        const indices = SELFREG_SUB_CATEGORY_FACTORS[cat.name] ?? [];
        const vals = indices.map(i => activeScores[i] ?? 50);
        scores[cat.name] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      });
    } else {
      const profile = computeClassProfile(classData, summaryRound);
      if (!profile) return scores;
      COMP_CATEGORY_ORDER.forEach(cat => {
        const item = profile.strengths.find(s => s.category === cat.name)
          || profile.weaknesses.find(w => w.category === cat.name);
        scores[cat.name] = item?.avgT ?? 50;
      });
    }
    return scores;
  }, [classData, testId, summaryRound, selfregRound1, selfregRound2]);

  const renderDonut = (dist: Record<string, number> | null, total: number, sessionNo: number) => {
    if (!dist || total === 0) {
      return (
        <DonutItem>
          <DonutTitle>{sessionNo}차 검사</DonutTitle>
          <DonutEmpty>
            <span style={{ fontSize: '2rem', opacity: 0.3 }}>—</span>
            <span>{sessionNo}차 검사가 진행되지 않았습니다</span>
          </DonutEmpty>
        </DonutItem>
      );
    }

    const size = 156; const stroke = 26;
    const r = (size - stroke) / 2; const cx = size / 2; const cy = size / 2;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const segs = donutOrder.map(type => {
      const n = dist[type] || 0; const frac = total ? n / total : 0; const dash = frac * circ;
      const seg = { type, n, frac, dash, offset }; offset += dash; return seg;
    });

    return (
      <DonutItem>
        <DonutTitle>{sessionNo}차 검사</DonutTitle>
        <DonutFlex>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
              {segs.map(s => s.n > 0 && (
                <circle key={s.type} cx={cx} cy={cy} r={r} fill="none" stroke={TYPE_COLORS[s.type] || '#9CA3AF'} strokeWidth={stroke}
                  strokeDasharray={`${s.dash} ${circ - s.dash}`} strokeDashoffset={-s.offset} />
              ))}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.375rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{total}</p>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>명</p>
              </div>
            </div>
          </div>
          <DonutLegendList>
            {donutOrder.map(type => {
              const n = dist[type] || 0;
              const pct = total > 0 ? Math.round((n / total) * 100) : 0;
              return (
                <DonutLegendRow key={type}>
                  <DonutDot $color={TYPE_COLORS[type] || '#9CA3AF'} />
                  <span>{type}</span>
                  <DonutCount>{n}명 · {pct}%</DonutCount>
                </DonutLegendRow>
              );
            })}
          </DonutLegendList>
        </DonutFlex>
      </DonutItem>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* LPA 유형 분포 — comprehensive only */}
      {testId === 'comprehensive' && (
        <Card>
          <div style={{ marginBottom: '1rem' }}>
            <SectionTitle>검사별 유형 분포</SectionTitle>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>1차와 2차 검사 결과를 비교하여 학생들의 유형 변화를 확인하세요.</p>
          </div>
          <DonutWrap>
            {renderDonut(dist1, dist1 ? Object.values(dist1).reduce((a, b) => a + b, 0) : 0, 1)}
            {renderDonut(dist2, dist2 ? Object.values(dist2).reduce((a, b) => a + b, 0) : 0, 2)}
          </DonutWrap>
        </Card>
      )}

      {/* 종합 결과 요약 — CategoryBarChart */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
          <div>
            <SectionTitle>종합 결과 요약</SectionTitle>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>
              {testId === 'selfreg' ? '6개' : '11개'} 중분류 하위요인의 반 평균 T점수입니다. 자세한 분석은 <strong>학습 상세</strong> 탭에서 볼 수 있습니다.
            </p>
          </div>
          <RoundToggle>
            <RoundBtn $active={summaryRound === 1} onClick={() => setSummaryRound(1)}>1차 검사</RoundBtn>
            <RoundBtn $active={summaryRound === 2} $disabled={!hasRound2} onClick={() => hasRound2 && setSummaryRound(2)}>
              2차 검사{!hasRound2 && ' 예정'}
            </RoundBtn>
          </RoundToggle>
        </div>
        <CategoryBarChart scores={categoryScores} testId={testId} />
      </Card>

      {/* 추천 학급 운영 활동 */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BookOpen size={18} color="#4F46E5" />
          <SectionTitle>추천 학급 운영 활동</SectionTitle>
        </div>
        <ActivitiesGrid>
          {RECOMMENDED_ACTIVITIES.map(act => (
            <ActivityCard key={act.id}>
              <ActivityTitle>{act.title}</ActivityTitle>
              <ActivityDesc>{act.description}</ActivityDesc>
              <ActivityBtn>다운로드</ActivityBtn>
            </ActivityCard>
          ))}
        </ActivitiesGrid>
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LearningDetailTab
// ─────────────────────────────────────────────────────────────────────────────

interface FactorModalData {
  name: string;
  classAvg: number;
  isPositive: boolean;
  domainColor: string;
  students: { student: Student; score: number; hasReliabilityWarning: boolean }[];
}

interface LearningDetailTabProps {
  classData: Class;
  testId: TestId;
  selfregRound1?: number[] | null;
  selfregRound2?: number[] | null;
}

const ViewToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 0.5rem;
  padding: 0.25rem;
`;

const ViewBtn = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.12s;
  background: ${({ $active, theme }) => ($active ? theme.colors.background.paper : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.gray[900] : theme.colors.gray[600])};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadows.sm : 'none')};
`;

const RoundPill = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.875rem;
  border-radius: 0.5rem;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.12s;
  background: ${({ $active }) => ($active ? '#111827' : '#F3F4F6')};
  color: ${({ $active }) => ($active ? 'white' : '#4B5563')};
  &:hover { background: ${({ $active }) => ($active ? '#1F2937' : '#E5E7EB')}; }
`;

const LearningDetailTab = ({ classData, testId, selfregRound1, selfregRound2 }: LearningDetailTabProps) => {
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);
  const [viewMode, setViewMode] = useState<'detail' | 'summary'>('detail');
  const [factorModal, setFactorModal] = useState<FactorModalData | null>(null);

  const hasRound2 = testId === 'selfreg'
    ? !!selfregRound2
    : classData.students.some(s => s.assessments.some(a => a.round === 2));

  const factorCount = testId === 'selfreg' ? 20 : 38;
  const subCategoryCount = testId === 'selfreg' ? 6 : 11;

  // Factor scores for ProfileLineChart
  const factorScores = useMemo<Record<string, number>>(() => {
    const scores: Record<string, number> = {};
    if (testId === 'selfreg') {
      const activeArr = selectedRound === 1 ? selfregRound1 : (selfregRound2 ?? selfregRound1);
      if (!activeArr) return scores;
      SELFREG_FACTOR_DEFINITIONS.forEach((f, i) => { scores[f.name] = activeArr[i] ?? 50; });
      // Sub-category averages
      SELFREG_DOMAIN_STRUCTURE.forEach(domain => {
        domain.subCategories.forEach(subCat => {
          const vals = subCat.factors.map(f => scores[f.name] ?? 50);
          scores[subCat.name] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        });
      });
    } else {
      // Comprehensive: compute from student assessments
      const valid = classData.students.filter(s => {
        const a = s.assessments.find(a => a.round === selectedRound);
        return a && a.reliabilityWarnings.length === 0;
      });
      const students = valid.length > 0 ? valid : classData.students.filter(s => s.assessments.some(a => a.round === selectedRound));
      FACTOR_DEFINITIONS.forEach(f => {
        let sum = 0; let count = 0;
        students.forEach(s => {
          const a = s.assessments.find(a => a.round === selectedRound);
          if (a?.tScores?.[f.index] != null) { sum += a.tScores[f.index]; count++; }
        });
        scores[f.name] = count > 0 ? Math.round(sum / count) : 50;
      });
      // Sub-category averages
      Object.entries(SUB_CATEGORY_FACTORS).forEach(([subCat, indices]) => {
        const vals = indices.map(i => scores[FACTOR_DEFINITIONS[i]?.name ?? ''] ?? 50);
        scores[subCat] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      });
    }
    return scores;
  }, [classData, testId, selectedRound, selfregRound1, selfregRound2]);

  const prevFactorScores = useMemo<Record<string, number> | null>(() => {
    if (selectedRound !== 2) return null;
    const scores: Record<string, number> = {};
    if (testId === 'selfreg') {
      if (!selfregRound1) return null;
      SELFREG_FACTOR_DEFINITIONS.forEach((f, i) => { scores[f.name] = selfregRound1[i] ?? 50; });
      SELFREG_DOMAIN_STRUCTURE.forEach(domain => {
        domain.subCategories.forEach(subCat => {
          const vals = subCat.factors.map(f => scores[f.name] ?? 50);
          scores[subCat.name] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        });
      });
    } else {
      const valid = classData.students.filter(s => {
        const a = s.assessments.find(a => a.round === 1);
        return a && a.reliabilityWarnings.length === 0;
      });
      const students = valid.length > 0 ? valid : classData.students.filter(s => s.assessments.some(a => a.round === 1));
      FACTOR_DEFINITIONS.forEach(f => {
        let sum = 0; let count = 0;
        students.forEach(s => {
          const a = s.assessments.find(a => a.round === 1);
          if (a?.tScores?.[f.index] != null) { sum += a.tScores[f.index]; count++; }
        });
        scores[f.name] = count > 0 ? Math.round(sum / count) : 50;
      });
      Object.entries(SUB_CATEGORY_FACTORS).forEach(([subCat, indices]) => {
        const vals = indices.map(i => scores[FACTOR_DEFINITIONS[i]?.name ?? ''] ?? 50);
        scores[subCat] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      });
    }
    return scores;
  }, [classData, testId, selectedRound, selfregRound1]);

  // TOP3 profile
  const profile = useMemo<{ strengths: ProfileItem[]; weaknesses: ProfileItem[] } | null>(() => {
    if (testId === 'selfreg') {
      const activeArr = selectedRound === 1 ? selfregRound1 : (selfregRound2 ?? selfregRound1);
      if (!activeArr) return null;
      const items: ProfileItem[] = [];
      SELFREG_DOMAIN_STRUCTURE.forEach(domain => {
        domain.subCategories.forEach(subCat => {
          const vals = subCat.factors.map(f => {
            const idx = SELFREG_FACTOR_DEFINITIONS.findIndex(fd => fd.name === f.name);
            return activeArr[idx] ?? 50;
          });
          const avgT = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
          items.push({ category: subCat.name, parentCategory: domain.name, avgT, isPositive: true, categoryScript: '' });
        });
      });
      const sorted = [...items].sort((a, b) => b.avgT - a.avgT);
      return { strengths: sorted.slice(0, 3), weaknesses: sorted.slice(-3).reverse() };
    } else {
      const cp = computeClassProfile(classData, selectedRound);
      if (!cp) return null;
      return {
        strengths: cp.strengths.map(s => ({ category: s.category, parentCategory: s.parentCategory, avgT: s.avgT, isPositive: s.isPositive, categoryScript: s.categoryScript })),
        weaknesses: cp.weaknesses.map(w => ({ category: w.category, parentCategory: w.parentCategory, avgT: w.avgT, isPositive: w.isPositive, categoryScript: w.categoryScript })),
      };
    }
  }, [classData, testId, selectedRound, selfregRound1, selfregRound2]);

  const handleFactorClick = (_factorId: string, factorName: string) => {
    if (testId !== 'comprehensive') return;
    const factorDef = FACTOR_DEFINITIONS.find(f => f.name === factorName);
    if (!factorDef) return;
    let sum = 0; let count = 0;
    const students = classData.students.map(s => {
      const a = s.assessments.find(a => a.round === selectedRound);
      if (!a || a.tScores[factorDef.index] == null) return null;
      const score = a.tScores[factorDef.index];
      sum += score; count++;
      return { student: s, score, hasReliabilityWarning: a.reliabilityWarnings.length > 0 };
    }).filter((x): x is { student: Student; score: number; hasReliabilityWarning: boolean } => x !== null)
      .sort((a, b) => a.student.number - b.student.number);

    setFactorModal({
      name: factorName, classAvg: count > 0 ? Math.round(sum / count) : 50,
      isPositive: factorDef.isPositive,
      domainColor: DOMAIN_COLORS[factorDef.category] ?? '#6B7280',
      students,
    });
  };

  const getTLevel = (score: number, isPositive: boolean) => {
    const isRisk = isPositive ? score < 40 : score >= 60;
    let label = score >= 70 ? '매우높음' : score >= 60 ? '높음' : score >= 40 ? '보통' : score >= 30 ? '낮음' : '매우낮음';
    return { label, isRisk };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Round selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <RoundPill $active={selectedRound === 1} onClick={() => setSelectedRound(1)}>1차 검사</RoundPill>
        {hasRound2 && <RoundPill $active={selectedRound === 2} onClick={() => setSelectedRound(2)}>2차 검사</RoundPill>}
      </div>

      {/* TOP3 강점/약점 */}
      {profile && (
        <Top3Grid>
          <div>
            <Top3Header $variant="strength">
              <Top3Icon $variant="strength">✓</Top3Icon>
              강점 TOP 3
            </Top3Header>
            <Top3Cards>
              {profile.strengths.slice(0, 3).map(item => {
                const color = testId === 'selfreg'
                  ? SELFREG_DOMAIN_COLORS[item.parentCategory as keyof typeof SELFREG_DOMAIN_COLORS] || '#059669'
                  : DOMAIN_COLORS[item.parentCategory] || '#059669';
                return (
                  <Top3Card key={item.category} $variant="strength">
                    <Top3Tag $color={color}>#{item.parentCategory.replace(/\s/g, '')}</Top3Tag>
                    <Top3Name>{item.category}</Top3Name>
                    <Top3Desc>{item.categoryScript || '학년 평균을 상회하는 강점 영역입니다'}</Top3Desc>
                  </Top3Card>
                );
              })}
            </Top3Cards>
          </div>
          <div>
            <Top3Header $variant="weakness">
              <Top3Icon $variant="weakness">!</Top3Icon>
              관심 필요 TOP 3
            </Top3Header>
            <Top3Cards>
              {profile.weaknesses.slice(0, 3).map(item => {
                const color = testId === 'selfreg'
                  ? SELFREG_DOMAIN_COLORS[item.parentCategory as keyof typeof SELFREG_DOMAIN_COLORS] || '#EF4444'
                  : DOMAIN_COLORS[item.parentCategory] || '#EF4444';
                return (
                  <Top3Card key={item.category} $variant="weakness">
                    <Top3Tag $color={color}>#{item.parentCategory.replace(/\s/g, '')}</Top3Tag>
                    <Top3Name>{item.category}</Top3Name>
                    <Top3Desc>{item.categoryScript || '학년 평균보다 낮아 보완이 필요한 영역입니다'}</Top3Desc>
                  </Top3Card>
                );
              })}
            </Top3Cards>
          </div>
        </Top3Grid>
      )}

      {/* ProfileLineChart */}
      <SectionCard>
        <SectionHeader>
          <div>
            <SectionTitle>
              {viewMode === 'detail' ? `${factorCount}개 요인 전체 T점수` : `${subCategoryCount}개 중분류 T점수`}
            </SectionTitle>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.375rem', lineHeight: 1.5 }}>
              {testId === 'selfreg'
                ? '자기조절학습검사의 모든 요인은 정적 요인으로, 점수가 높을수록 긍정적입니다.'
                : '정적 요인은 점수가 높을수록, 부적 요인(학습 걸림돌·부정적 공부마음)은 점수가 낮을수록 좋습니다.'}
            </p>
            {testId === 'comprehensive' && viewMode === 'detail' && (
              <p style={{ fontSize: '0.75rem', color: '#4F46E5', marginTop: '0.375rem' }}>요인 행을 클릭하면 학생별 점수를 확인할 수 있습니다</p>
            )}
          </div>
          <ViewToggle>
            <ViewBtn $active={viewMode === 'detail'} onClick={() => setViewMode('detail')}>세부 요인 ({factorCount})</ViewBtn>
            <ViewBtn $active={viewMode === 'summary'} onClick={() => setViewMode('summary')}>영역 요약 ({subCategoryCount})</ViewBtn>
          </ViewToggle>
        </SectionHeader>
        <SectionBody>
          <ProfileLineChart
            scores={factorScores}
            prevScores={prevFactorScores}
            level={viewMode === 'detail' ? 'factor' : 'category'}
            sessionNo={selectedRound}
            onFactorClick={testId === 'comprehensive' ? handleFactorClick : undefined}
            testId={testId}
          />
        </SectionBody>
      </SectionCard>

      {/* Factor modal */}
      {factorModal && (
        <ModalOverlay onClick={() => setFactorModal(null)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}>요인별 학생 점수</p>
                <ModalCloseBtn onClick={() => setFactorModal(null)}><X size={14} /></ModalCloseBtn>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>{factorModal.name}</h3>
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                {classData.grade}학년 {classData.classNumber}반 · {selectedRound}차 검사 · 반 평균 T {factorModal.classAvg} · {factorModal.students.length}명
              </p>
            </ModalHeader>
            <div style={{ padding: '0.5rem 1.5rem', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'grid', gridTemplateColumns: '48px 80px 1fr 80px 56px', gap: '0.5rem' }}>
              {['번호', '이름', 'T점수 분포', '수준', 'T점수'].map(h => (
                <span key={h} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', textAlign: h === 'T점수 분포' ? 'center' : h === '수준' ? 'center' : h === 'T점수' ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>
            <ModalBody>
              {factorModal.students.map(({ student, score, hasReliabilityWarning }) => {
                const { label, isRisk } = getTLevel(score, factorModal.isPositive);
                const barPct = Math.max(0, Math.min(100, ((score - 20) / 60) * 100));
                return (
                  <div key={student.id} style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #F3F4F6', display: 'grid', gridTemplateColumns: '48px 80px 1fr 80px 56px', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>{student.number}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>{student.name}</span>
                      {hasReliabilityWarning && <span style={{ width: '1rem', height: '1rem', borderRadius: '50%', background: '#FEE2E2', color: '#EF4444', fontSize: '0.625rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>}
                    </div>
                    <div style={{ position: 'relative', height: '1.25rem', background: '#F3F4F6', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: '0.25rem', bottom: '0.25rem', borderRadius: '999px', width: `${barPct}%`, background: isRisk ? '#F87171' : factorModal.domainColor, opacity: isRisk ? 1 : 0.7 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <span style={{ padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, background: isRisk ? '#FEF2F2' : '#F3F4F6', color: isRisk ? '#DC2626' : '#374151' }}>{label}</span>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, textAlign: 'right', color: isRisk ? '#DC2626' : factorModal.domainColor }}>T {Math.round(score)}</span>
                  </div>
                );
              })}
            </ModalBody>
          </ModalBox>
        </ModalOverlay>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// StudentListTab
// ─────────────────────────────────────────────────────────────────────────────

type StudentFilter = 'all' | 'attention' | 'reliability' | 'type-change';

interface StudentListTabProps {
  classData: Class;
  testId: TestId;
  onNavigateToStudent: (studentId: string) => void;
}


const StudentListTab = ({ classData, testId, onNavigateToStudent }: StudentListTabProps) => {
  const [filter, setFilter] = useState<StudentFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    let list = classData.students;
    const term = searchTerm.trim();
    if (term) list = list.filter(s => s.name.includes(term) || String(s.number).includes(term));
    if (filter === 'attention') list = list.filter(s => s.assessments.some(a => a.attentionResult.needsAttention));
    else if (filter === 'reliability') list = list.filter(s => s.assessments.some(a => a.reliabilityWarnings.length > 0));
    else if (filter === 'type-change') {
      list = list.filter(s => {
        const r1 = s.assessments.find(a => a.round === 1);
        const r2 = s.assessments.find(a => a.round === 2);
        return r1 && r2 && r1.predictedType !== r2.predictedType;
      });
    }
    return list;
  }, [classData.students, filter, searchTerm]);

  const compFilters: { key: StudentFilter; label: string }[] = [
    { key: 'all', label: `전체 ${classData.students.length}명` },
    { key: 'reliability', label: '신뢰도 주의' },
    { key: 'attention', label: '관심 필요' },
    { key: 'type-change', label: '유형 변화' },
  ];

  const selfregFilters: { key: StudentFilter; label: string }[] = [
    { key: 'all', label: `전체 ${classData.students.length}명` },
    { key: 'reliability', label: '신뢰도 주의' },
    { key: 'attention', label: '관심 필요' },
  ];

  const filters = testId === 'selfreg' ? selfregFilters : compFilters;

  const renderStudentCard = (student: Student) => {
    const r1 = student.assessments.find(a => a.round === 1);
    const r2 = student.assessments.find(a => a.round === 2);
    const hasAttention = student.assessments.some(a => a.attentionResult.needsAttention);
    const hasReliability = student.assessments.some(a => a.reliabilityWarnings.length > 0);

    return (
      <StudentCard key={student.id} onClick={() => onNavigateToStudent(student.id)}>
        <StudentCardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{student.number}번</span>
            <StudentCardName>{student.name}</StudentCardName>
          </div>
          <StudentBadges>
            {hasAttention && <MiniAttnBadge><AlertTriangle size={9} style={{ display: 'inline', marginRight: 2 }} />관심</MiniAttnBadge>}
            {hasReliability && <MiniRelBadge><ShieldAlert size={9} style={{ display: 'inline', marginRight: 2 }} />신뢰도</MiniRelBadge>}
          </StudentBadges>
        </StudentCardHeader>
        {testId === 'comprehensive' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TypeLabel>1차</TypeLabel>
              {r1 ? <TypePill $color={TYPE_COLORS[r1.predictedType] || '#6B7280'}>{r1.predictedType}</TypePill>
                  : <span style={{ fontSize: '0.6875rem', color: '#D1D5DB' }}>-</span>}
            </div>
            {(r2 || classData.students.some(s => s.assessments.some(a => a.round === 2))) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TypeLabel>2차</TypeLabel>
                {r2 ? <TypePill $color={TYPE_COLORS[r2.predictedType] || '#6B7280'}>{r2.predictedType}</TypePill>
                    : <span style={{ fontSize: '0.6875rem', color: '#D1D5DB' }}>미실시</span>}
              </div>
            )}
            {!r1 && !r2 && <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>미응시</span>}
          </div>
        ) : (
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
            {r1 ? '1차 ✓' : ''}{r1 && r2 ? ' · ' : ''}{r2 ? '2차 ✓' : ''}
            {!r1 && !r2 && '미응시'}
          </p>
        )}
      </StudentCard>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Student list card — 프로토타입과 동일하게 Card로 감싸기 */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {/* 섹션 헤더: 학생 목록 N명 ⓘ */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                학생 목록 {filteredStudents.length}명
                {filter !== 'all' && (
                  <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: '#9CA3AF', marginLeft: '0.375rem' }}>
                    (전체 {classData.students.length}명)
                  </span>
                )}
              </h3>
              <button
                onClick={() => setBadgeModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: '#E5E7EB', border: 'none', cursor: 'pointer', padding: 0 }}
                title="배지 기준 안내"
              >
                <Info size={11} color="#6B7280" />
              </button>
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0 }}>학생 이름을 클릭하면 개별 상세 분석으로 이동합니다.</p>
        </div>

        {/* 필터 + 검색 */}
        <div style={{ padding: '0.875rem 1.5rem', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <FilterRow>
            {filters.map(f => (
              <FilterPill key={f.key} $active={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</FilterPill>
            ))}
          </FilterRow>
          <SearchWrapper>
            <SearchIcon size={14} />
            <SearchInput placeholder="이름/번호 검색" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </SearchWrapper>
        </div>

        {/* Student grid */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {filteredStudents.length === 0 ? (
            <EmptyState>해당 조건의 학생이 없습니다.</EmptyState>
          ) : (
            <StudentGrid>
              {filteredStudents.map(s => renderStudentCard(s))}
            </StudentGrid>
          )}
        </div>
      </Card>

      {/* Badge info modal */}
      {badgeModalOpen && (
        <ModalOverlay onClick={() => setBadgeModalOpen(false)}>
          <ModalBox style={{ maxWidth: '28rem' }} onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>배지 안내</h3>
                <ModalCloseBtn onClick={() => setBadgeModalOpen(false)}><X size={14} /></ModalCloseBtn>
              </div>
            </ModalHeader>
            <ModalBody style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <MiniAttnBadge>관심</MiniAttnBadge>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>관심 필요 배지</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.6 }}>
                  정적 요인(자아강점·학습디딤돌·긍정적공부마음)에서 T ≤ 39이거나, 부적 요인(학습걸림돌·부정적공부마음)에서 T ≥ 60인 학생입니다.
                </p>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <MiniRelBadge>신뢰도</MiniRelBadge>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>신뢰도 주의 배지</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.6 }}>
                  사회적 바람직성, 반응 일관성, 연속 동일 반응 3가지 신뢰도 지표 중 하나 이상 주의 기준을 초과한 학생입니다.
                </p>
              </div>
            </ModalBody>
          </ModalBox>
        </ModalOverlay>
      )}

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Widget
// ─────────────────────────────────────────────────────────────────────────────

export const ClassDashboardV2Widget: React.FC = () => {
  const { classId, testId: rawTestId = 'comprehensive' } = useParams<{ classId: string; testId: string }>();
  const testId: TestId = rawTestId === 'selfreg' ? 'selfreg' : 'comprehensive';
  const navigate = useNavigate();
  const { getClassById } = useData();
  const { hasJwtToken } = useApiConfig();

  const { students: apiStudents, l2Data, classInfo: apiClassInfo, dgnssIds, isLoading: studentsLoading, error: studentsError } = useClassStudents(classId);
  const { round1: selfregRound1, round2: selfregRound2, isLoading: selfregLoading } = useSelfregClassAnalysis(
    testId === 'selfreg' ? classId : undefined,
  );

  const [activeTab, setActiveTab] = useState<'summary' | 'detail' | 'students'>('summary');
  const { user } = useAuth();
  const [downloadError, setDownloadError] = useState(false);
  const [allPdfProgress, setAllPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [round2AnswerIdxMap, setRound2AnswerIdxMap] = useState<Map<string, number>>(new Map());
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [reportType, setReportType] = useState<'student' | 'teacher'>('student');
  const [reportRound, setReportRound] = useState<'1' | '2' | 'both'>('1');
  const [reportFormat, setReportFormat] = useState<'detail' | 'summary'>('detail');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [selfregDgnssIds, setSelfregDgnssIds] = useState<{ round1?: number; round2?: number }>({});
  const [selfregR1InfoList, setSelfregR1InfoList] = useState<import('@shared/services/dashboardService').StudentInfoItem[]>([]);
  const [selfregR2AnswerIdxMap, setSelfregR2AnswerIdxMap] = useState<Map<string, number>>(new Map());

  // 자기조절검사 dgnssId 조회 (보고서 다운로드에 필요)
  useEffect(() => {
    if (!hasJwtToken || testId !== 'selfreg' || !classId) return;
    fetchTeacherExams(classId, '', '2')
      .then((exams) => {
        const selfreg = exams.filter((e) => e.paperIdx === '2' && e.dgnssAt === 'N');
        setSelfregDgnssIds({
          round1: selfreg.find((e) => e.ordNo === 1)?.dgnssId,
          round2: selfreg.find((e) => e.ordNo === 2)?.dgnssId,
        });
      })
      .catch(() => {});
  }, [classId, hasJwtToken, testId]);

  // 자기조절검사 학생 목록 (1차 기준) — 모달 학생 선택에 사용
  useEffect(() => {
    if (!selfregDgnssIds.round1) return;
    void fetchStudentInfoList(selfregDgnssIds.round1, '2', 1).then(setSelfregR1InfoList);
  }, [selfregDgnssIds.round1]);

  // 자기조절검사 2차 answerIdx 맵
  useEffect(() => {
    if (!selfregDgnssIds.round2) return;
    void fetchStudentInfoList(selfregDgnssIds.round2, '2', 1).then((list) => {
      const map = new Map<string, number>();
      for (const item of list) {
        if (item.answerIdx != null) map.set(item.stdtId, item.answerIdx);
      }
      setSelfregR2AnswerIdxMap(map);
    });
  }, [selfregDgnssIds.round2]);

  const activeDgnssIds = testId === 'selfreg' ? selfregDgnssIds : dgnssIds;


  useEffect(() => {
    if (!hasJwtToken || !dgnssIds?.round2) return;
    void fetchStudentInfoList(dgnssIds.round2).then((list) => {
      const map = new Map<string, number>();
      for (const item of list) {
        if (item.answerIdx != null) map.set(item.stdtId, item.answerIdx);
      }
      setRound2AnswerIdxMap(map);
    });
  }, [dgnssIds?.round2, hasJwtToken]);

  const handleDownloadAll = async (round: 1 | 2, pdfType: 1 | 2) => {
    const dgnssId = round === 1 ? activeDgnssIds?.round1 : activeDgnssIds?.round2;
    if (!dgnssId) return;
    setDownloadError(false);
    try { await downloadAllPdf(dgnssId, round, pdfType, (current, total) => setAllPdfProgress({ current, total })); }
    catch { setDownloadError(true); }
    finally { setAllPdfProgress(null); }
  };

  const handleDownloadTeacherReport = async (round: 1 | 2) => {
    const dgnssId = round === 1 ? activeDgnssIds?.round1 : activeDgnssIds?.round2;
    if (!dgnssId) return;
    setDownloadError(false);
    try { await downloadTeacherReportPdf({ userId: user?.id ?? '', userType: 'T', dgnssId, ordNo: round }); }
    catch { setDownloadError(true); }
  };

  const handleModalDownload = async () => {
    setShowDownloadModal(false);
    const rounds: (1 | 2)[] = reportRound === 'both' ? [1, 2] : [Number(reportRound) as 1 | 2];
    const pdfType: 1 | 2 = reportFormat === 'summary' ? 2 : 1;

    // 교사용 반 보고서 — 종합검사·자기조절검사 공통
    if (reportType === 'teacher') {
      for (const round of rounds) await handleDownloadTeacherReport(round);
      return;
    }

    // 학생 개별 보고서 — 자기조절검사 (항상 개별 PDF, ZIP 미사용)
    if (testId === 'selfreg') {
      setDownloadError(false);
      try {
        for (const stdtId of selectedStudentIds) {
          for (const round of rounds) {
            const dgnssId = round === 1 ? selfregDgnssIds.round1 : selfregDgnssIds.round2;
            if (!dgnssId) continue;
            const answerIdx = round === 1
              ? selfregR1InfoList.find((s) => s.stdtId === stdtId)?.answerIdx
              : selfregR2AnswerIdxMap.get(stdtId);
            if (answerIdx == null) continue;
            await downloadStudentPdf({ userId: stdtId, userType: 'S', dgnssId, answerIdx, ordNo: round, type: pdfType });
          }
        }
      } catch { setDownloadError(true); }
      return;
    }

    // 학생 개별 보고서 — 종합검사
    const compStudents = classData?.students ?? [];
    const isAllSelected = selectedStudentIds.size === compStudents.length;
    if (isAllSelected) {
      for (const round of rounds) await handleDownloadAll(round, pdfType);
    } else {
      setDownloadError(false);
      try {
        for (const studentId of selectedStudentIds) {
          const student = compStudents.find((s) => s.id === studentId);
          if (!student) continue;
          for (const round of rounds) {
            const dgnssId = round === 1 ? dgnssIds?.round1 : dgnssIds?.round2;
            if (!dgnssId) continue;
            const fromAssessment = student.assessments.find((a) => a.round === round)?.answerIdx;
            const answerIdx = fromAssessment ?? (round === 2 ? round2AnswerIdxMap.get(student.id) : undefined);
            if (answerIdx == null) continue;
            await downloadStudentPdf({ userId: studentId, userType: 'S', dgnssId, answerIdx, ordNo: round, type: pdfType });
          }
        }
      } catch { setDownloadError(true); }
    }
  };

  const toggleAllStudents = () => {
    if (selectedStudentIds.size === modalStudents.length) setSelectedStudentIds(new Set());
    else setSelectedStudentIds(new Set(modalStudents.map((s) => s.id)));
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const baseClassData = classId ? getClassById(classId) : undefined;

  const classData: Class | undefined = useMemo(() => {
    if (hasJwtToken && apiStudents.length > 0 && classId) {
      const schoolLevel = apiClassInfo?.schoolLevel ?? apiStudents[0]?.schoolLevel ?? '초등';
      const grade = apiClassInfo?.grade ?? apiStudents[0]?.grade ?? 1;
      const classNumber = apiClassInfo?.classNumber ?? 1;
      const assessedStudents = apiStudents.filter(s => s.assessments.length > 0).length;
      const typeDistribution: Record<string, { count: number; percentage: number }> = {};
      for (const s of apiStudents) {
        const latest = s.assessments[s.assessments.length - 1];
        if (latest) {
          if (!typeDistribution[latest.predictedType]) typeDistribution[latest.predictedType] = { count: 0, percentage: 0 };
          typeDistribution[latest.predictedType].count++;
        }
      }
      for (const type of Object.keys(typeDistribution)) {
        typeDistribution[type].percentage = assessedStudents > 0 ? Math.round((typeDistribution[type].count / assessedStudents) * 100) : 0;
      }
      const needAttentionCount = apiStudents.filter(s => s.assessments.some(a => a.attentionResult.needsAttention)).length;
      const totalStudents = l2Data?.examDetail?.stTotalCnt ?? apiStudents.length;
      const submittedCount = l2Data?.examDetail?.stSubmCnt ?? apiStudents.length;
      return {
        id: classId, schoolLevel, grade, classNumber, teacherId: '',
        students: apiStudents,
        stats: {
          totalStudents, assessedStudents: submittedCount, typeDistribution, needAttentionCount,
          round1Completed: submittedCount > 0,
          round2Completed: apiStudents.some(s => s.assessments.some(a => a.round === 2)),
          examStatus: {
            round1: submittedCount > 0 ? '종료' : '시작전',
            round2: apiStudents.some(s => s.assessments.some(a => a.round === 2)) ? '종료' : '시작전',
          },
          round2SubmittedCount: apiStudents.filter(s => s.assessments.some(a => a.round === 2)).length,
        },
      };
    }
    // selfreg 전용: 종합검사 학생 없어도 classInfo(groups API)가 있으면 최소 classData 구성
    if (hasJwtToken && testId === 'selfreg' && apiClassInfo && classId) {
      return {
        id: classId,
        schoolLevel: apiClassInfo.schoolLevel,
        grade: apiClassInfo.grade,
        classNumber: apiClassInfo.classNumber,
        teacherId: '',
        students: [],
        stats: {
          totalStudents: 0, assessedStudents: 0, typeDistribution: {}, needAttentionCount: 0,
          round1Completed: !!selfregRound1, round2Completed: !!selfregRound2,
          examStatus: { round1: selfregRound1 ? '종료' : '시작전', round2: selfregRound2 ? '종료' : '시작전' },
          round2SubmittedCount: 0,
        },
      };
    }
    return baseClassData;
  }, [baseClassData, hasJwtToken, apiStudents, classId, l2Data, apiClassInfo, testId, selfregRound1, selfregRound2]);

  // 모달에서 사용할 학생 목록 (comprehensive=classData.students, selfreg=selfregR1InfoList)
  const modalStudents: Array<{ id: string; number: number; name: string }> =
    testId === 'selfreg'
      ? selfregR1InfoList.map((s) => ({
          id: s.stdtId,
          number: s.rowNum,
          name: s.stdtNm ?? s.nickname ?? `${s.rowNum}번 학생`,
        }))
      : classData?.students.map((s) => ({ id: s.id, number: s.number, name: s.name })) ?? [];

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const isLoading = hasJwtToken && (studentsLoading || (testId === 'selfreg' && selfregLoading));

  if (isLoading) {
    return <EmptyState>학급 데이터를 불러오는 중...</EmptyState>;
  }
  if (!classData) {
    if (hasJwtToken && studentsError) {
      return <EmptyState>데이터 로드 실패: {studentsError}</EmptyState>;
    }
    return <EmptyState>학급을 찾을 수 없습니다.</EmptyState>;
  }

  // KPI values
  const totalStudents = classData.stats?.totalStudents ?? classData.students.length;
  const assessedStudents = classData.stats?.assessedStudents ?? classData.students.filter(s => s.assessments.length > 0).length;
  const completionRate = totalStudents > 0 ? Math.round((assessedStudents / totalStudents) * 100) : 0;
  const needAttentionCount = classData.stats?.needAttentionCount ?? 0;

  let kpiAvgT = 0;
  let kpiCard2Label = '';
  let kpiCard2Value = '';
  let kpiCard2Sub = '';

  if (testId === 'selfreg') {
    const activeArr = selfregRound1;
    if (activeArr && activeArr.length > 0) {
      kpiAvgT = Math.round(activeArr.reduce((a, b) => a + b, 0) / activeArr.length);
    }
    // Best subcategory
    const subAvgs: { name: string; avg: number }[] = [];
    if (activeArr) {
      SELFREG_DOMAIN_STRUCTURE.forEach(domain => {
        domain.subCategories.forEach(subCat => {
          const vals = subCat.factors.map(f => {
            const idx = SELFREG_FACTOR_DEFINITIONS.findIndex(fd => fd.name === f.name);
            return activeArr[idx] ?? 50;
          });
          subAvgs.push({ name: subCat.name, avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) });
        });
      });
    }
    const top = subAvgs.sort((a, b) => b.avg - a.avg)[0];
    kpiCard2Label = '대표 강점';
    kpiCard2Value = top?.name ?? '-';
    kpiCard2Sub = top ? `T${top.avg}` : '-';
  } else {
    // Comprehensive
    const assessed = classData.students.filter(s => s.assessments.some(a => a.round === 1));
    if (assessed.length > 0) {
      let sum = 0; let count = 0;
      assessed.forEach(s => {
        const a = s.assessments.find(a => a.round === 1);
        if (a) { sum += a.tScores.reduce((x, y) => x + y, 0) / a.tScores.length; count++; }
      });
      kpiAvgT = Math.round(sum / count);
    }
    // Dominant LPA type
    const dist = classData.stats?.typeDistribution ?? {};
    const dominantType = Object.entries(dist).sort((a, b) => b[1].count - a[1].count)[0];
    kpiCard2Label = '우세 유형';
    kpiCard2Value = dominantType?.[0] ?? '-';
    kpiCard2Sub = dominantType ? `${dominantType[1].percentage}%` : '-';
  }

  const badgeColor = testId === 'selfreg' ? '#009f88' : '#4F46E5';
  const badgeLabel = testId === 'selfreg' ? '자기조절검사' : '학습종합검사';
  const classTitle = `${classData.grade}학년 ${classData.classNumber}반`;

  return (
    <PageContainer>
      {/* Header */}
      <div>
        <HeaderRow>
          <BackBtn onClick={() => navigate(`/dashboard/${testId}`)}>
            <ArrowLeft size={18} />
          </BackBtn>
          <HeaderContent>
            <Breadcrumb>
              <BreadcrumbBadge $color={badgeColor}>{badgeLabel}</BreadcrumbBadge>
              <ChevronRight size={13} color="#9CA3AF" />
              <BreadcrumbText>결과보기</BreadcrumbText>
              <ChevronRight size={13} color="#9CA3AF" />
              <BreadcrumbText $active>{classTitle} 검사 분석</BreadcrumbText>
            </Breadcrumb>
            <PageTitle>{classTitle} 검사 분석</PageTitle>
            <PageSubtitle>
              {classData.schoolLevel} · {classTitle} · 학생 {totalStudents}명
            </PageSubtitle>
          </HeaderContent>
          {hasJwtToken && (testId === 'comprehensive' || !!selfregDgnssIds.round1) && (
            <HeaderActions>
              {downloadError && <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>다운로드 실패</span>}
              <ReportBtn disabled={!activeDgnssIds?.round1} onClick={() => {
                setShowDownloadModal(true);
              }}>
                <Download size={13} style={{ display: 'inline', marginRight: '0.25rem' }} />
                보고서 다운로드
              </ReportBtn>
            </HeaderActions>
          )}
        </HeaderRow>
      </div>

      {/* Pill Tabs — 프로토타입 기준: 탭이 KPI 위에 위치 */}
      <TabContainer>
        <TabBtn $active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>핵심 요약</TabBtn>
        <TabBtn $active={activeTab === 'detail'} onClick={() => setActiveTab('detail')}>학습 상세</TabBtn>
        <TabBtn $active={activeTab === 'students'} onClick={() => setActiveTab('students')}>학생 목록</TabBtn>
      </TabContainer>

      {/* KPI Row — 탭 아래 항상 표시 */}
      <KpiRow>
        <KpiCard>
          <KpiLabel>학급 평균 T점수</KpiLabel>
          <KpiValue $color={badgeColor}>{kpiAvgT || '-'}</KpiValue>
          <KpiSub>전체 {testId === 'selfreg' ? '20' : '38'}요인 평균</KpiSub>
        </KpiCard>
        <KpiCard>
          <KpiLabel>{kpiCard2Label}</KpiLabel>
          <KpiValue $small $color={testId === 'comprehensive' ? TYPE_COLORS[kpiCard2Value] : undefined}>{kpiCard2Value}</KpiValue>
          <KpiSub>{kpiCard2Sub}</KpiSub>
        </KpiCard>
        <KpiCard>
          <KpiLabel>관심 필요 학생</KpiLabel>
          <KpiValue $color={needAttentionCount > 0 ? '#EF4444' : undefined}>{needAttentionCount}명</KpiValue>
          <KpiSub>{testId === 'selfreg' ? '20' : '38'}개 요인 기준</KpiSub>
        </KpiCard>
        <KpiCard>
          <KpiLabel>검사 완료율</KpiLabel>
          <KpiValue $color="#10B981">{completionRate}%</KpiValue>
          <KpiSub>{assessedStudents}/{totalStudents}명 완료</KpiSub>
        </KpiCard>
      </KpiRow>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <CoreSummaryTab
          classData={classData}
          testId={testId}
          selfregRound1={selfregRound1}
          selfregRound2={selfregRound2}
        />
      )}
      {activeTab === 'detail' && (
        <LearningDetailTab
          classData={classData}
          testId={testId}
          selfregRound1={selfregRound1}
          selfregRound2={selfregRound2}
        />
      )}
      {activeTab === 'students' && (
        <StudentListTab
          classData={classData}
          testId={testId}
          onNavigateToStudent={studentId => navigate(`/dashboard/${testId}/class/${classId}/student/${studentId}`)}
        />
      )}

      {/* PDF 생성 진행 오버레이 */}
      {allPdfProgress && (
        <PdfOverlay>
          <PdfCard>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>PDF 생성 중...</p>
            <PdfBarTrack><PdfBarFill $pct={Math.round((allPdfProgress.current / allPdfProgress.total) * 100)} /></PdfBarTrack>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{allPdfProgress.current} / {allPdfProgress.total}명 완료</p>
          </PdfCard>
        </PdfOverlay>
      )}

      {/* 보고서 다운로드 모달 */}
      {showDownloadModal && classData && (
        <ModalOverlay onClick={() => setShowDownloadModal(false)}>
          <ModalBox style={{ maxWidth: '32rem', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>보고서 다운로드</h3>
                <ModalCloseBtn onClick={() => setShowDownloadModal(false)}><X size={14} /></ModalCloseBtn>
              </div>
            </ModalHeader>

            <ModalBody style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* 보고서 종류 */}
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>보고서 종류</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['student', 'teacher'] as const).map(type => (
                    <button key={type} onClick={() => { setReportType(type); if (type === 'teacher' && reportRound === 'both') setReportRound('1'); }} style={{
                      flex: 1, padding: '0.625rem 1rem', borderRadius: '0.5rem',
                      border: reportType === type ? 'none' : '1px solid #E5E7EB',
                      background: reportType === type ? '#4F46E5' : '#fff',
                      color: reportType === type ? '#fff' : '#374151',
                      fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {type === 'student' ? '학생 개별 보고서' : '교사용 반 보고서'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 차수 */}
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>차수</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {([
                    { value: '1' as const, label: '1차 검사', disabled: false },
                    { value: '2' as const, label: '2차 검사', disabled: !activeDgnssIds?.round2 },
                    ...(reportType === 'student' ? [{ value: 'both' as const, label: '1차+2차', disabled: !activeDgnssIds?.round2 }] : []),
                  ]).map(({ value, label, disabled }) => (
                    <button key={value} disabled={disabled} onClick={() => setReportRound(value)} style={{
                      flex: 1, padding: '0.625rem 1rem', borderRadius: '0.5rem',
                      border: disabled ? '1px solid #E5E7EB' : reportRound === value ? 'none' : '1px solid #E5E7EB',
                      background: disabled ? '#F9FAFB' : reportRound === value ? '#4F46E5' : '#fff',
                      color: disabled ? '#D1D5DB' : reportRound === value ? '#fff' : '#374151',
                      fontSize: '0.875rem', fontWeight: 500,
                      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* 형식 (학생 개별만) */}
              {reportType === 'student' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>형식</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {([{ value: 'detail', label: '상세 보고서' }, { value: 'summary', label: '요약 보고서' }] as const).map(({ value, label }) => (
                      <button key={value} onClick={() => setReportFormat(value)} style={{
                        flex: 1, padding: '0.625rem 1rem', borderRadius: '0.5rem',
                        border: reportFormat === value ? 'none' : '1px solid #E5E7EB',
                        background: reportFormat === value ? '#4F46E5' : '#fff',
                        color: reportFormat === value ? '#fff' : '#374151',
                        fontSize: '0.875rem', fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* 대상 학생 선택 (학생 개별 보고서일 때) */}
              {reportType === 'student' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>대상 학생 선택</p>
                    <button onClick={() => toggleAllStudents()} style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {selectedStudentIds.size === modalStudents.length ? '전체 해제' : '전체 선택'}
                    </button>
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '0.5rem', maxHeight: '12rem', overflowY: 'auto', padding: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                    {modalStudents.map((student) => (
                      <label key={student.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem',
                        cursor: 'pointer', borderRadius: '0.375rem',
                        background: 'transparent',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLLabelElement).style.background = '#F9FAFB'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.background = 'transparent'; }}>
                        <input type="checkbox" checked={selectedStudentIds.has(student.id)} onChange={() => toggleStudent(student.id)}
                          style={{ accentColor: '#4F46E5', width: '1rem', height: '1rem', cursor: 'pointer', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8125rem', color: '#6B7280', width: '1.5rem', textAlign: 'right', flexShrink: 0 }}>{student.number}</span>
                        <span style={{ fontSize: '0.8125rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</span>
                      </label>
                    ))}
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #F3F4F6' }}>
              <button
                disabled={reportType === 'student' && selectedStudentIds.size === 0}
                onClick={() => void handleModalDownload()}
                style={{
                  width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: 'none',
                  background: reportType === 'student' && selectedStudentIds.size === 0 ? '#E5E7EB' : '#4F46E5',
                  color: reportType === 'student' && selectedStudentIds.size === 0 ? '#9CA3AF' : '#fff',
                  fontSize: '0.875rem', fontWeight: 600, cursor: reportType === 'student' && selectedStudentIds.size === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                }}>
                <Download size={14} />
                다운로드
                {reportType === 'student' && selectedStudentIds.size > 0 && ` (${selectedStudentIds.size}명)`}
              </button>
            </div>
          </ModalBox>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};
