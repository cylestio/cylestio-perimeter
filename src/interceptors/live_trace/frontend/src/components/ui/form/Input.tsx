import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { InputWrapper, InputContainer, StyledInput, IconWrapper } from './Input.styles';
import { FormLabel, FormError, FormHint } from './FormLabel';

// Types
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  mono?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Component
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      mono = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <InputWrapper $fullWidth={fullWidth} className={className}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <InputContainer
          $hasError={!!error}
          $disabled={props.disabled}
          $hasLeftIcon={!!icon && iconPosition === 'left'}
          $hasRightIcon={!!icon && iconPosition === 'right'}
        >
          {icon && iconPosition === 'left' && <IconWrapper $position="left">{icon}</IconWrapper>}
          <StyledInput
            ref={ref}
            id={inputId}
            $hasError={!!error}
            $mono={mono}
            required={required}
            {...props}
          />
          {icon && iconPosition === 'right' && <IconWrapper $position="right">{icon}</IconWrapper>}
        </InputContainer>
        {error && <FormError>{error}</FormError>}
        {hint && !error && <FormHint>{hint}</FormHint>}
      </InputWrapper>
    );
  }
);

Input.displayName = 'Input';
