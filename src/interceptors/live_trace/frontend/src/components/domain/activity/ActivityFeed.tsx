import type { FC, ReactNode } from 'react';

import { CheckCircle, AlertTriangle, Activity, Search } from 'lucide-react';

import { TimeAgo } from '@ui/core';

import {
  FeedContainer,
  FeedItem,
  ItemIcon,
  ItemContent,
  ItemTitle,
  ItemDetail,
} from './ActivityFeed.styles';

// Types
export type ActivityType = 'fixed' | 'found' | 'session' | 'scan';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  timestamp: Date | string;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
  onItemClick?: (item: ActivityItem) => void;
}

// Helper
const getIcon = (type: ActivityType): ReactNode => {
  switch (type) {
    case 'fixed':
      return <CheckCircle size={14} />;
    case 'found':
      return <AlertTriangle size={14} />;
    case 'session':
      return <Activity size={14} />;
    case 'scan':
      return <Search size={14} />;
  }
};

// Component
export const ActivityFeed: FC<ActivityFeedProps> = ({
  items,
  maxItems,
  onItemClick,
}) => {
  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  return (
    <FeedContainer>
      {displayItems.map((item) => (
        <FeedItem
          key={item.id}
          $clickable={!!onItemClick}
          onClick={() => onItemClick?.(item)}
        >
          <ItemIcon $type={item.type}>{getIcon(item.type)}</ItemIcon>
          <ItemContent>
            <ItemTitle>{item.title}</ItemTitle>
            {item.detail && <ItemDetail>{item.detail}</ItemDetail>}
          </ItemContent>
          <TimeAgo timestamp={item.timestamp} />
        </FeedItem>
      ))}
    </FeedContainer>
  );
};
