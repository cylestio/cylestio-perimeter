import type { FC } from 'react';
import { TabsContainer, TabButton, TabCount } from './Tabs.styles';

// Types
export interface Tab {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export type TabsVariant = 'default' | 'pills';

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: TabsVariant;
  className?: string;
}

// Component
export const Tabs: FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  className,
}) => {
  return (
    <TabsContainer $variant={variant} className={className}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          $active={activeTab === tab.id}
          $disabled={tab.disabled}
          $variant={variant}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
        >
          {tab.label}
          {tab.count !== undefined && <TabCount>{tab.count}</TabCount>}
        </TabButton>
      ))}
    </TabsContainer>
  );
};
