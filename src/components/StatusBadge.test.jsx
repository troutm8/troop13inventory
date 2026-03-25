import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';
import { ITEM_STATUS } from '../context/InventoryContext';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status={ITEM_STATUS.IN_STORAGE} />);
    expect(screen.getByText('In Storage')).toBeInTheDocument();
  });

  it('renders with emerald classes for In Storage', () => {
    render(<StatusBadge status={ITEM_STATUS.IN_STORAGE} />);
    const badge = screen.getByText('In Storage');
    expect(badge.className).toContain('bg-emerald-100');
    expect(badge.className).toContain('text-emerald-700');
  });

  it('renders with amber classes for Checked Out', () => {
    render(<StatusBadge status={ITEM_STATUS.CHECKED_OUT} />);
    const badge = screen.getByText('Checked Out');
    expect(badge.className).toContain('bg-amber-100');
    expect(badge.className).toContain('text-amber-700');
  });

  it('renders with red classes for Damaged', () => {
    render(<StatusBadge status={ITEM_STATUS.DAMAGED} />);
    const badge = screen.getByText('Damaged');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-700');
  });

  it('renders with gray classes for Lost', () => {
    render(<StatusBadge status={ITEM_STATUS.LOST} />);
    const badge = screen.getByText('Lost');
    expect(badge.className).toContain('bg-gray-100');
    expect(badge.className).toContain('text-gray-500');
  });

  it('falls back to In Storage styling for unknown status', () => {
    render(<StatusBadge status="Unknown" />);
    const badge = screen.getByText('Unknown');
    expect(badge.className).toContain('bg-emerald-100');
  });

  it('renders an SVG icon inside the badge', () => {
    render(<StatusBadge status={ITEM_STATUS.IN_STORAGE} />);
    const badge = screen.getByText('In Storage');
    const svg = badge.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
