import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import renderWithProviders from '../test/renderWithProviders';
import InventoryList from './InventoryList';

function seedItems() {
  const items = [
    {
      id: 'item-1',
      name: '4-Person Dome Tent',
      category: 'Shelter',
      quantity: 3,
      condition: 'Good',
      status: 'In Storage',
      description: 'Coleman dome tent',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'item-2',
      name: 'Camp Stove',
      category: 'Cooking',
      quantity: 2,
      condition: 'Fair',
      status: 'Checked Out',
      description: 'Two-burner propane stove',
      createdAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'item-3',
      name: 'First Aid Kit',
      category: 'First Aid',
      quantity: 1,
      condition: 'New',
      status: 'In Storage',
      description: '',
      createdAt: '2026-01-03T00:00:00.000Z',
    },
  ];
  localStorage.setItem('troop13_items', JSON.stringify(items));
}

describe('InventoryList', () => {
  // ─── Empty state ────────────────────────────────────────────

  describe('empty state', () => {
    it('shows "No gear yet" when inventory is empty', () => {
      renderWithProviders(<InventoryList />);
      expect(screen.getByText('No gear yet')).toBeInTheDocument();
    });

    it('shows "Add First Item" link when empty', () => {
      renderWithProviders(<InventoryList />);
      expect(screen.getByText('Add First Item')).toBeInTheDocument();
    });

    it('displays "0 items total" when empty', () => {
      renderWithProviders(<InventoryList />);
      expect(screen.getByText('0 items total')).toBeInTheDocument();
    });
  });

  // ─── Rendering items ───────────────────────────────────────

  describe('with items', () => {
    beforeEach(() => {
      seedItems();
    });

    it('renders all items in the table', () => {
      renderWithProviders(<InventoryList />);
      expect(screen.getByText('4-Person Dome Tent')).toBeInTheDocument();
      expect(screen.getByText('Camp Stove')).toBeInTheDocument();
      expect(screen.getByText('First Aid Kit')).toBeInTheDocument();
    });

    it('displays correct item count', () => {
      renderWithProviders(<InventoryList />);
      expect(screen.getByText('3 items total')).toBeInTheDocument();
    });

    it('shows item categories in the table', () => {
      renderWithProviders(<InventoryList />);
      const table = screen.getByRole('table');
      expect(within(table).getByText('Shelter')).toBeInTheDocument();
      expect(within(table).getByText('Cooking')).toBeInTheDocument();
    });

    it('shows item quantities in the table', () => {
      renderWithProviders(<InventoryList />);
      const table = screen.getByRole('table');
      expect(within(table).getByText('3')).toBeInTheDocument();
      expect(within(table).getByText('2')).toBeInTheDocument();
    });

    it('shows status badges', () => {
      renderWithProviders(<InventoryList />);
      const table = screen.getByRole('table');
      expect(within(table).getAllByText('In Storage')).toHaveLength(2);
      expect(within(table).getByText('Checked Out')).toBeInTheDocument();
    });

    it('renders table headers', () => {
      renderWithProviders(<InventoryList />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Qty')).toBeInTheDocument();
      expect(screen.getByText('Condition')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders action buttons for each item', () => {
      renderWithProviders(<InventoryList />);
      expect(screen.getAllByTitle('View details')).toHaveLength(3);
      expect(screen.getAllByTitle('Edit')).toHaveLength(3);
      expect(screen.getAllByTitle('Delete')).toHaveLength(3);
    });

    it('has an "Add Item" link at the top', () => {
      renderWithProviders(<InventoryList />);
      const addLink = screen.getByRole('link', { name: /add item/i });
      expect(addLink).toHaveAttribute('href', '/inventory/add');
    });
  });

  // ─── Search ─────────────────────────────────────────────────

  describe('search', () => {
    beforeEach(() => {
      seedItems();
    });

    it('filters items by name', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryList />);

      await user.type(screen.getByPlaceholderText('Search gear...'), 'Tent');

      expect(screen.getByText('4-Person Dome Tent')).toBeInTheDocument();
      expect(screen.queryByText('Camp Stove')).not.toBeInTheDocument();
      expect(screen.queryByText('First Aid Kit')).not.toBeInTheDocument();
    });

    it('filters items by description', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryList />);

      await user.type(screen.getByPlaceholderText('Search gear...'), 'propane');

      expect(screen.getByText('Camp Stove')).toBeInTheDocument();
      expect(screen.queryByText('4-Person Dome Tent')).not.toBeInTheDocument();
    });

    it('search is case-insensitive', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryList />);

      await user.type(screen.getByPlaceholderText('Search gear...'), 'tent');

      expect(screen.getByText('4-Person Dome Tent')).toBeInTheDocument();
    });

    it('shows "No matches found" when search has no results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryList />);

      await user.type(screen.getByPlaceholderText('Search gear...'), 'xyznonexistent');

      expect(screen.getByText('No matches found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters.')).toBeInTheDocument();
    });

    it('does not show "Add First Item" link when filters have no results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryList />);

      await user.type(screen.getByPlaceholderText('Search gear...'), 'xyznonexistent');

      expect(screen.queryByText('Add First Item')).not.toBeInTheDocument();
    });
  });

  // ─── Category filter ───────────────────────────────────────

  describe('category filter', () => {
    beforeEach(() => {
      seedItems();
    });

    it('filters by selected category', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryList />);

      await user.selectOptions(screen.getByDisplayValue('All Categories'), 'Cooking');

      expect(screen.getByText('Camp Stove')).toBeInTheDocument();
      expect(screen.queryByText('4-Person Dome Tent')).not.toBeInTheDocument();
      expect(screen.queryByText('First Aid Kit')).not.toBeInTheDocument();
    });

    it('shows all items when "All Categories" is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryList />);

      await user.selectOptions(screen.getByDisplayValue('All Categories'), 'Cooking');
      await user.selectOptions(screen.getByDisplayValue('Cooking'), '');

      expect(screen.getByText('4-Person Dome Tent')).toBeInTheDocument();
      expect(screen.getByText('Camp Stove')).toBeInTheDocument();
      expect(screen.getByText('First Aid Kit')).toBeInTheDocument();
    });
  });

  // ─── Status filter ─────────────────────────────────────────

  describe('status filter', () => {
    beforeEach(() => {
      seedItems();
    });

    it('filters by selected status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryList />);

      await user.selectOptions(screen.getByDisplayValue('All Statuses'), 'Checked Out');

      expect(screen.getByText('Camp Stove')).toBeInTheDocument();
      expect(screen.queryByText('4-Person Dome Tent')).not.toBeInTheDocument();
    });

    it('filters In Storage items correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryList />);

      await user.selectOptions(screen.getByDisplayValue('All Statuses'), 'In Storage');

      expect(screen.getByText('4-Person Dome Tent')).toBeInTheDocument();
      expect(screen.getByText('First Aid Kit')).toBeInTheDocument();
      expect(screen.queryByText('Camp Stove')).not.toBeInTheDocument();
    });
  });

  // ─── Combined filters ──────────────────────────────────────

  describe('combined filters', () => {
    beforeEach(() => {
      seedItems();
    });

    it('applies search and category filter together', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryList />);

      await user.selectOptions(screen.getByDisplayValue('All Categories'), 'Shelter');
      await user.type(screen.getByPlaceholderText('Search gear...'), 'Tent');

      expect(screen.getByText('4-Person Dome Tent')).toBeInTheDocument();
      expect(screen.queryByText('Camp Stove')).not.toBeInTheDocument();
    });

    it('shows no matches when filters conflict', async () => {
      const user = userEvent.setup();
      renderWithProviders(<InventoryList />);

      await user.selectOptions(screen.getByDisplayValue('All Categories'), 'Cooking');
      await user.type(screen.getByPlaceholderText('Search gear...'), 'Tent');

      expect(screen.getByText('No matches found')).toBeInTheDocument();
    });
  });

  // ─── Delete ─────────────────────────────────────────────────

  describe('delete', () => {
    beforeEach(() => {
      seedItems();
    });

    it('removes item when delete is confirmed', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      renderWithProviders(<InventoryList />);

      const deleteButtons = screen.getAllByTitle('Delete');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete "4-Person Dome Tent"?'
      );
      expect(screen.queryByText('4-Person Dome Tent')).not.toBeInTheDocument();
      expect(screen.getByText('2 items total')).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    it('does not remove item when delete is cancelled', async () => {
      const user = userEvent.setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderWithProviders(<InventoryList />);

      const deleteButtons = screen.getAllByTitle('Delete');
      await user.click(deleteButtons[0]);

      expect(screen.getByText('4-Person Dome Tent')).toBeInTheDocument();
      expect(screen.getByText('3 items total')).toBeInTheDocument();

      vi.restoreAllMocks();
    });
  });

  // ─── Singular/plural item count ─────────────────────────────

  describe('item count text', () => {
    it('uses singular "item" for 1 item', () => {
      localStorage.setItem(
        'troop13_items',
        JSON.stringify([
          {
            id: 'item-1',
            name: 'Tent',
            category: 'Shelter',
            quantity: 1,
            condition: 'Good',
            status: 'In Storage',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ])
      );
      renderWithProviders(<InventoryList />);
      expect(screen.getByText('1 item total')).toBeInTheDocument();
    });
  });
});
