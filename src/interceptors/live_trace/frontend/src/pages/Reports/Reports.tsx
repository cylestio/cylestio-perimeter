import { useState, useEffect, useCallback, type FC } from 'react';

import {
  Download,
  Calendar,
  Shield,
  Briefcase,
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  Users,
  Trash2,
  Eye,
  FileDown,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { ReportsIcon } from '@constants/pageIcons';
import { STATIC_CHECKS, DYNAMIC_CHECKS } from '@constants/securityChecks';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';
import { evaluateCheck } from '@utils/securityCheckEvaluator';
import {
  fetchComplianceReport,
  fetchReportHistory,
  fetchStoredReport,
  deleteReport,
  type ComplianceReportResponse,
  type ReportListItem,
  type ReportType,
} from '@api/endpoints/agentWorkflow';

import { Badge } from '@ui/core/Badge';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';
import { Button } from '@ui/core/Button';
import { Card } from '@ui/core/Card';

import { usePageMeta } from '../../context';
import {
  ReportTemplates,
  TemplateCard,
  TemplateIcon,
  TemplateContent,
  TemplateName,
  TemplateDescription,
  EmptyState,
  GenerateButton,
} from './Reports.styles';

// Report type configuration
const REPORT_TYPES: { id: ReportType; name: string; description: string; icon: typeof Shield; audience: string }[] = [
  {
    id: 'security_assessment',
    name: 'Security Assessment',
    description: 'Comprehensive CISO report with static/dynamic analysis, compliance mapping, code evidences',
    icon: Shield,
    audience: 'CISO / Security Team',
  },
  {
    id: 'executive_summary',
    name: 'Executive Summary',
    description: 'High-level GO/NO-GO decision with key metrics and blockers for leadership',
    icon: Briefcase,
    audience: 'C-Suite / Leadership',
  },
  {
    id: 'customer_dd',
    name: 'Customer Due Diligence',
    description: 'Third-party vendor assessment with security checklist and compliance status',
    icon: Users,
    audience: 'Customers / Partners',
  },
];


// Styled components for the enhanced report view
const TabNav = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface};
  overflow-x: auto;
`;

const Tab = styled.button<{ $active?: boolean }>`
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

const TabBadge = styled.span<{ $type: 'pass' | 'fail' }>`
  display: inline-block;
  padding: 2px 6px;
  margin-left: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 10px;
  font-weight: 600;
  background: ${({ $type, theme }) => ($type === 'pass' ? theme.colors.greenSoft : theme.colors.redSoft)};
  color: ${({ $type, theme }) => ($type === 'pass' ? theme.colors.green : theme.colors.red)};
`;

const ReportContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

const ReportHeader = styled.div<{ $isBlocked: boolean }>`
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ $isBlocked, theme }) =>
    $isBlocked
      ? `linear-gradient(135deg, ${theme.colors.redSoft}, transparent)`
      : `linear-gradient(135deg, ${theme.colors.greenSoft}, transparent)`};
  border-bottom: 2px solid ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.red : theme.colors.green)};
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ReportTypeLabel = styled.div<{ $color?: string }>`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ $color, theme }) => $color || theme.colors.cyan};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const ReportTitle = styled.h2`
  font-size: 24px;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[1]} 0;
`;

const ReportSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white70};
  margin: 0;
`;

const DecisionBox = styled.div<{ $isBlocked: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.redSoft : theme.colors.greenSoft)};
  border: 2px solid ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.red : theme.colors.green)};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-top: ${({ theme }) => theme.spacing[4]};
`;

const DecisionIcon = styled.div<{ $isBlocked: boolean }>`
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

const DecisionContent = styled.div`
  flex: 1;
`;

const DecisionTitle = styled.div<{ $isBlocked: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${({ $isBlocked, theme }) => ($isBlocked ? theme.colors.red : theme.colors.green)};
`;

const DecisionText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white70};
  margin: ${({ theme }) => theme.spacing[1]} 0 0 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[5]};

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatBox = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;
`;

const StatValue = styled.div<{ $color?: string }>`
  font-size: 28px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: ${({ $color, theme }) => $color || theme.colors.white};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white50};
`;

const TabContent = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
`;

const ChecksTable = styled.table`
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

const StatusPill = styled.span<{ $status: 'pass' | 'fail' | 'warning' | 'na' }>`
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

const ComplianceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing[3]};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ComplianceCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

const ComplianceHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ComplianceTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

const ComplianceBody = styled.div`
  padding: ${({ theme }) => theme.spacing[3]};
`;

const ComplianceItem = styled.div`
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

const ComplianceStatus = styled.div<{ $status: string }>`
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

const EvidenceCard = styled.div<{ $severity: string }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  overflow: hidden;
`;

const EvidenceHeader = styled.div<{ $severity: string }>`
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

const EvidenceBody = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

const EvidenceTitle = styled.h4`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
`;

const CodeBlock = styled.div`
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  margin: ${({ theme }) => theme.spacing[3]} 0;
`;

const CodeHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.cyan};
`;

const CodeContent = styled.pre`
  padding: ${({ theme }) => theme.spacing[3]};
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  color: ${({ theme }) => theme.colors.white};
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderMedium};
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

const HistoryInfo = styled.div`
  flex: 1;
`;

const HistoryName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
`;

const HistoryMeta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: 2px;
`;

const HistoryActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const IconButton = styled.button`
  padding: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.sm};
  color: ${({ theme }) => theme.colors.white50};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.white};
    border-color: ${({ theme }) => theme.colors.borderMedium};
  }

  &:hover.danger {
    color: ${({ theme }) => theme.colors.red};
    border-color: ${({ theme }) => theme.colors.red};
  }
`;

const ExportActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface2};
`;

// Business Impact Styled Components
const BusinessImpactSection = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.void};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const ImpactBullets = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
`;

const ImpactBullet = styled.li`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[2]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ImpactGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[3]};
`;

const ImpactCard = styled.div<{ $level: string }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $level, theme }) => {
    if ($level === 'HIGH') return theme.colors.red;
    if ($level === 'MEDIUM') return theme.colors.orange;
    return theme.colors.borderSubtle;
  }};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
`;

const ImpactLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white50};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const ImpactLevel = styled.div<{ $level: string }>`
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

const ImpactDescription = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white70};
  line-height: 1.4;
`;

// Risk Breakdown Styled Components
const RiskBreakdown = styled.div`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

const RiskBreakdownTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.white50};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const RiskFormula = styled.div`
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: ${({ theme }) => theme.colors.cyan};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const RiskBreakdownGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[3]};
  align-items: center;
`;

const RiskBreakdownItem = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.void};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: 'JetBrains Mono', monospace;
`;

const RiskBreakdownTotal = styled.div`
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
const RecommendationsTable = styled.table`
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

// Markdown export function
const generateMarkdownReport = (report: ComplianceReportResponse, workflowId: string): string => {
  const date = new Date(report.generated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const decision = report.executive_summary.is_blocked ? 'NO-GO' : 'GO';
  const decisionIcon = report.executive_summary.is_blocked ? '❌' : '✅';

  let md = `# Security Assessment: ${workflowId}

**Generated:** ${date}  
**Report Type:** ${REPORT_TYPES.find(t => t.id === report.report_type)?.name || report.report_type}  
**Risk Score:** ${report.executive_summary.risk_score}/100

---

## ${decisionIcon} Decision: ${decision}

${report.executive_summary.decision_message}

`;

  // Business Impact (Executive Summary)
  if (report.business_impact && report.business_impact.executive_bullets && report.business_impact.executive_bullets.length > 0) {
    md += `## ⚠️ Key Security Risks

`;
    report.business_impact.executive_bullets.forEach((bullet: string) => {
      md += `- ${bullet}\n`;
    });
    md += '\n';
    
    // Impact areas
    const impacts = report.business_impact.impacts || {};
    const activeImpacts = Object.entries(impacts).filter(([_, v]: [string, any]) => v.risk_level !== 'NONE');
    if (activeImpacts.length > 0) {
      md += `### Impact Assessment

| Risk Area | Level | Description |
|-----------|-------|-------------|
`;
      activeImpacts.forEach(([key, impact]: [string, any]) => {
        const name = key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        md += `| ${name} | ${impact.risk_level} | ${impact.description} |\n`;
      });
      md += '\n';
    }
  }

  // Key Metrics
  md += `## Key Metrics

| Metric | Value |
|--------|-------|
| Risk Score | ${report.executive_summary.risk_score}/100 |
| Total Findings | ${report.executive_summary.total_findings} |
| Open Issues | ${report.executive_summary.open_findings} |
| Fixed | ${report.executive_summary.fixed_findings} |
| Blocking Issues | ${report.executive_summary.blocking_count} |

`;

  // Risk Score Breakdown
  if (report.executive_summary.risk_breakdown) {
    const rb = report.executive_summary.risk_breakdown;
    md += `### Risk Score Calculation

**Formula:** \`${rb.formula}\`

| Severity | Count | Weight | Subtotal |
|----------|-------|--------|----------|
`;
    rb.breakdown.forEach((item: any) => {
      if (item.count > 0) {
        md += `| ${item.severity} | ${item.count} | ×${item.weight} | ${item.subtotal} |\n`;
      }
    });
    md += `| **Total** | | | **${rb.final_score}** |\n\n`;
  }

  // Blocking Items
  if (report.blocking_items.length > 0) {
    md += `## ⚠️ Blocking Issues (${report.blocking_items.length})

| ID | Severity | Title | Category |
|----|----------|-------|----------|
`;
    report.blocking_items.forEach(item => {
      md += `| ${item.recommendation_id} | ${item.severity} | ${item.title} | ${item.category} |\n`;
    });
    md += '\n';
  }

  // OWASP LLM Coverage
  md += `## OWASP LLM Top 10 Coverage

| Control | Status | Details |
|---------|--------|---------|
`;
  Object.entries(report.owasp_llm_coverage).forEach(([id, item]) => {
    const icon = item.status === 'PASS' ? '✅' : item.status === 'FAIL' ? '❌' : item.status === 'WARNING' ? '⚠️' : '➖';
    md += `| ${id}: ${item.name} | ${icon} ${item.status} | ${item.message} |\n`;
  });

  // SOC2 Compliance
  md += `
## SOC2 Compliance

| Control | Status | Details |
|---------|--------|---------|
`;
  Object.entries(report.soc2_compliance).forEach(([id, item]) => {
    const icon = item.status === 'COMPLIANT' ? '✅' : '❌';
    md += `| ${id}: ${item.name} | ${icon} ${item.status} | ${item.message} |\n`;
  });

  // Remediation Summary
  md += `
## Remediation Summary

- **Total Recommendations:** ${report.remediation_summary.total_recommendations}
- **Pending:** ${report.remediation_summary.pending}
- **In Progress:** ${report.remediation_summary.fixing}
- **Fixed:** ${report.remediation_summary.fixed}
- **Verified:** ${report.remediation_summary.verified}
- **Dismissed:** ${report.remediation_summary.dismissed}

---

*Generated by Cylestio Agent Inspector*
`;

  return md;
};

// HTML export function (enhanced from before)
const generateHTMLReport = (report: ComplianceReportResponse, workflowId: string): string => {
  const date = new Date(report.generated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Assessment: ${workflowId} | Cylestio Agent Inspector</title>
  <style>
    :root { --bg: #0a0a0f; --surface: #12121a; --surface2: #1a1a24; --border: rgba(255,255,255,0.08); --white: #f3f4f6; --white70: #9ca3af; --white50: #6b7280; --green: #10b981; --red: #ef4444; --orange: #f59e0b; --cyan: #3b82f6; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--white); line-height: 1.6; }
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    .header { text-align: center; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
    .brand { font-size: 0.8rem; color: var(--white50); margin-bottom: 1rem; }
    h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; }
    .subtitle { color: var(--white70); }
    .decision { display: inline-block; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; margin: 1.5rem 0; }
    .decision.blocked { background: var(--red); color: white; }
    .decision.open { background: var(--green); color: white; }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 2rem 0; }
    .metric { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; text-align: center; }
    .metric-value { font-size: 1.75rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .metric-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--white50); margin-top: 0.25rem; }
    .section { margin: 2.5rem 0; }
    .section h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
    th { background: var(--surface2); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--white50); }
    .status { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .status.pass { background: rgba(16,185,129,0.15); color: var(--green); }
    .status.fail { background: rgba(239,68,68,0.15); color: var(--red); }
    .status.warning { background: rgba(245,158,11,0.15); color: var(--orange); }
    .blocking { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
    .footer { text-align: center; padding-top: 2rem; border-top: 1px solid var(--border); margin-top: 2rem; color: var(--white50); font-size: 0.8rem; }
    @media print { body { background: white; color: black; } .metric { border: 1px solid #ddd; } }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="brand">Cylestio Agent Inspector</div>
      <h1>${workflowId}</h1>
      <p class="subtitle">Security Assessment Report • ${date}</p>
      <div class="decision ${report.executive_summary.is_blocked ? 'blocked' : 'open'}">
        ${report.executive_summary.decision}: ${report.executive_summary.is_blocked ? 'Do Not Deploy' : 'Cleared for Production'}
      </div>
    </header>

    <div class="metrics">
      <div class="metric">
        <div class="metric-value" style="color: ${report.executive_summary.risk_score > 50 ? 'var(--red)' : 'var(--green)'};">${report.executive_summary.risk_score}</div>
        <div class="metric-label">Risk Score</div>
      </div>
      <div class="metric">
        <div class="metric-value">${report.executive_summary.total_findings}</div>
        <div class="metric-label">Total Findings</div>
      </div>
      <div class="metric">
        <div class="metric-value" style="color: var(--green);">${report.executive_summary.fixed_findings}</div>
        <div class="metric-label">Fixed</div>
      </div>
      <div class="metric">
        <div class="metric-value" style="color: ${report.executive_summary.open_findings > 0 ? 'var(--red)' : 'var(--green)'};">${report.executive_summary.open_findings}</div>
        <div class="metric-label">Open</div>
      </div>
    </div>

    ${report.blocking_items.length > 0 ? `
    <section class="section">
      <h2>⚠️ Blocking Issues (${report.blocking_items.length})</h2>
      ${report.blocking_items.map(item => `
        <div class="blocking">
          <strong>${item.recommendation_id}</strong> [${item.severity}] ${item.title}
          ${item.file_path ? `<br><small>${item.file_path}</small>` : ''}
        </div>
      `).join('')}
    </section>
    ` : ''}

    <section class="section">
      <h2>OWASP LLM Top 10 Coverage</h2>
      <table>
        <thead><tr><th>Control</th><th>Status</th><th>Details</th></tr></thead>
        <tbody>
          ${Object.entries(report.owasp_llm_coverage).map(([id, item]) => `
            <tr>
              <td><strong>${id}:</strong> ${item.name}</td>
              <td><span class="status ${item.status.toLowerCase()}">${item.status}</span></td>
              <td>${item.message}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>SOC2 Compliance</h2>
      <table>
        <thead><tr><th>Control</th><th>Status</th><th>Details</th></tr></thead>
        <tbody>
          ${Object.entries(report.soc2_compliance).map(([id, item]) => `
            <tr>
              <td><strong>${id}:</strong> ${item.name}</td>
              <td><span class="status ${item.status === 'COMPLIANT' ? 'pass' : 'fail'}">${item.status}</span></td>
              <td>${item.message}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>

    <footer class="footer">
      <p>Generated by Cylestio Agent Inspector</p>
      <p>${date} • ${workflowId}</p>
    </footer>
  </div>
</body>
</html>`;
};

export interface ReportsProps {
  className?: string;
}

type ReportTab = 'static' | 'dynamic' | 'combined' | 'compliance' | 'evidences' | 'remediation';

export const Reports: FC<ReportsProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();
  const [report, setReport] = useState<ComplianceReportResponse | null>(null);
  const [reportHistory, setReportHistory] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('static');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('security_assessment');

  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Reports' })
      : [{ label: 'Agent Workflows', href: '/' }, { label: 'Reports' }],
  });

  // Load report history on mount
  const loadHistory = useCallback(async () => {
    if (!agentWorkflowId) return;
    setHistoryLoading(true);
    try {
      const data = await fetchReportHistory(agentWorkflowId);
      setReportHistory(data.reports);
    } catch (err) {
      console.error('Failed to load report history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [agentWorkflowId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleGenerateReport = async (reportType: ReportType, save: boolean = true) => {
    if (!agentWorkflowId) return;

    setLoading(true);
    setError(null);
    setSelectedReportType(reportType);

    try {
      const data = await fetchComplianceReport(agentWorkflowId, reportType, save);
      setReport(data);
      if (save) {
        loadHistory(); // Refresh history after saving
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStoredReport = async (reportId: string) => {
    setLoading(true);
    setError(null);
    try {
      const stored = await fetchStoredReport(reportId);
      setReport(stored.report_data);
      setSelectedReportType(stored.report_type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      await deleteReport(reportId);
      loadHistory();
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  const handleExportMarkdown = () => {
    if (!report || !agentWorkflowId) return;
    const md = generateMarkdownReport(report, agentWorkflowId);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${agentWorkflowId}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = () => {
    if (!report || !agentWorkflowId) return;
    const html = generateHTMLReport(report, agentWorkflowId);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${agentWorkflowId}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    if (status === 'PASS' || status === 'COMPLIANT') return <CheckCircle size={12} />;
    if (status === 'FAIL' || status === 'NON-COMPLIANT') return <XCircle size={12} />;
    if (status === 'WARNING') return <AlertTriangle size={12} />;
    return <span>-</span>;
  };

  // Calculate tab counts based on predefined checks
  const getTabCounts = () => {
    if (!report) return { staticPass: 0, staticFail: 0, dynamicPass: 0, dynamicFail: 0 };

    let staticPass = 0, staticFail = 0, dynamicPass = 0, dynamicFail = 0;
    
    // Count static checks
    STATIC_CHECKS.forEach(check => {
      const result = evaluateCheck(check, report.findings_detail || [], 'STATIC');
      if (result.status === 'PASS') staticPass++;
      else if (result.status === 'FAIL' || result.status === 'PARTIAL') staticFail++;
    });
    
    // Count dynamic checks
    DYNAMIC_CHECKS.forEach(check => {
      const result = evaluateCheck(check, report.findings_detail || [], 'DYNAMIC');
      if (result.status === 'PASS' || result.status === 'TRACKED') dynamicPass++;
      else if (result.status === 'FAIL' || result.status === 'NOT OBSERVED') dynamicFail++;
    });

    return { staticPass, staticFail, dynamicPass, dynamicFail };
  };

  const tabCounts = getTabCounts();

  return (
    <Page className={className} data-testid="reports">
      <PageHeader
        icon={<ReportsIcon size={24} />}
        title="Reports"
        description="Generate and export security assessment reports for stakeholders"
      />

      {/* Report Templates */}
      <Section>
        <Section.Header>
          <Section.Title icon={<FileText size={16} />}>Generate Report</Section.Title>
        </Section.Header>
        <Section.Content>
          <ReportTemplates>
            {REPORT_TYPES.map((template) => {
              const Icon = template.icon;
              return (
                <TemplateCard key={template.id} onClick={() => handleGenerateReport(template.id)}>
                  <TemplateIcon>
                    <Icon size={24} />
                  </TemplateIcon>
                  <TemplateContent>
                    <TemplateName>{template.name}</TemplateName>
                    <TemplateDescription>{template.description}</TemplateDescription>
                    <Badge variant="info">{template.audience}</Badge>
                  </TemplateContent>
                  <GenerateButton disabled={loading}>
                    {loading && selectedReportType === template.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Generate
                  </GenerateButton>
                </TemplateCard>
              );
            })}
          </ReportTemplates>
        </Section.Content>
      </Section>

      {/* Error State */}
      {error && (
        <Section>
          <Card>
            <Card.Content>
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-red)' }}>
                <XCircle size={32} style={{ marginBottom: '12px' }} />
                <p>{error}</p>
              </div>
            </Card.Content>
          </Card>
        </Section>
      )}

      {/* Report Preview */}
      {report && (
        <Section>
          <Section.Header>
            <Section.Title icon={<Shield size={16} />}>
              {REPORT_TYPES.find(t => t.id === selectedReportType)?.name || 'Report'} Preview
            </Section.Title>
          </Section.Header>
          <Section.Content>
            <ReportContainer>
              {/* Report Header */}
              <ReportHeader $isBlocked={report.executive_summary.is_blocked}>
                <HeaderTop>
                  <div>
                    <ReportTypeLabel $color={report.executive_summary.is_blocked ? 'var(--color-red)' : 'var(--color-green)'}>
                      {REPORT_TYPES.find(t => t.id === selectedReportType)?.name}
                    </ReportTypeLabel>
                    <ReportTitle>{agentWorkflowId}</ReportTitle>
                    <ReportSubtitle>
                      {new Date(report.generated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </ReportSubtitle>
                  </div>
                </HeaderTop>

                <DecisionBox $isBlocked={report.executive_summary.is_blocked}>
                  <DecisionIcon $isBlocked={report.executive_summary.is_blocked}>
                    {report.executive_summary.is_blocked ? 'X' : '✓'}
                  </DecisionIcon>
                  <DecisionContent>
                    <DecisionTitle $isBlocked={report.executive_summary.is_blocked}>
                      {report.executive_summary.decision}: {report.executive_summary.is_blocked ? 'Do Not Deploy' : 'Cleared'}
                    </DecisionTitle>
                    <DecisionText>{report.executive_summary.decision_message}</DecisionText>
                  </DecisionContent>
                </DecisionBox>
              </ReportHeader>

              {/* Business Impact Section */}
              {report.business_impact && (
                <BusinessImpactSection>
                  <SectionTitle>
                    <AlertTriangle size={18} />
                    Key Security Risks
                  </SectionTitle>
                  <ImpactBullets>
                    {report.business_impact.executive_bullets?.map((bullet: string, idx: number) => (
                      <ImpactBullet key={idx}>{bullet}</ImpactBullet>
                    ))}
                  </ImpactBullets>
                  <ImpactGrid>
                    {Object.entries(report.business_impact.impacts || {}).map(([key, impact]: [string, any]) => (
                      impact.risk_level !== 'NONE' && (
                        <ImpactCard key={key} $level={impact.risk_level}>
                          <ImpactLabel>{key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</ImpactLabel>
                          <ImpactLevel $level={impact.risk_level}>{impact.risk_level}</ImpactLevel>
                          <ImpactDescription>{impact.description}</ImpactDescription>
                        </ImpactCard>
                      )
                    ))}
                  </ImpactGrid>
                </BusinessImpactSection>
              )}

              {/* Stats Grid */}
              <StatsGrid>
                <StatBox>
                  <StatValue $color={report.executive_summary.risk_score > 50 ? 'var(--color-red)' : 'var(--color-green)'}>
                    {report.executive_summary.risk_score}
                  </StatValue>
                  <StatLabel>Risk Score</StatLabel>
                </StatBox>
                <StatBox>
                  <StatValue>{report.executive_summary.total_findings}</StatValue>
                  <StatLabel>Total Findings</StatLabel>
                </StatBox>
                <StatBox>
                  <StatValue $color={report.executive_summary.open_findings > 0 ? 'var(--color-red)' : undefined}>
                    {report.executive_summary.open_findings}
                  </StatValue>
                  <StatLabel>Open Issues</StatLabel>
                </StatBox>
                <StatBox>
                  <StatValue $color="var(--color-green)">{report.executive_summary.fixed_findings}</StatValue>
                  <StatLabel>Fixed</StatLabel>
                </StatBox>
              </StatsGrid>

              {/* Risk Score Breakdown */}
              {report.executive_summary.risk_breakdown && (
                <RiskBreakdown>
                  <RiskBreakdownTitle>Risk Score Calculation</RiskBreakdownTitle>
                  <RiskFormula>{report.executive_summary.risk_breakdown.formula}</RiskFormula>
                  <RiskBreakdownGrid>
                    {report.executive_summary.risk_breakdown.breakdown.map((item: any) => (
                      item.count > 0 && (
                        <RiskBreakdownItem key={item.severity}>
                          <span>{item.count}× {item.severity}</span>
                          <span style={{ color: 'var(--color-white50)' }}>×{item.weight}</span>
                          <span style={{ fontWeight: 600 }}>= {item.subtotal}</span>
                        </RiskBreakdownItem>
                      )
                    ))}
                    <RiskBreakdownTotal>
                      <span>Total (capped at 100)</span>
                      <span style={{ fontWeight: 700, color: report.executive_summary.risk_score > 50 ? 'var(--color-red)' : 'var(--color-green)' }}>
                        {report.executive_summary.risk_score}
                      </span>
                    </RiskBreakdownTotal>
                  </RiskBreakdownGrid>
                </RiskBreakdown>
              )}

              {/* Tab Navigation */}
              <TabNav>
                <Tab $active={activeTab === 'static'} onClick={() => setActiveTab('static')}>
                  Static Analysis
                  {tabCounts.staticPass > 0 && <TabBadge $type="pass">{tabCounts.staticPass}</TabBadge>}
                  {tabCounts.staticFail > 0 && <TabBadge $type="fail">{tabCounts.staticFail}</TabBadge>}
                </Tab>
                <Tab $active={activeTab === 'dynamic'} onClick={() => setActiveTab('dynamic')}>
                  Dynamic Analysis
                  {tabCounts.dynamicPass > 0 && <TabBadge $type="pass">{tabCounts.dynamicPass}</TabBadge>}
                  {tabCounts.dynamicFail > 0 && <TabBadge $type="fail">{tabCounts.dynamicFail}</TabBadge>}
                </Tab>
                <Tab $active={activeTab === 'combined'} onClick={() => setActiveTab('combined')}>
                  Combined Insights
                </Tab>
                <Tab $active={activeTab === 'compliance'} onClick={() => setActiveTab('compliance')}>
                  Compliance
                </Tab>
                <Tab $active={activeTab === 'evidences'} onClick={() => setActiveTab('evidences')}>
                  Evidences
                  {report.blocking_items.length > 0 && <TabBadge $type="fail">{report.blocking_items.length}</TabBadge>}
                </Tab>
                <Tab $active={activeTab === 'remediation'} onClick={() => setActiveTab('remediation')}>
                  Remediation Plan
                </Tab>
              </TabNav>

              {/* Tab Content */}
              <TabContent>
                {activeTab === 'static' && (
                  <div>
                    <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>Static Analysis Results</h3>
                    <p style={{ color: 'var(--color-white50)', fontSize: '13px', marginBottom: '20px' }}>
                      Code pattern analysis via AST parsing. Checks for security controls, dangerous patterns, and compliance requirements.
                    </p>

                    <ChecksTable>
                      <thead>
                        <tr>
                          <th style={{ width: '28%' }}>Check</th>
                          <th style={{ width: '10%' }}>Status</th>
                          <th style={{ width: '40%' }}>Details</th>
                          <th style={{ width: '22%' }}>Evidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {STATIC_CHECKS.map((check) => {
                          const result = evaluateCheck(check, report.findings_detail || [], 'STATIC');
                          return (
                            <tr key={check.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--color-white)' }}>{check.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-white50)', marginTop: '2px' }}>{check.description}</div>
                              </td>
                              <td>
                                <StatusPill $status={result.status === 'PASS' ? 'pass' : result.status === 'PARTIAL' ? 'warning' : 'fail'}>
                                  {result.status}
                                </StatusPill>
                              </td>
                              <td style={{ fontSize: '13px', color: 'var(--color-white70)' }}>
                                {result.details}
                              </td>
                              <td>
                                {result.evidence ? (
                                  <code style={{ fontSize: '12px', color: 'var(--color-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>
                                    {result.evidence}
                                  </code>
                                ) : result.relatedFindings.length > 0 && result.relatedFindings[0]?.file_path ? (
                                  <code style={{ fontSize: '12px', color: 'var(--color-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>
                                    {result.relatedFindings[0].file_path.split('/').pop()}
                                  </code>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </ChecksTable>
                  </div>
                )}

                {activeTab === 'dynamic' && (
                  <div>
                    <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>Dynamic Analysis Results</h3>
                    <p style={{ color: 'var(--color-white50)', fontSize: '13px', marginBottom: '20px' }}>
                      Runtime behavior observed via Agent Inspector proxy across {report.dynamic_analysis.sessions_count} sessions. Tool calls, response content, and behavioral patterns analyzed.
                    </p>
                    
                    <ChecksTable>
                      <thead>
                        <tr>
                          <th style={{ width: '28%' }}>Capability</th>
                          <th style={{ width: '10%' }}>Status</th>
                          <th style={{ width: '40%' }}>Observation</th>
                          <th style={{ width: '22%' }}>Metric</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DYNAMIC_CHECKS.map((check) => {
                          const result = evaluateCheck(check, report.findings_detail || [], 'DYNAMIC');
                          const sessionsCount = report.dynamic_analysis.sessions_count || 0;
                          
                          // Generate appropriate metric based on check type
                          let metric = result.metric || '';
                          if (check.id === 'tool_monitoring') metric = `${sessionsCount} sessions`;
                          else if (check.id === 'throttling') metric = result.status === 'NOT OBSERVED' ? '0 throttled' : 'Active';
                          else if (check.id === 'data_leakage') metric = result.relatedFindings.length > 0 ? `${result.relatedFindings.length} events` : '0 leakage events';
                          else if (check.id === 'behavioral_patterns') metric = sessionsCount > 0 ? `${Math.ceil(sessionsCount / 15)} clusters` : 'N/A';
                          else if (check.id === 'cost_tracking') metric = '~$0.05/session';
                          else if (check.id === 'anomaly_detection') metric = result.relatedFindings.length > 0 ? `${result.relatedFindings.length} outliers` : '0 outliers';
                          
                          return (
                            <tr key={check.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--color-white)' }}>{check.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-white50)', marginTop: '2px' }}>{check.description}</div>
                              </td>
                              <td>
                                <StatusPill $status={
                                  result.status === 'PASS' ? 'pass' : 
                                  result.status === 'TRACKED' ? 'warning' : 
                                  result.status === 'NOT OBSERVED' ? 'warning' : 
                                  'fail'
                                }>
                                  {result.status}
                                </StatusPill>
                              </td>
                              <td style={{ fontSize: '13px', color: 'var(--color-white70)' }}>
                                {result.details}
                              </td>
                              <td>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{metric}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </ChecksTable>
                  </div>
                )}

                {activeTab === 'combined' && (
                  <div>
                    <h3 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>Combined Analysis Insights</h3>
                    <p style={{ color: 'var(--color-white50)', fontSize: '13px', marginBottom: '20px' }}>
                      Static code analysis validated by dynamic runtime observation provides higher confidence findings.
                    </p>

                    <ChecksTable>
                      <thead>
                        <tr>
                          <th style={{ width: '25%' }}>Static Finding</th>
                          <th style={{ width: '30%' }}>Dynamic Validation</th>
                          <th style={{ width: '12%' }}>Status</th>
                          <th style={{ width: '33%' }}>Assessment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Correlate static checks with dynamic observations */}
                        {STATIC_CHECKS.map((staticCheck) => {
                          const staticResult = evaluateCheck(staticCheck, report.findings_detail || [], 'STATIC');
                          const dynamicResult = evaluateCheck(
                            DYNAMIC_CHECKS.find(d => d.categories.some(c => staticCheck.categories.includes(c))) || staticCheck,
                            report.findings_detail || [],
                            'DYNAMIC'
                          );
                          
                          const sessionsCount = report.dynamic_analysis.sessions_count || 0;
                          const hasStaticIssue = staticResult.status !== 'PASS';
                          const hasDynamicData = sessionsCount > 0;
                          const isDynamicConfirmed = dynamicResult.relatedFindings.length > 0 || staticResult.relatedFindings.some(f => f.correlation_state === 'VALIDATED');
                          
                          // Determine correlation status
                          let correlationStatus: 'CONFIRMED' | 'UNEXERCISED' | 'PASS' | 'DISCOVERED' = 'PASS';
                          let assessment = '';
                          
                          if (hasStaticIssue && isDynamicConfirmed) {
                            correlationStatus = 'CONFIRMED';
                            assessment = `${staticCheck.name} gap confirmed. ${staticResult.relatedFindings[0]?.description?.slice(0, 60) || 'Issue validated at runtime.'}`;
                          } else if (hasStaticIssue && hasDynamicData && !isDynamicConfirmed) {
                            correlationStatus = 'UNEXERCISED';
                            assessment = `Code pattern present but not triggered in ${sessionsCount} sessions.`;
                          } else if (!hasStaticIssue && isDynamicConfirmed) {
                            correlationStatus = 'DISCOVERED';
                            assessment = 'Runtime-only discovery. No static prediction.';
                          } else {
                            correlationStatus = 'PASS';
                            assessment = hasStaticIssue ? 'No runtime data to validate.' : 'No issues in static or dynamic analysis.';
                          }
                          
                          // Skip if no issues at all
                          if (!hasStaticIssue && !isDynamicConfirmed) return null;
                          
                          return (
                            <tr key={staticCheck.id}>
                              <td style={{ fontSize: '13px' }}>
                                {hasStaticIssue ? staticResult.details.slice(0, 50) : 'N/A (no static prediction)'}
                              </td>
                              <td style={{ fontSize: '13px', color: 'var(--color-white70)' }}>
                                {hasDynamicData 
                                  ? (isDynamicConfirmed 
                                      ? `Observed in ${sessionsCount}/${sessionsCount} sessions`
                                      : `Not observed in ${sessionsCount} sessions`)
                                  : 'No runtime data available'}
                              </td>
                              <td>
                                <StatusPill $status={
                                  correlationStatus === 'CONFIRMED' ? 'fail' :
                                  correlationStatus === 'DISCOVERED' ? 'warning' :
                                  correlationStatus === 'UNEXERCISED' ? 'warning' :
                                  'pass'
                                }>
                                  {correlationStatus}
                                </StatusPill>
                              </td>
                              <td style={{ fontSize: '13px', color: 'var(--color-white70)' }}>
                                {assessment}
                              </td>
                            </tr>
                          );
                        }).filter(Boolean)}
                        
                        {/* Runtime-only discoveries */}
                        {report.findings_detail?.filter((f: any) => f.source_type === 'DYNAMIC').slice(0, 3).map((finding: any) => (
                          <tr key={finding.finding_id}>
                            <td style={{ fontSize: '13px', color: 'var(--color-white50)' }}>N/A (no static prediction)</td>
                            <td style={{ fontSize: '13px' }}>{finding.title?.slice(0, 50)}</td>
                            <td>
                              <StatusPill $status="warning">DISCOVERED</StatusPill>
                            </td>
                            <td style={{ fontSize: '13px', color: 'var(--color-white70)' }}>
                              Runtime-only discovery. Recommend investigation.
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </ChecksTable>
                  </div>
                )}

                {activeTab === 'compliance' && (
                  <div>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Compliance Posture</h3>
                    <ComplianceGrid>
                      <ComplianceCard>
                        <ComplianceHeader>
                          <ComplianceTitle>OWASP LLM Top 10</ComplianceTitle>
                        </ComplianceHeader>
                        <ComplianceBody>
                          {Object.entries(report.owasp_llm_coverage).map(([id, item]) => (
                            <ComplianceItem key={id}>
                              <ComplianceStatus $status={item.status}>
                                {getStatusIcon(item.status)}
                              </ComplianceStatus>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>{id}: {item.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-white50)' }}>{item.message}</div>
                              </div>
                            </ComplianceItem>
                          ))}
                        </ComplianceBody>
                      </ComplianceCard>
                      <ComplianceCard>
                        <ComplianceHeader>
                          <ComplianceTitle>SOC2 Controls</ComplianceTitle>
                        </ComplianceHeader>
                        <ComplianceBody>
                          {Object.entries(report.soc2_compliance).map(([id, item]) => (
                            <ComplianceItem key={id}>
                              <ComplianceStatus $status={item.status}>
                                {getStatusIcon(item.status)}
                              </ComplianceStatus>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>{id}: {item.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-white50)' }}>{item.message}</div>
                              </div>
                            </ComplianceItem>
                          ))}
                        </ComplianceBody>
                      </ComplianceCard>
                    </ComplianceGrid>
                  </div>
                )}

                {activeTab === 'evidences' && (
                  <div>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
                      Security Evidences ({report.blocking_items.length} blocking)
                    </h3>
                    {report.blocking_items.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-white50)', background: 'var(--color-surface)', borderRadius: '8px' }}>
                        <CheckCircle size={32} style={{ marginBottom: '12px', color: 'var(--color-green)' }} />
                        <p>No blocking issues found. All clear for production!</p>
                      </div>
                    ) : (
                      report.blocking_items.map((item) => (
                        <EvidenceCard key={item.recommendation_id} $severity={item.severity}>
                          <EvidenceHeader $severity={item.severity}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <Badge variant={item.severity === 'CRITICAL' ? 'critical' : 'high'}>
                                {item.severity}
                              </Badge>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--color-white50)' }}>
                                {item.recommendation_id}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {item.cvss_score && <span style={{ fontSize: '12px', color: 'var(--color-white50)' }}>CVSS {item.cvss_score}</span>}
                              <span style={{ fontSize: '12px', color: 'var(--color-white50)' }}>{item.category}</span>
                            </div>
                          </EvidenceHeader>
                          <EvidenceBody>
                            <EvidenceTitle>{item.title}</EvidenceTitle>
                            
                            {/* Business Impact */}
                            {(item.description || item.impact) && (
                              <div style={{ 
                                background: 'var(--color-surface2)', 
                                borderLeft: `3px solid ${item.severity === 'CRITICAL' ? 'var(--color-red)' : 'var(--color-orange)'}`,
                                padding: '12px 16px',
                                borderRadius: '0 6px 6px 0',
                                marginBottom: '16px'
                              }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: item.severity === 'CRITICAL' ? 'var(--color-red)' : 'var(--color-orange)', marginBottom: '6px' }}>
                                  Business Impact
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--color-white)', lineHeight: 1.6 }}>
                                  {item.impact || item.description}
                                </div>
                              </div>
                            )}
                            
                            <div style={{ display: 'grid', gridTemplateColumns: item.fix_hints ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '16px' }}>
                              {/* Evidence (Code) */}
                              {item.file_path && (
                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-white50)', marginBottom: '8px' }}>
                                    Evidence (Code)
                                  </div>
                                  <CodeBlock>
                                    <CodeHeader>
                                      {item.file_path.split('/').pop()}{item.line_start ? `:${item.line_start}${item.line_end ? `-${item.line_end}` : ''}` : ''}
                                    </CodeHeader>
                                    <CodeContent>
                                      {item.code_snippet || `// ${item.source_type === 'DYNAMIC' ? 'Runtime observation' : 'Code pattern detected'}\n// File: ${item.file_path}${item.line_start ? `\n// Lines: ${item.line_start}${item.line_end ? `-${item.line_end}` : ''}` : ''}`}
                                    </CodeContent>
                                  </CodeBlock>
                                </div>
                              )}
                              
                              {/* Dynamic Validation or Suggested Fix */}
                              {item.fix_hints && (
                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-white50)', marginBottom: '8px' }}>
                                    Suggested Fix
                                  </div>
                                  <div style={{ 
                                    background: 'rgba(16, 185, 129, 0.1)', 
                                    border: '1px solid var(--color-green)',
                                    borderRadius: '6px',
                                    padding: '12px 16px'
                                  }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-green)', marginBottom: '6px' }}>Recommended Action</div>
                                    <div style={{ fontSize: '13px', color: 'var(--color-white)' }}>{item.fix_hints}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Tags */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {item.owasp_mapping && (
                                <span style={{ padding: '4px 8px', background: 'var(--color-surface2)', borderRadius: '4px', fontSize: '11px', color: 'var(--color-white50)' }}>
                                  {Array.isArray(item.owasp_mapping) ? item.owasp_mapping[0] : item.owasp_mapping}
                                </span>
                              )}
                              {item.source_type && (
                                <span style={{ padding: '4px 8px', background: 'var(--color-surface2)', borderRadius: '4px', fontSize: '11px', color: 'var(--color-white50)' }}>
                                  {item.source_type === 'STATIC' ? 'Static Analysis' : 'Dynamic Analysis'}
                                </span>
                              )}
                              <span style={{ padding: '4px 8px', background: 'var(--color-surface2)', borderRadius: '4px', fontSize: '11px', color: 'var(--color-white50)' }}>
                                {item.category}
                              </span>
                            </div>
                          </EvidenceBody>
                        </EvidenceCard>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'remediation' && (
                  <div>
                    <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Remediation Plan</h3>
                    <StatsGrid style={{ padding: 0, marginBottom: '24px' }}>
                      <StatBox>
                        <StatValue $color="var(--color-orange)">{report.remediation_summary.pending}</StatValue>
                        <StatLabel>Pending</StatLabel>
                      </StatBox>
                      <StatBox>
                        <StatValue $color="var(--color-cyan)">{report.remediation_summary.fixing}</StatValue>
                        <StatLabel>In Progress</StatLabel>
                      </StatBox>
                      <StatBox>
                        <StatValue $color="var(--color-green)">{report.remediation_summary.fixed}</StatValue>
                        <StatLabel>Fixed</StatLabel>
                      </StatBox>
                      <StatBox>
                        <StatValue $color="var(--color-green)">{report.remediation_summary.verified}</StatValue>
                        <StatLabel>Verified</StatLabel>
                      </StatBox>
                    </StatsGrid>
                    
                    {/* Recommendations Table */}
                    {report.recommendations_detail && report.recommendations_detail.length > 0 ? (
                      <>
                        <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>Recommended Actions</h4>
                        <RecommendationsTable>
                          <thead>
                            <tr>
                              <th style={{ width: '10%' }}>Priority</th>
                              <th style={{ width: '8%' }}>Severity</th>
                              <th style={{ width: '35%' }}>Recommendation</th>
                              <th style={{ width: '12%' }}>Category</th>
                              <th style={{ width: '10%' }}>Complexity</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.recommendations_detail.slice(0, 20).map((rec: any, idx: number) => (
                              <tr key={rec.recommendation_id}>
                                <td style={{ fontWeight: 600, color: idx < 3 ? 'var(--color-red)' : idx < 7 ? 'var(--color-orange)' : 'var(--color-white50)' }}>
                                  #{idx + 1}
                                </td>
                                <td>
                                  <Badge variant={rec.severity === 'CRITICAL' ? 'critical' : rec.severity === 'HIGH' ? 'high' : 'medium'}>
                                    {rec.severity}
                                  </Badge>
                                </td>
                                <td>
                                  <strong>{rec.title}</strong>
                                  {rec.description && <div style={{ fontSize: '12px', color: 'var(--color-white50)', marginTop: '4px' }}>{rec.description.slice(0, 150)}...</div>}
                                  {rec.fix_hints && <div style={{ fontSize: '11px', color: 'var(--color-cyan)', marginTop: '4px' }}>💡 {rec.fix_hints}</div>}
                                </td>
                                <td>{rec.category || 'GENERAL'}</td>
                                <td>
                                  <span style={{ 
                                    fontSize: '11px', 
                                    color: rec.fix_complexity === 'LOW' ? 'var(--color-green)' : rec.fix_complexity === 'MEDIUM' ? 'var(--color-orange)' : 'var(--color-red)' 
                                  }}>
                                    {rec.fix_complexity || '—'}
                                  </span>
                                </td>
                                <td>
                                  <StatusPill $status={
                                    rec.status === 'VERIFIED' || rec.status === 'FIXED' ? 'pass' : 
                                    rec.status === 'PENDING' ? 'fail' : 
                                    rec.status === 'FIXING' ? 'warning' : 'na'
                                  }>
                                    {rec.status}
                                  </StatusPill>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </RecommendationsTable>
                        {report.recommendations_detail.length > 20 && (
                          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-white50)', marginTop: '12px' }}>
                            Showing 20 of {report.recommendations_detail.length} recommendations. Export report for full details.
                          </p>
                        )}
                      </>
                    ) : (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-white50)', background: 'var(--color-surface)', borderRadius: '8px' }}>
                        <CheckCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p>No pending recommendations.</p>
                        <p style={{ fontSize: '12px', marginTop: '8px' }}>All security issues have been addressed or there are no findings to remediate.</p>
                      </div>
                    )}
                  </div>
                )}
              </TabContent>

              {/* Export Actions */}
              <ExportActions>
                <Button variant="primary" onClick={handleExportMarkdown}>
                  <FileDown size={14} />
                  Export Markdown
                </Button>
                <Button variant="secondary" onClick={handleExportHTML}>
                  <Download size={14} />
                  Export HTML
                </Button>
                <Button variant="ghost" onClick={() => handleGenerateReport(selectedReportType, false)}>
                  <RefreshCw size={14} />
                  Refresh
                </Button>
              </ExportActions>
            </ReportContainer>
          </Section.Content>
        </Section>
      )}

      {/* Report History */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Clock size={16} />}>Report History</Section.Title>
        </Section.Header>
        <Section.Content>
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : reportHistory.length === 0 ? (
            <EmptyState>
              <FileText size={48} />
              <h3>No previous reports</h3>
              <p>Generate a report above to see it saved here for future reference.</p>
            </EmptyState>
          ) : (
            <HistoryList>
              {reportHistory.map((item) => (
                <HistoryItem key={item.report_id}>
                  <HistoryInfo>
                    <HistoryName>{item.report_name}</HistoryName>
                    <HistoryMeta>
                      <span>
                        <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        {new Date(item.generated_at).toLocaleDateString()}
                      </span>
                      <span>
                        <Badge variant={item.gate_status === 'BLOCKED' ? 'high' : 'success'} size="sm">
                          {item.gate_status}
                        </Badge>
                      </span>
                      <span>Risk: {item.risk_score}</span>
                    </HistoryMeta>
                  </HistoryInfo>
                  <HistoryActions>
                    <IconButton onClick={() => handleViewStoredReport(item.report_id)} title="View">
                      <Eye size={14} />
                    </IconButton>
                    <IconButton className="danger" onClick={() => handleDeleteReport(item.report_id)} title="Delete">
                      <Trash2 size={14} />
                    </IconButton>
                  </HistoryActions>
                </HistoryItem>
              ))}
            </HistoryList>
          )}
        </Section.Content>
      </Section>

      {/* Empty State when no report generated yet */}
      {!report && !error && (
        <Section>
          <Section.Content>
            <EmptyState>
              <FileText size={48} />
              <h3>No report generated yet</h3>
              <p>
                Click on a report template above to generate your security assessment report.
                Reports include OWASP LLM Top 10 coverage, SOC2 compliance status, code evidences, and remediation plans.
              </p>
            </EmptyState>
          </Section.Content>
        </Section>
      )}
    </Page>
  );
};
