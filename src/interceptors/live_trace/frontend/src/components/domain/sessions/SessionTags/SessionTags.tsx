import type { FC } from 'react';

import { Tag } from 'lucide-react';

import { Badge } from '@ui/core';

import { TagsContainer, TagItem, TagKey, TagValue, EmptyTags } from './SessionTags.styles';

// Types
export interface SessionTagsProps {
  /** Tags object with key-value pairs */
  tags?: Record<string, string>;
  /** Maximum number of tags to display before truncating */
  maxTags?: number;
  /** Whether to show "no tags" message when empty */
  showEmpty?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const SessionTags: FC<SessionTagsProps> = ({
  tags,
  maxTags = 5,
  showEmpty = false,
  className,
}) => {
  // Get tag entries
  const tagEntries = tags ? Object.entries(tags) : [];

  // Check if empty
  if (tagEntries.length === 0) {
    if (showEmpty) {
      return (
        <EmptyTags className={className}>
          <Tag size={12} />
          No tags
        </EmptyTags>
      );
    }
    return null;
  }

  // Limit tags if needed
  const displayedTags = tagEntries.slice(0, maxTags);
  const hiddenCount = tagEntries.length - displayedTags.length;

  return (
    <TagsContainer className={className}>
      {displayedTags.map(([key, value]) => (
        <TagItem key={key}>
          <TagKey>{key}</TagKey>
          <TagValue>{value}</TagValue>
        </TagItem>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="info" size="sm">
          +{hiddenCount} more
        </Badge>
      )}
    </TagsContainer>
  );
};
