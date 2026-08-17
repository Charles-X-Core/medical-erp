import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Loader2, User, FileText, Activity, Shield, Image, Clock } from 'lucide-react';
import { pacienteService } from '../services/pacienteService';
import { historiaClinicaService } from '../services/historiaClinicaService';
import PacienteFormModal from '../components/paciente360/PacienteFormModal';
import WorkspaceHeader from '../components/paciente360/WorkspaceHeader';
import WorkspaceTabs from '../components/paciente360/WorkspaceTabs';
import WorkspaceTimeline from '../components/paciente360/WorkspaceTimeline';
import ResumenTab from '../components/paciente360/ResumenTab';
import TabClinico from '../components/paciente360/TabClinico';
import TabTratamientos from '../components/paciente360/TabTratamientos';
import TabConsentimientos from '../components/paciente360/TabConsentimientos';
import TabArchivos from '../components/paciente360/TabArchivos';
import TabTimeline from '../components/paciente360/TabTimeline';

const TABS = [
  { id: 'general', label: 'Resumen', icon: User },
  { id: 'clinico', label: 'Historia Clínica', icon: FileText },
  { id: 'tratamientos', label: 'Tratamientos', icon: Activity },
  { id: 'consentimientos', label: 'Consentimientos', icon: Shield },
  { id: 'archivos', label: 'Archivos Clínicos', icon: Image },
  { id: 'timeline', label: 'Timeline', icon: Clock },
];

export default function Paciente360Page() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'general');
  const [paciente, setPaciente] = useState(null);
  const [historia, setHistoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, hRes] = await Promise.all([
        pacienteService.getById(id),
        historiaClinicaService.getByPaciente(id).catch(() => ({ success: false })),
      ]);

      if (pRes.success) setPaciente(pRes.data);
      if (hRes.success) setHistoria(hRes.data);
    } catch (err) {
      setError(err.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSaveEdit = () => {
    load();
  };

  if (loading) {
    return (
      <div className="workspace">
        <div className="workspace__loading">
          <Loader2 size={32} className="spinner" />
          <p>Cargando workspace del paciente...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="workspace">
        <div className="workspace__error">{error || 'Paciente no encontrado'}</div>
      </div>
    );
  }

  return (
    <div className="workspace workspace--light">
      {/* Patient Header */}
      <WorkspaceHeader
        paciente={paciente}
        onEdit={() => navigate('/pacientes')}
        onMoreActions={() => setShowEditModal(true)}
      />

      {/* 3-Column Body */}
      <div className="workspace__body">
        {/* Left: Tabs */}
        <WorkspaceTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* Center: Content */}
        <div className="workspace__content">
          {activeTab === 'general' && (
            <ResumenTab paciente={paciente} historia={historia} pacienteId={id} />
          )}
          {activeTab === 'clinico' && (
            <TabClinico pacienteId={id} historiaId={historia?.id} />
          )}
          {activeTab === 'tratamientos' && (
            <TabTratamientos pacienteId={id} historiaId={historia?.id} />
          )}
          {activeTab === 'consentimientos' && (
            <TabConsentimientos pacienteId={id} />
          )}
          {activeTab === 'archivos' && (
            <TabArchivos pacienteId={id} />
          )}
          {activeTab === 'timeline' && (
            <TabTimeline pacienteId={id} />
          )}
        </div>

        {/* Right: Timeline Sidebar */}
        <WorkspaceTimeline pacienteId={id} />
      </div>

      {/* Edit Modal */}
      <PacienteFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
        pacienteId={id}
      />
    </div>
  );
}
