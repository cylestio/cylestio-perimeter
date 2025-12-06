import type { FC } from 'react';
import { useId, useRef, useEffect } from 'react';
import { Check, Minus } from 'lucide-react';
import {
  CheckboxWrapper,
  HiddenCheckbox,
  StyledCheckbox,
  CheckboxLabel,
} from './Checkbox.styles';

// Types
export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
}

// Component
export const Checkbox: FC<CheckboxProps> = ({
  checked = false,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
  className,
}) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = () => {
    if (!disabled) {
      onChange?.(!checked);
    }
  };

  return (
    <CheckboxWrapper data-disabled={disabled} className={className}>
      <HiddenCheckbox
        ref={inputRef}
        id={id}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <StyledCheckbox $checked={checked} $indeterminate={indeterminate} $disabled={disabled}>
        {indeterminate ? <Minus /> : <Check />}
      </StyledCheckbox>
      {label && <CheckboxLabel>{label}</CheckboxLabel>}
    </CheckboxWrapper>
  );
};
