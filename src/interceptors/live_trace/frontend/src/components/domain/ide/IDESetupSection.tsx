import { useState, type FC } from 'react';

import {
  Check,
  Copy,
  AlertTriangle,
  Settings,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import type { IDEConnectionStatus } from '@api/types/ide';
import type { ConfigResponse } from '@api/types/config';

import { Button } from '@ui/core/Button';
import { CursorIcon, ClaudeCodeIcon } from '@ui/icons';

import {
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
  CollapsibleSection,
  CollapsibleHeader,
  CollapsibleTitle,
  CollapsibleIcon,
  CollapsibleContent,
} from './IDESetupSection.styles';

export interface IDESetupSectionProps {
  connectionStatus: IDEConnectionStatus | null;
  serverConfig: ConfigResponse | null;
  collapsible?: boolean;
  defaultExpanded?: boolean;
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

// Feature definitions
const FEATURE_DETAILS = {
  staticAnalysis: {
    shortName: 'Static Analysis',
    isSkill: true,
  },
  correlation: {
    shortName: 'Correlation',
    isSkill: true,
  },
  debugTrace: {
    shortName: 'Debug & Trace',
    isSkill: false,
  },
};

// Feature availability per integration type
const INTEGRATION_FEATURES = {
  cursor: {
    staticAnalysis: true,
    correlation: true,
    debugTrace: true,
  },
  'claude-code': {
    staticAnalysis: true,
    correlation: true,
    debugTrace: true,
  },
  'mcp-only': {
    staticAnalysis: false,
    correlation: false,
    debugTrace: true,
  },
};

function getMcpServerUrl(config: ConfigResponse | null): string {
  if (!config) return 'http://localhost:7100/mcp';
  const host = config.proxy_host === '0.0.0.0' ? 'localhost' : config.proxy_host;
  return `http://${host}:${config.proxy_port}/mcp`;
}

export const IDESetupSection: FC<IDESetupSectionProps> = ({
  connectionStatus,
  serverConfig,
  collapsible = false,
  defaultExpanded = true,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<ConnectionTab>(() => {
    // Auto-select the IDE's tab if we have IDE metadata
    if (connectionStatus?.has_activity && connectionStatus?.ide) {
      return connectionStatus.ide.ide_type as ConnectionTab;
    }
    return 'cursor';
  });
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasActivity = connectionStatus?.has_activity ?? false;
  const ideMetadata = connectionStatus?.ide;

  const handleCopy = async (command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

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

  const content = (
    <SplitContainer $standalone={!collapsible}>
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
        {renderInstructions()}
      </RightPanel>
    </SplitContainer>
  );

  if (collapsible) {
    return (
      <CollapsibleSection className={className}>
        <CollapsibleHeader onClick={() => setIsExpanded(!isExpanded)}>
          <CollapsibleTitle>
            <Settings size={14} />
            Setup Instructions
          </CollapsibleTitle>
          <CollapsibleIcon>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </CollapsibleIcon>
        </CollapsibleHeader>
        <CollapsibleContent $expanded={isExpanded}>
          {content}
        </CollapsibleContent>
      </CollapsibleSection>
    );
  }

  return content;
};
