import styled, { css, keyframes } from 'styled-components';
import type { SkeletonVariant } from './Skeleton';

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

interface StyledSkeletonProps {
  $variant: SkeletonVariant;
  $width?: string | number;
  $height?: string | number;
}

const getWidth = (width: string | number | undefined): string => {
  if (width === undefined) return '100%';
  return typeof width === 'number' ? `${width}px` : width;
};

const getHeight = (height: string | number | undefined): string => {
  if (height === undefined) return '100%';
  return typeof height === 'number' ? `${height}px` : height;
};

const variantStyles: Record<SkeletonVariant, ReturnType<typeof css>> = {
  text: css`
    height: 14px;
    width: 100%;
    border-radius: ${({ theme }) => theme.radii.sm};
  `,
  title: css`
    height: 24px;
    width: 60%;
    border-radius: ${({ theme }) => theme.radii.sm};
  `,
  avatar: css`
    width: 40px;
    height: 40px;
    border-radius: 50%;
  `,
  circle: css`
    width: 40px;
    height: 40px;
    border-radius: 50%;
  `,
  rect: css`
    width: 100%;
    height: 100px;
    border-radius: ${({ theme }) => theme.radii.md};
  `,
};

export const StyledSkeleton = styled.div<StyledSkeletonProps>`
  display: block;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.white04} 0%,
    ${({ theme }) => theme.colors.white08} 50%,
    ${({ theme }) => theme.colors.white04} 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;

  ${({ $variant }) => variantStyles[$variant]}

  ${({ $width }) =>
    $width !== undefined &&
    css`
      width: ${getWidth($width)};
    `}

  ${({ $height }) =>
    $height !== undefined &&
    css`
      height: ${getHeight($height)};
    `}
`;

export const SkeletonLines = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
