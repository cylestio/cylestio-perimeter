import styled, { keyframes, css } from 'styled-components';
import type { OrbLoaderSize, OrbLoaderVariant } from './OrbLoader';

// Animation keyframes for the morphing shape
const morphSpin = keyframes`
  0% {
    border-radius: 50%;
    transform: rotate(0deg);
  }
  15% {
    border-radius: 50%;
    transform: rotate(45deg);
  }
  30% {
    border-radius: 25%;
    transform: rotate(135deg);
  }
  50% {
    border-radius: 25%;
    transform: rotate(225deg);
  }
  65% {
    border-radius: 25%;
    transform: rotate(315deg);
  }
  80% {
    border-radius: 50%;
    transform: rotate(360deg);
  }
  100% {
    border-radius: 50%;
    transform: rotate(360deg);
  }
`;

// Inner orb follows the same morph pattern
const morphSpinInner = keyframes`
  0% {
    border-radius: 50%;
  }
  15% {
    border-radius: 50%;
  }
  30% {
    border-radius: 25%;
  }
  50% {
    border-radius: 25%;
  }
  65% {
    border-radius: 25%;
  }
  80% {
    border-radius: 50%;
  }
  100% {
    border-radius: 50%;
  }
`;

// Subtle glow pulse that syncs with the morph
const glowPulse = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.3));
  }
  30%, 65% {
    filter: drop-shadow(0 0 16px rgba(0, 240, 255, 0.5)) drop-shadow(0 0 32px rgba(0, 255, 136, 0.3));
  }
`;

// Whip spin - morphs to square, accelerates rapidly, then decelerates at same rate
// Timeline: circle → square → fast spin → snap decelerate → circle
const whipSpin = keyframes`
  0% {
    border-radius: 50%;
    transform: rotate(0deg);
  }
  /* Morph to square while starting slow rotation */
  12% {
    border-radius: 25%;
    transform: rotate(30deg);
  }
  /* Square is formed, begin acceleration */
  20% {
    border-radius: 25%;
    transform: rotate(90deg);
  }
  /* Peak speed zone - rapid spinning as square */
  35% {
    border-radius: 25%;
    transform: rotate(360deg);
  }
  50% {
    border-radius: 25%;
    transform: rotate(630deg);
  }
  /* Snap deceleration - very fast */
  56% {
    border-radius: 25%;
    transform: rotate(700deg);
  }
  /* Morph back to circle */
  62% {
    border-radius: 50%;
    transform: rotate(720deg);
  }
  /* Rest as circle */
  100% {
    border-radius: 50%;
    transform: rotate(720deg);
  }
`;

// Inner follows the same morph pattern for whip
const whipSpinInner = keyframes`
  0% {
    border-radius: 50%;
  }
  12%, 56% {
    border-radius: 25%;
  }
  62%, 100% {
    border-radius: 50%;
  }
`;

// Glow intensifies during the fast spin
const whipGlow = keyframes`
  0%, 62%, 100% {
    filter: drop-shadow(0 0 6px rgba(0, 240, 255, 0.25));
  }
  20% {
    filter: drop-shadow(0 0 12px rgba(0, 240, 255, 0.4));
  }
  35%, 50% {
    filter: drop-shadow(0 0 24px rgba(0, 240, 255, 0.7)) drop-shadow(0 0 48px rgba(0, 255, 136, 0.5));
  }
`;

const sizeMap: Record<OrbLoaderSize, { outer: number; inner: number }> = {
  sm: { outer: 20, inner: 12 },
  md: { outer: 28, inner: 18 },
  lg: { outer: 40, inner: 26 },
  xl: { outer: 56, inner: 36 },
};

interface StyledOrbLoaderProps {
  $size: OrbLoaderSize;
  $variant: OrbLoaderVariant;
}

export const OrbLoaderContainer = styled.div<StyledOrbLoaderProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => sizeMap[$size].outer}px;
  height: ${({ $size }) => sizeMap[$size].outer}px;
`;

const morphAnimation = css`
  animation:
    ${morphSpin} 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite,
    ${glowPulse} 2.4s ease-in-out infinite;
`;

const whipAnimation = css`
  animation:
    ${whipSpin} 2s linear infinite,
    ${whipGlow} 2s ease-in-out infinite;
`;

export const OrbOuter = styled.div<StyledOrbLoaderProps>`
  width: ${({ $size }) => sizeMap[$size].outer}px;
  height: ${({ $size }) => sizeMap[$size].outer}px;
  background: conic-gradient(
    from 0deg,
    ${({ theme }) => theme.colors.cyan},
    ${({ theme }) => theme.colors.green},
    ${({ theme }) => theme.colors.cyan}
  );
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  ${({ $variant }) => ($variant === 'morph' ? morphAnimation : whipAnimation)}
  will-change: transform, border-radius, filter;
`;

const morphInnerAnimation = css`
  animation: ${morphSpinInner} 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
`;

const whipInnerAnimation = css`
  animation: ${whipSpinInner} 2s linear infinite;
`;

export const OrbInner = styled.div<StyledOrbLoaderProps>`
  width: ${({ $size }) => sizeMap[$size].inner}px;
  height: ${({ $size }) => sizeMap[$size].inner}px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 50%;
  ${({ $variant }) => $variant === 'morph' && morphInnerAnimation}
  ${({ $variant }) => $variant === 'whip' && whipInnerAnimation}
  will-change: border-radius;
`;

// Full-page loader wrapper
export const FullPageWrapper = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[4]};
  background: ${({ theme }) => theme.colors.surface};
  z-index: ${({ theme }) => theme.zIndex.modal};
`;

// Loading text with subtle animation
const textFade = keyframes`
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
`;

export const LoadingText = styled.span`
  font-size: ${({ theme }) => theme.typography.textSm};
  color: ${({ theme }) => theme.colors.white70};
  letter-spacing: ${({ theme }) => theme.typography.trackingWide};
  text-transform: uppercase;
  animation: ${textFade} 2s ease-in-out infinite;
`;
