import styled, { css } from 'styled-components';
import type { StageStatus } from './LifecycleProgress';

export const ProgressContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[4]} ${theme.spacing[5]}`};
`;

export const StageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex: 1;
`;

interface StageIconProps {
  $status: StageStatus;
}

export const StageIcon = styled.div<StageIconProps>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: 2px solid ${({ theme }) => theme.colors.borderMedium};
  background: ${({ theme }) => theme.colors.surface2};
  transition: all ${({ theme }) => theme.transitions.base};

  ${({ $status, theme }) =>
    $status === 'running' &&
    css`
      border-color: ${theme.colors.white50};
      background: ${theme.colors.white08};
      color: ${theme.colors.white50};
    `}

  ${({ $status, theme }) =>
    $status === 'ok' &&
    css`
      border-color: ${theme.colors.green};
      background: ${theme.colors.greenSoft};
      color: ${theme.colors.green};
    `}

  ${({ $status, theme }) =>
    $status === 'warning' &&
    css`
      border-color: ${theme.colors.orange};
      background: ${theme.colors.orangeSoft};
      color: ${theme.colors.orange};
    `}

  ${({ $status, theme }) =>
    $status === 'critical' &&
    css`
      border-color: ${theme.colors.red};
      background: ${theme.colors.redSoft};
      color: ${theme.colors.red};
    `}
`;

interface StageLabelProps {
  $status: StageStatus;
}

export const StageLabel = styled.div<StageLabelProps>`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white30};
  text-align: center;

  ${({ $status, theme }) =>
    $status === 'running' &&
    css`
      color: ${theme.colors.white50};
    `}

  ${({ $status, theme }) =>
    $status === 'ok' &&
    css`
      color: ${theme.colors.green};
    `}

  ${({ $status, theme }) =>
    $status === 'warning' &&
    css`
      color: ${theme.colors.orange};
    `}

  ${({ $status, theme }) =>
    $status === 'critical' &&
    css`
      color: ${theme.colors.red};
    `}
`;

interface StageStatProps {
  $status: StageStatus;
}

export const StageStat = styled.div<StageStatProps>`
  font-size: 12px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};

  ${({ $status, theme }) =>
    $status === 'ok' &&
    css`
      color: ${theme.colors.green};
    `}

  ${({ $status, theme }) =>
    $status === 'running' &&
    css`
      color: ${theme.colors.white50};
    `}

  ${({ $status, theme }) =>
    $status === 'warning' &&
    css`
      color: ${theme.colors.orange};
    `}

  ${({ $status, theme }) =>
    $status === 'critical' &&
    css`
      color: ${theme.colors.red};
    `}
`;

interface ConnectorProps {
  $status: StageStatus;
}

export const Connector = styled.div<ConnectorProps>`
  flex: 0 0 40px;
  height: 2px;
  background: ${({ theme }) => theme.colors.borderMedium};
  align-self: center;
  margin-top: -24px;

  ${({ $status, theme }) =>
    $status === 'ok' &&
    css`
      background: ${theme.colors.green};
    `}

  ${({ $status, theme }) =>
    $status === 'warning' &&
    css`
      background: ${theme.colors.orange};
    `}

  ${({ $status, theme }) =>
    $status === 'critical' &&
    css`
      background: ${theme.colors.red};
    `}
`;
