import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Select from './Select';

describe('Select Component', () => {
  const mockOptions = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ];

  it('renders with placeholder when no value is selected', () => {
    render(
      <Select
        value=""
        onChange={vi.fn()}
        options={mockOptions}
        placeholder="Select something"
      />
    );
    expect(screen.getByText('Select something')).toBeInTheDocument();
  });

  it('opens dropdown and allows selection', () => {
    const handleChange = vi.fn();
    render(
      <Select
        value=""
        onChange={handleChange}
        options={mockOptions}
        placeholder="Select something"
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByRole('button', { name: /select something/i }));

    // Check if options are visible
    expect(screen.getByText('Option 1')).toBeInTheDocument();

    // Select option
    fireEvent.click(screen.getByText('Option 1'));

    // Verify onChange was called
    expect(handleChange).toHaveBeenCalledWith('opt1');
  });
});
