import type { FC } from 'react';
import { AlertCircle, FileCode, Eye, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

import type { Recommendation, FindingSeverity, RecommendationStatus } from '@api/types/findings';
import { FrameworkBadges } from '../security/FrameworkBadges';
import { FixActionCard, type IdeType } from '../security/FixActionCard';

import {
  CardWrapper,
  CardHeader,
  RecommendationId,
  SourceBadge,
  CardTitleRow,
  SeverityIconWrapper,
  TitleContent,
  CardTitle,
  CardDescription,
  LocationRow,
  LocationPath,
  LocationFunction,
  BadgesRow,
  FixActionRow,
  CardActions,
  ActionButton,
  DismissDropdownContainer,
  DismissButton,
  StatusBadge,
} from './RecommendationCard.styles';

export interface RecommendationCardProps {
  recommendation: Recommendation;
  connectedIde?: IdeType;
  onViewEvidence?: (rec: Recommendation) => void;
  onMarkFixed?: (rec: Recommendation) => void;
  onDismiss?: (rec: Recommendation) => void;
  className?: string;
}

const getSeverityIcon = (severity: FindingSeverity) => {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH':
      return <AlertCircle size={18} />;
    case 'MEDIUM':
      return <AlertCircle size={18} />;
    case 'LOW':
    default:
      return <AlertCircle size={18} />;
  }
};

const getSeverityLabel = (severity: FindingSeverity): string => {
  return severity;
};

const isResolved = (status: RecommendationStatus): boolean => {
  return ['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(status);
};

/**
 * RecommendationCard - Displays a security recommendation with fix action
 * 
 * Shows:
 * - REC-XXX ID prominently
 * - Source type (STATIC/DYNAMIC)
 * - Severity with icon
 * - Title and description
 * - Location (file:line → function)
 * - Framework badges (OWASP, CWE, SOC2, CVSS)
 * - Fix action card with copy command
 * - Action buttons (View Evidence, Mark Fixed, Dismiss)
 */
export const RecommendationCard: FC<RecommendationCardProps> = ({
  recommendation,
  connectedIde,
  onViewEvidence,
  onMarkFixed,
  onDismiss,
  className,
}) => {
  const {
    recommendation_id,
    source_type,
    severity,
    title,
    description,
    file_path,
    line_start,
    line_end,
    function_name,
    owasp_llm,
    cwe,
    soc2_controls,
    cvss_score,
    cvss_vector,
    mitre_atlas,
    nist_csf,
    status,
  } = recommendation;

  const resolved = isResolved(status);

  // Build location string
  const hasLocation = file_path;
  const lineInfo = line_start ? (line_end && line_end !== line_start ? `${line_start}-${line_end}` : `${line_start}`) : null;

  return (
    <CardWrapper $severity={severity} className={className}>
      {/* Header with ID and Source */}
      <CardHeader>
        <RecommendationId>{recommendation_id}</RecommendationId>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {status !== 'PENDING' && <StatusBadge $status={status}>{status}</StatusBadge>}
          <SourceBadge $type={source_type}>From: {source_type}</SourceBadge>
        </div>
      </CardHeader>

      {/* Title Row with Severity Icon */}
      <CardTitleRow>
        <SeverityIconWrapper $severity={severity}>
          {getSeverityIcon(severity)}
        </SeverityIconWrapper>
        <TitleContent>
          <CardTitle>
            <span style={{ color: getSeverityColor(severity), marginRight: '8px' }}>
              {getSeverityLabel(severity)}
            </span>
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </TitleContent>
      </CardTitleRow>

      {/* Location */}
      {hasLocation && (
        <LocationRow>
          <FileCode size={14} />
          <LocationPath>
            {file_path}{lineInfo && `:${lineInfo}`}
          </LocationPath>
          {function_name && (
            <LocationFunction>{function_name}()</LocationFunction>
          )}
        </LocationRow>
      )}

      {/* Framework Badges */}
      <BadgesRow>
        <FrameworkBadges
          owaspLlm={owasp_llm}
          cwe={cwe ? [cwe] : undefined}
          soc2Controls={soc2_controls}
          cvssScore={cvss_score}
          cvssVector={cvss_vector}
          mitreAtlas={mitre_atlas}
          nistCsf={nist_csf}
        />
      </BadgesRow>

      {/* Fix Action - only show if not resolved */}
      {!resolved && (
        <FixActionRow>
          <FixActionCard
            recommendationId={recommendation_id}
            connectedIde={connectedIde}
          />
        </FixActionRow>
      )}

      {/* Action Buttons */}
      <CardActions>
        {onViewEvidence && (
          <ActionButton onClick={() => onViewEvidence(recommendation)}>
            <Eye size={14} />
            View Evidence
          </ActionButton>
        )}
        
        {!resolved && onMarkFixed && (
          <ActionButton onClick={() => onMarkFixed(recommendation)}>
            <CheckCircle size={14} />
            Mark Fixed
          </ActionButton>
        )}

        {!resolved && onDismiss && (
          <DismissDropdownContainer>
            <DismissButton onClick={() => onDismiss(recommendation)}>
              <XCircle size={14} />
              Dismiss
              <ChevronDown size={12} />
            </DismissButton>
          </DismissDropdownContainer>
        )}
      </CardActions>
    </CardWrapper>
  );
};

// Helper to get severity color inline
function getSeverityColor(severity: FindingSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return '#ef4444';
    case 'HIGH':
      return '#f97316';
    case 'MEDIUM':
      return '#eab308';
    case 'LOW':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
}

