import type { FC } from 'react';
import { TabsContainer, TabButton, TabCount, TabBadge, type TabBadgeVariant } from './Tabs.styles';

// Types
export interface TabBadgeConfig {
  variant: TabBadgeVariant;
  count: number;
}

export interface Tab {
  id: string;
  label: string;
  count?: number;
  badge?: TabBadgeConfig;
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
          {tab.badge && <TabBadge $variant={tab.badge.variant}>{tab.badge.count}</TabBadge>}
        </TabButton>
      ))}
    </TabsContainer>
  );
};
