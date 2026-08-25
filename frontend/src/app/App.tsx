import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers';
import { AppRoutes } from './router/routes';
import { RouteErrorBoundary } from './router/RouteErrorBoundary';

export const App = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        <RouteErrorBoundary>
          <AppRoutes />
        </RouteErrorBoundary>
      </BrowserRouter>
    </AppProviders>
  );
};
