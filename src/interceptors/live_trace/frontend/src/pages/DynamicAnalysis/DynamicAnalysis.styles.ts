import styled from 'styled-components';

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
