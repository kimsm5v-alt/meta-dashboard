/**
 * 개발/스테이징 전용 IA_V2 온오프 토글.
 * 기획자가 배포된 개발서버에서 코드 수정 없이 v2 개편 화면을 켜고 끄며 검수할 수 있게 한다.
 * 클릭 시 localStorage 오버라이드를 쓰고 즉시 새로고침해 반영한다(9곳에서 FEATURES.IA_V2를
 * 읽는 코드를 전부 리액티브하게 바꾸는 대신, 새로고침으로 features.ts가 오버라이드를 다시 읽게 함).
 */

import styled from '@emotion/styled';
import { FEATURES, IA_V2_OVERRIDE_KEY } from '@shared/config/features';

const Toggle = styled.button<{ $on: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid
    ${({ theme, $on }) => ($on ? theme.colors.primary[300] : theme.colors.gray[300])};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $on }) => ($on ? theme.colors.primary[50] : theme.colors.gray[50])};
  color: ${({ theme, $on }) => ($on ? theme.colors.primary[700] : theme.colors.gray[500])};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme, $on }) => ($on ? theme.colors.primary[400] : theme.colors.gray[400])};
  }
`;

const Dot = styled.span<{ $on: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme, $on }) => ($on ? theme.colors.success.main : theme.colors.gray[400])};
`;

export const IaV2Toggle = () => {
  const isOn = FEATURES.IA_V2;

  const handleToggle = () => {
    window.localStorage.setItem(IA_V2_OVERRIDE_KEY, String(!isOn));
    window.location.reload();
  };

  return (
    <Toggle
      type='button'
      $on={isOn}
      onClick={handleToggle}
      title='IA_V2 (개발용, 클릭 시 새로고침)'
      aria-label={`IA V2 ${isOn ? '끄기' : '켜기'}`}
    >
      <Dot $on={isOn} />
      V2 {isOn ? 'ON' : 'OFF'}
    </Toggle>
  );
};
