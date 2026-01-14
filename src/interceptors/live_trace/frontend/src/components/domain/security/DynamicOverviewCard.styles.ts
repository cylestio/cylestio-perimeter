import styled, { css, keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

// ============ Card Wrapper ============
export const CardWrapper = styled.div<{ $status: 'running' | 'ready' | 'upToDate' | 'empty' }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $status, theme }) => {
    switch ($status) {
      case 'running':
        return theme.colors.cyan;
      case 'ready':
        return `${theme.colors.yellow}40`;
      case 'upToDate':
        return `${theme.colors.green}40`;
      default:
        return theme.colors.borderMedium;
    }
  }};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
`;

// ============ Card Header ============
export const CardHeader = styled.div<{ $status: 'running' | 'ready' | 'upToDate' | 'empty' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[6]};
  background: ${({ $status, theme }) => {
    switch ($status) {
      case 'running':
        return `linear-gradient(135deg, ${theme.colors.cyanSoft} 0%, ${theme.colors.surface} 100%)`;
      case 'ready':
        return `linear-gradient(135deg, ${theme.colors.yellow}15 0%, ${theme.colors.surface} 100%)`;
      case 'upToDate':
        return `linear-gradient(135deg, ${theme.colors.greenSoft} 0%, ${theme.colors.surface} 100%)`;
      default:
        return theme.colors.surface;
    }
  }};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const StatusIcon = styled.div<{ $status: 'running' | 'ready' | 'upToDate' | 'empty' }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.full};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $status, theme }) => {
    switch ($status) {
      case 'running':
        return theme.colors.cyanSoft;
      case 'ready':
        return `${theme.colors.yellow}20`;
      case 'upToDate':
        return theme.colors.greenSoft;
      default:
        return theme.colors.surface2;
    }
  }};
  color: ${({ $status, theme }) => {
    switch ($status) {
      case 'running':
        return theme.colors.cyan;
      case 'ready':
        return theme.colors.yellow;
      case 'upToDate':
        return theme.colors.green;
      default:
        return theme.colors.white50;
    }
  }};

  ${({ $status }) =>
    $status === 'running' &&
    css`
      animation: ${pulse} 2s ease-in-out infinite;
    `}
`;

export const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const Title = styled.h3`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const Subtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
`;

export const RunningBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.cyanSoft};
  border: 1px solid ${({ theme }) => theme.colors.cyan}60;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.cyan};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: ${pulse} 2s ease-in-out infinite;
`;

// ============ Card Body ============
export const CardBody = styled.div`
  padding: ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[6]};
`;

// ============ Stats Grid ============
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const StatValue = styled.span<{ $variant?: 'highlight' | 'warning' | 'success' }>`
  font-size: 24px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ $variant, theme }) => {
    switch ($variant) {
      case 'highlight':
        return theme.colors.cyan;
      case 'warning':
        return theme.colors.yellow;
      case 'success':
        return theme.colors.green;
      default:
        return theme.colors.white;
    }
  }};
`;

export const StatLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

// ============ Agents Status List ============
export const AgentsStatusList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const AgentStatusBadge = styled.div<{ $hasNew?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $hasNew }) =>
    $hasNew ? theme.colors.yellow + '20' : theme.colors.surface3};
  border: 1px solid ${({ theme, $hasNew }) =>
    $hasNew ? theme.colors.yellow + '40' : theme.colors.borderSubtle};
  font-size: ${({ theme }) => theme.typography.textXs};
`;

// ============ CTA Section ============
export const CTASection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const LastAnalysisInfo = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
`;

// ============ Explanation Card (Empty State) ============
export const ExplanationCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  overflow: hidden;
`;

export const ExplanationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const ExplanationIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white70};
  flex-shrink: 0;
`;

export const ExplanationTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const ExplanationTitle = styled.h3`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const ExplanationSubtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
`;

export const ExplanationBody = styled.div`
  padding: ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[6]};
`;

export const ExplanationText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.6;
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: ${({ theme }) => theme.colors.white};
    font-weight: ${({ theme }) => theme.typography.weightSemibold};
  }
`;

export const FeatureList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[4]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const FeatureIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface3};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white70};
  flex-shrink: 0;
`;

export const FeatureContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const FeatureLabel = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
`;

export const FeatureDescription = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  line-height: 1.4;
`;

// ============ Accuracy Highlight ============
export const AccuracyHighlight = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

export const AccuracyIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface3};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.white70};
  flex-shrink: 0;
`;

export const AccuracyContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const AccuracyTitle = styled.span`
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
`;

export const AccuracyText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.5;
`;
