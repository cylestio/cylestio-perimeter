import styled, { css } from 'styled-components';

interface SystemPromptListItemContainerProps {
  $active: boolean;
  $collapsed: boolean;
}

export const SystemPromptListItemContainer = styled.div<SystemPromptListItemContainerProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: 4px ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-decoration: none;
  color: inherit;

  ${({ $active, theme }) =>
    $active &&
    css`
      background: ${theme.colors.white15};
    `}

  &:hover {
    background: ${({ $active, theme }) =>
      $active ? 'rgba(255, 255, 255, 0.18)' : theme.colors.white08};
  }

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      justify-content: center;
      padding: 4px;
    `}
`;

export const SystemPromptInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const SystemPromptName = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white90};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

type SystemPromptStatus = 'evaluating' | 'ok' | 'requires_action';

interface StatusIconProps {
  $status: SystemPromptStatus;
}

export const StatusIcon = styled.span<StatusIconProps>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;

  svg {
    color: ${({ $status, theme }) => {
      switch ($status) {
        case 'evaluating':
          return theme.colors.orange;
        case 'requires_action':
          return theme.colors.red;
        default:
          return theme.colors.white50;
      }
    }};
  }
`;

export const SystemPromptMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  white-space: nowrap;
`;

export const SessionCount = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
  white-space: nowrap;
  flex-shrink: 0;
`;
