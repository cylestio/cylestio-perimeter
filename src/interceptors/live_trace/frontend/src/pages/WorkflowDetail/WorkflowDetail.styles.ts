import styled from 'styled-components';

export const WorkflowLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[6]};
  padding: ${({ theme }) => theme.spacing[6]};
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
`;

export const WorkflowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const WorkflowInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const WorkflowName = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const WorkflowId = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const WorkflowStats = styled.div`
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

export const SectionCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderMedium};
`;

export const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const SectionContent = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

export const AgentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const AgentListItem = styled.a`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.cyan};
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const AgentIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.cyan};
`;

export const AgentInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const AgentIdText = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
`;

export const AgentMeta = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
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

// Analysis Sessions styles
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

// Lifecycle State Banner styles
export const LifecycleBanner = styled.div<{ $state: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme, $state }) => {
    switch ($state) {
      case 'COMPLETE': return theme.colors.green + '15';
      case 'STATIC_ONLY': 
      case 'DYNAMIC_ONLY': return theme.colors.yellow + '15';
      default: return theme.colors.cyan + '15';
    }
  }};
  border: 1px solid ${({ theme, $state }) => {
    switch ($state) {
      case 'COMPLETE': return theme.colors.green + '40';
      case 'STATIC_ONLY':
      case 'DYNAMIC_ONLY': return theme.colors.yellow + '40';
      default: return theme.colors.cyan + '40';
    }
  }};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const LifecycleIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const LifecycleContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const LifecycleTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
`;

export const LifecycleMessage = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
`;

export const LifecycleStages = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

export const LifecycleStage = styled.div<{ $active: boolean; $complete: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  background: ${({ theme, $complete }) => $complete ? theme.colors.green + '20' : theme.colors.surface};
  border: 1px solid ${({ theme, $active, $complete }) => 
    $complete ? theme.colors.green + '60' : 
    $active ? theme.colors.cyan : 
    theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 11px;
  color: ${({ theme, $complete }) => $complete ? theme.colors.green : theme.colors.white70};
`;

export const StageArrow = styled.span`
  color: ${({ theme }) => theme.colors.white30};
  font-size: 12px;
`;
