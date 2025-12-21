import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import { Copy, Check, ExternalLink, Info } from 'lucide-react';

import { fetchConfig } from '@api/endpoints/config';
import { fetchAgentWorkflows } from '@api/endpoints/dashboard';
import type { ConfigResponse } from '@api/types/config';

import { Card } from '@ui/core/Card';
import { Text } from '@ui/core/Text';
import { Code } from '@ui/core/Code';
import { Button } from '@ui/core/Button';
import { Label } from '@ui/core/Label';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Skeleton } from '@ui/feedback/Skeleton';
import { Page } from '@ui/layout/Page';

import { ConnectionSuccess } from '@features/index';

import { usePageMeta } from '../../context';
import {
  ConnectContainer,
  HeroSection,
  LogoOrb,
  HeroTitle,
  HeroHighlight,
  HeroSubtitle,
  UrlSection,
  UrlBox,
  ConfigDetails,
  ConfigItem,
  StatusBanner,
  StatusSpinner,
  StyledCard,
  FooterButton,
  WorkflowToggle,
  ToggleOption,
  WorkflowNote,
  WorkflowInputGroup,
  WorkflowInput,
} from './Connect.styles';

type ConnectionStatus = 'loading' | 'waiting' | 'connected';
type UrlMode = 'standard' | 'agent-workflow';

export const Connect: FC = () => {
  const navigate = useNavigate();

  usePageMeta({
    hide: true,
  });

  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [workflowCount, setWorkflowCount] = useState(0);
  const [agentCount, setAgentCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [urlMode, setUrlMode] = useState<UrlMode>('standard');
  const [agentWorkflowId, setAgentWorkflowId] = useState('my-project');

  const checkAgentStatus = useCallback(async () => {
    try {
      const data = await fetchAgentWorkflows();
      const workflows = data.agent_workflows;
      const totalAgents = workflows.reduce((sum, w) => sum + w.agent_count, 0);
      setWorkflowCount(workflows.length);
      setAgentCount(totalAgents);
      setStatus(workflows.length > 0 ? 'connected' : 'waiting');
    } catch {
      setStatus('waiting');
    }
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await fetchConfig();
        setConfig(data);
      } catch (err) {
        console.error('Failed to load config:', err);
      }
    };
    loadConfig();
    checkAgentStatus();
  }, [checkAgentStatus]);

  useEffect(() => {
    if (status !== 'waiting') return;
    const interval = setInterval(checkAgentStatus, 5000);
    return () => clearInterval(interval);
  }, [status, checkAgentStatus]);

  const baseUrl = config
    ? `http://localhost:${config.proxy_port}`
    : 'http://localhost:4000';

  const proxyUrl = urlMode === 'agent-workflow'
    ? `${baseUrl}/agent-workflow/${agentWorkflowId}`
    : baseUrl;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(proxyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = status === 'loading';
  const isConnected = status === 'connected';

  return (
    <Page>
      <ConnectContainer>
        {/* Hero Section */}
        <HeroSection>
        <LogoOrb />
        <HeroTitle>
          Connect Your <HeroHighlight>Agent Workflow</HeroHighlight>
        </HeroTitle>
        <HeroSubtitle>
          Point your client to this proxy URL to start capturing requests
        </HeroSubtitle>
      </HeroSection>

      {/* Main Action Card */}
      <StyledCard>
        <Card.Content>
          {isLoading ? (
            <Skeleton variant="rect" height={56} />
          ) : (
            <>
              {/* URL Mode Toggle */}
              <WorkflowToggle>
                <ToggleOption
                  $active={urlMode === 'standard'}
                  onClick={() => setUrlMode('standard')}
                >
                  Standard
                </ToggleOption>
                <ToggleOption
                  $active={urlMode === 'agent-workflow'}
                  onClick={() => setUrlMode('agent-workflow')}
                >
                  With Agent Workflow
                </ToggleOption>
              </WorkflowToggle>

              <UrlSection>
                <Text size="sm" color="muted">
                  Set your <Code>base_url</Code> to:
                </Text>

                {urlMode === 'agent-workflow' && (
                  <WorkflowInputGroup>
                    <WorkflowInput
                      type="text"
                      value={agentWorkflowId}
                      onChange={(e) => setAgentWorkflowId(e.target.value)}
                      placeholder="my-project"
                    />
                  </WorkflowInputGroup>
                )}

                <UrlBox>
                  <Text size="md" mono color="cyan">
                    {proxyUrl}
                  </Text>
                  <Button
                    variant={copied ? 'success' : 'primary'}
                    size="sm"
                    icon={copied ? <Check size={16} /> : <Copy size={16} />}
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </UrlBox>

                {urlMode === 'agent-workflow' && (
                  <WorkflowNote>
                    <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>
                      Use an agent workflow ID to group agents and link static analysis findings to your project.
                      The same agent_workflow_id should be used in MCP tools when running security scans.
                    </span>
                  </WorkflowNote>
                )}
              </UrlSection>

              <ConfigDetails>
                <ConfigItem>
                  <Label size="xs" uppercase color="muted">
                    Provider
                  </Label>
                  <Text size="sm" mono color="secondary">
                    {config?.provider_type || 'openai'}
                  </Text>
                </ConfigItem>
                <ConfigItem>
                  <Label size="xs" uppercase color="muted">
                    Target
                  </Label>
                  <Text size="sm" mono color="secondary">
                    {config?.provider_base_url || 'api.openai.com'}
                  </Text>
                </ConfigItem>
                <ConfigItem>
                  <Label size="xs" uppercase color="muted">
                    Port
                  </Label>
                  <Text size="sm" mono color="secondary">
                    {config?.proxy_port || 4000}
                  </Text>
                </ConfigItem>
              </ConfigDetails>
            </>
          )}
        </Card.Content>
      </StyledCard>

      {/* Status Banner - waiting state */}
      {!isLoading && !isConnected && (
        <StatusBanner $status="waiting">
          <StatusSpinner>
            <OrbLoader size="sm" />
          </StatusSpinner>
          <Text size="sm" weight="medium" color="muted">
            Listening for agent activity
          </Text>
        </StatusBanner>
      )}

      {/* Success Section - connected state */}
      {isConnected && (
        <ConnectionSuccess
          workflowCount={workflowCount}
          agentCount={agentCount}
          onViewAgentWorkflows={() => navigate('/')}
        />
      )}

        <FooterButton
          as="a"
          variant="ghost"
          href="https://github.com/cylestio/agent-inspector/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
          icon={<ExternalLink size={14} />}
        >
          Documentation
        </FooterButton>
      </ConnectContainer>
    </Page>
  );
};
