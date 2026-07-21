import type {Meta, StoryObj} from '@storybook/react';
import Button from '../../src/components/ui/Button';

const meta: Meta<typeof Button> = {
  title: 'ui/Button',
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

export const PrimaryDefault: Story = {
  args: {label: 'Primary', variant: 'primary'},
};
export const PrimaryDisabled: Story = {
  args: {label: 'Primary', variant: 'primary', disabled: true},
};
export const PrimaryLoading: Story = {
  args: {label: 'Primary', variant: 'primary', loading: true},
};

export const SecondaryDefault: Story = {
  args: {label: 'Secondary', variant: 'secondary'},
};
export const SecondaryDisabled: Story = {
  args: {label: 'Secondary', variant: 'secondary', disabled: true},
};
export const SecondaryLoading: Story = {
  args: {label: 'Secondary', variant: 'secondary', loading: true},
};

export const DangerDefault: Story = {
  args: {label: 'Danger', variant: 'danger'},
};
export const DangerDisabled: Story = {
  args: {label: 'Danger', variant: 'danger', disabled: true},
};
export const DangerLoading: Story = {
  args: {label: 'Danger', variant: 'danger', loading: true},
};

export const SuccessDefault: Story = {
  args: {label: 'Success', variant: 'success'},
};
export const SuccessDisabled: Story = {
  args: {label: 'Success', variant: 'success', disabled: true},
};
export const SuccessLoading: Story = {
  args: {label: 'Success', variant: 'success', loading: true},
};
