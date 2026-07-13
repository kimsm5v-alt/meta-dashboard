import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { DataProvider } from '@/shared/contexts/DataContext';
// import { AppRoutes } from './routes'; // 레거시 라우트
import { AppRoutesV2 } from './routesV2'; // 신규 IA 라우트

function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AuthProvider>
        <DataProvider>
          <AppRoutesV2 />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
