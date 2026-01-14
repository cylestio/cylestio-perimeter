import type { FC } from 'react';

import { Shield, CheckCircle, XCircle, Clock, ArrowRight, Loader2, Search, Zap, GitMerge, Wrench } from 'lucide-react';

import type { GateStatus } from '@api/types/findings';
import { Button } from '@ui/core/Button';
import { TimeAgo } from '@ui/core/TimeAgo';
import { OrbLoader } from '@ui/feedback/OrbLoader';

import {
  CardWrapper,
  CardHeader,
  HeaderLeft,
  StatusIcon,
  HeaderContent,
  Title,
  Subtitle,
  ScanningBadge,
  CardBody,
  StatsGrid,
  StatItem,
  StatValue,
  StatLabel,
  CTASection,
  LastScanInfo,
  GateStatusBadge,
  ExplanationCard,
  ExplanationHeader,
  ExplanationIconWrapper,
  ExplanationTitleGroup,
  ExplanationTitle,
  ExplanationSubtitle,
  ExplanationBody,
  ExplanationText,
  FeatureList,
  FeatureItem,
  FeatureIcon,
  FeatureContent,
  FeatureLabel,
  FeatureDescription,
} from './ScanOverviewCard.styles';

export interface ScanOverviewCardProps {
  /** Whether a scan is currently in progress */
  isScanning: boolean;
  /** Gate status from the latest scan */
  gateStatus?: GateStatus;
  /** Timestamp of the last scan */
  lastScanTime?: string;
  /** Total findings count */
  totalFindings?: number;
  /** Severity breakdown */
  severityCounts?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  /** Number of checks that passed */
  checksPassed?: number;
  /** Total number of checks */
  checksTotal?: number;
  /** Callback when user clicks to view details */
  onViewDetails?: () => void;
  /** Latest scan session ID for navigation */
  latestScanId?: string;
  className?: string;
}

export const ScanOverviewCard: FC<ScanOverviewCardProps> = ({
  isScanning,
  gateStatus,
  lastScanTime,
  totalFindings = 0,
  severityCounts,
  checksPassed = 0,
  checksTotal = 0,
  onViewDetails,
  className,
}) => {
  // Determine card status
  const getCardStatus = (): 'scanning' | 'pass' | 'fail' | 'empty' => {
    if (isScanning) return 'scanning';
    if (!lastScanTime) return 'empty';
    if (gateStatus === 'BLOCKED') return 'fail';
    return 'pass';
  };

  const cardStatus = getCardStatus();

  // Get status title and subtitle
  const getStatusContent = () => {
    switch (cardStatus) {
      case 'scanning':
        return {
          title: 'Security Scan In Progress',
          subtitle: 'Analyzing your agent code for vulnerabilities...',
        };
      case 'pass':
        return {
          title: 'Production Ready',
          subtitle: totalFindings === 0
            ? 'No security issues found - your agent is ready for production'
            : `${totalFindings} findings identified, none blocking`,
        };
      case 'fail':
        return {
          title: 'Attention Required',
          subtitle: `${totalFindings} findings require attention before production`,
        };
      default:
        return {
          title: 'No Scans Yet',
          subtitle: 'Connect your IDE and run a security scan',
        };
    }
  };

  const { title, subtitle } = getStatusContent();

  // Render status icon
  const renderStatusIcon = () => {
    switch (cardStatus) {
      case 'scanning':
        return <OrbLoader size="sm" />;
      case 'pass':
        return <CheckCircle size={24} />;
      case 'fail':
        return <XCircle size={24} />;
      default:
        return <Shield size={24} />;
    }
  };

  // If empty state, just show explanation
  if (cardStatus === 'empty') {
    return (
      <ExplanationCard className={className}>
        <ExplanationHeader>
          <ExplanationIconWrapper>
            <Shield size={24} />
          </ExplanationIconWrapper>
          <ExplanationTitleGroup>
            <ExplanationTitle>Static Analysis</ExplanationTitle>
            <ExplanationSubtitle>AI-powered security scanning for your agent code</ExplanationSubtitle>
          </ExplanationTitleGroup>
        </ExplanationHeader>
        <ExplanationBody>
          <ExplanationText>
            Static analysis examines your agent code without execution to identify security
            vulnerabilities before they reach production. Your AI coding assistant scans across
            all <strong>OWASP LLM Top 10</strong> categories including prompt injection, insecure
            output handling, data leakage, and excessive agency.
          </ExplanationText>
          <ExplanationText>
            When combined with dynamic analysis (runtime monitoring), static findings are
            <strong> correlated</strong> with actual execution evidence - distinguishing real
            vulnerabilities from false positives and theoretical risks that were never exercised.
          </ExplanationText>
          <FeatureList>
            <FeatureItem>
              <FeatureIcon>
                <Search size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Deep Code Analysis</FeatureLabel>
                <FeatureDescription>Scans all OWASP LLM Top 10 vulnerability categories</FeatureDescription>
              </FeatureContent>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>
                <GitMerge size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Runtime Correlation</FeatureLabel>
                <FeatureDescription>Validates findings against actual execution evidence</FeatureDescription>
              </FeatureContent>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>
                <Wrench size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>One-Click Fixes</FeatureLabel>
                <FeatureDescription>AI-generated patches for identified vulnerabilities</FeatureDescription>
              </FeatureContent>
            </FeatureItem>
            <FeatureItem>
              <FeatureIcon>
                <Zap size={14} />
              </FeatureIcon>
              <FeatureContent>
                <FeatureLabel>Instant Results</FeatureLabel>
                <FeatureDescription>Get actionable recommendations in seconds</FeatureDescription>
              </FeatureContent>
            </FeatureItem>
          </FeatureList>
        </ExplanationBody>
      </ExplanationCard>
    );
  }

  return (
    <CardWrapper $status={cardStatus} className={className}>
      <CardHeader $status={cardStatus}>
        <HeaderLeft>
          <StatusIcon $status={cardStatus}>
            {renderStatusIcon()}
          </StatusIcon>
          <HeaderContent>
            <Title>{title}</Title>
            <Subtitle>{subtitle}</Subtitle>
          </HeaderContent>
        </HeaderLeft>
        {cardStatus === 'scanning' && (
          <ScanningBadge>
            <Loader2 size={12} className="animate-spin" />
            Scanning
          </ScanningBadge>
        )}
        {cardStatus !== 'scanning' && onViewDetails && (
          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight size={16} />}
            onClick={onViewDetails}
          >
            View Full Results
          </Button>
        )}
      </CardHeader>

      <CardBody>
        {/* Stats Grid - only show if we have scan results */}
        {!isScanning && severityCounts && (
          <StatsGrid>
            <StatItem>
              <StatValue $severity={severityCounts.critical > 0 ? 'critical' : undefined}>
                {severityCounts.critical}
              </StatValue>
              <StatLabel>Critical</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue $severity={severityCounts.high > 0 ? 'high' : undefined}>
                {severityCounts.high}
              </StatValue>
              <StatLabel>High</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue $severity={severityCounts.medium > 0 ? 'medium' : undefined}>
                {severityCounts.medium}
              </StatValue>
              <StatLabel>Medium</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue $severity={severityCounts.low > 0 ? 'low' : undefined}>
                {severityCounts.low}
              </StatValue>
              <StatLabel>Low</StatLabel>
            </StatItem>
          </StatsGrid>
        )}

        {/* CTA Section */}
        <CTASection>
          <LastScanInfo>
            <Clock size={14} />
            {isScanning ? (
              'Scan started...'
            ) : lastScanTime ? (
              <>Last scan: <TimeAgo timestamp={lastScanTime} /></>
            ) : (
              'No scans yet'
            )}
            {!isScanning && checksTotal > 0 && (
              <span style={{ marginLeft: '12px' }}>
                {checksPassed}/{checksTotal} checks passed
              </span>
            )}
          </LastScanInfo>
          {gateStatus && (
            <GateStatusBadge $status={gateStatus}>
              {gateStatus === 'BLOCKED' ? <XCircle size={14} /> : <CheckCircle size={14} />}
              {gateStatus === 'BLOCKED' ? 'Attention Required' : 'Production Ready'}
            </GateStatusBadge>
          )}
        </CTASection>
      </CardBody>
    </CardWrapper>
  );
};
