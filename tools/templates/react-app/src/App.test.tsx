import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders welcome message', () => {
    render(<App />);
    
    const heading = screen.getByText('Welcome to {{name}}');
    expect(heading).toBeInTheDocument();
  });

  it('renders description with code element', () => {
    render(<App />);
    
    const description = screen.getByText(/Get started by editing/);
    expect(description).toBeInTheDocument();
    
    const codeElement = screen.getByText('src/App.tsx');
    expect(codeElement.tagName).toBe('CODE');
  });
});