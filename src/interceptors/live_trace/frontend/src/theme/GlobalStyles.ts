import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  /* CSS Reset */
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body {
    font-family: ${({ theme }) => theme.typography.fontDisplay};
    background-color: ${({ theme }) => theme.colors.void};
    color: ${({ theme }) => theme.colors.white};
    line-height: ${({ theme }) => theme.typography.lineHeightNormal};
    min-height: 100vh;
  }

  /* Remove default button styles */
  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
  }

  /* Remove default input styles */
  input, textarea, select {
    font-family: inherit;
  }

  /* Remove default link styles */
  a {
    color: inherit;
    text-decoration: none;
  }

  /* Focus styles for accessibility */
  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.cyan};
    outline-offset: 2px;
  }

  /* Remove focus outline for mouse users */
  :focus:not(:focus-visible) {
    outline: none;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.surface};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.white15};
    border-radius: ${({ theme }) => theme.radii.full};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.white30};
  }

  /* Selection styling */
  ::selection {
    background: ${({ theme }) => theme.colors.cyanSoft};
    color: ${({ theme }) => theme.colors.white};
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* Code elements */
  code, kbd, pre, samp {
    font-family: ${({ theme }) => theme.typography.fontMono};
  }

  /* Image defaults */
  img, picture, video, canvas, svg {
    display: block;
    max-width: 100%;
  }

  /* Table defaults */
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }
`;
