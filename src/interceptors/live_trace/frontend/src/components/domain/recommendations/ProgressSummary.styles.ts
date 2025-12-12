import styled, { css } from 'styled-components';

interface SummaryWrapperProps {
  $status: 'BLOCKED' | 'UNBLOCKED';
}

export const SummaryWrapper = styled.div<SummaryWrapperProps>`
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ $status, theme }) =>
    $status === 'BLOCKED'
      ? `linear-gradient(135deg, ${theme.colors.redSoft} 0%, ${theme.colors.surface} 100%)`
      : `linear-gradient(135deg, ${theme.colors.greenSoft} 0%, ${theme.colors.surface} 100%)`};
  border: 1px solid ${({ $status, theme }) =>
    $status === 'BLOCKED' ? `${theme.colors.red}30` : `${theme.colors.green}30`};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const SummaryTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const IdeStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
`;

interface IdeDotProps {
  $connected: boolean;
}

export const IdeDot = styled.span<IdeDotProps>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $connected, theme }) =>
    $connected ? theme.colors.green : theme.colors.white30};
  
  ${({ $connected }) =>
    $connected &&
    css`
      animation: pulse 2s ease-in-out infinite;
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `}
`;

export const SummaryContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const ProgressMessage = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  line-height: 1.5;
`;

export const ProgressBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const ProgressBar = styled.div`
  flex: 1;
  height: 8px;
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`;

interface ProgressFillProps {
  $percent: number;
  $status: 'BLOCKED' | 'UNBLOCKED';
}

export const ProgressFill = styled.div<ProgressFillProps>`
  height: 100%;
  width: ${({ $percent }) => `${$percent}%`};
  background: ${({ $status, theme }) =>
    $status === 'BLOCKED' ? theme.colors.red : theme.colors.green};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width ${({ theme }) => theme.transitions.base};
`;

export const ProgressLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  white-space: nowrap;
`;

export const BlockingItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
  padding-top: ${({ theme }) => theme.spacing[3]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const BlockingLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const BlockingItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white};
`;

export const BlockingId = styled.code`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
  background: ${({ theme }) => theme.colors.cyanSoft};
  padding: 2px ${({ theme }) => theme.spacing[1]};
  border-radius: ${({ theme }) => theme.radii.xs};
`;

interface SeverityDotProps {
  $severity: string;
}

export const SeverityDot = styled.span<SeverityDotProps>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL':
        return theme.colors.red;
      case 'HIGH':
        return theme.colors.orange;
      default:
        return theme.colors.yellow;
    }
  }};
`;

