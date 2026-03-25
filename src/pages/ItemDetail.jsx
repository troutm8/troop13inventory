import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Clock, User, Package, Truck } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import StatusBadge from '../components/StatusBadge';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, deleteItem, getItemCheckouts, trips } = useInventory();

  const item = items.find((i) => i.id === id);
  const checkouts = getItemCheckouts(id);

  if (!item) {
    return (
      <div className="text-center py-12">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Item not found</h2>
        <Link to="/inventory" className="text-emerald-600 text-sm hover:underline">
          Back to inventory
        </Link>
      </div>
    );
  }

  function handleDelete() {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteItem(item.id);
      navigate('/inventory');
    }
  }

  function getTripName(tripId) {
    const trip = trips.find((t) => t.id === tripId);
    return trip?.name || 'Unknown Trip';
  }

  return (
    <div>
      <button
        onClick={() => navigate('/inventory')}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={16} />
        Back to Inventory
      </button>

      {/* Item Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{item.name}</h1>
            <p className="text-sm text-gray-500">{item.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/inventory/${item.id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Pencil size={14} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <StatusBadge status={item.status} />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Quantity</p>
            <p className="text-sm font-medium text-gray-900">{item.quantity}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Condition</p>
            <p className="text-sm font-medium text-gray-900">{item.condition}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Added</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {item.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{item.description}</p>
          </div>
        )}
      </div>

      {/* Checkout History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">History</h2>

        {checkouts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No checkout history for this item yet.
          </p>
        ) : (
          <div className="space-y-4">
            {checkouts.map((checkout) => (
              <div
                key={checkout.id}
                className={`border rounded-lg p-4 ${
                  checkout.returnedAt
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-amber-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {getTripName(checkout.tripId)}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      checkout.returnedAt
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {checkout.returnedAt ? 'Returned' : 'Checked Out'}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <User size={12} />
                    <span>Checked out by {checkout.checkedOutBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} />
                    <span>{new Date(checkout.checkedOutAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-500">Qty: {checkout.quantity}</div>
                </div>

                {checkout.returnedAt && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-emerald-600" />
                      <span>Returned by {checkout.returnedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-emerald-600" />
                      <span>{new Date(checkout.returnedAt).toLocaleString()}</span>
                    </div>
                    {checkout.returnCondition && (
                      <div className="text-xs">Condition: {checkout.returnCondition}</div>
                    )}
                    {checkout.returnNotes && (
                      <div className="text-xs text-gray-500">Notes: {checkout.returnNotes}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
