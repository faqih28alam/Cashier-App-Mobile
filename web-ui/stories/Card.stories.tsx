import React from 'react';
import {Text} from 'react-native';
import type {Meta, StoryObj} from '@storybook/react';
import Card from '../../src/components/ui/Card';

const meta: Meta<typeof Card> = {
  title: 'ui/Card',
  component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: <Text>Card content goes here.</Text>,
  },
};
