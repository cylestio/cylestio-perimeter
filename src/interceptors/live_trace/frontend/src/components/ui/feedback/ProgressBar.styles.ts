import styled, { css } from 'styled-components';
import type { ProgressBarVariant, ProgressBarSize } from './ProgressBar';

interface TrackProps {
  $size: ProgressBarSize;
}

export const Track = styled.div<TrackProps>`
  width: 100%;
  background: ${({ theme }) => theme.colors.white08};
  border-radius: ${({ theme }) => theme.radii.full};
  overflow: hidden;

  ${({ $size }) =>
    $size === 'sm'
      ? css`
          height: 4px;
        `
      : css`
          height: 6px;
        `}
`;

const variantColors: Record<ProgressBarVariant, string> = {
  default: 'cyan',
  success: 'green',
  warning: 'orange',
  danger: 'red',
};

interface FillProps {
  $variant: ProgressBarVariant;
  $value: number;
  $animated: boolean;
}

export const Fill = styled.div<FillProps>`
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.full};
  transition: width 300ms ease;
  width: ${({ $value }) => Math.min(100, Math.max(0, $value))}%;

  ${({ $variant, theme }) => {
    const color = variantColors[$variant];
    return css`
      background: ${theme.colors[color as keyof typeof theme.colors]};
    `;
  }}

  ${({ $animated }) =>
    $animated &&
    css`
      background-size: 20px 20px;
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
      );
      animation: stripes 1s linear infinite;

      @keyframes stripes {
        from {
          background-position: 0 0;
        }
        to {
          background-position: 20px 0;
        }
      }
    `}
`;

export const ProgressBarWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const Label = styled.span`
  font-size: 12px;
  font-family: ${({ theme }) => theme.typography.fontMono};
  color: ${({ theme }) => theme.colors.white50};
  min-width: 36px;
  text-align: right;
`;
