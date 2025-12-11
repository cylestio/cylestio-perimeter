import styled from 'styled-components';

export const DynamicAnalysisLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[6]};
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
`;

export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const PageInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const PageSubtitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const PageStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const StatBadge = styled.div<{ $variant?: 'default' | 'warning' | 'critical' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme, $variant }) =>
    $variant === 'critical' ? theme.colors.red :
    $variant === 'warning' ? theme.colors.orange :
    theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  color: ${({ theme, $variant }) =>
    $variant === 'critical' ? theme.colors.red :
    $variant === 'warning' ? theme.colors.orange :
    theme.colors.white70};
`;

export const StatValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.cyan};
`;
