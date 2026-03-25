import { Link } from 'react-router-dom';
import { Package, Warehouse, Truck, AlertTriangle, Map, PlusCircle, ClipboardList } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { stats, activityLog } = useInventory();
  const recentActivity = activityLog.slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Overview of your troop's gear inventory</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/inventory/add"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <PlusCircle size={16} />
            Add Item
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Total Items" value={stats.totalItems} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Warehouse} label="In Storage" value={stats.inStorage} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={Truck} label="Checked Out" value={stats.checkedOut} color="bg-amber-100 text-amber-600" />
        <StatCard icon={AlertTriangle} label="Damaged" value={stats.damaged} color="bg-red-100 text-red-600" />
      </div>

      {/* Quick Actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              to="/inventory/add"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <PlusCircle size={18} className="text-emerald-600" />
              Add new gear item
            </Link>
            <Link
              to="/trips"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <Map size={18} className="text-blue-600" />
              Manage trips
            </Link>
            <Link
              to="/inventory"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <ClipboardList size={18} className="text-purple-600" />
              View full inventory
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">
              No activity yet. Start by adding gear to your inventory!
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-gray-700">{entry.details}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
