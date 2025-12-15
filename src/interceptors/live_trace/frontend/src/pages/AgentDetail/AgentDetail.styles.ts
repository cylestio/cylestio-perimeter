import styled from 'styled-components';
import { Link } from 'react-router-dom';

// Button-styled Link component
export const ButtonLink = styled(Link)<{ $variant?: 'primary' | 'secondary' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  cursor: pointer;

  ${({ theme, $variant = 'primary' }) => {
    switch ($variant) {
      case 'secondary':
        return `
          background: transparent;
          border: 1px solid ${theme.colors.borderMedium};
          color: ${theme.colors.white90};
          &:hover {
            background: ${theme.colors.surface2};
            border-color: ${theme.colors.cyan};
          }
        `;
      case 'ghost':
        return `
          background: transparent;
          border: none;
          color: ${theme.colors.cyan};
          padding: ${theme.spacing[1]} ${theme.spacing[2]};
          &:hover {
            background: ${theme.colors.surface2};
          }
        `;
      default:
        return `
          background: ${theme.colors.cyan};
          border: 1px solid ${theme.colors.cyan};
          color: ${theme.colors.void};
          &:hover {
            opacity: 0.9;
          }
        `;
    }
  }}
`;

// Two-column layout: Operational + Security
export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[6]};

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

// Column container for each side
export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
  min-width: 0; /* Prevent overflow */
`;

// Column header label (OPERATIONAL / SECURITY)
export const ColumnHeader = styled.h2`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0;
`;

// Agent Header
export const AgentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const AgentHeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const AgentTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.textXl};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const AgentMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
`;

// Critical Alert Banner
export const CriticalAlertBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.redSoft};
  border: 1px solid ${({ theme }) => theme.colors.red};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.red};

  svg {
    flex-shrink: 0;
  }
`;

export const AlertText = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white90};
`;


// Security Section - Simplified
export const SecurityStatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const SecurityCounts = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  font-size: ${({ theme }) => theme.typography.textSm};
`;

export const PIINote = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.sm};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

// Collapsible Checks
export const CollapsibleHeader = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white70};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }

  svg {
    transition: transform ${({ theme }) => theme.transitions.fast};
    transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0)')};
  }
`;

export const CollapsibleContent = styled.div<{ $isOpen: boolean }>`
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

export const CheckList = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

export const CheckItem = styled.div<{ $isLast?: boolean }>`
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: ${({ theme, $isLast }) =>
    $isLast ? 'none' : `1px solid ${theme.colors.borderSubtle}`};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const CheckStatus = styled.span<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ $color }) => $color};
  min-width: 36px;
`;

export const CheckName = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

export const CheckValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

// Behavioral Section - Chart top, scores below
export const BehavioralMetrics = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const BehavioralGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const ScoresRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const ScoreItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const ChartColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ChartLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const MetricRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const MetricRowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const MetricRowLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  cursor: help;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};
  font-weight: ${({ theme }) => theme.typography.weightMedium};

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

export const ConfidenceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${({ theme }) => theme.spacing[2]};
`;

// Progress/Waiting States
export const WaitingMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.purpleSoft};
  border: 1px solid ${({ theme }) => theme.colors.purple};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};
`;

export const PlaceholderMessage = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
`;

// Evaluation Progress
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

// Sessions Table
export const EmptySessions = styled.div`
  padding: ${({ theme }) => theme.spacing[8]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};
`;

// Active Sessions Note
export const ActiveSessionsNote = styled.div`
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.purpleSoft};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.purple};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white70};
`;

// ============================================
// Shared components (used by AgentReport.tsx)
// ============================================

// Risk Score Hero Card (for AgentReport sidebar)
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

// Metric Grid (for AgentReport sidebar)
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

// Tool Utilization Section - Compact horizontal layout
export const ToolUtilizationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const ToolUtilizationMetric = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-shrink: 0;
`;

// Compact circular progress ring
export const CircularProgress = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
`;

export const CircularProgressSvg = styled.svg`
  transform: rotate(-90deg);
  width: 40px;
  height: 40px;
`;

export const CircularProgressTrack = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme.colors.borderSubtle};
  stroke-width: 3;
`;

export const CircularProgressFill = styled.circle<{ $percent: number; $color: string }>`
  fill: none;
  stroke: ${({ $color }) => $color};
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: ${({ $percent }) => `${$percent * 0.94} 94`};
  transition: stroke-dasharray 0.5s ease;
`;

export const CircularProgressContent = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

export const CircularProgressValue = styled.div`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.white};
  line-height: 1;
`;

export const ToolUtilizationLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

export const ToolUtilizationPrimary = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white};
`;

export const ToolUtilizationSecondary = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

export const ToolUtilizationDivider = styled.div`
  width: 1px;
  height: 32px;
  background: ${({ theme }) => theme.colors.borderMedium};
  flex-shrink: 0;
`;

// Tools list - flows horizontally
export const ToolsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
  flex: 1;
  min-width: 0;
`;

export const ToolTag = styled.span<{ $isUsed: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $isUsed }) => ($isUsed ? theme.colors.surface2 : theme.colors.surface)};
  border: 1px ${({ $isUsed }) => ($isUsed ? 'solid' : 'dashed')}
    ${({ theme, $isUsed }) => ($isUsed ? theme.colors.borderMedium : theme.colors.borderMedium)};
  font-size: 12px;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
  }
`;

export const ToolName = styled.span<{ $isUsed: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme, $isUsed }) => ($isUsed ? theme.colors.white90 : theme.colors.white70)};
  font-weight: ${({ $isUsed }) => ($isUsed ? 500 : 400)};
`;

export const ToolCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 18px;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.white08};
  font-size: 10px;
  color: ${({ theme }) => theme.colors.white70};
  font-weight: 600;
  line-height: 1;
`;

export const ToolUnused = styled.span`
  font-size: 9px;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

