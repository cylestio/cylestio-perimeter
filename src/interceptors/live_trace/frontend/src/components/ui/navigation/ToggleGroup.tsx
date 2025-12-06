import type { FC } from 'react';
import { ToggleGroupContainer, ToggleButton } from './ToggleGroup.styles';

// Types
export interface ToggleOption {
  id: string;
  label: string;
  active?: boolean;
}

export interface ToggleGroupProps {
  options: ToggleOption[];
  onChange: (optionId: string) => void;
  multiSelect?: boolean;
  className?: string;
}

// Component
export const ToggleGroup: FC<ToggleGroupProps> = ({
  options,
  onChange,
  className,
}) => {
  return (
    <ToggleGroupContainer className={className}>
      {options.map((option) => (
        <ToggleButton
          key={option.id}
          $active={option.active}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleGroupContainer>
  );
};
