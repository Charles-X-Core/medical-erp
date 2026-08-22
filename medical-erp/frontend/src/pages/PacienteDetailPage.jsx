import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, FileText, Loader2 } from 'lucide-react';
import { pacienteService } from '../services/pacienteService';

export default function PacienteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('datos');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pacienteService.getById(id);
      if (res.success) {
        setPaciente(res.data);
      } else {
        setError(res.message || 'Error al cargar');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!confirm('¿Eliminar cliente? Esta acción es irreversible.')) return;
    try {
      await pacienteService.delete(id);
      navigate('/pacientes');
    } catch (err) {
      setError(err.message || 'Error al eliminar');
    }
  };

  if (loading) {
    return (
      <div className="paciente-detail-page">
        <div className="paciente-detail-page__loading">
          <Loader2 size={32} className="spinner" />
          <p>Cargando cliente...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="paciente-detail-page">
        <p className="paciente-detail-page__error">{error || 'Cliente no encontrado'}</p>
      </div>
    );
  }

  const fullName = `${paciente.apellidoPaterno} ${paciente.apellidoMaterno || ''}, ${paciente.nombres}`;

  return (
    <div className="paciente-detail-page">
      <div className="paciente-detail-page__header">
        <button className="btn btn--ghost" onClick={() => navigate('/pacientes')}>
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="paciente-detail-page__title-group">
          <h2 className="paciente-detail-page__title">{fullName}</h2>
          <span className={`estado-badge estado-badge--${paciente.estado || 'activo'}`}>{paciente.estado || 'activo'}</span>
          <span className="pais-badge">{paciente.pais || 'PE'}</span>
        </div>
        <div className="paciente-detail-page__actions">
          <button className="btn btn--secondary" onClick={() => navigate(`/pacientes/${id}/editar`)}>
            <Pencil size={18} /> Editar
          </button>
          <button className="btn btn--danger" onClick={handleDelete}>
            <Trash2 size={18} /> Eliminar
          </button>
        </div>
      </div>

      {error && <div className="paciente-detail-page__error">{error}</div>}

      <div className="paciente-detail-page__tabs">
        {['datos', 'documentos', 'seguros', 'consentimientos', 'historia'].map((tab) => (
          <button
            key={tab}
            className={`paciente-detail-page__tab ${activeTab === tab ? 'paciente-detail-page__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="paciente-detail-page__content">
        {activeTab === 'datos' && (
          <div className="detail-grid">
            <div className="detail-card">
              <h4>Datos Personales</h4>
              <p><strong>Nombre:</strong> {paciente.nombres}</p>
              <p><strong>Apellidos:</strong> {paciente.apellidoPaterno} {paciente.apellidoMaterno}</p>
              <p><strong>ID:</strong> {paciente.licenciaConducir || '-'}</p>
              <p><strong>Sexo:</strong> {paciente.sexo || '-'}</p>
              <p><strong>Fecha Nac.:</strong> {paciente.fechaNacimiento || '-'}</p>
              <p><strong>Estado Civil:</strong> {paciente.estadoCivil || '-'}</p>
              <p><strong>Peso:</strong> {paciente.peso ? `${paciente.peso} kg` : '-'}</p>
              <p><strong>Estatura:</strong> {paciente.estatura ? `${paciente.estatura} cm` : '-'}</p>
            </div>
            <div className="detail-card">
              <h4>Contacto</h4>
              <p><strong>Teléfono:</strong> {paciente.telefono || '-'}</p>
              <p><strong>Email:</strong> {paciente.email || '-'}</p>
              <p><strong>Ciudad/Estado:</strong> {paciente.ciudadEstado || '-'}</p>
              <p><strong>Dirección:</strong> {paciente.direccion || '-'}</p>
              <p><strong>Lugar Nac.:</strong> {paciente.lugarNacimiento || '-'}</p>
              <p><strong>Procedencia:</strong> {paciente.lugarProcedencia || '-'}</p>
              <p><strong>Ocupación:</strong> {paciente.ocupacion || '-'}</p>
            </div>
            <div className="detail-card">
              <h4>Emergencia</h4>
              <p><strong>Acompañante:</strong> {paciente.nombreAcompanante || '-'}</p>
              <p><strong>Contacto:</strong> {paciente.contactoEmergencia || '-'}</p>
              <p><strong>Teléfono:</strong> {paciente.telefonoEmergencia || '-'}</p>
              <p><strong>Parentesco:</strong> {paciente.parentescoEmergencia || '-'}</p>
            </div>
            <div className="detail-card detail-card--full">
              <h4>Antecedentes</h4>
              <p><strong>Alergias:</strong> {paciente.alergias || '-'}</p>
              <p><strong>Medicamentos Actuales:</strong> {paciente.medicamentosActuales || '-'}</p>
              <p><strong>Personales:</strong> {paciente.antecedentesPersonales || '-'}</p>
              <p><strong>Familiares:</strong> {paciente.antecedentesFamiliares || '-'}</p>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="detail-card">
            <h4>Documentos de Identidad</h4>
            {(paciente.documentos || []).length === 0 ? (
              <p>Sin documentos adicionales</p>
            ) : (
              <ul className="detail-list">
                {paciente.documentos.map((doc) => (
                  <li key={doc.id}>
                    <strong>{doc.tipoDocumento}</strong> {doc.numeroDocumento}
                    {doc.esPrincipal && <span className="badge badge--primary">Principal</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'seguros' && (
          <div className="detail-card">
            <h4>Seguros Médicos</h4>
            {(paciente.seguros || []).length === 0 ? (
              <p>Sin seguros registrados</p>
            ) : (
              <ul className="detail-list">
                {paciente.seguros.map((seg) => (
                  <li key={seg.id}>
                    <strong>{seg.tipoSeguro}</strong> {seg.provider} - Policy: {seg.policyNumber}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'consentimientos' && (
          <div className="detail-card">
            <h4>Consentimientos</h4>
            {(paciente.consentimientos || []).length === 0 ? (
              <p>Sin consentimientos registrados</p>
            ) : (
              <ul className="detail-list">
                {paciente.consentimientos.map((c) => (
                  <li key={c.id}>
                    <strong>{c.tipo}</strong> {c.aceptado ? '✓ Aceptado' : '✗ Pendiente'} {c.fecha && `(${c.fecha})`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'historia' && (
          <div className="detail-card">
            <h4>Historia Clínica</h4>
            <p>Accede a la historia clínica completa y consultas del cliente.</p>
            <button className="btn btn--primary" onClick={() => navigate(`/pacientes/${id}/historia`)}>
              <FileText size={18} /> Ver Historia Clínica
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
