import styled, { css, keyframes } from 'styled-components';

// ============ Status Banner (Full Width, Top) ============
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export const StatusBanner = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  background: ${({ $connected, theme }) =>
    $connected
      ? `linear-gradient(135deg, ${theme.colors.greenSoft} 0%, ${theme.colors.surface} 100%)`
      : theme.colors.surface};
  border: 1px solid ${({ $connected, theme }) =>
    $connected ? `${theme.colors.green}40` : theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

export const StatusIconWrapper = styled.div<{ $connected: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $connected, theme }) =>
    $connected ? theme.colors.greenSoft : theme.colors.surface2};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $connected, theme }) =>
    $connected ? theme.colors.green : theme.colors.cyan};
  flex-shrink: 0;
`;

export const StatusContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const StatusTitle = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const StatusDetails = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const StatusDetail = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const LiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.orangeSoft};
  border: 1px solid ${({ theme }) => theme.colors.orange}60;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.orange};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: ${pulse} 2s ease-in-out infinite;
`;

export const LiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.orange};
`;

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

// ============ Feature Comparison Card ============
export const FeatureCardWrapper = styled.div<{ $noMargin?: boolean }>`
  ${({ $noMargin, theme }) => !$noMargin && `margin-top: ${theme.spacing[6]};`}
`;

export const FeatureTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const TableHead = styled.thead`
  background: ${({ theme }) => theme.colors.surface2};
`;

export const TableRow = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  }
`;

export const TableHeader = styled.th`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  font-size: 12px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white70};
  text-align: left;

  &:first-child {
    width: 50%;
  }

  &:not(:first-child) {
    text-align: center;
    width: 16.66%;
  }
`;

export const TableCell = styled.td`
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  vertical-align: top;

  &:not(:first-child) {
    text-align: center;
    vertical-align: middle;
  }
`;

export const FeatureName = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const FeatureDescription = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  line-height: 1.4;
`;

export const CheckIcon = styled.span<{ $available: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $available, theme }) =>
    $available ? theme.colors.green : theme.colors.white30};
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

// ============ Success Content (Connected State) ============
export const SuccessContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

export const SuccessHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const SuccessTitle = styled.h2`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const ConnectionDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const DetailLabel = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const DetailValue = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white};
  word-break: break-all;
`;

export const ActionButton = styled.div`
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

// ============ Collapsible Section ============
export const CollapsibleSection = styled.div<{ $collapsed?: boolean }>`
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
