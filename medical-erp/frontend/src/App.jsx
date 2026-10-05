import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import InicioPage from './pages/InicioPage';
import PacienteFormPage from './pages/PacienteFormPage';
import Paciente360Page from './pages/Paciente360Page';
import AtencionWorkspace from './pages/AtencionWorkspace';
import HistoriaClinicaPage from './pages/HistoriaClinicaPage';
import ConsultaFormPage from './pages/ConsultaFormPage';
import ConsultaDetailPage from './pages/ConsultaDetailPage';
import AdmisionPage from './pages/AdmisionPage';
import SesionClinicaPage from './pages/SesionClinicaPage';
import AgendaPage from './pages/AgendaPage';
import CentroDatosPage from './pages/CentroDatosPage';
import FirmaPage from './pages/FirmaPage';
import ContratoPWA from './pages/ContratoPWA';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import SessionTimerProvider from './context/SessionTimerProvider';
import { useZona } from './utils/zonaHoraria';

function App() {
  // Al alternar CA/PE la raíz se re-renderiza y toda la app repinta las horas
  useZona();

  return (
    <SessionTimerProvider>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />

      <Route path="/inicio" element={<ProtectedRoute><InicioPage /></ProtectedRoute>} />

      {/* Admisión */}
      <Route path="/admision" element={<ProtectedRoute><AdmisionPage /></ProtectedRoute>} />
      <Route path="/admision/sesion" element={<ProtectedRoute><SesionClinicaPage /></ProtectedRoute>} />

      {/* Pacientes (rutas de detalle/workflow — el listado ahora es /admision) */}
      <Route path="/pacientes/nuevo" element={<ProtectedRoute><PacienteFormPage /></ProtectedRoute>} />
      <Route path="/pacientes/:id/workspace" element={<ProtectedRoute><AtencionWorkspace /></ProtectedRoute>} />
      <Route path="/pacientes/:id/detalle" element={<ProtectedRoute><Paciente360Page /></ProtectedRoute>} />
      <Route path="/pacientes/:id/editar" element={<ProtectedRoute><PacienteFormPage /></ProtectedRoute>} />
      <Route path="/pacientes/:pacienteId/historia" element={<ProtectedRoute><HistoriaClinicaPage /></ProtectedRoute>} />

      <Route path="/historia/:historiaId" element={<ProtectedRoute><HistoriaClinicaPage /></ProtectedRoute>} />
      <Route path="/historia/:historiaId/consulta/nueva" element={<ProtectedRoute><ConsultaFormPage /></ProtectedRoute>} />
      <Route path="/consultas/:id" element={<ProtectedRoute><ConsultaDetailPage /></ProtectedRoute>} />
      <Route path="/consultas/:id/editar" element={<ProtectedRoute><ConsultaFormPage /></ProtectedRoute>} />

      {/* Agenda */}
      <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />

      {/* Centro de Datos */}
      <Route path="/centro-datos" element={<ProtectedRoute><CentroDatosPage /></ProtectedRoute>} />

      {/* Firma publica */}
      <Route path="/firma" element={<FirmaPage />} />

      {/* Contrato PWA kiosco */}
      <Route path="/contrato" element={<ContratoPWA />} />

      {/* Redirects */}
      <Route path="/pacientes" element={<Navigate to="/admision" replace />} />
      <Route path="/dashboard" element={<Navigate to="/inicio" replace />} />
      <Route path="/recepcion" element={<Navigate to="/admision" replace />} />
      <Route path="/" element={<Navigate to="/inicio" replace />} />

      {/* 404 catch-all */}
      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SessionTimerProvider>
  );
}

export default App;
