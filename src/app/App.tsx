import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { AppModeProvider } from '@/shared/contexts/AppModeContext';
import { DataProvider } from '@/shared/contexts/DataContext';
import { AppRoutes } from './routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppModeProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AppModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
