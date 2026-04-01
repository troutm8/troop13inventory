import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  InventoryProvider,
  useInventory,
  ITEM_STATUS,
  CATEGORIES,
  CONDITIONS,
} from './InventoryContext';

function wrapper({ children }) {
  return <InventoryProvider>{children}</InventoryProvider>;
}

function renderInventory() {
  return renderHook(() => useInventory(), { wrapper });
}

const sampleItem = {
  name: '4-Person Dome Tent',
  category: 'Shelter',
  quantity: 3,
  condition: 'Good',
  description: 'Coleman dome tent',
};

const sampleTrip = {
  name: 'Spring Camporee 2026',
  startDate: '2026-04-10',
  endDate: '2026-04-12',
};

// ─── Exported Constants ─────────────────────────────────────────

describe('Exported constants', () => {
  it('exports expected categories', () => {
    expect(CATEGORIES).toContain('Shelter');
    expect(CATEGORIES).toContain('Cooking');
    expect(CATEGORIES).toContain('Tools');
    expect(CATEGORIES.length).toBe(7);
  });

  it('exports expected conditions', () => {
    expect(CONDITIONS).toEqual(['New', 'Good', 'Fair', 'Needs Repair']);
  });

  it('exports expected item statuses', () => {
    expect(ITEM_STATUS.IN_STORAGE).toBe('In Storage');
    expect(ITEM_STATUS.CHECKED_OUT).toBe('Checked Out');
    expect(ITEM_STATUS.DAMAGED).toBe('Damaged');
    expect(ITEM_STATUS.LOST).toBe('Lost');
  });
});

// ─── useInventory Hook Guard ────────────────────────────────────

describe('useInventory outside provider', () => {
  it('throws when used outside InventoryProvider', () => {
    expect(() => {
      renderHook(() => useInventory());
    }).toThrow('useInventory must be used within an InventoryProvider');
  });
});

// ─── addItem ────────────────────────────────────────────────────

describe('addItem', () => {
  it('adds an item with correct defaults', async () => {
    const { result } = renderInventory();

    let newItem;
    await act(async () => {
      newItem = await result.current.addItem(sampleItem);
    });

    expect(newItem.id).toBeDefined();
    expect(newItem.name).toBe('4-Person Dome Tent');
    expect(newItem.category).toBe('Shelter');
    expect(newItem.quantity).toBe(3);
    expect(newItem.condition).toBe('Good');
    expect(newItem.status).toBe(ITEM_STATUS.IN_STORAGE);
    expect(newItem.createdAt).toBeDefined();
  });

  it('appears in the items list after adding', async () => {
    const { result } = renderInventory();

    await act(async () => {
      await result.current.addItem(sampleItem);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('4-Person Dome Tent');
  });

  it('logs an activity entry', async () => {
    const { result } = renderInventory();

    await act(async () => {
      await result.current.addItem(sampleItem);
    });

    expect(result.current.activityLog).toHaveLength(1);
    expect(result.current.activityLog[0].action).toBe('added');
    expect(result.current.activityLog[0].details).toContain('4-Person Dome Tent');
  });

  it('can add multiple items', async () => {
    const { result } = renderInventory();

    await act(async () => {
      await result.current.addItem(sampleItem);
      await result.current.addItem({ ...sampleItem, name: 'Camp Stove', category: 'Cooking' });
    });

    expect(result.current.items).toHaveLength(2);
  });

  it('generates unique IDs for each item', async () => {
    const { result } = renderInventory();

    let item1, item2;
    await act(async () => {
      item1 = await result.current.addItem(sampleItem);
      item2 = await result.current.addItem({ ...sampleItem, name: 'Camp Stove' });
    });

    expect(item1.id).not.toBe(item2.id);
  });
});

// ─── updateItem ─────────────────────────────────────────────────

describe('updateItem', () => {
  it('updates item fields', async () => {
    const { result } = renderInventory();

    let item;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
    });
    await act(async () => {
      await result.current.updateItem(item.id, { name: 'Updated Tent', quantity: 5 });
    });

    const updated = result.current.items.find((i) => i.id === item.id);
    expect(updated.name).toBe('Updated Tent');
    expect(updated.quantity).toBe(5);
    expect(updated.category).toBe('Shelter'); // unchanged fields preserved
  });

  it('logs an activity entry for the update', async () => {
    const { result } = renderInventory();

    let item;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
    });
    await act(async () => {
      await result.current.updateItem(item.id, { condition: 'Fair' });
    });

    const updateLog = result.current.activityLog.find((a) => a.action === 'updated');
    expect(updateLog).toBeDefined();
    expect(updateLog.details).toContain('4-Person Dome Tent');
  });

  it('does not affect other items', async () => {
    const { result } = renderInventory();

    let item1, item2;
    await act(async () => {
      item1 = await result.current.addItem(sampleItem);
      item2 = await result.current.addItem({ ...sampleItem, name: 'Camp Stove' });
    });
    await act(async () => {
      await result.current.updateItem(item1.id, { name: 'Big Tent' });
    });

    const other = result.current.items.find((i) => i.id === item2.id);
    expect(other.name).toBe('Camp Stove');
  });
});

// ─── deleteItem ─────────────────────────────────────────────────

describe('deleteItem', () => {
  it('removes the item from the list', async () => {
    const { result } = renderInventory();

    let item;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
    });
    await act(async () => {
      await result.current.deleteItem(item.id);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('cleans up related checkouts when item is deleted', async () => {
    const { result } = renderInventory();

    let item, trip;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      await result.current.checkoutItem(item.id, trip.id, 1, 'John');
    });
    await act(async () => {
      await result.current.deleteItem(item.id);
    });

    expect(result.current.checkouts).toHaveLength(0);
  });

  it('logs an activity entry for deletion', async () => {
    const { result } = renderInventory();

    let item;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
    });
    await act(async () => {
      await result.current.deleteItem(item.id);
    });

    const deleteLog = result.current.activityLog.find((a) => a.action === 'deleted');
    expect(deleteLog).toBeDefined();
    expect(deleteLog.details).toContain('4-Person Dome Tent');
  });

  it('does not affect other items', async () => {
    const { result } = renderInventory();

    let item1, item2;
    await act(async () => {
      item1 = await result.current.addItem(sampleItem);
      item2 = await result.current.addItem({ ...sampleItem, name: 'Camp Stove' });
    });
    await act(async () => {
      await result.current.deleteItem(item1.id);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe(item2.id);
  });
});

// ─── addTrip ────────────────────────────────────────────────────

describe('addTrip', () => {
  it('creates a trip with correct defaults', async () => {
    const { result } = renderInventory();

    let trip;
    await act(async () => {
      trip = await result.current.addTrip(sampleTrip);
    });

    expect(trip.id).toBeDefined();
    expect(trip.name).toBe('Spring Camporee 2026');
    expect(trip.status).toBe('Upcoming');
    expect(trip.createdAt).toBeDefined();
  });

  it('appears in the trips list', async () => {
    const { result } = renderInventory();

    await act(async () => {
      await result.current.addTrip(sampleTrip);
    });

    expect(result.current.trips).toHaveLength(1);
  });

  it('logs an activity entry', async () => {
    const { result } = renderInventory();

    await act(async () => {
      await result.current.addTrip(sampleTrip);
    });

    const tripLog = result.current.activityLog.find((a) => a.action === 'trip_created');
    expect(tripLog).toBeDefined();
    expect(tripLog.details).toContain('Spring Camporee 2026');
  });
});

// ─── updateTrip ─────────────────────────────────────────────────

describe('updateTrip', () => {
  it('updates trip status', async () => {
    const { result } = renderInventory();

    let trip;
    await act(async () => {
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      await result.current.updateTrip(trip.id, { status: 'Active' });
    });

    const updated = result.current.trips.find((t) => t.id === trip.id);
    expect(updated.status).toBe('Active');
  });
});

// ─── checkoutItem ───────────────────────────────────────────────

describe('checkoutItem', () => {
  it('creates a checkout record with correct fields', async () => {
    const { result } = renderInventory();

    let item, trip;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });

    let checkout;
    await act(async () => {
      checkout = await result.current.checkoutItem(item.id, trip.id, 2, 'Mike');
    });

    expect(checkout.id).toBeDefined();
    expect(checkout.itemId).toBe(item.id);
    expect(checkout.tripId).toBe(trip.id);
    expect(checkout.quantity).toBe(2);
    expect(checkout.checkedOutBy).toBe('Mike');
    expect(checkout.checkedOutAt).toBeDefined();
    expect(checkout.returnedAt).toBeNull();
    expect(checkout.returnedBy).toBeNull();
  });

  it('changes item status to Checked Out', async () => {
    const { result } = renderInventory();

    let item, trip;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      await result.current.checkoutItem(item.id, trip.id, 1, 'Mike');
    });

    const updated = result.current.items.find((i) => i.id === item.id);
    expect(updated.status).toBe(ITEM_STATUS.CHECKED_OUT);
  });

  it('adds the checkout to the checkouts list', async () => {
    const { result } = renderInventory();

    let item, trip;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      await result.current.checkoutItem(item.id, trip.id, 1, 'Mike');
    });

    expect(result.current.checkouts).toHaveLength(1);
  });

  it('logs a checkout activity', async () => {
    const { result } = renderInventory();

    let item, trip;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      await result.current.checkoutItem(item.id, trip.id, 1, 'Mike');
    });

    const checkoutLog = result.current.activityLog.find((a) => a.action === 'checked_out');
    expect(checkoutLog).toBeDefined();
    expect(checkoutLog.details).toContain('Mike');
    expect(checkoutLog.details).toContain('4-Person Dome Tent');
  });
});

// ─── returnItem ─────────────────────────────────────────────────

describe('returnItem', () => {
  it('records return details on the checkout', async () => {
    const { result } = renderInventory();

    let item, trip, checkout;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      checkout = await result.current.checkoutItem(item.id, trip.id, 1, 'Mike');
    });
    await act(async () => {
      await result.current.returnItem(checkout.id, 'Sarah', 'Good', 'All clean');
    });

    const returned = result.current.checkouts.find((c) => c.id === checkout.id);
    expect(returned.returnedAt).toBeDefined();
    expect(returned.returnedBy).toBe('Sarah');
    expect(returned.returnCondition).toBe('Good');
    expect(returned.returnNotes).toBe('All clean');
  });

  it('sets item status back to In Storage when returned in good condition', async () => {
    const { result } = renderInventory();

    let item, trip, checkout;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      checkout = await result.current.checkoutItem(item.id, trip.id, 1, 'Mike');
    });
    await act(async () => {
      await result.current.returnItem(checkout.id, 'Sarah', 'Good', '');
    });

    const updated = result.current.items.find((i) => i.id === item.id);
    expect(updated.status).toBe(ITEM_STATUS.IN_STORAGE);
  });

  it('sets item status to Damaged when returned with Needs Repair', async () => {
    const { result } = renderInventory();

    let item, trip, checkout;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      checkout = await result.current.checkoutItem(item.id, trip.id, 1, 'Mike');
    });
    await act(async () => {
      await result.current.returnItem(checkout.id, 'Sarah', 'Needs Repair', 'Pole is bent');
    });

    const updated = result.current.items.find((i) => i.id === item.id);
    expect(updated.status).toBe(ITEM_STATUS.DAMAGED);
  });

  it('logs a return activity', async () => {
    const { result } = renderInventory();

    let item, trip, checkout;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      checkout = await result.current.checkoutItem(item.id, trip.id, 1, 'Mike');
    });
    await act(async () => {
      await result.current.returnItem(checkout.id, 'Sarah', 'Good', 'Looks great');
    });

    const returnLog = result.current.activityLog.find((a) => a.action === 'returned');
    expect(returnLog).toBeDefined();
    expect(returnLog.details).toContain('Sarah');
    expect(returnLog.details).toContain('Good');
    expect(returnLog.details).toContain('Looks great');
  });
});

// ─── getItemCheckouts ───────────────────────────────────────────

describe('getItemCheckouts', () => {
  it('returns only checkouts for the specified item', async () => {
    const { result } = renderInventory();

    let item1, item2, trip;
    await act(async () => {
      item1 = await result.current.addItem(sampleItem);
      item2 = await result.current.addItem({ ...sampleItem, name: 'Camp Stove' });
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      await result.current.checkoutItem(item1.id, trip.id, 1, 'Mike');
      await result.current.checkoutItem(item2.id, trip.id, 1, 'John');
    });

    const item1Checkouts = result.current.getItemCheckouts(item1.id);
    expect(item1Checkouts).toHaveLength(1);
    expect(item1Checkouts[0].itemId).toBe(item1.id);
  });

  it('returns checkouts sorted by most recent first', async () => {
    const { result } = renderInventory();

    let item, trip1, trip2;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip1 = await result.current.addTrip({ ...sampleTrip, name: 'Trip 1' });
      trip2 = await result.current.addTrip({ ...sampleTrip, name: 'Trip 2' });
    });
    await act(async () => {
      await result.current.checkoutItem(item.id, trip1.id, 1, 'Mike');
    });
    // Return first so we can check out again
    await act(async () => {
      const co = result.current.checkouts[0];
      await result.current.returnItem(co.id, 'Mike', 'Good', '');
    });
    await act(async () => {
      await result.current.checkoutItem(item.id, trip2.id, 1, 'John');
    });

    const checkouts = result.current.getItemCheckouts(item.id);
    expect(checkouts).toHaveLength(2);
    // Most recent should be first
    expect(new Date(checkouts[0].checkedOutAt).getTime()).toBeGreaterThanOrEqual(
      new Date(checkouts[1].checkedOutAt).getTime()
    );
  });

  it('returns empty array for item with no checkouts', async () => {
    const { result } = renderInventory();

    let item;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
    });

    expect(result.current.getItemCheckouts(item.id)).toEqual([]);
  });
});

// ─── getTripCheckouts ───────────────────────────────────────────

describe('getTripCheckouts', () => {
  it('returns only checkouts for the specified trip', async () => {
    const { result } = renderInventory();

    let item, trip1, trip2;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip1 = await result.current.addTrip({ ...sampleTrip, name: 'Trip 1' });
      trip2 = await result.current.addTrip({ ...sampleTrip, name: 'Trip 2' });
    });
    await act(async () => {
      await result.current.checkoutItem(item.id, trip1.id, 1, 'Mike');
    });

    expect(result.current.getTripCheckouts(trip1.id)).toHaveLength(1);
    expect(result.current.getTripCheckouts(trip2.id)).toHaveLength(0);
  });
});

// ─── getAvailableItems ──────────────────────────────────────────

describe('getAvailableItems', () => {
  it('returns only items with In Storage status', async () => {
    const { result } = renderInventory();

    let item1, item2, trip;
    await act(async () => {
      item1 = await result.current.addItem(sampleItem);
      item2 = await result.current.addItem({ ...sampleItem, name: 'Camp Stove' });
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      await result.current.checkoutItem(item1.id, trip.id, 1, 'Mike');
    });

    const available = result.current.getAvailableItems();
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe(item2.id);
  });

  it('returns all items when none are checked out', async () => {
    const { result } = renderInventory();

    await act(async () => {
      await result.current.addItem(sampleItem);
      await result.current.addItem({ ...sampleItem, name: 'Camp Stove' });
    });

    expect(result.current.getAvailableItems()).toHaveLength(2);
  });

  it('returns empty array when all items are checked out', async () => {
    const { result } = renderInventory();

    let item, trip;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      await result.current.checkoutItem(item.id, trip.id, 1, 'Mike');
    });

    expect(result.current.getAvailableItems()).toHaveLength(0);
  });
});

// ─── stats ──────────────────────────────────────────────────────

describe('stats', () => {
  it('starts with all zeros', () => {
    const { result } = renderInventory();

    expect(result.current.stats).toEqual({
      totalItems: 0,
      inStorage: 0,
      checkedOut: 0,
      damaged: 0,
      upcomingTrips: 0,
    });
  });

  it('reflects correct counts after adding items', async () => {
    const { result } = renderInventory();

    await act(async () => {
      await result.current.addItem(sampleItem);
      await result.current.addItem({ ...sampleItem, name: 'Camp Stove' });
    });

    expect(result.current.stats.totalItems).toBe(2);
    expect(result.current.stats.inStorage).toBe(2);
    expect(result.current.stats.checkedOut).toBe(0);
  });

  it('updates when items are checked out', async () => {
    const { result } = renderInventory();

    let item, trip;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      await result.current.addItem({ ...sampleItem, name: 'Camp Stove' });
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      await result.current.checkoutItem(item.id, trip.id, 1, 'Mike');
    });

    expect(result.current.stats.totalItems).toBe(2);
    expect(result.current.stats.inStorage).toBe(1);
    expect(result.current.stats.checkedOut).toBe(1);
  });

  it('counts damaged items separately', async () => {
    const { result } = renderInventory();

    let item, trip, checkout;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      checkout = await result.current.checkoutItem(item.id, trip.id, 1, 'Mike');
    });
    await act(async () => {
      await result.current.returnItem(checkout.id, 'Sarah', 'Needs Repair', 'Broken pole');
    });

    expect(result.current.stats.damaged).toBe(1);
    expect(result.current.stats.inStorage).toBe(0);
  });

  it('counts upcoming trips', async () => {
    const { result } = renderInventory();

    await act(async () => {
      await result.current.addTrip(sampleTrip);
      await result.current.addTrip({ ...sampleTrip, name: 'Fall Campout' });
    });

    expect(result.current.stats.upcomingTrips).toBe(2);
  });
});

// ─── localStorage Persistence ───────────────────────────────────

describe('localStorage persistence', () => {
  it('persists items to localStorage', async () => {
    const { result } = renderInventory();

    await act(async () => {
      await result.current.addItem(sampleItem);
    });

    const stored = JSON.parse(localStorage.getItem('troop13_items'));
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('4-Person Dome Tent');
  });

  it('persists trips to localStorage', async () => {
    const { result } = renderInventory();

    await act(async () => {
      await result.current.addTrip(sampleTrip);
    });

    const stored = JSON.parse(localStorage.getItem('troop13_trips'));
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Spring Camporee 2026');
  });

  it('persists checkouts to localStorage', async () => {
    const { result } = renderInventory();

    let item, trip;
    await act(async () => {
      item = await result.current.addItem(sampleItem);
      trip = await result.current.addTrip(sampleTrip);
    });
    await act(async () => {
      await result.current.checkoutItem(item.id, trip.id, 1, 'Mike');
    });

    const stored = JSON.parse(localStorage.getItem('troop13_checkouts'));
    expect(stored).toHaveLength(1);
  });

  it('persists activity log to localStorage', async () => {
    const { result } = renderInventory();

    await act(async () => {
      await result.current.addItem(sampleItem);
    });

    const stored = JSON.parse(localStorage.getItem('troop13_activity'));
    expect(stored.length).toBeGreaterThan(0);
  });

  it('loads existing data from localStorage on mount', () => {
    const existingItems = [
      {
        id: 'test-id-1',
        name: 'Existing Tent',
        category: 'Shelter',
        quantity: 1,
        condition: 'Good',
        status: 'In Storage',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    localStorage.setItem('troop13_items', JSON.stringify(existingItems));

    const { result } = renderInventory();

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Existing Tent');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('troop13_items', 'not valid json{{{');

    const { result } = renderInventory();

    expect(result.current.items).toEqual([]);
  });
});
