import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';

import { ChevronDown, Check, Folder, FolderOpen } from 'lucide-react';

import { Badge } from '@ui/core/Badge';
import { Label } from '@ui/core/Label';
import { Text } from '@ui/core/Text';

import {
  WorkflowSelectorContainer,
  WorkflowSelectBox,
  WorkflowInfo,
  DropdownIcon,
  WorkflowDropdown,
  WorkflowOption,
  WorkflowIcon,
} from './WorkflowSelector.styles';

// Types
export interface Workflow {
  id: string | null; // null = "Unassigned"
  name: string;
  agentCount: number;
}

export interface WorkflowSelectorProps {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  onSelect: (workflow: Workflow) => void;
  label?: string;
  collapsed?: boolean;
}

// Component
export const WorkflowSelector: FC<WorkflowSelectorProps> = ({
  workflows,
  selectedWorkflow,
  onSelect,
  label = 'Agent',
  collapsed = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Display workflow defaults to first workflow if none selected
  const displayWorkflow = selectedWorkflow ?? workflows[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (workflow: Workflow) => {
    onSelect(workflow);
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

  const isSelected = (workflow: Workflow) => {
    return selectedWorkflow?.id === workflow.id;
  };

  // Don't render if no workflows
  if (workflows.length === 0) {
    return null;
  }

  if (collapsed) {
    return (
      <WorkflowSelectorContainer ref={containerRef} $collapsed>
        <WorkflowIcon title={displayWorkflow?.name ?? 'Agent'}>
          <Folder size={20} />
        </WorkflowIcon>
      </WorkflowSelectorContainer>
    );
  }

  return (
    <WorkflowSelectorContainer ref={containerRef} $collapsed={false}>
      <Label size="xs" uppercase>
        {label}
      </Label>
      <WorkflowSelectBox
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <WorkflowIcon>
          {isOpen ? <FolderOpen size={18} /> : <Folder size={18} />}
        </WorkflowIcon>
        <WorkflowInfo>
          <Text size="sm" truncate>
            {displayWorkflow?.name ?? 'Select agent'}
          </Text>
        </WorkflowInfo>
        <Badge variant="info" size="sm">
          {displayWorkflow?.agentCount ?? 0}
        </Badge>
        <DropdownIcon $open={isOpen}>
          <ChevronDown size={16} />
        </DropdownIcon>
      </WorkflowSelectBox>

      {isOpen && (
        <WorkflowDropdown role="listbox">
          {workflows.map((workflow) => (
            <WorkflowOption
              key={workflow.id ?? 'unassigned'}
              onClick={() => handleSelect(workflow)}
              role="option"
              aria-selected={isSelected(workflow)}
              $selected={isSelected(workflow)}
              $isAll={false}
            >
              <WorkflowIcon $small>
                <Folder size={14} />
              </WorkflowIcon>
              <Text size="sm" truncate>
                {workflow.name}
              </Text>
              <Badge variant={workflow.id === null ? 'medium' : 'info'} size="sm">
                {workflow.agentCount}
              </Badge>
              {isSelected(workflow) && <Check size={14} />}
            </WorkflowOption>
          ))}
        </WorkflowDropdown>
      )}
    </WorkflowSelectorContainer>
  );
};
