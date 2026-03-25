import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Map, Calendar } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export default function TripList() {
  const { trips, addTrip, getTripCheckouts } = useInventory();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });

  function handleSubmit(e) {
    e.preventDefault();
    const trip = addTrip(form);
    setForm({ name: '', startDate: '', endDate: '' });
    setShowForm(false);
    navigate(`/trips/${trip.id}`);
  }

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-500 text-sm">Manage camping trips and gear checkouts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <PlusCircle size={16} />
          New Trip
        </button>
      </div>

      {/* New Trip Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Create New Trip</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Spring Camporee 2026"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
              >
                Create Trip
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trip List */}
      {sortedTrips.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Map size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No trips yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create a trip to start checking out gear.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
          >
            <PlusCircle size={16} />
            Create First Trip
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTrips.map((trip) => {
            const tripCheckouts = getTripCheckouts(trip.id);
            const activeCheckouts = tripCheckouts.filter((c) => !c.returnedAt);
            const returnedCheckouts = tripCheckouts.filter((c) => c.returnedAt);

            return (
              <div
                key={trip.id}
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{trip.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>
                        {trip.startDate
                          ? `${new Date(trip.startDate).toLocaleDateString()} — ${new Date(trip.endDate).toLocaleDateString()}`
                          : 'No dates set'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      trip.status === 'Completed'
                        ? 'bg-gray-100 text-gray-600'
                        : trip.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {trip.status}
                  </span>
                </div>
                {tripCheckouts.length > 0 && (
                  <div className="mt-3 flex gap-4 text-xs text-gray-500">
                    <span>{activeCheckouts.length} checked out</span>
                    <span>{returnedCheckouts.length} returned</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
