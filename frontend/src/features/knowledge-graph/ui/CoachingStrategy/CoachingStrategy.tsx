import { useState } from 'react';
import { X } from 'lucide-react';
import type { ModerationPath } from '@shared/services/dashboardService';
import * as S from './CoachingStrategy.styles';

interface CoachingStrategyProps {
  moderationPaths: ModerationPath[];
  typeName: string;
  typeColor?: string;
  typeDescription?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 지식그래프 기반 코칭 전략 모달
 * Backend Neo4j에서 제공한 5개 추천 경로를 표시
 */
export const CoachingStrategy = ({
  moderationPaths,
  typeName,
  typeColor = '#8b5cf6',
  typeDescription = '',
  isOpen,
  onClose,
}: CoachingStrategyProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedPath = moderationPaths[selectedIndex] || null;

  if (!isOpen) return null;

  return (
    <S.Overlay onClick={onClose}>
      <S.Modal onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <S.Header>
          <S.Title>코칭 전략</S.Title>
          <S.CloseButton onClick={onClose} aria-label='닫기'>
            <X size={20} />
          </S.CloseButton>
        </S.Header>

        {/* 유형 정보 */}
        <S.TypeSection>
          <S.TypeBadge style={{ backgroundColor: typeColor }}>{typeName}</S.TypeBadge>
          {typeDescription && (
            <>
              <S.Divider />
              <S.TypeDescription>{typeDescription}</S.TypeDescription>
            </>
          )}
        </S.TypeSection>

        {/* 본문: 좌측 리스트 + 우측 상세 */}
        <S.Content>
          {/* 좌측 패널: 경로 리스트 */}
          <S.LeftPanel>
            <S.ListHeader>
              <S.ListTitle>추천 코칭 경로</S.ListTitle>
              <S.CountBadge>{moderationPaths.length}개</S.CountBadge>
            </S.ListHeader>

            <S.PathList>
              {moderationPaths.length === 0 ? (
                <S.EmptyMessage>추천 경로가 없습니다.</S.EmptyMessage>
              ) : (
                moderationPaths.map((path, idx) => (
                  <S.PathItem
                    key={path.id}
                    $isSelected={idx === selectedIndex}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    {idx === selectedIndex && <S.AccentBar />}

                    {/* 순번 + 경로 공식 */}
                    <S.PathHeader>
                      <S.PathNumber>#{idx + 1}</S.PathNumber>
                      <S.PathFormula>
                        <S.FactorName>{path.x}</S.FactorName>
                        {path.z && (
                          <>
                            {' × '}
                            <S.FactorName>{path.z}</S.FactorName>
                          </>
                        )}
                        {path.y && (
                          <>
                            {' → '}
                            <S.OutcomeName>{path.y}</S.OutcomeName>
                          </>
                        )}
                      </S.PathFormula>
                    </S.PathHeader>

                    {/* 효과 유형 */}
                    {path.pathType && <S.PathTypeBadge>{path.pathType}</S.PathTypeBadge>}
                  </S.PathItem>
                ))
              )}
            </S.PathList>
          </S.LeftPanel>

          {/* 우측 패널: 상세 정보 */}
          <S.RightPanel>
            {selectedPath ? (
              <S.DetailContent>
                {/* 헤더: 경로 번호 + 효과 유형 */}
                <S.DetailHeader>
                  <S.DetailBadge>경로 {selectedIndex + 1}</S.DetailBadge>
                  {selectedPath.pathType && <S.PathTypeTag>{selectedPath.pathType}</S.PathTypeTag>}
                </S.DetailHeader>

                {/* 경로 공식 (큰 글씨) */}
                <S.DetailFormula>
                  <span>{selectedPath.x}</span>
                  {selectedPath.z && (
                    <>
                      {' × '}
                      <span>{selectedPath.z}</span>
                    </>
                  )}
                  {selectedPath.y && (
                    <>
                      {' → '}
                      <S.DetailOutcome>{selectedPath.y}</S.DetailOutcome>
                    </>
                  )}
                </S.DetailFormula>

                {/* 해석 (있는 경우) */}
                {selectedPath.interpretation && (
                  <S.Section>
                    <S.SectionTitle>왜 이 경로가 중요한가요?</S.SectionTitle>
                    <S.InterpretationBox>{selectedPath.interpretation}</S.InterpretationBox>
                  </S.Section>
                )}

                {/* 실행 전략 */}
                <S.Section>
                  <S.SectionTitle>구체적 실행 전략</S.SectionTitle>
                  <S.StrategyBox>
                    {selectedPath.strategy.split(/(?<=\.) /).map((sentence, i) => (
                      <S.StrategyParagraph key={i}>{sentence}</S.StrategyParagraph>
                    ))}
                  </S.StrategyBox>
                </S.Section>
              </S.DetailContent>
            ) : (
              <S.EmptyDetail>좌측에서 경로를 선택해주세요.</S.EmptyDetail>
            )}
          </S.RightPanel>
        </S.Content>
      </S.Modal>
    </S.Overlay>
  );
};
