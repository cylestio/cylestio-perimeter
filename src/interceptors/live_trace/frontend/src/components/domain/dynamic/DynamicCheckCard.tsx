import type { FC } from 'react';

import { AlertTriangle, Check, X } from 'lucide-react';

import { FrameworkBadges } from '@domain/security';

import {
  CheckCardContainer,
  CheckHeader,
  StatusIconWrapper,
  CheckName,
  CvssScore,
  CheckValue,
  CheckDescription,
  FrameworkBadgesRow,
  RecommendationsList,
  RecommendationItem,
} from './DynamicCheckCard.styles';

export interface DynamicCheck {
  check_id: string;
  category: string;
  name: string;
  description: string;
  status: 'passed' | 'warning' | 'critical';
  value?: string;
  recommendations?: string[];
  owasp_llm?: string;
  owasp_llm_name?: string;
  soc2_controls?: string[];
  cwe?: string;
  mitre?: string;
  cvss_score?: number;
}

export interface DynamicCheckCardProps {
  check: DynamicCheck;
  showDescription?: boolean;
  className?: string;
}

/**
 * Get CVSS severity from score
 */
function getCvssSeverity(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  return 'low';
}

/**
 * Get status icon based on status
 */
function StatusIcon({ status }: { status: 'passed' | 'warning' | 'critical' }) {
  switch (status) {
    case 'passed':
      return <Check size={14} />;
    case 'warning':
      return <AlertTriangle size={14} />;
    case 'critical':
      return <X size={14} />;
  }
}

/**
 * DynamicCheckCard - Display a single dynamic security check with framework badges
 * 
 * Shows:
 * - Status icon (passed/warning/critical)
 * - Check name and value
 * - CVSS score (for failed checks)
 * - Framework badges (OWASP LLM, SOC2, CWE)
 * - Recommendations (for non-passed checks)
 */
export const DynamicCheckCard: FC<DynamicCheckCardProps> = ({
  check,
  showDescription = false,
  className,
}) => {
  const hasFrameworkBadges = check.owasp_llm || 
    (check.soc2_controls && check.soc2_controls.length > 0) || 
    check.cwe;

  const showRecommendations = check.status !== 'passed' && 
    check.recommendations && 
    check.recommendations.length > 0;

  return (
    <CheckCardContainer $status={check.status} className={className} data-testid="dynamic-check-card">
      <CheckHeader>
        <StatusIconWrapper $status={check.status}>
          <StatusIcon status={check.status} />
        </StatusIconWrapper>
        <CheckName>{check.name}</CheckName>
        {check.cvss_score !== undefined && check.cvss_score > 0 && (
          <CvssScore $severity={getCvssSeverity(check.cvss_score)}>
            CVSS {check.cvss_score.toFixed(1)}
          </CvssScore>
        )}
      </CheckHeader>

      {check.value && <CheckValue>{check.value}</CheckValue>}

      {showDescription && check.description && (
        <CheckDescription>{check.description}</CheckDescription>
      )}

      {hasFrameworkBadges && (
        <FrameworkBadgesRow>
          <FrameworkBadges
            owaspLlm={check.owasp_llm}
            soc2Controls={check.soc2_controls}
            cwe={check.cwe ? [check.cwe] : undefined}
            compact
          />
        </FrameworkBadgesRow>
      )}

      {showRecommendations && (
        <RecommendationsList>
          {check.recommendations!.map((rec, index) => (
            <RecommendationItem key={index}>{rec}</RecommendationItem>
          ))}
        </RecommendationsList>
      )}
    </CheckCardContainer>
  );
};
