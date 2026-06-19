/**
 * 학교 검색 모달 (검사 기본정보 입력용) — NEIS 프록시 검색.
 * mypage 의 SchoolSearchModal 을 학심정 디자인(Emotion + 공용 Modal)으로 이식.
 */
import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { Search, ChevronRight } from 'lucide-react';
import { Modal } from '@shared/ui/Modal';
import { useSchoolSearch, type SchoolSearchResult } from '../api/schoolSearchService';

const SCHOOL_GRADE_LABEL: Record<string, string> = {
  KINDERGARTEN: '유치원',
  ELEMENTARY: '초등',
  MIDDLE: '중등',
  HIGH: '고등',
  SPECIAL: '특수',
  UNIVERSITY: '대학',
  ETC: '기타',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (school: SchoolSearchResult) => void;
}

export const SchoolSearchModal = ({ isOpen, onClose, onSelect }: Props) => {
  const [keyword, setKeyword] = useState('');
  const [submitted, setSubmitted] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setKeyword('');
      setSubmitted('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const { data, isFetching, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSchoolSearch(submitted, isOpen);

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;
  const loaded = items.length;
  const trimmed = keyword.trim();
  const canSubmit = trimmed.length >= 1;

  const showHint = submitted.length === 0;
  const showLoading = !showHint && isFetching && !isFetchingNextPage && loaded === 0;
  const showEmpty = !showHint && !isFetching && !isError && loaded === 0;
  const showError = !showHint && !isFetching && isError;
  const showResults = !showHint && !isError && loaded > 0;

  const submit = () => {
    if (canSubmit) setSubmitted(trimmed);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="학교 검색" size="lg">
      <Hint>학교명을 입력 후 검색 버튼 또는 Enter. (데이터 출처: 교육부 · NEIS)</Hint>

      <SearchRow>
        <InputWrap>
          <Search size={16} />
          <SearchInput
            ref={inputRef}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="예: 비상고등학교"
          />
        </InputWrap>
        <SearchButton type="button" onClick={submit} disabled={!canSubmit || isFetching}>
          {isFetching && !isFetchingNextPage ? '검색 중' : '검색'}
        </SearchButton>
      </SearchRow>

      {showResults && (
        <ResultMeta>
          총 <b>{totalCount.toLocaleString()}</b>건 중 <b>{loaded}</b>건 표시
        </ResultMeta>
      )}

      <ResultArea>
        {showHint && (
          <StateBox>
            <BigEmoji>🔍</BigEmoji>
            학교명을 입력하고 <b>검색</b> 버튼을 눌러주세요
          </StateBox>
        )}
        {showLoading && <StateBox>검색 중...</StateBox>}
        {showError && <StateBox $danger>검색에 실패했습니다. 잠시 후 다시 시도해주세요.</StateBox>}
        {showEmpty && (
          <StateBox>
            <BigEmoji>🤔</BigEmoji>
            <b>'{trimmed}'</b> 검색 결과가 없어요.
          </StateBox>
        )}
        {showResults && (
          <>
            <ResultList>
              {items.map((school) => (
                <li key={school.code}>
                  <ResultItem type="button" onClick={() => { onSelect(school); onClose(); }}>
                    <GradeChip>{SCHOOL_GRADE_LABEL[school.grade] ?? school.niceKindName}</GradeChip>
                    <ItemInfo>
                      <ItemName>{school.name}</ItemName>
                      <ItemRegion>{school.region}</ItemRegion>
                    </ItemInfo>
                    <ChevronRight size={16} />
                  </ResultItem>
                </li>
              ))}
            </ResultList>
            {hasNextPage && (
              <MoreButton type="button" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? '불러오는 중...' : `더 보기 (${loaded} / ${totalCount.toLocaleString()})`}
              </MoreButton>
            )}
          </>
        )}
      </ResultArea>
    </Modal>
  );
};

const Hint = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SearchRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const InputWrap = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 12px;
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 42px;
  padding: 0 14px 0 36px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const SearchButton = styled.button`
  height: 42px;
  padding: 0 20px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, disabled }) => (disabled ? theme.colors.gray[300] : theme.colors.primary[500])};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  white-space: nowrap;
  flex-shrink: 0;
`;

const ResultMeta = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};

  b {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const ResultArea = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  max-height: 46vh;
  overflow-y: auto;
`;

const StateBox = styled.div<{ $danger?: boolean }>`
  text-align: center;
  padding: 40px 0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme, $danger }) => ($danger ? '#ef4444' : theme.colors.text.secondary)};
  line-height: 1.6;
`;

const BigEmoji = styled.div`
  font-size: 28px;
  margin-bottom: 10px;
`;

const ResultList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const ResultItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 12px 10px;
  border: none;
  background: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  text-align: left;
  color: ${({ theme }) => theme.colors.text.secondary};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const GradeChip = styled.span`
  flex-shrink: 0;
  width: 48px;
  text-align: center;
  padding: 4px 0;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemRegion = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 2px;
`;

const MoreButton = styled.button`
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  border: 1.5px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  background: #fff;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
