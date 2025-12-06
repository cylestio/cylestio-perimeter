import type { FC } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../core/Button';
import {
  DialogContent,
  DialogIcon,
  DialogText,
  DialogTitle,
  DialogDescription,
  DialogActions,
} from './ConfirmDialog.styles';

// Types
export type ConfirmDialogVariant = 'danger' | 'warning' | 'default';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
}

const variantIcons: Record<ConfirmDialogVariant, typeof AlertTriangle> = {
  danger: AlertTriangle,
  warning: AlertCircle,
  default: Info,
};

// Component
export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}) => {
  const Icon = variantIcons[variant];

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <DialogContent>
        <DialogIcon $variant={variant}>
          <Icon size={24} />
        </DialogIcon>
        <DialogText>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogText>
      </DialogContent>
      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={handleConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Modal>
  );
};
