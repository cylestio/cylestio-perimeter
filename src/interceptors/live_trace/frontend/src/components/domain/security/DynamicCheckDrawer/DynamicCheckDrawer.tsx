import type { FC, ReactNode } from 'react';

import {
  Check,
  X,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import type {
  DynamicSecurityCheck,
  DynamicCategoryId,
  DynamicCategoryDefinition,
} from '@api/types/security';
import { DYNAMIC_CATEGORY_ICONS } from '@constants/securityChecks';

import { Drawer } from '@ui/overlays/Drawer';

import {
  DrawerInner,
  HeaderSection,
  HeaderRow,
  CategoryIcon,
  HeaderInfo,
  CheckTitle,
  CategoryName,
  StatusBadgeLarge,
  ValueDisplay,
  SectionTitle,
  DescriptionText,
  EvidenceGrid,
  EvidenceItem,
  EvidenceItemFull,
  EvidenceLabel,
  EvidenceValue,
  EvidenceTagList,
  EvidenceTag,
  RecommendationsList,
  RecommendationItem,
  FrameworksGrid,
  FrameworkBadge,
  FrameworkLabel,
  FrameworkValue,
  SessionsList,
  SessionLink,
  EmptyState,
} from './DynamicCheckDrawer.styles';

// Types
export interface DynamicCheckDrawerProps {
  /** The check to display (null when closed) */
  check: DynamicSecurityCheck | null;
  /** Category definition for display names */
  categoryDefinition?: DynamicCategoryDefinition;
  /** Whether the drawer is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Agent workflow ID for session links */
  agentWorkflowId?: string;
  /** Additional class name */
  className?: string;
}

// Get status icon
const getStatusIcon = (status: DynamicSecurityCheck['status'], size = 16) => {
  switch (status) {
    case 'passed':
      return <Check size={size} strokeWidth={2.5} />;
    case 'warning':
      return <AlertTriangle size={size} />;
    case 'critical':
      return <X size={size} strokeWidth={2.5} />;
    case 'analyzing':
      return <Loader2 size={size} />;
    default:
      return null;
  }
};

// Get status label
const getStatusLabel = (status: DynamicSecurityCheck['status']): string => {
  switch (status) {
    case 'passed':
      return 'Passed';
    case 'warning':
      return 'Warning';
    case 'critical':
      return 'Critical';
    case 'analyzing':
      return 'Analyzing...';
    default:
      return '';
  }
};

// Format evidence key for display
const formatEvidenceKey = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Render evidence value - returns ReactNode for rich rendering
const renderEvidenceValue = (value: unknown): ReactNode => {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value) && value.length > 0) {
    return (
      <EvidenceTagList>
        {value.map((item, i) => (
          <EvidenceTag key={i}>{String(item)}</EvidenceTag>
        ))}
      </EvidenceTagList>
    );
  }
  if (value === null || value === undefined) {
    return 'N/A';
  }
  return String(value);
};

// Determine if value needs full-width display
const needsFullWidth = (value: unknown): boolean => {
  return Array.isArray(value) && value.length > 0;
};

/**
 * DynamicCheckDrawer displays detailed information about a security check
 * in a side drawer panel.
 *
 * Includes:
 * - Header with status and category
 * - Description
 * - Evidence data
 * - Recommendations
 * - Framework mappings (OWASP, SOC2, CWE, MITRE)
 * - Affected sessions with links
 */
export const DynamicCheckDrawer: FC<DynamicCheckDrawerProps> = ({
  check,
  categoryDefinition,
  open,
  onClose,
  agentWorkflowId,
  className,
}) => {
  if (!check) return null;

  const CategoryIconComponent = DYNAMIC_CATEGORY_ICONS[check.category_id as DynamicCategoryId];
  const frameworkMappings = check.framework_mappings;
  const hasFrameworks =
    frameworkMappings &&
    (frameworkMappings.owasp_llm ||
      frameworkMappings.soc2_controls?.length ||
      frameworkMappings.cwe ||
      frameworkMappings.mitre);

  // Extract evidence entries, excluding internal fields
  const evidenceEntries = check.evidence
    ? Object.entries(check.evidence).filter(
        ([key]) => !key.startsWith('_') && key !== 'check_id'
      )
    : [];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={check.title}
      size="lg"
      className={className}
    >
      <DrawerInner>
        {/* Header Section */}
        <HeaderSection>
          <HeaderRow>
            {CategoryIconComponent && (
              <CategoryIcon $status={check.status}>
                <CategoryIconComponent />
              </CategoryIcon>
            )}
            <HeaderInfo>
              <CheckTitle>{check.title}</CheckTitle>
              <CategoryName>
                {categoryDefinition?.name || check.category_id.replace(/_/g, ' ')}
              </CategoryName>
            </HeaderInfo>
            <StatusBadgeLarge $status={check.status} data-testid="drawer-status-badge">
              {getStatusIcon(check.status)}
              {getStatusLabel(check.status)}
            </StatusBadgeLarge>
          </HeaderRow>

          {check.value && <ValueDisplay>{check.value}</ValueDisplay>}
        </HeaderSection>

        {/* Description Section */}
        {check.description && (
          <div>
            <SectionTitle>Description</SectionTitle>
            <DescriptionText>{check.description}</DescriptionText>
          </div>
        )}

        {/* Evidence Section */}
        {evidenceEntries.length > 0 && (
          <div>
            <SectionTitle>Evidence</SectionTitle>
            <EvidenceGrid>
              {evidenceEntries.map(([key, value]) => {
                const ItemComponent = needsFullWidth(value) ? EvidenceItemFull : EvidenceItem;
                return (
                  <ItemComponent key={key}>
                    <EvidenceLabel>{formatEvidenceKey(key)}</EvidenceLabel>
                    <EvidenceValue>{renderEvidenceValue(value)}</EvidenceValue>
                  </ItemComponent>
                );
              })}
            </EvidenceGrid>
          </div>
        )}

        {/* Recommendations Section */}
        {check.recommendations && check.recommendations.length > 0 && (
          <div>
            <SectionTitle>Recommendations</SectionTitle>
            <RecommendationsList>
              {check.recommendations.map((rec, index) => (
                <RecommendationItem key={index}>{rec}</RecommendationItem>
              ))}
            </RecommendationsList>
          </div>
        )}

        {/* Framework Mappings Section */}
        {hasFrameworks && (
          <div>
            <SectionTitle>Framework Mappings</SectionTitle>
            <FrameworksGrid>
              {frameworkMappings.owasp_llm && (
                <FrameworkBadge>
                  <FrameworkLabel>OWASP LLM</FrameworkLabel>
                  <FrameworkValue>
                    {frameworkMappings.owasp_llm}
                    {frameworkMappings.owasp_llm_name &&
                      ` - ${frameworkMappings.owasp_llm_name}`}
                  </FrameworkValue>
                </FrameworkBadge>
              )}

              {frameworkMappings.soc2_controls &&
                frameworkMappings.soc2_controls.length > 0 && (
                  <FrameworkBadge>
                    <FrameworkLabel>SOC2</FrameworkLabel>
                    <FrameworkValue>
                      {frameworkMappings.soc2_controls.join(', ')}
                    </FrameworkValue>
                  </FrameworkBadge>
                )}

              {frameworkMappings.cwe && (
                <FrameworkBadge>
                  <FrameworkLabel>CWE</FrameworkLabel>
                  <FrameworkValue>{frameworkMappings.cwe}</FrameworkValue>
                </FrameworkBadge>
              )}

              {frameworkMappings.mitre && (
                <FrameworkBadge>
                  <FrameworkLabel>MITRE ATT&CK</FrameworkLabel>
                  <FrameworkValue>{frameworkMappings.mitre}</FrameworkValue>
                </FrameworkBadge>
              )}

              {frameworkMappings.cvss_score && (
                <FrameworkBadge>
                  <FrameworkLabel>CVSS</FrameworkLabel>
                  <FrameworkValue>{frameworkMappings.cvss_score}</FrameworkValue>
                </FrameworkBadge>
              )}
            </FrameworksGrid>
          </div>
        )}

        {/* Affected Sessions Section */}
        {check.affected_sessions && check.affected_sessions.length > 0 && (
          <div>
            <SectionTitle>Affected Sessions</SectionTitle>
            <SessionsList>
              {check.affected_sessions.map((sessionId) => (
                <SessionLink
                  key={sessionId}
                  as={Link}
                  to={
                    agentWorkflowId
                      ? `/workflow/${agentWorkflowId}/sessions/${sessionId}`
                      : `/sessions/${sessionId}`
                  }
                >
                  {sessionId.slice(0, 12)}...
                  <ExternalLink size={14} />
                </SessionLink>
              ))}
            </SessionsList>
          </div>
        )}

        {/* Empty state if no details */}
        {!check.description &&
          evidenceEntries.length === 0 &&
          (!check.recommendations || check.recommendations.length === 0) &&
          !hasFrameworks && (
            <EmptyState>
              No additional details available for this check.
            </EmptyState>
          )}
      </DrawerInner>
    </Drawer>
  );
};
