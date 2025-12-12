import type { FC, ReactNode } from 'react';

import {
  StyledKeyValueList,
  KeyValueItem,
  KeyLabel,
  KeyValue,
} from './KeyValueList.styles';

// Types
export interface KeyValuePair {
  key: string;
  value: ReactNode;
  mono?: boolean;  // Use monospace font for value
}

export interface KeyValueListProps {
  items: KeyValuePair[];
  size?: 'sm' | 'md';
  className?: string;
}

// Component
export const KeyValueList: FC<KeyValueListProps> = ({
  items,
  size = 'md',
  className,
}) => {
  return (
    <StyledKeyValueList className={className}>
      {items.map((item, index) => (
        <KeyValueItem key={index}>
          <KeyLabel $size={size}>{item.key}</KeyLabel>
          <KeyValue $size={size} $mono={item.mono}>
            {item.value}
          </KeyValue>
        </KeyValueItem>
      ))}
    </StyledKeyValueList>
  );
};

