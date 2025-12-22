import styled from 'styled-components';

export const PageStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  align-items: center;
`;

export const StatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
`;

export const StatValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.cyan};
`;

export const CodeChecksGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ChecksSectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const ChecksSectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
`;

export const ChecksSectionSubtitle = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

// Health Score Section
export const HealthScoreSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const HealthScoreHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const HealthScoreMain = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const HealthScoreRing = styled.div<{ $color: 'green' | 'orange' | 'red' }>`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid ${({ theme, $color }) =>
    $color === 'green' ? theme.colors.green :
    $color === 'orange' ? theme.colors.orange :
    theme.colors.red};
`;

export const HealthScoreValue = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.white90};
`;

export const HealthScoreInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const HealthScoreLabel = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white90};
`;

export const HealthScoreTrend = styled.span<{ $trend: 'improving' | 'declining' | 'stable' }>`
  font-size: 12px;
  color: ${({ theme, $trend }) =>
    $trend === 'improving' ? theme.colors.green :
    $trend === 'declining' ? theme.colors.red :
    theme.colors.white50};
`;

// Dimension Cards
export const DimensionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const DimensionCard = styled.div<{ $color: 'cyan' | 'green' | 'orange' | 'purple' }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  border-left: 3px solid ${({ theme, $color }) =>
    $color === 'cyan' ? theme.colors.cyan :
    $color === 'green' ? theme.colors.green :
    $color === 'orange' ? theme.colors.orange :
    theme.colors.purple};
`;

export const DimensionLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const DimensionValue = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.white90};
`;

export const DimensionIssues = styled.span<{ $hasIssues: boolean }>`
  font-size: 11px;
  color: ${({ theme, $hasIssues }) =>
    $hasIssues ? theme.colors.orange : theme.colors.white50};
`;

// Empty/Error states
export const EmptyContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[10]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.white70};
    margin: 0;
  }

  p {
    font-size: 13px;
    margin: 0;
    max-width: 360px;
  }

  svg {
    color: ${({ theme }) => theme.colors.green};
    opacity: 0.6;
  }
`;

export const ErrorContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[10]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};

  p {
    margin: 0;
  }

  svg {
    color: ${({ theme }) => theme.colors.red};
  }
`;

export const RetryButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.cyan};
  background: ${({ theme }) => theme.colors.cyanSoft};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(0, 240, 255, 0.2);
    border-color: ${({ theme }) => theme.colors.cyan};
  }
`;

// Suggested improvement card
export const SuggestionCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const SuggestionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.cyanSoft};
  color: ${({ theme }) => theme.colors.cyan};
`;

export const SuggestionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const SuggestionText = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
`;

export const SuggestionGain = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.green};
  font-weight: 500;
`;

// Scan Comparison Section
export const ScanComparisonSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const ScanComparisonHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const ScanComparisonTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
`;

export const ScanComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const ScanStatCard = styled.div<{ $type: 'fixed' | 'new' | 'delta' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;

  svg {
    color: ${({ theme, $type }) =>
      $type === 'fixed' ? theme.colors.green :
      $type === 'new' ? theme.colors.red :
      theme.colors.cyan};
  }
`;

export const ScanStatValue = styled.span<{ $type: 'fixed' | 'new' | 'delta' }>`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme, $type }) =>
    $type === 'fixed' ? theme.colors.green :
    $type === 'new' ? theme.colors.red :
    theme.colors.white90};
`;

export const ScanStatLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const HealthDeltaBadge = styled.span<{ $positive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  font-size: 12px;
  font-weight: 600;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $positive }) =>
    $positive ? theme.colors.greenSoft : theme.colors.redSoft};
  color: ${({ theme, $positive }) =>
    $positive ? theme.colors.green : theme.colors.red};
`;

// Trend Section
export const TrendSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;
