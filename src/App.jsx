import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InventoryList from './pages/InventoryList';
import ItemForm from './pages/ItemForm';
import ItemDetail from './pages/ItemDetail';
import TripList from './pages/TripList';
import TripDetail from './pages/TripDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';

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

function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function PublicRoute({ children }) {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  return children;
}

function AppRoutes() {
  const { loading: inventoryLoading } = useInventory();
  const { loading: authLoading } = useAuth();

  if (authLoading) return <LoadingScreen />;

  return (
    <Routes>
      <Route
        path="/login"
        element={<PublicRoute><Login /></PublicRoute>}
      />
      <Route
        path="/signup"
        element={<PublicRoute><Signup /></PublicRoute>}
      />
      <Route
        element={
          <ProtectedRoute>
            {inventoryLoading ? <LoadingScreen /> : <Layout />}
          </ProtectedRoute>
        }
      >
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
    <AuthProvider>
      <InventoryProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </InventoryProvider>
    </AuthProvider>
  );
}
