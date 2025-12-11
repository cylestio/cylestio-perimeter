import type { FC, ReactNode } from 'react';
import { useState, useRef, useEffect, useId } from 'react';

import { ChevronDown } from 'lucide-react';

import { FormLabel, FormError } from '../FormLabel';

import {
  Wrapper,
  Trigger,
  TriggerValue,
  Placeholder,
  ChevronIcon,
  Menu,
  Option,
  OptionContent,
  NoOptions,
} from './RichSelect.styles';

// Types
export interface RichSelectOption<T = unknown> {
  value: string;
  label: string;
  data?: T;
  disabled?: boolean;
}

export interface RichSelectProps<T = unknown> {
  options: RichSelectOption<T>[];
  value?: string;
  onChange?: (value: string, option: RichSelectOption<T>) => void;
  renderOption?: (option: RichSelectOption<T>, isSelected: boolean) => ReactNode;
  renderValue?: (option: RichSelectOption<T>) => ReactNode;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

// Component
export const RichSelect = <T,>({
  options,
  value,
  onChange,
  renderOption,
  renderValue,
  label,
  placeholder = 'Select...',
  error,
  disabled = false,
  fullWidth = false,
  className,
}: RichSelectProps<T>): ReturnType<FC> => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();

  const selectedOption = options.find((opt) => opt.value === value);
  const actionableOptions = options.filter((opt) => !opt.disabled);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset focus index when closed
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && menuRef.current) {
      const focusedElement = menuRef.current.querySelector(
        `[data-index="${focusedIndex}"]`
      );
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  const handleTriggerClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen && selectedOption) {
      // Focus the selected option when opening
      const selectedIndex = actionableOptions.findIndex(
        (opt) => opt.value === selectedOption.value
      );
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        if (selectedOption) {
          const selectedIndex = actionableOptions.findIndex(
            (opt) => opt.value === selectedOption.value
          );
          setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        } else {
          setFocusedIndex(0);
        }
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
          prev < actionableOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : actionableOptions.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          const option = actionableOptions[focusedIndex];
          onChange?.(option.value, option);
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleOptionClick = (option: RichSelectOption<T>) => {
    if (option.disabled) return;
    onChange?.(option.value, option);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const renderTriggerValue = () => {
    if (!selectedOption) {
      return <Placeholder>{placeholder}</Placeholder>;
    }

    if (renderValue) {
      return <TriggerValue>{renderValue(selectedOption)}</TriggerValue>;
    }

    return <TriggerValue>{selectedOption.label}</TriggerValue>;
  };

  const renderOptionContent = (option: RichSelectOption<T>, isSelected: boolean) => {
    if (renderOption) {
      return renderOption(option, isSelected);
    }
    return <OptionContent>{option.label}</OptionContent>;
  };

  return (
    <Wrapper ref={wrapperRef} $fullWidth={fullWidth} className={className}>
      {label && <FormLabel htmlFor={generatedId}>{label}</FormLabel>}
      <Trigger
        ref={triggerRef}
        id={generatedId}
        type="button"
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        $hasError={!!error}
        $disabled={disabled}
        $isOpen={isOpen}
      >
        {renderTriggerValue()}
        <ChevronIcon $isOpen={isOpen}>
          <ChevronDown />
        </ChevronIcon>
      </Trigger>

      {isOpen && (
        <Menu ref={menuRef} role="listbox" onKeyDown={handleKeyDown}>
          {options.length === 0 ? (
            <NoOptions>No options available</NoOptions>
          ) : (
            options.map((option) => {
              const actionableIndex = actionableOptions.indexOf(option);
              const isSelected = option.value === value;
              const isFocused = actionableIndex === focusedIndex;

              return (
                <Option
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  data-index={actionableIndex}
                  $focused={isFocused}
                  $selected={isSelected}
                  $disabled={option.disabled}
                  onClick={() => handleOptionClick(option)}
                  tabIndex={isFocused ? 0 : -1}
                >
                  {renderOptionContent(option, isSelected)}
                </Option>
              );
            })
          )}
        </Menu>
      )}

      {error && <FormError>{error}</FormError>}
    </Wrapper>
  );
};

