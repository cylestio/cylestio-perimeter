import styled, { css } from 'styled-components';

export const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const ProgressDots = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

type DotStatus = 'PASS' | 'FAIL' | 'INFO';

const dotStatusStyles: Record<DotStatus, ReturnType<typeof css>> = {
  PASS: css`
    background: ${({ theme }) => theme.colors.green};
    box-shadow: 0 0 6px ${({ theme }) => theme.colors.green};
  `,
  FAIL: css`
    background: ${({ theme }) => theme.colors.red};
    box-shadow: 0 0 6px ${({ theme }) => theme.colors.red};
  `,
  INFO: css`
    background: ${({ theme }) => theme.colors.yellow};
    box-shadow: 0 0 4px ${({ theme }) => theme.colors.yellow};
  `,
};

interface ProgressDotProps {
  $status: DotStatus;
}

export const ProgressDot = styled.span<ProgressDotProps>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all ${({ theme }) => theme.transitions.base};

  ${({ $status }) => dotStatusStyles[$status]}
`;

interface ProgressLabelProps {
  $blocked: boolean;
}

export const ProgressLabel = styled.span<ProgressLabelProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: 600;

  ${({ $blocked, theme }) =>
    $blocked
      ? css`
          color: ${theme.colors.red};
        `
      : css`
          color: ${theme.colors.green};
        `}
`;

export const LockIcon = styled.span`
  font-size: 14px;
`;

export const ProgressStats = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  margin-left: ${({ theme }) => theme.spacing[2]};
`;
