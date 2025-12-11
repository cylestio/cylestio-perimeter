import type { FC } from 'react';

import { timeAgo, formatAbsoluteDateTime } from '@utils/formatting';

import { Tooltip } from '@ui/overlays';

import { TimeAgoWrapper } from './TimeAgo.styles';

export type TimeAgoFormat = 'relative' | 'absolute';

export interface TimeAgoProps {
  timestamp: string | Date | number | null | undefined;
  format?: TimeAgoFormat;
  className?: string;
}

export const TimeAgo: FC<TimeAgoProps> = ({
  timestamp,
  format = 'relative',
  className,
}) => {
  const relativeTime = timeAgo(timestamp);
  const absoluteTime = formatAbsoluteDateTime(timestamp);

  // If no valid timestamp, just show dash without tooltip
  if (relativeTime === '-' || absoluteTime === '-') {
    return <TimeAgoWrapper className={className}>-</TimeAgoWrapper>;
  }

  const displayText = format === 'relative' ? relativeTime : absoluteTime;
  const tooltipText = format === 'relative' ? absoluteTime : relativeTime;

  return (
    <Tooltip content={tooltipText} position="top">
      <TimeAgoWrapper className={className}>{displayText}</TimeAgoWrapper>
    </Tooltip>
  );
};
