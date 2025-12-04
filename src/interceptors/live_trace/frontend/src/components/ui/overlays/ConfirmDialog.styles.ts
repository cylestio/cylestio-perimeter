import styled, { css } from 'styled-components';
import type { ConfirmDialogVariant } from './ConfirmDialog';

export const DialogContent = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[4]} 0;
`;

interface DialogIconProps {
  $variant: ConfirmDialogVariant;
}

export const DialogIcon = styled.div<DialogIconProps>`
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radii.lg};
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'danger':
        return css`
          background: ${theme.colors.redSoft};
          color: ${theme.colors.red};
        `;
      case 'warning':
        return css`
          background: ${theme.colors.orangeSoft};
          color: ${theme.colors.orange};
        `;
      case 'default':
        return css`
          background: ${theme.colors.cyanSoft};
          color: ${theme.colors.cyan};
        `;
    }
  }}
`;

export const DialogText = styled.div`
  flex: 1;
`;

export const DialogTitle = styled.h3`
  font-size: 16px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

export const DialogDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.white50};
  margin: 0;
  line-height: 1.5;
`;

export const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[3]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;
