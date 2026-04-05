import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import Users from './pages/Users';
import NotFound from './pages/NotFound';
import { FullPageLoader } from './components/LoadingState';

function ProtectedRoute({ children, reqRole, allowedRoles }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader label="Loading your workspace..." />;
  if (!user) return <Navigate to="/login" />;
  if (reqRole && user.role !== reqRole && user.role !== 'ADMIN') return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'ADMIN') return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="records" element={<ProtectedRoute allowedRoles={['ANALYST']}><Records /></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute reqRole="ADMIN"><Users /></ProtectedRoute>} />
          </Route>

          {/* 404 catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
