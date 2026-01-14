// Latest analysis summary styles
import styled, { css } from 'styled-components';

export const SummaryBar = styled.div<{ $status?: 'critical' | 'warning' | 'success' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: border-color 150ms ease, background 150ms ease;

  ${({ $status, theme }) => {
    switch ($status) {
      case 'critical':
        return css`
          border: 1px solid ${theme.colors.red}60;
          background: linear-gradient(135deg, ${theme.colors.red}15 0%, ${theme.colors.red}08 50%, ${theme.colors.surface2} 100%);
        `;
      case 'warning':
        return css`
          border: 1px solid ${theme.colors.yellow}60;
          background: linear-gradient(135deg, ${theme.colors.yellow}15 0%, ${theme.colors.yellow}08 50%, ${theme.colors.surface2} 100%);
        `;
      case 'success':
        return css`
          border: 1px solid ${theme.colors.green}60;
          background: linear-gradient(135deg, ${theme.colors.green}15 0%, ${theme.colors.green}08 50%, ${theme.colors.surface2} 100%);
        `;
      default:
        return css`
          border: 1px solid ${theme.colors.borderMedium};
          background: ${theme.colors.surface2};
        `;
    }
  }}
`;

export const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  min-width: 180px;
`;

export const StatusDot = styled.div<{ $status: 'success' | 'warning' | 'critical' }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;

  ${({ $status, theme }) => {
    switch ($status) {
      case 'critical':
        return css`
          background: ${theme.colors.red};
          box-shadow: 0 0 8px ${theme.colors.red}40;
        `;
      case 'warning':
        return css`
          background: ${theme.colors.yellow};
          box-shadow: 0 0 8px ${theme.colors.yellow}40;
        `;
      case 'success':
        return css`
          background: ${theme.colors.green};
          box-shadow: 0 0 8px ${theme.colors.green}40;
        `;
    }
  }}
`;

export const TitleText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const Title = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
`;

export const Timestamp = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const Divider = styled.div`
  width: 1px;
  height: 32px;
  background: ${({ theme }) => theme.colors.borderMedium};
`;

export const StatsSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[5]};
  flex: 1;
`;

export const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const StatValue = styled.span<{ $variant?: 'critical' | 'warning' | 'success' | 'muted' }>`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-variant-numeric: tabular-nums;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'critical':
        return css`
          color: ${theme.colors.red};
        `;
      case 'warning':
        return css`
          color: ${theme.colors.yellow};
        `;
      case 'success':
        return css`
          color: ${theme.colors.green};
        `;
      case 'muted':
        return css`
          color: ${theme.colors.white50};
        `;
      default:
        return css`
          color: ${theme.colors.white};
        `;
    }
  }}
`;

export const StatLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const FindingsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface3};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const FindingItem = styled.div<{ $variant: 'critical' | 'warning' | 'passed' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightMedium};

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'critical':
        return css`
          color: ${theme.colors.red};
        `;
      case 'warning':
        return css`
          color: ${theme.colors.yellow};
        `;
      case 'passed':
        return css`
          color: ${theme.colors.green};
        `;
    }
  }}
`;

export const FindingDot = styled.span<{ $variant: 'critical' | 'warning' | 'passed' }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'critical':
        return css`
          background: ${theme.colors.red};
        `;
      case 'warning':
        return css`
          background: ${theme.colors.yellow};
        `;
      case 'passed':
        return css`
          background: ${theme.colors.green};
        `;
    }
  }}
`;

export const ViewButton = styled.button<{ $status?: 'critical' | 'warning' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;

  ${({ $status, theme }) => {
    switch ($status) {
      case 'critical':
        return css`
          background: ${theme.colors.red};
          color: ${theme.colors.white};

          &:hover {
            background: ${theme.colors.red}dd;
            box-shadow: 0 4px 12px ${theme.colors.red}40;
          }
        `;
      case 'warning':
        return css`
          background: ${theme.colors.yellow};
          color: ${theme.colors.void};

          &:hover {
            background: ${theme.colors.yellow}dd;
            box-shadow: 0 4px 12px ${theme.colors.yellow}40;
          }
        `;
      case 'success':
        return css`
          background: ${theme.colors.green};
          color: ${theme.colors.white};

          &:hover {
            background: ${theme.colors.green}dd;
            box-shadow: 0 4px 12px ${theme.colors.green}40;
          }
        `;
      default:
        return css`
          background: ${theme.colors.cyan};
          color: ${theme.colors.white};

          &:hover {
            background: ${theme.colors.cyan}dd;
          }
        `;
    }
  }}

  svg {
    transition: transform 150ms ease;
  }

  &:hover svg {
    transform: translateX(3px);
  }
`;

export const EmptyBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.white50};
  font-size: 13px;
`;
