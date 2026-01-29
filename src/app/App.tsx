import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { routes } from './routes';

function App() {
  return (
    <Layout>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        
        {/* 기본 리다이렉트 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
