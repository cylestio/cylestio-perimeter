import { type FC, useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Terminal, 
  FileCode, 
  Activity,
  AlertTriangle,
  Lightbulb,
  Code2,
  Shield,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import styled, { css } from 'styled-components';

import type { Recommendation, FindingSeverity } from '@api/types/findings';

// Styled Components
const Card = styled.div<{ $severity: FindingSeverity; $expanded: boolean; $resolved: boolean }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ $severity, $resolved, theme }) => {
    if ($resolved) return theme.colors.borderSubtle;
    switch ($severity) {
      case 'CRITICAL': return theme.colors.severityCritical + '40';
      case 'HIGH': return theme.colors.severityHigh + '35';
      default: return theme.colors.borderSubtle;
    }
  }};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ $expanded, theme }) => $expanded && css`
    border-color: ${theme.colors.cyan};
    box-shadow: 0 0 0 1px ${theme.colors.cyan}30;
  `}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

const SeverityIndicator = styled.div<{ $severity: FindingSeverity; $glow: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  background: ${({ $severity, theme }) => {
    switch ($severity) {
      case 'CRITICAL': return theme.colors.severityCritical;
      case 'HIGH': return theme.colors.severityHigh;
      case 'MEDIUM': return theme.colors.severityMedium;
      case 'LOW': return theme.colors.severityLow;
    }
  }};
  ${({ $glow, $severity, theme }) => $glow && css`
    box-shadow: 0 0 8px ${
      $severity === 'CRITICAL' ? theme.colors.severityCritical :
      $severity === 'HIGH' ? theme.colors.severityHigh :
      'transparent'
    };
  `}
`;

const ContentSection = styled.div`
  flex: 1;
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

const TitleText = styled.h3<{ $resolved: boolean }>`
  font-size: ${({ theme }) => theme.typography.textMd};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ $resolved, theme }) => $resolved ? theme.colors.white50 : theme.colors.white};
  margin: 0;
  flex: 1;
  ${({ $resolved }) => $resolved && css`
    text-decoration: line-through;
  `}
`;

const SourceBadge = styled.span<{ $type: 'STATIC' | 'DYNAMIC' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 9px;
  font-weight: ${({ theme }) => theme.typography.weightBold};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
  background: ${({ $type, theme }) => 
    $type === 'STATIC' ? theme.colors.cyanSoft : theme.colors.purpleSoft};
  color: ${({ $type, theme }) => 
    $type === 'STATIC' ? theme.colors.cyan : theme.colors.purple};
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-wrap: wrap;
`;

const MetaItem = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  font-family: ${({ theme }) => theme.typography.fontMono};
`;

const MetaSeparator = styled.span`
  color: ${({ theme }) => theme.colors.white20};
`;

const TagBadge = styled.span`
  font-size: 9px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  padding: 2px 5px;
  border-radius: ${({ theme }) => theme.radii.xs};
  background: ${({ theme }) => theme.colors.surface3};
  color: ${({ theme }) => theme.colors.white70};
`;

const RightSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const CvssScore = styled.span<{ $score: number }>`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightBold};
  font-family: ${({ theme }) => theme.typography.fontMono};
  padding: 3px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $score, theme }) => 
    $score >= 9 ? theme.colors.redSoft :
    $score >= 7 ? theme.colors.severityHigh + '20' :
    $score >= 4 ? theme.colors.yellowSoft :
    theme.colors.surface3
  };
  color: ${({ $score, theme }) => 
    $score >= 9 ? theme.colors.severityCritical :
    $score >= 7 ? theme.colors.severityHigh :
    $score >= 4 ? theme.colors.severityMedium :
    theme.colors.white70
  };
`;

const ExpandButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white70};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
    color: ${({ theme }) => theme.colors.white};
    border-color: ${({ theme }) => theme.colors.borderMedium};
  }
`;

// Resolution Status Styles
const ResolutionBadge = styled.div<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'FIXED':
      case 'VERIFIED':
        return css`
          background: ${theme.colors.greenSoft};
          color: ${theme.colors.green};
        `;
      case 'DISMISSED':
        return css`
          background: ${theme.colors.yellowSoft};
          color: ${theme.colors.severityMedium};
        `;
      case 'IGNORED':
        return css`
          background: ${theme.colors.surface3};
          color: ${theme.colors.white50};
        `;
      default:
        return css`
          background: ${theme.colors.surface3};
          color: ${theme.colors.white50};
        `;
    }
  }}
`;

const ResolutionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const ResolutionDate = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

// Expanded Details Styles
const DetailsContainer = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface2};
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[5]};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const DetailIcon = styled.span`
  color: ${({ theme }) => theme.colors.white30};
`;

const DetailLabel = styled.h4`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white50};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
  margin: 0;
`;

const DetailText = styled.p`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white80};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.lineHeightRelaxed};
`;

const CodeBlock = styled.div`
  grid-column: 1 / -1;
  background: ${({ theme }) => theme.colors.void};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`;

const CodeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

const CodeHeaderIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.white30};
`;

const CodeFile = styled.span`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
  flex: 1;
`;

const CopyCodeButton = styled.button<{ $copied: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 10px;
  color: ${({ $copied, theme }) => $copied ? theme.colors.green : theme.colors.white50};
  cursor: pointer;
  
  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
    color: ${({ theme }) => theme.colors.white};
  }
`;

const CodeContent = styled.pre`
  margin: 0;
  padding: ${({ theme }) => theme.spacing[4]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white80};
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface};
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ $primary, theme }) => $primary ? css`
    background: ${theme.colors.cyan};
    border: none;
    color: ${theme.colors.void};
    font-family: ${theme.typography.fontMono};

    &:hover {
      opacity: 0.9;
    }
  ` : css`
    background: transparent;
    border: 1px solid ${theme.colors.borderSubtle};
    color: ${theme.colors.white70};

    &:hover {
      background: ${theme.colors.surface2};
      color: ${theme.colors.white};
      border-color: ${theme.colors.borderMedium};
    }
  `}
`;

// Types
export interface IssueCardProps {
  recommendation: Recommendation;
  onCopyCommand?: () => void;
  onMarkFixed?: () => void;
  onDismiss?: (type: 'DISMISSED' | 'IGNORED') => void;
  defaultExpanded?: boolean;
}

// Component
export const IssueCard: FC<IssueCardProps> = ({
  recommendation,
  onCopyCommand,
  onMarkFixed,
  onDismiss,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const shortId = recommendation.recommendation_id.slice(-8).toUpperCase();
  const fullFixCommand = `/fix ${recommendation.recommendation_id}`;
  const cleanTitle = recommendation.title.replace(/^Fix:\s*/i, '');
  const isResolved = ['FIXED', 'VERIFIED', 'DISMISSED', 'IGNORED'].includes(recommendation.status);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullFixCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopyCommand?.();
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCopyCode = async () => {
    if (!recommendation.code_snippet) return;
    try {
      await navigator.clipboard.writeText(recommendation.code_snippet);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <Card $severity={recommendation.severity} $expanded={expanded} $resolved={isResolved}>
      <CardHeader onClick={() => setExpanded(!expanded)}>
        <SeverityIndicator 
          $severity={recommendation.severity}
          $glow={!isResolved && (recommendation.severity === 'CRITICAL' || recommendation.severity === 'HIGH')}
        />
        
        <ContentSection>
          <TitleRow>
            <TitleText $resolved={isResolved}>{cleanTitle}</TitleText>
          </TitleRow>
          <MetaRow>
            <SourceBadge $type={recommendation.source_type}>
              {recommendation.source_type === 'STATIC' ? (
                <><FileCode size={9} /> Static</>
              ) : (
                <><Activity size={9} /> Dynamic</>
              )}
            </SourceBadge>
            <MetaSeparator>•</MetaSeparator>
            <MetaItem>{shortId}</MetaItem>
            {recommendation.file_path && (
              <>
                <MetaSeparator>•</MetaSeparator>
                <MetaItem>{recommendation.file_path.split('/').pop()}</MetaItem>
                {recommendation.line_start && (
                  <MetaItem>:{recommendation.line_start}</MetaItem>
                )}
              </>
            )}
            {recommendation.category && (
              <>
                <MetaSeparator>•</MetaSeparator>
                <TagBadge>{recommendation.category}</TagBadge>
              </>
            )}
            {recommendation.owasp_llm && (
              <TagBadge>{recommendation.owasp_llm}</TagBadge>
            )}
          </MetaRow>
          
          {/* Resolution Info for resolved issues */}
          {isResolved && (
            <ResolutionInfo>
              <ResolutionBadge $status={recommendation.status}>
                {recommendation.status === 'FIXED' || recommendation.status === 'VERIFIED' ? (
                  <><CheckCircle size={12} /> Fixed</>
                ) : recommendation.status === 'DISMISSED' ? (
                  <><XCircle size={12} /> Risk Accepted</>
                ) : (
                  <><XCircle size={12} /> False Positive</>
                )}
              </ResolutionBadge>
              {(recommendation.fixed_at || recommendation.updated_at) && (
                <ResolutionDate>
                  <Clock size={10} />
                  {new Date(recommendation.fixed_at || recommendation.updated_at || '').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </ResolutionDate>
              )}
            </ResolutionInfo>
          )}
        </ContentSection>

        <RightSection>
          {recommendation.cvss_score && (
            <CvssScore $score={recommendation.cvss_score}>
              CVSS {recommendation.cvss_score}
            </CvssScore>
          )}
          <ExpandButton onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Less' : 'More'}
          </ExpandButton>
        </RightSection>
      </CardHeader>

      {expanded && (
        <DetailsContainer>
          <DetailsGrid>
            {/* Description */}
            {recommendation.description && (
              <DetailSection>
                <DetailHeader>
                  <DetailIcon><AlertTriangle size={12} /></DetailIcon>
                  <DetailLabel>Issue</DetailLabel>
                </DetailHeader>
                <DetailText>{recommendation.description}</DetailText>
              </DetailSection>
            )}

            {/* Impact */}
            {recommendation.impact && (
              <DetailSection>
                <DetailHeader>
                  <DetailIcon><Shield size={12} /></DetailIcon>
                  <DetailLabel>Impact</DetailLabel>
                </DetailHeader>
                <DetailText>{recommendation.impact}</DetailText>
              </DetailSection>
            )}

            {/* Fix Hints */}
            {recommendation.fix_hints && (
              <DetailSection style={{ gridColumn: '1 / -1' }}>
                <DetailHeader>
                  <DetailIcon><Lightbulb size={12} /></DetailIcon>
                  <DetailLabel>Fix Suggestion</DetailLabel>
                </DetailHeader>
                <DetailText>{recommendation.fix_hints}</DetailText>
              </DetailSection>
            )}

            {/* Code Snippet */}
            {recommendation.code_snippet && (
              <CodeBlock>
                <CodeHeader>
                  <CodeHeaderIcon><Code2 size={12} /></CodeHeaderIcon>
                  <CodeFile>
                    {recommendation.file_path || 'snippet'}
                    {recommendation.line_start && ` (line ${recommendation.line_start})`}
                  </CodeFile>
                  <CopyCodeButton $copied={codeCopied} onClick={handleCopyCode}>
                    {codeCopied ? <Check size={10} /> : <Copy size={10} />}
                    {codeCopied ? 'Copied' : 'Copy'}
                  </CopyCodeButton>
                </CodeHeader>
                <CodeContent>{recommendation.code_snippet}</CodeContent>
              </CodeBlock>
            )}
          </DetailsGrid>

          {!isResolved && (
            <ActionsRow>
              <ActionButton $primary onClick={handleCopy}>
                {copied ? <Check size={12} /> : <Terminal size={12} />}
                {copied ? 'Copied!' : `/fix ${shortId}`}
              </ActionButton>

              {recommendation.status === 'FIXING' && onMarkFixed && (
                <ActionButton onClick={() => onMarkFixed()}>
                  <Check size={12} />
                  Mark Fixed
                </ActionButton>
              )}

              {onDismiss && (
                <>
                  <ActionButton onClick={() => onDismiss('DISMISSED')}>
                    Risk Accepted
                  </ActionButton>
                  <ActionButton onClick={() => onDismiss('IGNORED')}>
                    False Positive
                  </ActionButton>
                </>
              )}
            </ActionsRow>
          )}
        </DetailsContainer>
      )}
    </Card>
  );
};
