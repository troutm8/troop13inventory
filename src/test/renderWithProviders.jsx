import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InventoryProvider } from '../context/InventoryContext';
import { AuthProvider } from '../context/AuthContext';

export default function renderWithProviders(ui, { route = '/', ...options } = {}) {
  return render(
    <AuthProvider>
      <InventoryProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </InventoryProvider>
    </AuthProvider>,
    options
  );
}
