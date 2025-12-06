import type { FC } from 'react';
import { useId } from 'react';
import {
  RadioWrapper,
  HiddenRadio,
  StyledRadio,
  RadioLabel,
  RadioGroupWrapper,
} from './Radio.styles';

// Types
export interface RadioProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
  className?: string;
}

export interface RadioGroupProps {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

// Components
export const Radio: FC<RadioProps> = ({
  checked = false,
  onChange,
  label,
  disabled = false,
  name,
  value,
  className,
}) => {
  const id = useId();

  const handleChange = () => {
    if (!disabled) {
      onChange?.(!checked);
    }
  };

  return (
    <RadioWrapper data-disabled={disabled} className={className}>
      <HiddenRadio
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <StyledRadio $checked={checked} $disabled={disabled} />
      {label && <RadioLabel>{label}</RadioLabel>}
    </RadioWrapper>
  );
};

export const RadioGroup: FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  direction = 'vertical',
  className,
}) => {
  return (
    <RadioGroupWrapper $direction={direction} className={className}>
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          label={option.label}
          checked={value === option.value}
          onChange={() => onChange?.(option.value)}
        />
      ))}
    </RadioGroupWrapper>
  );
};
