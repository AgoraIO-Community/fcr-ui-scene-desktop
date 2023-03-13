const { colorDepth } = require('./webpack/utils/color-palette');

module.exports = {
  prefix: 'fcr-',
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    colors: {
      // Fixed colors: not change along with theme
      brand: colorDepth('#4262FF'),
      red: colorDepth('#F5655C'),
      purple: colorDepth('#7C79FF'),
      pink: colorDepth('#EE4878'),
      white: '#ffffff',
      black: '#000000',
      green: '#16D1A4',
      yellow: '#FFC700',
      yellowwarm: '#FFB554',
      transparent: 'transparent',
      notsb: '#000',
      'notsb-inverse': '#fff',
      'custom-1': '#4262FF',
      'custom-2': '#7C79FF',
      'custom-3': '#64BB5C',
      'custom-4': '#C2CC55',
      // Theme colors: change along with theme
      'block-1': '#000000',
      'block-2': '#2F2F2FF2',
      'block-3': '#202020',
      'block-4': '#43434E',
      'block-5': '#4C5462',
      'block-6': '#8E8E93',
      'block-7': '#3B3E3C',
      'block-8': '#3D404B',
      'line-1': '#4A4C5F',
      'text-1': '#FFFFFF',
      'text-2': '#FFFFFFCC',
      'text-3': '#BDBEC6',
      // icon
      'icon-1': '#FFFFFF',
      'icon-2': '#FFFFFF',
      // hover
      hover: '#4262FF',
      // shadow
      'shadow-1': 'rgba(255, 255, 255, 0.1)',
      'shadow-2': 'rgba(255, 255, 255, 0.2)',
      'shadow-3': 'rgba(255, 255, 255, 0.3)',
    },
    backgroundImage: (theme) => ({
      // progress
      'gradient-1': `linear-gradient(90deg, ${theme('colors.custom-1')} 0%, ${theme(
        'colors.custom-2',
      )} 100%)`,
      'gradient-2': `linear-gradient(90deg, ${theme('colors.custom-3')} 2.67%, ${theme(
        'colors.custom-4',
      )} 100%)`,
      // devider
      'gradient-3': `linear-gradient(90deg, ${theme('notsb')} 0%, ${theme('notsb-inverse')} 100%)`,
    }),
    backgroundColor: (theme) => ({
      global: theme('colors.block-1'),
      board: theme('colors.block-7'),
      'dialog-1': theme('colors.block-2'),
      'dialog-2': theme('colors.block-3'),
      'dialog-3': theme('colors.block-4'),
      'dialog-4': theme('colors.block-5'),
      'dialog-5': theme('colors.block-6'),
      input: theme('colors.block-8'),
    }),
    borderColor: (theme) => ({
      1: theme('colors.line-1'),
    }),
    textColor: (theme) => ({
      1: theme('colors.text-1'),
      2: theme('colors.text-2'),
      3: theme('colors.text-3'),
    }),
    boxShadow: (theme) => ({
      1: `10px 2px 8px 5px ${theme('colors.shadow-1')}`,
      2: `0px 4px 50px ${theme('colors.shadow-2')}`,
      3: `0px 4px 50px -8px ${theme('colors.shadow-3')}`,
    }),
    borderRadius: {
      2: '2px',
      4: '4px',
      8: '8px',
      10: '10px',
      12: '12px',
      14: '14px',
      16: '16px',
      24: '24px',
      50: '50px',
    },
    fontFamily: {
      scenario: ['helvetica neue', 'arial', 'PingFangSC', 'microsoft yahei'],
    },
  },
  corePlugins: [
    'backgroundImage',
    'backgroundColor',
    'borderColor',
    'textColor',
    'boxShadow',
    'borderRadius',
    'fontFamily',
    'flex',
    'flexDirection',
    'flexGrow',
    'flexShrink',
    'flexWrap',
    'height',
    'width',
    'justifyContent',
    'justifyItems',
    'justifySelf',
    'alignContent',
    'alignItems',
    'alignSelf',
    'zIndex',
  ],
};
