import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { DataProvider } from '@/shared/contexts/DataContext';
import { ApiDevModeProvider } from '@/shared/contexts/ApiDevModeContext';
import { ApiDevToggle } from '@/shared/components/api-tooltip';
import { AppRoutes } from './routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <ApiDevModeProvider>
            <AppRoutes />
            <ApiDevToggle />
          </ApiDevModeProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
