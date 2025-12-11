import styled from 'styled-components';

export const ExplorerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const ExplorerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const AgentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const AgentLink = styled.a`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.cyan};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover {
    color: ${({ theme }) => theme.colors.white};
    text-decoration: underline;
  }
`;

export const AgentCounter = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const LastUpdated = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
  padding-left: ${({ theme }) => theme.spacing[2]};
  border-left: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const NavigationControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const NavButton = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme, $disabled }) => $disabled ? theme.colors.white30 : theme.colors.white70};
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.surface2};
    border-color: ${({ theme }) => theme.colors.cyan};
    color: ${({ theme }) => theme.colors.cyan};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SummaryBadges = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const SummaryBadge = styled.span<{ $variant?: 'passed' | 'warning' | 'critical' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  font-size: 11px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $variant }) =>
    $variant === 'passed' ? `${theme.colors.green}15` :
    $variant === 'warning' ? `${theme.colors.orange}15` :
    $variant === 'critical' ? `${theme.colors.red}15` :
    theme.colors.surface};
  color: ${({ theme, $variant }) =>
    $variant === 'passed' ? theme.colors.green :
    $variant === 'warning' ? theme.colors.orange :
    $variant === 'critical' ? theme.colors.red :
    theme.colors.white70};
`;

export const ChecksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const CategoryCard = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

export const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const CategoryTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const CategoryCount = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const CheckList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const CheckItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const CheckInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  min-width: 0;
  flex: 1;
`;

export const CheckIcon = styled.span<{ $status: 'passed' | 'warning' | 'critical' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ theme, $status }) =>
    $status === 'passed' ? theme.colors.green :
    $status === 'warning' ? theme.colors.orange :
    theme.colors.red};
`;

export const CheckTitle = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CheckValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
  margin-left: ${({ theme }) => theme.spacing[1]};
  flex-shrink: 0;
`;

export const CheckStatusBadge = styled.span<{ $status: 'passed' | 'warning' | 'critical' }>`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => `2px ${theme.spacing[2]}`};
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: ${({ theme }) => theme.radii.sm};
  flex-shrink: 0;
  background: ${({ theme, $status }) =>
    $status === 'passed' ? `${theme.colors.green}20` :
    $status === 'warning' ? `${theme.colors.orange}20` :
    `${theme.colors.red}20`};
  color: ${({ theme, $status }) =>
    $status === 'passed' ? theme.colors.green :
    $status === 'warning' ? theme.colors.orange :
    theme.colors.red};
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};
`;
