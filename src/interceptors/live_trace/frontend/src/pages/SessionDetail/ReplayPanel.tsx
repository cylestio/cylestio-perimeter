import { useState, useEffect, type FC } from 'react';

import { fetchReplayConfig, fetchModels, sendReplay } from '@api/endpoints/replay';
import type { ReplayConfig, ReplayResponse, TimelineEvent, ModelInfo } from '@api/types';

import { Badge } from '@ui/core/Badge';
import { Input } from '@ui/form/Input';
import { TextArea } from '@ui/form/TextArea';
import { RichSelect, type RichSelectOption } from '@ui/form/RichSelect';
import { OrbLoader } from '@ui/feedback/OrbLoader';
import { JsonEditor } from '@ui/form/JsonEditor';
import { Section } from '@ui/layout/Section';
import { Drawer } from '@ui/overlays/Drawer';

import {
  FormGroup,
  FormRow,
  FormLabel,
  ReplayButton,
  ResponseMeta,
  ResponseContent,
  ResponseError,
  ResponseEmpty,
  ResponseEmptyIcon,
  ReplayPanelContainer,
  ProviderBadge,
  ToggleToolsButton,
  ApiKeyInfo,
  ApiKeyActionButton,
  ApiKeySaveButton,
  ApiKeyHint,
  ApiKeyFormRow,
  ToolCallBlock,
  ToolCallCode,
  RawResponseToggle,
  RawResponseCode,
  ResponseContentItem,
  ModelOptionContent,
  ModelOptionName,
  ModelOptionPrice,
  ModelValueContent,
  ModelValuePrice,
} from './SessionDetail.styles';

// Module-level API key storage (persists during app runtime, cleared on page reload)
let memorySavedApiKey: string | null = null;

const getSavedApiKey = (): string | null => memorySavedApiKey;
const setSavedApiKey = (key: string | null): void => {
  memorySavedApiKey = key;
};

const maskKey = (key: string): string => {
  if (key.length <= 4) return '****';
  return '****' + key.slice(-4);
};

// Format pricing for display
const formatPrice = (price: number): string => {
  if (price >= 1) return `$${price}`;
  if (price >= 0.1) return `$${price.toFixed(1)}`;
  return `$${price.toFixed(2)}`;
};

// Convert ModelInfo to RichSelectOption
const modelToOption = (model: ModelInfo): RichSelectOption<ModelInfo> => ({
  value: model.id,
  label: model.name,
  data: model,
});

interface ReplayPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  eventId: string;
  events: TimelineEvent[];
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
  const [models, setModels] = useState<{ openai: ModelInfo[]; anthropic: ModelInfo[] }>({
    openai: [],
    anthropic: [],
  });

  // Form state
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [sessionApiKey, setSessionApiKey] = useState<string | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);
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
  // Note: `events` intentionally excluded from deps to prevent form reset on polling
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

        // Set model - try multiple sources with fallbacks
        let modelStr = '';
        const modelFromRequest = requestData.model;
        const modelFromDetails = event.details?.['llm.model'] ?? event.details?.['llm.request.model'];

        if (typeof modelFromRequest === 'string') {
          modelStr = modelFromRequest;
        } else if (modelFromRequest && typeof modelFromRequest === 'object') {
          const obj = modelFromRequest as Record<string, unknown>;
          modelStr = String(obj.id ?? obj.name ?? obj.model ?? '');
        }

        if (!modelStr && typeof modelFromDetails === 'string') {
          modelStr = modelFromDetails;
        }
        setModel(modelStr);

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

        // Set tools JSON (but keep collapsed by default)
        setToolsJson(JSON.stringify(tools, null, 2));

        // Load saved API key from memory
        const savedKey = getSavedApiKey();
        setSessionApiKey(savedKey);

        // Start in edit mode if no key available at all
        setIsEditingKey(!configData.api_key_available && !savedKey);
        setApiKey('');

        // Clear previous response
        setResponse(null);
        setResponseError(null);
      } catch (err) {
        console.error('Failed to load replay data:', err);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, eventId]);

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

      // Only include tools if there are any (empty array = no tools)
      if (tools.length > 0) {
        requestData.tools = tools;
        // For OpenAI, set tool_choice to auto when tools are present
        if (provider === 'openai') {
          requestData.tool_choice = 'auto';
        }
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
        api_key: sessionApiKey || (apiKey.trim() ? apiKey : undefined),
      });

      setResponse(result);
    } catch (err) {
      setResponseError(err instanceof Error ? err.message : 'Replay failed');
    } finally {
      setSending(false);
    }
  };

  // Build model options for current provider
  const modelOptions = (provider === 'openai' ? models.openai : models.anthropic).map(modelToOption);

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title="Edit & Replay"
      position="right"
      size="xl"
      showOverlay={true}
      closeOnOverlayClick={true}
      closeOnEsc={true}
    >
      <ReplayPanelContainer>
        {/* API Key Section */}
        <Section>
          <Section.Header>
            <Section.Title>
              <ProviderBadge $provider={provider}>
                {provider === 'openai' ? 'OpenAI' : 'Anthropic'}
              </ProviderBadge>
              API Key
              {sessionApiKey && <ApiKeyInfo>({maskKey(sessionApiKey)})</ApiKeyInfo>}
              {!sessionApiKey && replayConfig?.api_key_available && (
                <ApiKeyInfo>({replayConfig.api_key_masked})</ApiKeyInfo>
              )}
            </Section.Title>
            <ApiKeyActionButton type="button" onClick={() => setIsEditingKey(!isEditingKey)}>
              {isEditingKey ? 'Cancel' : 'Edit'}
            </ApiKeyActionButton>
          </Section.Header>
          {/* Show form when: editing, OR no key exists anywhere */}
          {(isEditingKey || (!replayConfig?.api_key_available && !sessionApiKey)) && (
            <Section.Content>
              <ApiKeyFormRow>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key"
                  fullWidth
                />
                <ApiKeySaveButton
                  type="button"
                  disabled={!apiKey.trim()}
                  onClick={() => {
                    setSavedApiKey(apiKey);
                    setSessionApiKey(apiKey);
                    setApiKey('');
                    setIsEditingKey(false);
                  }}
                >
                  Save
                </ApiKeySaveButton>
              </ApiKeyFormRow>
              {!replayConfig?.api_key_available && !sessionApiKey && (
                <ApiKeyHint>
                  No API key found in config or environment.<br />
                  Enter a key to use for replay requests.
                  It will be saved until page reload.
                </ApiKeyHint>
              )}
            </Section.Content>
          )}
        </Section>

        {/* Request Editor */}
        <Section>
          <Section.Header>
            <Section.Title>Request Editor</Section.Title>
          </Section.Header>
          <Section.Content>
            <FormGroup>
              <FormRow>
                <FormGroup>
                  <RichSelect<ModelInfo>
                    label="Model"
                    options={modelOptions}
                    value={model}
                    onChange={(value) => setModel(value)}
                    placeholder="Select a model"
                    fullWidth
                    renderOption={(option) => (
                      <ModelOptionContent>
                        <ModelOptionName>{option.label}</ModelOptionName>
                        {option.data && (
                          <ModelOptionPrice>
                            {formatPrice(option.data.input)} / {formatPrice(option.data.output)}
                          </ModelOptionPrice>
                        )}
                      </ModelOptionContent>
                    )}
                    renderValue={(option) => (
                      <ModelValueContent>
                        <span>{option.label}</span>
                        {option.data && (
                          <ModelValuePrice>
                            {formatPrice(option.data.input)} / {formatPrice(option.data.output)}
                          </ModelValuePrice>
                        )}
                      </ModelValueContent>
                    )}
                  />
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

              <ToggleToolsButton type="button" onClick={() => setShowTools(!showTools)}>
                {showTools ? '▼ Hide Tools' : '▶ Show Tools'}
              </ToggleToolsButton>

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
          </Section.Content>
        </Section>

        {/* Response */}
        <Section>
          <Section.Header>
            <Section.Title>Response</Section.Title>
          </Section.Header>
          <Section.Content>
            {!response && !responseError && !sending && (
              <ResponseEmpty>
                <ResponseEmptyIcon>↻</ResponseEmptyIcon>
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
                  {response.parsed?.finish_reason && (
                    <Badge variant="info">{response.parsed.finish_reason}</Badge>
                  )}
                  {response.parsed?.model && (
                    <Badge variant="success">{response.parsed.model}</Badge>
                  )}
                  {response.elapsed_ms !== undefined && (
                    <Badge variant="low">
                      {response.elapsed_ms >= 1000
                        ? `${(response.elapsed_ms / 1000).toFixed(2)}s`
                        : `${Math.round(response.elapsed_ms)}ms`}
                    </Badge>
                  )}
                  {response.parsed?.usage?.total_tokens !== undefined && (
                    <Badge variant="info">
                      {response.parsed.usage.total_tokens} tokens
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
                  <ResponseContentItem key={idx}>
                    {item.type === 'text' && (
                      <ResponseContent>{item.text}</ResponseContent>
                    )}
                    {item.type === 'tool_use' && (
                      <ToolCallBlock>
                        <Badge variant="high">{item.name}</Badge>
                        <ToolCallCode>
                          {typeof item.input === 'string'
                            ? item.input
                            : JSON.stringify(item.input, null, 2)}
                        </ToolCallCode>
                      </ToolCallBlock>
                    )}
                  </ResponseContentItem>
                ))}

                <RawResponseToggle>
                  <summary>Show raw response</summary>
                  <RawResponseCode>
                    {JSON.stringify(response.raw_response, null, 2)}
                  </RawResponseCode>
                </RawResponseToggle>
              </>
            )}
          </Section.Content>
        </Section>
      </ReplayPanelContainer>
    </Drawer>
  );
};
