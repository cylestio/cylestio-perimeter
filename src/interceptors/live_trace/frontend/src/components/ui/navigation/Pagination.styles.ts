import styled from 'styled-components';

export const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderMedium};
`;

export const PaginationButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  color: ${({ theme }) => theme.colors.white70};
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.cyan};
    border-color: ${({ theme }) => theme.colors.cyan};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: 2px;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const PageInfo = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
  min-width: 100px;
  text-align: center;
`;

