import styled, { css } from 'styled-components';

export const SessionIdCell = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
`;

export const MetaCell = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const SeverityCell = styled.span<{ $variant: 'critical' | 'warning' | 'passed' | 'muted' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 12px;
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
      case 'muted':
        return css`
          color: ${theme.colors.white30};
        `;
    }
  }}
`;

export const EmptyStateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};

  p {
    margin: 0;
  }

  p:last-child {
    font-size: 12px;
    margin-top: ${({ theme }) => theme.spacing[2]};
  }
`;
