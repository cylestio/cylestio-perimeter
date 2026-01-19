import styled from 'styled-components';

// Tab Navigation
export const TabNav = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface};
  overflow-x: auto;
`;

export const Tab = styled.button<{ $active?: boolean }>`
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  background: ${({ $active, theme }) => ($active ? theme.colors.surface2 + '80' : 'none')};
  border: none;
  border-bottom: 3px solid ${({ $active, theme }) => ($active ? theme.colors.cyan : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.cyan : theme.colors.white50)};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.white70};
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const TabBadge = styled.span<{ $type: 'pass' | 'fail' }>`
  display: inline-block;
  padding: 2px 6px;
  margin-left: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 10px;
  font-weight: 600;
  background: ${({ $type, theme }) => ($type === 'pass' ? theme.colors.greenSoft : theme.colors.redSoft)};
  color: ${({ $type, theme }) => ($type === 'pass' ? theme.colors.green : theme.colors.red)};
`;

// Report Container
export const ReportContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

export const ReportHeader = styled.div<{ $isBlocked: boolean }>`
  padding: ${({ theme }) => theme.spacing[5]} ${({ theme }) => theme.spacing[6]};
  background: ${({ $isBlocked, theme }) =>
    $isBlocked
      ? `linear-gradient(135deg, ${theme.colors.redSoft}, transparent)`
      : `linear-gradient(135deg, ${theme.colors.greenSoft}, transparent)`};
  border-bottom: 2px solid ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.red : theme.colors.green)};
`;

// Full-width header layout
export const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

export const DecisionIcon = styled.div<{ $isBlocked: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.redSoft : theme.colors.greenSoft)};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.red : theme.colors.green)};
  flex-shrink: 0;
`;

export const DecisionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const DecisionTitle = styled.div<{ $isBlocked: boolean }>`
  font-size: 20px;
  font-weight: 700;
  color: ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.red : theme.colors.green)};
`;

export const ReportMeta = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
`;

// Severity counts in header (uses Badge component for individual badges)
export const SeverityCounts = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

// Risk level display
export const RiskLevelBox = styled.div<{ $level: 'low' | 'medium' | 'high' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: ${({ $level, theme }) => {
    if ($level === 'high') return theme.colors.redSoft;
    if ($level === 'medium') return theme.colors.orangeSoft;
    return theme.colors.greenSoft;
  }};
  border: 1px solid ${({ $level, theme }) => {
    if ($level === 'high') return theme.colors.red;
    if ($level === 'medium') return theme.colors.orange;
    return theme.colors.green;
  }};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const RiskLevelText = styled.div<{ $level: 'low' | 'medium' | 'high' }>`
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $level, theme }) => {
    if ($level === 'high') return theme.colors.red;
    if ($level === 'medium') return theme.colors.orange;
    return theme.colors.green;
  }};
  line-height: 1;
`;

export const RiskLevelLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white50};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

// Risk score with tooltip (when showNumericRiskScore is true)
export const RiskScoreBox = styled.div<{ $isHigh: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ $isHigh, theme }) => ($isHigh ? theme.colors.red : theme.colors.green)};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: help;
  position: relative;
`;

export const RiskScoreValue = styled.div<{ $isHigh: boolean }>`
  font-size: 28px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: ${({ $isHigh, theme }) => ($isHigh ? theme.colors.red : theme.colors.green)};
  line-height: 1;
`;

export const RiskScoreLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white50};
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

// Tooltip for risk breakdown
export const RiskTooltip = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 100;
  min-width: 280px;
  white-space: nowrap;
`;

export const TooltipTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white50};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const TooltipFormula = styled.div`
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: ${({ theme }) => theme.colors.cyan};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

export const TooltipRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing[1]} 0;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};

  &:last-child {
    border-bottom: none;
    font-weight: 700;
    padding-top: ${({ theme }) => theme.spacing[2]};
  }
`;

export const TooltipRowLabel = styled.span`
  color: ${({ theme }) => theme.colors.white70};
`;

// Section Divider
export const SectionDivider = styled.hr`
  height: 1px;
  border: none;
  background: linear-gradient(
    90deg,
    transparent 0%,
    ${({ theme }) => theme.colors.white08} 50%,
    transparent 100%
  );
  margin: ${({ theme }) => theme.spacing[6]} 0;
`;

// Stats Grid (Quick Stats Strip)
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[5]};

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const StatBox = styled.div<{ $accentColor?: string }>`
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-left: 3px solid ${({ $accentColor }) => $accentColor || 'transparent'};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;
`;

export const StatValue = styled.div<{ $color?: string }>`
  font-size: 36px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: ${({ $color, theme }) => $color || theme.colors.white};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white50};
`;

// Tab Content
export const TabContent = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
`;

// Tab Section Headers (moved from inline styles)
export const TabSectionHeader = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

export const TabSectionDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0 0 ${({ theme }) => theme.spacing[5]} 0;
`;

// Checks Table
export const ChecksTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;

  th {
    text-align: left;
    padding: ${({ theme }) => theme.spacing[3]};
    background: ${({ theme }) => theme.colors.surface2};
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.white50};
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  }

  td {
    padding: ${({ theme }) => theme.spacing[3]};
    font-size: 14px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: none;
  }

  /* Zebra striping */
  tbody tr:nth-child(even) {
    background: ${({ theme }) => theme.colors.surface2}30;
  }

  tr:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const StatusPill = styled.span<{ $status: 'pass' | 'fail' | 'warning' | 'na' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${({ $status, theme }) => {
    if ($status === 'pass') return theme.colors.greenSoft;
    if ($status === 'fail') return theme.colors.redSoft;
    if ($status === 'warning') return theme.colors.orangeSoft;
    return theme.colors.surface3;
  }};
  color: ${({ $status, theme }) => {
    if ($status === 'pass') return theme.colors.green;
    if ($status === 'fail') return theme.colors.red;
    if ($status === 'warning') return theme.colors.orange;
    return theme.colors.white50;
  }};
`;

// Compliance Components
export const ComplianceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const ComplianceCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

export const ComplianceHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ComplianceTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const ComplianceBody = styled.div`
  padding: ${({ theme }) => theme.spacing[3]};
`;

export const ComplianceItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.sm};
  margin-bottom: ${({ theme }) => theme.spacing[2]};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const ComplianceStatus = styled.div<{ $status: string }>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  background: ${({ $status, theme }) => {
    if ($status === 'PASS' || $status === 'COMPLIANT') return theme.colors.greenSoft;
    if ($status === 'FAIL' || $status === 'NON-COMPLIANT') return theme.colors.redSoft;
    if ($status === 'WARNING') return theme.colors.orangeSoft;
    return theme.colors.surface3;
  }};
  color: ${({ $status, theme }) => {
    if ($status === 'PASS' || $status === 'COMPLIANT') return theme.colors.green;
    if ($status === 'FAIL' || $status === 'NON-COMPLIANT') return theme.colors.red;
    if ($status === 'WARNING') return theme.colors.orange;
    return theme.colors.white50;
  }};
`;

// Evidence Components
export const EvidenceCard = styled.div<{ $severity: string }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  overflow: hidden;
`;

export const EvidenceHeader = styled.div<{ $severity: string }>`
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ $severity, theme }) => {
    if ($severity === 'CRITICAL' || $severity === 'HIGH') return theme.colors.redSoft + '30';
    if ($severity === 'MEDIUM') return theme.colors.orangeSoft + '30';
    return 'transparent';
  }};
`;

export const EvidenceBody = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

export const EvidenceTitle = styled.h4`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
`;

// Code Block
export const CodeBlock = styled.div`
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

export const CodeHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
`;

export const CodeContent = styled.pre`
  padding: ${({ theme }) => theme.spacing[3]};
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  color: ${({ theme }) => theme.colors.white};
  background: ${({ theme }) => theme.colors.void};
`;

// Export Actions
export const ExportActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface2};
`;

// Business Impact Section
export const BusinessImpactSection = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.void};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ImpactBullets = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

export const ImpactBullet = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[3]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};

  &:last-child {
    border-bottom: none;
  }
`;

export const ImpactBulletText = styled.span`
  flex: 1;
`;

export const ImpactList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ImpactRow = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const ImpactRowHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white};
`;

export const ImpactRowLabel = styled.span`
  font-weight: 500;
`;

export const ImpactRowDescription = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  padding-left: ${({ theme }) => theme.spacing[1]};
`;

export const ImpactRowSeparator = styled.span`
  color: ${({ theme }) => theme.colors.white30};
  &::before {
    content: '•';
  }
`;

export const ImpactRowLevel = styled.span<{ $level: string }>`
  font-weight: 600;
  color: ${({ $level, theme }) => {
    if ($level === 'HIGH') return theme.colors.red;
    if ($level === 'MEDIUM') return theme.colors.orange;
    if ($level === 'LOW') return theme.colors.yellow;
    return theme.colors.green;
  }};
`;

export const ImpactRowCount = styled.span`
  color: ${({ theme }) => theme.colors.white50};
`;

// Summary Section - Two column layout
export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[6]};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing[4]};
  }
`;

export const SummaryColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

export const SummarySubheading = styled.h4`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
`;

// Summary Stats Row (unified list style - compact)
export const SummaryStatsRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[1]} 0;
`;

export const SummaryStatsLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
`;

export const SummaryStatsDots = styled.span`
  flex: 1;
  border-bottom: 1px dotted ${({ theme }) => theme.colors.white20};
  margin: 0 ${({ theme }) => theme.spacing[2]};
  min-width: 20px;
`;

export const SummaryStatsValue = styled.span<{ $color?: string }>`
  font-size: 14px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  color: ${({ $color, theme }) => $color || theme.colors.white};
`;

// Risk Breakdown
export const RiskBreakdown = styled.div`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const RiskBreakdownTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white50};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const RiskFormula = styled.div`
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: ${({ theme }) => theme.colors.cyan};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

export const RiskBreakdownGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
  align-items: center;
`;

export const RiskBreakdownItem = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: 'JetBrains Mono', monospace;
`;

export const RiskBreakdownTotal = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.cyan};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: 'JetBrains Mono', monospace;
`;

// Recommendations Table
export const RecommendationsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  margin-top: ${({ theme }) => theme.spacing[4]};

  th {
    text-align: left;
    padding: ${({ theme }) => theme.spacing[3]};
    background: ${({ theme }) => theme.colors.surface2};
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.white50};
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  }

  td {
    padding: ${({ theme }) => theme.spacing[3]};
    font-size: 14px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: none;
  }

  /* Zebra striping */
  tbody tr:nth-child(even) {
    background: ${({ theme }) => theme.colors.surface2}30;
  }

  tr:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

// Empty State for Evidences
export const EmptyEvidence = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
`;

// Key Findings Components
export const FindingCard = styled.div<{ $resolved?: boolean }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: 2px;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  overflow: hidden;
  ${({ $resolved }) =>
    $resolved &&
    `
    opacity: 0.7;
  `}
`;

export const FixedByBadge = styled.span<{ $isAuto: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: ${({ $isAuto }) =>
    $isAuto ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)'};
  color: ${({ $isAuto, theme }) => ($isAuto ? theme.colors.green : theme.colors.cyan)};
`;

export const FindingHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderMedium};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  background: #1c1c28;
`;

export const FindingMetadata = styled.div`
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const FindingTag = styled.span`
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: 2px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white70};
`;

export const FindingTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  flex: 1;
  min-width: 0;
`;

export const FindingTitleText = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
`;

export const FindingBody = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
`;

export const FindingSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[5]};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const FindingSectionLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white50};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const FindingImpact = styled.div`
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white};
  line-height: 1.6;
`;

export const FixSection = styled.div`
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
`;

export const FixContent = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white};
  line-height: 1.6;
`;
