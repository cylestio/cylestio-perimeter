import styled, { css } from 'styled-components';

export const MetadataCard = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const MetadataDivider = styled.div`
  width: 1px;
  height: 24px;
  background: ${({ theme }) => theme.colors.borderMedium};
`;

export const StatsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface3};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const StatBadge = styled.div<{ $variant: 'critical' | 'warning' | 'passed' }>`
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

export const StatDot = styled.span<{ $variant: 'critical' | 'warning' | 'passed' }>`
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

export const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};

  svg {
    color: ${({ theme }) => theme.colors.white50};
  }
`;

export const MetadataValue = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
`;

export const TabsWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white70};
  font-size: 13px;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.white04};
    color: ${({ theme }) => theme.colors.white};
  }
`;

export const EmptyAgentState = styled.div`
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};
  font-size: 13px;
`;

export const LoaderContainer = styled.div<{ $size?: 'sm' | 'md' | 'lg' }>`
  display: flex;
  justify-content: center;
  padding: ${({ theme, $size }) =>
    $size === 'lg' ? theme.spacing[12] :
    $size === 'sm' ? theme.spacing[4] :
    theme.spacing[6]};
`;

export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.white70};
  text-align: center;
`;

export const ErrorMessage = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.red};
`;
