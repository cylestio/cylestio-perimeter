import styled from 'styled-components';

type RiskStatus = 'evaluating' | 'ok';

interface CardContainerProps {
  $riskStatus: RiskStatus;
  $hasCritical: boolean;
  $clickable: boolean;
}

interface RiskStatusBadgeProps {
  $riskStatus: RiskStatus;
}

interface StatValueProps {
  $color?: 'red' | 'green' | 'purple' | 'cyan';
}

interface ProgressBarFillProps {
  $percent: number;
}

export const CardContainer = styled.div<CardContainerProps>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: 12px;
  overflow: hidden;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: all 0.2s;

  ${({ $hasCritical, theme }) =>
    $hasCritical &&
    `
    border-color: ${theme.colors.red};
  `}

  &:hover {
    border-color: ${({ theme }) => theme.colors.cyan};
    transform: translateY(-2px);
  }
`;

export const CardHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const AgentInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const AgentName = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const LifecycleIndicator = styled.span`
  font-size: 14px;
  line-height: 1;
  cursor: help;
`;

export const AgentId = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white30};
  font-family: ${({ theme }) => theme.typography.fontMono};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RiskStatusBadge = styled.span<RiskStatusBadgeProps>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $riskStatus, theme }) =>
    $riskStatus === 'ok' ? theme.colors.greenSoft : theme.colors.orangeSoft};
  color: ${({ $riskStatus, theme }) =>
    $riskStatus === 'ok' ? theme.colors.green : theme.colors.orange};
`;

export const CardBody = styled.div`
  padding: 16px;
`;

export const EvaluatingContainer = styled.div`
  margin-bottom: 16px;
`;

export const EvaluatingText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.orange};
  margin-bottom: 8px;
`;

export const ProgressBarContainer = styled.div`
  height: 4px;
  background: ${({ theme }) => theme.colors.white08};
  border-radius: 2px;
  overflow: hidden;
`;

export const ProgressBarFill = styled.div<ProgressBarFillProps>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: ${({ theme }) => theme.colors.orange};
  border-radius: 2px;
  transition: width 0.3s ease;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

export const StatItem = styled.div`
  text-align: center;
`;

export const StatValue = styled.div<StatValueProps>`
  font-size: 16px;
  font-weight: 700;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ $color, theme }) => {
    switch ($color) {
      case 'red':
        return theme.colors.red;
      case 'green':
        return theme.colors.green;
      case 'purple':
        return theme.colors.purple;
      case 'cyan':
        return theme.colors.cyan;
      default:
        return theme.colors.white;
    }
  }};
`;

export const StatLabel = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.white30};
`;

export const CardFooter = styled.div`
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.surface2};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const LastSeen = styled.span<{ $critical?: boolean }>`
  font-size: 11px;
  color: ${({ $critical, theme }) =>
    $critical ? theme.colors.red : theme.colors.white30};
`;

export const ViewButton = styled.button`
  padding: 4px 12px;
  background: ${({ theme }) => theme.colors.white08};
  border: none;
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.white70};
  font-size: 11px;
  font-weight: 500;
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.cyan};
    color: ${({ theme }) => theme.colors.void};
  }
`;

// Behavioral Metrics Section (shown when evaluation is complete)
export const BehavioralSection = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.white04};
  border-radius: 8px;
`;

export const BehavioralRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const BehavioralLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
  width: 80px;
  flex-shrink: 0;
`;

interface MiniProgressBarProps {
  $percent: number;
  $color: 'cyan' | 'purple' | 'green';
}

export const MiniProgressBarContainer = styled.div`
  flex: 1;
  height: 6px;
  background: ${({ theme }) => theme.colors.white08};
  border-radius: 3px;
  overflow: hidden;
`;

export const MiniProgressBarFill = styled.div<MiniProgressBarProps>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: ${({ $color, theme }) => {
    switch ($color) {
      case 'cyan':
        return theme.colors.cyan;
      case 'purple':
        return theme.colors.purple;
      case 'green':
        return theme.colors.green;
      default:
        return theme.colors.cyan;
    }
  }};
  border-radius: 3px;
  transition: width 0.3s ease;
`;

export const BehavioralValue = styled.span`
  font-size: 11px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white70};
  width: 36px;
  text-align: right;
`;

interface ConfidenceBadgeProps {
  $confidence: 'high' | 'medium' | 'low';
}

export const ConfidenceBadge = styled.span<ConfidenceBadgeProps>`
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${({ $confidence, theme }) => {
    switch ($confidence) {
      case 'high':
        return theme.colors.greenSoft;
      case 'medium':
        return theme.colors.yellowSoft;
      case 'low':
        return theme.colors.redSoft;
      default:
        return theme.colors.white08;
    }
  }};
  color: ${({ $confidence, theme }) => {
    switch ($confidence) {
      case 'high':
        return theme.colors.green;
      case 'medium':
        return theme.colors.yellow;
      case 'low':
        return theme.colors.red;
      default:
        return theme.colors.white50;
    }
  }};
`;

export const WarningsText = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.orange};
`;
