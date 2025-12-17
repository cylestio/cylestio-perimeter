import { type FC, useState, useRef, useEffect } from 'react';
import { ExternalLink, Check, Terminal, MoreHorizontal } from 'lucide-react';

import type { Recommendation } from '@api/types/findings';

import { SeverityDot } from '@ui/core/Badge';

import {
  CardContainer,
  CardHeader,
  TitleRow,
  TitleText,
  CvssScore,
  DescriptionText,
  MetadataRow,
  MetadataItem,
  MetadataSeparator,
  CardActions,
  FixButton,
  LinkButton,
  MoreButton,
  DropdownMenu,
  DropdownItem,
} from './RecommendationCard.styles';

export interface RecommendationCardProps {
  recommendation: Recommendation;
  onCopyCommand?: () => void;
  onMarkFixed?: () => void;
  onDismiss?: (type: 'DISMISSED' | 'IGNORED') => void;
  onViewFinding?: (findingId: string) => void;
  showFixAction?: boolean;
}

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Truncate ID to last 8 characters for display
  const shortId = recommendation.recommendation_id.slice(-8);
  const fixCommand = `/fix ${shortId}`;

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(`/fix ${recommendation.recommendation_id}`);
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

  // Clean title - remove "Fix:" prefix if present
  const cleanTitle = recommendation.title.replace(/^Fix:\s*/i, '');

  return (
    <CardContainer $severity={recommendation.severity} $resolved={isResolved}>
      {/* Header: Title with severity dot and CVSS score */}
      <CardHeader>
        <TitleRow>
          <SeverityDot 
            severity={recommendation.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'} 
            glow={!isResolved && (recommendation.severity === 'CRITICAL' || recommendation.severity === 'HIGH')}
          />
          <TitleText $resolved={isResolved}>{cleanTitle}</TitleText>
        </TitleRow>
        {recommendation.cvss_score && (
          <CvssScore>CVSS {recommendation.cvss_score}</CvssScore>
        )}
      </CardHeader>

      {/* Description - single line, truncated */}
      {recommendation.description && (
        <DescriptionText>{recommendation.description}</DescriptionText>
      )}

      {/* Compact metadata line: ID • Source • Framework */}
      <MetadataRow>
        <MetadataItem>{shortId}</MetadataItem>
        <MetadataSeparator>•</MetadataSeparator>
        <MetadataItem>{recommendation.source_type === 'STATIC' ? 'Static' : 'Dynamic'}</MetadataItem>
        {recommendation.owasp_llm && (
          <>
            <MetadataSeparator>•</MetadataSeparator>
            <MetadataItem>{recommendation.owasp_llm}</MetadataItem>
          </>
        )}
      </MetadataRow>

      {/* Compact actions row */}
      <CardActions>
        {/* Fix button - compact, primary action */}
        {showFixAction && !isResolved && (
          <FixButton onClick={handleCopyCommand} $copied={copied}>
            {copied ? <Check size={14} /> : <Terminal size={14} />}
            {copied ? 'Copied!' : fixCommand}
          </FixButton>
        )}

        {/* View Finding link */}
        {recommendation.source_finding_id && onViewFinding && (
          <LinkButton onClick={() => onViewFinding(recommendation.source_finding_id)}>
            View Finding
            <ExternalLink size={12} />
          </LinkButton>
        )}

        {/* More actions dropdown */}
        {!isResolved && (onDismiss || onMarkFixed) && (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <MoreButton onClick={() => setShowDropdown(!showDropdown)}>
              <MoreHorizontal size={16} />
            </MoreButton>
            {showDropdown && (
              <DropdownMenu>
                {recommendation.status === 'FIXING' && onMarkFixed && (
                  <DropdownItem onClick={() => {
                    onMarkFixed();
                    setShowDropdown(false);
                  }}>
                    <Check size={14} />
                    Mark as Fixed
                  </DropdownItem>
                )}
                {onDismiss && (
                  <>
                    <DropdownItem onClick={() => {
                      onDismiss('DISMISSED');
                      setShowDropdown(false);
                    }}>
                      Dismiss - Risk Accepted
                    </DropdownItem>
                    <DropdownItem onClick={() => {
                      onDismiss('IGNORED');
                      setShowDropdown(false);
                    }}>
                      Dismiss - False Positive
                    </DropdownItem>
                  </>
                )}
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Status badge for resolved items */}
        {isResolved && (
          <MetadataItem style={{ marginLeft: 'auto', opacity: 0.7 }}>
            {recommendation.status}
          </MetadataItem>
        )}
      </CardActions>
    </CardContainer>
  );
};
