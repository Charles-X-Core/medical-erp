import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import DashboardPage from './pages/DashboardPage';
import PacientesPage from './pages/PacientesPage';
import PacienteFormPage from './pages/PacienteFormPage';
import PacienteDetailPage from './pages/PacienteDetailPage';
import HistoriaClinicaPage from './pages/HistoriaClinicaPage';
import ConsultaFormPage from './pages/ConsultaFormPage';
import ConsultaDetailPage from './pages/ConsultaDetailPage';
import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes"
        element={
          <ProtectedRoute>
            <PacientesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes/nuevo"
        element={
          <ProtectedRoute>
            <PacienteFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes/:id"
        element={
          <ProtectedRoute>
            <PacienteDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes/:id/editar"
        element={
          <ProtectedRoute>
            <PacienteFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes/:pacienteId/historia"
        element={
          <ProtectedRoute>
            <HistoriaClinicaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historia/:historiaId/consulta/nueva"
        element={
          <ProtectedRoute>
            <ConsultaFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultas/:id"
        element={
          <ProtectedRoute>
            <ConsultaDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultas/:id/editar"
        element={
          <ProtectedRoute>
            <ConsultaFormPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
