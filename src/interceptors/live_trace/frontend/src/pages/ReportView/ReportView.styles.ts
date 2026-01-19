import styled from 'styled-components';

export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

export const ErrorContainer = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.red};
`;

export const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: 0;
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.white50};
  font-size: 13px;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.white};
  }
`;
