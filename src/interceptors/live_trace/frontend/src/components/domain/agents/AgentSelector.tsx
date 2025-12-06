import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Avatar } from '@ui/core/Avatar';
import { Label } from '@ui/core/Label';
import { Text } from '@ui/core/Text';
import {
  AgentSelectorContainer,
  AgentSelectBox,
  AgentInfo,
  DropdownIcon,
  AgentDropdown,
  AgentOption,
} from './AgentSelector.styles';

// Types
export type AgentStatus = 'online' | 'offline' | 'error';

export interface Agent {
  id: string;
  name: string;
  initials: string;
  status: AgentStatus;
}

export interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent;
  onSelect: (agent: Agent) => void;
  label?: string;
  collapsed?: boolean;
}

// Component
export const AgentSelector: FC<AgentSelectorProps> = ({
  agents,
  selectedAgent,
  onSelect,
  label = 'Active Agent',
  collapsed = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (collapsed) {
    return (
      <AgentSelectorContainer ref={containerRef} $collapsed>
        <Avatar
          initials={selectedAgent.initials}
          status={selectedAgent.status}
          variant="gradient"
          size="md"
          title={selectedAgent.name}
        />
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
        <Avatar
          initials={selectedAgent.initials}
          status={selectedAgent.status}
          variant="gradient"
          size="md"
        />
        <AgentInfo>
          <Text size="sm" truncate>
            {selectedAgent.name}
          </Text>
        </AgentInfo>
        <DropdownIcon $open={isOpen}>
          <ChevronDown size={16} />
        </DropdownIcon>
      </AgentSelectBox>

      {isOpen && (
        <AgentDropdown role="listbox">
          {agents.map((agent) => (
            <AgentOption
              key={agent.id}
              onClick={() => handleSelect(agent)}
              role="option"
              aria-selected={agent.id === selectedAgent.id}
              $selected={agent.id === selectedAgent.id}
            >
              <Avatar
                initials={agent.initials}
                status={agent.status}
                variant="gradient"
                size="sm"
              />
              <Text size="sm" truncate>
                {agent.name}
              </Text>
              {agent.id === selectedAgent.id && <Check size={14} />}
            </AgentOption>
          ))}
        </AgentDropdown>
      )}
    </AgentSelectorContainer>
  );
};
