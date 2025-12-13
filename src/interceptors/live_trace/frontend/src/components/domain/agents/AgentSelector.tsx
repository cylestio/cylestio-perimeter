import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';

import { ChevronDown, Check, Folder, FolderOpen } from 'lucide-react';

import { Badge } from '@ui/core/Badge';
import { Label } from '@ui/core/Label';
import { Text } from '@ui/core/Text';

import {
  AgentSelectorContainer,
  AgentSelectBox,
  AgentInfo,
  DropdownIcon,
  AgentDropdown,
  AgentOption,
  AgentIcon,
} from './AgentSelector.styles';

// Types
export interface Agent {
  id: string | null; // null = "Unassigned"
  name: string;
  agentCount: number;
}

export interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelect: (agent: Agent) => void;
  label?: string;
  collapsed?: boolean;
}

// Component
export const AgentSelector: FC<AgentSelectorProps> = ({
  agents,
  selectedAgent,
  onSelect,
  label = 'Agent',
  collapsed = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Display agent defaults to first agent if none selected
  const displayAgent = selectedAgent ?? agents[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (agent: Agent) => {
    onSelect(agent);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isSelected = (agent: Agent) => {
    return selectedAgent?.id === agent.id;
  };

  // Don't render if no agents
  if (agents.length === 0) {
    return null;
  }

  if (collapsed) {
    return (
      <AgentSelectorContainer ref={containerRef} $collapsed>
        <AgentIcon title={displayAgent?.name ?? 'Agent'}>
          <Folder size={20} />
        </AgentIcon>
      </AgentSelectorContainer>
    );
  }

  return (
    <AgentSelectorContainer ref={containerRef} $collapsed={false}>
      <Label size="xs" uppercase>
        {label}
      </Label>
      <AgentSelectBox
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <AgentIcon>
          {isOpen ? <FolderOpen size={18} /> : <Folder size={18} />}
        </AgentIcon>
        <AgentInfo>
          <Text size="sm" truncate>
            {displayAgent?.name ?? 'Select agent'}
          </Text>
        </AgentInfo>
        <Badge variant="info" size="sm">
          {displayAgent?.agentCount ?? 0}
        </Badge>
        <DropdownIcon $open={isOpen}>
          <ChevronDown size={16} />
        </DropdownIcon>
      </AgentSelectBox>

      {isOpen && (
        <AgentDropdown role="listbox">
          {agents.map((agent) => (
            <AgentOption
              key={agent.id ?? 'unassigned'}
              onClick={() => handleSelect(agent)}
              role="option"
              aria-selected={isSelected(agent)}
              $selected={isSelected(agent)}
              $isAll={false}
            >
              <AgentIcon $small>
                <Folder size={14} />
              </AgentIcon>
              <Text size="sm" truncate>
                {agent.name}
              </Text>
              <Badge variant={agent.id === null ? 'medium' : 'info'} size="sm">
                {agent.agentCount}
              </Badge>
              {isSelected(agent) && <Check size={14} />}
            </AgentOption>
          ))}
        </AgentDropdown>
      )}
    </AgentSelectorContainer>
  );
};
