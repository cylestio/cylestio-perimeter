import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import { Copy, Check, ExternalLink, ArrowRight } from 'lucide-react';

import { fetchConfig } from '@api/endpoints/config';
import { fetchAgentWorkflows } from '@api/endpoints/dashboard';
import type { ConfigResponse } from '@api/types/config';
import type { APIAgentWorkflow } from '@api/types/agentWorkflows';

import { Text } from '@ui/core/Text';
import { Code } from '@ui/core/Code';
import { Button } from '@ui/core/Button';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Skeleton } from '@ui/feedback/Skeleton';

import { ConnectIDETab } from '@features/connect/ConnectIDETab';

import { usePageMeta } from '../../context';
import {
  ConnectPage,
  SplitContainer,
  LeftPanel,
  RightPanel,
  RightPanelHeader,
  StatusSection,
  StatusText,
  StatusOrb,
  StatusOrbInner,
  StatusLink,
  SuccessContent,
  SuccessTitle,
  SuccessSubtitle,
  SuccessStats,
  SuccessStat,
  SuccessStatValue,
  SuccessStatLabel,
  MenuSection,
  MenuItem,
  MenuItemTitle,
  MenuItemDesc,
  UrlSection,
  UrlBox,
  UrlText,
  ConfigSection,
  ConfigItem,
  ConfigLabel,
  ConfigValue,
  WorkflowModeSection,
  WorkflowModeHeader,
  WorkflowModeOptions,
  WorkflowModeCard,
  WorkflowModeRadio,
  WorkflowModeContent,
  WorkflowModeTitle,
  WorkflowModeDesc,
  WorkflowInput,
  DocsLink,
} from './Connect.styles';

type ConnectionStatus = 'loading' | 'waiting' | 'connected';
type UrlMode = 'standard' | 'agent-workflow';
type InstructionTab = 'success' | 'agent' | 'ide';

export const Connect: FC = () => {
  const navigate = useNavigate();

  usePageMeta({
    hide: true,
  });

  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [workflows, setWorkflows] = useState<APIAgentWorkflow[]>([]);
  const [workflowCount, setWorkflowCount] = useState(0);
  const [agentCount, setAgentCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [urlMode, setUrlMode] = useState<UrlMode>('agent-workflow');
  const [agentWorkflowId, setAgentWorkflowId] = useState('');
  const [activeTab, setActiveTab] = useState<InstructionTab>('agent');

  const checkAgentStatus = useCallback(async () => {
    try {
      const data = await fetchAgentWorkflows();
      const workflowsList = data.agent_workflows;
      setWorkflows(workflowsList);
      const totalAgents = workflowsList.reduce((sum, w) => sum + w.agent_count, 0);
      setWorkflowCount(workflowsList.length);
      setAgentCount(totalAgents);
      setStatus(workflowsList.length > 0 ? 'connected' : 'waiting');
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

  // Switch to success tab when connected
  useEffect(() => {
    if (status === 'connected') {
      setActiveTab('success');
    }
  }, [status]);

  const baseUrl = config
    ? `http://localhost:${config.proxy_port}`
    : 'http://localhost:4000';

  const workflowDisplay = agentWorkflowId || '<project-name>';
  const proxyUrl = urlMode === 'agent-workflow'
    ? `${baseUrl}/agent-workflow/${workflowDisplay}`
    : baseUrl;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(proxyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigate = () => {
    const assignedWorkflows = workflows.filter(w => w.id !== null);

    if (assignedWorkflows.length === 1) {
      navigate(`/agent-workflow/${assignedWorkflows[0].id}`);
    } else {
      navigate('/');
    }
  };

  const isLoading = status === 'loading';
  const isConnected = status === 'connected';
  const isWaiting = status === 'waiting';

  return (
    <ConnectPage>
      <SplitContainer>
        {/* Left Panel - Status & Menu */}
        <LeftPanel>
          <StatusSection>
            {isLoading && <Skeleton variant="rect" width={64} height={64} />}

            {isWaiting && (
              <>
                <OrbLoader size="lg" />
                <StatusText>Waiting for agent activity...</StatusText>
              </>
            )}

            {isConnected && (
              <>
                <StatusOrb>
                  <StatusOrbInner />
                </StatusOrb>
                <StatusLink
                  $active={activeTab === 'success'}
                  onClick={() => setActiveTab('success')}
                >
                  You are all set!
                </StatusLink>
              </>
            )}
          </StatusSection>

          <MenuSection>
            <MenuItem
              $active={activeTab === 'agent'}
              onClick={() => setActiveTab('agent')}
            >
              <MenuItemTitle $active={activeTab === 'agent'}>
                Connect Agent
              </MenuItemTitle>
              <MenuItemDesc>
                Trace agent behavior and dynamically scan for security issues
              </MenuItemDesc>
            </MenuItem>

            <MenuItem
              $active={activeTab === 'ide'}
              onClick={() => setActiveTab('ide')}
            >
              <MenuItemTitle $active={activeTab === 'ide'}>
                Connect IDE
              </MenuItemTitle>
              <MenuItemDesc>
                Enable live tracing for your IDE and statically scan code for security issues
              </MenuItemDesc>
            </MenuItem>
          </MenuSection>
        </LeftPanel>

        {/* Right Panel - Instructions or Success */}
        <RightPanel>
          {activeTab === 'success' ? (
            <SuccessContent>
              <SuccessTitle>You're all set!</SuccessTitle>
              <SuccessSubtitle>
                Your agent is connected and sending data to Agent Inspector
              </SuccessSubtitle>
              <SuccessStats>
                <SuccessStat>
                  <SuccessStatValue>{workflowCount}</SuccessStatValue>
                  <SuccessStatLabel>
                    Workflow{workflowCount !== 1 ? 's' : ''}
                  </SuccessStatLabel>
                </SuccessStat>
                <SuccessStat>
                  <SuccessStatValue>{agentCount}</SuccessStatValue>
                  <SuccessStatLabel>
                    Agent{agentCount !== 1 ? 's' : ''}
                  </SuccessStatLabel>
                </SuccessStat>
              </SuccessStats>
              <Button
                variant="primary"
                size="md"
                icon={<ArrowRight size={16} />}
                onClick={handleNavigate}
              >
                View Dashboard
              </Button>
            </SuccessContent>
          ) : activeTab === 'agent' ? (
            <>
              <RightPanelHeader>Connect Agent</RightPanelHeader>

              <WorkflowModeSection>
                <WorkflowModeHeader>Select the mode that fits your use case</WorkflowModeHeader>
                <WorkflowModeOptions>
                  <WorkflowModeCard
                    $active={urlMode === 'agent-workflow'}
                    onClick={() => setUrlMode('agent-workflow')}
                  >
                    <WorkflowModeRadio $active={urlMode === 'agent-workflow'} />
                    <WorkflowModeContent>
                      <WorkflowModeTitle $active={urlMode === 'agent-workflow'}>
                        Multi-Conversation (Recommended)
                      </WorkflowModeTitle>
                      <WorkflowModeDesc>
                        Best for agents with multiple prompts used in the same session
                      </WorkflowModeDesc>
                    </WorkflowModeContent>
                  </WorkflowModeCard>

                  <WorkflowModeCard
                    $active={urlMode === 'standard'}
                    onClick={() => setUrlMode('standard')}
                  >
                    <WorkflowModeRadio $active={urlMode === 'standard'} />
                    <WorkflowModeContent>
                      <WorkflowModeTitle $active={urlMode === 'standard'}>
                        Single Conversation
                      </WorkflowModeTitle>
                      <WorkflowModeDesc>
                        Best for debugging individual LLM sessions without project grouping
                      </WorkflowModeDesc>
                    </WorkflowModeContent>
                  </WorkflowModeCard>
                </WorkflowModeOptions>
              </WorkflowModeSection>

              <UrlSection>
                <Text size="sm" color="muted">
                  Set your <Code>base_url</Code> to:
                </Text>

                <UrlBox>
                  <UrlText>
                    {urlMode === 'agent-workflow' ? (
                      <>
                        {baseUrl}/agent-workflow/
                        <WorkflowInput
                          type="text"
                          value={agentWorkflowId}
                          onChange={(e) => setAgentWorkflowId(e.target.value)}
                          placeholder="<project-name>"
                        />
                      </>
                    ) : (
                      proxyUrl
                    )}
                  </UrlText>
                  <Button
                    variant={copied ? 'success' : 'primary'}
                    size="sm"
                    icon={copied ? <Check size={16} /> : <Copy size={16} />}
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </UrlBox>
              </UrlSection>

              <ConfigSection>
                <ConfigItem>
                  <ConfigLabel>Provider:</ConfigLabel>
                  <ConfigValue>{config?.provider_type || 'openai'}</ConfigValue>
                </ConfigItem>
                <ConfigItem>
                  <ConfigLabel>Target:</ConfigLabel>
                  <ConfigValue>{config?.provider_base_url || 'api.openai.com'}</ConfigValue>
                </ConfigItem>
              </ConfigSection>
            </>
          ) : (
            <>
              <RightPanelHeader>Connect IDE</RightPanelHeader>
              <ConnectIDETab />
            </>
          )}
        </RightPanel>
      </SplitContainer>

      <DocsLink
        href="https://github.com/cylestio/agent-inspector/blob/main/README.md"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink size={14} />
        For more settings, see documentation
      </DocsLink>
    </ConnectPage>
  );
};
