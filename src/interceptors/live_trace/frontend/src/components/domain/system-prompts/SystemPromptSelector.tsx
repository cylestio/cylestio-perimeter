import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Avatar } from '@ui/core/Avatar';
import { Label } from '@ui/core/Label';
import { Text } from '@ui/core/Text';
import {
  SystemPromptSelectorContainer,
  SystemPromptSelectBox,
  SystemPromptInfo,
  DropdownIcon,
  SystemPromptDropdown,
  SystemPromptOption,
} from './SystemPromptSelector.styles';

// Types
export type SystemPromptStatus = 'online' | 'offline' | 'error';

export interface SystemPrompt {
  id: string;
  name: string;
  initials: string;
  status: SystemPromptStatus;
}

export interface SystemPromptSelectorProps {
  systemPrompts: SystemPrompt[];
  selectedSystemPrompt: SystemPrompt;
  onSelect: (systemPrompt: SystemPrompt) => void;
  label?: string;
  collapsed?: boolean;
}

// Component
export const SystemPromptSelector: FC<SystemPromptSelectorProps> = ({
  systemPrompts,
  selectedSystemPrompt,
  onSelect,
  label = 'System Prompt',
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

  const handleSelect = (systemPrompt: SystemPrompt) => {
    onSelect(systemPrompt);
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
      <SystemPromptSelectorContainer ref={containerRef} $collapsed>
        <Avatar
          initials={selectedSystemPrompt.initials}
          status={selectedSystemPrompt.status}
          variant="gradient"
          size="md"
          title={selectedSystemPrompt.name}
        />
      </SystemPromptSelectorContainer>
    );
  }

  return (
    <SystemPromptSelectorContainer ref={containerRef} $collapsed={false}>
      <Label size="xs" uppercase>
        {label}
      </Label>
      <SystemPromptSelectBox
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Avatar
          initials={selectedSystemPrompt.initials}
          status={selectedSystemPrompt.status}
          variant="gradient"
          size="md"
        />
        <SystemPromptInfo>
          <Text size="sm" truncate>
            {selectedSystemPrompt.name}
          </Text>
        </SystemPromptInfo>
        <DropdownIcon $open={isOpen}>
          <ChevronDown size={16} />
        </DropdownIcon>
      </SystemPromptSelectBox>

      {isOpen && (
        <SystemPromptDropdown role="listbox">
          {systemPrompts.map((sp) => (
            <SystemPromptOption
              key={sp.id}
              onClick={() => handleSelect(sp)}
              role="option"
              aria-selected={sp.id === selectedSystemPrompt.id}
              $selected={sp.id === selectedSystemPrompt.id}
            >
              <Avatar
                initials={sp.initials}
                status={sp.status}
                variant="gradient"
                size="sm"
              />
              <Text size="sm" truncate>
                {sp.name}
              </Text>
              {sp.id === selectedSystemPrompt.id && <Check size={14} />}
            </SystemPromptOption>
          ))}
        </SystemPromptDropdown>
      )}
    </SystemPromptSelectorContainer>
  );
};
