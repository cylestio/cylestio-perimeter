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
  selectedWorkflow: Workflow | null; // null = show all
  onSelect: (workflow: Workflow | null) => void;
  label?: string;
  collapsed?: boolean;
}

// "All Workflows" option
const ALL_WORKFLOWS: Workflow = {
  id: '__all__',
  name: 'All Workflows',
  agentCount: 0,
};

// Component
export const WorkflowSelector: FC<WorkflowSelectorProps> = ({
  workflows,
  selectedWorkflow,
  onSelect,
  label = 'Workflow',
  collapsed = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate total agents for "All Workflows"
  const totalAgents = workflows.reduce((sum, w) => sum + w.agentCount, 0);
  const allWorkflowsOption = { ...ALL_WORKFLOWS, agentCount: totalAgents };

  // Build options list with "All Workflows" first
  const options = [allWorkflowsOption, ...workflows];

  // Determine display workflow (null selection shows "All Workflows")
  const displayWorkflow = selectedWorkflow ?? allWorkflowsOption;

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
    // If "All Workflows" selected, pass null
    onSelect(workflow.id === '__all__' ? null : workflow);
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
    if (workflow.id === '__all__') {
      return selectedWorkflow === null;
    }
    return selectedWorkflow?.id === workflow.id;
  };

  if (collapsed) {
    return (
      <WorkflowSelectorContainer ref={containerRef} $collapsed>
        <WorkflowIcon title={displayWorkflow.name}>
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
            {displayWorkflow.name}
          </Text>
        </WorkflowInfo>
        <Badge variant="info" size="sm">
          {displayWorkflow.agentCount}
        </Badge>
        <DropdownIcon $open={isOpen}>
          <ChevronDown size={16} />
        </DropdownIcon>
      </WorkflowSelectBox>

      {isOpen && (
        <WorkflowDropdown role="listbox">
          {options.map((workflow) => (
            <WorkflowOption
              key={workflow.id ?? 'unassigned'}
              onClick={() => handleSelect(workflow)}
              role="option"
              aria-selected={isSelected(workflow)}
              $selected={isSelected(workflow)}
              $isAll={workflow.id === '__all__'}
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
