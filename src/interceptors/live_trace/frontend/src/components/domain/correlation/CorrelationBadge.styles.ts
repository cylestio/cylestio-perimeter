import styled, { css } from 'styled-components';

export type CorrelationState = 'VALIDATED' | 'UNEXERCISED' | 'RUNTIME_ONLY' | 'THEORETICAL';

interface BadgeProps {
  $state: CorrelationState;
}

const getStateStyles = ($state: CorrelationState) => {
  switch ($state) {
    case 'VALIDATED':
      // Red badge - active risk confirmed at runtime
      return css`
        background: rgba(255, 71, 87, 0.15);
        color: ${({ theme }) => theme.colors.severityCritical};
        border-color: ${({ theme }) => theme.colors.severityCritical};
      `;
    case 'UNEXERCISED':
      // Gray badge - test gap, never triggered
      return css`
        background: rgba(107, 114, 128, 0.12);
        color: ${({ theme }) => theme.colors.white70};
        border-color: ${({ theme }) => theme.colors.borderSubtle};
      `;
    case 'RUNTIME_ONLY':
      // Blue badge - runtime issue, different fix
      return css`
        background: rgba(0, 240, 255, 0.12);
        color: ${({ theme }) => theme.colors.cyan};
        border-color: ${({ theme }) => theme.colors.cyan};
      `;
    case 'THEORETICAL':
      // Light badge - lower priority
      return css`
        background: rgba(168, 85, 247, 0.10);
        color: ${({ theme }) => theme.colors.white50};
        border-color: ${({ theme }) => theme.colors.white30};
      `;
    default:
      return css``;
  }
};

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: 2px 8px;
  font-size: 10px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-weight: 500;
  letter-spacing: 0.02em;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid;
  white-space: nowrap;
  
  ${({ $state }) => getStateStyles($state)}
`;

export const BadgeIcon = styled.span`
  display: flex;
  align-items: center;
  font-size: 11px;
`;

export const BadgeLabel = styled.span`
  font-weight: 500;
`;

export const TooltipContent = styled.div`
  font-size: 11px;
  line-height: 1.4;
  max-width: 200px;
`;
