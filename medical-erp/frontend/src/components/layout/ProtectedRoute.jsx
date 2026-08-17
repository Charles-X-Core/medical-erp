import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ErpLayout from './ErpLayout';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: '#062B52' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <ErpLayout>{children}</ErpLayout>;
}
