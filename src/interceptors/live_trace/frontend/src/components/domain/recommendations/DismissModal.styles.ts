import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

export const ModalContainer = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  overflow: hidden;
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[5]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const ModalIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.orangeSoft};
  color: ${({ theme }) => theme.colors.orange};
`;

export const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.white};
  margin: 0;
`;

export const ModalSubtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white50};
  margin: ${({ theme }) => theme.spacing[1]} 0 0;
`;

export const ModalContent = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
`;

export const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[5]};
`;

export const RadioOption = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  background: ${({ $selected, theme }) => 
    $selected ? theme.colors.surface2 : 'transparent'};
  border: 1px solid ${({ $selected, theme }) => 
    $selected ? theme.colors.cyan : theme.colors.borderSubtle};
  border-radius: ${({ theme }) => theme.radii.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface2};
  }
`;

export const RadioInput = styled.input`
  width: 18px;
  height: 18px;
  margin: 0;
  margin-top: 2px;
  accent-color: ${({ theme }) => theme.colors.cyan};
  cursor: pointer;
`;

export const RadioContent = styled.div`
  flex: 1;
`;

export const RadioTitle = styled.span`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

export const RadioDescription = styled.span`
  display: block;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.white50};
`;

export const TextAreaLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.white70};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

export const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: inherit;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.white};
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.white30};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.cyan};
  }
`;

export const RequiredNote = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white50};
  margin: ${({ theme }) => theme.spacing[2]} 0 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
`;

export const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[5]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface2};
`;

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[5]}`};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: ${theme.colors.cyan};
          border: none;
          color: ${theme.colors.void};
          
          &:hover:not(:disabled) {
            opacity: 0.9;
          }
        `;
      case 'danger':
        return `
          background: ${theme.colors.red};
          border: none;
          color: ${theme.colors.white};
          
          &:hover:not(:disabled) {
            opacity: 0.9;
          }
        `;
      default:
        return `
          background: transparent;
          border: 1px solid ${theme.colors.borderSubtle};
          color: ${theme.colors.white70};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.surface2};
            color: ${theme.colors.white};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
