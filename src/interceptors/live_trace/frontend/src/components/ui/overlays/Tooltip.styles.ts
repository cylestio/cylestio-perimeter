import styled, { css, keyframes } from 'styled-components';
import type { TooltipPosition } from './Tooltip';

export const TooltipTrigger = styled.span`
  display: inline-flex;
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

interface TooltipContainerProps {
  $position: TooltipPosition;
  $x: number;
  $y: number;
}

const positionStyles: Record<TooltipPosition, ReturnType<typeof css>> = {
  top: css`
    transform: translate(-50%, -100%);
  `,
  bottom: css`
    transform: translate(-50%, 0);
  `,
  left: css`
    transform: translate(-100%, -50%);
  `,
  right: css`
    transform: translate(0, -50%);
  `,
};

export const TooltipContainer = styled.div<TooltipContainerProps>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: ${({ $y }) => $y}px;
  z-index: ${({ theme }) => theme.zIndex.tooltip};
  ${({ $position }) => positionStyles[$position]}
`;

export const TooltipContent = styled.div`
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 12px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.white90};
  max-width: 250px;
  text-align: center;
  animation: ${scaleIn} 150ms ease-out;
`;

interface TooltipArrowProps {
  $position: TooltipPosition;
}

const arrowStyles: Record<TooltipPosition, ReturnType<typeof css>> = {
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
    border-bottom: none;
    border-left: none;
  `,
  right: css`
    left: -6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-top: none;
    border-right: none;
  `,
};

export const TooltipArrow = styled.div<TooltipArrowProps>`
  position: absolute;
  width: 10px;
  height: 10px;
  background: ${({ theme }) => theme.colors.surface3};
  border: 1px solid ${({ theme }) => theme.colors.borderMedium};

  ${({ $position }) => arrowStyles[$position]}
`;
