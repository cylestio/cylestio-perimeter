import styled from 'styled-components';

interface StyledSidebarProps {
  $collapsed: boolean;
}

export const StyledSidebar = styled.aside<StyledSidebarProps>`
  width: ${({ $collapsed, theme }) =>
    $collapsed ? theme.layout.sidebarCollapsed : theme.layout.sidebarWidth};
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.borderMedium};
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: width ${({ theme }) => theme.transitions.base};
  overflow: hidden;
`;

export const SidebarNav = styled.nav`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.white08};
    border-radius: ${({ theme }) => theme.radii.full};

    &:hover {
      background: ${({ theme }) => theme.colors.white15};
    }
  }
`;

export const SidebarHeaderContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[5]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const SidebarSectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: ${({ theme }) => theme.spacing[4]};
  flex: 1;
`;

export const SidebarFooterContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[3]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  margin-top: auto;
`;

export const ToggleButton = styled.button<{ $collapsed: boolean }>`
  position: absolute;
  bottom: 72px;
  right: ${({ $collapsed }) => ($collapsed ? '50%' : '12px')};
  transform: ${({ $collapsed }) => ($collapsed ? 'translateX(50%)' : 'none')};
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white50};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surface3};
    color: ${({ theme }) => theme.colors.white90};
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: 2px;
  }
`;
