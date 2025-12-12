import { useMemo } from 'react';
import type { FC } from 'react';

import { Filter } from 'lucide-react';

import { ToggleGroup } from '@ui/navigation/ToggleGroup';
import type { ToggleOption } from '@ui/navigation/ToggleGroup';

import {
  FilterBar,
  FilterLabel,
  FilterDivider,
  ToggleWrapper,
} from './SystemPromptFilter.styles';

// Types
export interface SystemPromptOption {
  id: string;
  id_short: string;
  sessionCount: number;
}

export interface SystemPromptFilterProps {
  /** List of system prompts with session counts */
  systemPrompts: SystemPromptOption[];
  /** Currently selected system prompt ID, or null for "All" */
  selectedId: string | null;
  /** Callback when selection changes */
  onSelect: (id: string | null) => void;
  /** Optional className for styling */
  className?: string;
}

// Component
export const SystemPromptFilter: FC<SystemPromptFilterProps> = ({
  systemPrompts,
  selectedId,
  onSelect,
  className,
}) => {
  // Build toggle options from system prompts
  const options: ToggleOption[] = useMemo(() => {
    const totalSessions = systemPrompts.reduce((sum, sp) => sum + sp.sessionCount, 0);

    const toggleOptions: ToggleOption[] = [
      {
        id: 'ALL',
        label: `All (${totalSessions})`,
        active: selectedId === null,
      },
    ];

    // Add an option for each system prompt
    systemPrompts.forEach((sp) => {
      toggleOptions.push({
        id: sp.id,
        label: `${sp.id} (${sp.sessionCount})`,
        active: selectedId === sp.id,
      });
    });

    return toggleOptions;
  }, [systemPrompts, selectedId]);

  const handleChange = (optionId: string) => {
    if (optionId === 'ALL') {
      onSelect(null);
    } else {
      onSelect(optionId);
    }
  };

  // Don't render if there's only one or no system prompts
  if (systemPrompts.length <= 1) {
    return null;
  }

  return (
    <FilterBar className={className}>
      <FilterLabel>
        <Filter />
        System Prompt
      </FilterLabel>
      <FilterDivider />
      <ToggleWrapper>
        <ToggleGroup options={options} onChange={handleChange} />
      </ToggleWrapper>
    </FilterBar>
  );
};
