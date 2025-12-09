import type { FC, ReactNode } from 'react';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import {
  StyledSidebar,
  SidebarHeaderContainer,
  SidebarSectionContainer,
  SidebarFooterContainer,
  ToggleButton,
  SidebarNav,
} from './Sidebar.styles';

// Types
export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  /** Hide the collapse toggle button */
  hideCollapse?: boolean;
  children: ReactNode;
}

export interface SidebarHeaderProps {
  children: ReactNode;
}

export interface SidebarSectionProps {
  children: ReactNode;
}

export interface SidebarFooterProps {
  children: ReactNode;
}

// Subcomponents
const SidebarHeader: FC<SidebarHeaderProps> = ({ children }) => {
  return <SidebarHeaderContainer>{children}</SidebarHeaderContainer>;
};

const SidebarSection: FC<SidebarSectionProps> = ({ children }) => {
  return <SidebarSectionContainer>{children}</SidebarSectionContainer>;
};

const SidebarFooter: FC<SidebarFooterProps> = ({ children }) => {
  return <SidebarFooterContainer>{children}</SidebarFooterContainer>;
};

// Main Component
interface SidebarComponent extends FC<SidebarProps> {
  Header: FC<SidebarHeaderProps>;
  Section: FC<SidebarSectionProps>;
  Footer: FC<SidebarFooterProps>;
}

export const Sidebar: SidebarComponent = ({ collapsed = false, onToggle, hideCollapse = false, children }) => {
  return (
    <StyledSidebar $collapsed={collapsed}>
      <SidebarNav>{children}</SidebarNav>
      {onToggle && !hideCollapse && (
        <ToggleButton
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          $collapsed={collapsed}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </ToggleButton>
      )}
    </StyledSidebar>
  );
};

Sidebar.Header = SidebarHeader;
Sidebar.Section = SidebarSection;
Sidebar.Footer = SidebarFooter;
