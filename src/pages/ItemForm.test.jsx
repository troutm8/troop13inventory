import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InventoryProvider, CATEGORIES, CONDITIONS } from '../context/InventoryContext';
import ItemForm from './ItemForm';

function renderAddForm() {
  return render(
    <InventoryProvider>
      <MemoryRouter initialEntries={['/inventory/add']}>
        <Routes>
          <Route path="/inventory/add" element={<ItemForm />} />
          <Route path="/inventory/:id" element={<div data-testid="detail-page">Detail</div>} />
        </Routes>
      </MemoryRouter>
    </InventoryProvider>
  );
}

function renderEditForm(item) {
  localStorage.setItem('troop13_items', JSON.stringify([item]));

  return render(
    <InventoryProvider>
      <MemoryRouter initialEntries={[`/inventory/${item.id}/edit`]}>
        <Routes>
          <Route path="/inventory/:id/edit" element={<ItemForm />} />
          <Route path="/inventory/:id" element={<div data-testid="detail-page">Detail</div>} />
        </Routes>
      </MemoryRouter>
    </InventoryProvider>
  );
}

const existingItem = {
  id: 'item-123',
  name: '4-Person Dome Tent',
  category: 'Shelter',
  quantity: 3,
  condition: 'Fair',
  status: 'In Storage',
  description: 'Coleman dome tent with rain fly',
  purchaseDate: '2025-06-15',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('ItemForm', () => {
  // ─── Add mode rendering ────────────────────────────────────

  describe('add mode', () => {
    it('shows "Add New Gear" heading', () => {
      renderAddForm();
      expect(screen.getByText('Add New Gear')).toBeInTheDocument();
    });

    it('shows "Add to Inventory" submit button', () => {
      renderAddForm();
      expect(screen.getByText('Add to Inventory')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      renderAddForm();
      expect(screen.getByLabelText(/item name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/condition/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/purchase date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('starts with empty name field', () => {
      renderAddForm();
      expect(screen.getByLabelText(/item name/i)).toHaveValue('');
    });

    it('defaults category to first option (Shelter)', () => {
      renderAddForm();
      expect(screen.getByLabelText(/category/i)).toHaveValue('Shelter');
    });

    it('defaults quantity to 1', () => {
      renderAddForm();
      expect(screen.getByLabelText(/quantity/i)).toHaveValue(1);
    });

    it('defaults condition to Good', () => {
      renderAddForm();
      expect(screen.getByLabelText(/condition/i)).toHaveValue('Good');
    });

    it('renders all category options', () => {
      renderAddForm();
      const select = screen.getByLabelText(/category/i);
      CATEGORIES.forEach((cat) => {
        expect(select.querySelector(`option[value="${cat}"]`)).toBeInTheDocument();
      });
    });

    it('renders all condition options', () => {
      renderAddForm();
      const select = screen.getByLabelText(/condition/i);
      CONDITIONS.forEach((cond) => {
        expect(select.querySelector(`option[value="${cond}"]`)).toBeInTheDocument();
      });
    });

    it('has a Back button', () => {
      renderAddForm();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('has a Cancel button', () => {
      renderAddForm();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  // ─── Add mode form submission ──────────────────────────────

  describe('add mode submission', () => {
    it('submits the form and navigates to detail page', async () => {
      const user = userEvent.setup();
      renderAddForm();

      await user.type(screen.getByLabelText(/item name/i), 'Camp Stove');
      await user.selectOptions(screen.getByLabelText(/category/i), 'Cooking');
      await user.clear(screen.getByLabelText(/quantity/i));
      await user.type(screen.getByLabelText(/quantity/i), '2');
      await user.selectOptions(screen.getByLabelText(/condition/i), 'New');
      await user.type(
        screen.getByLabelText(/description/i),
        'Two-burner propane stove'
      );

      await user.click(screen.getByText('Add to Inventory'));

      // Should navigate to detail page after adding
      expect(screen.getByTestId('detail-page')).toBeInTheDocument();
    });

    it('saves the item to localStorage after submission', async () => {
      const user = userEvent.setup();
      renderAddForm();

      await user.type(screen.getByLabelText(/item name/i), 'Lantern');
      await user.click(screen.getByText('Add to Inventory'));

      const stored = JSON.parse(localStorage.getItem('troop13_items'));
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Lantern');
    });
  });

  // ─── Edit mode rendering ───────────────────────────────────

  describe('edit mode', () => {
    it('shows "Edit Item" heading', () => {
      renderEditForm(existingItem);
      expect(screen.getByText('Edit Item')).toBeInTheDocument();
    });

    it('shows "Save Changes" submit button', () => {
      renderEditForm(existingItem);
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('populates name field with existing value', () => {
      renderEditForm(existingItem);
      expect(screen.getByLabelText(/item name/i)).toHaveValue('4-Person Dome Tent');
    });

    it('populates category with existing value', () => {
      renderEditForm(existingItem);
      expect(screen.getByLabelText(/category/i)).toHaveValue('Shelter');
    });

    it('populates quantity with existing value', () => {
      renderEditForm(existingItem);
      expect(screen.getByLabelText(/quantity/i)).toHaveValue(3);
    });

    it('populates condition with existing value', () => {
      renderEditForm(existingItem);
      expect(screen.getByLabelText(/condition/i)).toHaveValue('Fair');
    });

    it('populates description with existing value', () => {
      renderEditForm(existingItem);
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Coleman dome tent with rain fly'
      );
    });

    it('populates purchase date with existing value', () => {
      renderEditForm(existingItem);
      expect(screen.getByLabelText(/purchase date/i)).toHaveValue('2025-06-15');
    });
  });

  // ─── Edit mode form submission ─────────────────────────────

  describe('edit mode submission', () => {
    it('saves changes and navigates to detail page', async () => {
      const user = userEvent.setup();
      renderEditForm(existingItem);

      const nameInput = screen.getByLabelText(/item name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Tent Name');
      await user.click(screen.getByText('Save Changes'));

      expect(screen.getByTestId('detail-page')).toBeInTheDocument();
    });

    it('persists updated values to localStorage', async () => {
      const user = userEvent.setup();
      renderEditForm(existingItem);

      const nameInput = screen.getByLabelText(/item name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Big Tent');
      await user.click(screen.getByText('Save Changes'));

      const stored = JSON.parse(localStorage.getItem('troop13_items'));
      expect(stored[0].name).toBe('Big Tent');
    });

    it('preserves unchanged fields after edit', async () => {
      const user = userEvent.setup();
      renderEditForm(existingItem);

      await user.selectOptions(screen.getByLabelText(/condition/i), 'Good');
      await user.click(screen.getByText('Save Changes'));

      const stored = JSON.parse(localStorage.getItem('troop13_items'));
      expect(stored[0].name).toBe('4-Person Dome Tent'); // unchanged
      expect(stored[0].category).toBe('Shelter'); // unchanged
      expect(stored[0].condition).toBe('Good'); // changed
    });
  });

  // ─── Form interaction ──────────────────────────────────────

  describe('form interaction', () => {
    it('allows changing category', async () => {
      const user = userEvent.setup();
      renderAddForm();

      await user.selectOptions(screen.getByLabelText(/category/i), 'Tools');
      expect(screen.getByLabelText(/category/i)).toHaveValue('Tools');
    });

    it('allows changing condition', async () => {
      const user = userEvent.setup();
      renderAddForm();

      await user.selectOptions(screen.getByLabelText(/condition/i), 'Needs Repair');
      expect(screen.getByLabelText(/condition/i)).toHaveValue('Needs Repair');
    });

    it('allows typing a description', async () => {
      const user = userEvent.setup();
      renderAddForm();

      await user.type(screen.getByLabelText(/description/i), 'Test notes');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Test notes');
    });

    it('allows setting a purchase date', async () => {
      const user = userEvent.setup();
      renderAddForm();

      await user.type(screen.getByLabelText(/purchase date/i), '2026-03-25');
      expect(screen.getByLabelText(/purchase date/i)).toHaveValue('2026-03-25');
    });
  });
});
