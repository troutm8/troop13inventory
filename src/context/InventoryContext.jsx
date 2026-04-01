import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

let db = null;
const useFirestore = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

if (useFirestore) {
  // Dynamic import isn't needed — firebase.js is tiny and tree-shaken when unused
  const { db: firebaseDb } = await import('../firebase.js');
  db = firebaseDb;
}

const InventoryContext = createContext();

// ── localStorage helpers (used when Firebase is not configured) ──

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

// ── Exported constants ───────────────────────────────────────────

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

// ── Firestore helpers ────────────────────────────────────────────

function firestoreDocToObj(docSnap) {
  const data = docSnap.data();
  const obj = { id: docSnap.id, ...data };
  // Convert any Firestore Timestamps to ISO strings
  for (const [key, val] of Object.entries(obj)) {
    if (val instanceof Timestamp) {
      obj[key] = val.toDate().toISOString();
    }
  }
  return obj;
}

// ── Provider ─────────────────────────────────────────────────────

export function InventoryProvider({ children }) {
  const [items, setItems] = useState(() => (useFirestore ? [] : loadFromStorage(STORAGE_KEYS.items)));
  const [trips, setTrips] = useState(() => (useFirestore ? [] : loadFromStorage(STORAGE_KEYS.trips)));
  const [checkouts, setCheckouts] = useState(() =>
    useFirestore ? [] : loadFromStorage(STORAGE_KEYS.checkouts)
  );
  const [activityLog, setActivityLog] = useState(() =>
    useFirestore ? [] : loadFromStorage(STORAGE_KEYS.activityLog)
  );
  const [loading, setLoading] = useState(useFirestore);

  // ── Real-time Firestore listeners ──────────────────────────────

  useEffect(() => {
    if (!useFirestore) return;

    let loaded = 0;
    const markLoaded = () => {
      loaded += 1;
      if (loaded === 4) setLoading(false);
    };

    const unsubItems = onSnapshot(
      query(collection(db, 'items'), orderBy('createdAt', 'desc')),
      (snap) => {
        setItems(snap.docs.map(firestoreDocToObj));
        markLoaded();
      }
    );

    const unsubTrips = onSnapshot(
      query(collection(db, 'trips'), orderBy('createdAt', 'desc')),
      (snap) => {
        setTrips(snap.docs.map(firestoreDocToObj));
        markLoaded();
      }
    );

    const unsubCheckouts = onSnapshot(
      query(collection(db, 'checkouts'), orderBy('checkedOutAt', 'desc')),
      (snap) => {
        setCheckouts(snap.docs.map(firestoreDocToObj));
        markLoaded();
      }
    );

    const unsubActivity = onSnapshot(
      query(collection(db, 'activityLog'), orderBy('timestamp', 'desc')),
      (snap) => {
        setActivityLog(snap.docs.map(firestoreDocToObj));
        markLoaded();
      }
    );

    return () => {
      unsubItems();
      unsubTrips();
      unsubCheckouts();
      unsubActivity();
    };
  }, []);

  // ── localStorage persistence (only when Firebase is off) ───────

  useEffect(() => {
    if (!useFirestore) saveToStorage(STORAGE_KEYS.items, items);
  }, [items]);
  useEffect(() => {
    if (!useFirestore) saveToStorage(STORAGE_KEYS.trips, trips);
  }, [trips]);
  useEffect(() => {
    if (!useFirestore) saveToStorage(STORAGE_KEYS.checkouts, checkouts);
  }, [checkouts]);
  useEffect(() => {
    if (!useFirestore) saveToStorage(STORAGE_KEYS.activityLog, activityLog);
  }, [activityLog]);

  // ── Activity log ───────────────────────────────────────────────

  const addActivity = useCallback(async (action, details) => {
    const entry = {
      action,
      details,
      timestamp: useFirestore ? serverTimestamp() : new Date().toISOString(),
    };
    if (useFirestore) {
      await addDoc(collection(db, 'activityLog'), entry);
    } else {
      entry.id = crypto.randomUUID();
      entry.timestamp = new Date().toISOString();
      setActivityLog((prev) => [entry, ...prev]);
    }
  }, []);

  // ── Items ──────────────────────────────────────────────────────

  const addItem = useCallback(
    async (item) => {
      const now = useFirestore ? serverTimestamp() : new Date().toISOString();
      const newItem = {
        ...item,
        status: ITEM_STATUS.IN_STORAGE,
        createdAt: now,
      };

      if (useFirestore) {
        const docRef = await addDoc(collection(db, 'items'), newItem);
        const created = { ...newItem, id: docRef.id, createdAt: new Date().toISOString() };
        addActivity('added', `Added "${item.name}" (${item.category}) to inventory`);
        return created;
      } else {
        newItem.id = crypto.randomUUID();
        setItems((prev) => [...prev, newItem]);
        addActivity('added', `Added "${newItem.name}" (${newItem.category}) to inventory`);
        return newItem;
      }
    },
    [addActivity]
  );

  const updateItem = useCallback(
    async (id, updates) => {
      if (useFirestore) {
        await updateDoc(doc(db, 'items', id), updates);
      } else {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
      }
      const item = items.find((i) => i.id === id);
      if (item) {
        addActivity('updated', `Updated "${item.name}"`);
      }
    },
    [items, addActivity]
  );

  const deleteItem = useCallback(
    async (id) => {
      const item = items.find((i) => i.id === id);

      if (useFirestore) {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'items', id));
        // Also delete associated checkouts
        const relatedCheckouts = checkouts.filter((c) => c.itemId === id);
        relatedCheckouts.forEach((c) => batch.delete(doc(db, 'checkouts', c.id)));
        await batch.commit();
      } else {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setCheckouts((prev) => prev.filter((c) => c.itemId !== id));
      }

      if (item) {
        addActivity('deleted', `Removed "${item.name}" from inventory`);
      }
    },
    [items, checkouts, addActivity]
  );

  // ── Trips ──────────────────────────────────────────────────────

  const addTrip = useCallback(
    async (trip) => {
      const now = useFirestore ? serverTimestamp() : new Date().toISOString();
      const newTrip = {
        ...trip,
        status: 'Upcoming',
        createdAt: now,
      };

      if (useFirestore) {
        const docRef = await addDoc(collection(db, 'trips'), newTrip);
        const created = { ...newTrip, id: docRef.id, createdAt: new Date().toISOString() };
        addActivity('trip_created', `Created trip "${trip.name}"`);
        return created;
      } else {
        newTrip.id = crypto.randomUUID();
        setTrips((prev) => [...prev, newTrip]);
        addActivity('trip_created', `Created trip "${newTrip.name}"`);
        return newTrip;
      }
    },
    [addActivity]
  );

  const updateTrip = useCallback(
    async (id, updates) => {
      if (useFirestore) {
        await updateDoc(doc(db, 'trips', id), updates);
      } else {
        setTrips((prev) => prev.map((trip) => (trip.id === id ? { ...trip, ...updates } : trip)));
      }
    },
    []
  );

  // ── Checkouts ──────────────────────────────────────────────────

  const checkoutItem = useCallback(
    async (itemId, tripId, quantity, checkedOutBy) => {
      const now = useFirestore ? serverTimestamp() : new Date().toISOString();
      const checkout = {
        itemId,
        tripId,
        quantity,
        checkedOutBy,
        checkedOutAt: now,
        returnedAt: null,
        returnedBy: null,
        returnCondition: null,
        returnNotes: null,
      };

      const item = items.find((i) => i.id === itemId);
      const trip = trips.find((t) => t.id === tripId);

      if (useFirestore) {
        const batch = writeBatch(db);
        const checkoutRef = doc(collection(db, 'checkouts'));
        batch.set(checkoutRef, checkout);
        batch.update(doc(db, 'items', itemId), { status: ITEM_STATUS.CHECKED_OUT });
        await batch.commit();
        checkout.id = checkoutRef.id;
        checkout.checkedOutAt = new Date().toISOString();
      } else {
        checkout.id = crypto.randomUUID();
        setCheckouts((prev) => [...prev, checkout]);
        if (item) {
          setItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, status: ITEM_STATUS.CHECKED_OUT } : i))
          );
        }
      }

      addActivity(
        'checked_out',
        `${checkedOutBy} checked out "${item?.name}" (qty: ${quantity}) for "${trip?.name}"`
      );
      return checkout;
    },
    [items, trips, addActivity]
  );

  const returnItem = useCallback(
    async (checkoutId, returnedBy, condition, notes) => {
      const checkout = checkouts.find((c) => c.id === checkoutId);
      if (!checkout) return;

      const item = items.find((i) => i.id === checkout.itemId);
      const activeCheckouts = checkouts.filter(
        (c) => c.itemId === checkout.itemId && !c.returnedAt && c.id !== checkoutId
      );
      const newStatus =
        condition === 'Needs Repair' ? ITEM_STATUS.DAMAGED : ITEM_STATUS.IN_STORAGE;

      if (useFirestore) {
        const batch = writeBatch(db);
        batch.update(doc(db, 'checkouts', checkoutId), {
          returnedAt: serverTimestamp(),
          returnedBy,
          returnCondition: condition,
          returnNotes: notes,
        });
        if (activeCheckouts.length === 0) {
          batch.update(doc(db, 'items', checkout.itemId), { status: newStatus, condition });
        }
        await batch.commit();
      } else {
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
        if (activeCheckouts.length === 0) {
          setItems((prev) =>
            prev.map((i) =>
              i.id === checkout.itemId ? { ...i, status: newStatus, condition } : i
            )
          );
        }
      }

      addActivity(
        'returned',
        `${returnedBy} returned "${item?.name}" — Condition: ${condition}${notes ? ` — ${notes}` : ''}`
      );
    },
    [checkouts, items, addActivity]
  );

  // ── Derived data ───────────────────────────────────────────────

  const getItemCheckouts = useCallback(
    (itemId) => {
      return checkouts
        .filter((c) => c.itemId === itemId)
        .sort((a, b) => new Date(b.checkedOutAt) - new Date(a.checkedOutAt));
    },
    [checkouts]
  );

  const getTripCheckouts = useCallback(
    (tripId) => {
      return checkouts.filter((c) => c.tripId === tripId);
    },
    [checkouts]
  );

  const getAvailableItems = useCallback(() => {
    return items.filter((i) => i.status === ITEM_STATUS.IN_STORAGE);
  }, [items]);

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
        loading,
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
