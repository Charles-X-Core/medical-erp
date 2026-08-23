import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Save, X, Loader2, User, Activity, Calendar, ClipboardList } from 'lucide-react';
import { tratamientoService } from '../../services/tratamientoService';
import { historiaClinicaService } from '../../services/historiaClinicaService';
import agendaService from '../../services/agendaService';
import { consultasService } from '../../services/consultasService';
import AntecedentesEditor, { getActiveAntecedentes } from '../ui/AntecedentesEditor';

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatHora(hora) {
  if (!hora) return '-';
  return hora.substring(0, 5);
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return '-';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

function getSexoLabel(sexo) {
  if (sexo === 'M') return 'Masculino';
  if (sexo === 'F') return 'Femenino';
  return '-';
}

export default function ResumenTab({ paciente, historia: historiaInicial, pacienteId }) {
  const { t } = useTranslation('patients');
  const [historia, setHistoria] = useState(historiaInicial);
  const [tratamientosActivos, setTratamientosActivos] = useState([]);
  const [proximaCita, setProximaCita] = useState(null);
  const [ultimaConsulta, setUltimaConsulta] = useState(null);
  const [editingAntecedentes, setEditingAntecedentes] = useState(false);
  const [antecedentesValues, setAntecedentesValues] = useState({});
  const [savingAntecedentes, setSavingAntecedentes] = useState(false);
  const [savedAntecedentes, setSavedAntecedentes] = useState(false);
  const [errorAntecedentes, setErrorAntecedentes] = useState('');

  useEffect(() => { setHistoria(historiaInicial); }, [historiaInicial]);
  useEffect(() => { loadData(); }, [pacienteId]);

  const loadData = async () => {
    try {
      const [tratRes, citaRes, consulRes] = await Promise.allSettled([
        tratamientoService.listByPaciente(pacienteId),
        agendaService.getCitasPorPaciente(pacienteId),
        consultasService.getByPaciente(pacienteId),
      ]);

      if (tratRes.status === 'fulfilled' && tratRes.value?.data) {
        const list = Array.isArray(tratRes.value.data) ? tratRes.value.data : tratRes.value.data?.content || [];
        setTratamientosActivos(
          list.filter((t) => t.estado !== 'FINALIZADO' && t.estado !== 'CANCELADO').slice(0, 3)
        );
      }

      if (citaRes.status === 'fulfilled' && citaRes.value?.data) {
        const citas = Array.isArray(citaRes.value.data) ? citaRes.value.data : [];
        const hoy = new Date().toISOString().split('T')[0];
        const futuras = citas.filter((c) => c.fecha >= hoy && c.estado !== 'CANCELADA');
        futuras.sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || '').localeCompare(c.hora || ''));
        setProximaCita(futuras[0] || null);
      }

      if (consulRes.status === 'fulfilled' && consulRes.value?.data) {
        const consultas = Array.isArray(consulRes.value.data) ? consulRes.value.data : [];
        if (consultas.length > 0) {
          consultas.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
          setUltimaConsulta(consultas[0]);
        }
      }
    } catch (err) {
      console.error('Error loading resumen data:', err);
    }
  };

  const startEditAntecedentes = () => {
    if (historia) {
      setAntecedentesValues({
        alergiaMedicamentos: historia.alergiaMedicamentos || '',
        propensionHemorragias: historia.propensionHemorragias || '',
        complicacionesAnestesia: historia.complicacionesAnestesia || '',
        presionArterialMedicacion: historia.presionArterialMedicacion || '',
        cardiopatiasPersonales: historia.cardiopatiasPersonales || '',
        cardiopatiasFamiliares: historia.cardiopatiasFamiliares || '',
        diabetesPersonal: historia.diabetesPersonal || '',
        diabetesFamiliar: historia.diabetesFamiliar || '',
        hepatitis: historia.hepatitis || '',
        otrasEnfermedades: historia.otrasEnfermedades || '',
        enfermedadActualMedicacion: historia.enfermedadActualMedicacion || '',
      });
    }
    setEditingAntecedentes(true);
    setSavedAntecedentes(false);
    setErrorAntecedentes('');
  };

  const cancelEditAntecedentes = () => {
    setEditingAntecedentes(false);
    setErrorAntecedentes('');
  };

  const saveAntecedentes = async () => {
    if (!historia?.id) return;
    setSavingAntecedentes(true);
    setErrorAntecedentes('');
    try {
      const result = await historiaClinicaService.updateAntecedentes(historia.id, antecedentesValues);
      if (!result.success) throw new Error(result.message || t('error_saving'));
      const refreshed = await historiaClinicaService.getByPaciente(pacienteId);
      if (refreshed.success) setHistoria(refreshed.data);
      setSavedAntecedentes(true);
      setEditingAntecedentes(false);
      setTimeout(() => setSavedAntecedentes(false), 2000);
    } catch (err) {
      setErrorAntecedentes(err.message);
    } finally {
      setSavingAntecedentes(false);
    }
  };

  const activeAntecedentes = getActiveAntecedentes(historia);

  const fichaFields = [
    { label: t('peso'), value: paciente.peso ? `${paciente.peso} kg` : '-' },
    { label: t('estatura'), value: paciente.estatura ? `${paciente.estatura} cm` : '-' },
    { label: 'Edad', value: calcularEdad(paciente.fechaNacimiento) },
    { label: t('gender'), value: getSexoLabel(paciente.sexo) },
    { label: t('estado_civil_short'), value: paciente.estadoCivil || '-' },
    { label: t('occupation'), value: paciente.ocupacion || '-' },
  ];

  return (
    <div className="rsum">

      {/* ── Ficha del Paciente ── */}
      <div className="workspace-card">
        <h3 className="workspace-card__title"><User size={16} /> {t('identificacion_cliente')}</h3>
        <div className="rsum__grid">
          {fichaFields.map((f) => (
            <div key={f.label} className="rsum__field">
              <span className="rsum__label">{f.label}</span>
              <span className="rsum__value">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Última Consulta ── */}
      <div className="workspace-card">
        <h3 className="workspace-card__title"><ClipboardList size={16} /> {t('ultima_consulta')}</h3>
        {ultimaConsulta ? (
          <div className="rsum__fields">
            <div className="rsum__row">
              <span className="rsum__label">{t('fecha_label')}</span>
              <span className="rsum__value">{formatFecha(ultimaConsulta.fecha)}</span>
            </div>
            <div className="rsum__row">
              <span className="rsum__label">{t('motivo')}</span>
              <span className="rsum__value">{ultimaConsulta.motivo || '-'}</span>
            </div>
            {ultimaConsulta.diagnosticoLista && (
              <div className="rsum__row">
                <span className="rsum__label">{t('diagnostico')}</span>
                <span className="rsum__value">
                  {typeof ultimaConsulta.diagnosticoLista === 'string'
                    ? ultimaConsulta.diagnosticoLista
                    : Array.isArray(ultimaConsulta.diagnosticoLista)
                      ? ultimaConsulta.diagnosticoLista.map((d) => d.descripcion || d).join(', ')
                      : '-'}
                </span>
              </div>
            )}
            {ultimaConsulta.evolucionMejoria && (
              <div className="rsum__row">
                <span className="rsum__label">{t('evolucion')}</span>
                <span className="rsum__value rsum__value--muted">{ultimaConsulta.evolucionMejoria}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="rsum__empty">{t('sin_consultas')}</p>
        )}
      </div>

      {/* ── Antecedentes Médicos ── */}
      <div className="workspace-card">
        <div className="rsum__header">
          <h3 className="workspace-card__title" style={{ margin: 0, border: 'none', padding: 0 }}>{t('medical_history_title')}</h3>
          <div className="rsum__actions">
            {savedAntecedentes && <span className="rsum__saved">{t('saving')} ✓</span>}
            {errorAntecedentes && <span className="rsum__error">{errorAntecedentes}</span>}
            {!editingAntecedentes ? (
              <button className="btn btn--ghost btn--sm" onClick={startEditAntecedentes} disabled={!historia}>
                <Edit2 size={14} /> {t('editar')}
              </button>
            ) : (
              <>
                <button className="btn btn--ghost btn--sm" onClick={cancelEditAntecedentes}>
                  <X size={14} /> {t('cancel', { ns: 'common' })}
                </button>
                <button className="btn btn--primary btn--sm" onClick={saveAntecedentes} disabled={savingAntecedentes}>
                  {savingAntecedentes ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
                  {savingAntecedentes ? t('saving') : t('save', { ns: 'common' })}
                </button>
              </>
            )}
          </div>
        </div>

        {historia ? (
          editingAntecedentes ? (
            <AntecedentesEditor
              values={antecedentesValues}
              onChange={(key, val) => setAntecedentesValues((prev) => ({ ...prev, [key]: val }))}
              compact
            />
          ) : activeAntecedentes.length === 0 ? (
            <p className="rsum__empty">{t('sin_historia_clinica')}</p>
          ) : (
            <div className="rsum__list">
              {activeAntecedentes.map(({ key, label, value }) => (
                <div key={key} className="rsum__item">
                  <span className="rsum__dot" />
                  <span className="rsum__item-label">{label}</span>
                  {value !== 'Si' && <span className="rsum__item-detail">{value}</span>}
                </div>
              ))}
            </div>
          )
        ) : (
          <p className="rsum__empty">{t('sin_historia_clinica')}</p>
        )}
      </div>

      {/* ── Footer: 2 columnas ── */}
      <div className="rsum__footer">
        {/* Tratamientos Activos */}
        <div className="workspace-card">
          <h3 className="workspace-card__title"><Activity size={16} /> {t('tab_tratamientos')}</h3>
          <div className="rsum__fields">
            {tratamientosActivos.length === 0 ? (
              <p className="rsum__empty">{t('sin_tratamientos_registrados')}</p>
            ) : (
              tratamientosActivos.map((t) => (
                <div key={t.id} className="rsum__row">
                  <span className="rsum__value">{t.procedimientoRealizado || t.tipoSesionTratamiento?.nombre || t('tratamiento')}</span>
                  <span className={`rsum__badge rsum__badge--${t.estado === 'EN_CURSO' ? 'active' : 'pending'}`}>
                    {t.estado?.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Próxima Cita */}
        <div className="workspace-card">
          <h3 className="workspace-card__title"><Calendar size={16} /> {t('agendar_cita')}</h3>
          <div className="rsum__fields">
            {proximaCita ? (
              <>
                <div className="rsum__row">
                  <span className="rsum__label">{t('fecha_label')}</span>
                  <span className="rsum__value">{formatFecha(proximaCita.fecha)}</span>
                </div>
                <div className="rsum__row">
                  <span className="rsum__label">{t('time', { ns: 'common' })}</span>
                  <span className="rsum__value">{formatHora(proximaCita.hora)}</span>
                </div>
                <div className="rsum__row">
                  <span className="rsum__label">{t('type', { ns: 'common' })}</span>
                  <span className="rsum__value">{proximaCita.tipo?.nombre || '-'}</span>
                </div>
              </>
            ) : (
              <p className="rsum__empty">{t('sin_agenda')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
