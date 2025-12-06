import type { FC, ReactNode } from 'react';
import { StyledFormLabel, RequiredMark, StyledFormError, StyledFormHint } from './FormLabel.styles';

// Types
export interface FormLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export interface FormErrorProps {
  children: ReactNode;
  className?: string;
}

export interface FormHintProps {
  children: ReactNode;
  className?: string;
}

// Components
export const FormLabel: FC<FormLabelProps> = ({ htmlFor, required, children, className }) => {
  return (
    <StyledFormLabel htmlFor={htmlFor} className={className}>
      {children}
      {required && <RequiredMark>*</RequiredMark>}
    </StyledFormLabel>
  );
};

export const FormError: FC<FormErrorProps> = ({ children, className }) => {
  return <StyledFormError className={className}>{children}</StyledFormError>;
};

export const FormHint: FC<FormHintProps> = ({ children, className }) => {
  return <StyledFormHint className={className}>{children}</StyledFormHint>;
};
