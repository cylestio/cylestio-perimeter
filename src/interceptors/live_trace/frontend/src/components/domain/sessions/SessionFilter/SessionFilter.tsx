import type { FC, KeyboardEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChevronDown } from 'lucide-react';

import {
  ChevronIcon,
  Container,
  Dropdown,
  NoOptions,
  Option,
  OptionCount,
  OptionValue,
  Trigger,
  TriggerText,
} from './SessionFilter.styles';

export interface SessionOption {
  value: string;
  count: number;
}

export interface SessionFilterProps {
  /** Currently selected value (null = "All sessions") */
  value: string | null;
  /** Called when selection changes */
  onChange: (value: string | null) => void;
  /** Available options to select from */
  options: SessionOption[];
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Optional className */
  className?: string;
}

export const SessionFilter: FC<SessionFilterProps> = ({
  value,
  onChange,
  options,
  placeholder = 'All sessions',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate total count for "All sessions" option
  const totalCount = useMemo(
    () => options.reduce((sum, opt) => sum + opt.count, 0),
    [options]
  );

  // All options including "All sessions" (null = clear selection)
  const allOptions = useMemo(
    () => [{ value: null as string | null, count: totalCount }, ...options.map(o => ({ value: o.value as string | null, count: o.count }))],
    [options, totalCount]
  );

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && dropdownRef.current) {
      const optionElements = dropdownRef.current.querySelectorAll('[role="option"]');
      const focusedOption = optionElements[focusedIndex] as HTMLElement;
      if (focusedOption) {
        focusedOption.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const handleSelect = useCallback(
    (selectedValue: string | null) => {
      onChange(selectedValue);
      setIsOpen(false);
      setFocusedIndex(-1);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const handleTriggerClick = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      // Set focus to current selection when opening
      const currentIndex = allOptions.findIndex((opt) => opt.value === value);
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, allOptions, value]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(0);
          } else {
            setFocusedIndex((prev) =>
              prev < allOptions.length - 1 ? prev + 1 : prev
            );
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          }
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (isOpen && focusedIndex >= 0) {
            handleSelect(allOptions[focusedIndex].value);
          } else {
            setIsOpen(true);
            setFocusedIndex(0);
          }
          break;

        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;

        case 'Tab':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    },
    [isOpen, focusedIndex, allOptions, handleSelect]
  );

  const getDisplayText = () => {
    if (value === null) {
      return placeholder;
    }
    return value;
  };

  return (
    <Container ref={containerRef} className={className}>
      <Trigger
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        $isOpen={isOpen}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <TriggerText $isPlaceholder={value === null}>
          {getDisplayText()}
        </TriggerText>
        <ChevronIcon $isOpen={isOpen}>
          <ChevronDown />
        </ChevronIcon>
      </Trigger>

      {isOpen && (
        <Dropdown ref={dropdownRef} role="listbox">
          {allOptions.length > 0 ? (
            allOptions.map((option, index) => (
              <Option
                key={option.value ?? '__all__'}
                role="option"
                aria-selected={value === option.value}
                $focused={focusedIndex === index}
                $selected={value === option.value}
                onClick={() => handleSelect(option.value)}
              >
                <OptionValue>
                  {option.value ?? placeholder}
                </OptionValue>
                <OptionCount>({option.count})</OptionCount>
              </Option>
            ))
          ) : (
            <NoOptions>No sessions available</NoOptions>
          )}
        </Dropdown>
      )}
    </Container>
  );
};
