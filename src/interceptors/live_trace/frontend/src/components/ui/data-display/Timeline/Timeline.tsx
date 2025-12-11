import { useState, type FC, type ReactNode } from 'react';

import { TimeAgo } from '@ui/core';

import {
  TimelineContainer,
  TimelineItemWrapper,
  TimelineMarker,
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
  type EventType,
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

export interface TimelineProps {
  events: TimelineEvent[];
  sessionId?: string;
  onReplay?: (eventId: string) => void;
  className?: string;
}

export interface TimelineItemProps {
  event: TimelineEvent;
  sessionId?: string;
  onReplay?: (eventId: string) => void;
}

// Utility functions
function extractTextContent(content: unknown): string | null {
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

function getEventType(eventType: string, level?: string): EventType {
  if (level === 'ERROR') return 'error';
  if (eventType === 'llm.call.start') return 'llm.call.start';
  if (eventType === 'llm.call.finish') return 'llm.call.finish';
  if (eventType === 'tool.execution') return 'tool.execution';
  if (eventType === 'tool.result') return 'tool.result';
  return 'default';
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

// Sub-component for LLM Call Finish content
function LLMCallFinishContent({ details }: { details: Record<string, unknown> }) {
  const responseContent = (details['llm.response.content'] || []) as Array<{ text?: string; content?: string }>;
  if (responseContent.length === 0) return null;

  const firstChoice = responseContent[0];
  const text = firstChoice.text || firstChoice.content || '';
  if (!text) return null;

  const truncated = text.length > 500 ? text.substring(0, 500) + '...' : text;
  return <TimelineContent>{truncated}</TimelineContent>;
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
export const TimelineItem: FC<TimelineItemProps> = ({ event, sessionId, onReplay }) => {
  const [showRaw, setShowRaw] = useState(false);

  const eventType = getEventType(event.event_type, event.level);
  const isError = event.level === 'ERROR';
  const canReplay = event.event_type === 'llm.call.start' && sessionId && event.id && onReplay;

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

  return (
    <TimelineItemWrapper $isError={isError}>
      <TimelineMarker $eventType={eventType} />
      <TimelineBubble $isError={isError}>
        <TimelineHeader>
          <TimelineEventInfo>
            <EventTypeBadge $eventType={eventType}>{event.event_type}</EventTypeBadge>
            <TimeAgo timestamp={event.timestamp} />
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

        <DetailsToggle open={showRaw}>
          <summary onClick={(e) => { e.preventDefault(); setShowRaw(!showRaw); }}>
            Show raw event
          </summary>
          <RawEventContent>
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
          </RawEventContent>
        </DetailsToggle>
      </TimelineBubble>
    </TimelineItemWrapper>
  );
};

// Timeline Component
export const Timeline: FC<TimelineProps> = ({ events, sessionId, onReplay, className }) => {
  return (
    <TimelineContainer className={className}>
      {events.map((event, index) => (
        <TimelineItem
          key={event.id || index}
          event={event}
          sessionId={sessionId}
          onReplay={onReplay}
        />
      ))}
    </TimelineContainer>
  );
};
