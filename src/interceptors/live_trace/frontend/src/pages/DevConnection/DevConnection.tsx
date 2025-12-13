import type { FC, ReactNode } from 'react';
import { useState, useEffect, useCallback } from 'react';

import {
  Check,
  X,
  Terminal,
  Code,
  Zap,
  User,
  FolderOpen,
  Server,
  Copy,
  CheckCircle,
  Cpu,
  Clock
} from 'lucide-react';
import { useParams } from 'react-router-dom';

import { DevConnectionIcon } from '@constants/pageIcons';
import { fetchIDEConnectionStatus } from '@api/endpoints/ide';
import type { IDEConnectionStatus } from '@api/types/ide';
import { buildAgentWorkflowBreadcrumbs } from '@utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { CursorIcon, ClaudeCodeIcon } from '@ui/icons';
import { Page } from '@ui/layout/Page';
import { PageHeader } from '@ui/layout/PageHeader';
import { Section } from '@ui/layout/Section';

import { usePageMeta } from '../../context';
import {
  ConnectionStatus,
  StatusIcon,
  StatusContent,
  StatusTitle,
  StatusDescription,
  IDEList,
  IDECard,
  IDEIcon,
  IDEInfo,
  IDEName,
  IDEDescription,
  IDEStatus,
  SetupSteps,
  Step,
  StepNumber,
  StepContent,
  StepTitle,
  StepDescription,
  CodeBlock,
  LiveIndicator,
  LiveDot,
  DetailItem,
  DetailLabel,
  DetailValue,
  DevelopingBanner,
  DevelopingIcon,
  DevelopingContent,
  DevelopingTitle,
  DevelopingDescription,
  CopyButton,
  QuickSetupCard,
  QuickSetupTitle,
  QuickSetupDescription,
  QuickSetupCode,
  InlineConnectionDetails,
  StepDescriptionWithMargin,
} from './DevConnection.styles';

export interface DevConnectionProps {
  className?: string;
}

interface IDEInfoType {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
}

// Static IDE info for the list - only Cursor and Claude Code are supported
const ideInfoList: IDEInfoType[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'AI-powered code editor with MCP support',
    icon: <CursorIcon size={24} />,
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Claude coding assistant CLI',
    icon: <ClaudeCodeIcon size={24} />,
  },
];

// Get IDE display name
function getIDEDisplayName(ideType: string): string {
  const ide = ideInfoList.find(i => i.id === ideType);
  return ide?.name ?? ideType;
}

// The instructions URL that users paste into their IDE
const SETUP_INSTRUCTIONS_URL = 'https://www.cylestio.com/install';

// The message to copy to clipboard
const SETUP_MESSAGE = `Install Agent Inspector from: ${SETUP_INSTRUCTIONS_URL}`;

export const DevConnection: FC<DevConnectionProps> = ({ className }) => {
  const { agentWorkflowId } = useParams<{ agentWorkflowId: string }>();
  const [connectionStatus, setConnectionStatus] = useState<IDEConnectionStatus | null>(null);
  const [copied, setCopied] = useState(false);

  usePageMeta({
    breadcrumbs: agentWorkflowId
      ? buildAgentWorkflowBreadcrumbs(agentWorkflowId, { label: 'Dev Connection' })
      : [{ label: 'Agent Workflows', href: '/' }, { label: 'Dev Connection' }],
  });

  // Fetch connection status
  const fetchStatus = useCallback(async () => {
    try {
      const status = await fetchIDEConnectionStatus(agentWorkflowId === 'unassigned' ? undefined : agentWorkflowId);
      setConnectionStatus(status);
    } catch (err) {
      // Silently handle errors - connection status is optional
      // The user can still see the setup instructions
      console.debug('IDE connection status not available:', err);
      setConnectionStatus({
        is_connected: false,
        is_developing: false,
        has_ever_connected: false,
        connected_ide: null,
        active_connections: [],
        recent_connections: [],
        connection_count: 0,
      });
    }
  }, [agentWorkflowId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchStatus();
    // Poll every 5 seconds for connection status
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleCopyInstructions = async () => {
    try {
      await navigator.clipboard.writeText(SETUP_MESSAGE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const isConnected = connectionStatus?.is_connected ?? false;
  const isDeveloping = connectionStatus?.is_developing ?? false;
  const hasEverConnected = connectionStatus?.has_ever_connected ?? false;
  const connectedIDE = connectionStatus?.connected_ide;

  // Check which IDEs are connected
  const connectedIDETypes = new Set(
    connectionStatus?.active_connections?.map(c => c.ide_type) ?? []
  );

  // Determine the connection state for display
  // - Green with pulse: actively developing (is_connected + is_developing)
  // - Green solid: connected (is_connected)
  // - Green faded: was connected but inactive (has_ever_connected + !is_connected)
  // - Gray: never connected
  const showGreen = hasEverConnected || isConnected;
  const showPulse = isConnected && isDeveloping;

  // Get status text and description
  const getStatusText = () => {
    if (isConnected && isDeveloping) {
      return `Developing with ${connectedIDE ? getIDEDisplayName(connectedIDE.ide_type) : 'IDE'}`;
    }
    if (isConnected) {
      return `Connected to ${connectedIDE ? getIDEDisplayName(connectedIDE.ide_type) : 'IDE'}`;
    }
    if (hasEverConnected && connectedIDE) {
      return `${getIDEDisplayName(connectedIDE.ide_type)} Configured`;
    }
    return 'Not Connected';
  };

  const getStatusDescription = () => {
    if (isConnected && isDeveloping) {
      return 'Actively developing agent code. Changes are being tracked.';
    }
    if (isConnected) {
      return 'IDE connected and ready for security analysis.';
    }
    if (hasEverConnected && connectedIDE) {
      return 'IDE setup complete. Ready for security analysis when you need it.';
    }
    return 'Connect your IDE to enable AI-powered security scanning in your development workflow';
  };

  const getBadgeText = () => {
    if (isDeveloping) return 'Active';
    if (isConnected) return 'Connected';
    if (hasEverConnected) return 'Ready';
    return 'Setup';
  };

  return (
    <Page className={className} data-testid="dev-connection">
      <PageHeader
        icon={<DevConnectionIcon size={24} />}
        title="IDE Connection"
        description="Connect your development environment for AI-powered security scanning"
      />

      {/* Actively Developing Banner */}
      {isDeveloping && connectedIDE && (
        <DevelopingBanner>
          <DevelopingIcon>
            <Zap size={24} />
          </DevelopingIcon>
          <DevelopingContent>
            <DevelopingTitle>
              <LiveDot $isDeveloping />
              Actively Developing
            </DevelopingTitle>
            <DevelopingDescription>
              Code changes are being made via {getIDEDisplayName(connectedIDE.ide_type)}. 
              Security analysis will run automatically on new sessions.
            </DevelopingDescription>
          </DevelopingContent>
          <LiveIndicator $isDeveloping>
            <LiveDot $isDeveloping />
            Live
          </LiveIndicator>
        </DevelopingBanner>
      )}

      {/* Connection Status */}
      <ConnectionStatus $connected={showGreen}>
        <StatusIcon $connected={showGreen}>
          {showGreen ? <Check size={32} /> : <X size={32} />}
        </StatusIcon>
        <StatusContent>
          <StatusTitle>{getStatusText()}</StatusTitle>
          <StatusDescription>{getStatusDescription()}</StatusDescription>
          {/* Inline connection details when connected */}
          {hasEverConnected && connectedIDE && (
            <InlineConnectionDetails>
              {connectedIDE.user && (
                <DetailItem>
                  <DetailLabel><User size={10} />&nbsp;User</DetailLabel>
                  <DetailValue>{connectedIDE.user}</DetailValue>
                </DetailItem>
              )}
              {connectedIDE.host && (
                <DetailItem>
                  <DetailLabel><Server size={10} />&nbsp;Host</DetailLabel>
                  <DetailValue>{connectedIDE.host}</DetailValue>
                </DetailItem>
              )}
              <DetailItem>
                <DetailLabel><FolderOpen size={10} />&nbsp;Workspace</DetailLabel>
                <DetailValue>{connectedIDE.workspace_path || 'Unknown'}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel><Clock size={10} />&nbsp;Connected</DetailLabel>
                <DetailValue>{new Date(connectedIDE.connected_at).toLocaleString()}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel><Zap size={10} />&nbsp;Last Dev Check</DetailLabel>
                <DetailValue>{new Date(connectedIDE.last_heartbeat).toLocaleString()}</DetailValue>
              </DetailItem>
              {connectedIDE.model && (
                <DetailItem>
                  <DetailLabel><Cpu size={10} />&nbsp;Model</DetailLabel>
                  <DetailValue>{connectedIDE.model}</DetailValue>
                </DetailItem>
              )}
            </InlineConnectionDetails>
          )}
        </StatusContent>
        {showGreen ? (
          <LiveIndicator $isDeveloping={showPulse}>
            <LiveDot $isDeveloping={showPulse} />
            {getBadgeText()}
          </LiveIndicator>
        ) : (
          <Badge variant="medium">Setup Required</Badge>
        )}
      </ConnectionStatus>

      {/* IDE List */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Code size={16} />}>
            Supported IDEs
          </Section.Title>
        </Section.Header>
        <Section.Content>
          <IDEList>
            {ideInfoList.map((ide) => {
              const isIDECurrentlyConnected = connectedIDETypes.has(ide.id as 'cursor' | 'claude-code');
              const wasIDEEverConnected = connectedIDE?.ide_type === ide.id;
              const isIDEConnected = isIDECurrentlyConnected || wasIDEEverConnected;
              return (
                <IDECard key={ide.id} $connected={isIDEConnected}>
                  <IDEIcon>{ide.icon}</IDEIcon>
                  <IDEInfo>
                    <IDEName>{ide.name}</IDEName>
                    <IDEDescription>{ide.description}</IDEDescription>
                  </IDEInfo>
                  <IDEStatus $connected={isIDEConnected}>
                    {isIDECurrentlyConnected ? (
                      <>
                        <Check size={14} />
                        Connected
                      </>
                    ) : wasIDEEverConnected ? (
                      <>
                        <Check size={14} />
                        Last Used
                      </>
                    ) : (
                      <>
                        <X size={14} />
                        Not Connected
                      </>
                    )}
                  </IDEStatus>
                </IDECard>
              );
            })}
          </IDEList>
        </Section.Content>
      </Section>


      {/* Quick Setup - Primary Method */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Zap size={16} />}>
            Quick Setup (Recommended)
          </Section.Title>
        </Section.Header>
        <Section.Content>
          <QuickSetupCard>
            <QuickSetupTitle>One-Click Setup</QuickSetupTitle>
            <QuickSetupDescription>
              Copy this message and paste it into your IDE (Cursor or Claude Code). 
              The AI assistant will automatically install and configure everything.
            </QuickSetupDescription>
            <QuickSetupCode>
              {SETUP_MESSAGE}
            </QuickSetupCode>
            <CopyButton onClick={handleCopyInstructions} $copied={copied}>
              {copied ? (
                <>
                  <CheckCircle size={16} />
                  Copied! Now paste in your IDE
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy Setup Instructions
                </>
              )}
            </CopyButton>
          </QuickSetupCard>
        </Section.Content>
      </Section>

      {/* Manual Setup - Alternative */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Terminal size={16} />}>
            Manual Setup (Alternative)
          </Section.Title>
        </Section.Header>
        <Section.Content>
          <SetupSteps>
            <Step>
              <StepNumber>1</StepNumber>
              <StepContent>
                <StepTitle>Start the Agent Inspector server</StepTitle>
                <StepDescription>
                  The server should already be running if you can see this page.
                </StepDescription>
              </StepContent>
            </Step>
            <Step>
              <StepNumber>2</StepNumber>
              <StepContent>
                <StepTitle>Configure MCP in your IDE</StepTitle>
                <StepDescription>
                  <strong>For Cursor:</strong> Add to <code>.cursor/mcp.json</code>:
                </StepDescription>
                <CodeBlock>
{`{
  "mcpServers": {
    "agent-inspector": {
      "type": "streamable-http",
      "url": "http://localhost:7100/mcp"
    }
  }
}`}
                </CodeBlock>
                <StepDescriptionWithMargin>
                  <strong>For Claude Code:</strong> Add to <code>.mcp.json</code>:
                </StepDescriptionWithMargin>
                <CodeBlock>
{`{
  "mcpServers": {
    "agent-inspector": {
      "type": "http",
      "url": "http://localhost:7100/mcp"
    }
  }
}`}
                </CodeBlock>
              </StepContent>
            </Step>
            <Step>
              <StepNumber>3</StepNumber>
              <StepContent>
                <StepTitle>Reload your IDE and start scanning</StepTitle>
                <StepDescription>
                  Reload the IDE to connect to MCP, then ask:
                </StepDescription>
                <CodeBlock>
                  "Run a security scan on this agent code"
                </CodeBlock>
              </StepContent>
            </Step>
          </SetupSteps>
        </Section.Content>
      </Section>
    </Page>
  );
};
