import styled from 'styled-components';

export const ReportLayout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: ${({ theme }) => theme.spacing[6]};
  min-height: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

export const ReportSidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  align-self: flex-start;
  position: sticky;
  top: ${({ theme }) => theme.spacing[4]};
`;

export const ReportMain = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[5]};
`;

// Category Card
export const CategoryCard = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
`;

export const CategoryHeader = styled.div<{ $severity: 'critical' | 'warning' | 'ok' }>`
  padding: ${({ theme }) => theme.layout.cardHeaderPadding};
  border-bottom: 2px solid
    ${({ theme, $severity }) =>
      $severity === 'critical'
        ? theme.colors.red
        : $severity === 'warning'
          ? theme.colors.orange
          : theme.colors.borderSubtle};
  background: ${({ theme, $severity }) =>
    $severity === 'critical'
      ? theme.colors.redSoft
      : $severity === 'warning'
        ? theme.colors.orangeSoft
        : theme.colors.surface2};
`;

export const CategoryTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const CategoryTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
`;

export const CategoryBadges = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
`;

export const CategoryDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

export const CategoryContent = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
`;

// Metrics Pills
export const MetricsPills = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const MetricPill = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const MetricPillLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
`;

export const MetricPillValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white90};
`;

// Tools Section
export const ToolsSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[5]};
`;

export const SectionLabel = styled.h4`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-family: ${({ theme }) => theme.typography.fontMono};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
`;

export const ToolsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
`;

export const ToolTag = styled.span<{ $isUsed: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $isUsed }) => ($isUsed ? theme.colors.cyanSoft : theme.colors.surface)};
  border: 1px solid
    ${({ theme, $isUsed }) => ($isUsed ? theme.colors.cyan : theme.colors.borderSubtle)};
  font-size: 12px;
`;

export const ToolName = styled.span<{ $isUsed: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme, $isUsed }) => ($isUsed ? theme.colors.cyan : theme.colors.white50)};
  font-weight: ${({ $isUsed }) => ($isUsed ? 600 : 500)};
`;

export const ToolCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 18px;
  padding: 2px 5px;
  border-radius: 3px;
  background: #1e40af;
  font-size: 10px;
  color: white;
  font-weight: 700;
  line-height: 1;
`;

export const ToolUnused = styled.span`
  font-size: 9px;
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Checks Section
export const ChecksSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[5]};
`;

export const CheckItem = styled.div<{ $isLast: boolean }>`
  border-bottom: ${({ theme, $isLast }) =>
    $isLast ? 'none' : `1px solid ${theme.colors.borderSubtle}`};
  padding: ${({ theme }) => theme.spacing[3]} 0;
`;

export const CheckHeader = styled.div<{ $hasDetails: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  cursor: ${({ $hasDetails }) => ($hasDetails ? 'pointer' : 'default')};
`;

export const CheckStatusIcon = styled.div<{ $status: 'passed' | 'warning' | 'critical' }>`
  font-size: 12px;
  min-width: 32px;
  text-align: center;
  font-weight: 600;
  color: ${({ theme, $status }) =>
    $status === 'passed'
      ? theme.colors.green
      : $status === 'warning'
        ? theme.colors.orange
        : theme.colors.red};
`;

export const CheckName = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const CheckNameText = styled.span<{ $status: 'passed' | 'warning' | 'critical' }>`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme, $status }) =>
    $status === 'passed'
      ? theme.colors.white90
      : $status === 'warning'
        ? theme.colors.orange
        : theme.colors.red};
`;

export const CheckValue = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

export const CheckExpandIcon = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

export const CheckDetails = styled.div`
  margin-top: ${({ theme }) => theme.spacing[3]};
  margin-left: 48px;
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
`;

export const CheckDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const RecommendationsTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white90};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const RecommendationsList = styled.ul`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing[5]};
`;

export const RecommendationItem = styled.li`
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

// Behavioral Insights Card
export const BehavioralCard = styled.div`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
`;

export const BehavioralHeader = styled.div`
  padding: ${({ theme }) => theme.layout.cardHeaderPadding};
  border-bottom: 2px solid ${({ theme }) => theme.colors.cyan};
  background: ${({ theme }) => theme.colors.cyanSoft};
`;

export const BehavioralContent = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
`;

// Scores Section
export const ScoresRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[5]};
  align-items: center;
  padding: ${({ theme }) => theme.spacing[4]} 0;
`;

export const ScoreItem = styled.div`
  flex: 1;
`;

export const ScoreLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  cursor: help;
`;

export const ScoreLabelText = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const ScoreValue = styled.div`
  font-size: ${({ theme }) => theme.typography.text2xl};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white90};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const ScoreBar = styled.div`
  height: 3px;
  background: ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;
`;

export const ScoreBarFill = styled.div<{ $width: number }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ theme }) => theme.colors.purple};
  border-radius: ${({ theme }) => theme.radii.full};
`;

export const ScoreSeparator = styled.div`
  width: 1px;
  height: 48px;
  background: ${({ theme }) => theme.colors.borderSubtle};
`;

// Interpretation Box
export const InterpretationBox = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  margin: ${({ theme }) => theme.spacing[5]} 0;
`;

// Outliers Section
export const OutliersSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[5]};
`;

export const OutlierCard = styled.div<{ $severity: string }>`
  background: ${({ theme, $severity }) =>
    $severity === 'high'
      ? theme.colors.redSoft
      : $severity === 'medium'
        ? theme.colors.orangeSoft
        : theme.colors.surface};
  border: 2px solid
    ${({ theme, $severity }) =>
      $severity === 'high'
        ? theme.colors.red
        : $severity === 'medium'
          ? theme.colors.orange
          : theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const OutlierHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const OutlierCauses = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

export const OutlierCausesList = styled.ul`
  margin: ${({ theme }) => theme.spacing[1]} 0 0 0;
  padding-left: ${({ theme }) => theme.spacing[5]};
`;

// Clusters Section
export const ClustersSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[5]};
`;

export const ClusterCard = styled.div<{ $isLowConfidence: boolean }>`
  border: ${({ theme, $isLowConfidence }) =>
    $isLowConfidence
      ? `1px dashed ${theme.colors.borderMedium}`
      : `1px solid ${theme.colors.borderMedium}`};
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  opacity: ${({ $isLowConfidence }) => ($isLowConfidence ? 0.9 : 1)};
`;

export const ClusterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const ClusterName = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white90};
`;

export const ClusterSize = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme }) => theme.colors.purple};
`;

export const ClusterInsights = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const ClusterTools = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

// PII Section
export const PIISummary = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  flex-wrap: wrap;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const PIIStat = styled.span`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const PIIStatLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

export const PIIStatValue = styled.span<{ $color?: string }>`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ $color, theme }) => $color || theme.colors.white90};
`;

export const PIIEntityTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const PIIEntityTag = styled.span`
  padding: 4px 8px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  font-size: 12px;
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

export const PIISessionItem = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const PIISessionHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[3]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const PIIExpandButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing[1]};
  color: ${({ theme }) => theme.colors.white50};
  font-size: 12px;
`;

export const PIISessionDetails = styled.div`
  padding: 0 ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[3]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

// Status Cards
export const StatusCard = styled.div<{ $variant: 'pending' | 'refreshing' | 'disabled' }>`
  background: ${({ theme }) => theme.colors.surface2};
  border: 2px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  overflow: hidden;
  opacity: ${({ $variant }) => ($variant === 'disabled' ? 0.7 : 1)};
`;

export const StatusCardHeader = styled.div`
  padding: ${({ theme }) => theme.layout.cardHeaderPadding};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 2px solid ${({ theme }) => theme.colors.borderMedium};
`;

export const StatusCardContent = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

// Waiting Banner
export const WaitingBanner = styled.div`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 2px solid ${({ theme }) => theme.colors.purple};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[4]};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const WaitingContent = styled.div``;

export const WaitingTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.purple};
`;

export const WaitingDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  margin-top: 4px;
`;
