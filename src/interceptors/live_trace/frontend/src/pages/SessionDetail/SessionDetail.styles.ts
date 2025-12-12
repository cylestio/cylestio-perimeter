import styled from 'styled-components';

export const SessionLayout = styled.div`
  display: grid;
  grid-template-columns: 310px 1fr;
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

// Replay Panel Form Styles
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

// Response metadata badges container
export const ResponseMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
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

// Replay Panel Additional Styles
export const ReplayPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const ProviderBadge = styled.span<{ $provider: 'openai' | 'anthropic' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  background: ${({ $provider, theme }) =>
    $provider === 'openai' ? theme.colors.greenSoft : theme.colors.orangeSoft};
  color: ${({ $provider, theme }) =>
    $provider === 'openai' ? theme.colors.green : theme.colors.orange};
`;

export const ToggleToolsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white70};
  font-size: ${({ theme }) => theme.typography.textSm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface4};
    color: ${({ theme }) => theme.colors.white90};
    border-color: ${({ theme }) => theme.colors.borderMedium};
  }
`;

export const ApiKeyWarning = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.orange};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

// API Key compact display styles
export const ApiKeyInfo = styled.span`
  color: ${({ theme }) => theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightNormal};
  margin-left: ${({ theme }) => theme.spacing[2]};
`;

export const ApiKeyButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ApiKeyActionButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  color: ${({ theme }) => theme.colors.white70};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.typography.textXs};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.cyan};
    color: ${({ theme }) => theme.colors.white90};
  }
`;

export const ApiKeySaveButton = styled.button`
  background: ${({ theme }) => theme.colors.purple};
  border: 1px solid ${({ theme }) => theme.colors.purple};
  color: ${({ theme }) => theme.colors.white};
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textBase};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover:not(:disabled) {
    opacity: 0.9;
    box-shadow: ${({ theme }) => theme.shadows.glowPurple};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ApiKeyHint = styled.p`
  color: ${({ theme }) => theme.colors.white50};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.lineHeightRelaxed};
  margin: ${({ theme }) => theme.spacing[3]} 0 0 0;
`;

export const ApiKeyFormRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};

  /* Make InputWrapper fill available space */
  & > div:first-child {
    flex: 1;
    min-width: 0;
  }
`;

export const ToolCallBlock = styled.div`
  background: ${({ theme }) => theme.colors.orangeSoft};
  border: 1px solid ${({ theme }) => theme.colors.orange};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[3]};
`;

export const ToolCallCode = styled.pre`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  margin-top: ${({ theme }) => theme.spacing[2]};
  white-space: pre-wrap;
  word-break: break-word;
`;

export const RawResponseToggle = styled.details`
  margin-top: ${({ theme }) => theme.spacing[4]};

  > summary {
    cursor: pointer;
    font-size: ${({ theme }) => theme.typography.textXs};
    color: ${({ theme }) => theme.colors.white50};
    user-select: none;
    transition: color ${({ theme }) => theme.transitions.fast};

    &:hover {
      color: ${({ theme }) => theme.colors.white70};
    }
  }
`;

export const RawResponseCode = styled.pre`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  margin-top: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: auto;
  max-height: 300px;
  color: ${({ theme }) => theme.colors.white70};
`;

export const ResponseContentItem = styled.div`
  margin-top: ${({ theme }) => theme.spacing[3]};

  &:first-child {
    margin-top: 0;
  }
`;

// Model selector option styles
export const ModelOptionContent = styled.span`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const ModelOptionName = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ModelOptionPrice = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
  font-family: ${({ theme }) => theme.typography.fontMono};
  flex-shrink: 0;
`;

export const ModelValueContent = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ModelValuePrice = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;
