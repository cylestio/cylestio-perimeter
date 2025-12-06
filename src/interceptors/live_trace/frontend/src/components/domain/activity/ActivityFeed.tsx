import type { FC, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Activity, Search } from 'lucide-react';
import {
  FeedContainer,
  FeedItem,
  ItemIcon,
  ItemContent,
  ItemTitle,
  ItemDetail,
  ItemTime,
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
const formatTimestamp = (timestamp: Date | string): string => {
  if (typeof timestamp === 'string') return timestamp;

  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

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
          <ItemTime>{formatTimestamp(item.timestamp)}</ItemTime>
        </FeedItem>
      ))}
    </FeedContainer>
  );
};
