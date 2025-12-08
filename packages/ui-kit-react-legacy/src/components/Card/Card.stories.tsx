import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from '../Button';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'small', 'medium', 'large'],
    },
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'elevated'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const CardUsage: Story = {
  args: {
    children: (
      <>
        <h3 style={{ margin: '0 0 1rem 0' }}>Card Title</h3>
        <p style={{ margin: 0 }}>This is a basic card component that can contain any content.</p>
      </>
    ),
  },
};

export const WithHeaderAndFooter: Story = {
  args: {
    header: 'Card Header',
    footer: 'Card Footer',
    children: (
      <p style={{ margin: 0 }}>Card content goes here. The header and footer are automatically styled.</p>
    ),
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Card variant="default" style={{ width: '300px' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Default Card</h4>
        <p style={{ margin: 0 }}>Simple card with default background.</p>
      </Card>
      
      <Card variant="bordered" style={{ width: '300px' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Bordered Card</h4>
        <p style={{ margin: 0 }}>Card with a subtle border.</p>
      </Card>
      
      <Card variant="elevated" style={{ width: '300px' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Elevated Card</h4>
        <p style={{ margin: 0 }}>Card with shadow for elevation.</p>
      </Card>
    </div>
  ),
};

export const PaddingSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Card padding="none" variant="bordered" style={{ width: '250px' }}>
        <div style={{ padding: '1rem', background: 'var(--color-primary-soft10)' }}>
          No padding (custom content)
        </div>
      </Card>
      
      <Card padding="small" variant="bordered" style={{ width: '250px' }}>
        <p style={{ margin: 0 }}>Small padding</p>
      </Card>
      
      <Card padding="medium" variant="bordered" style={{ width: '250px' }}>
        <p style={{ margin: 0 }}>Medium padding (default)</p>
      </Card>
      
      <Card padding="large" variant="bordered" style={{ width: '250px' }}>
        <p style={{ margin: 0 }}>Large padding</p>
      </Card>
    </div>
  ),
};

export const ClickableCard: Story = {
  render: () => {
    const [clicks, setClicks] = React.useState(0);
    
    return (
      <div>
        <Card 
          variant="elevated" 
          onClick={() => setClicks(clicks + 1)}
          style={{ width: '300px' }}
        >
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Clickable Card</h4>
          <p style={{ margin: 0 }}>Click me! Clicked {clicks} times.</p>
        </Card>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-body-text-soft40)' }}>
          Clickable cards show hover and active states
        </p>
      </div>
    );
  },
};

export const ComplexCard: Story = {
  render: () => (
    <Card 
      variant="bordered" 
      header={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Project Status</span>
          <span style={{ 
            fontSize: '0.75rem', 
            padding: '0.25rem 0.5rem', 
            background: 'var(--color-success-soft10)', 
            borderRadius: 'var(--radius-small10)',
            color: 'var(--color-success)'
          }}>
            Active
          </span>
        </div>
      }
      footer={
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button size="small" variant="primary">View Details</Button>
          <Button size="small" variant="neutral">Edit</Button>
        </div>
      }
      style={{ width: '350px' }}
    >
      <h3 style={{ margin: '0 0 0.5rem 0' }}>Website Redesign</h3>
      <p style={{ margin: '0 0 1rem 0', color: 'var(--color-body-text-soft20)' }}>
        Modernizing the company website with new branding and improved user experience.
      </p>
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
        <div>
          <strong>Due:</strong> Dec 31, 2024
        </div>
        <div>
          <strong>Progress:</strong> 75%
        </div>
      </div>
    </Card>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
      gap: '1rem' 
    }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} variant="elevated" onClick={() => console.log(`Card ${i} clicked`)}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Card {i}</h4>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--color-body-text-soft20)' }}>
            This is card number {i} in a responsive grid layout.
          </p>
          <Button size="small" variant="primary" fullWidth>
            Action {i}
          </Button>
        </Card>
      ))}
    </div>
  ),
};

export const ImageCard: Story = {
  render: () => (
    <Card variant="bordered" padding="none" style={{ width: '300px' }}>
      <div style={{ 
        height: '200px', 
        background: 'linear-gradient(135deg, var(--color-primary-soft10), var(--color-primary-soft20))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-primary)'
      }}>
        <span style={{ fontSize: '3rem' }}>🖼️</span>
      </div>
      <div style={{ padding: 'var(--spacing)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Image Card</h4>
        <p style={{ margin: '0 0 1rem 0', color: 'var(--color-body-text-soft20)' }}>
          Cards can contain images or other media content.
        </p>
        <Button variant="primary" size="small" fullWidth>
          View Gallery
        </Button>
      </div>
    </Card>
  ),
};

import React from 'react';