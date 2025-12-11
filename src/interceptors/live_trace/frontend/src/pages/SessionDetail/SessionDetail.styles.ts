import styled from 'styled-components';

export const SessionLayout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: ${({ theme }) => theme.spacing[6]};
  height: 100%;
  min-height: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

export const SessionSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  align-self: start;
`;

export const SessionMain = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  min-height: 0;
  flex: 1;
`;

export const MetricCard = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const MetricInfo = styled.div``;

export const MetricLabel = styled.h3`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white90};
  margin: 0 0 ${({ theme }) => theme.spacing[1]} 0;
`;

export const MetricSubtext = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

export const MetricValue = styled.div`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.cyan};
`;

export const TimelineContent = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

export const EmptyTimeline = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[10]};
  color: ${({ theme }) => theme.colors.white50};
  text-align: center;
`;

// Replay Panel Styles
export const ReplayPanelOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 500px;
  background: ${({ theme }) => theme.colors.surface};
  border-left: 1px solid ${({ theme }) => theme.colors.borderMedium};
  transform: ${({ $isOpen }) => ($isOpen ? 'translateX(0)' : 'translateX(100%)')};
  transition: transform ${({ theme }) => theme.transitions.base};
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const ReplayPanelHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderMedium};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ theme }) => theme.colors.surface2};
`;

export const ReplayPanelTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
`;

export const ReplayPanelClose = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.white70};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.white08};
    color: ${({ theme }) => theme.colors.white90};
  }
`;

export const ReplayPanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const FormRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};

  & > * {
    flex: 1;
  }
`;

export const FormLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white70};
`;

export const ReplayButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.purple};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.purple};
    opacity: 0.9;
    box-shadow: ${({ theme }) => theme.shadows.glowPurple};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ResponseSection = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
`;

export const ResponseMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const ResponseContent = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white90};
  white-space: pre-wrap;
  line-height: ${({ theme }) => theme.typography.lineHeightRelaxed};
`;

export const ResponseError = styled.div`
  color: ${({ theme }) => theme.colors.red};
  background: ${({ theme }) => theme.colors.redSoft};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const ResponseEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[8]};
  color: ${({ theme }) => theme.colors.white50};
  text-align: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ResponseEmptyIcon = styled.div`
  font-size: ${({ theme }) => theme.typography.text3xl};
`;
