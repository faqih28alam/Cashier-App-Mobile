import type {Meta, StoryObj} from '@storybook/react';
import StatCard from '../../src/components/ui/StatCard';
import {colors} from '../../src/theme';

const meta: Meta<typeof StatCard> = {
  title: 'ui/StatCard',
  component: StatCard,
};
export default meta;

type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {label: 'Total Sales', value: 'Rp 1.250.000', caption: 'Today'},
};

export const CustomAccentColor: Story = {
  args: {
    label: 'Low Stock',
    value: '4',
    caption: 'Items',
    accentColor: colors.badgeOrange,
  },
};
