import type { FC, ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  ModalTitle,
  CloseButton,
  ModalContent,
  ModalFooter,
} from './Modal.styles';

// Types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}

// Component
export const Modal: FC<ModalProps> = ({
  open,
  onClose,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  children,
  footer,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEsc, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  return createPortal(
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        $size={size}
        tabIndex={-1}
      >
        {title && (
          <ModalHeader>
            <ModalTitle id="modal-title">{title}</ModalTitle>
            <CloseButton
              onClick={onClose}
              aria-label="Close modal"
              type="button"
            >
              <X size={18} />
            </CloseButton>
          </ModalHeader>
        )}
        {!title && (
          <CloseButton
            onClick={onClose}
            aria-label="Close modal"
            type="button"
            style={{ position: 'absolute', top: 16, right: 16 }}
          >
            <X size={18} />
          </CloseButton>
        )}
        <ModalContent>{children}</ModalContent>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContainer>
    </ModalOverlay>,
    document.body
  );
};
