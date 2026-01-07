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
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active, theme }) => ($active ? theme.colors.cyan : 'transparent')};
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
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ $isBlocked, theme }) =>
    $isBlocked
      ? `linear-gradient(135deg, ${theme.colors.redSoft}, transparent)`
      : `linear-gradient(135deg, ${theme.colors.greenSoft}, transparent)`};
  border-bottom: 2px solid ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.red : theme.colors.green)};
`;

export const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

export const ReportTypeLabel = styled.div<{ $color?: string }>`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ $color, theme }) => $color || theme.colors.cyan};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const ReportTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[1]} 0;
`;

export const ReportSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0;
`;

// Decision Box
export const DecisionBox = styled.div<{ $isBlocked: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.redSoft : theme.colors.greenSoft)};
  border: 2px solid ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.red : theme.colors.green)};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

export const DecisionIcon = styled.div<{ $isBlocked: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.red : theme.colors.green)};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 18px;
`;

export const DecisionContent = styled.div`
  flex: 1;
`;

export const DecisionTitle = styled.div<{ $isBlocked: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.red : theme.colors.green)};
`;

export const DecisionText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  margin: ${({ theme }) => theme.spacing[1]} 0 0 0;
`;

// Stats Grid
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[5]};

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const StatBox = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;
`;

export const StatValue = styled.div<{ $color?: string }>`
  font-size: 28px;
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
    font-size: 13px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: none;
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
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  margin: ${({ theme }) => theme.spacing[3]} 0;
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
  font-size: 14px;
  font-weight: 600;
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
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[2]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};

  &:last-child {
    border-bottom: none;
  }
`;

export const ImpactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const ImpactCard = styled.div<{ $level: string }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $level, theme }) => {
    if ($level === 'HIGH') return theme.colors.red;
    if ($level === 'MEDIUM') return theme.colors.orange;
    return theme.colors.borderSubtle;
  }};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
`;

export const ImpactLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white50};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const ImpactLevel = styled.div<{ $level: string }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $level, theme }) => {
    if ($level === 'HIGH') return theme.colors.red;
    if ($level === 'MEDIUM') return theme.colors.orange;
    if ($level === 'LOW') return theme.colors.yellow;
    return theme.colors.green;
  }};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const ImpactDescription = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.4;
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
    font-size: 13px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

// Empty State for Evidences
export const EmptyEvidence = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white50};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
`;
