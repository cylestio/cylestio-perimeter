import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

import { Card } from '@ui/core/Card';
import { Text } from '@ui/core/Text';
import { Code } from '@ui/core/Code';
import { Button } from '@ui/core/Button';
import { Label } from '@ui/core/Label';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Skeleton } from '@ui/feedback/Skeleton';

import { usePageMeta } from '../../context';
import { fetchConfig } from '@api/endpoints/config';
import { fetchDashboard } from '@api/endpoints/dashboard';
import type { ConfigResponse } from '@api/types/config';

import {
  ConnectContainer,
  UrlSection,
  UrlBox,
  ConfigDetails,
  ConfigItem,
  StatusBanner,
  StatusDot,
  StatusSpinner,
  StyledCard,
  FooterButton,
} from './Connect.styles';

type ConnectionStatus = 'loading' | 'waiting' | 'connected';

export const Connect: FC = () => {
  usePageMeta({
    breadcrumbs: [{ label: 'How to Connect' }],
  });

  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [agentCount, setAgentCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const checkAgentStatus = useCallback(async () => {
    try {
      const dashboard = await fetchDashboard();
      const hasAgents = dashboard.agents.length > 0;
      setAgentCount(dashboard.agents.length);
      setStatus(hasAgents ? 'connected' : 'waiting');
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

  const proxyUrl = config
    ? `http://localhost:${config.proxy_port}`
    : 'http://localhost:3000';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(proxyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = status === 'loading';
  const isConnected = status === 'connected';
  const displayStatus = isConnected ? 'connected' : 'waiting';

  return (
    <ConnectContainer>
      {/* Main Action Card */}
      <StyledCard>
        <Card.Header
          title="Connect Your Agent"
          subtitle="Point your client to this proxy URL to start capturing requests"
          centered
        />
        <Card.Content>
          {isLoading ? (
            <Skeleton variant="rect" height={56} />
          ) : (
            <>
              <UrlSection>
                <Text size="sm" color="muted">
                  Set your <Code>base_url</Code> to:
                </Text>
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
                    {config?.proxy_port || 3000}
                  </Text>
                </ConfigItem>
              </ConfigDetails>
            </>
          )}
        </Card.Content>
      </StyledCard>

      {/* Status Banner */}
      {!isLoading && (
        <StatusBanner $status={displayStatus}>
          {isConnected ? (
            <StatusDot $status={displayStatus} />
          ) : (
            <StatusSpinner>
              <OrbLoader size="sm" />
            </StatusSpinner>
          )}
          <Text size="sm" weight="medium" color={isConnected ? 'green' : 'muted'}>
            {isConnected
              ? `Connected — ${agentCount} agent${agentCount !== 1 ? 's' : ''} detected`
              : 'Listening for agent activity'}
          </Text>
        </StatusBanner>
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
  );
};
