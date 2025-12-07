import type { Preview } from '@storybook/react-vite';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { themes } from 'storybook/theming';
import { theme, GlobalStyles } from '../src/theme';

const preview: Preview = {
  decorators: [
    (Story) => (
      React.createElement(ThemeProvider, { theme },
        React.createElement(GlobalStyles),
        React.createElement(Story)
      )
    ),
  ],
  parameters: {
    backgrounds: {
      default: 'void',
      values: [
        { name: 'void', value: '#000000' },
        { name: 'surface', value: '#0a0a0f' },
        { name: 'surface-2', value: '#12121a' },
      ],
    },
    docs: {
      canvas: {
        sourceState: 'shown',
      },
      theme: themes.dark,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
