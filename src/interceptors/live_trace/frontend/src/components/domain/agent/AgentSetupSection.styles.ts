import styled from 'styled-components';

// ============ Main Container ============
export const Container = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
`;

// ============ Header Section ============
export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const HeaderTitle = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const StatusIndicator = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 12px;
  font-weight: 500;
  background: ${({ $connected, theme }) =>
    $connected ? theme.colors.greenSoft : theme.colors.surface3};
  color: ${({ $connected, theme }) =>
    $connected ? theme.colors.green : theme.colors.white70};
`;

export const StatusDot = styled.div<{ $connected: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $connected, theme }) =>
    $connected ? theme.colors.green : theme.colors.white50};
`;

// ============ Body Section ============
export const Body = styled.div`
  padding: ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[6]};
`;

export const Description = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.6;
  margin: 0 0 ${({ theme }) => theme.spacing[5]} 0;
`;

// ============ Mode Selection ============
export const ModeSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const ModeLabel = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

export const ModeOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const ModeCard = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.cyan : theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $active, theme }) =>
    $active ? `${theme.colors.cyan}08` : 'transparent'};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  text-align: left;

  &:hover {
    border-color: ${({ $active, theme }) =>
      $active ? theme.colors.cyan : theme.colors.white30};
    background: ${({ $active, theme }) =>
      $active ? `${theme.colors.cyan}08` : theme.colors.surface3};
  }
`;

export const ModeRadio = styled.div<{ $active: boolean }>`
  width: 16px;
  height: 16px;
  min-width: 16px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 2px solid ${({ $active, theme }) =>
    $active ? theme.colors.cyan : theme.colors.white30};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;

  &::after {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: ${({ theme }) => theme.radii.full};
    background: ${({ $active, theme }) =>
      $active ? theme.colors.cyan : 'transparent'};
  }
`;

export const ModeContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ModeTitle = styled.span<{ $active?: boolean }>`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.cyan : theme.colors.white};
`;

export const ModeDesc = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
  line-height: 1.4;
`;

// ============ URL Section ============
export const UrlSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const UrlLabel = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

export const UrlBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
`;

export const UrlText = styled.div`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const WorkflowInput = styled.input`
  display: inline;
  width: 14ch;
  padding: 2px 4px;
  background: transparent;
  border: none;
  color: inherit;
  font-family: inherit;
  font-size: inherit;

  &::placeholder {
    color: ${({ theme }) => theme.colors.white50};
  }

  &:focus {
    outline: none;
  }
`;

// ============ Example Section ============
export const ExampleSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const ExampleBox = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
  overflow-x: auto;
`;

// ============ Config Section ============
export const ConfigSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const ConfigItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white30};
`;

export const ConfigLabel = styled.span`
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const ConfigValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
`;

// ============ Collapsible Section ============
export const CollapsibleSection = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

export const CollapsibleHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[4]} ${theme.spacing[5]}`};
  background: ${({ theme }) => theme.colors.surface2};
  border: none;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.base};

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
  }
`;

export const CollapsibleTitle = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 14px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
`;

export const CollapsibleIcon = styled.span`
  color: ${({ theme }) => theme.colors.white50};
`;

export const CollapsibleContent = styled.div<{ $expanded: boolean }>`
  display: ${({ $expanded }) => ($expanded ? 'block' : 'none')};
`;

// ============ Waiting State ============
export const WaitingSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[6]} 0;
`;

export const WaitingText = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
`;
