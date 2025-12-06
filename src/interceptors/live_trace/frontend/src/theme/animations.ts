import { keyframes } from 'styled-components';

/**
 * Pulse animation for live indicators
 */
export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

/**
 * Spin animation for loading spinners
 */
export const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/**
 * Fade in with upward slide
 */
export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * Fade in with downward slide
 */
export const fadeInDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * Shimmer animation for skeleton loading
 */
export const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

/**
 * Glow pulse for attention/alerts
 */
export const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 currentColor; }
  50% { box-shadow: 0 0 12px 4px currentColor; }
`;

/**
 * Orb spin for logo animation
 */
export const orbSpin = keyframes`
  to { transform: rotate(360deg); }
`;

/**
 * Scale in for modals/popovers
 */
export const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

/**
 * Slide in from right for panels
 */
export const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;
