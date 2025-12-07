import styled from 'styled-components';

export const StyledTopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
  background: ${({ theme }) => theme.colors.surface};
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 50;
  min-height: 72px;
`;

export const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
`;

export const SearchBoxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]} 14px;
  background: ${({ theme }) => theme.colors.surface2};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  min-width: 200px;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.cyan};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.cyanSoft};
  }
`;

export const SearchIcon = styled.span`
  display: flex;
  color: ${({ theme }) => theme.colors.white30};
`;

export const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white90};

  &::placeholder {
    color: ${({ theme }) => theme.colors.white30};
  }
`;

export const Shortcut = styled.kbd`
  font-size: ${({ theme }) => theme.typography.textXs};
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white30};
  background: ${({ theme }) => theme.colors.surface3};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
`;
