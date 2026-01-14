import { useState, type FC } from 'react';

import { Check, Copy, ChevronDown, ChevronUp, Settings } from 'lucide-react';

import type { ConfigResponse } from '@api/types/config';

import { Button } from '@ui/core/Button';
import { Code } from '@ui/core/Code';
import { OrbLoader } from '@ui/feedback/OrbLoader';

import {
  Container,
  Header,
  HeaderLeft,
  HeaderTitle,
  StatusIndicator,
  StatusDot,
  Body,
  Description,
  ModeSection,
  ModeLabel,
  ModeOptions,
  ModeCard,
  ModeRadio,
  ModeContent,
  ModeTitle,
  ModeDesc,
  UrlSection,
  UrlLabel,
  UrlBox,
  UrlText,
  WorkflowInput,
  ExampleSection,
  ExampleBox,
  ConfigSection,
  ConfigItem,
  ConfigLabel,
  ConfigValue,
  CollapsibleSection,
  CollapsibleHeader,
  CollapsibleTitle,
  CollapsibleIcon,
  CollapsibleContent,
  WaitingSection,
  WaitingText,
} from './AgentSetupSection.styles';

export interface AgentSetupSectionProps {
  /** Server configuration for proxy URL */
  serverConfig: ConfigResponse | null;
  /** Whether agent activity has been detected */
  hasActivity: boolean;
  /** Whether we're still loading initial data */
  isLoading?: boolean;
  /** Agent workflow ID for the URL */
  agentWorkflowId?: string;
  /** Whether to render in collapsible mode */
  collapsible?: boolean;
  /** Default expanded state for collapsible mode */
  defaultExpanded?: boolean;
  className?: string;
}

type UrlMode = 'multi-conversation' | 'single-conversation';

export const AgentSetupSection: FC<AgentSetupSectionProps> = ({
  serverConfig,
  hasActivity,
  isLoading: _isLoading = false,
  agentWorkflowId = '',
  collapsible = false,
  defaultExpanded = true,
  className,
}) => {
  const [urlMode, setUrlMode] = useState<UrlMode>('multi-conversation');
  const [customWorkflowId, setCustomWorkflowId] = useState(agentWorkflowId);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Build the proxy URL
  const baseUrl = serverConfig
    ? `http://localhost:${serverConfig.proxy_port}`
    : 'http://localhost:4000';

  const workflowIdToUse = customWorkflowId || agentWorkflowId || 'my-project';
  const proxyUrl = urlMode === 'multi-conversation'
    ? `${baseUrl}/agent-workflow/${workflowIdToUse}`
    : baseUrl;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(proxyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderBodyContent = () => (
    <>
      {!hasActivity && (
        <WaitingSection>
          <OrbLoader size="sm" />
          <WaitingText>Waiting for agent activity...</WaitingText>
        </WaitingSection>
      )}

      <Description>
        Point your LLM client to the proxy URL below. The proxy will capture all
        requests and responses for runtime security analysis.
      </Description>

      <ModeSection>
        <ModeLabel>Select connection mode:</ModeLabel>
        <ModeOptions>
          <ModeCard
            $active={urlMode === 'multi-conversation'}
            onClick={() => setUrlMode('multi-conversation')}
          >
            <ModeRadio $active={urlMode === 'multi-conversation'} />
            <ModeContent>
              <ModeTitle $active={urlMode === 'multi-conversation'}>
                Multi-Conversation
              </ModeTitle>
              <ModeDesc>
                Best for agents with multiple prompts in the same session
              </ModeDesc>
            </ModeContent>
          </ModeCard>

          <ModeCard
            $active={urlMode === 'single-conversation'}
            onClick={() => setUrlMode('single-conversation')}
          >
            <ModeRadio $active={urlMode === 'single-conversation'} />
            <ModeContent>
              <ModeTitle $active={urlMode === 'single-conversation'}>
                Single Conversation
              </ModeTitle>
              <ModeDesc>
                Best for debugging individual LLM sessions
              </ModeDesc>
            </ModeContent>
          </ModeCard>
        </ModeOptions>
      </ModeSection>

      <UrlSection>
        <UrlLabel>
          Set your <Code>base_url</Code> to:
        </UrlLabel>
        <UrlBox>
          <UrlText>
            {urlMode === 'multi-conversation' ? (
              <>
                {baseUrl}/agent-workflow/
                <WorkflowInput
                  type="text"
                  value={customWorkflowId}
                  onChange={(e) => setCustomWorkflowId(e.target.value)}
                  placeholder={agentWorkflowId || 'my-project'}
                />
              </>
            ) : (
              baseUrl
            )}
          </UrlText>
          <Button
            variant={copied ? 'success' : 'primary'}
            size="sm"
            icon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </UrlBox>
      </UrlSection>

      <ExampleSection>
        <UrlLabel>Example with OpenAI Python SDK:</UrlLabel>
        <ExampleBox>
          client = OpenAI(base_url="{proxyUrl}")
        </ExampleBox>
      </ExampleSection>

      <ConfigSection>
        <ConfigItem>
          <ConfigLabel>Provider:</ConfigLabel>
          <ConfigValue>{serverConfig?.provider_type || 'openai'}</ConfigValue>
        </ConfigItem>
        <ConfigItem>
          <ConfigLabel>Target:</ConfigLabel>
          <ConfigValue>{serverConfig?.provider_base_url || 'api.openai.com'}</ConfigValue>
        </ConfigItem>
      </ConfigSection>
    </>
  );

  if (collapsible) {
    return (
      <CollapsibleSection className={className}>
        <CollapsibleHeader onClick={() => setIsExpanded(!isExpanded)}>
          <CollapsibleTitle>
            <Settings size={14} />
            Agent Connection Setup
            <StatusIndicator $connected={hasActivity}>
              <StatusDot $connected={hasActivity} />
              {hasActivity ? 'Connected' : 'Waiting...'}
            </StatusIndicator>
          </CollapsibleTitle>
          <CollapsibleIcon>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </CollapsibleIcon>
        </CollapsibleHeader>
        <CollapsibleContent $expanded={isExpanded}>
          <Body>
            {renderBodyContent()}
          </Body>
        </CollapsibleContent>
      </CollapsibleSection>
    );
  }

  return (
    <Container className={className}>
      <Header>
        <HeaderLeft>
          <Settings size={18} />
          <HeaderTitle>Connect Your Agent</HeaderTitle>
        </HeaderLeft>
        <StatusIndicator $connected={hasActivity}>
          <StatusDot $connected={hasActivity} />
          {hasActivity ? 'Connected' : 'Waiting...'}
        </StatusIndicator>
      </Header>

      <Body>
        {renderBodyContent()}
      </Body>
    </Container>
  );
};
