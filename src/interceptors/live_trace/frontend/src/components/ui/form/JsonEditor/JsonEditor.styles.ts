import styled from 'styled-components';

export const JsonEditorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const JsonEditorLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  color: ${({ theme }) => theme.colors.white90};
`;

export const JsonEditorContainer = styled.div`
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
  overflow: auto;
  max-height: 400px;

  /* Override json-edit-react default styles for dark theme */
  & > div {
    background: transparent !important;
  }

  /* Force dark theme on all input elements */
  input,
  textarea {
    color: ${({ theme }) => theme.colors.white} !important;
    background-color: ${({ theme }) => theme.colors.surface4} !important;
    border: 1px solid ${({ theme }) => theme.colors.borderStrong} !important;
    border-radius: ${({ theme }) => theme.radii.sm} !important;
    caret-color: ${({ theme }) => theme.colors.cyan} !important;

    &:focus {
      border-color: ${({ theme }) => theme.colors.cyan} !important;
      outline: none !important;
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.cyanSoft} !important;
    }

    &::selection {
      background: ${({ theme }) => theme.colors.cyanSoft} !important;
      color: ${({ theme }) => theme.colors.white} !important;
    }
  }

  /* Ensure buttons and interactive elements are visible */
  button {
    color: ${({ theme }) => theme.colors.white70} !important;
    
    &:hover {
      color: ${({ theme }) => theme.colors.cyan} !important;
    }
  }
`;

export const JsonEditorEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px dashed ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
`;

export const EmptyText = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white50};
`;

export const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  background: ${({ theme }) => theme.colors.surface4};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white90};
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightMedium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.cyan};
    border-color: ${({ theme }) => theme.colors.cyan};
    color: ${({ theme }) => theme.colors.void};
  }
`;

export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const ErrorTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.textSm};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.red};
`;

export const ErrorMessage = styled.div`
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textXs};
  color: ${({ theme }) => theme.colors.red};
  background: ${({ theme }) => theme.colors.redSoft};
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

export const FallbackTextarea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white90};
  font-family: ${({ theme }) => theme.typography.fontMono};
  font-size: ${({ theme }) => theme.typography.textSm};
  line-height: ${({ theme }) => theme.typography.lineHeightRelaxed};
  resize: vertical;
  transition: all ${({ theme }) => theme.transitions.base};

  &:hover:not(:focus) {
    border-color: ${({ theme }) => theme.colors.white30};
  }

  &:focus {
    outline: none;
    background: ${({ theme }) => theme.colors.surface4};
    border-color: ${({ theme }) => theme.colors.cyan};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.cyanSoft};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.white30};
  }
`;
