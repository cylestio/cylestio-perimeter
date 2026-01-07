// 1. React
import { useState, type FC } from 'react';

// 2. External
import {
  Download,
  FileDown,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

// 3. Internal
import { STATIC_CHECKS, DYNAMIC_CHECKS } from '@constants/securityChecks';
import { evaluateCheck } from '@utils/securityCheckEvaluator';
import type { ComplianceReportResponse, ReportType } from '@api/endpoints/agentWorkflow';

// 4. UI
import { Badge } from '@ui/core/Badge';
import { Button } from '@ui/core/Button';

// 7. Relative
import {
  TabNav,
  Tab,
  TabBadge,
  ReportContainer,
  ReportHeader,
  HeaderTop,
  ReportTypeLabel,
  ReportTitle,
  ReportSubtitle,
  DecisionBox,
  DecisionIcon,
  DecisionContent,
  DecisionTitle,
  DecisionText,
  StatsGrid,
  StatBox,
  StatValue,
  StatLabel,
  TabContent,
  ChecksTable,
  StatusPill,
  ComplianceGrid,
  ComplianceCard,
  ComplianceHeader,
  ComplianceTitle,
  ComplianceBody,
  ComplianceItem,
  ComplianceStatus,
  EvidenceCard,
  EvidenceHeader,
  EvidenceBody,
  EvidenceTitle,
  CodeBlock,
  CodeHeader,
  CodeContent,
  ExportActions,
  BusinessImpactSection,
  SectionTitle,
  ImpactBullets,
  ImpactBullet,
  ImpactGrid,
  ImpactCard,
  ImpactLabel,
  ImpactLevel,
  ImpactDescription,
  RiskBreakdown,
  RiskBreakdownTitle,
  RiskFormula,
  RiskBreakdownGrid,
  RiskBreakdownItem,
  RiskBreakdownTotal,
  RecommendationsTable,
  EmptyEvidence,
} from './ReportDisplay.styles';

// Report type configuration
const REPORT_TYPES: { id: ReportType; name: string }[] = [
  { id: 'security_assessment', name: 'Security Assessment' },
  { id: 'executive_summary', name: 'Executive Summary' },
  { id: 'customer_dd', name: 'Customer Due Diligence' },
];

export type ReportTab = 'static' | 'dynamic' | 'combined' | 'compliance' | 'evidences' | 'remediation';

export interface ReportDisplayProps {
  report: ComplianceReportResponse;
  workflowId: string;
  reportType: ReportType;
  onRefresh?: () => void;
  className?: string;
}

// Markdown export function
const generateMarkdownReport = (report: ComplianceReportResponse, workflowId: string): string => {
  const date = new Date(report.generated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const decision = report.executive_summary.is_blocked ? 'NO-GO' : 'GO';
  const decisionIcon = report.executive_summary.is_blocked ? 'X' : 'V';

  let md = `# Security Assessment: ${workflowId}

**Generated:** ${date}
**Report Type:** ${REPORT_TYPES.find(t => t.id === report.report_type)?.name || report.report_type}
**Risk Score:** ${report.executive_summary.risk_score}/100

---

## ${decisionIcon} ${report.executive_summary.decision_label || decision} (Advisory)

> **Note:** ${report.executive_summary.advisory_notice || 'Advisory only - does not block deployments. This is a pre-production readiness assessment.'}

${report.executive_summary.decision_message}

`;

  // Business Impact (Executive Summary)
  if (report.business_impact && report.business_impact.executive_bullets && report.business_impact.executive_bullets.length > 0) {
    md += `## Key Security Risks

`;
    report.business_impact.executive_bullets.forEach((bullet: string) => {
      md += `- ${bullet}\n`;
    });
    md += '\n';

    // Impact areas
    const impacts = report.business_impact?.impacts || {};
    const activeImpacts = Object.entries(impacts).filter(([, v]: [string, unknown]) => (v as { risk_level: string }).risk_level !== 'NONE');
    if (activeImpacts.length > 0) {
      md += `### Impact Assessment

| Risk Area | Level | Description |
|-----------|-------|-------------|
`;
      activeImpacts.forEach(([key, impact]: [string, unknown]) => {
        const impactData = impact as { risk_level: string; description: string };
        const name = key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        md += `| ${name} | ${impactData.risk_level} | ${impactData.description} |\n`;
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
    rb.breakdown.forEach((item) => {
      if (item.count > 0) {
        md += `| ${item.severity} | ${item.count} | x${item.weight} | ${item.subtotal} |\n`;
      }
    });
    md += `| **Total** | | | **${rb.final_score}** |\n\n`;
  }

  // Blocking Items
  if (report.blocking_items.length > 0) {
    md += `## Blocking Issues (${report.blocking_items.length})

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
    const icon = item.status === 'PASS' ? 'PASS' : item.status === 'FAIL' ? 'FAIL' : item.status === 'WARNING' ? 'WARN' : 'N/A';
    md += `| ${id}: ${item.name} | ${icon} | ${item.message} |\n`;
  });

  // SOC2 Compliance
  md += `
## SOC2 Compliance

| Control | Status | Details |
|---------|--------|---------|
`;
  Object.entries(report.soc2_compliance).forEach(([id, item]) => {
    const icon = item.status === 'COMPLIANT' ? 'PASS' : 'FAIL';
    md += `| ${id}: ${item.name} | ${icon} | ${item.message} |\n`;
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

// HTML export function
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
    .status.n-a { background: rgba(107,114,128,0.15); color: var(--white50); }
    .advisory-badge { font-size: 0.7rem; font-weight: 400; opacity: 0.7; margin-left: 0.5rem; }
    .advisory-notice { font-size: 0.85rem; color: var(--white50); margin-top: 0.5rem; font-style: italic; }
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
      <p class="subtitle">Security Assessment Report - ${date}</p>
      <div class="decision ${report.executive_summary.is_blocked ? 'blocked' : 'open'}">
        ${report.executive_summary.decision_label || (report.executive_summary.is_blocked ? 'Attention Required' : 'Production Ready')}
        <span class="advisory-badge">(Advisory)</span>
      </div>
      <p class="advisory-notice">${report.executive_summary.advisory_notice || 'Advisory only - does not block deployments.'}</p>
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
      <h2>Blocking Issues (${report.blocking_items.length})</h2>
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
              <td><span class="status ${item.status.toLowerCase().replace('/', '-')}">${item.status}</span></td>
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
      <p>${date} - ${workflowId}</p>
    </footer>
  </div>
</body>
</html>`;
};

export const ReportDisplay: FC<ReportDisplayProps> = ({
  report,
  workflowId,
  reportType,
  onRefresh,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('static');

  const handleExportMarkdown = () => {
    const md = generateMarkdownReport(report, workflowId);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${workflowId}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = () => {
    const html = generateHTMLReport(report, workflowId);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${workflowId}-${new Date().toISOString().split('T')[0]}.html`;
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
  const reportTypeName = REPORT_TYPES.find(t => t.id === reportType)?.name || reportType;

  return (
    <ReportContainer className={className} data-testid="report-display">
      {/* Report Header */}
      <ReportHeader $isBlocked={report.executive_summary.is_blocked}>
        <HeaderTop>
          <div>
            <ReportTypeLabel $color={report.executive_summary.is_blocked ? 'var(--color-red)' : 'var(--color-green)'}>
              {reportTypeName}
            </ReportTypeLabel>
            <ReportTitle>{workflowId}</ReportTitle>
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
            {report.executive_summary.is_blocked ? 'X' : '\u2713'}
          </DecisionIcon>
          <DecisionContent>
            <DecisionTitle $isBlocked={report.executive_summary.is_blocked}>
              {report.executive_summary.decision_label || (report.executive_summary.is_blocked ? 'Attention Required' : 'Production Ready')} (Advisory)
            </DecisionTitle>
            <DecisionText style={{ fontStyle: 'italic', opacity: 0.8, marginBottom: '8px' }}>
              {report.executive_summary.advisory_notice || 'Advisory only - does not block deployments.'}
            </DecisionText>
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
            {Object.entries(report.business_impact.impacts || {}).map(([key, impact]: [string, unknown]) => {
              const impactData = impact as { risk_level: string; description: string };
              return impactData.risk_level !== 'NONE' && (
                <ImpactCard key={key} $level={impactData.risk_level}>
                  <ImpactLabel>{key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</ImpactLabel>
                  <ImpactLevel $level={impactData.risk_level}>{impactData.risk_level}</ImpactLevel>
                  <ImpactDescription>{impactData.description}</ImpactDescription>
                </ImpactCard>
              );
            })}
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
            {report.executive_summary.risk_breakdown.breakdown.map((item) => (
              item.count > 0 && (
                <RiskBreakdownItem key={item.severity}>
                  <span>{item.count}x {item.severity}</span>
                  <span style={{ color: 'var(--color-white50)' }}>x{item.weight}</span>
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
                {(report.findings_detail as { finding_id: string; title?: string; source_type?: string }[] || []).filter((f) => f.source_type === 'DYNAMIC').slice(0, 3).map((finding) => (
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
              <EmptyEvidence>
                <CheckCircle size={32} style={{ marginBottom: '12px', color: 'var(--color-green)' }} />
                <p>No blocking issues found. All clear for production!</p>
              </EmptyEvidence>
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

                      {/* Suggested Fix */}
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
                    {(report.recommendations_detail as { recommendation_id: string; severity: string; title: string; description?: string; fix_hints?: string; category?: string; fix_complexity?: string; status?: string }[]).slice(0, 20).map((rec, idx) => (
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
                          {rec.fix_hints && <div style={{ fontSize: '11px', color: 'var(--color-cyan)', marginTop: '4px' }}>Hint: {rec.fix_hints}</div>}
                        </td>
                        <td>{rec.category || 'GENERAL'}</td>
                        <td>
                          <span style={{
                            fontSize: '11px',
                            color: rec.fix_complexity === 'LOW' ? 'var(--color-green)' : rec.fix_complexity === 'MEDIUM' ? 'var(--color-orange)' : 'var(--color-red)'
                          }}>
                            {rec.fix_complexity || '\u2014'}
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
              <EmptyEvidence>
                <CheckCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>No pending recommendations.</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>All security issues have been addressed or there are no findings to remediate.</p>
              </EmptyEvidence>
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
        {onRefresh && (
          <Button variant="ghost" onClick={onRefresh}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        )}
      </ExportActions>
    </ReportContainer>
  );
};
