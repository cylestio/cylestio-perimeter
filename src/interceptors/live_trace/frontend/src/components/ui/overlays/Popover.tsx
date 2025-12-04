import type { FC, ReactNode } from 'react';
import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  PopoverContainer,
  PopoverContent,
  PopoverArrow,
  PopoverTrigger,
} from './Popover.styles';

// Types
export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  content: ReactNode;
  position?: PopoverPosition;
  align?: PopoverAlign;
}

// Component
export const Popover: FC<PopoverProps> = ({
  open,
  onOpenChange,
  trigger,
  content,
  position = 'bottom',
  align = 'center',
}) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  const getPopoverPosition = () => {
    if (!triggerRef.current) return { x: 0, y: 0 };

    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        y = rect.top + scrollY - 8;
        break;
      case 'bottom':
        y = rect.bottom + scrollY + 8;
        break;
      case 'left':
        x = rect.left + scrollX - 8;
        break;
      case 'right':
        x = rect.right + scrollX + 8;
        break;
    }

    switch (align) {
      case 'start':
        if (position === 'top' || position === 'bottom') {
          x = rect.left + scrollX;
        } else {
          y = rect.top + scrollY;
        }
        break;
      case 'center':
        if (position === 'top' || position === 'bottom') {
          x = rect.left + scrollX + rect.width / 2;
        } else {
          y = rect.top + scrollY + rect.height / 2;
        }
        break;
      case 'end':
        if (position === 'top' || position === 'bottom') {
          x = rect.right + scrollX;
        } else {
          y = rect.bottom + scrollY;
        }
        break;
    }

    return { x, y };
  };

  const coords = getPopoverPosition();

  return (
    <>
      <PopoverTrigger
        ref={triggerRef}
        onClick={() => onOpenChange(!open)}
        aria-haspopup={true}
        aria-expanded={open}
        role="button"
        tabIndex={0}
      >
        {trigger}
      </PopoverTrigger>
      {open &&
        createPortal(
          <PopoverContainer
            ref={popoverRef}
            $position={position}
            $align={align}
            $x={coords.x}
            $y={coords.y}
          >
            <PopoverContent>
              {content}
              <PopoverArrow $position={position} />
            </PopoverContent>
          </PopoverContainer>,
          document.body
        )}
    </>
  );
};
