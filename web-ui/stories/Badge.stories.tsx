import type {Meta, StoryObj} from '@storybook/react';
import Badge from '../../src/components/ui/Badge';

const meta: Meta<typeof Badge> = {
  title: 'ui/Badge',
  component: Badge,
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Success: Story = {args: {label: 'Success', tone: 'success'}};
export const Warning: Story = {args: {label: 'Warning', tone: 'warning'}};
export const Danger: Story = {args: {label: 'Danger', tone: 'danger'}};
export const Info: Story = {args: {label: 'Info', tone: 'info'}};
export const Neutral: Story = {args: {label: 'Neutral', tone: 'neutral'}};
