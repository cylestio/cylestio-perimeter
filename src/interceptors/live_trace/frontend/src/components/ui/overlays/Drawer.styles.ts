import styled, { keyframes, css } from 'styled-components';

import type { DrawerPosition, DrawerSize } from './Drawer';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

interface DrawerOverlayProps {
  $showOverlay: boolean;
  $isClosing: boolean;
}

export const DrawerOverlay = styled.div<DrawerOverlayProps>`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal};
  animation: ${({ $isClosing }) => ($isClosing ? fadeOut : fadeIn)} 200ms ease-out forwards;

  ${({ $showOverlay, theme }) =>
    $showOverlay &&
    css`
      background: ${theme.colors.void}60;
      backdrop-filter: blur(4px);
    `}
`;

const sizeValues: Record<DrawerPosition, Record<DrawerSize, string>> = {
  left: { sm: '320px', md: '400px', lg: '500px', xl: '640px' },
  right: { sm: '320px', md: '400px', lg: '500px', xl: '640px' },
  top: { sm: '200px', md: '300px', lg: '400px', xl: '500px' },
  bottom: { sm: '200px', md: '300px', lg: '400px', xl: '500px' },
};

const getSlideTransform = (position: DrawerPosition, isOpen: boolean) => {
  if (isOpen) return 'translate(0, 0)';

  switch (position) {
    case 'left':
      return 'translateX(-100%)';
    case 'right':
      return 'translateX(100%)';
    case 'top':
      return 'translateY(-100%)';
    case 'bottom':
      return 'translateY(100%)';
  }
};

interface DrawerContainerProps {
  $position: DrawerPosition;
  $size: DrawerSize;
  $isOpen: boolean;
}

export const DrawerContainer = styled.div<DrawerContainerProps>`
  position: fixed;
  z-index: ${({ theme }) => theme.zIndex.modal + 1};
  background: ${({ theme }) => theme.colors.surface};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  outline: none;
  transition: transform ${({ theme }) => theme.transitions.base};
  transform: ${({ $position, $isOpen }) => getSlideTransform($position, $isOpen)};

  ${({ $position, $size, theme }) => {
    switch ($position) {
      case 'left':
        return css`
          top: 0;
          left: 0;
          bottom: 0;
          width: ${sizeValues.left[$size]};
          max-width: 100%;
          border-right: 1px solid ${theme.colors.borderMedium};
        `;
      case 'right':
        return css`
          top: 0;
          right: 0;
          bottom: 0;
          width: ${sizeValues.right[$size]};
          max-width: 100%;
          border-left: 1px solid ${theme.colors.borderMedium};
        `;
      case 'top':
        return css`
          top: 0;
          left: 0;
          right: 0;
          height: ${sizeValues.top[$size]};
          max-height: 100%;
          border-bottom: 1px solid ${theme.colors.borderMedium};
        `;
      case 'bottom':
        return css`
          bottom: 0;
          left: 0;
          right: 0;
          height: ${sizeValues.bottom[$size]};
          max-height: 100%;
          border-top: 1px solid ${theme.colors.borderMedium};
        `;
    }
  }}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: -2px;
  }
`;

export const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderMedium};
  background: ${({ theme }) => theme.colors.surface2};
`;

export const DrawerTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.textLg};
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white90};
  margin: 0;
`;

export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.white70};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.white08};
    color: ${({ theme }) => theme.colors.white90};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: 2px;
  }
`;

export const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing[4]};
`;

export const DrawerFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderMedium};
`;

