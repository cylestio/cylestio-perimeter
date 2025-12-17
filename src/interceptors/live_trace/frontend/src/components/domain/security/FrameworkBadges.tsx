import type { FC } from 'react';
import { Shield, FileCode, Lock, AlertTriangle } from 'lucide-react';

import {
  BadgesContainer,
  FrameworkBadge,
  CvssScoreValue,
  CvssLabel,
} from './FrameworkBadges.styles';

export interface FrameworkBadgesProps {
  /** OWASP LLM Top 10 mapping (e.g., "LLM01", "LLM07") */
  owaspLlm?: string | string[];
  /** CWE mappings (e.g., "CWE-95", "CWE-532") */
  cwe?: string | string[];
  /** SOC2 control mappings */
  soc2Controls?: string[];
  /** CVSS score (0-10) */
  cvssScore?: number;
  /** Whether to show compact badges (smaller) */
  compact?: boolean;
  className?: string;
}

/**
 * Get CVSS severity category from score
 */
const getCvssSeverity = (score: number): 'critical' | 'high' | 'medium' | 'low' => {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  return 'low';
};

/**
 * FrameworkBadges component displays security framework mappings
 * (OWASP LLM, CWE, SOC2) and CVSS scores as badges.
 */
export const FrameworkBadges: FC<FrameworkBadgesProps> = ({
  owaspLlm,
  cwe,
  soc2Controls,
  cvssScore,
  compact: _compact = false,
  className,
}) => {
  // Normalize arrays
  const owaspArray = owaspLlm 
    ? (Array.isArray(owaspLlm) ? owaspLlm : [owaspLlm])
    : [];
  const cweArray = cwe 
    ? (Array.isArray(cwe) ? cwe : [cwe])
    : [];

  const hasBadges = owaspArray.length > 0 || cweArray.length > 0 || 
    (soc2Controls && soc2Controls.length > 0) || (cvssScore != null && cvssScore !== undefined);

  if (!hasBadges) return null;

  return (
    <BadgesContainer className={className}>
      {/* CVSS Score Badge */}
      {cvssScore != null && cvssScore !== undefined && (
        <FrameworkBadge $variant={`cvss-${getCvssSeverity(cvssScore)}`}>
          <AlertTriangle size={10} />
          <CvssLabel>CVSS</CvssLabel>
          <CvssScoreValue>{cvssScore.toFixed(1)}</CvssScoreValue>
        </FrameworkBadge>
      )}

      {/* OWASP LLM Badges */}
      {owaspArray.map((owasp) => (
        <FrameworkBadge key={owasp} $variant="owasp">
          <Shield size={10} />
          {owasp}
        </FrameworkBadge>
      ))}

      {/* CWE Badges */}
      {cweArray.map((cweId) => (
        <FrameworkBadge key={cweId} $variant="cwe">
          <FileCode size={10} />
          {cweId}
        </FrameworkBadge>
      ))}

      {/* SOC2 Badges */}
      {soc2Controls?.map((control) => (
        <FrameworkBadge key={control} $variant="soc2">
          <Lock size={10} />
          {control}
        </FrameworkBadge>
      ))}
    </BadgesContainer>
  );
};
