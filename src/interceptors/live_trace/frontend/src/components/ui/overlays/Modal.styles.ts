import styled, { keyframes } from 'styled-components';
import type { ModalSize } from './Modal';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[4]};
  animation: ${fadeIn} 150ms ease-out;
`;

const sizeWidths: Record<ModalSize, string> = {
  sm: '400px',
  md: '500px',
  lg: '640px',
  xl: '800px',
};

interface ModalContainerProps {
  $size: ModalSize;
}

export const ModalContainer = styled.div<ModalContainerProps>`
  position: relative;
  width: 100%;
  max-width: ${({ $size }) => sizeWidths[$size]};
  max-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.xl};
  animation: ${scaleIn} 150ms ease-out;
  outline: none;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: 2px;
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;

export const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: ${({ theme }) => theme.typography.weightSemibold};
  color: ${({ theme }) => theme.colors.white};
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
  color: ${({ theme }) => theme.colors.white50};
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

export const ModalContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

export const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: 16px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderSubtle};
`;
