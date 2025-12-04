import type { FC, ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  DropdownContainer,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  ItemIcon,
} from './Dropdown.styles';

// Types
export interface DropdownItemData {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItemData[];
  align?: 'left' | 'right';
  width?: number | 'trigger';
}

// Component
export const Dropdown: FC<DropdownProps> = ({
  trigger,
  items,
  align = 'left',
  width,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const actionableItems = items.filter((item) => !item.divider && !item.disabled);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < actionableItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : actionableItems.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          const item = actionableItems[focusedIndex];
          item.onClick?.();
          setIsOpen(false);
        }
        break;
    }
  };

  const handleItemClick = (item: DropdownItemData) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  const menuWidth =
    width === 'trigger' && triggerRef.current
      ? triggerRef.current.offsetWidth
      : width;

  return (
    <DropdownContainer ref={containerRef}>
      <DropdownTrigger
        ref={triggerRef}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        role="button"
        tabIndex={0}
      >
        {trigger}
      </DropdownTrigger>
      {isOpen && (
        <DropdownMenu
          role="menu"
          $align={align}
          $width={typeof menuWidth === 'number' ? menuWidth : undefined}
          onKeyDown={handleKeyDown}
        >
          {items.map((item) => {
            if (item.divider) {
              return <DropdownDivider key={item.id} />;
            }

            const actionIndex = actionableItems.indexOf(item);

            return (
              <DropdownItem
                key={item.id}
                role="menuitem"
                $danger={item.danger}
                $disabled={item.disabled}
                $focused={actionIndex === focusedIndex}
                onClick={() => handleItemClick(item)}
                tabIndex={actionIndex === focusedIndex ? 0 : -1}
              >
                {item.icon && <ItemIcon>{item.icon}</ItemIcon>}
                {item.label}
              </DropdownItem>
            );
          })}
        </DropdownMenu>
      )}
    </DropdownContainer>
  );
};
