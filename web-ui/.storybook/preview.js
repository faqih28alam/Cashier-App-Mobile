const React = require('react');
const {View} = require('react-native');
const {colors} = require('../../src/theme');

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    backgrounds: {
      default: 'app-background',
      values: [{name: 'app-background', value: colors.background}],
    },
  },
  decorators: [
    Story =>
      React.createElement(
        View,
        {style: {padding: 16, alignItems: 'flex-start'}},
        React.createElement(Story),
      ),
  ],
};

module.exports = preview;
