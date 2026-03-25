import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { InventoryProvider } from './context/InventoryContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InventoryList from './pages/InventoryList';
import ItemForm from './pages/ItemForm';
import ItemDetail from './pages/ItemDetail';
import TripList from './pages/TripList';
import TripDetail from './pages/TripDetail';

export default function App() {
  return (
    <InventoryProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </InventoryProvider>
  );
}
