import type { FC, KeyboardEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChevronDown, X } from 'lucide-react';

import { Tooltip } from '@ui/overlays/Tooltip';

import {
  Chip,
  ChipsContainer,
  ChevronIcon,
  ChipKey,
  ChipKeyOnly,
  ChipValue,
  Container,
  Dropdown,
  DropdownSection,
  Input,
  InputWrapper,
  NoOptions,
  Option,
  OptionKey,
  OptionValue,
  RemoveButton,
  SectionLabel,
} from './TagFilter.styles';

export interface TagSuggestion {
  key: string;
  values?: string[];
}

export interface TagFilterProps {
  /** Currently active tag filters (e.g., ["user:alice", "env:prod"]) */
  value: string[];
  /** Called when filters change */
  onChange: (filters: string[]) => void;
  /** Available tag suggestions (for autocomplete) */
  suggestions?: TagSuggestion[];
  /** Placeholder text */
  placeholder?: string;
  /** Optional className */
  className?: string;
}

interface FlatOption {
  type: 'key' | 'value';
  key: string;
  value?: string;
  display: string;
}

export const TagFilter: FC<TagFilterProps> = ({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Filter by tag...',
  className,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse input to detect if user is typing key:value
  const parsedInput = useMemo(() => {
    const colonIndex = inputValue.indexOf(':');
    if (colonIndex === -1) {
      return { key: inputValue.trim(), value: null };
    }
    return {
      key: inputValue.slice(0, colonIndex).trim(),
      value: inputValue.slice(colonIndex + 1).trim(),
    };
  }, [inputValue]);

  // Generate flat list of options based on input
  const filteredOptions = useMemo((): FlatOption[] => {
    const options: FlatOption[] = [];
    const searchLower = inputValue.toLowerCase();

    if (parsedInput.value !== null) {
      // User typed "key:" - show values for that key
      const matchedSuggestion = suggestions.find(
        (s) => s.key.toLowerCase() === parsedInput.key.toLowerCase()
      );
      if (matchedSuggestion?.values) {
        const valueLower = parsedInput.value.toLowerCase();
        matchedSuggestion.values
          .filter((v) => v.toLowerCase().includes(valueLower))
          .forEach((v) => {
            options.push({
              type: 'value',
              key: matchedSuggestion.key,
              value: v,
              display: `${matchedSuggestion.key}:${v}`,
            });
          });
      }
    } else {
      // Show matching keys
      suggestions
        .filter((s) => s.key.toLowerCase().includes(searchLower))
        .forEach((s) => {
          options.push({
            type: 'key',
            key: s.key,
            display: s.key,
          });
        });
    }

    return options;
  }, [inputValue, parsedInput, suggestions]);

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
      const options = dropdownRef.current.querySelectorAll('[role="option"]');
      const focusedOption = options[focusedIndex] as HTMLElement;
      if (focusedOption) {
        focusedOption.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const addFilter = useCallback(
    (filter: string) => {
      const trimmed = filter.trim();
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
      }
      setInputValue('');
      setIsOpen(false);
      setFocusedIndex(-1);
      inputRef.current?.focus();
    },
    [value, onChange]
  );

  const removeFilter = useCallback(
    (filter: string) => {
      onChange(value.filter((f) => f !== filter));
    },
    [value, onChange]
  );

  const handleOptionSelect = useCallback(
    (option: FlatOption) => {
      if (option.type === 'key' && !option.value) {
        // User selected a key - update input to show "key:"
        setInputValue(`${option.key}:`);
        setFocusedIndex(-1);
        inputRef.current?.focus();
      } else {
        // User selected a full key:value
        addFilter(option.display);
      }
    },
    [addFilter]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen && filteredOptions.length > 0) {
            setIsOpen(true);
            setFocusedIndex(0);
          } else if (isOpen) {
            setFocusedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : prev
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
          event.preventDefault();
          if (isOpen && focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            handleOptionSelect(filteredOptions[focusedIndex]);
          }
          // Note: No custom values allowed - only select from suggestions
          break;

        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;

        case 'Backspace':
          if (inputValue === '' && value.length > 0) {
            // Remove last filter when backspacing on empty input
            removeFilter(value[value.length - 1]);
          }
          break;
      }
    },
    [
      isOpen,
      filteredOptions,
      focusedIndex,
      inputValue,
      value,
      handleOptionSelect,
      removeFilter,
    ]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      setIsOpen(true);
      setFocusedIndex(-1);
    },
    []
  );

  const handleInputFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  }, [suggestions.length]);

  // Parse filter into key and value for display
  const parseFilter = (filter: string) => {
    const colonIndex = filter.indexOf(':');
    if (colonIndex === -1) {
      return { key: filter, value: null };
    }
    return {
      key: filter.slice(0, colonIndex),
      value: filter.slice(colonIndex + 1),
    };
  };

  return (
    <Container ref={containerRef} className={className}>
      {value.length > 0 && (
        <ChipsContainer>
          {value.map((filter) => {
            const parsed = parseFilter(filter);
            const isBooleanTag = parsed.value === null || parsed.value === '' || parsed.value === 'true';

            return (
              <Chip key={filter}>
                {isBooleanTag ? (
                  <ChipKeyOnly>{parsed.key}</ChipKeyOnly>
                ) : (
                  <>
                    <ChipKey>{parsed.key}</ChipKey>
                    <Tooltip content={parsed.value}>
                      <ChipValue>{parsed.value}</ChipValue>
                    </Tooltip>
                  </>
                )}
                <RemoveButton
                  type="button"
                  onClick={() => removeFilter(filter)}
                  aria-label={`Remove filter ${filter}`}
                >
                  <X />
                </RemoveButton>
              </Chip>
            );
          })}
        </ChipsContainer>
      )}

      <InputWrapper>
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          $isOpen={isOpen}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        <ChevronIcon $isOpen={isOpen}>
          <ChevronDown />
        </ChevronIcon>

        {isOpen && (
          <Dropdown ref={dropdownRef} role="listbox">
            {filteredOptions.length > 0 ? (
              <>
                {parsedInput.value !== null ? (
                  // Showing values for a specific key
                  <DropdownSection>
                    <SectionLabel>Values for {parsedInput.key}</SectionLabel>
                    {filteredOptions.map((option, index) => (
                      <Option
                        key={option.display}
                        role="option"
                        aria-selected={focusedIndex === index}
                        $focused={focusedIndex === index}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <OptionKey>{option.key}</OptionKey>
                        <OptionValue>{option.value}</OptionValue>
                      </Option>
                    ))}
                  </DropdownSection>
                ) : (
                  // Showing keys
                  <DropdownSection>
                    <SectionLabel>Tag Keys</SectionLabel>
                    {filteredOptions.map((option, index) => (
                      <Option
                        key={option.display}
                        role="option"
                        aria-selected={focusedIndex === index}
                        $focused={focusedIndex === index}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <OptionKey>{option.key}</OptionKey>
                      </Option>
                    ))}
                  </DropdownSection>
                )}
              </>
            ) : inputValue ? (
              <NoOptions>No matching suggestions</NoOptions>
            ) : (
              <NoOptions>Start typing to filter</NoOptions>
            )}
          </Dropdown>
        )}
      </InputWrapper>
    </Container>
  );
};
