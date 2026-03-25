import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InventoryProvider } from '../context/InventoryContext';

export default function renderWithProviders(ui, { route = '/', ...options } = {}) {
  return render(
    <InventoryProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </InventoryProvider>,
    options
  );
}
