import type { FC, ReactNode, ChangeEvent, KeyboardEvent } from 'react';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Breadcrumb } from '@ui/navigation/Breadcrumb';
import type { BreadcrumbItem } from '@ui/navigation/Breadcrumb';
import { Heading } from '@ui/core/Heading';
import {
  StyledTopBar,
  TopBarLeft,
  TopBarRight,
  SearchBoxContainer,
  SearchInput,
  SearchIcon,
  Shortcut,
} from './TopBar.styles';

// Types
export interface SearchConfig {
  placeholder?: string;
  onSearch: (query: string) => void;
  shortcut?: string;
}

export interface TopBarProps {
  /** Breadcrumb items - if only 1 item, displays as title; if 2+, displays as breadcrumb trail */
  breadcrumb?: BreadcrumbItem[];
  actions?: ReactNode;
  search?: SearchConfig;
}

// SearchBox Component
interface SearchBoxProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  shortcut?: string;
}

export const SearchBox: FC<SearchBoxProps> = ({
  placeholder = 'Search...',
  onSearch,
  shortcut = '⌘K',
}) => {
  const [value, setValue] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(value);
    }
  };

  return (
    <SearchBoxContainer>
      <SearchIcon>
        <Search size={14} />
      </SearchIcon>
      <SearchInput
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-label="Search"
      />
      {shortcut && <Shortcut>{shortcut}</Shortcut>}
    </SearchBoxContainer>
  );
};

// TopBar Component
export const TopBar: FC<TopBarProps> = ({ breadcrumb, actions, search }) => {
  // Single item = show as title, multiple items = show as breadcrumb trail
  const showAsTitle = breadcrumb && breadcrumb.length === 1;
  const showAsBreadcrumb = breadcrumb && breadcrumb.length > 1;

  return (
    <StyledTopBar>
      <TopBarLeft>
        {showAsTitle && (
          <Heading level={1} size="xl">{breadcrumb[0].label}</Heading>
        )}
        {showAsBreadcrumb && (
          <Breadcrumb items={breadcrumb} />
        )}
      </TopBarLeft>
      <TopBarRight>
        {search && (
          <SearchBox
            placeholder={search.placeholder}
            onSearch={search.onSearch}
            shortcut={search.shortcut}
          />
        )}
        {actions}
      </TopBarRight>
    </StyledTopBar>
  );
};
