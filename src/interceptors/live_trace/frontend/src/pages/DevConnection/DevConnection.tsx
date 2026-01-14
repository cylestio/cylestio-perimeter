import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';

import { Check, X } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { DevConnectionIcon } from '@constants/pageIcons';
import { fetchIDEConnectionStatus } from '@api/endpoints/ide';
import { fetchConfig } from '@api/endpoints/config';
import type { IDEConnectionStatus } from '@api/types/ide';
import type { ConfigResponse } from '@api/types/config';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { Card } from '@ui/core/Card';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';

import { IDEConnectionBanner, IDESetupSection } from '@domain/ide';

import { usePageMeta } from '../../context';
import {
  FeatureCardWrapper,
  FeatureTable,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  FeatureName,
  FeatureDescription,
  CheckIcon,
  CollapsibleSection,
  CollapsibleHeader,
  CollapsibleTitle,
  CollapsibleIcon,
  CollapsibleContent,
} from './DevConnection.styles';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface DevConnectionProps {
  className?: string;
}

// Feature definitions with detailed descriptions
const FEATURE_DETAILS = {
  staticAnalysis: {
    name: 'Static Analysis',
    shortName: 'Static Analysis',
    isSkill: true,
    description: 'Examines agent code without execution to identify security vulnerabilities. Scans across OWASP LLM Top 10 categories including prompt injection, insecure output, data leakage, and excessive agency.',
  },
  correlation: {
    name: 'Correlation',
    shortName: 'Correlation',
    isSkill: true,
    description: 'Connects static code findings with runtime evidence to distinguish genuine vulnerabilities from false positives.',
  },
  fixRecommendations: {
    name: 'Fix Recommendations',
    shortName: 'Fix Recommendations',
    isSkill: true,
    description: 'Provides actionable fix recommendations for each security finding. Generates code patches and remediation guidance based on vulnerability type and context.',
  },
  dataAccess: {
    name: 'Direct Data Access',
    shortName: 'Direct Data Access',
    isSkill: false,
    description: 'Query the Agent Inspector database directly from your IDE. Access sessions, findings, security checks, and agent status through MCP tools.',
  },
  debugTrace: {
    name: 'Debug & Trace',
    shortName: 'Debug & Trace',
    isSkill: false,
    description: 'Debug running sessions in your IDE with access to detailed trace and dynamic run data to verify hypotheses, track LLM decisions, and understand agent behavior.',
  },
};

// Feature availability per integration type
const INTEGRATION_FEATURES = {
  cursor: {
    staticAnalysis: true,
    correlation: true,
    fixRecommendations: true,
    dataAccess: true,
    debugTrace: true,
  },
  'claude-code': {
    staticAnalysis: true,
    correlation: true,
    fixRecommendations: true,
    dataAccess: true,
    debugTrace: true,
  },
  'mcp-only': {
    staticAnalysis: false,
    correlation: false,
    fixRecommendations: false,
    dataAccess: true,
    debugTrace: true,
  },
};

// Feature comparison table data (order matters for display)
const FEATURE_TABLE_DATA: Array<{ key: keyof typeof FEATURE_DETAILS; name: string; description: string; isSkill: boolean }> = [
  { key: 'staticAnalysis', name: FEATURE_DETAILS.staticAnalysis.shortName, description: FEATURE_DETAILS.staticAnalysis.description, isSkill: FEATURE_DETAILS.staticAnalysis.isSkill },
  { key: 'correlation', name: FEATURE_DETAILS.correlation.shortName, description: FEATURE_DETAILS.correlation.description, isSkill: FEATURE_DETAILS.correlation.isSkill },
  { key: 'fixRecommendations', name: FEATURE_DETAILS.fixRecommendations.shortName, description: FEATURE_DETAILS.fixRecommendations.description, isSkill: FEATURE_DETAILS.fixRecommendations.isSkill },
  { key: 'dataAccess', name: FEATURE_DETAILS.dataAccess.shortName, description: FEATURE_DETAILS.dataAccess.description, isSkill: FEATURE_DETAILS.dataAccess.isSkill },
  { key: 'debugTrace', name: FEATURE_DETAILS.debugTrace.shortName, description: FEATURE_DETAILS.debugTrace.description, isSkill: FEATURE_DETAILS.debugTrace.isSkill },
];

export const DevConnection: FC<DevConnectionProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();

  const [connectionStatus, setConnectionStatus] = useState<IDEConnectionStatus | null>(null);
  const [serverConfig, setServerConfig] = useState<ConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(true);
  const [showFeatures, setShowFeatures] = useState(true);

  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'IDE Connection' })
      : [{ label: 'Agent Workflows', href: '/' }, { label: 'IDE Connection' }],
  });

  const fetchStatus = useCallback(async () => {
    // Need a workflow ID for the simplified API
    if (!agentWorkflowId || agentWorkflowId === 'unassigned') {
      setConnectionStatus({
        has_activity: false,
        last_seen: null,
        ide: null,
      });
      setIsLoading(false);
      return;
    }

    try {
      const status = await fetchIDEConnectionStatus(agentWorkflowId);
      setConnectionStatus(status);
    } catch {
      setConnectionStatus({
        has_activity: false,
        last_seen: null,
        ide: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, [agentWorkflowId]);

  // Fetch server config for MCP URL
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await fetchConfig();
        setServerConfig(config);
      } catch {
        // Use defaults if config fetch fails
        setServerConfig(null);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Collapse setup and features sections by default when connected
  useEffect(() => {
    if (connectionStatus?.has_activity) {
      setShowSetup(false);
      setShowFeatures(false);
    }
  }, [connectionStatus?.has_activity]);

  const hasActivity = connectionStatus?.has_activity ?? false;

  const renderFeatureTable = (noMargin = false) => (
    <FeatureCardWrapper $noMargin={noMargin}>
      <Card>
        {!noMargin && <Card.Header title="Feature Comparison" />}
        <Card.Content noPadding>
          <FeatureTable>
          <TableHead>
            <TableRow>
              <TableHeader>Feature</TableHeader>
              <TableHeader>Cursor</TableHeader>
              <TableHeader>Claude Code</TableHeader>
              <TableHeader>MCP</TableHeader>
            </TableRow>
          </TableHead>
          <tbody>
            {FEATURE_TABLE_DATA.map((feature) => (
              <TableRow key={feature.key}>
                <TableCell>
                  <FeatureName>
                    {feature.name}
                    {feature.isSkill && <Badge variant="ai" size="sm">Skill</Badge>}
                  </FeatureName>
                  <FeatureDescription>{feature.description}</FeatureDescription>
                </TableCell>
                <TableCell>
                  <CheckIcon $available={INTEGRATION_FEATURES.cursor[feature.key]}>
                    {INTEGRATION_FEATURES.cursor[feature.key] ? <Check size={16} /> : <X size={16} />}
                  </CheckIcon>
                </TableCell>
                <TableCell>
                  <CheckIcon $available={INTEGRATION_FEATURES['claude-code'][feature.key]}>
                    {INTEGRATION_FEATURES['claude-code'][feature.key] ? <Check size={16} /> : <X size={16} />}
                  </CheckIcon>
                </TableCell>
                <TableCell>
                  <CheckIcon $available={INTEGRATION_FEATURES['mcp-only'][feature.key]}>
                    {INTEGRATION_FEATURES['mcp-only'][feature.key] ? <Check size={16} /> : <X size={16} />}
                  </CheckIcon>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
          </FeatureTable>
        </Card.Content>
      </Card>
    </FeatureCardWrapper>
  );

  return (
    <Page className={className} data-testid="dev-connection">
      <PageHeader
        icon={<DevConnectionIcon size={24} />}
        title="IDE Connection"
        description="Connect your development environment for AI-powered security scanning"
      />

      {/* Status Banner - Top, Full Width, Separated */}
      <IDEConnectionBanner
        connectionStatus={connectionStatus}
        isLoading={isLoading}
      />

      {/* Setup Section - Collapsible when connected */}
      {hasActivity ? (
        <CollapsibleSection>
          <CollapsibleHeader onClick={() => setShowSetup(!showSetup)}>
            <CollapsibleTitle>
              Setup Instructions
            </CollapsibleTitle>
            <CollapsibleIcon>
              {showSetup ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </CollapsibleIcon>
          </CollapsibleHeader>
          <CollapsibleContent $expanded={showSetup}>
            <IDESetupSection
              connectionStatus={connectionStatus}
              serverConfig={serverConfig}
            />
          </CollapsibleContent>
        </CollapsibleSection>
      ) : (
        <IDESetupSection
          connectionStatus={connectionStatus}
          serverConfig={serverConfig}
        />
      )}

      {/* Feature Comparison Table - Collapsible when connected */}
      {hasActivity ? (
        <CollapsibleSection>
          <CollapsibleHeader onClick={() => setShowFeatures(!showFeatures)}>
            <CollapsibleTitle>
              Feature Comparison
            </CollapsibleTitle>
            <CollapsibleIcon>
              {showFeatures ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </CollapsibleIcon>
          </CollapsibleHeader>
          <CollapsibleContent $expanded={showFeatures}>
            {renderFeatureTable(true)}
          </CollapsibleContent>
        </CollapsibleSection>
      ) : (
        renderFeatureTable()
      )}
    </Page>
  );
};
