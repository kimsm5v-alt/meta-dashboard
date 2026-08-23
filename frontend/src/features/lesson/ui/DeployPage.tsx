import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { useMyGroupsQuery } from '@features/api';
import { useAuth } from '@features/auth';
import { PageLoading } from '@shared/ui/Loading';
import {
  deployLessonActivity,
  type DeployFailedStep,
  type DeployLessonActivityFailure,
} from '../api/lmsActivityService';
import { useCmsSetDetailQuery, useLibraryItemQuery } from '../api/queries';
import { buildLessonJoinUrl } from '../lib/buildLessonJoinUrl';
import { buildDeployActivityBody } from '../model/buildDeployActivityBody';
import { collectAssigneeSubsFromGroups } from '../model/collectAssigneeSubsFromGroups';
import { mapCmsSetToLibItem } from '../model/mapCmsSetToLibItem';
import { mapLibraryItemToLibItem } from '../model/mapLibraryItemToLibItem';
// 보류: mock 콘텐츠 조회 (추가계획9)
// import { MOCK_LIBRARY_ITEMS } from '../model/mockLibraryItems';
import type { DeployPageLocationState, LibItem, LibraryColorGroup } from '../model/types';
import { ENV } from '@shared/config/env';

type DeployMode = 'period' | 'live';

interface DeployedState {
  isLive: boolean;
  classesStr: string;
  rangeTxt: string;
  activityId: string;
  accessKey: string;
  joinUrl: string;
}

interface DeployResumeState {
  activityId?: string;
  failedStep: DeployFailedStep;
}

const DEPLOY_FAIL_TOAST: Record<DeployFailedStep, string> = {
  create: '출제 실패했습니다.',
  assign: '학생 배정에 실패했습니다.',
  publish: '문제 발행에 실패했습니다.',
};

const COLOR_GROUP_BG: Record<LibraryColorGroup, string> = {
  g1: 'linear-gradient(135deg, #e7f8f2, #f0fbf7)',
  g2: 'linear-gradient(135deg, #fdeef0, #fef4f5)',
  g3: 'linear-gradient(135deg, #f0eefc, #f6f5fd)',
  g4: 'linear-gradient(135deg, #e8f0fe, #eef5ff)',
  g5: 'linear-gradient(135deg, #e6f7fa, #eefbfc)',
  g6: 'linear-gradient(135deg, #fdf3e2, #fdf8ee)',
};

const formatDate = (d: Date) => d.toISOString().slice(0, 10);
const today = new Date();
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);

export const DeployPage = () => {
  const { setId, libraryItemId } = useParams<{ setId: string; libraryItemId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const failHandledRef = useRef(false);
  const { user } = useAuth();

  const {
    data: groups = [],
    isLoading: groupsLoading,
    isError: groupsError,
    refetch: refetchGroups,
  } = useMyGroupsQuery();

  // ResourceCard navigate state.item 우선. mock find는 보류(추가계획9).
  const stateItem = (location.state as DeployPageLocationState | null)?.item;
  const hasStateItem = Boolean(stateItem && (!setId || stateItem.id === setId));

  const libraryItemQuery = useLibraryItemQuery(libraryItemId, {
    enabled: !hasStateItem && Boolean(libraryItemId),
  });
  const cmsSetQuery = useCmsSetDetailQuery(setId, {
    enabled: !hasStateItem && Boolean(setId),
  });

  const item = useMemo((): LibItem | undefined => {
    if (hasStateItem && stateItem) return stateItem;
    if (libraryItemId && libraryItemQuery.data)
      return mapLibraryItemToLibItem(libraryItemQuery.data);
    if (!libraryItemId && cmsSetQuery.data) return mapCmsSetToLibItem(cmsSetQuery.data);
    return undefined;
  }, [hasStateItem, stateItem, libraryItemId, libraryItemQuery.data, cmsSetQuery.data]);

  // const item = MOCK_LIBRARY_ITEMS.find((x) => x.id === setId);

  const isItemLoading =
    !hasStateItem &&
    ((Boolean(libraryItemId) && libraryItemQuery.isPending) ||
      (Boolean(setId) && !libraryItemId && cmsSetQuery.isPending));

  const isItemFailed =
    !setId ||
    (!hasStateItem &&
      !isItemLoading &&
      (libraryItemId
        ? libraryItemQuery.isError || (libraryItemQuery.isSuccess && !item)
        : cmsSetQuery.isError || (cmsSetQuery.isSuccess && !item)));

  useEffect(() => {
    if (!isItemFailed || failHandledRef.current) return;
    failHandledRef.current = true;
    toast.error('콘텐츠 조회에 실패했습니다');
    if (location.key === 'default') {
      navigate(`/lesson/library${location.search}`, { replace: true });
    } else {
      navigate(-1);
    }
  }, [isItemFailed, location.key, navigate, location.search]);

  const presetClassId = searchParams.get('class') ?? '';
  const [classes, setClasses] = useState<string[]>(presetClassId ? [presetClassId] : []);
  const [dropOpen, setDropOpen] = useState(false);
  const [mode, setMode] = useState<DeployMode>('period');
  const [start, setStart] = useState(formatDate(today));
  const [end, setEnd] = useState(formatDate(nextWeek));
  const [deployed, setDeployed] = useState<DeployedState | null>(null);
  const [deployResume, setDeployResume] = useState<DeployResumeState | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const resolveGroupName = (id: string) => groups.find((g) => g.id === id)?.name ?? id;

  // 로딩 중에는 프리셋을 그대로 유지하고, 로딩 완료 후 실제 groups에 있는 항목만 유효하게 간주
  const validClasses = groupsLoading
    ? classes
    : groupsError
      ? []
      : classes.filter((id) => groups.some((g) => g.id === id));

  const selectedLabel =
    validClasses.length > 0 ? validClasses.map(resolveGroupName).join(', ') : '반을 선택하세요';

  const toggleClass = (id: string) =>
    setClasses((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));

  const resolvedLibraryItemId = libraryItemId ?? item?.libraryItemId;

  const copyJoinUrl = useCallback(async (joinUrl: string) => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success('링크가 복사되었습니다');
    } catch {
      toast.error('링크 복사에 실패했습니다');
    }
  }, []);

  const doDeploy = async () => {
    if (validClasses.length === 0) {
      toast.error('대상 반을 선택하세요');
      return;
    }
    if (!setId || !item) {
      toast.error('콘텐츠 ID가 없습니다');
      return;
    }
    if (!user?.id) {
      toast.error('로그인 정보가 없습니다');
      return;
    }

    const isLive = mode === 'live';
    const classesStr = validClasses.map(resolveGroupName).join(', ');
    const rangeTxt = isLive
      ? '실시간 수업 · 지금 시작'
      : `${start.replace(/-/g, '.')} ~ ${end.replace(/-/g, '.')}`;

    setIsDeploying(true);
    try {
      const assigneeSubs = await collectAssigneeSubsFromGroups(validClasses, user.id);
      if (assigneeSubs.length === 0) {
        toast.error('배정할 학생이 없습니다');
        return;
      }

      const body = buildDeployActivityBody({
        title: item.title,
        mode,
        startDate: start,
        endDate: end,
        libraryItemId: resolvedLibraryItemId,
        lcmsSetId: setId,
        cmsSetDetail: cmsSetQuery.data,
      });

      const result = await deployLessonActivity({
        body,
        assigneeSubs,
        resume: deployResume?.activityId
          ? { activityId: deployResume.activityId, failedStep: deployResume.failedStep }
          : undefined,
      });

      const joinUrl = buildLessonJoinUrl(result.accessKey);
      setDeployResume(null);
      setDeployed({
        isLive,
        classesStr,
        rangeTxt,
        activityId: result.activityId,
        accessKey: result.accessKey,
        joinUrl,
      });
      toast.success('배포되었습니다');
    } catch (error) {
      const failure = error as DeployLessonActivityFailure;
      if (failure?.failedStep) {
        const status = failure.status ?? 0;
        toast.error(`${DEPLOY_FAIL_TOAST[failure.failedStep]} [${status}]`);
        setDeployResume({
          activityId: failure.activityId,
          failedStep: failure.failedStep,
        });
      } else {
        toast.error('학생 배정 명단을 불러오지 못했습니다');
      }
      setDeployed(null);
    } finally {
      setIsDeploying(false);
    }
  };

  const goToReports = () => navigate(`/lesson/result${location.search}`);

  if (isItemLoading) {
    return (
      <Page>
        <SubHeader>
          <BackButton type='button' onClick={() => navigate(-1)} aria-label='뒤로'>
            <ChevronLeft size={20} />
          </BackButton>
          <SubHeaderTitle>활동 배포</SubHeaderTitle>
        </SubHeader>
        <PageLoading text='콘텐츠를 불러오는 중...' />
      </Page>
    );
  }

  if (isItemFailed || !item) {
    return null;
  }

  const previewTitle = item.title;
  const thumbnailUrl = item.thumbnailUrl?.startsWith('/')
    ? `${ENV.CMS_FILE_URL}${item.thumbnailUrl}`
    : `${ENV.CMS_FILE_URL}/${item.thumbnailUrl}`;

  return (
    <Page>
      <SubHeader>
        <BackButton type='button' onClick={() => navigate(-1)} aria-label='뒤로'>
          <ChevronLeft size={20} />
        </BackButton>
        <SubHeaderTitle>활동 배포</SubHeaderTitle>
      </SubHeader>

      <Body>
        <Inner>
          {/* 좌: 미리보기 */}
          <PreviewPanel>
            <PreviewCard>
              <Thumb $group={item.colorGroup ?? 'g1'}>
                {item.thumbnailUrl && !imgFailed ? (
                  <ThumbImage
                    src={thumbnailUrl}
                    alt={item.title}
                    loading='lazy'
                    onError={() => setImgFailed(true)}
                  />
                ) : null}
                {imgFailed ? <ThumbTitle title={item.title}>{item.title}</ThumbTitle> : null}
              </Thumb>
              <PreviewMeta>
                <MetaHint>슬라이드 이름 · 수정 불가</MetaHint>
                <MetaTitle>{previewTitle}</MetaTitle>
                <MetaBadges>
                  {item.level?.map((l) => (
                    <MetaBadge key={l}>{l}</MetaBadge>
                  ))}
                  {item.selArea ? <MetaBadge>{item.selArea}</MetaBadge> : null}
                  {item.duration ? <MetaBadge>{item.duration}</MetaBadge> : null}
                </MetaBadges>
              </PreviewMeta>
            </PreviewCard>
          </PreviewPanel>

          {/* 우: 설정 */}
          <SettingsPanel>
            {/* 1. 대상 반 선택 */}
            <Section>
              <SectionLabel>
                <StepBadge>1</StepBadge>
                대상 반 선택
                <SectionSub>· 복수 선택 가능</SectionSub>
              </SectionLabel>
              <DropWrap>
                <DropTrigger
                  type='button'
                  onClick={() => setDropOpen((o) => !o)}
                  aria-expanded={dropOpen}
                >
                  <DropTriggerText $hasValue={validClasses.length > 0}>
                    {selectedLabel}
                  </DropTriggerText>
                  <ChevronDown size={16} />
                </DropTrigger>
                {dropOpen && (
                  <DropMenu>
                    {groupsLoading && <DropMenuStatus>반 목록 불러오는 중…</DropMenuStatus>}
                    {groupsError && (
                      <DropMenuErrorWrap>
                        <DropMenuStatus $error>반 목록을 불러오지 못했습니다</DropMenuStatus>
                        <DropMenuRetry type='button' onClick={() => void refetchGroups()}>
                          다시 시도
                        </DropMenuRetry>
                      </DropMenuErrorWrap>
                    )}
                    {!groupsLoading && !groupsError && groups.length === 0 && (
                      <DropMenuStatus>반이 없습니다</DropMenuStatus>
                    )}
                    {!groupsLoading &&
                      !groupsError &&
                      groups.length > 0 &&
                      groups.map((g) => (
                        <DropItem
                          key={g.id}
                          type='button'
                          $selected={classes.includes(g.id)}
                          onClick={() => toggleClass(g.id)}
                        >
                          <Checkbox $checked={classes.includes(g.id)}>
                            {classes.includes(g.id) ? '✓' : ''}
                          </Checkbox>
                          {g.name}
                        </DropItem>
                      ))}
                  </DropMenu>
                )}
              </DropWrap>
            </Section>

            {/* 2. 시작 방식 */}
            <Section>
              <SectionLabel>
                <StepBadge>2</StepBadge>
                시작 방식
              </SectionLabel>
              <ModeList>
                <ModeOption
                  type='button'
                  $selected={mode === 'period'}
                  onClick={() => setMode('period')}
                >
                  <ModeRow>
                    <ModeCheck $selected={mode === 'period'}>
                      {mode === 'period' ? '✓' : ''}
                    </ModeCheck>
                    <ModeTitle>기간 설정</ModeTitle>
                  </ModeRow>
                  <ModeDesc>설정한 기간 동안 학생이 들어와 제출할 수 있어요</ModeDesc>
                  {mode === 'period' && (
                    <DateRow onClick={(e) => e.stopPropagation()}>
                      <DateInput
                        type='date'
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                      />
                      <DateSep>~</DateSep>
                      <DateInput type='date' value={end} onChange={(e) => setEnd(e.target.value)} />
                    </DateRow>
                  )}
                </ModeOption>

                <ModeOption
                  type='button'
                  $selected={mode === 'live'}
                  onClick={() => setMode('live')}
                >
                  <ModeRow>
                    <ModeCheck $selected={mode === 'live'}>{mode === 'live' ? '✓' : ''}</ModeCheck>
                    <ModeTitle>수업 바로 시작하기</ModeTitle>
                  </ModeRow>
                  <ModeDesc>학생들과 실시간으로 수업할 수 있어요</ModeDesc>
                </ModeOption>
              </ModeList>
            </Section>

            <InfoBox>
              배포하면 <strong>QR · 참여 링크 · 학급 알림</strong>이 자동으로 생성·발송됩니다.
            </InfoBox>

            {/* 배포 결과 */}
            {deployed && (
              <ResultCard>
                <ResultBanner $isLive={deployed.isLive}>
                  {deployed.isLive ? '학생들에게 배포가 완료되었습니다!' : '배포가 완료되었습니다!'}
                </ResultBanner>
                <ResultDesc>
                  <strong>{deployed.classesStr}</strong> ·{' '}
                  {deployed.isLive
                    ? '이제 실시간 수업을 시작할 수 있습니다.'
                    : '설정한 기간 동안 학생이 들어와 제출합니다.'}
                </ResultDesc>
                <ResultRow>
                  <QrWrap aria-hidden>
                    <QRCodeCanvas value={deployed.joinUrl} size={80} level='M' />
                  </QrWrap>
                  <ResultInfo>
                    <ResultInfoTitle>
                      QR·참여 링크·학급 알림이 자동 생성·발송되었어요!
                    </ResultInfoTitle>
                    <LinkRow>
                      <LinkInput readOnly value={deployed.joinUrl} aria-label='참여 링크' />
                      <CopyButton type='button' onClick={() => void copyJoinUrl(deployed.joinUrl)}>
                        복사
                      </CopyButton>
                    </LinkRow>
                    <TagRow>
                      {['QR 코드', '참여 링크', '학급 알림 발송'].map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </TagRow>
                    <RangeTxt>
                      기간 · <strong>{deployed.rangeTxt}</strong>
                    </RangeTxt>
                  </ResultInfo>
                </ResultRow>
                <ActionButton
                  type='button'
                  onClick={
                    deployed.isLive
                      ? () => {
                          if (!setId) {
                            toast.error('콘텐츠 ID가 없습니다');
                            return;
                          }
                          navigate(`/lesson/viewer/${setId}`);
                        }
                      : goToReports
                  }
                >
                  {deployed.isLive ? '수업 시작하기' : '수업 결과보기로 이동'}
                </ActionButton>
              </ResultCard>
            )}
          </SettingsPanel>
        </Inner>
      </Body>

      {!deployed && (
        <DeployFooter>
          <DeployButton type='button' onClick={() => void doDeploy()} disabled={isDeploying}>
            {isDeploying
              ? '배포 중…'
              : deployResume
                ? mode === 'live'
                  ? '다시 수업 시작하기'
                  : '다시 배포하기'
                : '배포하기'}
          </DeployButton>
        </DeployFooter>
      )}
    </Page>
  );
};

/* ==================== 레이아웃 ==================== */

const Page = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.gray[100]};
`;

const SubHeader = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 40px;
  background: ${({ theme }) => theme.colors.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[500]};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const SubHeaderTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
`;

const Body = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 24px 40px;
`;

const Inner = styled.div`
  display: flex;
  gap: 32px;
  width: 100%;
  max-width: 1024px;
`;

// 보류: mock 미존재 early return용 (추가계획9)
// const EmptyState = styled.p`
//   padding: ${({ theme }) => theme.spacing.xl};
//   color: ${({ theme }) => theme.colors.text.secondary};
//   font-size: ${({ theme }) => theme.typography.fontSize.sm};
//   text-align: center;
// `;

/* ==================== 좌: 미리보기 ==================== */

const PreviewPanel = styled.div`
  flex-shrink: 0;
  width: 288px;
`;

const PreviewCard = styled.div`
  border-radius: ${({ theme }) => theme.radius['2xl']};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.background.paper};
  padding: ${({ theme }) => theme.spacing.md};
`;

const Thumb = styled.div<{ $group: LibraryColorGroup }>`
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ $group }) => COLOR_GROUP_BG[$group]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ThumbImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbTitle = styled.p`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  margin: 0;
  padding: 0 ${({ theme }) => theme.spacing.md};
  overflow: hidden;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  text-align: center;
  text-overflow: ellipsis;
`;

const PreviewMeta = styled.div`
  margin-top: 12px;
`;

const MetaHint = styled.p`
  margin: 0 0 2px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const MetaTitle = styled.p`
  margin: 2px 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const MetaBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const MetaBadge = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

/* ==================== 우: 설정 ==================== */

const SettingsPanel = styled.div`
  flex: 1;
  min-width: 0;
`;

/* mb-5 방식으로 각 섹션이 20px 간격을 가짐 */
const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const StepBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  flex-shrink: 0;
`;

const SectionSub = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

/* 드롭다운 */

const DropWrap = styled.div`
  position: relative;
`;

const DropTrigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: ${({ theme }) => theme.colors.background.paper};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[400]};
  }
`;

const DropTriggerText = styled.span<{ $hasValue: boolean }>`
  color: ${({ theme, $hasValue }) => ($hasValue ? theme.colors.gray[800] : theme.colors.gray[400])};
`;

const DropMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: ${({ theme }) => theme.zIndex.dropdown};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.background.paper};
  padding: 6px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const DropMenuStatus = styled.p<{ $error?: boolean }>`
  margin: 0;
  padding: 8px 10px;
  color: ${({ theme, $error }) => ($error ? theme.colors.error.main : theme.colors.text.disabled)};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const DropMenuErrorWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
`;

const DropMenuRetry = styled.button`
  flex-shrink: 0;
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.primary[300]};
  background: transparent;
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`;

const DropItem = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, $selected }) => ($selected ? theme.colors.primary[50] : 'transparent')};
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary[600] : theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: left;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme, $selected }) =>
      $selected ? theme.colors.primary[50] : theme.colors.gray[50]};
  }
`;

const Checkbox = styled.span<{ $checked: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid
    ${({ theme, $checked }) => ($checked ? theme.colors.primary[600] : theme.colors.gray[300])};
  background: ${({ theme, $checked }) => ($checked ? theme.colors.primary[600] : 'transparent')};
  color: #fff;
  font-size: 10px;
  flex-shrink: 0;
`;

/* 시작 방식 */

const ModeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ModeOption = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 2px solid
    ${({ theme, $selected }) => ($selected ? theme.colors.primary[500] : theme.colors.gray[200])};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary[50] : theme.colors.background.paper};
  text-align: left;
  cursor: pointer;
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme, $selected }) =>
      $selected ? theme.colors.primary[500] : theme.colors.primary[300]};
  }
`;

const ModeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModeCheck = styled.span<{ $selected: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid
    ${({ theme, $selected }) => ($selected ? theme.colors.primary[500] : theme.colors.gray[300])};
  background: ${({ theme, $selected }) => ($selected ? theme.colors.primary[500] : 'transparent')};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  flex-shrink: 0;
`;

const ModeTitle = styled.span`
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ModeDesc = styled.span`
  display: block;
  padding-left: 28px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const DateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 28px;
  margin-top: 8px;
`;

const DateInput = styled.input`
  padding: 6px 8px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: ${({ theme }) => theme.colors.background.paper};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[400]};
  }
`;

const DateSep = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

/* 안내 박스 */

const InfoBox = styled.div`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};

  strong {
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

/* ==================== 배포하기 footer ==================== */

const DeployFooter = styled.div`
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 12px 40px;
  background: ${({ theme }) => theme.colors.background.paper};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const DeployButton = styled.button`
  min-width: 150px;
  padding: 10px 24px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/* ==================== 배포 결과 ==================== */

const ResultCard = styled.div`
  margin-top: 20px;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.background.paper};
`;

const ResultBanner = styled.div<{ $isLive: boolean }>`
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.success.light};
  color: ${({ theme }) => theme.colors.success.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ResultDesc = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};

  strong {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const ResultRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 12px;
`;

const QrWrap = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  background: #fff;
`;

const ResultInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ResultInfoTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const LinkRow = styled.div`
  display: flex;
  gap: 4px;
`;

const LinkInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const CopyButton = styled.button`
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.success.light};
  color: ${({ theme }) => theme.colors.success.dark};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const RangeTxt = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};

  strong {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const ActionButton = styled.button`
  margin-top: 16px;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;
