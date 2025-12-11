import { useState, type FC } from 'react';

import { 
  Monitor, 
  Check, 
  X,
  RefreshCw,
  Terminal,
  Code
} from 'lucide-react';
import { useParams } from 'react-router-dom';

import { buildAgentBreadcrumbs } from '@utils/breadcrumbs';

import { Badge } from '@ui/core/Badge';
import { Section } from '@ui/layout/Section';

import { usePageMeta } from '../../context';
import {
  DevConnectionLayout,
  PageHeader,
  PageInfo,
  PageTitle,
  PageSubtitle,
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
  RefreshButton,
} from './DevConnection.styles';

export interface DevConnectionProps {
  className?: string;
}

interface IDEConnection {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  lastSeen?: string;
}

// Mock IDE connections - would come from actual MCP connection status
const mockIDEs: IDEConnection[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'AI-powered code editor with MCP support',
    icon: '🖥️',
    connected: false,
  },
  {
    id: 'vscode',
    name: 'VS Code',
    description: 'Visual Studio Code with Claude extension',
    icon: '💻',
    connected: false,
  },
  {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    description: 'Claude desktop application',
    icon: '🤖',
    connected: false,
  },
];

export const DevConnection: FC<DevConnectionProps> = ({ className }) => {
  const { agentId } = useParams<{ agentId: string }>();
  const [ides] = useState<IDEConnection[]>(mockIDEs);
  const [isChecking, setIsChecking] = useState(false);

  const isConnected = ides.some(ide => ide.connected);

  usePageMeta({
    breadcrumbs: agentId
      ? buildAgentBreadcrumbs(agentId, { label: 'Dev Connection' })
      : [{ label: 'Agents', href: '/' }, { label: 'Dev Connection' }],
  });

  const handleRefresh = () => {
    setIsChecking(true);
    // Simulate connection check
    setTimeout(() => {
      setIsChecking(false);
      // In real implementation, this would check MCP connection status
    }, 2000);
  };

  return (
    <DevConnectionLayout className={className} data-testid="dev-connection">
      <PageHeader>
        <PageInfo>
          <PageTitle>
            <Monitor size={24} style={{ marginRight: '8px' }} />
            IDE Connection
          </PageTitle>
          <PageSubtitle>Connect your development environment for AI-powered security scanning</PageSubtitle>
        </PageInfo>
        <RefreshButton onClick={handleRefresh} disabled={isChecking}>
          <RefreshCw size={14} className={isChecking ? 'spinning' : ''} />
          {isChecking ? 'Checking...' : 'Check Connection'}
        </RefreshButton>
      </PageHeader>

      {/* Connection Status */}
      <ConnectionStatus $connected={isConnected}>
        <StatusIcon $connected={isConnected}>
          {isConnected ? <Check size={32} /> : <X size={32} />}
        </StatusIcon>
        <StatusContent>
          <StatusTitle>
            {isConnected ? 'Connected' : 'Not Connected'}
          </StatusTitle>
          <StatusDescription>
            {isConnected 
              ? 'Your IDE is connected and ready for security analysis'
              : 'Connect your IDE to enable AI-powered security scanning in your development workflow'}
          </StatusDescription>
        </StatusContent>
        <Badge variant={isConnected ? 'success' : 'medium'}>
          {isConnected ? 'Active' : 'Inactive'}
        </Badge>
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
            {ides.map((ide) => (
              <IDECard key={ide.id} $connected={ide.connected}>
                <IDEIcon>{ide.icon}</IDEIcon>
                <IDEInfo>
                  <IDEName>{ide.name}</IDEName>
                  <IDEDescription>{ide.description}</IDEDescription>
                </IDEInfo>
                <IDEStatus $connected={ide.connected}>
                  {ide.connected ? (
                    <>
                      <Check size={14} />
                      Connected
                    </>
                  ) : (
                    <>
                      <X size={14} />
                      Not Connected
                    </>
                  )}
                </IDEStatus>
              </IDECard>
            ))}
          </IDEList>
        </Section.Content>
      </Section>

      {/* Setup Instructions */}
      <Section>
        <Section.Header>
          <Section.Title icon={<Terminal size={16} />}>
            Setup Instructions
          </Section.Title>
        </Section.Header>
        <Section.Content>
          <SetupSteps>
            <Step>
              <StepNumber>1</StepNumber>
              <StepContent>
                <StepTitle>Start the Agent Inspector server</StepTitle>
                <StepDescription>
                  The Agent Inspector server should already be running if you can see this page.
                  Verify the MCP endpoint is accessible:
                </StepDescription>
                <CodeBlock>
                  curl http://localhost:7100/mcp
                </CodeBlock>
              </StepContent>
            </Step>
            <Step>
              <StepNumber>2</StepNumber>
              <StepContent>
                <StepTitle>Configure your IDE</StepTitle>
                <StepDescription>
                  Add the Agent Inspector MCP server to your IDE configuration.
                  For Cursor, add to your MCP settings:
                </StepDescription>
                <CodeBlock>
{`{
  "mcpServers": {
    "agent-inspector": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-proxy", "http://localhost:7100/mcp"]
    }
  }
}`}
                </CodeBlock>
              </StepContent>
            </Step>
            <Step>
              <StepNumber>3</StepNumber>
              <StepContent>
                <StepTitle>Start analyzing</StepTitle>
                <StepDescription>
                  Ask Claude in your IDE to run a security scan. For example:
                </StepDescription>
                <CodeBlock>
                  "Run a security scan on this agent code"
                </CodeBlock>
              </StepContent>
            </Step>
          </SetupSteps>
        </Section.Content>
      </Section>
    </DevConnectionLayout>
  );
};
