import styled, { css } from 'styled-components';

// ============ Main Split Container ============
export const SplitContainer = styled.div<{ $standalone?: boolean }>`
  display: flex;
  width: 100%;
  min-height: 400px;
  background: ${({ theme }) => theme.colors.surface};
  ${({ $standalone, theme }) =>
    $standalone &&
    `
    border: 1px solid ${theme.colors.borderMedium};
    border-radius: ${theme.radii.xl};
    overflow: hidden;
    margin-bottom: ${theme.spacing[4]};
  `}
`;

// ============ Left Panel (Integration Cards) ============
export const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  min-width: 300px;
  background: ${({ theme }) => theme.colors.surface2};
  border-right: 1px solid ${({ theme }) => theme.colors.borderMedium};
  padding: ${({ theme }) => theme.spacing[5]};
`;

export const LeftPanelHeader = styled.h3`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

export const IntegrationCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const IntegrationCard = styled.button<{ $active: boolean; $connected?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ $active, $connected, theme }) =>
    $connected
      ? `${theme.colors.green}60`
      : $active
        ? theme.colors.cyan
        : theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $active, theme }) =>
    $active ? `${theme.colors.cyan}08` : 'transparent'};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  text-align: left;

  &:hover {
    border-color: ${({ $active, $connected, theme }) =>
      $connected
        ? `${theme.colors.green}80`
        : $active
          ? theme.colors.cyan
          : theme.colors.white30};
    background: ${({ $active, theme }) =>
      $active ? `${theme.colors.cyan}08` : theme.colors.surface3};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const CardIcon = styled.span<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.cyan : theme.colors.white50};
`;

export const CardTitle = styled.span<{ $active?: boolean }>`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.cyan : theme.colors.white};
`;

export const CardBadge = styled.span<{ $variant: 'full' | 'basic' | 'connected' }>`
  margin-left: auto;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'connected':
        return css`
          background: ${theme.colors.greenSoft};
          color: ${theme.colors.green};
        `;
      case 'full':
        return css`
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
        `;
      case 'basic':
        return css`
          background: ${theme.colors.white08};
          color: ${theme.colors.white50};
        `;
    }
  }}
`;

export const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

export const FeatureItem = styled.span<{ $available: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 12px;
  color: ${({ $available, theme }) =>
    $available ? theme.colors.white70 : theme.colors.white30};
`;

export const FeatureIcon = styled.span<{ $available: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $available, theme }) =>
    $available ? theme.colors.green : theme.colors.white30};
`;

// ============ Right Panel (Instructions) ============
export const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: ${({ theme }) => theme.spacing[6]};
  overflow-y: auto;
`;

export const RightPanelHeader = styled.h2`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

export const RightPanelDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0 0 ${({ theme }) => theme.spacing[5]} 0;
  line-height: 1.5;
`;

export const InstructionSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const InstructionLabel = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;

  code {
    background: ${({ theme }) => theme.colors.void};
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radii.sm};
    font-family: ${({ theme }) => theme.typography.fontMono};
    color: ${({ theme }) => theme.colors.cyan};
  }
`;

export const CommandBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
`;

export const CommandNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.cyan}20;
  color: ${({ theme }) => theme.colors.cyan};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  flex-shrink: 0;
`;

export const CommandText = styled.code`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
  word-break: break-all;
  line-height: 1.4;
`;

export const CodeBlock = styled.pre`
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[4]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
  overflow-x: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
`;

// ============ Warning Note ============
export const WarningNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.orangeSoft};
  border: 1px solid ${({ theme }) => theme.colors.orange}40;
  border-radius: ${({ theme }) => theme.radii.md};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

export const WarningIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.orange};
  flex-shrink: 0;
`;

export const WarningText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0;
  line-height: 1.5;
`;

// ============ Collapsible Section ============
export const CollapsibleSection = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const CollapsibleHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface2};
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderMedium};
  cursor: pointer;
  transition: all 0.15s ease;

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
  color: ${({ theme }) => theme.colors.white70};
`;

export const CollapsibleIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white50};
`;

export const CollapsibleContent = styled.div<{ $expanded: boolean }>`
  display: ${({ $expanded }) => ($expanded ? 'block' : 'none')};
`;
