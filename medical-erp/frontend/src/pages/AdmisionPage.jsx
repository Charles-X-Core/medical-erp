import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, ArrowLeft, ArrowRight, CheckCircle, Save,
  User, Heart, Phone, Ruler, FileText, Send,
  ClipboardCheck, ClipboardList, Plus, ChevronLeft, ChevronRight,
  Pencil, Trash2, AlertCircle, Loader2, Eye, Stethoscope,
  CalendarClock, ArrowUpDown, UserX, UserCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { getPrimaryRole } from '../utils/roleUtils';
import { pacienteService } from '../services/pacienteService';
import { membresiaService } from '../services/membresiaService';
import { tareaService } from '../services/tareaService';
import agendaService from '../services/agendaService';
import PacienteFormModal from '../components/paciente360/PacienteFormModal';
import PasoIdentificacion from '../components/admision-steps/PasoIdentificacion';
import PasoDatos from '../components/admision-steps/PasoDatos';
import PasoContacto from '../components/admision-steps/PasoContacto';
import PasoMediciones from '../components/admision-steps/PasoMediciones';
import PasoContrato from '../components/admision-steps/PasoContrato';
import PasoResumen from '../components/admision-steps/PasoResumen';
import PanelAccionesPostAdmision from '../components/admision-steps/PanelAccionesPostAdmision';
import AgendarCitaModal from '../components/admision-steps/AgendarCitaModal';
import ConfirmModal from '../components/ConfirmModal';

function extractList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data) return extractList(data.data);
  return [];
}

export default function AdmisionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('patients');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const primaryRole = getPrimaryRole(user);
  const isEnfermera = primaryRole === 'enfermera';

  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('id,desc');
  const [pacientes, setPacientes] = useState([]);
  const [allPacientes, setAllPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [citasHoyIds, setCitasHoyIds] = useState(new Set());
  const [showCitasHoy, setShowCitasHoy] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingPacienteId, setEditingPacienteId] = useState(null);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({});
  const [mediciones, setMediciones] = useState({ peso: '', estatura: '' });
  const [membresias, setMembresias] = useState([]);
  const [contratoFirmado, setContratoFirmado] = useState(false);
  const [consentimientoId, setConsentimientoId] = useState(null);

  const [view, setView] = useState('list');
  const [showAgendarCita, setShowAgendarCita] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({ id: null, nombre: '', estadoActual: '' });

  const loadPacientes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let res;
      if (query.trim()) {
        res = await pacienteService.search(query.trim());
      } else {
        res = await pacienteService.list({ page, size: 100, sort });
      }
      if (res.success) {
        const content = res.data?.content || res.data || [];
        setAllPacientes(content);
        setPacientes(content);
        setTotalPages(res.data?.totalPages || 1);
        setTotalElements(res.data?.totalElements || content.length);
      } else {
        setError(res.message || t('error_cargar_clientes'));
      }
    } catch (err) {
      setError(err.message || t('error_cargar_clientes'));
    } finally {
      setLoading(false);
    }
  }, [page, query, sort, t]);

  useEffect(() => { if (view === 'list' && !showCitasHoy) loadPacientes(); }, [loadPacientes, view, showCitasHoy]);

  useEffect(() => {
    if (!showCitasHoy || view !== 'list') return;
    const filtered = allPacientes.filter(p => citasHoyIds.has(p.id));
    setPacientes(filtered);
    setTotalElements(filtered.length);
    setTotalPages(1);
  }, [showCitasHoy, citasHoyIds, allPacientes, view]);

  useEffect(() => {
    const loadCitasHoy = async () => {
      try {
        const res = await agendaService.getCitasHoy();
        const citas = res?.data || res?.content || (Array.isArray(res) ? res : []);
        const ids = new Set(citas.map(c => c.pacienteId).filter(Boolean));
        setCitasHoyIds(ids);
      } catch { setCitasHoyIds(new Set()); }
    };
    loadCitasHoy();
    const onFocus = () => loadCitasHoy();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    const pid = searchParams.get('pacienteId');
    if (pid && isEnfermera) loadPatientById(parseInt(pid, 10));
  }, [searchParams, isEnfermera]);

  const loadPatientById = async (id) => {
    try {
      const data = await pacienteService.getById(id);
      const p = data?.data || data;
      startWizard(p);
    } catch { /* */ }
  };

  const startWizard = async (p) => {
    setSelectedPatient(p);
    setFormData({
      licenciaConducir: p.licenciaConducir || '',
      apellidoPaterno: p.apellidoPaterno || '',
      apellidoMaterno: p.apellidoMaterno || '',
      nombres: p.nombres || '',
      fechaNacimiento: p.fechaNacimiento || '',
      sexo: p.sexo || '',
      estadoCivil: p.estadoCivil || '',
      telefono: p.telefono || '',
      email: p.email || '',
      direccionLinea1: p.direccionLinea1 || '',
      ciudad: p.ciudad || '',
      estadoProvincia: p.estadoProvincia || '',
      ocupacion: p.ocupacion || '',
      lugarNacimiento: p.lugarNacimiento || '',
      lugarProcedencia: p.lugarProcedencia || '',
      gradoInstruccion: p.gradoInstruccion || '',
      nombreAcompanante: p.nombreAcompanante || '',
      contactoEmergencia: p.contactoEmergencia || '',
      telefonoEmergencia: p.telefonoEmergencia || '',
      parentescoEmergencia: p.parentescoEmergencia || '',
    });
    setMediciones({ peso: p.peso || '', estatura: p.estatura || '' });
    setCurrentStep(1);
    setSaved(false);
    setView('wizard');
    try {
      const mems = await membresiaService.getByPaciente(p.id);
      setMembresias(mems);
    } catch { setMembresias([]); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMedicionChange = (e) => {
    const { name, value } = e.target;
    setMediciones(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1: return formData.licenciaConducir?.trim() && formData.apellidoPaterno?.trim() && formData.nombres?.trim();
      default: return true;
    }
  };

  const canGoNext = () => validateStep(currentStep);
  const canGoPrev = () => currentStep > 1;
  const goNext = () => { if (canGoNext() && currentStep < WIZARD_STEPS.length) setCurrentStep(prev => prev + 1); };
  const goBack = () => { if (canGoPrev()) setCurrentStep(prev => prev - 1); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        peso: mediciones.peso ? parseFloat(mediciones.peso) : null,
        estatura: mediciones.estatura ? parseFloat(mediciones.estatura) : null,
      };
      await pacienteService.update(selectedPatient.id, payload);
      if (!contratoFirmado) {
        await tareaService.create({
          destinoRol: 'enfermera',
          pacienteId: selectedPatient.id,
          tipo: 'FIRMAR_DOCUMENTO',
          titulo: t('firma_pendiente_titulo', { nombres: formData.nombres, apellido: formData.apellidoPaterno }),
          descripcion: t('firma_pendiente_descripcion', { nombres: formData.nombres, apellido: formData.apellidoPaterno }),
        }).catch(() => {});
      }
      setSaved(true);
      setTimeout(() => setView('acciones'), 1500);
    } catch (err) {
      alert(err.message || t('error_guardar'));
    } finally {
      setSaving(false);
    }
  };

  const exitWizard = () => {
    setSelectedPatient(null);
    setFormData({});
    setMembresias([]);
    setCurrentStep(1);
    setSaved(false);
    setContratoFirmado(false);
    setView('list');
  };

  const handleToggleEstado = async (id, nombre, estadoActual) => {
    setConfirmData({ id, nombre, estadoActual });
    setConfirmOpen(true);
  };

  const handleConfirmToggle = async () => {
    const { id, nombre, estadoActual } = confirmData;
    setConfirmOpen(false);
    try {
      if (estadoActual === 'activo') {
        await pacienteService.delete(id);
      } else {
        await pacienteService.activate(id);
      }
      loadPacientes();
    } catch (err) {
      setError(err.message || t('error_eliminar_cliente'));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    loadPacientes();
  };

  const handleOpenModal = (pacienteId = null) => {
    setEditingPacienteId(pacienteId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPacienteId(null);
  };

  const handleSaveModal = () => {
    loadPacientes();
  };

  const getEstadoClass = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'activo': return 'admision-page__estado--activo';
      case 'inactivo': return 'admision-page__estado--inactivo';
      default: return 'admision-page__estado--default';
    }
  };

  const WIZARD_STEPS = [
    { id: 1, label: t('identificacion'), icon: User },
    { id: 2, label: t('datos'), icon: Heart },
    { id: 3, label: t('contacto'), icon: Phone },
    { id: 4, label: t('mediciones'), icon: Ruler },
    { id: 5, label: t('contrato'), icon: FileText },
    { id: 6, label: t('resumen'), icon: CheckCircle },
  ];

  // Vista: Panel de acciones post-admision
  if (view === 'acciones' && selectedPatient) {
    return (
      <div className="admision-page">
        <PanelAccionesPostAdmision
          paciente={selectedPatient}
          onAgendarCita={() => setShowAgendarCita(true)}
          onEnviarContrato={() => { setView('wizard'); setCurrentStep(5); }}
          onVerPaciente={() => navigate(`/pacientes/${selectedPatient.id}/workspace`)}
          onVolver={exitWizard}
        />
        <AgendarCitaModal
          isOpen={showAgendarCita}
          onClose={() => setShowAgendarCita(false)}
          paciente={selectedPatient}
          onCitaCreada={exitWizard}
        />
      </div>
    );
  }

  // Vista: Wizard de admision
  if (view === 'wizard' && selectedPatient) {
    const fullName = `${selectedPatient.apellidoPaterno || ''} ${selectedPatient.apellidoMaterno || ''}, ${selectedPatient.nombres || ''}`.trim();
    const isLastStep = currentStep === WIZARD_STEPS.length;

    return (
      <div className="admision-page admision-page--wizard">
        <div className="admision-page__wizard-header">
          <button className="admision-page__back" onClick={exitWizard}><ArrowLeft size={20} /></button>
          <div className="admision-page__wizard-info">
            <h2 className="admision-page__wizard-title">{fullName}</h2>
            <span className="admision-page__wizard-id">{selectedPatient.licenciaConducir || t('sin_id')}</span>
          </div>
          {saved && <span className="admision-page__saved-badge"><CheckCircle size={16} /> {tCommon('guardado')}</span>}
        </div>

        <div className="admision-page__stepper">
          {WIZARD_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const completed = currentStep > step.id;
            const active = currentStep === step.id;
            return (
              <div key={step.id} className="admision-page__step-wrapper">
                <button
                  className={`admision-page__step ${active ? 'admision-page__step--active' : ''} ${completed ? 'admision-page__step--done' : ''}`}
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                >
                  {completed ? <CheckCircle size={18} /> : <Icon size={18} />}
                  <span>{step.label}</span>
                </button>
                {idx < WIZARD_STEPS.length - 1 && <div className={`admision-page__step-line ${completed ? 'admision-page__step-line--done' : ''}`} />}
              </div>
            );
          })}
        </div>

        <div className="admision-page__content">
          {currentStep === 1 && <PasoIdentificacion formData={formData} onChange={handleInputChange} />}
          {currentStep === 2 && <PasoDatos formData={formData} onChange={handleInputChange} />}
          {currentStep === 3 && <PasoContacto formData={formData} onChange={handleInputChange} />}
          {currentStep === 4 && <PasoMediciones mediciones={mediciones} onChange={handleMedicionChange} />}
          {currentStep === 5 && (
            <PasoContrato
              pacienteId={selectedPatient.id}
              pacienteNombre={fullName}
              membresias={membresias}
              onMembresiasChange={setMembresias}
              contratoFirmado={contratoFirmado}
              onContratoFirmado={(firmado, id) => {
                setContratoFirmado(firmado);
                setConsentimientoId(id);
              }}
            />
          )}
          {currentStep === 6 && <PasoResumen formData={formData} mediciones={mediciones} membresias={membresias} firmaSent={contratoFirmado} />}
        </div>

        <div className="admision-page__footer">
          <button className="admision-page__btn-prev" onClick={goBack} disabled={!canGoPrev()}>
            <ArrowLeft size={18} /> {tCommon('anterior')}
          </button>
          <span className="admision-page__step-indicator">{t('paso')} {currentStep} {tCommon('de')} {WIZARD_STEPS.length}</span>
          {isLastStep ? (
            <button className="admision-page__btn-save" onClick={handleSave} disabled={saving}>
              <Save size={18} /> {saving ? tCommon('guardando') : t('confirmar_admision')}
            </button>
          ) : (
            <button className="admision-page__btn-next" onClick={goNext} disabled={!canGoNext()}>
              {tCommon('siguiente')} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Vista: Lista de pacientes
  return (
    <div className="admision-page">
      <div className="admision-page__header">
        <div className="admision-page__title-group">
          <ClipboardCheck size={28} className="admision-page__icon" />
          <div>
            <h2 className="admision-page__title">{t('admision')}</h2>
            <p className="admision-page__subtitle">
              {totalElements} {totalElements === 1 ? t('cliente_registrado') : t('clientes_registrados')}
            </p>
          </div>
        </div>
        <button className="admision-page__btn-create" onClick={() => handleOpenModal()}>
          <Plus size={18} /> {t('nuevo_cliente')}
        </button>
      </div>

      <form className="admision-page__search" onSubmit={handleSearch}>
        <div className="admision-page__search-input-wrapper">
          <Search size={18} className="admision-page__search-icon" />
          <input
            type="text"
            className="admision-page__search-field"
            placeholder={t('buscar_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="admision-page__btn-secondary">{tCommon('buscar')}</button>
        {query && (
          <button type="button" className="admision-page__btn-ghost" onClick={() => { setQuery(''); setPage(0); }}>
            {tCommon('limpiar')}
          </button>
        )}
      </form>

      <div className="admision-page__filters">
        <ArrowUpDown size={14} className="admision-page__filters-label" />
        {[
          { value: 'id,desc', label: t('recientes') },
          { value: 'nombres,asc', label: t('a_z') },
          { value: 'nombres,desc', label: t('z_a') },
          { value: 'id,asc', label: t('mas_antiguos') },
        ].map((opt) => (
          <button
            key={opt.value}
            className={`admision-page__filter-pill ${!showCitasHoy && sort === opt.value ? 'admision-page__filter-pill--active' : ''}`}
            onClick={() => { setSort(opt.value); setPage(0); setShowCitasHoy(false); }}
          >
            {opt.label}
          </button>
        ))}
        <button
          className={`admision-page__filter-pill ${showCitasHoy ? 'admision-page__filter-pill--active admision-page__filter-pill--cita-hoy' : ''}`}
          onClick={() => { setShowCitasHoy(prev => !prev); setPage(0); }}
        >
          <CalendarClock size={14} /> {t('citas_hoy')}
        </button>
      </div>

      {error && (
        <div className="admision-page__error"><AlertCircle size={18} /> {error}</div>
      )}

      <div className="admision-page__table-wrapper">
        {loading ? (
          <div className="admision-page__loading">
            <Loader2 size={32} className="spinner" />
            <p>{t('cargando_clientes')}</p>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="admision-page__empty">
            <ClipboardCheck size={48} />
            <p>{t('no_hay_clientes_registrados')}</p>
            <button className="admision-page__btn-create" onClick={() => handleOpenModal()}>
              <Plus size={18} /> {t('registrar_primer_cliente')}
            </button>
          </div>
        ) : (
          <>
            <table className="admision-page__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('nombre')}</th>
                  <th>{t('id_cliente')}</th>
                  <th>{t('telefono')}</th>
                  <th>{t('email')}</th>
                  <th>{t('estado')}</th>
                  <th className="admision-page__th-actions">{t('acciones')}</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p) => (
                  <tr key={p.id} className={p.estado === 'inactivo' ? 'admision-page__row--inactivo' : ''}>
                    <td className="admision-page__td-id">#{p.id}</td>
                    <td>
                      <div className="admision-page__td-name">
                        <span className="admision-page__td-name-main">{p.nombres} {p.apellidoPaterno}</span>
                      </div>
                    </td>
                    <td>{p.licenciaConducir || '-'}</td>
                    <td>{p.telefono || '-'}</td>
                    <td>{p.email || '-'}</td>
                    <td>
                      <div className="admision-page__estado">
                        {citasHoyIds.has(p.id) && (
                          <span className="admision-page__cita-hoy">
                            <CalendarClock size={12} /> {t('cita_hoy')}
                          </span>
                        )}
                        <span className={`admision-page__estado-row ${getEstadoClass(p.estado)}`}>
                          {p.estado || t('activo')}
                        </span>
                      </div>
                    </td>
                    <td className="admision-page__td-actions">
                      {isEnfermera ? (
                        <button
                          className="admision-page__action admision-page__action--primary"
                          title={t('iniciar_admision')}
                          onClick={() => startWizard(p)}
                        >
                          <Stethoscope size={18} />
                        </button>
                      ) : (
                        <>
                          <button
                            className="admision-page__action"
                            title={t('centro_cliente')}
                            onClick={() => navigate(`/pacientes/${p.id}/workspace`)}
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="admision-page__action"
                            title={t('detalle')}
                            onClick={() => navigate(`/pacientes/${p.id}/detalle`)}
                          >
                            <ClipboardList size={18} />
                          </button>
                        </>
                      )}
                      <button
                        className="admision-page__action"
                        title={tCommon('editar')}
                        onClick={() => handleOpenModal(p.id)}
                      >
                        <Pencil size={18} />
                      </button>
                      {!isEnfermera && (
                        <button
                          className={`admision-page__action ${p.estado === 'activo' ? 'admision-page__action--danger' : 'admision-page__action--success'}`}
                          title={p.estado === 'activo' ? t('desactivar') : t('activar')}
                          onClick={() => handleToggleEstado(p.id, `${p.nombres} ${p.apellidoPaterno}`, p.estado)}
                        >
                          {p.estado === 'activo' ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="admision-page__pagination">
                <button className="admision-page__page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft size={16} />
                </button>
                <span className="admision-page__page-info">{t('pagina')} {page + 1} {tCommon('de')} {totalPages}</span>
                <button className="admision-page__page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <PacienteFormModal isOpen={showModal} onClose={handleCloseModal} onSave={handleSaveModal} pacienteId={editingPacienteId} />
      <ConfirmModal
        open={confirmOpen}
        title={confirmData.estadoActual === 'activo' ? tCommon('desactivar') : tCommon('activar')}
        message={confirmData.estadoActual === 'activo'
          ? `${tCommon('desactivar')} a ${confirmData.nombre}?`
          : `${tCommon('activar')} a ${confirmData.nombre}?`}
        variant={confirmData.estadoActual === 'activo' ? 'danger' : 'activate'}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
