import type { FC } from 'react';
import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { SelectWrapper, SelectContainer, StyledSelect, ChevronIcon } from './Select.styles';
import { FormLabel, FormError } from './FormLabel';

// Types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

// Component
export const Select: FC<SelectProps> = ({
  options,
  value,
  onChange,
  label,
  error,
  placeholder,
  disabled = false,
  fullWidth = false,
  className,
}) => {
  const generatedId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <SelectWrapper $fullWidth={fullWidth} className={className}>
      {label && <FormLabel htmlFor={generatedId}>{label}</FormLabel>}
      <SelectContainer>
        <StyledSelect
          id={generatedId}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          $hasError={!!error}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </StyledSelect>
        <ChevronIcon>
          <ChevronDown />
        </ChevronIcon>
      </SelectContainer>
      {error && <FormError>{error}</FormError>}
    </SelectWrapper>
  );
};
