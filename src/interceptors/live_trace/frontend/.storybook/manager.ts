import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'Cylestio UIKit',
    brandUrl: '/',

    // Colors
    colorPrimary: '#00f0ff',
    colorSecondary: '#00ff88',

    // UI
    appBg: '#0a0a0f',
    appContentBg: '#12121a',
    appBorderColor: 'rgba(255, 255, 255, 0.12)',
    appBorderRadius: 6,

    // Text
    textColor: 'rgba(255, 255, 255, 0.9)',
    textInverseColor: '#000000',
    textMutedColor: 'rgba(255, 255, 255, 0.5)',

    // Toolbar
    barTextColor: 'rgba(255, 255, 255, 0.7)',
    barSelectedColor: '#00f0ff',
    barBg: '#0a0a0f',

    // Forms
    inputBg: '#12121a',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    inputTextColor: 'rgba(255, 255, 255, 0.9)',
    inputBorderRadius: 6,
  }),
});
