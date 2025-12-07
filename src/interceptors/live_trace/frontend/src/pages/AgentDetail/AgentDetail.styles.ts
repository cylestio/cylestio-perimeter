import styled from 'styled-components';

export const AgentLayout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: ${({ theme }) => theme.spacing[6]};
  min-height: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

export const AgentSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const AgentMain = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

// Risk Score Hero Card
export const RiskHeroCard = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
`;

export const RiskHeroHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const RiskLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

export const RiskScore = styled.div<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ $color }) => $color};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const RiskSummary = styled.div`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
`;

// Metric Grid
export const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const MetricCard = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const MetricLabel = styled.h3`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

export const MetricValue = styled.div`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.cyan};
`;

// Alert Banners
export const AlertBanner = styled.div<{ $variant: 'info' | 'warning' | 'success' | 'error' }>`
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radii.lg};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};

  ${({ theme, $variant }) => {
    switch ($variant) {
      case 'info':
        return `
          background: linear-gradient(135deg, ${theme.colors.purpleSoft} 0%, ${theme.colors.surface2} 100%);
          border: 2px solid ${theme.colors.purple};
        `;
      case 'warning':
        return `
          background: ${theme.colors.orangeSoft};
          border: 1px solid ${theme.colors.orange};
        `;
      case 'success':
        return `
          background: ${theme.colors.greenSoft};
          border: 1px solid ${theme.colors.green};
        `;
      case 'error':
        return `
          background: ${theme.colors.redSoft};
          border: 1px solid ${theme.colors.red};
        `;
    }
  }}
`;

export const AlertContent = styled.div`
  flex: 1;
`;

export const AlertTitle = styled.div<{ $color?: string }>`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ $color, theme }) => $color || theme.colors.white90};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const AlertDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

// Summary Card
export const SummaryCard = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
`;

export const SummaryHeader = styled.div`
  padding: ${({ theme }) => theme.layout.cardHeaderPadding};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SummaryTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
`;

export const SummaryContent = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
`;

// Status Banner
export const StatusBanner = styled.div<{ $isError: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme, $isError }) =>
    $isError ? theme.colors.redSoft : theme.colors.greenSoft};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 2px solid
    ${({ theme, $isError }) => ($isError ? theme.colors.red : theme.colors.green)};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

export const StatusLeft = styled.div``;

export const StatusRight = styled.div`
  text-align: right;
`;

export const StatusLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const StatusValue = styled.div<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ $color }) => $color};
`;

export const StatusMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

// Check Lists
export const CheckSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

export const CheckSectionTitle = styled.h3<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ $color }) => $color};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
`;

export const CheckList = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

export const CheckItem = styled.div<{ $isLast: boolean }>`
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: ${({ theme, $isLast }) =>
    $isLast ? 'none' : `1px solid ${theme.colors.borderSubtle}`};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const CheckStatus = styled.div<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.textXs};
  min-width: 32px;
  text-align: center;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ $color }) => $color};
`;

export const CheckName = styled.div`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

export const CheckValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

// Behavioral Snapshot
export const BehavioralSection = styled.div`
  padding-top: ${({ theme }) => theme.spacing[6]};
  margin-top: ${({ theme }) => theme.spacing[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const BehavioralTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white50};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const MetricRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const MetricRowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const MetricRowLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  cursor: help;

  span:first-child {
    font-size: ${({ theme }) => theme.typography.textSm};
    color: ${({ theme }) => theme.colors.white70};
    font-weight: ${({ theme }) => theme.typography.weightMedium};
  }

  span:last-child {
    opacity: 0.5;
    font-size: 11px;
  }
`;

export const MetricRowValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.cyan};
`;

export const ProgressBarContainer = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`;

export const ProgressBarFill = styled.div<{ $width: number }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ theme }) => theme.colors.purple};
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width ${({ theme }) => theme.transitions.base};
`;

export const ConfidenceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing[2]};
`;

// Sessions Table
export const SessionsCard = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
`;

export const SessionsHeader = styled.div`
  padding: ${({ theme }) => theme.layout.cardHeaderPadding};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const SessionsTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
`;

export const SessionsContent = styled.div`
  overflow-x: auto;
`;

export const EmptySessions = styled.div`
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};
`;

// View Report Button
export const ViewReportButton = styled.a`
  background: ${({ theme }) => theme.colors.purple};
  color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[5]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  border: 2px solid ${({ theme }) => theme.colors.purple};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.9;
    box-shadow: ${({ theme }) => theme.shadows.glowPurple};
  }
`;

// Full Report Link
export const FullReportLink = styled.a`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.purple};
  text-decoration: none;
  opacity: 0.9;

  &:hover {
    opacity: 1;
  }
`;

// PII Warning
export const PIIWarning = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
`;

export const PIIWarningText = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: #92400e;
`;

// Active Sessions Note
export const ActiveSessionsNote = styled.div`
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.purple};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white70};
`;

// Evaluation Progress
export const EvaluationCard = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[5]};
`;

export const EvaluationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const EvaluationTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
`;

export const EvaluationCounter = styled.div`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.cyan};
`;

export const EvaluationDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.lineHeightRelaxed};
`;
