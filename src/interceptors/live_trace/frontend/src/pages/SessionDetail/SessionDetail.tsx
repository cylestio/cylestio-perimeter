import { useState, useCallback, useEffect, useMemo, type FC } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileJson, MessageSquare } from 'lucide-react';

import { fetchSession } from '@api/endpoints/session';
import { fetchModels } from '@api/endpoints/replay';
import type { SessionResponse, TimelineEvent } from '@api/types/session';
import type { ModelsResponse, ModelInfo } from '@api/types/replay';
import { usePolling } from '@hooks/usePolling';
import { buildAgentWorkflowBreadcrumbs, agentWorkflowLink } from '../../utils/breadcrumbs';

import { Button } from '@ui/core';
import { Timeline } from '@ui/data-display/Timeline';
import { EmptyState } from '@ui/feedback/EmptyState';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { Page } from '@ui/layout/Page';
import { Section } from '@ui/layout/Section';
import { Dropdown } from '@ui/overlays';
import { parseConversation, downloadJSON } from '@utils/export';

import { usePageMeta } from '../../context';
import { ReplayPanel } from './ReplayPanel';
import { SessionSidebarInfo } from './SessionSidebarInfo';
import {
  SessionLayout,
  SessionMain,
  TimelineContent,
  EmptyTimeline,
} from './SessionDetail.styles';

/**
 * Find model pricing from models response.
 * Uses fuzzy matching for model name variants.
 */
function findModelPricing(
  modelsData: ModelsResponse | null,
  modelName: string | null | undefined
): ModelInfo | undefined {
  if (!modelsData || !modelName) return undefined;

  const modelLower = modelName.toLowerCase();
  const allModels = [
    ...modelsData.models.openai,
    ...modelsData.models.anthropic,
  ];

  // Direct match by id
  const directMatch = allModels.find(m => m.id.toLowerCase() === modelLower);
  if (directMatch) return directMatch;

  // Fuzzy match - find a model whose id is contained in the name or vice versa
  return allModels.find(
    m => modelLower.includes(m.id.toLowerCase()) || m.id.toLowerCase().includes(modelLower)
  );
}

export const SessionDetail: FC = () => {
  const { sessionId, agentWorkflowId } = useParams<{ sessionId: string; agentWorkflowId: string }>();
  const [replayEventId, setReplayEventId] = useState<string | null>(null);
  const [modelsData, setModelsData] = useState<ModelsResponse | null>(null);

  // Fetch models pricing on mount
  useEffect(() => {
    fetchModels().then(setModelsData);
  }, []);

  // Fetch session data with polling
  const fetchFn = useCallback(() => {
    if (!sessionId) return Promise.reject(new Error('No session ID'));
    return fetchSession(sessionId);
  }, [sessionId]);

  const { data, error, loading } = usePolling<SessionResponse>(fetchFn, {
    interval: 2000,
    enabled: !!sessionId,
  });

  // Find pricing for current model
  const modelPricing = useMemo(
    () => findModelPricing(modelsData, data?.session.model),
    [modelsData, data?.session.model]
  );

  // Set breadcrumbs with agent workflow context
  usePageMeta({
    breadcrumbs: buildAgentWorkflowBreadcrumbs(
      agentWorkflowId,
      ...(data?.session.agent_id
        ? [{ label: `Agent ${data.session.agent_id.substring(0, 12)}...`, href: agentWorkflowLink(agentWorkflowId, `/agent/${data.session.agent_id}`) }]
        : []),
      { label: 'Session' },
      { label: sessionId?.substring(0, 12) + '...' || '' }
    ),
  });

  const handleReplay = (eventId: string) => {
    setReplayEventId(eventId);
  };

  const handleCloseReplay = () => {
    setReplayEventId(null);
  };

  const handleExportRawEvents = () => {
    if (!data) return;
    downloadJSON(data.timeline, `session-${sessionId}-events.json`);
  };

  const handleExportConversation = () => {
    if (!data) return;
    const conversation = parseConversation(data.timeline);
    downloadJSON(conversation, `session-${sessionId}-conversation.json`);
  };

  const exportItems = [
    {
      id: 'raw-events',
      label: 'Export Raw Events',
      icon: <FileJson size={14} />,
      onClick: handleExportRawEvents,
    },
    {
      id: 'conversation',
      label: 'Export Conversation',
      icon: <MessageSquare size={14} />,
      onClick: handleExportConversation,
    },
  ];

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <OrbLoader size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Failed to load session"
        description={error || 'Session not found'}
      />
    );
  }

  const session = data.session;
  const timeline = data.timeline || [];

  return (
    <>
      <Page fullWidth>
        <SessionLayout>
          {/* Sidebar with real data from API */}
          <SessionSidebarInfo
          sessionId={session.id}
          agentId={session.agent_id}
          agentWorkflowId={agentWorkflowId}
          isActive={session.is_active}
          totalTokens={session.total_tokens}
          messageCount={session.message_count}
          durationMinutes={session.duration_minutes}
          toolUses={session.tool_uses}
          errors={session.errors}
          errorRate={session.error_rate}
          model={session.model ?? undefined}
          provider={session.provider ?? undefined}
          events={data.events}
          availableTools={session.available_tools}
          toolUsageDetails={session.tool_usage_details}
          modelPricing={modelPricing}
          tags={session.tags}
        />

        <SessionMain>
          <Section>
            <Section.Header>
              <Section.Title>Event Timeline ({timeline.length} events)</Section.Title>
              {timeline.length > 0 && (
                <Dropdown
                  trigger={
                    <Button variant="secondary" size="sm" icon={<Download size={14} />}>
                      Export
                    </Button>
                  }
                  items={exportItems}
                  align="right"
                />
              )}
            </Section.Header>
            <TimelineContent>
              {timeline.length > 0 ? (
                <Timeline
                  events={timeline as TimelineEvent[]}
                  sessionId={sessionId}
                  systemPrompt={session.system_prompt}
                  onReplay={handleReplay}
                />
              ) : (
                <EmptyTimeline>
                  <p>No events found for this session.</p>
                </EmptyTimeline>
              )}
            </TimelineContent>
          </Section>
        </SessionMain>
        </SessionLayout>
      </Page>

      {/* Replay Panel */}
      <ReplayPanel
        isOpen={!!replayEventId}
        onClose={handleCloseReplay}
        sessionId={sessionId || ''}
        eventId={replayEventId || ''}
        events={data.timeline}
      />
    </>
  );
};
