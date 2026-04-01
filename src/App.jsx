import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InventoryList from './pages/InventoryList';
import ItemForm from './pages/ItemForm';
import ItemDetail from './pages/ItemDetail';
import TripList from './pages/TripList';
import TripDetail from './pages/TripDetail';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading inventory...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { loading } = useInventory();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/inventory/add" element={<ItemForm />} />
        <Route path="/inventory/:id" element={<ItemDetail />} />
        <Route path="/inventory/:id/edit" element={<ItemForm />} />
        <Route path="/trips" element={<TripList />} />
        <Route path="/trips/:id" element={<TripDetail />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </InventoryProvider>
  );
}
