import styled from 'styled-components';

// ====================================================
// SIDEBAR CONTAINER
// ====================================================

export const SidebarContainer = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  align-self: start;
`;

// ====================================================
// SECTION HEADER WITH VARIANT (extends Section.Header)
// ====================================================

export const SectionHeaderStyled = styled.div<{
  $variant?: 'success' | 'warning' | 'critical';
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.layout.cardHeaderPadding};
  border-bottom: 1px solid
    ${({ theme, $variant }) =>
      $variant === 'success'
        ? theme.colors.green
        : $variant === 'warning'
          ? theme.colors.orange
          : $variant === 'critical'
            ? theme.colors.red
            : theme.colors.borderSubtle};
  background: ${({ theme, $variant }) =>
    $variant === 'success'
      ? theme.colors.greenSoft
      : $variant === 'warning'
        ? theme.colors.orangeSoft
        : $variant === 'critical'
          ? theme.colors.redSoft
          : 'transparent'};
`;

// ====================================================
// METRICS STYLES
// ====================================================

export const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const MetricBox = styled.div`
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
`;

export const MetricLabel = styled.div`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white50};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const MetricValue = styled.div<{
  $color?: 'cyan' | 'green' | 'orange' | 'red' | 'purple';
}>`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme, $color }) =>
    $color === 'cyan'
      ? theme.colors.cyan
      : $color === 'green'
        ? theme.colors.green
        : $color === 'orange'
          ? theme.colors.orange
          : $color === 'red'
            ? theme.colors.red
            : $color === 'purple'
              ? theme.colors.purple
              : theme.colors.white90};
`;

export const MetricDetail = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.white50};
  margin-top: 2px;
`;

// ====================================================
// TOOLS UTILIZATION STYLES
// ====================================================

export const UtilizationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const ToolsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ToolItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

export const ToolName = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white90};
`;

export const ToolUsage = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ToolCount = styled.span`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: white;
  background: #1e40af;
  padding: 2px 6px;
  border-radius: 3px;
`;

export const ToolUnused = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// ====================================================
// BEHAVIORAL INSIGHTS STYLES
// ====================================================

export const OutlierReasons = styled.ul`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.orange};
  margin: ${({ theme }) => theme.spacing[2]} 0 0 0;
  padding-left: ${({ theme }) => theme.spacing[5]};
`;

export const OutlierReason = styled.li`
  margin-bottom: 4px;
`;

// ====================================================
// SECURITY CHECKS STYLES
// ====================================================

export const SecuritySummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
`;

export const SecurityCheckList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const SecurityCheckItemWrapper = styled.div<{
  $status: 'passed' | 'warning' | 'critical';
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme, $status }) =>
    $status === 'critical'
      ? theme.colors.redSoft
      : $status === 'warning'
        ? theme.colors.orangeSoft
        : theme.colors.surface};
  border: 1px solid
    ${({ theme, $status }) =>
      $status === 'critical'
        ? theme.colors.red
        : $status === 'warning'
          ? theme.colors.orange
          : theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

export const SecurityCheckStatus = styled.span<{
  $status: 'passed' | 'warning' | 'critical';
}>`
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  color: ${({ theme, $status }) =>
    $status === 'passed'
      ? theme.colors.green
      : $status === 'warning'
        ? theme.colors.orange
        : theme.colors.red};
  min-width: 32px;
`;

export const SecurityCheckName = styled.span`
  flex: 1;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
`;

// ====================================================
// SHARED UTILITY STYLES
// ====================================================

export const StatusBadgeWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-wrap: wrap;
`;
