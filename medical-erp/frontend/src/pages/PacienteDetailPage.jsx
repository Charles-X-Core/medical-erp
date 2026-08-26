import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, UserX, UserCheck, FileText, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pacienteService } from '../services/pacienteService';
import ConfirmModal from '../components/ConfirmModal';

export default function PacienteDetailPage() {
  const { t } = useTranslation('patients');
  const { t: tco } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('datos');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pacienteService.getById(id);
      if (res.success) {
        setPaciente(res.data);
      } else {
        setError(res.message || tco('error_loading'));
      }
    } catch (err) {
      setError(err.message || tco('error_loading'));
    } finally {
      setLoading(false);
    }
  }, [id, tco]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirmToggle = async () => {
    setConfirmOpen(false);
    try {
      if (paciente.estado === 'activo') {
        await pacienteService.delete(id);
      } else {
        await pacienteService.activate(id);
      }
      navigate('/pacientes');
    } catch (err) {
      setError(err.message || t('error_delete'));
    }
  };

  if (loading) {
    return (
      <div className="paciente-detail-page">
        <div className="paciente-detail-page__loading">
          <Loader2 size={32} className="spinner" />
          <p>{t('loading_client')}</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="paciente-detail-page">
        <p className="paciente-detail-page__error">{error || t('no_found')}</p>
      </div>
    );
  }

  const fullName = `${paciente.apellidoPaterno}, ${paciente.nombres}`;

  return (
    <div className="paciente-detail-page">
      <div className="paciente-detail-page__header">
        <button className="btn btn--ghost" onClick={() => navigate('/pacientes')}>
          <ArrowLeft size={18} /> {tco('back')}
        </button>
        <div className="paciente-detail-page__title-group">
          <h2 className="paciente-detail-page__title">{fullName}</h2>
          <span className={`estado-badge estado-badge--${paciente.estado || 'activo'}`}>{paciente.estado || tco('active')}</span>
          <span className="pais-badge">{paciente.pais || 'PE'}</span>
        </div>
        <div className="paciente-detail-page__actions">
          <button className="btn btn--secondary" onClick={() => navigate(`/pacientes/${id}/editar`)}>
            <Pencil size={18} /> {tco('edit')}
          </button>
          <button
            className={`btn ${paciente.estado === 'activo' ? 'btn--danger' : 'btn--success'}`}
            onClick={() => setConfirmOpen(true)}
          >
            {paciente.estado === 'activo' ? <UserX size={18} /> : <UserCheck size={18} />}
            {paciente.estado === 'activo' ? tco('desactivar') : tco('activar')}
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
            {tab === 'datos' ? t('datos_personales') : tab === 'documentos' ? t('documentos_identidad') : tab === 'seguros' ? t('seguros_medicos') : tab === 'consentimientos' ? t('consentimientos') : t('historia_clinica')}
          </button>
        ))}
      </div>

      <div className="paciente-detail-page__content">
        {activeTab === 'datos' && (
          <div className="detail-grid">
            <div className="detail-card">
              <h4>{t('personal_data')}</h4>
              <p><strong>{t('first_names')}:</strong> {paciente.nombres}</p>
              <p><strong>{t('apellidos')}:</strong> {paciente.apellidoPaterno} {paciente.apellidoMaterno}</p>
              <p><strong>ID:</strong> {paciente.licenciaConducir || '-'}</p>
              <p><strong>{t('gender')}:</strong> {paciente.sexo || '-'}</p>
              <p><strong>{t('birth_date_short')}:</strong> {paciente.fechaNacimiento || '-'}</p>
              <p><strong>{t('civil_status')}:</strong> {paciente.estadoCivil || '-'}</p>
              <p><strong>{t('peso')}:</strong> {paciente.peso ? `${paciente.peso} kg` : '-'}</p>
              <p><strong>{t('estatura')}:</strong> {paciente.estatura ? `${paciente.estatura} cm` : '-'}</p>
            </div>
            <div className="detail-card">
              <h4>{t('contact_info')}</h4>
              <p><strong>{tco('phone')}:</strong> {paciente.telefono || '-'}</p>
              <p><strong>{tco('email')}:</strong> {paciente.email || '-'}</p>
              <p><strong>{t('ciudad_estado')}:</strong> {paciente.ciudadEstado || '-'}</p>
              <p><strong>{tco('address')}:</strong> {paciente.direccion || '-'}</p>
              <p><strong>{t('lugar_nacimiento')}:</strong> {paciente.lugarNacimiento || '-'}</p>
              <p><strong>{t('procedencia')}:</strong> {paciente.lugarProcedencia || '-'}</p>
              <p><strong>{t('occupation')}:</strong> {paciente.ocupacion || '-'}</p>
            </div>
            <div className="detail-card">
              <h4>{t('emergency_contact_title')}</h4>
              <p><strong>{t('acompanante')}:</strong> {paciente.nombreAcompanante || '-'}</p>
              <p><strong>{t('contacto_emergencia')}:</strong> {paciente.contactoEmergencia || '-'}</p>
              <p><strong>{tco('phone')}:</strong> {paciente.telefonoEmergencia || '-'}</p>
              <p><strong>{t('parentesco')}:</strong> {paciente.parentescoEmergencia || '-'}</p>
            </div>
            <div className="detail-card detail-card--full">
              <h4>{t('antecedentes')}</h4>
              <p><strong>{t('alergias')}:</strong> {paciente.alergias || '-'}</p>
              <p><strong>{t('medicamentos_actuales')}:</strong> {paciente.medicamentosActuales || '-'}</p>
              <p><strong>{t('antecedentes_personales')}:</strong> {paciente.antecedentesPersonales || '-'}</p>
              <p><strong>{t('antecedentes_familiares')}:</strong> {paciente.antecedentesFamiliares || '-'}</p>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="detail-card">
            <h4>{t('documentos_identidad')}</h4>
            {(paciente.documentos || []).length === 0 ? (
              <p>{t('sin_documentos')}</p>
            ) : (
              <ul className="detail-list">
                {paciente.documentos.map((doc) => (
                  <li key={doc.id}>
                    <strong>{doc.tipoDocumento}</strong> {doc.numeroDocumento}
                    {doc.esPrincipal && <span className="badge badge--primary">{t('principal')}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'seguros' && (
          <div className="detail-card">
            <h4>{t('seguros_medicos')}</h4>
            {(paciente.seguros || []).length === 0 ? (
              <p>{t('sin_seguros')}</p>
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
            <h4>{t('consentimientos')}</h4>
            {(paciente.consentimientos || []).length === 0 ? (
              <p>{t('sin_consentimientos')}</p>
            ) : (
              <ul className="detail-list">
                {paciente.consentimientos.map((c) => (
                  <li key={c.id}>
                    <strong>{c.tipo}</strong> {c.aceptado ? `✓ ${t('aceptado')}` : `✗ ${t('pendiente_firma')}`} {c.fecha && `(${c.fecha})`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'historia' && (
          <div className="detail-card">
            <h4>{t('historia_clinica')}</h4>
            <p>{t('acceso_historia')}</p>
            <button className="btn btn--primary" onClick={() => navigate(`/pacientes/${id}/historia`)}>
              <FileText size={18} /> {t('ver_historia')}
            </button>
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmOpen}
        title={paciente?.estado === 'activo' ? tco('desactivar') : tco('activar')}
        message={paciente?.estado === 'activo'
          ? `${tco('desactivar')} a ${fullName}?`
          : `${tco('activar')} a ${fullName}?`}
        variant={paciente?.estado === 'activo' ? 'danger' : 'activate'}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
