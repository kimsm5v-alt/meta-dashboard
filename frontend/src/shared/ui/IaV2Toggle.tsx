/**
 * 개발/스테이징 전용 IA_V2 온오프 토글.
 * 기획자가 배포된 개발서버에서 코드 수정 없이 v2 개편 화면을 켜고 끄며 검수할 수 있게 한다.
 * 클릭 시 localStorage 오버라이드를 쓰고 `/dashboard`로 이동해 반영한다(9곳에서 FEATURES.IA_V2를
 * 읽는 코드를 전부 리액티브하게 바꾸는 대신, 새 로드로 features.ts가 오버라이드를 다시 읽게 함).
 * 같은 URL에서 그대로 새로고침하지 않는 이유: v1/v2는 라우트 구조가 서로 다르다
 * (예: `/exam/management`는 IA_V2 전용 라우트라 꺼지면 사라지고, 공개 라우트 `/exam/:code`가
 * 대신 매칭되어 "management"를 검사 코드로 오인해 에러가 남). `/dashboard`는 두 모드 모두에서
 * 안전하게 존재하며 내부적으로 플래그 값에 따라 `/home` 또는 `/dashboard/comprehensive`로
 * 자동 분기되므로, 토글 후 항상 이 경로를 거쳐가게 한다.
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
    window.location.href = '/dashboard';
  };

  return (
    <Toggle
      type='button'
      $on={isOn}
      onClick={handleToggle}
      title='IA_V2 (개발용, 클릭 시 대시보드로 이동)'
      aria-label={`IA V2 ${isOn ? '끄기' : '켜기'}`}
    >
      <Dot $on={isOn} />
      V2 {isOn ? 'ON' : 'OFF'}
    </Toggle>
  );
};
