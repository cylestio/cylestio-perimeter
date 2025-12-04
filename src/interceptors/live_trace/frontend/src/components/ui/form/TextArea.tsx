import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { TextAreaWrapper, StyledTextArea } from './TextArea.styles';
import { FormLabel, FormError, FormHint } from './FormLabel';

// Types
export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  mono?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  fullWidth?: boolean;
}

// Component
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      hint,
      mono = false,
      resize = 'vertical',
      fullWidth = false,
      className,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textAreaId = id || generatedId;

    return (
      <TextAreaWrapper $fullWidth={fullWidth} className={className}>
        {label && (
          <FormLabel htmlFor={textAreaId} required={required}>
            {label}
          </FormLabel>
        )}
        <StyledTextArea
          ref={ref}
          id={textAreaId}
          $hasError={!!error}
          $mono={mono}
          $resize={resize}
          required={required}
          {...props}
        />
        {error && <FormError>{error}</FormError>}
        {hint && !error && <FormHint>{hint}</FormHint>}
      </TextAreaWrapper>
    );
  }
);

TextArea.displayName = 'TextArea';
