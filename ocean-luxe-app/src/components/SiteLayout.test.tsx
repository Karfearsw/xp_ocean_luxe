import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import SiteLayout from './SiteLayout';

describe('SiteLayout', () => {
  it('renders navigation items', () => {
    render(
      <BrowserRouter>
        <SiteLayout />
      </BrowserRouter>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Destinations')).toBeInTheDocument();
    expect(screen.getByText('Book')).toBeInTheDocument();
  });

  it('renders branding elements', () => {
    render(
      <BrowserRouter>
        <SiteLayout />
      </BrowserRouter>
    );
    expect(screen.getByText('XP OCEAN LUXE')).toBeInTheDocument();
    expect(screen.getByText('Orlando Concierge + Experiences')).toBeInTheDocument();
  });
});
