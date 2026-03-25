import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  PlusCircle,
  RotateCcw,
  Map,
  Warehouse,
  Truck,
} from 'lucide-react';
import { useInventory, CONDITIONS } from '../context/InventoryContext';
import StatusBadge from '../components/StatusBadge';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    trips,
    items,
    getTripCheckouts,
    getAvailableItems,
    checkoutItem,
    returnItem,
    updateTrip,
  } = useInventory();

  const trip = trips.find((t) => t.id === id);
  const tripCheckouts = getTripCheckouts(id);
  const activeCheckouts = tripCheckouts.filter((c) => !c.returnedAt);
  const returnedCheckouts = tripCheckouts.filter((c) => c.returnedAt);
  const availableItems = getAvailableItems();

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    itemId: '',
    quantity: 1,
    checkedOutBy: '',
  });
  const [returnModal, setReturnModal] = useState(null);
  const [returnForm, setReturnForm] = useState({
    returnedBy: '',
    condition: 'Good',
    notes: '',
  });

  if (!trip) {
    return (
      <div className="text-center py-12">
        <Map size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Trip not found</h2>
        <Link to="/trips" className="text-emerald-600 text-sm hover:underline">
          Back to trips
        </Link>
      </div>
    );
  }

  function handleCheckout(e) {
    e.preventDefault();
    checkoutItem(
      checkoutForm.itemId,
      id,
      checkoutForm.quantity,
      checkoutForm.checkedOutBy
    );
    setCheckoutForm({ itemId: '', quantity: 1, checkedOutBy: '' });
    setShowCheckout(false);
  }

  function handleReturn(e) {
    e.preventDefault();
    returnItem(
      returnModal.id,
      returnForm.returnedBy,
      returnForm.condition,
      returnForm.notes
    );
    setReturnModal(null);
    setReturnForm({ returnedBy: '', condition: 'Good', notes: '' });
  }

  function getItemName(itemId) {
    return items.find((i) => i.id === itemId)?.name || 'Unknown Item';
  }

  function handleStatusChange(newStatus) {
    updateTrip(id, { status: newStatus });
  }

  return (
    <div>
      <button
        onClick={() => navigate('/trips')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={16} />
        Back to Trips
      </button>

      {/* Trip Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{trip.name}</h1>
            <p className="text-sm text-gray-500">
              {trip.startDate
                ? `${new Date(trip.startDate).toLocaleDateString()} — ${new Date(trip.endDate).toLocaleDateString()}`
                : 'No dates set'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={trip.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="flex gap-6 text-sm text-gray-500 mt-3">
          <span className="flex items-center gap-1.5">
            <Truck size={14} className="text-amber-500" />
            {activeCheckouts.length} checked out
          </span>
          <span className="flex items-center gap-1.5">
            <Warehouse size={14} className="text-emerald-500" />
            {returnedCheckouts.length} returned
          </span>
        </div>
      </div>

      {/* Checkout Gear Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Checked-Out Gear</h2>
        <button
          onClick={() => setShowCheckout(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <PlusCircle size={16} />
          Check Out Gear
        </button>
      </div>

      {/* Checkout Form */}
      {showCheckout && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4">
          <h3 className="font-medium text-gray-900 mb-3">Check Out Gear for This Trip</h3>
          {availableItems.length === 0 ? (
            <p className="text-sm text-gray-500">
              No items available. All gear is currently checked out or{' '}
              <Link to="/inventory/add" className="text-emerald-600 hover:underline">
                add new items
              </Link>{' '}
              first.
            </p>
          ) : (
            <form onSubmit={handleCheckout} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
                  <select
                    required
                    value={checkoutForm.itemId}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, itemId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select item...</option>
                    {availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={checkoutForm.quantity}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Checked Out By
                  </label>
                  <input
                    type="text"
                    required
                    value={checkoutForm.checkedOutBy}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, checkedOutBy: e.target.value })
                    }
                    placeholder="Name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                >
                  Check Out
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Active Checkouts */}
      {activeCheckouts.length === 0 && !showCheckout ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
          <p className="text-sm text-gray-400">No gear currently checked out for this trip.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {activeCheckouts.map((checkout) => (
            <div
              key={checkout.id}
              className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">{getItemName(checkout.itemId)}</p>
                <p className="text-xs text-gray-500">
                  Qty: {checkout.quantity} &middot; By {checkout.checkedOutBy} &middot;{' '}
                  {new Date(checkout.checkedOutAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setReturnModal(checkout)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                <RotateCcw size={14} />
                Return
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Return Gear</h3>
            <p className="text-sm text-gray-500 mb-4">
              Returning: {getItemName(returnModal.itemId)}
            </p>
            <form onSubmit={handleReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Returned By *
                </label>
                <input
                  type="text"
                  required
                  value={returnForm.returnedBy}
                  onChange={(e) =>
                    setReturnForm({ ...returnForm, returnedBy: e.target.value })
                  }
                  placeholder="Your name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition on Return
                </label>
                <select
                  value={returnForm.condition}
                  onChange={(e) =>
                    setReturnForm({ ...returnForm, condition: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={returnForm.notes}
                  onChange={(e) =>
                    setReturnForm({ ...returnForm, notes: e.target.value })
                  }
                  rows={2}
                  placeholder="Any notes about the return..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                >
                  Confirm Return
                </button>
                <button
                  type="button"
                  onClick={() => setReturnModal(null)}
                  className="px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Returned Gear */}
      {returnedCheckouts.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Returned Gear</h2>
          <div className="space-y-2">
            {returnedCheckouts.map((checkout) => (
              <div
                key={checkout.id}
                className="bg-emerald-50 border border-emerald-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {getItemName(checkout.itemId)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Returned by {checkout.returnedBy} on{' '}
                      {new Date(checkout.returnedAt).toLocaleString()} &middot; Condition:{' '}
                      {checkout.returnCondition}
                    </p>
                    {checkout.returnNotes && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Notes: {checkout.returnNotes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <Warehouse size={16} />
                    <span className="text-xs font-medium">In Storage</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
