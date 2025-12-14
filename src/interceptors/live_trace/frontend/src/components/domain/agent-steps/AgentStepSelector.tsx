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
} from './AgentStepSelector.styles';

// Types
export type AgentStepStatus = 'online' | 'offline' | 'error';

export interface AgentStep {
  id: string;
  name: string;
  initials: string;
  status: AgentStepStatus;
}

export interface AgentStepSelectorProps {
  agentSteps: AgentStep[];
  selectedAgentStep: AgentStep;
  onSelect: (agentStep: AgentStep) => void;
  label?: string;
  collapsed?: boolean;
}

// Component
export const AgentStepSelector: FC<AgentStepSelectorProps> = ({
  agentSteps,
  selectedAgentStep,
  onSelect,
  label = 'Active Agent Step',
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

  const handleSelect = (agentStep: AgentStep) => {
    onSelect(agentStep);
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
          initials={selectedAgentStep.initials}
          status={selectedAgentStep.status}
          variant="gradient"
          size="md"
          title={selectedAgentStep.name}
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
          initials={selectedAgentStep.initials}
          status={selectedAgentStep.status}
          variant="gradient"
          size="md"
        />
        <AgentInfo>
          <Text size="sm" truncate>
            {selectedAgentStep.name}
          </Text>
        </AgentInfo>
        <DropdownIcon $open={isOpen}>
          <ChevronDown size={16} />
        </DropdownIcon>
      </AgentSelectBox>

      {isOpen && (
        <AgentDropdown role="listbox">
          {agentSteps.map((agentStep) => (
            <AgentOption
              key={agentStep.id}
              onClick={() => handleSelect(agentStep)}
              role="option"
              aria-selected={agentStep.id === selectedAgentStep.id}
              $selected={agentStep.id === selectedAgentStep.id}
            >
              <Avatar
                initials={agentStep.initials}
                status={agentStep.status}
                variant="gradient"
                size="sm"
              />
              <Text size="sm" truncate>
                {agentStep.name}
              </Text>
              {agentStep.id === selectedAgentStep.id && <Check size={14} />}
            </AgentOption>
          ))}
        </AgentDropdown>
      )}
    </AgentSelectorContainer>
  );
};
