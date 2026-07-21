import type {Meta, StoryObj} from '@storybook/react';
import EmptyState from '../../src/components/ui/EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'ui/EmptyState',
  component: EmptyState,
};
export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {message: 'No data to display yet.'},
};
