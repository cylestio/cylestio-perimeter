import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';

import { ChevronDown, Check, Folder, FolderOpen } from 'lucide-react';

import { Badge } from '@ui/core/Badge';
import { Label } from '@ui/core/Label';
import { Text } from '@ui/core/Text';

import {
  AgentWorkflowSelectorContainer,
  AgentWorkflowSelectBox,
  AgentWorkflowInfo,
  DropdownIcon,
  AgentWorkflowDropdown,
  AgentWorkflowOption,
  AgentWorkflowIcon,
} from './AgentWorkflowSelector.styles';

// Types
export interface AgentWorkflow {
  id: string | null; // null = "Unassigned"
  name: string;
  agentCount: number;
}

export interface AgentWorkflowSelectorProps {
  agentWorkflows: AgentWorkflow[];
  selectedAgentWorkflow: AgentWorkflow | null;
  onSelect: (agentWorkflow: AgentWorkflow) => void;
  label?: string;
  collapsed?: boolean;
}

// Component
export const AgentWorkflowSelector: FC<AgentWorkflowSelectorProps> = ({
  agentWorkflows,
  selectedAgentWorkflow,
  onSelect,
  label = 'Agent Workflow',
  collapsed = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Display agent workflow defaults to first if none selected
  const displayAgentWorkflow = selectedAgentWorkflow ?? agentWorkflows[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (agentWorkflow: AgentWorkflow) => {
    onSelect(agentWorkflow);
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

  const isSelected = (agentWorkflow: AgentWorkflow) => {
    return selectedAgentWorkflow?.id === agentWorkflow.id;
  };

  // Don't render if no agent workflows
  if (agentWorkflows.length === 0) {
    return null;
  }

  if (collapsed) {
    return (
      <AgentWorkflowSelectorContainer ref={containerRef} $collapsed>
        <AgentWorkflowIcon title={displayAgentWorkflow?.name ?? 'Agent Workflow'}>
          <Folder size={20} />
        </AgentWorkflowIcon>
      </AgentWorkflowSelectorContainer>
    );
  }

  return (
    <AgentWorkflowSelectorContainer ref={containerRef} $collapsed={false}>
      <Label size="xs" uppercase>
        {label}
      </Label>
      <AgentWorkflowSelectBox
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <AgentWorkflowIcon>
          {isOpen ? <FolderOpen size={18} /> : <Folder size={18} />}
        </AgentWorkflowIcon>
        <AgentWorkflowInfo>
          <Text size="sm" truncate>
            {displayAgentWorkflow?.name ?? 'Select agent workflow'}
          </Text>
        </AgentWorkflowInfo>
        <Badge variant="info" size="sm">
          {displayAgentWorkflow?.agentCount ?? 0}
        </Badge>
        <DropdownIcon $open={isOpen}>
          <ChevronDown size={16} />
        </DropdownIcon>
      </AgentWorkflowSelectBox>

      {isOpen && (
        <AgentWorkflowDropdown role="listbox">
          {agentWorkflows.map((agentWorkflow) => (
            <AgentWorkflowOption
              key={agentWorkflow.id ?? 'unassigned'}
              onClick={() => handleSelect(agentWorkflow)}
              role="option"
              aria-selected={isSelected(agentWorkflow)}
              $selected={isSelected(agentWorkflow)}
              $isAll={false}
            >
              <AgentWorkflowIcon $small>
                <Folder size={14} />
              </AgentWorkflowIcon>
              <Text size="sm" truncate>
                {agentWorkflow.name}
              </Text>
              <Badge variant={agentWorkflow.id === null ? 'medium' : 'info'} size="sm">
                {agentWorkflow.agentCount}
              </Badge>
              {isSelected(agentWorkflow) && <Check size={14} />}
            </AgentWorkflowOption>
          ))}
        </AgentWorkflowDropdown>
      )}
    </AgentWorkflowSelectorContainer>
  );
};
