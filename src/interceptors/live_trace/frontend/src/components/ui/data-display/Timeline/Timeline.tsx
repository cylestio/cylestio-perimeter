import type { FC } from 'react';

import { Bot } from 'lucide-react';

import { Accordion } from '@ui/data-display';

import { TimelineContainer } from './Timeline.styles';
import { TimelineItem } from './TimelineItem';
import type { TimelineEvent } from './TimelineItem';

// Re-export types for backward compatibility
export type { TimelineEvent, TimelineItemProps } from './TimelineItem';

export interface TimelineProps {
  events: TimelineEvent[];
  sessionId?: string;
  systemPrompt?: string | null;
  onReplay?: (eventId: string) => void;
  className?: string;
}

// Timeline Component
export const Timeline: FC<TimelineProps> = ({ events, sessionId, systemPrompt, onReplay, className }) => {
  // Get start time from first event
  const startTime = events.length > 0 ? new Date(events[0].timestamp) : null;

  return (
    <TimelineContainer className={className}>
      {systemPrompt && (
        <Accordion
          title="System Prompt"
          icon={<Bot size={14} />}
          defaultOpen={false}
        >
          {systemPrompt}
        </Accordion>
      )}
      {events.map((event, index) => {
        const nextEvent = events[index + 1];
        const durationMs = nextEvent
          ? new Date(nextEvent.timestamp).getTime() - new Date(event.timestamp).getTime()
          : undefined;

        return (
          <TimelineItem
            key={event.id ? `${event.id}-${event.event_type}` : `${index}`}
            event={event}
            sessionId={sessionId}
            onReplay={onReplay}
            startTime={startTime ?? undefined}
            durationMs={durationMs}
            isFirstEvent={index === 0}
          />
        );
      })}
    </TimelineContainer>
  );
};
