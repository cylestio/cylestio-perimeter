import { type FC, useState, useRef, useEffect } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Copy, Check, Wrench, Lightbulb, AlertTriangle } from 'lucide-react';
import type { Recommendation, FindingSeverity } from '@api/types/findings';
import { FrameworkBadges } from '@domain/security/FrameworkBadges';
import {
  CardContainer,
  CardHeader,
  RecommendationId,
  SourceBadge,
  CardTitle,
  TitleText,
  SeverityIcon,
  MetadataRow,
  CategoryBadge,
  LocationText,
  DynamicInfo,
  StatusBadge,
  CardActions,
  LinkButton,
  ActionButton,
  DismissDropdownContainer,
  DropdownMenu,
  DropdownItem,
  FixActionBox,
  FixIcon,
  FixContent,
  FixLabel,
  FixCommand,
  CopyButton,
  DescriptionText,
  DetailsSection,
  DetailItem,
  DetailLabel,
  DetailValue,
  CodeSnippetContainer,
  CodeSnippetHeader,
  CodeSnippetFile,
  CodeSnippetBody,
  ExpandButton,
  FixHintsBox,
  FixHintsIcon,
  FixHintsText,
} from './RecommendationCard.styles';

export interface RecommendationCardProps {
  recommendation: Recommendation;
  onCopyCommand?: () => void;
  onMarkFixed?: () => void;
  onDismiss?: (type: 'DISMISSED' | 'IGNORED') => void;
  onViewFinding?: (findingId: string) => void;
  showFixAction?: boolean;
}

const SEVERITY_ICONS: Record<FindingSeverity, string> = {
  CRITICAL: '🔴',
  HIGH: '🔴',  // Changed from orange to red
  MEDIUM: '🟠',
  LOW: '🟡',
};

export const RecommendationCard: FC<RecommendationCardProps> = ({
  recommendation,
  onCopyCommand,
  onMarkFixed,
  onDismiss,
  onViewFinding,
  showFixAction = true,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true); // Default expanded to show details
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fixCommand = `/fix ${recommendation.recommendation_id}`;

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(fixCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopyCommand?.();
    } catch (error) {
      console.error('Failed to copy command:', error);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const isResolved = ['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(recommendation.status);
  const hasDetails = recommendation.description || recommendation.code_snippet || 
                     recommendation.impact || recommendation.fix_hints;

  return (
    <CardContainer $severity={recommendation.severity}>
      {/* Header with ID and Source Badge */}
      <CardHeader>
        <RecommendationId>{recommendation.recommendation_id}</RecommendationId>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge $status={recommendation.status}>
            {recommendation.status}
          </StatusBadge>
          <SourceBadge $type={recommendation.source_type}>
            {recommendation.source_type === 'STATIC' ? '📝 Static Scan' : '🔄 Dynamic Scan'}
          </SourceBadge>
          {hasDetails && (
            <ExpandButton $expanded={expanded} onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Less' : 'More'}
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </ExpandButton>
          )}
        </div>
      </CardHeader>

      {/* Title with Severity Icon */}
      <CardTitle>
        <SeverityIcon $severity={recommendation.severity}>
          {SEVERITY_ICONS[recommendation.severity]}
        </SeverityIcon>
        <TitleText>{recommendation.title}</TitleText>
      </CardTitle>

      {/* Description - always show if available */}
      {recommendation.description && (
        <DescriptionText>{recommendation.description}</DescriptionText>
      )}

      {/* Metadata Row */}
      <MetadataRow>
        <CategoryBadge>{recommendation.category}</CategoryBadge>
        <FrameworkBadges
          owaspLlm={recommendation.owasp_llm}
          cwe={recommendation.cwe ? [recommendation.cwe] : undefined}
          soc2Controls={recommendation.soc2_controls}
          cvssScore={recommendation.cvss_score}
        />
      </MetadataRow>

      {/* Location or Dynamic Info */}
      {recommendation.source_type === 'STATIC' ? (
        recommendation.file_path && (
          <LocationText>
            📁 {recommendation.file_path}
            {recommendation.line_start && `:${recommendation.line_start}`}
            {recommendation.line_end && recommendation.line_end !== recommendation.line_start && 
              `-${recommendation.line_end}`}
          </LocationText>
        )
      ) : (
        <DynamicInfo>
          Detected during runtime analysis
        </DynamicInfo>
      )}

      {/* Expanded Details */}
      {expanded && hasDetails && (
        <DetailsSection>
          {/* Impact */}
          {recommendation.impact && (
            <DetailItem>
              <DetailLabel>
                <AlertTriangle size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Impact
              </DetailLabel>
              <DetailValue>{recommendation.impact}</DetailValue>
            </DetailItem>
          )}

          {/* Code Snippet */}
          {recommendation.code_snippet && (
            <CodeSnippetContainer>
              <CodeSnippetHeader>
                <CodeSnippetFile>
                  {recommendation.file_path || 'Code Snippet'}
                  {recommendation.line_start && ` (line ${recommendation.line_start})`}
                </CodeSnippetFile>
              </CodeSnippetHeader>
              <CodeSnippetBody>{recommendation.code_snippet}</CodeSnippetBody>
            </CodeSnippetContainer>
          )}

          {/* Fix Hints */}
          {recommendation.fix_hints && (
            <FixHintsBox>
              <FixHintsIcon>
                <Lightbulb size={16} />
              </FixHintsIcon>
              <FixHintsText>{recommendation.fix_hints}</FixHintsText>
            </FixHintsBox>
          )}

          {/* Fix Complexity */}
          {recommendation.fix_complexity && (
            <DetailItem>
              <DetailLabel>Fix Complexity</DetailLabel>
              <DetailValue>{recommendation.fix_complexity}</DetailValue>
            </DetailItem>
          )}
        </DetailsSection>
      )}

      {/* Fix Action Box - only show for pending/fixing status */}
      {showFixAction && !isResolved && (
        <FixActionBox>
          <FixIcon>
            <Wrench size={20} />
          </FixIcon>
          <FixContent>
            <FixLabel>FIX WITH CURSOR</FixLabel>
            <FixCommand>{fixCommand}</FixCommand>
          </FixContent>
          <CopyButton onClick={handleCopyCommand}>
            {copied ? (
              <>
                <Check size={14} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy Command
              </>
            )}
          </CopyButton>
        </FixActionBox>
      )}

      {/* Actions */}
      <CardActions>
        {/* Link to source finding */}
        {recommendation.source_finding_id && onViewFinding && (
          <LinkButton onClick={() => onViewFinding(recommendation.source_finding_id)}>
            View Finding {recommendation.source_finding_id.slice(0, 8)}...
            <ExternalLink size={12} />
          </LinkButton>
        )}

        {/* Mark Fixed button - only show for FIXING status */}
        {recommendation.status === 'FIXING' && onMarkFixed && (
          <ActionButton $variant="primary" onClick={onMarkFixed}>
            <Check size={14} />
            Mark Fixed
          </ActionButton>
        )}

        {/* Dismiss dropdown - only show for pending/fixing status */}
        {!isResolved && onDismiss && (
          <DismissDropdownContainer ref={dropdownRef}>
            <ActionButton onClick={() => setShowDropdown(!showDropdown)}>
              Dismiss
              <ChevronDown size={12} />
            </ActionButton>
            {showDropdown && (
              <DropdownMenu>
                <DropdownItem onClick={() => {
                  onDismiss('DISMISSED');
                  setShowDropdown(false);
                }}>
                  Risk Accepted - I understand the risk
                </DropdownItem>
                <DropdownItem onClick={() => {
                  onDismiss('IGNORED');
                  setShowDropdown(false);
                }}>
                  False Positive - Not a real issue
                </DropdownItem>
              </DropdownMenu>
            )}
          </DismissDropdownContainer>
        )}
      </CardActions>
    </CardContainer>
  );
};
