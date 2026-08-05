/**
 * v2 LNB 스코프 트리 (P1-5)
 *
 * 전체 → 반(아코디언) → 학생 3레벨. 선택은 LayoutContext의 selectAll/selectClass/selectStudent로,
 * 데이터는 React Query(useMyGroupsQuery/useGroupMembersQuery)로 직접 소비한다.
 * 현재 메뉴가 학생 스코프를 지원하지 않으면(currentMenuConfig.student=false) 반 펼침·학생 목록을 숨긴다.
 * 프로토타입의 MOCK 데이터는 이식하지 않는다.
 */

import styled from '@emotion/styled';
import type React from 'react';
import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';

import { useMyGroupsQuery } from '@features/api';
import { useAuth } from '@features/auth';
import { useGroupMembersQuery } from '@features/groups';
import { openMypageGroups } from '@shared/lib/mypage';

import { useLayoutContext } from './LayoutContext';

// ============================================================================
// Styled Components
// ============================================================================

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const GroupMgmtButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 9px 10px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const Divider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  margin: ${({ theme }) => theme.spacing.sm} 0;
`;

const SectionLabel = styled.div`
  padding: 0 10px;
  margin-bottom: 6px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[400]};
  letter-spacing: 0.02em;
`;

const RowButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 10px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-align: left;
  background-color: ${({ theme, $active }) =>
    $active ? theme.colors.primary[100] : 'transparent'};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary[600] : theme.colors.gray[900])};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme, $active }) =>
      $active ? theme.colors.primary[100] : theme.colors.gray[100]};
  }
`;

const ClassScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ClassList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ClassHeaderButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 9px 10px;
  text-align: left;
  background-color: ${({ theme, $active }) =>
    $active ? theme.colors.primary[100] : 'transparent'};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme, $active }) =>
      $active ? theme.colors.primary[100] : theme.colors.gray[100]};
  }
`;

const ExpandIcon = styled(ChevronRight, {
  shouldForwardProp: (prop) => prop !== '$expanded',
})<{ $expanded: boolean }>`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  transition: transform ${({ theme }) => theme.transitions.fast};
  transform: ${({ $expanded }) => ($expanded ? 'rotate(90deg)' : 'none')};
`;

const ExpandSpacer = styled.span`
  width: 16px;
  flex-shrink: 0;
`;

const ClassName = styled.span<{ $active: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary[600] : theme.colors.gray[900])};
`;

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.colors.primary[500]};
  flex-shrink: 0;
`;

const StudentPanel = styled.div`
  margin: 4px 0 0 16px;
  padding-left: 8px;
  border-left: 2px solid ${({ theme }) => theme.colors.gray[100]};
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SubRowButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 10px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  text-align: left;
  background-color: ${({ theme, $active }) =>
    $active ? theme.colors.primary[100] : 'transparent'};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary[600] : theme.colors.gray[600])};
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme, $active }) =>
      $active ? theme.colors.primary[100] : theme.colors.gray[100]};
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  padding: 6px 10px;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 6px 8px 6px 26px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[900]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[400]};
  }
`;

const StudentScrollArea = styled.div`
  max-height: 360px;
  overflow-y: auto;
`;

const HintText = styled.div`
  padding: 8px 10px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ErrorWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 8px 10px;
`;

const ErrorMessage = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.error.main};
`;

const RetryButton = styled.button`
  padding: 4px 10px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary[600]};
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.sm};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[50]};
  }
`;

// ============================================================================
// Component
// ============================================================================

const ScopeError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <ErrorWrap>
    <ErrorMessage>{message}</ErrorMessage>
    <RetryButton type='button' onClick={onRetry}>
      다시 시도
    </RetryButton>
  </ErrorWrap>
);

export const ScopeTree: React.FC = () => {
  const { user } = useAuth();
  const {
    scope,
    currentMenuConfig,
    selectAll,
    selectClass,
    selectStudent,
    expandedClassId,
    setExpandedClassId,
  } = useLayoutContext();

  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: groups = [],
    isLoading: groupsLoading,
    isError: groupsError,
    refetch: refetchGroups,
  } = useMyGroupsQuery();
  // 펼쳐진 반의 멤버만 조회한다(반 펼침 시 lazy fetch).
  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useGroupMembersQuery(currentMenuConfig.student ? expandedClassId : null, user?.id);

  const activeStudents = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );

  const filteredStudents = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return activeStudents;
    return activeStudents.filter((student) => (student.name || '').toLowerCase().includes(keyword));
  }, [activeStudents, searchQuery]);

  const handleClassHeaderClick = (classId: string) => {
    if (currentMenuConfig.student) {
      // 학생 지원 메뉴: 펼침 토글. 펼칠 때 검색어 초기화 + (반 스코프 지원 시) 반 전체 선택.
      const willExpand = expandedClassId !== classId;
      setExpandedClassId(willExpand ? classId : null);
      if (willExpand) {
        setSearchQuery('');
        if (currentMenuConfig.class) {
          selectClass(classId);
        }
      }
    } else {
      // 학생 미지원 메뉴: 바로 반 선택
      selectClass(classId);
    }
  };

  return (
    <Wrapper>
      <GroupMgmtButton onClick={() => openMypageGroups('list')}>그룹관리</GroupMgmtButton>

      <Divider />

      <RowButton $active={scope.level === 'all'} onClick={selectAll}>
        <span>전체</span>
        {scope.level === 'all' && <Dot />}
      </RowButton>

      <Divider />

      <SectionLabel>반 목록</SectionLabel>

      <ClassScrollArea>
        {groupsLoading ? (
          <HintText>불러오는 중…</HintText>
        ) : groupsError ? (
          <ScopeError message='반 목록을 불러오지 못했어요.' onRetry={() => void refetchGroups()} />
        ) : groups.length === 0 ? (
          <HintText>반이 없습니다</HintText>
        ) : (
          <ClassList>
            {groups.map((group) => {
              const isExpanded = expandedClassId === group.id;
              const isClassSelected = scope.level === 'class' && scope.classId === group.id;
              const isStudentInClass = scope.level === 'student' && scope.classId === group.id;
              const isActive = isClassSelected || isStudentInClass;

              return (
                <li key={group.id}>
                  <ClassHeaderButton
                    $active={isActive && !currentMenuConfig.student}
                    onClick={() => handleClassHeaderClick(group.id)}
                  >
                    {currentMenuConfig.student ? (
                      <ExpandIcon $expanded={isExpanded} />
                    ) : (
                      <ExpandSpacer />
                    )}
                    <ClassName $active={isActive}>{group.name}</ClassName>
                    {isActive && !currentMenuConfig.student && (
                      <Dot style={{ marginLeft: 'auto' }} />
                    )}
                  </ClassHeaderButton>

                  {isExpanded && currentMenuConfig.student && (
                    <StudentPanel>
                      {currentMenuConfig.class && (
                        <SubRowButton
                          $active={isClassSelected}
                          onClick={() => selectClass(group.id)}
                        >
                          <span>반 전체</span>
                          {isClassSelected && <Dot />}
                        </SubRowButton>
                      )}

                      <SearchWrapper>
                        <SearchIcon />
                        <SearchInput
                          type='text'
                          placeholder='학생 검색…'
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                        />
                      </SearchWrapper>

                      <StudentScrollArea>
                        {membersLoading ? (
                          <HintText>불러오는 중…</HintText>
                        ) : membersError ? (
                          <ScopeError
                            message='학생 목록을 불러오지 못했어요.'
                            onRetry={() => void refetchMembers()}
                          />
                        ) : filteredStudents.length === 0 ? (
                          <HintText>{searchQuery ? '검색 결과 없음' : '학생 없음'}</HintText>
                        ) : (
                          filteredStudents.map((student) => {
                            const isStudentSelected =
                              scope.level === 'student' && scope.studentId === student.id;
                            return (
                              <SubRowButton
                                key={student.id}
                                $active={isStudentSelected}
                                onClick={() => selectStudent(group.id, student.id)}
                              >
                                <span>{student.name || '비공개'}</span>
                                {isStudentSelected && <Dot />}
                              </SubRowButton>
                            );
                          })
                        )}
                      </StudentScrollArea>
                    </StudentPanel>
                  )}
                </li>
              );
            })}
          </ClassList>
        )}
      </ClassScrollArea>
    </Wrapper>
  );
};
