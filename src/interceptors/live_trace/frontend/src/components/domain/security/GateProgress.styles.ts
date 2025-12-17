import styled, { css, keyframes } from 'styled-components';
import type { CheckStatus } from '@api/types/findings';

export const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const ProgressDots = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

interface DotProps {
  $status: CheckStatus;
}

const getDotColor = ($status: CheckStatus) => {
  switch ($status) {
    case 'PASS':
      return css`
        background: ${({ theme }) => theme.colors.green};
        box-shadow: 0 0 8px ${({ theme }) => theme.colors.greenSoft};
      `;
    case 'FAIL':
      return css`
        background: ${({ theme }) => theme.colors.red};
        box-shadow: 0 0 8px ${({ theme }) => theme.colors.redSoft};
      `;
    case 'INFO':
      return css`
        background: ${({ theme }) => theme.colors.yellow};
        box-shadow: 0 0 8px ${({ theme }) => theme.colors.yellowSoft};
      `;
    default:
      return css`
        background: ${({ theme }) => theme.colors.white30};
      `;
  }
};

export const ProgressDot = styled.div<DotProps>`
  width: 10px;
  height: 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  transition: all ${({ theme }) => theme.transitions.base};
  
  ${({ $status }) => getDotColor($status)}
`;

interface LabelProps {
  $blocked: boolean;
}

const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

export const ProgressLabel = styled.div<LabelProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 12px;
  font-weight: 600;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  
  ${({ $blocked, theme }) => $blocked
    ? css`
        color: ${theme.colors.red};
        background: ${theme.colors.redSoft};
        animation: ${pulseAnimation} 2s ease-in-out infinite;
      `
    : css`
        color: ${theme.colors.green};
        background: ${theme.colors.greenSoft};
      `
  }
`;

export const ProgressStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const StatItem = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const StatCount = styled.span<{ $color?: 'green' | 'red' | 'yellow' }>`
  font-weight: 600;
  color: ${({ theme, $color }) => {
    switch ($color) {
      case 'green': return theme.colors.green;
      case 'red': return theme.colors.red;
      case 'yellow': return theme.colors.yellow;
      default: return theme.colors.white70;
    }
  }};
`;
