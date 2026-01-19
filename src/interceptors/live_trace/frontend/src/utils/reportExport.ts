import type { ComplianceReportResponse, BlockingItem } from '@api/endpoints/agentWorkflow';

// Extended type for recommendations with all available fields
interface RecommendationDetail extends BlockingItem {
  status?: string;
  fix_complexity?: string;
  owasp_llm?: string;
  fixed_by?: string;
  fixed_at?: string;
  fix_notes?: string;
  files_modified?: string[];
}

/**
 * Generate a Markdown report from compliance report data.
 */
export function generateMarkdownReport(report: ComplianceReportResponse, workflowId: string): string {
  const date = new Date(report.generated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const criticalCount = report.blocking_items.filter(item => item.severity === 'CRITICAL').length;

  const decision = report.executive_summary.is_blocked ? 'ATTENTION REQUIRED' : 'PRODUCTION READY';
  const decisionIcon = report.executive_summary.is_blocked ? '⚠️' : '✅';

  let md = `# Security Assessment: ${workflowId}

**CYLESTIO | AGENT INSPECTOR**

*${date}*

---

## ${decisionIcon} ${report.executive_summary.decision_label || decision}

`;

  md += `## Summary

| Metric | Value |
|--------|-------|
| Critical | ${criticalCount} |
| Total Findings | ${report.executive_summary.total_findings} |
| Fixed | ${report.executive_summary.fixed_findings} |
| Open | ${report.executive_summary.open_findings} |

`;

  md += `## OWASP LLM Top 10 Coverage

| Control | Status | Details |
|---------|--------|---------|
`;
  Object.entries(report.owasp_llm_coverage).forEach(([id, item]) => {
    const icon = item.status === 'PASS' ? 'PASS' : item.status === 'FAIL' ? 'FAIL' : item.status === 'WARNING' ? 'WARN' : 'N/A';
    md += `| ${id}: ${item.name} | ${icon} | ${item.message} |\n`;
  });

  md += `
## SOC2 Compliance

| Control | Status | Details |
|---------|--------|---------|
`;
  Object.entries(report.soc2_compliance).forEach(([id, item]) => {
    const icon = item.status === 'COMPLIANT' ? 'PASS' : 'FAIL';
    md += `| ${id}: ${item.name} | ${icon} | ${item.message} |\n`;
  });

  if (report.blocking_items.length > 0) {
    md += `
## Key Findings (${report.blocking_items.length})

`;
    report.blocking_items.forEach(item => {
      const owaspMapping = item.owasp_mapping
        ? (Array.isArray(item.owasp_mapping) ? item.owasp_mapping[0] : item.owasp_mapping)
        : null;

      const fileLocation = item.file_path
        ? `${item.file_path}${item.line_start ? `:${item.line_start}${item.line_end ? `-${item.line_end}` : ''}` : ''}`
        : null;

      md += `### ${owaspMapping ? `[${owaspMapping}] ` : ''}${item.title}\n`;
      md += `**${item.severity}** · ${item.category}\n`;
      if (fileLocation) md += `\`${fileLocation}\`\n`;
      if (item.description) {
        md += `\n${item.description}\n`;
      }
      md += '\n---\n\n';
    });
  }

  md += `
*CYLESTIO | AGENT INSPECTOR · ${date} · ${workflowId}*
`;

  return md;
}

/**
 * Generate a full Markdown report with all findings (all severities).
 */
export function generateFullMarkdownReport(report: ComplianceReportResponse, workflowId: string): string {
  const date = new Date(report.generated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const criticalCount = report.blocking_items.filter(item => item.severity === 'CRITICAL').length;
  const recommendations = (report.recommendations_detail || []) as RecommendationDetail[];

  const decision = report.executive_summary.is_blocked ? 'ATTENTION REQUIRED' : 'PRODUCTION READY';
  const decisionIcon = report.executive_summary.is_blocked ? '⚠️' : '✅';

  let md = `# Security Assessment: ${workflowId}

**CYLESTIO | AGENT INSPECTOR**

*${date}*

---

## ${decisionIcon} ${report.executive_summary.decision_label || decision}

`;

  md += `## Summary

| Metric | Value |
|--------|-------|
| Critical | ${criticalCount} |
| Total Findings | ${report.executive_summary.total_findings} |
| Fixed | ${report.executive_summary.fixed_findings} |
| Open | ${report.executive_summary.open_findings} |

`;

  md += `## OWASP LLM Top 10 Coverage

| Control | Status | Details |
|---------|--------|---------|
`;
  Object.entries(report.owasp_llm_coverage).forEach(([id, item]) => {
    const icon = item.status === 'PASS' ? 'PASS' : item.status === 'FAIL' ? 'FAIL' : item.status === 'WARNING' ? 'WARN' : 'N/A';
    md += `| ${id}: ${item.name} | ${icon} | ${item.message} |\n`;
  });

  md += `
## SOC2 Compliance

| Control | Status | Details |
|---------|--------|---------|
`;
  Object.entries(report.soc2_compliance).forEach(([id, item]) => {
    const icon = item.status === 'COMPLIANT' ? 'PASS' : 'FAIL';
    md += `| ${id}: ${item.name} | ${icon} | ${item.message} |\n`;
  });

  if (recommendations.length > 0) {
    md += `
## All Findings (${recommendations.length})

`;
    recommendations.forEach(item => {
      const owaspMapping = item.owasp_mapping
        ? (Array.isArray(item.owasp_mapping) ? item.owasp_mapping[0] : item.owasp_mapping)
        : item.owasp_llm || null;

      const fileLocation = item.file_path
        ? `${item.file_path}${item.line_start ? `:${item.line_start}${item.line_end ? `-${item.line_end}` : ''}` : ''}`
        : null;

      md += `### ${owaspMapping ? `[${owaspMapping}] ` : ''}${item.title}\n`;
      md += `**${item.severity}** · ${item.category}${item.status ? ` · Status: ${item.status}` : ''}\n`;
      if (fileLocation) md += `\`${fileLocation}\`\n`;
      if (item.description) {
        md += `\n${item.description}\n`;
      }
      if (item.impact) {
        md += `\n**Business Impact:** ${item.impact}\n`;
      }
      if (item.code_snippet) {
        md += `\n\`\`\`\n${item.code_snippet}\n\`\`\`\n`;
      }
      if (item.fix_hints) {
        md += `\n**Suggested Fix${item.fix_complexity ? ` (${item.fix_complexity.toLowerCase()} complexity)` : ''}:** ${item.fix_hints}\n`;
      }
      if (item.cvss_score) {
        md += `\n**CVSS Score:** ${item.cvss_score}\n`;
      }
      if (item.fixed_by) {
        md += `\n**Fixed by:** ${item.fixed_by}${item.fixed_at ? ` on ${new Date(item.fixed_at).toLocaleDateString()}` : ''}\n`;
      }
      if (item.fix_notes) {
        md += `**Fix Notes:** ${item.fix_notes}\n`;
      }
      md += '\n---\n\n';
    });
  }

  md += `
*CYLESTIO | AGENT INSPECTOR · ${date} · ${workflowId}*
`;

  return md;
}

/**
 * Generate an HTML report from compliance report data.
 */
export function generateHTMLReport(report: ComplianceReportResponse, workflowId: string): string {
  const date = new Date(report.generated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const criticalCount = report.blocking_items.filter(item => item.severity === 'CRITICAL').length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Assessment: ${workflowId} | Cylestio Agent Inspector</title>
  <style>
    :root { --bg: #0a0a0f; --surface: #12121a; --surface2: #1a1a24; --border: rgba(255,255,255,0.1); --white: #f3f4f6; --white70: #9ca3af; --white50: #6b7280; --green: #10b981; --red: #ef4444; --orange: #f59e0b; --cyan: #3b82f6; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--white); line-height: 1.6; font-size: 14px; }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .header { margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
    .brand { font-size: 0.7rem; color: var(--white50); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 0.75rem; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .subtitle { color: var(--white70); font-size: 0.9rem; }
    .decision { display: inline-block; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; margin-top: 1rem; font-size: 0.85rem; }
    .decision.blocked { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
    .decision.open { background: rgba(16,185,129,0.15); color: var(--green); border: 1px solid rgba(16,185,129,0.3); }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1.5rem 0; }
    .metric { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; text-align: center; }
    .metric-value { font-size: 1.5rem; font-weight: 700; font-family: 'Courier New', monospace; }
    .metric-value.alert { color: var(--red); }
    .metric-value.success { color: var(--green); }
    .metric-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--white50); margin-top: 0.25rem; }
    .section { margin: 2rem 0; }
    .section h2 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border); color: var(--white); }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.85rem; }
    th, td { padding: 0.6rem; text-align: left; border-bottom: 1px solid var(--border); }
    th { background: var(--surface2); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--white50); font-weight: 600; }
    td { color: var(--white70); }
    .badge { display: inline-block; padding: 0.2rem 0.5rem; font-size: 0.7rem; font-weight: 600; border-radius: 4px; }
    .badge.critical { background: rgba(239,68,68,0.15); color: var(--red); }
    .badge.high { background: rgba(245,158,11,0.15); color: var(--orange); }
    .badge.medium { background: rgba(59,130,246,0.15); color: var(--cyan); }
    .badge.pass { background: rgba(16,185,129,0.15); color: var(--green); }
    .badge.fail { background: rgba(239,68,68,0.15); color: var(--red); }
    .badge.warning { background: rgba(245,158,11,0.15); color: var(--orange); }
    .badge.owasp { background: var(--surface2); color: var(--cyan); font-family: 'Courier New', monospace; margin-right: 8px; }
    .finding { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin: 0.75rem 0; page-break-inside: avoid; }
    .finding-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
    .finding-title { font-weight: 600; color: var(--white); display: flex; align-items: center; gap: 8px; }
    .finding-meta { font-size: 0.8rem; color: var(--white50); margin-bottom: 0.5rem; }
    .finding-file { font-family: 'Courier New', monospace; font-size: 0.8rem; color: var(--cyan); margin-bottom: 0.5rem; background: var(--surface2); padding: 4px 8px; border-radius: 4px; display: inline-block; }
    .finding-desc { font-size: 0.85rem; color: var(--white70); margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border); }
    .footer { text-align: center; padding-top: 1.5rem; border-top: 1px solid var(--border); margin-top: 2rem; color: var(--white50); font-size: 0.75rem; }
    @media print {
      :root { --bg: #fff; --surface: #f9f9f9; --surface2: #f0f0f0; --border: #ddd; --white: #1a1a1a; --white70: #444; --white50: #666; }
      body { font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .container { padding: 0; max-width: 100%; }
      .finding { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="brand">CYLESTIO | AGENT INSPECTOR</div>
      <h1>${workflowId}</h1>
      <p class="subtitle">Security Assessment Report - ${date}</p>
      <div class="decision ${report.executive_summary.is_blocked ? 'blocked' : 'open'}">
        ${report.executive_summary.decision_label || (report.executive_summary.is_blocked ? 'ATTENTION REQUIRED' : 'PRODUCTION READY')}
      </div>
    </header>

    <div class="metrics">
      <div class="metric">
        <div class="metric-value ${criticalCount > 0 ? 'alert' : ''}">${criticalCount}</div>
        <div class="metric-label">Critical</div>
      </div>
      <div class="metric">
        <div class="metric-value">${report.executive_summary.total_findings}</div>
        <div class="metric-label">Total Findings</div>
      </div>
      <div class="metric">
        <div class="metric-value success">${report.executive_summary.fixed_findings}</div>
        <div class="metric-label">Fixed</div>
      </div>
      <div class="metric">
        <div class="metric-value ${report.executive_summary.open_findings > 0 ? 'alert' : ''}">${report.executive_summary.open_findings}</div>
        <div class="metric-label">Open</div>
      </div>
    </div>

    <section class="section">
      <h2>OWASP LLM Top 10 Coverage</h2>
      <table>
        <thead><tr><th>Control</th><th>Status</th><th>Details</th></tr></thead>
        <tbody>
          ${Object.entries(report.owasp_llm_coverage).map(([id, item]) => `
            <tr>
              <td><strong style="color: var(--white);">${id}:</strong> ${item.name}</td>
              <td><span class="badge ${item.status === 'PASS' ? 'pass' : item.status === 'WARNING' ? 'warning' : 'fail'}">${item.status}</span></td>
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
              <td><strong style="color: var(--white);">${id}:</strong> ${item.name}</td>
              <td><span class="badge ${item.status === 'COMPLIANT' ? 'pass' : 'fail'}">${item.status}</span></td>
              <td>${item.message}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>

    ${report.blocking_items.length > 0 ? `
    <section class="section">
      <h2>Key Findings (${report.blocking_items.length})</h2>
      ${report.blocking_items.map(item => {
        const owaspMapping = item.owasp_mapping
          ? (Array.isArray(item.owasp_mapping) ? item.owasp_mapping[0] : item.owasp_mapping)
          : null;
        const fileLocation = item.file_path
          ? `${item.file_path}${item.line_start ? ':' + item.line_start + (item.line_end ? '-' + item.line_end : '') : ''}`
          : null;
        return `
        <div class="finding">
          <div class="finding-header">
            <span class="finding-title">
              ${owaspMapping ? `<span class="badge owasp">${owaspMapping}</span>` : ''}
              ${item.title}
            </span>
            <span class="badge ${item.severity === 'CRITICAL' ? 'critical' : item.severity === 'HIGH' ? 'high' : 'medium'}">${item.severity}</span>
          </div>
          <div class="finding-meta">${item.category}</div>
          ${fileLocation ? `<div class="finding-file">${fileLocation}</div>` : ''}
          ${item.description ? `<div class="finding-desc">${item.description}</div>` : ''}
        </div>
      `;
      }).join('')}
    </section>
    ` : ''}

    <footer class="footer">
      <p>CYLESTIO | AGENT INSPECTOR · ${date} · ${workflowId}</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Helper function to generate HTML table row for a finding in full report.
 */
function generateFindingRow(item: RecommendationDetail, index: number): string {
  const owaspMapping = item.owasp_mapping
    ? (Array.isArray(item.owasp_mapping) ? item.owasp_mapping[0] : item.owasp_mapping)
    : item.owasp_llm || null;
  const fileLocation = item.file_path
    ? `${item.file_path}${item.line_start ? ':' + item.line_start + (item.line_end ? '-' + item.line_end : '') : ''}`
    : null;
  const isResolved = item.status === 'FIXED' || item.status === 'VERIFIED';
  const severityClass = item.severity === 'CRITICAL' ? 'critical' : item.severity === 'HIGH' ? 'high' : item.severity === 'MEDIUM' ? 'medium' : 'low';
  const statusClass = isResolved ? 'resolved' : item.status === 'FIXING' ? 'fixing' : 'open';

  let details = '';
  if (item.description) details += `<p>${item.description}</p>`;
  if (item.impact) details += `<p class="detail-label">Impact: <span class="detail-value">${item.impact}</span></p>`;
  if (fileLocation) details += `<p class="detail-label">Location: <code>${fileLocation}</code></p>`;
  if (item.fix_hints) {
    const complexity = item.fix_complexity ? ` (${item.fix_complexity.toLowerCase()})` : '';
    details += `<p class="detail-label">Remediation${complexity}: <span class="detail-value">${item.fix_hints}</span></p>`;
  }
  if (isResolved && item.fixed_by) {
    const fixDate = item.fixed_at ? ` on ${new Date(item.fixed_at).toLocaleDateString()}` : '';
    details += `<p class="detail-label">Resolved by: <span class="detail-value">${item.fixed_by}${fixDate}</span></p>`;
  }

  return `<tr class="${isResolved ? 'row-resolved' : ''}">
    <td class="col-id">${index + 1}</td>
    <td class="col-severity"><span class="severity ${severityClass}">${item.severity}</span></td>
    <td class="col-title">
      <strong>${item.title}</strong>
      ${owaspMapping ? `<span class="owasp-tag">${owaspMapping}</span>` : ''}
    </td>
    <td class="col-category">${item.category || '—'}</td>
    <td class="col-status"><span class="status ${statusClass}">${item.status || 'OPEN'}</span></td>
    <td class="col-details">${details || '—'}</td>
  </tr>`;
}

/**
 * Generate a full HTML report with all findings (all severities).
 */
export function generateFullHTMLReport(report: ComplianceReportResponse, workflowId: string): string {
  const date = new Date(report.generated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const criticalCount = report.blocking_items.filter(item => item.severity === 'CRITICAL').length;
  const highCount = report.blocking_items.filter(item => item.severity === 'HIGH').length;
  const recommendations = (report.recommendations_detail || []) as RecommendationDetail[];
  const findingsRows = recommendations.map((item, idx) => generateFindingRow(item, idx)).join('');

  const owaspRows = Object.entries(report.owasp_llm_coverage).map(([id, item]) => {
    const statusClass = item.status === 'PASS' ? 'pass' : item.status === 'WARNING' ? 'warning' : 'fail';
    return `<tr><td><strong>${id}</strong> ${item.name}</td><td><span class="compliance-status ${statusClass}">${item.status}</span></td><td>${item.message}</td></tr>`;
  }).join('');

  const soc2Rows = Object.entries(report.soc2_compliance).map(([id, item]) => {
    const statusClass = item.status === 'COMPLIANT' ? 'pass' : 'fail';
    return `<tr><td><strong>${id}</strong> ${item.name}</td><td><span class="compliance-status ${statusClass}">${item.status}</span></td><td>${item.message}</td></tr>`;
  }).join('');

  const findingsSection = recommendations.length > 0 ? `
    <section class="section">
      <h2>3. Detailed Findings</h2>
      <p class="section-desc">Complete inventory of ${recommendations.length} security findings identified during assessment.</p>
      <table class="findings-table">
        <thead>
          <tr>
            <th class="col-id">#</th>
            <th class="col-severity">Severity</th>
            <th class="col-title">Finding</th>
            <th class="col-category">Category</th>
            <th class="col-status">Status</th>
            <th class="col-details">Details</th>
          </tr>
        </thead>
        <tbody>${findingsRows}</tbody>
      </table>
    </section>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Assessment Report: ${workflowId}</title>
  <style>
    :root {
      --bg: #0a0a0f;
      --text: #f3f4f6;
      --text-secondary: #9ca3af;
      --text-muted: #6b7280;
      --border: rgba(255,255,255,0.1);
      --surface: #12121a;
      --surface2: #1a1a24;
      --green: #10b981;
      --red: #ef4444;
      --orange: #f59e0b;
      --blue: #3b82f6;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      font-size: 13px;
    }
    .container { max-width: 1100px; margin: 0 auto; padding: 40px; }

    /* Header */
    .report-header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .brand {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .report-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 4px;
    }
    .report-meta {
      color: var(--text-secondary);
      font-size: 14px;
    }
    .verdict {
      display: inline-block;
      margin-top: 16px;
      padding: 8px 16px;
      font-weight: 600;
      font-size: 13px;
      border-radius: 4px;
    }
    .verdict.blocked { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
    .verdict.clear { background: rgba(16,185,129,0.15); color: var(--green); border: 1px solid rgba(16,185,129,0.3); }

    /* Executive Summary */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin: 24px 0;
    }
    .summary-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      text-align: center;
    }
    .summary-value {
      font-size: 28px;
      font-weight: 700;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      color: var(--text);
    }
    .summary-value.critical { color: var(--red); }
    .summary-value.high { color: var(--orange); }
    .summary-value.success { color: var(--green); }
    .summary-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Sections */
    .section {
      margin: 40px 0;
      page-break-inside: avoid;
    }
    .section h2 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }
    .section-desc {
      color: var(--text-muted);
      font-size: 13px;
      margin-bottom: 16px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    th {
      background: var(--surface2);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--text-muted);
    }
    td { color: var(--text-secondary); }
    tr:hover { background: var(--surface); }

    /* Compliance status */
    .compliance-status {
      display: inline-block;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 3px;
    }
    .compliance-status.pass { background: rgba(16,185,129,0.15); color: var(--green); }
    .compliance-status.fail { background: rgba(239,68,68,0.15); color: var(--red); }
    .compliance-status.warning { background: rgba(245,158,11,0.15); color: var(--orange); }

    /* Findings table */
    .findings-table .col-id { width: 40px; text-align: center; }
    .findings-table .col-severity { width: 80px; }
    .findings-table .col-title { width: 200px; }
    .findings-table .col-category { width: 100px; }
    .findings-table .col-status { width: 80px; }
    .findings-table .col-details { width: auto; }

    .findings-table td.col-id { font-family: 'JetBrains Mono', monospace; color: var(--text-muted); }
    .findings-table td.col-title strong { color: var(--text); display: block; margin-bottom: 4px; }
    .findings-table .owasp-tag {
      display: inline-block;
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      background: var(--surface2);
      color: var(--blue);
      padding: 2px 6px;
      border-radius: 3px;
    }

    /* Severity badges */
    .severity {
      display: inline-block;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 3px;
      text-transform: uppercase;
    }
    .severity.critical { background: rgba(239,68,68,0.15); color: var(--red); }
    .severity.high { background: rgba(245,158,11,0.15); color: var(--orange); }
    .severity.medium { background: rgba(59,130,246,0.15); color: var(--blue); }
    .severity.low { background: var(--surface2); color: var(--text-muted); }

    /* Status badges */
    .status {
      display: inline-block;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 3px;
    }
    .status.open { background: rgba(239,68,68,0.15); color: var(--red); }
    .status.fixing { background: rgba(245,158,11,0.15); color: var(--orange); }
    .status.resolved { background: rgba(16,185,129,0.15); color: var(--green); }

    /* Details column */
    .col-details p { margin: 0 0 6px 0; }
    .col-details p:last-child { margin-bottom: 0; }
    .detail-label {
      font-size: 12px;
      color: var(--text-muted);
    }
    .detail-label .detail-value { color: var(--text-secondary); }
    .col-details code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      background: var(--surface2);
      padding: 2px 6px;
      border-radius: 3px;
      color: var(--blue);
    }

    /* Resolved rows */
    .row-resolved { opacity: 0.6; }
    .row-resolved td { background: rgba(16,185,129,0.05); }

    /* Footer */
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--text-muted);
      font-size: 12px;
    }

    /* Print styles */
    @media print {
      :root { --bg: #fff; --surface: #f9f9f9; --surface2: #f0f0f0; --border: #ddd; --text: #1a1a1a; --text-secondary: #444; --text-muted: #666; }
      body { font-size: 11px; }
      .container { padding: 20px; max-width: 100%; }
      .section { page-break-inside: avoid; }
      .findings-table tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="report-header">
      <div class="brand">Cylestio Agent Inspector</div>
      <h1 class="report-title">Security Assessment Report</h1>
      <p class="report-meta">${workflowId} · Generated ${date}</p>
      <div class="verdict ${report.executive_summary.is_blocked ? 'blocked' : 'clear'}">
        ${report.executive_summary.decision_label || (report.executive_summary.is_blocked ? 'ATTENTION REQUIRED' : 'PRODUCTION READY')}
      </div>
    </header>

    <section class="section">
      <h2>1. Executive Summary</h2>
      <div class="summary-grid">
        <div class="summary-box">
          <div class="summary-value critical">${criticalCount}</div>
          <div class="summary-label">Critical</div>
        </div>
        <div class="summary-box">
          <div class="summary-value high">${highCount}</div>
          <div class="summary-label">High</div>
        </div>
        <div class="summary-box">
          <div class="summary-value">${report.executive_summary.total_findings}</div>
          <div class="summary-label">Total</div>
        </div>
        <div class="summary-box">
          <div class="summary-value">${report.executive_summary.open_findings}</div>
          <div class="summary-label">Open</div>
        </div>
        <div class="summary-box">
          <div class="summary-value success">${report.executive_summary.fixed_findings}</div>
          <div class="summary-label">Fixed</div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>2. Compliance Coverage</h2>

      <h3 style="font-size: 14px; margin: 24px 0 12px; color: #f3f4f6;">OWASP LLM Top 10</h3>
      <table>
        <thead><tr><th>Control</th><th>Status</th><th>Details</th></tr></thead>
        <tbody>${owaspRows}</tbody>
      </table>

      <h3 style="font-size: 14px; margin: 24px 0 12px; color: #f3f4f6;">SOC2 Controls</h3>
      <table>
        <thead><tr><th>Control</th><th>Status</th><th>Details</th></tr></thead>
        <tbody>${soc2Rows}</tbody>
      </table>
    </section>

    ${findingsSection}

    <footer class="footer">
      <p>Cylestio Agent Inspector · ${workflowId} · ${date}</p>
      <p style="margin-top: 4px;">This report was automatically generated. For questions, contact your security team.</p>
    </footer>
  </div>
</body>
</html>`;
}
