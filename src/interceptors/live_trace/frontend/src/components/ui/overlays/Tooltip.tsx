import type { FC, ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  TooltipContainer,
  TooltipContent,
  TooltipArrow,
  TooltipTrigger,
} from './Tooltip.styles';

// Types
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  content: ReactNode;
  position?: TooltipPosition;
  delay?: number;
  children: ReactNode;
}

// Component
export const Tooltip: FC<TooltipProps> = ({
  content,
  position = 'top',
  delay = 200,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = rect.left + scrollX + rect.width / 2;
        y = rect.top + scrollY - 8;
        break;
      case 'bottom':
        x = rect.left + scrollX + rect.width / 2;
        y = rect.bottom + scrollY + 8;
        break;
      case 'left':
        x = rect.left + scrollX - 8;
        y = rect.top + scrollY + rect.height / 2;
        break;
      case 'right':
        x = rect.right + scrollX + 8;
        y = rect.top + scrollY + rect.height / 2;
        break;
    }

    setCoords({ x, y });
  };

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <TooltipTrigger
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-describedby={isVisible ? 'tooltip' : undefined}
      >
        {children}
      </TooltipTrigger>
      {isVisible &&
        createPortal(
          <TooltipContainer
            id="tooltip"
            role="tooltip"
            $position={position}
            $x={coords.x}
            $y={coords.y}
          >
            <TooltipContent>
              {content}
              <TooltipArrow $position={position} />
            </TooltipContent>
          </TooltipContainer>,
          document.body
        )}
    </>
  );
};
