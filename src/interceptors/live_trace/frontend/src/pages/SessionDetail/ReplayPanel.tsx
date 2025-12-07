import { useState, useEffect, type FC } from 'react';
import { X } from 'lucide-react';

import { fetchReplayConfig, fetchModels, sendReplay } from '@api/endpoints/replay';
import type { ReplayConfig, ReplayResponse, SessionEvent } from '@api/types';

import { Badge } from '@ui/core/Badge';
import { Input } from '@ui/form/Input';
import { TextArea } from '@ui/form/TextArea';
import { Checkbox } from '@ui/form/Checkbox';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { JsonEditor } from '@ui/form/JsonEditor';

import {
  ReplayPanelOverlay,
  ReplayPanelHeader,
  ReplayPanelTitle,
  ReplayPanelClose,
  ReplayPanelContent,
  ReplaySection,
  ReplaySectionHeader,
  ReplaySectionContent,
  FormGroup,
  FormRow,
  FormLabel,
  ReplayButton,
  ResponseMeta,
  ResponseContent,
  ResponseError,
  ResponseEmpty,
  ResponseEmptyIcon,
} from './SessionDetail.styles';

interface ReplayPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  eventId: string;
  events: SessionEvent[];
}

export const ReplayPanel: FC<ReplayPanelProps> = ({
  isOpen,
  onClose,
  sessionId: _sessionId, // Reserved for future use
  eventId,
  events,
}) => {
  // Config state
  const [replayConfig, setReplayConfig] = useState<ReplayConfig | null>(null);
  const [models, setModels] = useState<{ openai: string[]; anthropic: string[] }>({
    openai: [],
    anthropic: [],
  });

  // Form state
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [useDefaultKey, setUseDefaultKey] = useState(true);
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [messagesJson, setMessagesJson] = useState('[]');
  const [toolsJson, setToolsJson] = useState('[]');
  const [showTools, setShowTools] = useState(false);

  // Response state
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ReplayResponse | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);

  // Load config and initialize form when panel opens with a new event
  useEffect(() => {
    if (!isOpen || !eventId) return;

    const loadData = async () => {
      try {
        const [configData, modelsData] = await Promise.all([
          fetchReplayConfig(),
          fetchModels(),
        ]);

        setReplayConfig(configData);
        setModels(modelsData.models);

        // Find the event
        const event = events.find((e) => e.id === eventId);
        if (!event || event.event_type !== 'llm.call.start') return;

        // Initialize form with event data
        const requestData = (event.details?.['llm.request.data'] || {}) as Record<string, unknown>;
        const messages = (requestData.messages || []) as Array<{ role: string; content: unknown }>;
        const tools = (requestData.tools || []) as unknown[];

        // Set provider
        const eventProvider = (event.details?.['llm.vendor'] as string) || configData.provider_type || 'openai';
        setProvider(eventProvider as 'openai' | 'anthropic');

        // Set model
        setModel((requestData.model as string) || (event.details?.['llm.model'] as string) || '');

        // Set temperature and max tokens
        setTemperature((requestData.temperature as number) ?? 0.7);
        setMaxTokens((requestData.max_tokens as number) ?? 2048);

        // Extract system prompt
        let sysPrompt = (requestData.system as string) || '';
        if (!sysPrompt && messages.length > 0 && messages[0].role === 'system') {
          sysPrompt = messages[0].content as string;
        }
        setSystemPrompt(sysPrompt);

        // Filter out system messages
        const nonSystemMessages = messages.filter((m) => m.role !== 'system');
        setMessagesJson(JSON.stringify(nonSystemMessages, null, 2));

        // Set tools
        setToolsJson(JSON.stringify(tools, null, 2));
        setShowTools(tools.length > 0);

        // Set API key preferences
        setUseDefaultKey(configData.api_key_available);

        // Clear previous response
        setResponse(null);
        setResponseError(null);
      } catch (err) {
        console.error('Failed to load replay data:', err);
      }
    };

    loadData();
  }, [isOpen, eventId, events]);

  const handleReplay = async () => {
    setSending(true);
    setResponse(null);
    setResponseError(null);

    try {
      // Parse messages and tools
      let messages: Array<{ role: string; content: unknown }>;
      let tools: unknown[];

      try {
        messages = JSON.parse(messagesJson);
      } catch {
        setResponseError('Invalid messages JSON');
        setSending(false);
        return;
      }

      try {
        tools = JSON.parse(toolsJson);
      } catch {
        setResponseError('Invalid tools JSON');
        setSending(false);
        return;
      }

      // Build request data
      const requestData: Record<string, unknown> = {
        model,
        messages: systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...messages]
          : messages,
        temperature,
        max_tokens: maxTokens,
      };

      if (tools.length > 0) {
        requestData.tools = tools;
      }

      // For Anthropic, use 'system' field instead
      if (provider === 'anthropic' && systemPrompt) {
        requestData.system = systemPrompt;
        requestData.messages = messages;
      }

      const result = await sendReplay({
        provider,
        base_url: replayConfig?.base_url,
        request_data: requestData as never,
        api_key: !useDefaultKey && apiKey ? apiKey : undefined,
      });

      setResponse(result);
    } catch (err) {
      setResponseError(err instanceof Error ? err.message : 'Replay failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <ReplayPanelOverlay $isOpen={isOpen}>
      <ReplayPanelHeader>
        <ReplayPanelTitle>Edit & Replay</ReplayPanelTitle>
        <ReplayPanelClose onClick={onClose}>
          <X size={20} />
        </ReplayPanelClose>
      </ReplayPanelHeader>

      <ReplayPanelContent>
        {/* API Key Section */}
        <ReplaySection>
          <ReplaySectionHeader>
            {provider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key
          </ReplaySectionHeader>
          <ReplaySectionContent>
            {replayConfig?.api_key_available ? (
              <FormGroup>
                <Checkbox
                  checked={useDefaultKey}
                  onChange={(checked) => setUseDefaultKey(checked)}
                  label={`Use saved key (${replayConfig.api_key_masked})`}
                />
                {!useDefaultKey && (
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key"
                  />
                )}
              </FormGroup>
            ) : (
              <FormGroup>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key"
                />
                <div style={{ fontSize: '12px', color: 'var(--color-orange)' }}>
                  No API key found in proxy config or environment
                </div>
              </FormGroup>
            )}
          </ReplaySectionContent>
        </ReplaySection>

        {/* Request Editor */}
        <ReplaySection>
          <ReplaySectionHeader>Request Editor</ReplaySectionHeader>
          <ReplaySectionContent>
            <FormGroup>
              <FormRow>
                <FormGroup>
                  <FormLabel>Model</FormLabel>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g., gpt-4"
                    list="models-list"
                  />
                  <datalist id="models-list">
                    {(provider === 'openai' ? models.openai : models.anthropic).map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Temperature</FormLabel>
                  <Input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Max Tokens</FormLabel>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                    min={1}
                    max={200000}
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <FormLabel>System Prompt</FormLabel>
                <TextArea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="System instructions..."
                  rows={4}
                />
              </FormGroup>

              <JsonEditor
                value={messagesJson}
                onChange={setMessagesJson}
                label="Messages"
                placeholder="Click + Add Item to add a message"
              />

              <button
                type="button"
                onClick={() => setShowTools(!showTools)}
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border-medium)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  color: 'var(--color-white-70)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {showTools ? 'Hide Tools' : 'Show Tools'}
              </button>

              {showTools && (
                <JsonEditor
                  value={toolsJson}
                  onChange={setToolsJson}
                  label="Tools"
                  placeholder="Click + Add Item to add a tool"
                />
              )}

              <ReplayButton onClick={handleReplay} disabled={sending}>
                {sending ? (
                  <>
                    <OrbLoader size="sm" />
                    Sending...
                  </>
                ) : (
                  'Send Replay'
                )}
              </ReplayButton>
            </FormGroup>
          </ReplaySectionContent>
        </ReplaySection>

        {/* Response */}
        <ReplaySection>
          <ReplaySectionHeader>
            Response
            {response?.parsed?.usage && (
              <span style={{ marginLeft: '8px' }}>
                <Badge variant="info">
                  {response.parsed.usage.total_tokens} tokens
                </Badge>
              </span>
            )}
          </ReplaySectionHeader>
          <ReplaySectionContent>
            {!response && !responseError && !sending && (
              <ResponseEmpty>
                <ResponseEmptyIcon>&#8635;</ResponseEmptyIcon>
                <div>Edit the request and click "Send Replay" to see the response</div>
              </ResponseEmpty>
            )}

            {sending && (
              <ResponseEmpty>
                <OrbLoader size="lg" />
                <div>Waiting for response...</div>
              </ResponseEmpty>
            )}

            {responseError && <ResponseError>{responseError}</ResponseError>}

            {response && (
              <>
                <ResponseMeta>
                  <Badge variant="success">{response.parsed?.model}</Badge>
                  {response.parsed?.finish_reason && (
                    <Badge variant="info">{response.parsed.finish_reason}</Badge>
                  )}
                  {response.elapsed_ms && (
                    <Badge variant="low">
                      {response.elapsed_ms >= 1000
                        ? `${(response.elapsed_ms / 1000).toFixed(2)}s`
                        : `${Math.round(response.elapsed_ms)}ms`}
                    </Badge>
                  )}
                  {response.cost?.total !== undefined && response.cost.total > 0 && (
                    <Badge variant="medium">
                      ${response.cost.total < 0.01
                        ? response.cost.total.toFixed(4)
                        : response.cost.total.toFixed(3)}
                    </Badge>
                  )}
                </ResponseMeta>

                {response.parsed?.content?.map((item, idx) => (
                  <div key={idx} style={{ marginTop: '12px' }}>
                    {item.type === 'text' && (
                      <ResponseContent>{item.text}</ResponseContent>
                    )}
                    {item.type === 'tool_use' && (
                      <div
                        style={{
                          background: 'var(--color-orange-soft)',
                          border: '1px solid var(--color-orange)',
                          borderRadius: '6px',
                          padding: '12px',
                        }}
                      >
                        <Badge variant="high">{item.name}</Badge>
                        <pre
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            marginTop: '8px',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {typeof item.input === 'string'
                            ? item.input
                            : JSON.stringify(item.input, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}

                <details style={{ marginTop: '16px' }}>
                  <summary
                    style={{
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--color-white-50)',
                    }}
                  >
                    Show raw response
                  </summary>
                  <pre
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      marginTop: '8px',
                      background: 'var(--color-surface)',
                      padding: '12px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '300px',
                    }}
                  >
                    {JSON.stringify(response.raw_response, null, 2)}
                  </pre>
                </details>
              </>
            )}
          </ReplaySectionContent>
        </ReplaySection>
      </ReplayPanelContent>
    </ReplayPanelOverlay>
  );
};
