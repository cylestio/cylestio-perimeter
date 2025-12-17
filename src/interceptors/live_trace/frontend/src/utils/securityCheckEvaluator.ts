import type { SecurityCheckDefinition } from '@constants/securityChecks';

export interface SecurityCheckResult {
  status: 'PASS' | 'FAIL' | 'PARTIAL' | 'NOT OBSERVED' | 'TRACKED';
  details: string;
  evidence?: string;
  metric?: string;
  relatedFindings: any[];
}

/**
 * Evaluates a security check based on findings from analysis.
 * Matches findings to checks using category and keyword matching.
 */
export function evaluateCheck(
  check: SecurityCheckDefinition,
  findings: any[],
  sourceType?: 'STATIC' | 'DYNAMIC'
): SecurityCheckResult {
  // Filter findings relevant to this check
  const relevant = findings.filter((f) => {
    const matchesSource = !sourceType || f.source_type === sourceType || (!f.source_type && sourceType === 'STATIC');
    const matchesCategory = check.categories.some((cat) =>
      f.category?.toUpperCase().includes(cat) || cat.includes(f.category?.toUpperCase() || '')
    );
    const matchesKeyword = check.keywords.some((kw) =>
      f.title?.toLowerCase().includes(kw.toLowerCase()) || f.description?.toLowerCase().includes(kw.toLowerCase())
    );
    return matchesSource && (matchesCategory || matchesKeyword);
  });

  const openIssues = relevant.filter((f) => f.status === 'OPEN');
  const fixedIssues = relevant.filter((f) => f.status === 'FIXED');

  if (relevant.length === 0) {
    return {
      status: sourceType === 'DYNAMIC' ? 'TRACKED' : 'PASS',
      details: sourceType === 'DYNAMIC'
        ? 'No issues detected during runtime observation.'
        : 'No security issues detected in this area.',
      relatedFindings: [],
    };
  }

  if (openIssues.length === 0 && fixedIssues.length > 0) {
    return {
      status: 'PASS',
      details: `All ${fixedIssues.length} issues have been fixed.`,
      relatedFindings: relevant,
    };
  }

  if (openIssues.length > 0 && fixedIssues.length > 0) {
    return {
      status: 'PARTIAL',
      details: `${openIssues.length} open issues, ${fixedIssues.length} fixed. ${openIssues[0]?.title || 'Issue requires attention.'}`,
      evidence: openIssues[0]?.file_path ? `${openIssues[0].file_path.split('/').pop()}${openIssues[0].line_start ? ':' + openIssues[0].line_start : ''}` : undefined,
      relatedFindings: relevant,
    };
  }

  // All open
  const topFinding = openIssues[0];
  return {
    status: sourceType === 'DYNAMIC' ? 'NOT OBSERVED' : 'FAIL',
    details: topFinding?.description?.slice(0, 120) || topFinding?.title || 'Security issue detected.',
    evidence: topFinding?.file_path ? `${topFinding.file_path.split('/').pop()}${topFinding.line_start ? ':' + topFinding.line_start + (topFinding.line_end ? '-' + topFinding.line_end : '') : ''}` : undefined,
    metric: openIssues.length > 1 ? `${openIssues.length} issues` : undefined,
    relatedFindings: relevant,
  };
}
