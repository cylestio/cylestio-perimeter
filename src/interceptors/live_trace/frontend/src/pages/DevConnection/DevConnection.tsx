import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';

import {
  Check,
  Copy,
  AlertTriangle,
  FolderOpen,
  Clock,
  ArrowRight,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

import { DevConnectionIcon } from '@constants/pageIcons';
import { fetchIDEConnectionStatus } from '@api/endpoints/ide';
import { fetchConfig } from '@api/endpoints/config';
import type { IDEConnectionStatus } from '@api/types/ide';
import type { ConfigResponse } from '@api/types/config';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { Button } from '@ui/core/Button';
import { Card } from '@ui/core/Card';
import { TimeAgo } from '@ui/core/TimeAgo';
import { CursorIcon, ClaudeCodeIcon } from '@ui/icons';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { OrbLoader } from '@ui/feedback/OrbLoader';

import { usePageMeta } from '../../context';
import {
  StatusBanner,
  StatusIconWrapper,
  StatusContent,
  StatusTitle,
  StatusDetails,
  StatusDetail,
  LiveBadge,
  LiveDot,
  SplitContainer,
  LeftPanel,
  LeftPanelHeader,
  IntegrationCards,
  IntegrationCard,
  CardHeader,
  CardIcon,
  CardTitle,
  CardBadge,
  FeatureList,
  FeatureItem,
  FeatureIcon,
  RightPanel,
  RightPanelHeader,
  RightPanelDescription,
  InstructionSection,
  InstructionLabel,
  CommandBlock,
  CommandNumber,
  CommandText,
  CodeBlock,
  WarningNote,
  WarningIcon,
  WarningText,
  FeatureCardWrapper,
  FeatureTable,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  FeatureName,
  FeatureDescription,
  CheckIcon,
  SuccessContent,
  SuccessHeader,
  SuccessTitle,
  ConnectionDetails,
  DetailItem,
  DetailLabel,
  DetailValue,
  ActionButton,
  CollapsibleSection,
  CollapsibleHeader,
  CollapsibleTitle,
  CollapsibleIcon,
  CollapsibleContent,
} from './DevConnection.styles';

export interface DevConnectionProps {
  className?: string;
}

type ConnectionTab = 'cursor' | 'claude-code' | 'mcp-only';

const CURSOR_COMMAND =
  'Fetch and follow instructions from https://raw.githubusercontent.com/cylestio/agent-inspector/main/integrations/AGENT_INSPECTOR_SETUP.md';

const CLAUDE_CODE_COMMANDS = [
  '/plugin marketplace add cylestio/agent-inspector',
  '/plugin install agent-inspector@cylestio',
  '/agent-inspector:setup',
];

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

function getIDEDisplayName(ideType: string): string {
  switch (ideType) {
    case 'cursor':
      return 'Cursor';
    case 'claude-code':
      return 'Claude Code';
    default:
      return ideType;
  }
}

function getMcpServerUrl(config: ConfigResponse | null): string {
  if (!config) return 'http://localhost:7100/mcp';
  const host = config.proxy_host === '0.0.0.0' ? 'localhost' : config.proxy_host;
  return `http://${host}:${config.proxy_port}/mcp`;
}

export const DevConnection: FC<DevConnectionProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();
  const navigate = useNavigate();

  const [connectionStatus, setConnectionStatus] = useState<IDEConnectionStatus | null>(null);
  const [serverConfig, setServerConfig] = useState<ConfigResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ConnectionTab>('cursor');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
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

      // Auto-select the IDE's tab if we have IDE metadata
      if (status.has_activity && status.ide) {
        setActiveTab(status.ide.ide_type as ConnectionTab);
      }
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

  const handleCopy = async (command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const handleNavigate = () => {
    if (agentWorkflowId && agentWorkflowId !== 'unassigned') {
      navigate(`/agent-workflow/${agentWorkflowId}`);
    } else {
      navigate('/');
    }
  };

  const hasActivity = connectionStatus?.has_activity ?? false;
  const ideMetadata = connectionStatus?.ide;

  // Check if the currently selected tab matches the connected IDE
  const isSelectedTabConnected =
    hasActivity &&
    ideMetadata &&
    ideMetadata.ide_type === activeTab;

  // Generate MCP config JSON with dynamic URL
  const mcpServerUrl = getMcpServerUrl(serverConfig);
  const MCP_CONFIG_CURSOR = `{
  "mcpServers": {
    "agent-inspector": {
      "type": "streamable-http",
      "url": "${mcpServerUrl}"
    }
  }
}`;

  const MCP_CONFIG_CLAUDE = `{
  "mcpServers": {
    "agent-inspector": {
      "type": "http",
      "url": "${mcpServerUrl}"
    }
  }
}`;

  const renderFeatureCheckmark = (available: boolean) => (
    <FeatureIcon $available={available}>
      {available ? <Check size={12} /> : <X size={12} />}
    </FeatureIcon>
  );

  const renderIntegrationCard = (
    type: ConnectionTab,
    icon: React.ReactNode,
    title: string,
    isFullIntegration: boolean
  ) => {
    const features = INTEGRATION_FEATURES[type];
    const isActive = activeTab === type;
    const isThisConnected = hasActivity && ideMetadata?.ide_type === type;

    return (
      <IntegrationCard
        $active={isActive}
        $connected={isThisConnected}
        onClick={() => setActiveTab(type)}
      >
        <CardHeader>
          <CardIcon $active={isActive}>{icon}</CardIcon>
          <CardTitle $active={isActive}>{title}</CardTitle>
          {isThisConnected ? (
            <CardBadge $variant="connected">Connected</CardBadge>
          ) : (
            <CardBadge $variant={isFullIntegration ? 'full' : 'basic'}>
              {isFullIntegration ? 'Full' : 'Basic'}
            </CardBadge>
          )}
        </CardHeader>
        <FeatureList>
          <FeatureItem $available={features.staticAnalysis}>
            {renderFeatureCheckmark(features.staticAnalysis)}
            {FEATURE_DETAILS.staticAnalysis.shortName}
          </FeatureItem>
          <FeatureItem $available={features.correlation}>
            {renderFeatureCheckmark(features.correlation)}
            {FEATURE_DETAILS.correlation.shortName}
          </FeatureItem>
          <FeatureItem $available={features.debugTrace}>
            {renderFeatureCheckmark(features.debugTrace)}
            {FEATURE_DETAILS.debugTrace.shortName}
          </FeatureItem>
        </FeatureList>
      </IntegrationCard>
    );
  };

  const renderInstructions = () => {
    switch (activeTab) {
      case 'cursor':
        return (
          <>
            <RightPanelHeader>Connect Cursor</RightPanelHeader>
            <RightPanelDescription>
              AI-powered code editor with full Agent Inspector integration including slash commands, MCP tools, and static security scanning.
            </RightPanelDescription>
            <InstructionSection>
              <InstructionLabel>Run this command in Cursor:</InstructionLabel>
              <CommandBlock>
                <CommandText>{CURSOR_COMMAND}</CommandText>
                <Button
                  variant={copiedCommand === CURSOR_COMMAND ? 'success' : 'ghost'}
                  size="sm"
                  icon={copiedCommand === CURSOR_COMMAND ? <Check size={14} /> : <Copy size={14} />}
                  onClick={() => handleCopy(CURSOR_COMMAND)}
                />
              </CommandBlock>
            </InstructionSection>
          </>
        );

      case 'claude-code':
        return (
          <>
            <RightPanelHeader>Connect Claude Code</RightPanelHeader>
            <RightPanelDescription>
              Claude coding assistant CLI with full Agent Inspector integration including slash commands, MCP tools, and static security scanning.
            </RightPanelDescription>
            <InstructionSection>
              <InstructionLabel>
                <strong>Important:</strong> These are the instructions for Claude Code only!
              </InstructionLabel>
              <InstructionLabel>Run these commands in Claude Code:</InstructionLabel>
              {CLAUDE_CODE_COMMANDS.map((cmd, index) => (
                <CommandBlock key={cmd}>
                  <CommandNumber>{index + 1}</CommandNumber>
                  <CommandText>{cmd}</CommandText>
                  <Button
                    variant={copiedCommand === cmd ? 'success' : 'ghost'}
                    size="sm"
                    icon={copiedCommand === cmd ? <Check size={14} /> : <Copy size={14} />}
                    onClick={() => handleCopy(cmd)}
                  />
                </CommandBlock>
              ))}
              <InstructionLabel>
                <strong>Note:</strong> You might need to restart Claude Code for the MCP connection to activate.
              </InstructionLabel>
            </InstructionSection>
          </>
        );

      case 'mcp-only':
        return (
          <>
            <RightPanelHeader>MCP Configuration Only</RightPanelHeader>
            <RightPanelDescription>
              Manual MCP server configuration for basic runtime monitoring without IDE integration features.
            </RightPanelDescription>
            <InstructionSection>
              <InstructionLabel>
                MCP Server URL: <code>{mcpServerUrl}</code>
              </InstructionLabel>
            </InstructionSection>
            <InstructionSection>
              <InstructionLabel>For Cursor - add to <code>.cursor/mcp.json</code>:</InstructionLabel>
              <CodeBlock>{MCP_CONFIG_CURSOR}</CodeBlock>
              <Button
                variant={copiedCommand === MCP_CONFIG_CURSOR ? 'success' : 'ghost'}
                size="sm"
                icon={copiedCommand === MCP_CONFIG_CURSOR ? <Check size={14} /> : <Copy size={14} />}
                onClick={() => handleCopy(MCP_CONFIG_CURSOR)}
              >
                {copiedCommand === MCP_CONFIG_CURSOR ? 'Copied!' : 'Copy'}
              </Button>
            </InstructionSection>
            <InstructionSection>
              <InstructionLabel>For Claude Code - add to <code>.mcp.json</code>:</InstructionLabel>
              <CodeBlock>{MCP_CONFIG_CLAUDE}</CodeBlock>
              <Button
                variant={copiedCommand === MCP_CONFIG_CLAUDE ? 'success' : 'ghost'}
                size="sm"
                icon={copiedCommand === MCP_CONFIG_CLAUDE ? <Check size={14} /> : <Copy size={14} />}
                onClick={() => handleCopy(MCP_CONFIG_CLAUDE)}
              >
                {copiedCommand === MCP_CONFIG_CLAUDE ? 'Copied!' : 'Copy'}
              </Button>
            </InstructionSection>
            <WarningNote>
              <WarningIcon>
                <AlertTriangle size={16} />
              </WarningIcon>
              <WarningText>
                MCP-only configuration provides live tracing and MCP tools access but does not include static code security scanning, correlation, or slash commands.
                For full features, use the Cursor or Claude Code integration.
              </WarningText>
            </WarningNote>
          </>
        );
    }
  };

  const renderSuccess = () => {
    if (!ideMetadata) return null;

    return (
      <SuccessContent>
        <SuccessHeader>
          <SuccessTitle>Connected to {getIDEDisplayName(ideMetadata.ide_type)}</SuccessTitle>
          <LiveBadge>
            <LiveDot />
            Live
          </LiveBadge>
        </SuccessHeader>

        <ConnectionDetails>
          <DetailItem>
            <DetailLabel><FolderOpen size={10} /> Workspace</DetailLabel>
            <DetailValue>{ideMetadata.workspace_path || 'Unknown'}</DetailValue>
          </DetailItem>
          <DetailItem>
            <DetailLabel><Clock size={10} /> Last seen</DetailLabel>
            <DetailValue>
              {connectionStatus?.last_seen ? (
                <TimeAgo timestamp={connectionStatus.last_seen} />
              ) : (
                'Unknown'
              )}
            </DetailValue>
          </DetailItem>
        </ConnectionDetails>

        <ActionButton>
          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight size={16} />}
            onClick={handleNavigate}
          >
            View Dashboard
          </Button>
        </ActionButton>
      </SuccessContent>
    );
  };

  const renderStatusBanner = () => {
    if (isLoading) {
      return (
        <StatusBanner $connected={false}>
          <StatusIconWrapper $connected={false}>
            <OrbLoader size="sm" />
          </StatusIconWrapper>
          <StatusContent>
            <StatusTitle>Checking connection...</StatusTitle>
          </StatusContent>
        </StatusBanner>
      );
    }

    // Has IDE metadata from heartbeat - show rich status
    if (hasActivity && ideMetadata) {
      return (
        <StatusBanner $connected={true}>
          <StatusIconWrapper $connected={true}>
            <Check size={24} />
          </StatusIconWrapper>
          <StatusContent>
            <StatusTitle>Connected to {getIDEDisplayName(ideMetadata.ide_type)}</StatusTitle>
            <StatusDetails>
              <StatusDetail>
                <FolderOpen size={12} />
                {ideMetadata.workspace_path || 'Unknown workspace'}
              </StatusDetail>
              <StatusDetail>
                <Clock size={12} />
                {connectionStatus?.last_seen ? (
                  <TimeAgo timestamp={connectionStatus.last_seen} />
                ) : (
                  'Unknown'
                )}
              </StatusDetail>
            </StatusDetails>
          </StatusContent>
          <LiveBadge>
            <LiveDot />
            Live
          </LiveBadge>
        </StatusBanner>
      );
    }

    // Has activity but no IDE metadata - show basic status
    if (hasActivity) {
      return (
        <StatusBanner $connected={true}>
          <StatusIconWrapper $connected={true}>
            <Check size={24} />
          </StatusIconWrapper>
          <StatusContent>
            <StatusTitle>IDE Activity Detected</StatusTitle>
            <StatusDetails>
              <StatusDetail>
                <Clock size={12} />
                Last activity{' '}
                {connectionStatus?.last_seen ? (
                  <TimeAgo timestamp={connectionStatus.last_seen} />
                ) : (
                  'unknown'
                )}
              </StatusDetail>
            </StatusDetails>
          </StatusContent>
        </StatusBanner>
      );
    }

    return (
      <StatusBanner $connected={false}>
        <StatusIconWrapper $connected={false}>
          <OrbLoader size="sm" />
        </StatusIconWrapper>
        <StatusContent>
          <StatusTitle>Waiting for connection...</StatusTitle>
          <StatusDetails>
            <StatusDetail>Follow the instructions below to connect your IDE</StatusDetail>
          </StatusDetails>
        </StatusContent>
      </StatusBanner>
    );
  };

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
      {renderStatusBanner()}

      {/* Setup Section - Collapsible when connected */}
      {hasActivity ? (
        <CollapsibleSection>
          <CollapsibleHeader onClick={() => setShowSetup(!showSetup)}>
            <CollapsibleTitle>
              <Settings size={14} />
              Setup Instructions
            </CollapsibleTitle>
            <CollapsibleIcon>
              {showSetup ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </CollapsibleIcon>
          </CollapsibleHeader>
          <CollapsibleContent $expanded={showSetup}>
            <SplitContainer>
              {/* Left Panel - Integration Cards */}
              <LeftPanel>
                <LeftPanelHeader>Choose Integration</LeftPanelHeader>
                <IntegrationCards>
                  {renderIntegrationCard('cursor', <CursorIcon size={20} />, 'Cursor', true)}
                  {renderIntegrationCard('claude-code', <ClaudeCodeIcon size={20} />, 'Claude Code', true)}
                  {renderIntegrationCard('mcp-only', <Settings size={20} />, 'MCP Only', false)}
                </IntegrationCards>
              </LeftPanel>

              {/* Right Panel - Instructions */}
              <RightPanel>
                <LeftPanelHeader>Instructions</LeftPanelHeader>
                {isSelectedTabConnected ? renderSuccess() : renderInstructions()}
              </RightPanel>
            </SplitContainer>
          </CollapsibleContent>
        </CollapsibleSection>
      ) : (
        <SplitContainer $standalone>
          {/* Left Panel - Integration Cards */}
          <LeftPanel>
            <LeftPanelHeader>Choose Integration</LeftPanelHeader>
            <IntegrationCards>
              {renderIntegrationCard('cursor', <CursorIcon size={20} />, 'Cursor', true)}
              {renderIntegrationCard('claude-code', <ClaudeCodeIcon size={20} />, 'Claude Code', true)}
              {renderIntegrationCard('mcp-only', <Settings size={20} />, 'MCP Only', false)}
            </IntegrationCards>
          </LeftPanel>

          {/* Right Panel - Instructions */}
          <RightPanel>
            <LeftPanelHeader>Instructions</LeftPanelHeader>
            {isSelectedTabConnected ? renderSuccess() : renderInstructions()}
          </RightPanel>
        </SplitContainer>
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
