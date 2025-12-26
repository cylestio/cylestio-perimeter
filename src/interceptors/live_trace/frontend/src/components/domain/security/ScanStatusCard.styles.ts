import styled from 'styled-components';

export const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const CardTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const LastScanInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const LastScanTime = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const ScanMeta = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
`;

export const ScanActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ScanButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  font-size: 12px;
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

export const GateSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const SeveritySummary = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const SeverityItem = styled.div<{ $severity: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 12px;
  color: ${({ theme, $severity }) => {
    switch ($severity) {
      case 'CRITICAL': return theme.colors.severityCritical;
      case 'HIGH': return theme.colors.severityHigh;
      case 'MEDIUM': return theme.colors.severityMedium;
      case 'LOW': return theme.colors.severityLow;
      default: return theme.colors.white70;
    }
  }};
`;

export const SeverityCount = styled.span`
  font-weight: 600;
`;

export const SeverityLabel = styled.span`
  font-size: 11px;
  opacity: 0.8;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

export const EmptyIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.surface3};
  color: ${({ theme }) => theme.colors.white30};
`;

export const EmptyTitle = styled.h4`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0;
`;

export const EmptyDescription = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
  max-width: 300px;
`;

// Scan History Styles
export const ScanHistoryToggle = styled.button<{ $expanded?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.cyan};
  background: ${({ theme }) => theme.colors.cyanSoft};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  width: fit-content;
  
  &:hover {
    background: rgba(0, 240, 255, 0.15);
    border-color: ${({ theme }) => theme.colors.cyan}40;
  }
`;

export const ScanHistoryPanel = styled.div`
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

export const ScanHistoryList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const ScanHistoryItem = styled.div<{ $isCurrent?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  
  &:last-child {
    border-bottom: none;
  }
  
  ${({ $isCurrent, theme }) => $isCurrent && `
    background: ${theme.colors.surface};
  `}
`;

export const ScanHistoryTimestamp = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white80};
`;

export const ScanHistoryDetails = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const ScanHistoryBadge = styled.span<{ $variant: 'findings' | 'clean' | 'scan' | 'autofix' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  font-size: 10px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.sm};
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'findings':
        return `
          background: ${theme.colors.yellowSoft};
          color: ${theme.colors.yellow};
        `;
      case 'clean':
        return `
          background: ${theme.colors.greenSoft};
          color: ${theme.colors.green};
        `;
      case 'autofix':
        return `
          background: ${theme.colors.purpleSoft};
          color: ${theme.colors.purple};
        `;
      case 'scan':
      default:
        return `
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
        `;
    }
  }}
`;

export const CurrentBadge = styled.span`
  padding: ${({ theme }) => `2px ${theme.spacing[2]}`};
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.cyan};
  background: ${({ theme }) => theme.colors.cyanSoft};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

export const HistoricalStatsSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface};
`;

export const HistoricalStatItem = styled.span<{ $variant: 'fixed' | 'resolved' | 'dismissed' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: 11px;
  font-weight: 500;
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'fixed':
        return `color: ${theme.colors.green};`;
      case 'resolved':
        return `color: ${theme.colors.cyan};`;
      case 'dismissed':
        return `color: ${theme.colors.white50};`;
      default:
        return `color: ${theme.colors.white70};`;
    }
  }}
`;
