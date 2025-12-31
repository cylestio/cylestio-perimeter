import styled from 'styled-components';

import { orbSpin } from '@theme/animations';
import { Page } from '@ui/layout/Page';

// ============ Page Layout ============
export const ConnectPage = styled(Page)`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const SplitContainer = styled.div`
  display: flex;
  width: 100%;
  max-width: 900px;
  min-height: 550px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
`;

// ============ Left Panel ============
export const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  min-width: 300px;
  background: ${({ theme }) => theme.colors.surface2};
  border-right: 1px solid ${({ theme }) => theme.colors.borderMedium};
`;

export const StatusSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[8]};
  padding: ${({ theme }) => theme.spacing[8]};
  flex: 1;
  text-align: center;
`;

export const StatusText = styled.p`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ theme }) => theme.colors.white70};
  margin: 0;
`;

// ============ Status Link (Clickable text) ============
export const StatusLink = styled.button<{ $active?: boolean }>`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.cyan : theme.colors.white70};
  background: none;
  border: none;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.base};

  &:hover {
    color: ${({ theme }) => theme.colors.cyan};
  }
`;

// ============ Status Orb (Large Logo) ============
export const StatusOrb = styled.div`
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: conic-gradient(
    from 0deg,
    ${({ theme }) => theme.colors.cyan},
    ${({ theme }) => theme.colors.green},
    ${({ theme }) => theme.colors.cyan}
  );
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${orbSpin} 8s linear infinite;
  filter: drop-shadow(0 0 12px rgba(0, 240, 255, 0.5))
    drop-shadow(0 0 24px rgba(0, 255, 136, 0.3));
`;

export const StatusOrbInner = styled.div`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.surface2};
`;

// ============ Right Panel Success State ============
export const SuccessContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  gap: ${({ theme }) => theme.spacing[6]};
`;

export const SuccessTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const SuccessSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.textMd};
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
  max-width: 300px;
`;

export const SuccessStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[8]};
`;

export const SuccessStat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const SuccessStatValue = styled.span`
  font-size: ${({ theme }) => theme.typography.text3xl};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.cyan};
`;

export const SuccessStatLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// ============ Menu Section ============
export const MenuSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderMedium};
`;

export const MenuItem = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[4]};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.base};
  text-align: left;

  ${({ $active, theme }) =>
    $active
      ? `
    background: ${theme.colors.surface4};
    border-color: ${theme.colors.cyan}40;
  `
      : `
    background: transparent;
    &:hover {
      background: ${theme.colors.surface3};
      border-color: ${theme.colors.borderMedium};
    }
  `}
`;

export const MenuItemTitle = styled.span<{ $active?: boolean }>`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.cyan : theme.colors.white};
`;

export const MenuItemDesc = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  line-height: 1.4;
`;

// ============ Right Panel ============
export const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: ${({ theme }) => theme.spacing[8]};
  overflow-y: auto;
`;

export const RightPanelHeader = styled.h2`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[6]} 0;
`;

// ============ URL Copy Section ============
export const UrlSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

export const UrlBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

export const UrlText = styled.div`
  flex: 1;
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
`;

// ============ Config Details (Subtle, bottom) ============
export const ConfigSection = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing[6]};
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

// ============ Workflow Mode Selector ============
export const WorkflowModeSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

export const WorkflowModeHeader = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
`;

export const WorkflowModeOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const WorkflowModeCard = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
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
      $active ? `${theme.colors.cyan}08` : theme.colors.surface2};
  }
`;

export const WorkflowModeRadio = styled.div<{ $active: boolean }>`
  width: 18px;
  height: 18px;
  min-width: 18px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 2px solid ${({ $active, theme }) =>
    $active ? theme.colors.cyan : theme.colors.white30};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;

  &::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: ${({ theme }) => theme.radii.full};
    background: ${({ $active, theme }) =>
      $active ? theme.colors.cyan : 'transparent'};
  }
`;

export const WorkflowModeContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const WorkflowModeTitle = styled.span<{ $active?: boolean }>`
  font-size: 14px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.cyan : theme.colors.white};
`;

export const WorkflowModeDesc = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  line-height: 1.4;
`;

export const WorkflowNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.cyanSoft};
  border: 1px solid ${({ theme }) => theme.colors.cyan}30;
  border-radius: ${({ theme }) => theme.radii.md};
  margin-top: ${({ theme }) => theme.spacing[4]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.5;
`;

export const WorkflowInput = styled.input`
  display: inline;
  width: 16ch;
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

// ============ Connect Wrapper (for docs below) ============
export const ConnectWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

// ============ Documentation Link (below container) ============
export const DocsLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white30};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.base};

  &:hover {
    color: ${({ theme }) => theme.colors.cyan};
  }
`;
