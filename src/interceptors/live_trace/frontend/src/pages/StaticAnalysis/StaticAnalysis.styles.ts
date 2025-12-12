import styled from 'styled-components';

export const PageStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const StatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
`;

export const StatValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.cyan};
`;

export const SessionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const SessionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const SessionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const SessionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const SessionId = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
`;

export const SessionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const SessionMetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const EmptyContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};
`;
