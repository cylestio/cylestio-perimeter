import styled from 'styled-components';

import type { Theme } from '@theme/theme';

export type EventType = 'llm.call.start' | 'llm.call.finish' | 'tool.execution' | 'tool.result' | 'error' | 'default';

const getEventColor = (eventType: EventType, theme: Theme) => {
  switch (eventType) {
    case 'llm.call.start':
      return theme.colors.cyan;    // Sent to LLM = cyan
    case 'llm.call.finish':
      return theme.colors.purple;  // Received from LLM = purple
    case 'tool.execution':
    case 'tool.result':
      return theme.colors.orange;
    case 'error':
      return theme.colors.red;
    default:
      return theme.colors.cyan;
  }
};

export const TimelineContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export type MessageAlignment = 'left' | 'right' | 'center';

export const TimelineItemWrapper = styled.div<{ $isError?: boolean; $alignment?: MessageAlignment }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: ${({ $alignment }) => {
    if ($alignment === 'right') return 'flex-end';
    if ($alignment === 'center') return 'center';
    return 'flex-start';
  }};
`;

export const TimelineMarker = styled.div<{ $eventType: EventType }>`
  position: absolute;
  left: 0;
  top: 4px;
  width: 18px;
  height: 18px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme, $eventType }) => {
    const color = getEventColor($eventType, theme);
    return `rgba(${color === theme.colors.purple ? '168, 85, 247' : color === theme.colors.orange ? '255, 159, 67' : color === theme.colors.red ? '255, 71, 87' : '0, 240, 255'}, 0.15)`;
  }};
  border: 2px solid ${({ theme, $eventType }) => getEventColor($eventType, theme)};
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: ${({ theme }) => theme.radii.full};
    background: ${({ theme, $eventType }) => getEventColor($eventType, theme)};
  }
`;

export const TimelineBubble = styled.div<{ $isError?: boolean; $fullWidth?: boolean }>`
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme, $isError }) =>
    $isError ? theme.colors.red : theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  transition: all ${({ theme }) => theme.transitions.base};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : '85%')};

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
    border-color: ${({ theme, $isError }) =>
      $isError ? theme.colors.red : theme.colors.borderStrong};
  }
`;

export const TimelineHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const TimelineEventInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const EventTypeBadge = styled.span<{ $eventType: EventType }>`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme, $eventType }) => getEventColor($eventType, theme)};
`;

export const TimeStamp = styled.span`
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white50};
`;

export const ReplayButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.purpleSoft};
  border: 1px solid ${({ theme }) => theme.colors.purple};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.purple};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  font-family: ${({ theme }) => theme.typography.fontDisplay};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.purple};
    color: ${({ theme }) => theme.colors.void};
  }
`;

export const TimelineContent = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white90};
  line-height: ${({ theme }) => theme.typography.lineHeightRelaxed};
  white-space: pre-wrap;
  word-break: break-word;
`;

export const ToolBadge = styled.span`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[2]}`};
  background: ${({ theme }) => theme.colors.orangeSoft};
  border: 1px solid ${({ theme }) => theme.colors.orange};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.orange};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const MonospaceContent = styled.pre`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white70};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[2]};
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
`;

export const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.red};
  font-size: ${({ theme }) => theme.typography.textSm};
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

export const DetailsToggle = styled.details`
  margin-top: ${({ theme }) => theme.spacing[3]};

  summary {
    font-size: ${({ theme }) => theme.typography.textXs};
    color: ${({ theme }) => theme.colors.white50};
    cursor: pointer;
    user-select: none;

    &:hover {
      color: ${({ theme }) => theme.colors.white70};
    }
  }
`;

export const RawEventContent = styled.div`
  margin-top: ${({ theme }) => theme.spacing[2]};
  max-height: 300px;
  overflow-y: auto;
`;

export const AttributeRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  word-break: break-all;
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
`;

export const AttributeKey = styled.span`
  color: ${({ theme }) => theme.colors.green};
`;

export const AttributeValue = styled.span`
  color: ${({ theme }) => theme.colors.cyan};
`;

export const DirectionIcon = styled.span<{ $direction: 'sent' | 'received' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $direction }) =>
    $direction === 'sent' ? theme.colors.cyanSoft : theme.colors.purpleSoft};
  color: ${({ theme, $direction }) =>
    $direction === 'sent' ? theme.colors.cyan : theme.colors.purple};
  margin-right: ${({ theme }) => theme.spacing[1]};

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const TimelineRow = styled.div<{ $alignment?: MessageAlignment }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const TimeGutter = styled.div`
  width: 70px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-top: ${({ theme }) => theme.spacing[2]};
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const BubbleContainer = styled.div<{ $alignment?: MessageAlignment }>`
  flex: 1;
  display: flex;
  justify-content: ${({ $alignment }) =>
    $alignment === 'right' ? 'flex-end' : 'flex-start'};
`;

export const TimeOffset = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.cyan};
  cursor: default;

  svg {
    opacity: 0.7;
  }
`;

export const TimeDuration = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.white30};
  cursor: default;

  svg {
    opacity: 0.7;
  }
`;

// Response variant styles
export const ResponseBubbleWrapper = styled.div`
  width: 100%;
`;
