import React from 'react';
import {Text} from 'react-native';
import type {Meta, StoryObj} from '@storybook/react';
import ScreenHeader from '../../src/components/ui/ScreenHeader';

const meta: Meta<typeof ScreenHeader> = {
  title: 'ui/ScreenHeader',
  component: ScreenHeader,
};
export default meta;

type Story = StoryObj<typeof ScreenHeader>;

export const TitleOnly: Story = {
  args: {title: 'Screen Title'},
};

export const WithSubtitle: Story = {
  args: {title: 'Screen Title', subtitle: 'Supporting subtitle text'},
};

export const WithRightContent: Story = {
  args: {
    title: 'Screen Title',
    subtitle: 'Supporting subtitle text',
    right: <Text>Action</Text>,
  },
};
