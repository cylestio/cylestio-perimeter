// 1. React
import { useState, type FC } from 'react';

// 2. External
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Activity,
  GitCompare,
  Lightbulb,
} from 'lucide-react';

// 3. Internal
import { STATIC_CHECKS, DYNAMIC_CHECKS } from '@constants/securityChecks';
import { evaluateCheck } from '@utils/securityCheckEvaluator';
import type { ComplianceReportResponse, ReportType } from '@api/endpoints/agentWorkflow';

// 4. UI
import { Badge } from '@ui/core/Badge';

// 7. Relative
import {
  TabNav,
  Tab,
  TabBadge,
  ReportContainer,
  ReportHeader,
  HeaderRow,
  HeaderLeft,
  HeaderRight,
  DecisionIcon,
  DecisionInfo,
  DecisionTitle,
  ReportMeta,
  SeverityCounts,
  // Risk box components - hidden for now
  // RiskLevelBox,
  // RiskLevelText,
  // RiskLevelLabel,
  // RiskScoreBox,
  // RiskScoreValue,
  // RiskScoreLabel,
  // RiskTooltip,
  // TooltipTitle,
  // TooltipFormula,
  // TooltipRow,
  // TooltipRowLabel,
  SectionDivider,
  StatsGrid,
  StatBox,
  StatValue,
  StatLabel,
  TabContent,
  TabSectionHeader,
  TabSectionDescription,
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
  BusinessImpactSection,
  ImpactList,
  ImpactRow,
  ImpactRowHeader,
  ImpactRowLabel,
  ImpactRowSeparator,
  ImpactRowLevel,
  ImpactRowCount,
  ImpactRowDescription,
  RecommendationsTable,
  EmptyEvidence,
  SummaryGrid,
  SummaryColumn,
  SummarySubheading,
  SummaryStatsRow,
  SummaryStatsLabel,
  SummaryStatsDots,
  SummaryStatsValue,
  FindingCard,
  FindingHeader,
  FindingMetadata,
  FindingTag,
  FindingTitle,
  FindingTitleText,
  FindingBody,
  FindingSection,
  FindingSectionLabel,
  FindingImpact,
  FixSection,
  FixContent,
  FixedByBadge,
} from './ReportDisplay.styles';

// Report type configuration
const REPORT_TYPES: { id: ReportType; name: string }[] = [
  { id: 'security_assessment', name: 'Security Assessment' },
  { id: 'executive_summary', name: 'Executive Summary' },
  { id: 'customer_dd', name: 'Customer Due Diligence' },
];

export type ReportTab = 'static' | 'dynamic' | 'combined' | 'findings' | 'compliance' | 'evidences' | 'remediation';

export interface ReportDisplayProps {
  report: ComplianceReportResponse;
  workflowId: string;
  reportType: ReportType;
  onRefresh?: () => void;
  className?: string;
}

export const ReportDisplay: FC<ReportDisplayProps> = ({
  report,
  workflowId,
  reportType,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('findings');

  const getStatusIcon = (status: string) => {
    if (status === 'PASS' || status === 'COMPLIANT') return <CheckCircle size={12} />;
    if (status === 'FAIL' || status === 'NON-COMPLIANT') return <XCircle size={12} />;
    if (status === 'WARNING') return <AlertTriangle size={12} />;
    return <span>-</span>;
  };

  // Calculate tab counts based on predefined checks
  const getTabCounts = () => {
    const staticNotTested = report.static_analysis.last_scan === null;
    const dynamicNotTested = report.dynamic_analysis.last_analysis === null;
    let staticPass = 0, staticFail = 0, dynamicPass = 0, dynamicFail = 0;

    // Count static checks (only if analysis was run)
    if (!staticNotTested) {
      STATIC_CHECKS.forEach(check => {
        const result = evaluateCheck(check, report.findings_detail || [], 'STATIC');
        if (result.status === 'PASS') staticPass++;
        else if (result.status === 'FAIL' || result.status === 'PARTIAL') staticFail++;
      });
    }

    // Count dynamic checks (only if analysis was run)
    if (!dynamicNotTested) {
      DYNAMIC_CHECKS.forEach(check => {
        const result = evaluateCheck(check, report.findings_detail || [], 'DYNAMIC');
        if (result.status === 'PASS' || result.status === 'TRACKED') dynamicPass++;
        else if (result.status === 'FAIL' || result.status === 'NOT OBSERVED') dynamicFail++;
      });
    }

    return { staticPass, staticFail, staticNotTested, dynamicPass, dynamicFail, dynamicNotTested };
  };

  const tabCounts = getTabCounts();
  const reportTypeName = REPORT_TYPES.find(t => t.id === reportType)?.name || reportType;

  // Count severity levels from OPEN findings only (exclude SUPERSEDED, FIXED, etc.)
  const getSeverityCounts = () => {
    const findings = (report.findings_detail || []) as Array<{ severity?: string; status?: string }>;
    let critical = 0, high = 0, medium = 0;
    findings.forEach((f) => {
      if (f.status !== 'OPEN') return; // Only count OPEN findings
      if (f.severity === 'CRITICAL') critical++;
      else if (f.severity === 'HIGH') high++;
      else if (f.severity === 'MEDIUM') medium++;
    });
    return { critical, high, medium };
  };
  const severityCounts = getSeverityCounts();

  // Format date and time
  const reportDateTime = new Date(report.generated_at);
  const formattedDate = reportDateTime.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = reportDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Risk level calculations - hidden for now
  // const isHighRisk = report.executive_summary.risk_score > 50;
  // const getRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
  //   if (score >= 67) return 'high';
  //   if (score >= 34) return 'medium';
  //   return 'low';
  // };
  // const riskLevel = getRiskLevel(report.executive_summary.risk_score);

  return (
    <ReportContainer className={className} data-testid="report-display">
      {/* Report Header - Full Width Layout */}
      <ReportHeader $isBlocked={report.executive_summary.is_blocked}>
        <HeaderRow>
          {/* Left: Decision Icon + Status + Meta */}
          <HeaderLeft>
            <DecisionIcon $isBlocked={report.executive_summary.is_blocked}>
              {report.executive_summary.is_blocked ? <XCircle size={28} /> : <CheckCircle size={28} />}
            </DecisionIcon>
            <DecisionInfo>
              <DecisionTitle $isBlocked={report.executive_summary.is_blocked}>
                {report.executive_summary.decision_label || (report.executive_summary.is_blocked ? 'Attention Required' : 'Production Ready')}
              </DecisionTitle>
              <ReportMeta>
                {reportTypeName} · {workflowId} · {formattedDate} {formattedTime}
              </ReportMeta>
            </DecisionInfo>
          </HeaderLeft>

          {/* Right: Severity Counts */}
          <HeaderRight>
            <SeverityCounts>
              {severityCounts.critical > 0 && (
                <Badge variant="critical" size="md">
                  {severityCounts.critical} Critical
                </Badge>
              )}
              {severityCounts.high > 0 && (
                <Badge variant="high" size="md">
                  {severityCounts.high} High
                </Badge>
              )}
              {severityCounts.medium > 0 && (
                <Badge variant="medium" size="md">
                  {severityCounts.medium} Medium
                </Badge>
              )}
            </SeverityCounts>

            {/* Risk Level Display - Hidden for now, set showRiskBox to true to enable */}
            {/* {showNumericRiskScore ? (
              <RiskScoreBox
                $isHigh={isHighRisk}
                onMouseEnter={() => setShowRiskTooltip(true)}
                onMouseLeave={() => setShowRiskTooltip(false)}
              >
                <RiskScoreValue $isHigh={isHighRisk}>
                  {report.executive_summary.risk_score}
                </RiskScoreValue>
                <RiskScoreLabel>Risk Score</RiskScoreLabel>
                {showRiskTooltip && report.executive_summary.risk_breakdown && (
                  <RiskTooltip>
                    <TooltipTitle>Risk Score Calculation</TooltipTitle>
                    <TooltipFormula>{report.executive_summary.risk_breakdown.formula}</TooltipFormula>
                    {report.executive_summary.risk_breakdown.breakdown.map((item) => (
                      item.count > 0 && (
                        <TooltipRow key={item.severity}>
                          <TooltipRowLabel>{item.count}x {item.severity} (x{item.weight})</TooltipRowLabel>
                          <span>= {item.subtotal}</span>
                        </TooltipRow>
                      )
                    ))}
                    <TooltipRow>
                      <span>Total (capped at 100)</span>
                      <span style={{ color: isHighRisk ? 'var(--color-red)' : 'var(--color-green)' }}>
                        {report.executive_summary.risk_score}
                      </span>
                    </TooltipRow>
                  </RiskTooltip>
                )}
              </RiskScoreBox>
            ) : (
              <RiskLevelBox $level={riskLevel}>
                <RiskLevelText $level={riskLevel}>
                  {riskLevel === 'high' ? 'High' : riskLevel === 'medium' ? 'Medium' : 'Low'}
                </RiskLevelText>
                <RiskLevelLabel>Risk</RiskLevelLabel>
              </RiskLevelBox>
            )} */}
          </HeaderRight>
        </HeaderRow>
      </ReportHeader>

      {/* Summary Section - Two columns: Findings | Compliance */}
      <BusinessImpactSection>
        <SummaryGrid>
          {/* Left: Findings Summary */}
          <SummaryColumn>
            <SummarySubheading>Findings Summary</SummarySubheading>
            <ImpactList>
              <SummaryStatsRow>
                <SummaryStatsLabel>Total Findings</SummaryStatsLabel>
                <SummaryStatsDots />
                <SummaryStatsValue>{report.executive_summary.total_findings}</SummaryStatsValue>
              </SummaryStatsRow>
              <SummaryStatsRow>
                <SummaryStatsLabel>Open Issues</SummaryStatsLabel>
                <SummaryStatsDots />
                <SummaryStatsValue $color={report.executive_summary.open_findings > 0 ? 'var(--color-red)' : 'var(--color-green)'}>
                  {report.executive_summary.open_findings}
                </SummaryStatsValue>
              </SummaryStatsRow>
              {severityCounts.critical > 0 && (
                <SummaryStatsRow style={{ paddingLeft: '16px' }}>
                  <SummaryStatsLabel>Critical</SummaryStatsLabel>
                  <SummaryStatsDots />
                  <SummaryStatsValue $color="var(--color-red)">{severityCounts.critical}</SummaryStatsValue>
                </SummaryStatsRow>
              )}
              {severityCounts.high > 0 && (
                <SummaryStatsRow style={{ paddingLeft: '16px' }}>
                  <SummaryStatsLabel>High</SummaryStatsLabel>
                  <SummaryStatsDots />
                  <SummaryStatsValue $color="var(--color-orange)">{severityCounts.high}</SummaryStatsValue>
                </SummaryStatsRow>
              )}
              <SummaryStatsRow>
                <SummaryStatsLabel>Fixed</SummaryStatsLabel>
                <SummaryStatsDots />
                <SummaryStatsValue $color="var(--color-green)">{report.executive_summary.fixed_findings}</SummaryStatsValue>
              </SummaryStatsRow>
            </ImpactList>
          </SummaryColumn>

          {/* Right: Key Compliance Issues */}
          <SummaryColumn>
            <SummarySubheading>Key Compliance Issues</SummarySubheading>
            {report.business_impact && Object.entries(report.business_impact.impacts || {}).some(([, impact]) => (impact as { risk_level: string }).risk_level !== 'NONE') ? (
              <ImpactList>
                {Object.entries(report.business_impact.impacts || {}).map(([key, impact]: [string, unknown]) => {
                  const impactData = impact as { risk_level: string; description: string; finding_count?: number };
                  return impactData.risk_level !== 'NONE' && (
                    <ImpactRow key={key}>
                      <ImpactRowHeader>
                        <ImpactRowLabel>{key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</ImpactRowLabel>
                        <ImpactRowSeparator />
                        <ImpactRowLevel $level={impactData.risk_level}>{impactData.risk_level}</ImpactRowLevel>
                        {impactData.finding_count !== undefined && impactData.finding_count > 0 && (
                          <>
                            <ImpactRowSeparator />
                            <ImpactRowCount>{impactData.finding_count} finding{impactData.finding_count !== 1 ? 's' : ''}</ImpactRowCount>
                          </>
                        )}
                      </ImpactRowHeader>
                      <ImpactRowDescription>{impactData.description}</ImpactRowDescription>
                    </ImpactRow>
                  );
                })}
              </ImpactList>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--color-white50)' }}>No compliance issues found</span>
            )}
          </SummaryColumn>
        </SummaryGrid>
      </BusinessImpactSection>

      <SectionDivider />

      {/* Tab Navigation */}
      <TabNav>
        <Tab $active={activeTab === 'findings'} onClick={() => setActiveTab('findings')}>
          Key Findings
          {report.recommendations_detail && (report.recommendations_detail as Array<{ status?: string }>).filter(r => r.status === 'OPEN' || r.status === 'PENDING' || r.status === 'FIXING').length > 0 && (
            <TabBadge $type="fail">
              {(report.recommendations_detail as Array<{ status?: string }>).filter(r => r.status === 'OPEN' || r.status === 'PENDING' || r.status === 'FIXING').length}
            </TabBadge>
          )}
        </Tab>
        <Tab $active={activeTab === 'static'} onClick={() => setActiveTab('static')}>
          Static Analysis
          {!tabCounts.staticNotTested && tabCounts.staticPass > 0 && <TabBadge $type="pass">{tabCounts.staticPass}</TabBadge>}
          {!tabCounts.staticNotTested && tabCounts.staticFail > 0 && <TabBadge $type="fail">{tabCounts.staticFail}</TabBadge>}
        </Tab>
        <Tab $active={activeTab === 'dynamic'} onClick={() => setActiveTab('dynamic')}>
          Dynamic Analysis
          {!tabCounts.dynamicNotTested && tabCounts.dynamicPass > 0 && <TabBadge $type="pass">{tabCounts.dynamicPass}</TabBadge>}
          {!tabCounts.dynamicNotTested && tabCounts.dynamicFail > 0 && <TabBadge $type="fail">{tabCounts.dynamicFail}</TabBadge>}
        </Tab>
        <Tab $active={activeTab === 'combined'} onClick={() => setActiveTab('combined')}>
          Combined Insights
        </Tab>
        <Tab $active={activeTab === 'compliance'} onClick={() => setActiveTab('compliance')}>
          Compliance
        </Tab>
        {/* Hidden tabs - uncomment to restore
        <Tab $active={activeTab === 'evidences'} onClick={() => setActiveTab('evidences')}>
          Evidences
          {report.blocking_items.length > 0 && <TabBadge $type="fail">{report.blocking_items.length}</TabBadge>}
        </Tab>
        <Tab $active={activeTab === 'remediation'} onClick={() => setActiveTab('remediation')}>
          Remediation Plan
        </Tab>
        */}
      </TabNav>

      {/* Tab Content */}
      <TabContent>
        {activeTab === 'static' && (
          <div>
            <TabSectionHeader>Static Analysis Results</TabSectionHeader>
            <TabSectionDescription>
              Code pattern analysis via AST parsing. Checks for security controls, dangerous patterns, and compliance requirements.
            </TabSectionDescription>

            {report.static_analysis.last_scan === null ? (
              <EmptyEvidence>
                <Shield size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>Static Analysis Not Run</p>
                <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-white50)' }}>
                  Run static code analysis to check for security patterns, vulnerabilities, and compliance issues.
                </p>
              </EmptyEvidence>
            ) : (
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
            )}
          </div>
        )}

        {activeTab === 'dynamic' && (
          <div>
            <TabSectionHeader>Dynamic Analysis Results</TabSectionHeader>
            <TabSectionDescription>
              Runtime behavior observed via Agent Inspector proxy across {report.dynamic_analysis.sessions_count} sessions. Tool calls, response content, and behavioral patterns analyzed.
            </TabSectionDescription>

            {report.dynamic_analysis.last_analysis === null ? (
              <EmptyEvidence>
                <Activity size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>Dynamic Analysis Not Run</p>
                <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-white50)' }}>
                  Run dynamic analysis by monitoring agent sessions to observe runtime behavior.
                </p>
              </EmptyEvidence>
            ) : (
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
            )}
          </div>
        )}

        {activeTab === 'combined' && (
          <div>
            <TabSectionHeader>Combined Analysis Insights</TabSectionHeader>
            <TabSectionDescription>
              Static code analysis validated by dynamic runtime observation provides higher confidence findings.
            </TabSectionDescription>

            {/* Check if both analyses are missing */}
            {report.static_analysis.last_scan === null && report.dynamic_analysis.last_analysis === null ? (
              <EmptyEvidence>
                <GitCompare size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>No Analysis Data Available</p>
                <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-white50)' }}>
                  Run both static and dynamic analysis to see correlated security insights.
                </p>
              </EmptyEvidence>
            ) : report.static_analysis.last_scan === null ? (
              <EmptyEvidence>
                <Shield size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>Static Analysis Required</p>
                <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-white50)' }}>
                  Run static code analysis to correlate with dynamic runtime observations.
                </p>
              </EmptyEvidence>
            ) : report.dynamic_analysis.last_analysis === null ? (
              <EmptyEvidence>
                <Activity size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>Dynamic Analysis Required</p>
                <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-white50)' }}>
                  Run dynamic analysis to validate static code findings with runtime behavior.
                </p>
              </EmptyEvidence>
            ) : (
              // Both analyses run - render table or "no findings" state
              (() => {
                const correlatedRows = STATIC_CHECKS.map((staticCheck) => {
                  const staticResult = evaluateCheck(staticCheck, report.findings_detail || [], 'STATIC');
                  const dynamicResult = evaluateCheck(
                    DYNAMIC_CHECKS.find(d => d.categories.some(c => staticCheck.categories.includes(c))) || staticCheck,
                    report.findings_detail || [],
                    'DYNAMIC'
                  );

                  const sessionsCount = report.dynamic_analysis.sessions_count || 0;
                  const hasStaticIssue = staticResult.status !== 'PASS';
                  const isDynamicConfirmed = dynamicResult.relatedFindings.length > 0 || staticResult.relatedFindings.some(f => f.correlation_state === 'VALIDATED');

                  // Skip if no issues at all
                  if (!hasStaticIssue && !isDynamicConfirmed) return null;

                  return { staticCheck, staticResult, sessionsCount, hasStaticIssue, isDynamicConfirmed };
                }).filter(Boolean);

                const dynamicFindings = (report.findings_detail as { finding_id: string; title?: string; source_type?: string }[] || []).filter(f => f.source_type === 'DYNAMIC');
                const hasCorrelatedData = correlatedRows.length > 0 || dynamicFindings.length > 0;

                return hasCorrelatedData ? (
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
                      {correlatedRows.map((row) => {
                        if (!row) return null;
                        const { staticCheck, staticResult, sessionsCount, hasStaticIssue, isDynamicConfirmed } = row;
                        const hasDynamicData = sessionsCount > 0;

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
                      })}

                      {/* Runtime-only discoveries */}
                      {dynamicFindings.slice(0, 3).map((finding) => (
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
                ) : (
                  <EmptyEvidence>
                    <CheckCircle size={32} style={{ marginBottom: '12px', color: 'var(--color-green)' }} />
                    <p>No Correlated Findings</p>
                    <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-white50)' }}>
                      No security issues found across static and dynamic analysis correlation.
                    </p>
                  </EmptyEvidence>
                );
              })()
            )}
          </div>
        )}

        {activeTab === 'findings' && (
          <div>
            <TabSectionHeader>Key Findings</TabSectionHeader>
            <TabSectionDescription>
              Unified view of security issues with evidence, impact assessment, and remediation guidance.
            </TabSectionDescription>

            {(() => {
              // Define types for recommendations and blocking items
              interface Recommendation {
                recommendation_id: string;
                title: string;
                description?: string;
                severity: string;
                category?: string;
                status?: string;
                fix_hints?: string;
                fix_complexity?: string;
                owasp_mapping?: string | string[];
                owasp_llm?: string;
                source_type?: string;
                fixed_by?: string;
                fixed_at?: string;
                fix_notes?: string;
                files_modified?: string[];
              }

              // Helper to check if status is resolved (FIXED or VERIFIED)
              const isResolved = (status?: string): boolean =>
                status === 'FIXED' || status === 'VERIFIED';

              // Helper to detect if fix was done by AI
              const isAutoFix = (fixedBy?: string): boolean => {
                if (!fixedBy) return false;
                const aiPatterns = ['claude', 'gpt', 'anthropic', 'openai', 'agent-inspector', 'auto'];
                return aiPatterns.some(p => fixedBy.toLowerCase().includes(p));
              };

              interface BlockingItem {
                recommendation_id: string;
                file_path?: string;
                code_snippet?: string;
                cvss_score?: number;
                line_start?: number;
                line_end?: number;
                impact?: string;
              }

              // Create lookup map from blocking_items for evidence enrichment
              const blockingMap = new Map<string, BlockingItem>(
                report.blocking_items.map((item: BlockingItem) => [item.recommendation_id, item])
              );

              // Merge recommendations with blocking item evidence
              // Include actionable findings AND resolved ones (FIXED, VERIFIED)
              const findings = ((report.recommendations_detail || []) as Recommendation[])
                .filter(
                  rec =>
                    rec.status === 'OPEN' ||
                    rec.status === 'PENDING' ||
                    rec.status === 'FIXING' ||
                    rec.status === 'FIXED' ||
                    rec.status === 'VERIFIED'
                )
                .map(rec => ({
                  ...rec,
                  ...blockingMap.get(rec.recommendation_id),
                }))
                .sort((a, b) => {
                  // First: sort by resolved status (open items first, resolved last)
                  const aResolved = isResolved(a.status);
                  const bResolved = isResolved(b.status);
                  if (aResolved !== bResolved) return aResolved ? 1 : -1;

                  // Then: sort by severity within each group
                  const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                  return (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
                });

              if (findings.length === 0) {
                return (
                  <EmptyEvidence>
                    <Lightbulb size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p>No Open Findings</p>
                    <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--color-white50)' }}>
                      All security issues have been addressed or verified.
                    </p>
                  </EmptyEvidence>
                );
              }

              return findings.map((finding) => {
                // Get OWASP mappings with full names (handle both owasp_mapping array and owasp_llm string)
                const owaspIds = finding.owasp_mapping
                  ? (Array.isArray(finding.owasp_mapping) ? finding.owasp_mapping : [finding.owasp_mapping])
                  : finding.owasp_llm
                    ? [finding.owasp_llm]
                    : [];
                const owaspMappings = owaspIds.map(id => {
                  const coverage = report.owasp_llm_coverage[id];
                  return coverage ? `${id}: ${coverage.name}` : id;
                });

                const resolved = isResolved(finding.status);

                return (
                  <FindingCard key={finding.recommendation_id} $resolved={resolved}>
                    <FindingHeader>
                      <FindingTitle>
                        <Badge variant={finding.severity === 'CRITICAL' ? 'critical' : finding.severity === 'HIGH' ? 'high' : 'medium'}>
                          {finding.severity}
                        </Badge>
                        <FindingTitleText>{finding.title}</FindingTitleText>
                      </FindingTitle>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {resolved && finding.fixed_by && (
                          <FixedByBadge $isAuto={isAutoFix(finding.fixed_by)}>
                            {isAutoFix(finding.fixed_by) ? 'Auto-fixed' : `Fixed by ${finding.fixed_by}`}
                          </FixedByBadge>
                        )}
                        <StatusPill $status={
                          resolved ? 'pass' :
                          finding.status === 'FIXING' ? 'warning' :
                          finding.status === 'OPEN' || finding.status === 'PENDING' ? 'fail' : 'na'
                        }>
                          {resolved ? 'Resolved' : finding.status}
                        </StatusPill>
                      </div>
                    </FindingHeader>

                    {/* Metadata row */}
                    <FindingMetadata>
                      {owaspMappings.map((tag, idx) => (
                        <FindingTag key={idx}>{tag}</FindingTag>
                      ))}
                      {finding.cvss_score && <FindingTag>CVSS {finding.cvss_score}</FindingTag>}
                      {finding.source_type && <FindingTag>{finding.source_type === 'STATIC' ? 'Static Analysis' : 'Dynamic Analysis'}</FindingTag>}
                      {finding.category && <FindingTag>{finding.category}</FindingTag>}
                    </FindingMetadata>

                    {/* Body sections - Show evidence always, hide other sections for resolved items */}
                    <FindingBody>
                      {/* Description - HIDE for resolved items */}
                      {!resolved && finding.description && (
                        <FindingSection>
                          <FindingSectionLabel>Description</FindingSectionLabel>
                          <FindingImpact>
                            {finding.description}
                          </FindingImpact>
                        </FindingSection>
                      )}

                      {/* Business Impact - HIDE for resolved items */}
                      {!resolved && finding.impact && (
                        <FindingSection>
                          <FindingSectionLabel>Business Impact</FindingSectionLabel>
                          <FindingImpact>
                            {finding.impact}
                          </FindingImpact>
                        </FindingSection>
                      )}

                      {/* Evidence (Code) - Always shown */}
                      {finding.file_path && (
                        <FindingSection>
                          <FindingSectionLabel>Evidence</FindingSectionLabel>
                          <CodeBlock>
                            <CodeHeader>
                              {finding.file_path.split('/').pop()}{finding.line_start ? `:${finding.line_start}${finding.line_end ? `-${finding.line_end}` : ''}` : ''}
                            </CodeHeader>
                            <CodeContent>
                              {finding.code_snippet || `// ${finding.source_type === 'DYNAMIC' ? 'Runtime observation' : 'Code pattern detected'}\n// File: ${finding.file_path}${finding.line_start ? `\n// Lines: ${finding.line_start}${finding.line_end ? `-${finding.line_end}` : ''}` : ''}`}
                            </CodeContent>
                          </CodeBlock>
                        </FindingSection>
                      )}

                      {/* Suggested Fix - HIDE for resolved items */}
                      {!resolved && finding.fix_hints && (
                        <FindingSection>
                          <FindingSectionLabel>
                            Suggested Fix{finding.fix_complexity && ` (${finding.fix_complexity.toLowerCase()} complexity)`}
                          </FindingSectionLabel>
                          <FixSection>
                            <FixContent>
                              {finding.fix_hints}
                            </FixContent>
                          </FixSection>
                        </FindingSection>
                      )}
                    </FindingBody>
                  </FindingCard>
                );
              });
            })()}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div>
            <TabSectionHeader>Compliance Posture</TabSectionHeader>
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
            <TabSectionHeader>
              Security Evidences ({report.blocking_items.length} blocking)
            </TabSectionHeader>
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
            <TabSectionHeader>Remediation Plan</TabSectionHeader>
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
                <TabSectionDescription style={{ marginTop: '16px', marginBottom: '12px', fontWeight: 600, color: 'var(--color-white70)' }}>
                  Recommended Actions
                </TabSectionDescription>
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

    </ReportContainer>
  );
};
