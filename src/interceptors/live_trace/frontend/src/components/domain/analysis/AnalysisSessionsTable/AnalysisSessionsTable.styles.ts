import styled from 'styled-components';

export const AgentLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.cyan};
  text-decoration: none;
  padding: ${({ theme }) => `2px ${theme.spacing[2]}`};
  background: ${({ theme }) => `${theme.colors.cyan}10`};
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    background: ${({ theme }) => `${theme.colors.cyan}20`};
    color: ${({ theme }) => theme.colors.white};
  }
`;

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
