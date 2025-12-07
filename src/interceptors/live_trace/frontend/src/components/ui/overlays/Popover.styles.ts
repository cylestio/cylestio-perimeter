import styled, { css, keyframes } from 'styled-components';
import type { PopoverPosition, PopoverAlign } from './Popover';

export const PopoverTrigger = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
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

interface PopoverContainerProps {
  $position: PopoverPosition;
  $align: PopoverAlign;
  $x: number;
  $y: number;
}

const getTransform = (position: PopoverPosition, align: PopoverAlign): string => {
  const alignOffset =
    align === 'start' ? '0%' : align === 'end' ? '-100%' : '-50%';

  switch (position) {
    case 'top':
      return `translate(${alignOffset}, -100%)`;
    case 'bottom':
      return `translate(${alignOffset}, 0)`;
    case 'left':
      return `translate(-100%, ${alignOffset})`;
    case 'right':
      return `translate(0, ${alignOffset})`;
  }
};

export const PopoverContainer = styled.div<PopoverContainerProps>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: ${({ $y }) => $y}px;
  z-index: ${({ theme }) => theme.zIndex.popover};
  transform: ${({ $position, $align }) => getTransform($position, $align)};
`;

export const PopoverContent = styled.div`
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  animation: ${scaleIn} 150ms ease-out;
`;

interface PopoverArrowProps {
  $position: PopoverPosition;
}

const arrowStyles: Record<PopoverPosition, ReturnType<typeof css>> = {
  top: css`
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-top: none;
    border-left: none;
  `,
  bottom: css`
    top: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-bottom: none;
    border-right: none;
  `,
  left: css`
    right: -6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-top: none;
    border-left: none;
  `,
  right: css`
    left: -6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-bottom: none;
    border-right: none;
  `,
};

export const PopoverArrow = styled.div<PopoverArrowProps>`
  position: absolute;
  width: 10px;
  height: 10px;
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};

  ${({ $position }) => arrowStyles[$position]}
`;
