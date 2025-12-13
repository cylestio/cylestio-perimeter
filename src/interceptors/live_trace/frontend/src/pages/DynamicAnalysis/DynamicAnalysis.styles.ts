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

// Centered loading container
export const LoaderContainer = styled.div<{ $size?: 'sm' | 'md' | 'lg' }>`
  display: flex;
  justify-content: center;
  padding: ${({ theme, $size }) =>
    $size === 'lg' ? theme.spacing[12] :
    $size === 'sm' ? theme.spacing[4] :
    theme.spacing[6]};
`;

// Phase 4.5: Analysis Status Card
export const AnalysisStatusCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const AnalysisStatusInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const AnalysisStatusTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
`;

export const AnalysisStatusSubtitle = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const RunAnalysisButton = styled.button<{ $loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  background: ${({ theme, $loading }) => $loading ? theme.colors.surface : theme.colors.cyan};
  color: ${({ theme, $loading }) => $loading ? theme.colors.cyan : theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.cyan};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 500;
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  transition: all 0.15s ease;
  
  &:hover:not(:disabled) {
    background: ${({ theme, $loading }) => $loading ? theme.colors.surface : theme.colors.cyan};
    filter: brightness(1.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    animation: ${({ $loading }) => $loading ? 'spin 1s linear infinite' : 'none'};
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export const SessionsBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.cyan}20;
  color: ${({ theme }) => theme.colors.cyan};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-weight: 600;
`;

// Spinning loader icon for analysis in progress
export const SpinningLoader = styled.span`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.cyan};
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  svg {
    animation: spin 1s linear infinite;
  }
`;
