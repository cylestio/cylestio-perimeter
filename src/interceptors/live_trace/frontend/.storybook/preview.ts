import type { Preview } from '@storybook/react-vite';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { MemoryRouter } from 'react-router-dom';
import { themes } from 'storybook/theming';
import { theme, GlobalStyles } from '../src/theme';

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const content = React.createElement(ThemeProvider, { theme },
        React.createElement(GlobalStyles),
        React.createElement(Story)
      );

      // Allow stories to disable the default router wrapper
      if (context.parameters.router?.disable) {
        return content;
      }

      const initialEntries = context.parameters.router?.initialEntries || ['/'];
      return React.createElement(MemoryRouter, { initialEntries }, content);
    },
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
