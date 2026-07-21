import React from 'react';
import {Text} from 'react-native';
import type {Meta, StoryObj} from '@storybook/react';
import ListRow from '../../src/components/ui/ListRow';

const meta: Meta<typeof ListRow> = {
  title: 'ui/ListRow',
  component: ListRow,
};
export default meta;

type Story = StoryObj<typeof ListRow>;

export const TitleOnly: Story = {
  args: {title: 'Title only'},
};

export const WithSubtitle: Story = {
  args: {title: 'Title', subtitle: 'Supporting subtitle text'},
};

export const WithRightContent: Story = {
  args: {
    title: 'Title',
    subtitle: 'Subtitle',
    right: <Text>Rp 10.000</Text>,
  },
};

export const ChevronHidden: Story = {
  args: {title: 'Title', subtitle: 'Subtitle', chevron: false},
};
