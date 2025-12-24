import { useEffect, useRef, useCallback, useState, type FC, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { X } from 'lucide-react';

import {
  DrawerOverlay,
  DrawerContainer,
  DrawerHeader,
  DrawerTitle,
  CloseButton,
  DrawerContent,
  DrawerFooter,
} from './Drawer.styles';

// Types
export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface DrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when the drawer should close */
  onClose: () => void;
  /** Drawer title displayed in the header */
  title?: string;
  /** Position of the drawer */
  position?: DrawerPosition;
  /** Size of the drawer */
  size?: DrawerSize;
  /** Whether to show an overlay behind the drawer */
  showOverlay?: boolean;
  /** Whether clicking the overlay closes the drawer */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape closes the drawer */
  closeOnEsc?: boolean;
  /** Drawer content */
  children: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
  /** Additional class name */
  className?: string;
}

// Component
export const Drawer: FC<DrawerProps> = ({
  open,
  onClose,
  title,
  position = 'right',
  size = 'md',
  showOverlay = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  children,
  footer,
  className,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(open);

  // Handle opening and closing animations
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [open, shouldRender]);

  // Focus management and body scroll lock
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Small delay to ensure the drawer is rendered before focusing
      requestAnimationFrame(() => {
        drawerRef.current?.focus();
      });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle Escape key
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

  // Handle click outside
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  if (!shouldRender) return null;

  return createPortal(
    <DrawerOverlay
      onClick={handleOverlayClick}
      $showOverlay={showOverlay}
      $isClosing={isClosing}
      data-testid="drawer-overlay"
    >
      <DrawerContainer
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        $position={position}
        $size={size}
        $isOpen={open}
        tabIndex={-1}
        className={className}
        data-testid="drawer-container"
      >
        {title && (
          <DrawerHeader>
            <DrawerTitle id="drawer-title" data-testid="drawer-title">{title}</DrawerTitle>
            <CloseButton
              onClick={onClose}
              aria-label="Close drawer"
              type="button"
              data-testid="drawer-close-button"
            >
              <X size={20} />
            </CloseButton>
          </DrawerHeader>
        )}
        {!title && (
          <CloseButton
            onClick={onClose}
            aria-label="Close drawer"
            type="button"
            style={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}
            data-testid="drawer-close-button"
          >
            <X size={20} />
          </CloseButton>
        )}
        <DrawerContent>{children}</DrawerContent>
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </DrawerContainer>
    </DrawerOverlay>,
    document.body
  );
};

