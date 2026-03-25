import { Warehouse, Truck, AlertTriangle, XCircle } from 'lucide-react';
import { ITEM_STATUS } from '../context/InventoryContext';

const statusConfig = {
  [ITEM_STATUS.IN_STORAGE]: {
    color: 'bg-emerald-100 text-emerald-700',
    icon: Warehouse,
  },
  [ITEM_STATUS.CHECKED_OUT]: {
    color: 'bg-amber-100 text-amber-700',
    icon: Truck,
  },
  [ITEM_STATUS.DAMAGED]: {
    color: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
  },
  [ITEM_STATUS.LOST]: {
    color: 'bg-gray-100 text-gray-500',
    icon: XCircle,
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig[ITEM_STATUS.IN_STORAGE];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon size={12} />
      {status}
    </span>
  );
}
