import { createContext, useContext, useState, useEffect } from 'react';

const InventoryContext = createContext();

const STORAGE_KEYS = {
  items: 'troop13_items',
  trips: 'troop13_trips',
  checkouts: 'troop13_checkouts',
  activityLog: 'troop13_activity',
};

function loadFromStorage(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const CATEGORIES = [
  'Shelter',
  'Cooking',
  'Tools',
  'Lighting',
  'First Aid',
  'Navigation',
  'Miscellaneous',
];

export const CONDITIONS = ['New', 'Good', 'Fair', 'Needs Repair'];

export const ITEM_STATUS = {
  IN_STORAGE: 'In Storage',
  CHECKED_OUT: 'Checked Out',
  DAMAGED: 'Damaged',
  LOST: 'Lost',
};

export function InventoryProvider({ children }) {
  const [items, setItems] = useState(() => loadFromStorage(STORAGE_KEYS.items));
  const [trips, setTrips] = useState(() => loadFromStorage(STORAGE_KEYS.trips));
  const [checkouts, setCheckouts] = useState(() => loadFromStorage(STORAGE_KEYS.checkouts));
  const [activityLog, setActivityLog] = useState(() => loadFromStorage(STORAGE_KEYS.activityLog));

  useEffect(() => saveToStorage(STORAGE_KEYS.items, items), [items]);
  useEffect(() => saveToStorage(STORAGE_KEYS.trips, trips), [trips]);
  useEffect(() => saveToStorage(STORAGE_KEYS.checkouts, checkouts), [checkouts]);
  useEffect(() => saveToStorage(STORAGE_KEYS.activityLog, activityLog), [activityLog]);

  function addActivity(action, details) {
    const entry = {
      id: crypto.randomUUID(),
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    setActivityLog((prev) => [entry, ...prev]);
  }

  function addItem(item) {
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      status: ITEM_STATUS.IN_STORAGE,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, newItem]);
    addActivity('added', `Added "${newItem.name}" (${newItem.category}) to inventory`);
    return newItem;
  }

  function updateItem(id, updates) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    const item = items.find((i) => i.id === id);
    if (item) {
      addActivity('updated', `Updated "${item.name}"`);
    }
  }

  function deleteItem(id) {
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setCheckouts((prev) => prev.filter((c) => c.itemId !== id));
    if (item) {
      addActivity('deleted', `Removed "${item.name}" from inventory`);
    }
  }

  function addTrip(trip) {
    const newTrip = {
      ...trip,
      id: crypto.randomUUID(),
      status: 'Upcoming',
      createdAt: new Date().toISOString(),
    };
    setTrips((prev) => [...prev, newTrip]);
    addActivity('trip_created', `Created trip "${newTrip.name}"`);
    return newTrip;
  }

  function updateTrip(id, updates) {
    setTrips((prev) => prev.map((trip) => (trip.id === id ? { ...trip, ...updates } : trip)));
  }

  function checkoutItem(itemId, tripId, quantity, checkedOutBy) {
    const checkout = {
      id: crypto.randomUUID(),
      itemId,
      tripId,
      quantity,
      checkedOutBy,
      checkedOutAt: new Date().toISOString(),
      returnedAt: null,
      returnedBy: null,
      returnCondition: null,
      returnNotes: null,
    };
    setCheckouts((prev) => [...prev, checkout]);

    const item = items.find((i) => i.id === itemId);
    const trip = trips.find((t) => t.id === tripId);
    if (item) {
      updateItem(itemId, { status: ITEM_STATUS.CHECKED_OUT });
    }
    addActivity(
      'checked_out',
      `${checkedOutBy} checked out "${item?.name}" (qty: ${quantity}) for "${trip?.name}"`
    );
    return checkout;
  }

  function returnItem(checkoutId, returnedBy, condition, notes) {
    setCheckouts((prev) =>
      prev.map((c) =>
        c.id === checkoutId
          ? {
              ...c,
              returnedAt: new Date().toISOString(),
              returnedBy,
              returnCondition: condition,
              returnNotes: notes,
            }
          : c
      )
    );

    const checkout = checkouts.find((c) => c.id === checkoutId);
    if (checkout) {
      const item = items.find((i) => i.id === checkout.itemId);
      const activeCheckouts = checkouts.filter(
        (c) => c.itemId === checkout.itemId && !c.returnedAt && c.id !== checkoutId
      );
      if (activeCheckouts.length === 0) {
        const newStatus =
          condition === 'Needs Repair' ? ITEM_STATUS.DAMAGED : ITEM_STATUS.IN_STORAGE;
        updateItem(checkout.itemId, { status: newStatus, condition });
      }
      addActivity(
        'returned',
        `${returnedBy} returned "${item?.name}" — Condition: ${condition}${notes ? ` — ${notes}` : ''}`
      );
    }
  }

  function getItemCheckouts(itemId) {
    return checkouts
      .filter((c) => c.itemId === itemId)
      .sort((a, b) => new Date(b.checkedOutAt) - new Date(a.checkedOutAt));
  }

  function getTripCheckouts(tripId) {
    return checkouts.filter((c) => c.tripId === tripId);
  }

  function getAvailableItems() {
    return items.filter((i) => i.status === ITEM_STATUS.IN_STORAGE);
  }

  const stats = {
    totalItems: items.length,
    inStorage: items.filter((i) => i.status === ITEM_STATUS.IN_STORAGE).length,
    checkedOut: items.filter((i) => i.status === ITEM_STATUS.CHECKED_OUT).length,
    damaged: items.filter((i) => i.status === ITEM_STATUS.DAMAGED).length,
    upcomingTrips: trips.filter((t) => t.status === 'Upcoming').length,
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        trips,
        checkouts,
        activityLog,
        stats,
        addItem,
        updateItem,
        deleteItem,
        addTrip,
        updateTrip,
        checkoutItem,
        returnItem,
        getItemCheckouts,
        getTripCheckouts,
        getAvailableItems,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
