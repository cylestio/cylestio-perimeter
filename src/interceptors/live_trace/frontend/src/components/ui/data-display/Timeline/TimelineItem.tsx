import { useState, type FC, type ReactNode } from 'react';

import { ArrowLeft, ArrowRight, Clock, Timer } from 'lucide-react';

import { TimeAgo } from '@ui/core';
import { Tooltip } from '@ui/overlays';

import {
  TimelineBubble,
  TimelineHeader,
  TimelineEventInfo,
  EventTypeBadge,
  ReplayButton,
  TimelineContent,
  ToolBadge,
  MonospaceContent,
  ErrorMessage,
  DetailsToggle,
  RawEventContent,
  AttributeRow,
  AttributeKey,
  AttributeValue,
  DirectionIcon,
  TimelineRow,
  TimeGutter,
  TimeOffset,
  TimeDuration,
  BubbleContainer,
  ResponseBubbleWrapper,
  type EventType,
  type MessageAlignment,
} from './Timeline.styles';

// Types
export interface TimelineEvent {
  id?: string;
  event_type: string;
  timestamp: string;
  level?: string;
  description?: string;
  details?: Record<string, unknown>;
}

export interface TimelineItemProps {
  event: TimelineEvent;
  sessionId?: string;
  onReplay?: (eventId: string) => void;
  startTime?: Date;
  durationMs?: number;
  isFirstEvent?: boolean;
  variant?: 'default' | 'response';
  showRawToggle?: boolean;
}

// Utility functions
export function extractTextContent(content: unknown): string | null {
  if (typeof content === 'string') return content;
  if (!content) return null;

  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const block of content) {
      if (!block) continue;
      if (block.type === 'text' && block.text) {
        textParts.push(block.text);
      } else if (block.type === 'tool_use' && block.name) {
        textParts.push(`[Calling tool: ${block.name}]`);
      } else if (block.type === 'tool_result' && block.content) {
        const nestedText = extractTextContent(block.content);
        if (nestedText) textParts.push(`[Tool result]: ${nestedText}`);
      } else if (block.text) {
        textParts.push(block.text);
      }
    }
    if (textParts.length > 0) return textParts.join('\n\n');
  }

  if (typeof content === 'object' && content !== null && 'text' in content) {
    return (content as { text: string }).text;
  }

  return null;
}

export function getEventType(eventType: string, level?: string): EventType {
  if (level === 'ERROR') return 'error';
  if (eventType === 'llm.call.start') return 'llm.call.start';
  if (eventType === 'llm.call.finish') return 'llm.call.finish';
  if (eventType === 'tool.execution') return 'tool.execution';
  if (eventType === 'tool.result') return 'tool.result';
  return 'default';
}

export function getMessageAlignment(eventType: string): MessageAlignment {
  // Client-side: user message to LLM, tool results (response to LLM's request)
  if (eventType === 'llm.call.start') return 'left';
  if (eventType === 'tool.result') return 'left';
  // LLM-side: LLM response, tool execution (LLM requests a tool)
  if (eventType === 'llm.call.finish') return 'right';
  if (eventType === 'tool.execution') return 'right';
  return 'left';
}

// Format milliseconds to relative time string "+M:SS"
export function formatRelativeTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `+${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format duration in seconds "X.Xs"
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// Sub-component for LLM Call Start content
function LLMCallStartContent({ details }: { details: Record<string, unknown> }) {
  const requestData = (details['llm.request.data'] || {}) as Record<string, unknown>;
  const messages = (requestData.messages || []) as Array<{ role: string; content: unknown }>;

  if (messages.length === 0) return null;

  const lastMessage = messages[messages.length - 1];
  const textContent = extractTextContent(lastMessage.content);

  if (textContent) {
    const truncated = textContent.length > 500 ? textContent.substring(0, 500) + '...' : textContent;
    return <TimelineContent>{truncated}</TimelineContent>;
  }

  const contentStr = JSON.stringify(lastMessage.content, null, 2);
  const truncated = contentStr.length > 400 ? contentStr.substring(0, 400) + '...' : contentStr;
  return <MonospaceContent>{truncated}</MonospaceContent>;
}

// Sub-component for LLM Call Finish content (default variant)
function LLMCallFinishContent({ details }: { details: Record<string, unknown> }) {
  const responseContent = (details['llm.response.content'] || []) as Array<{ text?: string; content?: string }>;
  if (responseContent.length === 0) return null;

  const firstChoice = responseContent[0];
  const text = firstChoice.text || firstChoice.content || '';
  if (!text) return null;

  const truncated = text.length > 500 ? text.substring(0, 500) + '...' : text;
  return <TimelineContent>{truncated}</TimelineContent>;
}

// Sub-component for response variant content (renders all content blocks)
function ResponseContent({ details }: { details: Record<string, unknown> }) {
  const responseContent = (details['llm.response.content'] || []) as Array<{
    type?: string;
    text?: string;
    content?: string;
    name?: string;
    input?: unknown;
  }>;

  if (responseContent.length === 0) return null;

  return (
    <>
      {responseContent.map((item, idx) => {
        // Handle text content
        if (item.type === 'text' && item.text) {
          return <TimelineContent key={idx}>{item.text}</TimelineContent>;
        }

        // Handle tool_use content
        if (item.type === 'tool_use' && item.name) {
          const inputStr = item.input
            ? typeof item.input === 'string'
              ? item.input
              : JSON.stringify(item.input, null, 2)
            : null;
          return (
            <div key={idx} style={{ marginTop: idx > 0 ? '12px' : 0 }}>
              <ToolBadge>{item.name}</ToolBadge>
              {inputStr && <MonospaceContent>{inputStr}</MonospaceContent>}
            </div>
          );
        }

        // Fallback for old format (text/content without type)
        const text = item.text || item.content;
        if (text) {
          return <TimelineContent key={idx}>{text}</TimelineContent>;
        }

        return null;
      })}
    </>
  );
}

// Sub-component for Tool Execution content
function ToolExecutionContent({ details }: { details: Record<string, unknown> }) {
  const toolName = (details['tool.name'] || 'unknown') as string;
  const toolParams = details['tool.params'];

  return (
    <>
      <ToolBadge>{toolName}</ToolBadge>
      {toolParams && (
        <MonospaceContent>
          {JSON.stringify(toolParams, null, 2).length > 300
            ? JSON.stringify(toolParams, null, 2).substring(0, 300) + '...'
            : JSON.stringify(toolParams, null, 2)}
        </MonospaceContent>
      )}
    </>
  );
}

// Sub-component for Tool Result content
function ToolResultContent({ details }: { details: Record<string, unknown> }) {
  const toolResult = details['tool.result'];
  if (!toolResult) return null;

  const resultStr = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2);
  const truncated = resultStr.length > 300 ? resultStr.substring(0, 300) + '...' : resultStr;

  return <MonospaceContent>{truncated}</MonospaceContent>;
}

// TimelineItem Component
export const TimelineItem: FC<TimelineItemProps> = ({
  event,
  sessionId,
  onReplay,
  startTime,
  durationMs,
  isFirstEvent = false,
  variant = 'default',
  showRawToggle = true,
}) => {
  const [showRaw, setShowRaw] = useState(false);

  const eventType = getEventType(event.event_type, event.level);
  const alignment = getMessageAlignment(event.event_type);
  const isError = event.level === 'ERROR';
  const isResponseVariant = variant === 'response';
  const canReplay = !isResponseVariant && event.event_type === 'llm.call.start' && sessionId && event.id && onReplay;

  // Calculate offset from start (only for default variant)
  const offsetMs = startTime
    ? new Date(event.timestamp).getTime() - startTime.getTime()
    : 0;

  const handleReplayClick = () => {
    if (onReplay && event.id) {
      onReplay(event.id);
    }
  };

  const renderContent = (): ReactNode => {
    if (!event.details) {
      if (event.description) {
        return <TimelineContent>{event.description}</TimelineContent>;
      }
      return null;
    }

    // Response variant uses special content renderer
    if (isResponseVariant && event.event_type === 'llm.call.finish') {
      return <ResponseContent details={event.details} />;
    }

    switch (event.event_type) {
      case 'llm.call.start':
        return <LLMCallStartContent details={event.details} />;
      case 'llm.call.finish':
        return <LLMCallFinishContent details={event.details} />;
      case 'tool.execution':
        return <ToolExecutionContent details={event.details} />;
      case 'tool.result':
        return <ToolResultContent details={event.details} />;
      default:
        return event.description ? <TimelineContent>{event.description}</TimelineContent> : null;
    }
  };

  const renderRawToggle = () => {
    if (!showRawToggle) return null;

    // For response variant, show raw_response from details if available
    const rawData = isResponseVariant && event.details?.raw_response
      ? event.details.raw_response
      : event;

    return (
      <DetailsToggle open={showRaw}>
        <summary onClick={(e) => { e.preventDefault(); setShowRaw(!showRaw); }}>
          {isResponseVariant ? 'Show raw response' : 'Show raw event'}
        </summary>
        <RawEventContent>
          {isResponseVariant ? (
            <MonospaceContent style={{ marginTop: 0, maxHeight: '300px' }}>
              {JSON.stringify(rawData, null, 2)}
            </MonospaceContent>
          ) : (
            <>
              <AttributeRow>
                <strong>Event Type:</strong> {event.event_type}
              </AttributeRow>
              <AttributeRow>
                <strong>Level:</strong> {event.level || 'INFO'}
              </AttributeRow>
              <AttributeRow>
                <strong>Timestamp:</strong> {event.timestamp}
              </AttributeRow>
              {event.details && Object.keys(event.details).length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Attributes:</strong>
                  <div style={{ marginLeft: '12px', marginTop: '4px' }}>
                    {Object.entries(event.details).map(([key, value]) => (
                      <AttributeRow key={key}>
                        <AttributeKey>{key}:</AttributeKey>{' '}
                        <AttributeValue>
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </AttributeValue>
                      </AttributeRow>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </RawEventContent>
      </DetailsToggle>
    );
  };

  // Response variant: simplified layout without time gutter
  if (isResponseVariant) {
    return (
      <ResponseBubbleWrapper>
        <TimelineBubble $isError={isError} $fullWidth>
          <TimelineHeader>
            <TimelineEventInfo>
              <EventTypeBadge $eventType={eventType}>{event.event_type}</EventTypeBadge>
            </TimelineEventInfo>
          </TimelineHeader>

          {renderContent()}

          {isError && event.details && 'error.message' in event.details && (
            <ErrorMessage>
              <strong>Error:</strong> {String(event.details['error.message'])}
            </ErrorMessage>
          )}

          {renderRawToggle()}
        </TimelineBubble>
      </ResponseBubbleWrapper>
    );
  }

  // Default variant: full layout with time gutter
  return (
    <TimelineRow>
      <TimeGutter>
        {isFirstEvent ? (
          <TimeAgo timestamp={event.timestamp} />
        ) : (
          <>
            <Tooltip content="Elapsed time since first event" position="right">
              <TimeOffset>
                <Clock size={10} />
                {formatRelativeTime(offsetMs)}
              </TimeOffset>
            </Tooltip>
            {durationMs !== undefined && (
              <Tooltip content="Wait time before next event" position="right">
                <TimeDuration>
                  <Timer size={10} />
                  {formatDuration(durationMs)}
                </TimeDuration>
              </Tooltip>
            )}
          </>
        )}
      </TimeGutter>
      <BubbleContainer $alignment={alignment}>
        <TimelineBubble $isError={isError}>
        <TimelineHeader>
          <TimelineEventInfo>
            {(eventType === 'llm.call.start' || eventType === 'llm.call.finish') && (
              <DirectionIcon $direction={eventType === 'llm.call.start' ? 'sent' : 'received'}>
                {eventType === 'llm.call.start' ? <ArrowRight /> : <ArrowLeft />}
              </DirectionIcon>
            )}
            <EventTypeBadge $eventType={eventType}>{event.event_type}</EventTypeBadge>
          </TimelineEventInfo>
          {canReplay && (
            <ReplayButton onClick={handleReplayClick}>
              <span>Edit & Replay</span>
            </ReplayButton>
          )}
        </TimelineHeader>

        {renderContent()}

        {isError && event.details && 'error.message' in event.details && (
          <ErrorMessage>
            <strong>Error:</strong> {String(event.details['error.message'])}
          </ErrorMessage>
        )}

        {renderRawToggle()}
        </TimelineBubble>
      </BubbleContainer>
    </TimelineRow>
  );
};
