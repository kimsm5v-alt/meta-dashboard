import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Loader2,
  Download,
} from 'lucide-react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Card, Badge } from '@shared/components';
import { useData } from '@shared/contexts/DataContext';
import { useAuth } from '@features/auth/model/AuthContext';
import { useClassStudents, useApiConfig } from '@features/api';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_CLASS_STUDENTS } from '@shared/data/apiDefinitions';
import {
  downloadAllPdf,
  downloadTeacherReportPdf,
  downloadStudentPdf,
} from '@shared/services/pdfDownloadService';
import type { Student, Assessment, Class } from '@shared/types';
import {
  TypeChangeChart,
  ClassInsights,
  SortableHeader,
  ChangeFilterButtons,
} from '@features/class-dashboard/ui';
import type { SortField, ChangeFilter } from '@features/class-dashboard/ui';
import { formatAttentionTooltip } from '@shared/utils/attentionChecker';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CenteredContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`;

const CenteredText = styled.div`
  text-align: center;
`;

const SpinnerIcon = styled(Loader2)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 0.5rem;
`;

const WarningIcon = styled(AlertTriangle)`
  width: 2rem;
  height: 2rem;
  color: #f59e0b;
  margin: 0 auto 0.5rem;
`;

const GrayText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled.button`
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const BackIcon = styled(ArrowLeft)`
  width: 1.25rem;
  height: 1.25rem;
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const BannerContainer = styled.div<{ $variant: 'warning' | 'info' }>`
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: ${({ $variant }) => ($variant === 'info' ? 'flex-start' : 'center')};
  gap: 0.75rem;
`;

const BannerIconWrapper = styled.div<{ $marginTop?: boolean }>`
  flex-shrink: 0;
  margin-top: ${({ $marginTop }) => ($marginTop ? '0.125rem' : '0')};
`;

const BannerIcon = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  color: #f59e0b;
`;

const BannerTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: #92400e;
`;

const BannerDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: #d97706;
`;

const BannerDescriptionLarge = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #b45309;
  margin-top: 0.25rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StudentListGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  align-items: start;
`;

const CardHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const SearchWrapper = styled.div`
  position: relative;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem 0.5rem 2.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const FilterSection = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FilterLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const FilterInfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  padding-top: 0.75rem;
`;

const FilterCount = styled.span`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const FilterTotalCount = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-left: 0.25rem;
`;

const FilterResetButton = styled.button`
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
`;

const TableHead = styled.thead``;

const TableHeaderRow = styled.tr`
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const TableHeaderCell = styled.th<{ $width?: string; $align?: 'left' | 'center' }>`
  text-align: ${({ $align }) => $align || 'left'};
  padding: 0.75rem;
  width: ${({ $width }) => $width || 'auto'};
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const TableCell = styled.td<{ $align?: 'left' | 'center' }>`
  padding: 0.875rem 0.75rem;
  text-align: ${({ $align }) => $align || 'left'};
`;

const StudentNumber = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const StudentName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const DashPlaceholder = styled.span<{ $variant?: 'light' | 'default' }>`
  color: ${({ theme, $variant }) =>
    $variant === 'light' ? theme.colors.gray[300] : theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const StatusBadge = styled.span<{ $variant: 'attention' | 'reliability' | 'submitted' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

  ${({ $variant }) => {
    switch ($variant) {
      case 'attention':
        return `background: #fffbeb; color: #d97706; border-color: #fde68a;`;
      case 'reliability':
        return `background: #fef2f2; color: #dc2626; border-color: #fecaca;`;
      case 'submitted':
        return `background: #eff6ff; color: #2563eb; border-color: #bfdbfe;`;
    }
  }}
`;

const BadgeIcon = styled.span`
  width: 0.875rem;
  height: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChangeIndicator = styled.span<{ $variant: 'changed' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  ${({ $variant }) =>
    $variant === 'changed'
      ? `background: #d1fae5; color: #059669;`
      : `background: #f3f4f6; color: #9ca3af;`}
`;

const ResultCellWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
`;

const NoChangeText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const DownloadButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
`;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: white;
  color: ${({ theme }) => theme.colors.gray[700]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray[50]};
    border-color: ${({ theme }) => theme.colors.gray[400]};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const TeacherReportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[700]};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray[200]};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &::before {
    content: '';
    width: 20px;
    height: 24px;
    background-image: url("data:image/svg+xml,%3Csvg width='33' height='40' viewBox='0 0 33 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M23.7 14.51C20.24 14.51 17.44 11.7 17.44 8.23999V0.150024H3.84C1.96 0.150024 0.429993 1.67999 0.429993 3.54999V36.12C0.429993 38 1.96 39.52 3.84 39.52H28.7C30.58 39.52 32.11 38 32.11 36.12V14.51H23.7ZM17.59 31.31L13.08 13.44L17.59 31.31Z' fill='%23E53252'/%3E%3Cpath d='M23.81 12.45H31.19L19.95 1.26001V8.59003C19.95 10.72 21.69 12.45 23.81 12.45Z' fill='%234F4F4F'/%3E%3Cpath d='M7.34 28.8301V31.4501H5.07001V24.3301C5.07001 24.0101 5.09999 23.7502 5.14999 23.5302C5.19999 23.3102 5.29999 23.1301 5.42999 22.9901C5.55999 22.8501 5.73999 22.7501 5.95999 22.6901C6.17999 22.6301 6.46 22.6001 6.78 22.6001H8.69C9.17 22.6001 9.61001 22.6602 10.01 22.7802C10.41 22.9002 10.76 23.0801 11.05 23.3301C11.34 23.5801 11.57 23.8901 11.74 24.2701C11.91 24.6501 11.99 25.1001 11.99 25.6201V25.8101C11.99 26.3301 11.91 26.7801 11.74 27.1601C11.57 27.5401 11.35 27.8501 11.05 28.1001C10.75 28.3501 10.41 28.5301 10.01 28.6501C9.61001 28.7701 9.17 28.8301 8.69 28.8301H7.34ZM7.34 26.9101H8.59C8.77 26.9101 8.93999 26.8801 9.07999 26.8201C9.21999 26.7601 9.34 26.6701 9.44 26.5601C9.54 26.4501 9.61001 26.3201 9.67001 26.1901C9.72001 26.0501 9.75 25.9001 9.75 25.7501V25.6701C9.75 25.5201 9.72001 25.3701 9.67001 25.2301C9.62001 25.0901 9.54 24.9701 9.44 24.8601C9.34 24.7501 9.21999 24.6601 9.07999 24.6001C8.93999 24.5401 8.77 24.5101 8.59 24.5101H7.64999C7.52999 24.5101 7.43999 24.5301 7.39999 24.5701C7.35999 24.6101 7.32999 24.7001 7.32999 24.8301V26.9201H7.34V26.9101Z' fill='%23FCFFFF'/%3E%3Cpath d='M16.29 22.5901C16.77 22.5901 17.24 22.66 17.7 22.79C18.16 22.92 18.58 23.15 18.95 23.47C19.32 23.79 19.62 24.21 19.85 24.73C20.08 25.25 20.19 25.8901 20.19 26.6501V27.36C20.19 28.12 20.08 28.7601 19.85 29.2801C19.62 29.8001 19.32 30.22 18.95 30.54C18.58 30.86 18.16 31.09 17.7 31.22C17.23 31.36 16.76 31.42 16.29 31.42H14.65C14.32 31.42 14.05 31.3901 13.83 31.3301C13.61 31.2701 13.43 31.1701 13.3 31.0301C13.17 30.8901 13.07 30.7101 13.02 30.4901C12.96 30.2701 12.94 30.0001 12.94 29.6901V24.3101C12.94 23.9901 12.97 23.7301 13.02 23.5101C13.07 23.2901 13.17 23.11 13.3 22.97C13.43 22.83 13.61 22.73 13.83 22.67C14.05 22.61 14.33 22.5801 14.65 22.5801H16.29V22.5901ZM17.95 26.48C17.95 25.83 17.79 25.3401 17.48 25.0001C17.17 24.6601 16.75 24.4901 16.23 24.4901H15.5C15.38 24.4901 15.29 24.51 15.25 24.55C15.21 24.59 15.18 24.6801 15.18 24.8101V29.22C15.18 29.35 15.2 29.44 15.25 29.48C15.29 29.52 15.38 29.54 15.5 29.54H16.23C16.75 29.54 17.17 29.3701 17.48 29.0301C17.8 28.6901 17.95 28.2 17.95 27.55V26.48Z' fill='%23FCFFFF'/%3E%3Cpath d='M21.21 31.4501V24.3301C21.21 24.0101 21.24 23.7502 21.29 23.5302C21.34 23.3102 21.44 23.1301 21.57 22.9901C21.7 22.8501 21.88 22.7501 22.1 22.6901C22.32 22.6301 22.6 22.6001 22.92 22.6001H26.58C26.74 22.6001 26.88 22.6301 26.99 22.6901C27.1 22.7501 27.19 22.8301 27.27 22.9201C27.35 23.0101 27.4 23.1201 27.43 23.2401C27.46 23.3601 27.48 23.4701 27.48 23.5801C27.48 23.6901 27.46 23.8001 27.43 23.9101C27.4 24.0201 27.35 24.1301 27.28 24.2201C27.21 24.3101 27.12 24.3901 27.01 24.4401C26.9 24.4901 26.76 24.5201 26.6 24.5201H23.81C23.69 24.5201 23.6 24.5401 23.56 24.5801C23.52 24.6201 23.49 24.7101 23.49 24.8401V26.2301H26.32C26.48 26.2301 26.62 26.2601 26.73 26.3201C26.84 26.3801 26.93 26.4601 27.01 26.5501C27.08 26.6501 27.14 26.7501 27.17 26.8701C27.2 26.9901 27.22 27.1001 27.22 27.2101C27.22 27.3201 27.2 27.4301 27.17 27.5401C27.14 27.6501 27.09 27.7601 27.02 27.8501C26.95 27.9401 26.86 28.0201 26.75 28.0701C26.64 28.1201 26.5 28.1501 26.34 28.1501H23.51V31.4501H21.21Z' fill='%23FCFFFF'/%3E%3C/svg%3E%0A");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
`;

const PdfIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.7;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &::before {
    content: '';
    display: block;
    width: 16px;
    height: 19px;
    background-image: url("data:image/svg+xml,%3Csvg width='33' height='40' viewBox='0 0 33 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M23.7 14.51C20.24 14.51 17.44 11.7 17.44 8.23999V0.150024H3.84C1.96 0.150024 0.429993 1.67999 0.429993 3.54999V36.12C0.429993 38 1.96 39.52 3.84 39.52H28.7C30.58 39.52 32.11 38 32.11 36.12V14.51H23.7ZM17.59 31.31L13.08 13.44L17.59 31.31Z' fill='%23E53252'/%3E%3Cpath d='M23.81 12.45H31.19L19.95 1.26001V8.59003C19.95 10.72 21.69 12.45 23.81 12.45Z' fill='%234F4F4F'/%3E%3Cpath d='M7.34 28.8301V31.4501H5.07001V24.3301C5.07001 24.0101 5.09999 23.7502 5.14999 23.5302C5.19999 23.3102 5.29999 23.1301 5.42999 22.9901C5.55999 22.8501 5.73999 22.7501 5.95999 22.6901C6.17999 22.6301 6.46 22.6001 6.78 22.6001H8.69C9.17 22.6001 9.61001 22.6602 10.01 22.7802C10.41 22.9002 10.76 23.0801 11.05 23.3301C11.34 23.5801 11.57 23.8901 11.74 24.2701C11.91 24.6501 11.99 25.1001 11.99 25.6201V25.8101C11.99 26.3301 11.91 26.7801 11.74 27.1601C11.57 27.5401 11.35 27.8501 11.05 28.1001C10.75 28.3501 10.41 28.5301 10.01 28.6501C9.61001 28.7701 9.17 28.8301 8.69 28.8301H7.34ZM7.34 26.9101H8.59C8.77 26.9101 8.93999 26.8801 9.07999 26.8201C9.21999 26.7601 9.34 26.6701 9.44 26.5601C9.54 26.4501 9.61001 26.3201 9.67001 26.1901C9.72001 26.0501 9.75 25.9001 9.75 25.7501V25.6701C9.75 25.5201 9.72001 25.3701 9.67001 25.2301C9.62001 25.0901 9.54 24.9701 9.44 24.8601C9.34 24.7501 9.21999 24.6601 9.07999 24.6001C8.93999 24.5401 8.77 24.5101 8.59 24.5101H7.64999C7.52999 24.5101 7.43999 24.5301 7.39999 24.5701C7.35999 24.6101 7.32999 24.7001 7.32999 24.8301V26.9201H7.34V26.9101Z' fill='%23FCFFFF'/%3E%3Cpath d='M16.29 22.5901C16.77 22.5901 17.24 22.66 17.7 22.79C18.16 22.92 18.58 23.15 18.95 23.47C19.32 23.79 19.62 24.21 19.85 24.73C20.08 25.25 20.19 25.8901 20.19 26.6501V27.36C20.19 28.12 20.08 28.7601 19.85 29.2801C19.62 29.8001 19.32 30.22 18.95 30.54C18.58 30.86 18.16 31.09 17.7 31.22C17.23 31.36 16.76 31.42 16.29 31.42H14.65C14.32 31.42 14.05 31.3901 13.83 31.3301C13.61 31.2701 13.43 31.1701 13.3 31.0301C13.17 30.8901 13.07 30.7101 13.02 30.4901C12.96 30.2701 12.94 30.0001 12.94 29.6901V24.3101C12.94 23.9901 12.97 23.7301 13.02 23.5101C13.07 23.2901 13.17 23.11 13.3 22.97C13.43 22.83 13.61 22.73 13.83 22.67C14.05 22.61 14.33 22.5801 14.65 22.5801H16.29V22.5901ZM17.95 26.48C17.95 25.83 17.79 25.3401 17.48 25.0001C17.17 24.6601 16.75 24.4901 16.23 24.4901H15.5C15.38 24.4901 15.29 24.51 15.25 24.55C15.21 24.59 15.18 24.6801 15.18 24.8101V29.22C15.18 29.35 15.2 29.44 15.25 29.48C15.29 29.52 15.38 29.54 15.5 29.54H16.23C16.75 29.54 17.17 29.3701 17.48 29.0301C17.8 28.6901 17.95 28.2 17.95 27.55V26.48Z' fill='%23FCFFFF'/%3E%3Cpath d='M21.21 31.4501V24.3301C21.21 24.0101 21.24 23.7502 21.29 23.5302C21.34 23.3102 21.44 23.1301 21.57 22.9901C21.7 22.8501 21.88 22.7501 22.1 22.6901C22.32 22.6301 22.6 22.6001 22.92 22.6001H26.58C26.74 22.6001 26.88 22.6301 26.99 22.6901C27.1 22.7501 27.19 22.8301 27.27 22.9201C27.35 23.0101 27.4 23.1201 27.43 23.2401C27.46 23.3601 27.48 23.4701 27.48 23.5801C27.48 23.6901 27.46 23.8001 27.43 23.9101C27.4 24.0201 27.35 24.1301 27.28 24.2201C27.21 24.3101 27.12 24.3901 27.01 24.4401C26.9 24.4901 26.76 24.5201 26.6 24.5201H23.81C23.69 24.5201 23.6 24.5401 23.56 24.5801C23.52 24.6201 23.49 24.7101 23.49 24.8401V26.2301H26.32C26.48 26.2301 26.62 26.2601 26.73 26.3201C26.84 26.3801 26.93 26.4601 27.01 26.5501C27.08 26.6501 27.14 26.7501 27.17 26.8701C27.2 26.9901 27.22 27.1001 27.22 27.2101C27.22 27.3201 27.2 27.4301 27.17 27.5401C27.14 27.6501 27.09 27.7601 27.02 27.8501C26.95 27.9401 26.86 28.0201 26.75 28.0701C26.64 28.1201 26.5 28.1501 26.34 28.1501H23.51V31.4501H21.21Z' fill='%23FCFFFF'/%3E%3C/svg%3E%0A");
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
`;

const PdfIconsCell = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
`;

export const ClassDashboardWidget: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { getClassById } = useData();
  const { user } = useAuth();
  const { hasJwtToken } = useApiConfig();
  const {
    students: apiStudents,
    l2Data,
    classInfo: apiClassInfo,
    dgnssIds,
    isLoading,
    error,
  } = useClassStudents(classId);

  const [searchTerm, setSearchTerm] = useState('');
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [downloadError, setDownloadError] = useState(false);

  useEffect(() => {
    if (!downloadError) return;
    const id = setTimeout(() => setDownloadError(false), 4000);
    return () => clearTimeout(id);
  }, [downloadError]);

  const baseClassData = classId ? getClassById(classId) : undefined;

  const classData: Class | undefined = useMemo(() => {
    if (hasJwtToken && apiStudents.length > 0 && classId) {
      const schoolLevel = apiClassInfo?.schoolLevel ?? apiStudents[0]?.schoolLevel ?? '초등';
      const grade = apiClassInfo?.grade ?? apiStudents[0]?.grade ?? 1;
      const classNumber = apiClassInfo?.classNumber ?? 1;

      const assessedStudents = apiStudents.filter((s) => s.assessments.length > 0).length;
      const typeDistribution: Record<string, { count: number; percentage: number }> = {};

      for (const student of apiStudents) {
        const latestAssessment = student.assessments[student.assessments.length - 1];
        if (latestAssessment) {
          const type = latestAssessment.predictedType;
          if (!typeDistribution[type]) {
            typeDistribution[type] = { count: 0, percentage: 0 };
          }
          typeDistribution[type].count++;
        }
      }

      for (const type of Object.keys(typeDistribution)) {
        typeDistribution[type].percentage =
          assessedStudents > 0
            ? Math.round((typeDistribution[type].count / assessedStudents) * 100)
            : 0;
      }

      const needAttentionCount = apiStudents.filter((s) =>
        s.assessments.some((a) => a.attentionResult.needsAttention),
      ).length;

      const totalStudents = l2Data?.examDetail?.stTotalCnt ?? apiStudents.length;
      const submittedCount = l2Data?.examDetail?.stSubmCnt ?? apiStudents.length;

      return {
        id: classId,
        schoolLevel,
        grade,
        classNumber,
        teacherId: '',
        students: apiStudents,
        stats: {
          totalStudents,
          assessedStudents: submittedCount,
          typeDistribution,
          needAttentionCount,
          round1Completed: submittedCount > 0,
          round2Completed: apiStudents.some((s) => s.assessments.some((a) => a.round === 2)),
          examStatus: {
            round1: submittedCount > 0 ? '종료' : '시작전',
            round2: apiStudents.some((s) => s.assessments.some((a) => a.round === 2))
              ? '종료'
              : '시작전',
          },
          round2SubmittedCount: apiStudents.filter((s) => s.assessments.some((a) => a.round === 2))
            .length,
        },
      };
    }
    return baseClassData;
  }, [baseClassData, hasJwtToken, apiStudents, classId, l2Data, apiClassInfo]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (hasJwtToken && isLoading) {
    return (
      <CenteredContainer>
        <CenteredText>
          <SpinnerIcon />
          <GrayText>학급 데이터를 불러오는 중...</GrayText>
        </CenteredText>
      </CenteredContainer>
    );
  }

  if (hasJwtToken && error) {
    return (
      <CenteredContainer>
        <CenteredText>
          <WarningIcon />
          <GrayText>데이터 로드 실패: {error}</GrayText>
        </CenteredText>
      </CenteredContainer>
    );
  }

  if (!classData) {
    return (
      <CenteredContainer>
        <GrayText>학급을 찾을 수 없습니다.</GrayText>
      </CenteredContainer>
    );
  }

  const reliabilityWarningOnly = (() => {
    const studentsWithRound1 = classData.students.filter((s) =>
      s.assessments.some((a) => a.round === 1),
    );
    if (studentsWithRound1.length === 0) return false;
    const reliableStudents = studentsWithRound1.filter((s) => {
      const r1 = s.assessments.find((a) => a.round === 1);
      return r1 && r1.reliabilityWarnings.length === 0;
    });
    return reliableStudents.length === 0;
  })();

  const filteredAndSortedStudents = (() => {
    let filtered = classData.students.filter((s) => {
      if (searchTerm && !s.name.includes(searchTerm) && !s.number.toString().includes(searchTerm))
        return false;

      const r1 = s.assessments.find((a) => a.round === 1);
      const r2 = s.assessments.find((a) => a.round === 2);

      if (changeFilter === 'type-change' && !(r1 && r2 && r1.predictedType !== r2.predictedType))
        return false;
      if (changeFilter === 'reliability-warning') {
        if (!s.assessments.some((a) => a.reliabilityWarnings.length > 0)) return false;
      }
      if (changeFilter === 'need-attention') {
        if (!s.assessments.some((a) => a.attentionResult.needsAttention)) return false;
      }
      return true;
    });

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const getValue = (student: Student) => {
          const r1 = student.assessments.find((r) => r.round === 1);
          const r2 = student.assessments.find((r) => r.round === 2);
          switch (sortField) {
            case 'number':
              return student.number;
            case 'name':
              return student.name;
            case 'type1':
              return r1?.predictedType || '';
            case 'type2':
              return r2?.predictedType || '';
          }
        };
        const aValue = getValue(a);
        const bValue = getValue(b);
        if (typeof aValue === 'number' && typeof bValue === 'number')
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        return sortDirection === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }
    return filtered;
  })();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderResultCell = (assessment: Assessment | undefined, isSubmittedNoResult?: boolean) => {
    if (!assessment) {
      if (isSubmittedNoResult) return <StatusBadge $variant='submitted'>제출 완료</StatusBadge>;
      return <DashPlaceholder $variant='light'>-</DashPlaceholder>;
    }
    const hasReliability = assessment.reliabilityWarnings.length > 0;
    const hasAttention = assessment.attentionResult.needsAttention;
    return (
      <ResultCellWrapper>
        <Badge type={assessment.predictedType}>{assessment.predictedType}</Badge>
        {hasAttention && (
          <StatusBadge
            $variant='attention'
            title={formatAttentionTooltip(assessment.attentionResult)}
          >
            <BadgeIcon>
              <AlertTriangle size={14} />
            </BadgeIcon>
            관심
          </StatusBadge>
        )}
        {hasReliability && (
          <StatusBadge
            $variant='reliability'
            title={`신뢰도 주의: ${assessment.reliabilityWarnings.join(', ')}`}
          >
            <BadgeIcon>
              <ShieldAlert size={14} />
            </BadgeIcon>
            신뢰도
          </StatusBadge>
        )}
      </ResultCellWrapper>
    );
  };

  const renderChangeIndicator = (r1: Assessment | undefined, r2: Assessment | undefined) => {
    if (!r2) return <NoChangeText>--</NoChangeText>;
    if (r1?.predictedType !== r2.predictedType)
      return <ChangeIndicator $variant='changed'>→</ChangeIndicator>;
    return <ChangeIndicator $variant='neutral'>−</ChangeIndicator>;
  };

  const handleDownloadAll = async (round: 1 | 2) => {
    const dgnssId = round === 1 ? dgnssIds.round1 : dgnssIds.round2;
    if (!dgnssId) return;
    setDownloadError(false);
    try {
      await downloadAllPdf(dgnssId);
    } catch {
      setDownloadError(true);
    }
  };

  const handleDownloadTeacherReport = async (ids: { round1?: number; round2?: number }) => {
    setDownloadError(false);
    try {
      if (ids.round1) {
        await downloadAllPdf(ids.round1);
      }
      if (ids.round2) {
        await downloadAllPdf(ids.round2);
      }
    } catch {
      setDownloadError(true);
    }
  };

  const handleDownloadStudentPdf = async (student: Student, round: 1 | 2, type: 1 | 2) => {
    const dgnssId = round === 1 ? dgnssIds.round1 : dgnssIds.round2;
    const assessment = student.assessments.find((a) => a.round === round);
    if (!dgnssId || assessment?.answerIdx == null) return;

    setDownloadError(false);
    try {
      await downloadStudentPdf({
        userId: student.id,
        userType: 'S',
        dgnssId,
        answerIdx: assessment.answerIdx,
        ordNo: round,
        type,
      });
    } catch {
      setDownloadError(true);
    }
  };

  return (
    <PageContainer>
      <HeaderRow>
        <BackButton onClick={() => navigate('/dashboard')}>
          <BackIcon />
        </BackButton>
        <HeaderContent>
          <PageTitle>
            {classData.grade}학년 {classData.classNumber}반
          </PageTitle>
          <PageSubtitle>
            학생 {classData.stats?.totalStudents}명 | 검사 완료 {classData.stats?.assessedStudents}
            명
          </PageSubtitle>
        </HeaderContent>
        {hasJwtToken && (
          <DownloadButtons>
            {downloadError && (
              <span style={{ fontSize: '0.75rem', color: '#ef4444', alignSelf: 'center' }}>
                다운로드 실패
              </span>
            )}
            <TeacherReportButton
              onClick={() => void handleDownloadTeacherReport(dgnssIds)}
              disabled={!dgnssIds.round1 && !dgnssIds.round2}
              title={
                dgnssIds.round1 || dgnssIds.round2
                  ? '교사용 보고서 PDF 다운로드'
                  : '검사 완료 후 가능'
              }
            >
              교사용 보고서 PDF
            </TeacherReportButton>
            <DownloadButton
              onClick={() => void handleDownloadAll(1)}
              disabled={!dgnssIds.round1}
              title={dgnssIds.round1 ? '1차 보고서 전체 다운로드' : '1차 검사 완료 후 가능'}
            >
              <Download size={14} />
              1차 보고서 전체 다운로드
            </DownloadButton>
            <DownloadButton
              onClick={() => void handleDownloadAll(2)}
              disabled={!dgnssIds.round2}
              title={dgnssIds.round2 ? '2차 보고서 전체 다운로드' : '2차 검사 완료 후 가능'}
            >
              <Download size={14} />
              2차 보고서 전체 다운로드
            </DownloadButton>
          </DownloadButtons>
        )}
      </HeaderRow>

      {classData.stats?.examStatus?.round2 === '진행중' && (
        <BannerContainer $variant='warning'>
          <BannerIcon as={Clock} />
          <div>
            <BannerTitle>2차 검사 진행 중</BannerTitle>
            <BannerDescription>
              {classData.stats.round2SubmittedCount}/{classData.stats.totalStudents}명 제출 완료.
              검사 종료 후 결과를 확인할 수 있습니다.
            </BannerDescription>
          </div>
        </BannerContainer>
      )}

      {reliabilityWarningOnly && (
        <BannerContainer $variant='info'>
          <BannerIconWrapper $marginTop>
            <BannerIcon as={ShieldAlert} />
          </BannerIconWrapper>
          <div>
            <BannerTitle>모든 학생이 신뢰도 주의 상태입니다</BannerTitle>
            <BannerDescriptionLarge>
              신뢰도 양호 학생이 없어 전체 학생 데이터를 기반으로 분석 결과를 표시합니다. 결과
              해석에 주의가 필요합니다.
            </BannerDescriptionLarge>
          </div>
        </BannerContainer>
      )}

      <ChartsGrid>
        <TypeChangeChart classData={classData} />
        <ClassInsights classData={classData} />
      </ChartsGrid>

      <StudentListGrid>
        <Card>
          <CardHeaderRow>
            <ApiTooltip {...API_CLASS_STUDENTS} position='top-left'>
              <CardTitle>학생 목록</CardTitle>
            </ApiTooltip>
            <SearchWrapper>
              <SearchIcon />
              <SearchInput
                type='text'
                placeholder='이름/번호 검색'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchWrapper>
          </CardHeaderRow>

          <FilterSection>
            <FilterRow>
              <FilterLabel>필터:</FilterLabel>
              <ChangeFilterButtons value={changeFilter} onChange={setChangeFilter} />
            </FilterRow>
            <FilterInfoRow>
              <FilterCount>
                {filteredAndSortedStudents.length}명 표시
                {changeFilter !== 'all' && (
                  <FilterTotalCount>(전체 {classData.students.length}명)</FilterTotalCount>
                )}
              </FilterCount>
              {changeFilter !== 'all' && (
                <FilterResetButton onClick={() => setChangeFilter('all')}>
                  필터 초기화
                </FilterResetButton>
              )}
            </FilterInfoRow>
          </FilterSection>

          <TableWrapper>
            <Table>
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell $width='4rem'>
                    <SortableHeader
                      field='number'
                      label='번호'
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHeaderCell>
                  <TableHeaderCell $width='6rem'>
                    <SortableHeader
                      field='name'
                      label='이름'
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHeaderCell>
                  <TableHeaderCell>
                    <SortableHeader
                      field='type1'
                      label='1차 결과'
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHeaderCell>
                  <TableHeaderCell $width='4rem' $align='center'>
                    변화
                  </TableHeaderCell>
                  <TableHeaderCell>
                    <SortableHeader
                      field='type2'
                      label='2차 결과'
                      currentField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </TableHeaderCell>
                  {hasJwtToken && (
                    <TableHeaderCell $width='7rem' $align='center'>
                      PDF 다운로드
                    </TableHeaderCell>
                  )}
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedStudents.map((student) => {
                  const r1 = student.assessments.find((a) => a.round === 1);
                  const r2 = student.assessments.find((a) => a.round === 2);

                  return (
                    <TableRow
                      key={student.id}
                      onClick={() =>
                        navigate(`/dashboard/class/${classId}/student/${student.id}`)
                      }
                      style={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <StudentNumber>{student.number}</StudentNumber>
                      </TableCell>
                      <TableCell>
                        <StudentName>{student.name}</StudentName>
                      </TableCell>
                      <TableCell>
                        {renderResultCell(r1)}
                      </TableCell>
                      <TableCell $align='center'>
                        {renderChangeIndicator(r1, r2)}
                      </TableCell>
                      <TableCell>
                        {renderResultCell(
                          r2,
                          !r2 &&
                            classData.stats?.examStatus?.round2 === '진행중' &&
                            student.round2Submitted,
                        )}
                      </TableCell>
                      {hasJwtToken && (
                        <TableCell $align='center'>
                          <PdfIconsCell>
                            <PdfIconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDownloadStudentPdf(student, 1, 1);
                              }}
                              disabled={!r1 || r1.answerIdx == null}
                              title='1차 상세'
                            />
                            <PdfIconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDownloadStudentPdf(student, 1, 2);
                              }}
                              disabled={!r1 || r1.answerIdx == null}
                              title='1차 요약'
                            />
                            <PdfIconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDownloadStudentPdf(student, 2, 1);
                              }}
                              disabled={!r2 || r2.answerIdx == null}
                              title='2차 상세'
                            />
                            <PdfIconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDownloadStudentPdf(student, 2, 2);
                              }}
                              disabled={!r2 || r2.answerIdx == null}
                              title='2차 요약'
                            />
                          </PdfIconsCell>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>
        </Card>
      </StudentListGrid>
    </PageContainer>
  );
};
