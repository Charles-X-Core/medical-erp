import { useState, useEffect, useCallback } from 'react';
import { formatLADate } from '../utils/laTimezone';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import agendaService from '../services/agendaService';

const DIAS_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_INDEX = [1, 2, 3, 4, 5, 6, 0]; // Lun-Dom

function formatTime(time) {
  if (!time) return '';
  return time.substring(0, 5);
}

function parseTimeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function AgendaConfigPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('disponibilidad');

  const [agenda, setAgenda] = useState(null);
  const [agendaId, setAgendaId] = useState(null);
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [expandedBloqueo, setExpandedBloqueo] = useState(null);

  // New bloqueo form
  const [nuevoBloqueo, setNuevoBloqueo] = useState({
    fechaInicio: '',
    horaInicio: '08:00',
    fechaFin: '',
    horaFin: '09:00',
    motivo: '',
  });
  const [showBloqueoForm, setShowBloqueoForm] = useState(false);

  // Load agenda
  const loadAgenda = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const result = await agendaService.getAgendaByUsuario(user.id);
      if (result.success && result.data) {
        setAgenda(result.data);
        setAgendaId(result.data.id);
        setDisponibilidades(result.data.disponibilidades || []);
        setBloqueos(result.data.bloqueos || []);
      } else {
        // Create agenda if doesn't exist
        const createResult = await agendaService.crearAgenda({
          usuarioId: user.id,
          nombre: `Agenda de ${user.nombre}`,
        });
        if (createResult.success) {
          setAgenda(createResult.data);
          setAgendaId(createResult.data.id);
          setDisponibilidades(createResult.data.disponibilidades || []);
          setBloqueos(createResult.data.bloqueos || []);
        }
      }
    } catch (err) {
      setError('Error al cargar la agenda');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.nombre]);

  useEffect(() => {
    if (user?.id) loadAgenda();
  }, [loadAgenda, user?.id]);

  // Save disponibilidades
  const handleSaveDisponibilidades = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const result = await agendaService.updateDisponibilidades(agendaId, disponibilidades);
      if (result.success) {
        setSuccess('Disponibilidad guardada exitosamente');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Error al guardar');
      }
    } catch (err) {
      setError('Error al guardar la disponibilidad');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Add disponibilidad for a day
  const addDisponibilidad = (diaSemana) => {
    const existing = disponibilidades.filter((d) => d.diaSemana === diaSemana);
    const lastEnd = existing.length > 0
      ? existing[existing.length - 1].horaFin
      : '08:00';
    const startMin = parseTimeToMinutes(lastEnd);

    setDisponibilidades([
      ...disponibilidades,
      {
        diaSemana,
        horaInicio: minutesToTime(startMin),
        horaFin: minutesToTime(startMin + 60),
      },
    ]);
  };

  // Remove disponibilidad
  const removeDisponibilidad = (index) => {
    setDisponibilidades(disponibilidades.filter((_, i) => i !== index));
  };

  // Update disponibilidad
  const updateDisponibilidad = (index, field, value) => {
    const updated = [...disponibilidades];
    updated[index] = { ...updated[index], [field]: value };
    setDisponibilidades(updated);
  };

  // Create bloqueo
  const handleCreateBloqueo = async () => {
    if (!nuevoBloqueo.fechaInicio || !nuevoBloqueo.fechaFin) {
      setError('Las fechas son requeridas');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const inicio = `${nuevoBloqueo.fechaInicio}T${nuevoBloqueo.horaInicio}:00`;
      const fin = `${nuevoBloqueo.fechaFin}T${nuevoBloqueo.horaFin}:00`;

      const result = await agendaService.crearBloqueo(agendaId, {
        fechaInicio: inicio,
        fechaFin: fin,
        motivo: nuevoBloqueo.motivo || null,
      });

      if (result.success) {
        setBloqueos([...bloqueos, result.data]);
        setNuevoBloqueo({ fechaInicio: '', horaInicio: '08:00', fechaFin: '', horaFin: '09:00', motivo: '' });
        setShowBloqueoForm(false);
        setSuccess('Bloqueo creado exitosamente');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Error al crear bloqueo');
      }
    } catch (err) {
      setError('Error al crear el bloqueo');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Delete bloqueo
  const handleDeleteBloqueo = async (bloqueoId) => {
    try {
      setSaving(true);
      setError('');

      const result = await agendaService.eliminarBloqueo(bloqueoId);
      if (result.success) {
        setBloqueos(bloqueos.filter((b) => b.id !== bloqueoId));
        setSuccess('Bloqueo eliminado');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error al eliminar el bloqueo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="agenda-config-page">
        <div className="agenda-config-page__loading">
          <Loader2 size={32} className="spinner" />
          <p>Cargando configuración de agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agenda-config-page">
      {/* Header */}
      <div className="agenda-config-header">
        <div className="agenda-config-header__left">
          <div className="agenda-config-header__icon">
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 className="agenda-config-header__title">Configuración de Agenda</h1>
            <p className="agenda-config-header__subtitle">
              Administra tu disponibilidad y bloqueos
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="agenda-config-page__alert agenda-config-page__alert--error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="agenda-config-page__alert agenda-config-page__alert--success">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="agenda-config-tabs">
        <button
          className={`agenda-config-tabs__btn ${activeTab === 'disponibilidad' ? 'agenda-config-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('disponibilidad')}
        >
          <Clock size={16} />
          Mi Disponibilidad
        </button>
        <button
          className={`agenda-config-tabs__btn ${activeTab === 'bloqueos' ? 'agenda-config-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('bloqueos')}
        >
          <AlertTriangle size={16} />
          Mis Bloqueos
        </button>
        <button
          className={`agenda-config-tabs__btn ${activeTab === 'doctora' ? 'agenda-config-tabs__btn--active' : ''}`}
          onClick={() => setActiveTab('doctora')}
        >
          <Eye size={16} />
          Agenda Doctora
        </button>
      </div>

      {/* Tab Content: Disponibilidad */}
      {activeTab === 'disponibilidad' && (
        <div className="agenda-config-section">
          <div className="agenda-config-section__header">
            <h2>Disponibilidad Semanal</h2>
            <button
              className="btn btn--primary"
              onClick={handleSaveDisponibilidades}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
              Guardar
            </button>
          </div>

          <div className="agenda-config-grid">
            {DIAS_INDEX.map((dia) => {
              const diaDisponibilidades = disponibilidades.filter((d) => d.diaSemana === dia);
              const isToday = new Date().getDay() === dia;

              return (
                <div key={dia} className={`agenda-config-day ${isToday ? 'agenda-config-day--today' : ''}`}>
                  <div className="agenda-config-day__header">
                    <span className="agenda-config-day__name">{DIAS_LABELS[dia]}</span>
                    <span className="agenda-config-day__short">{DIAS_CORTOS[dia]}</span>
                  </div>

                  <div className="agenda-config-day__slots">
                    {diaDisponibilidades.length === 0 ? (
                      <div className="agenda-config-day__empty">Sin horario</div>
                    ) : (
                      diaDisponibilidades.map((disp, idx) => {
                        const globalIdx = disponibilidades.indexOf(disp);
                        return (
                          <div key={idx} className="agenda-config-slot">
                            <input
                              type="time"
                              className="agenda-config-slot__input"
                              value={disp.horaInicio}
                              onChange={(e) => updateDisponibilidad(globalIdx, 'horaInicio', e.target.value)}
                            />
                            <span className="agenda-config-slot__separator">-</span>
                            <input
                              type="time"
                              className="agenda-config-slot__input"
                              value={disp.horaFin}
                              onChange={(e) => updateDisponibilidad(globalIdx, 'horaFin', e.target.value)}
                            />
                            <button
                              className="agenda-config-slot__remove"
                              onClick={() => removeDisponibilidad(globalIdx)}
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button
                    className="agenda-config-day__add"
                    onClick={() => addDisponibilidad(dia)}
                  >
                    <Plus size={14} />
                    Agregar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content: Bloqueos */}
      {activeTab === 'bloqueos' && (
        <div className="agenda-config-section">
          <div className="agenda-config-section__header">
            <h2>Bloqueos de Horario</h2>
            <button
              className="btn btn--primary"
              onClick={() => setShowBloqueoForm(!showBloqueoForm)}
            >
              <Plus size={16} />
              Nuevo Bloqueo
            </button>
          </div>

          {showBloqueoForm && (
            <div className="agenda-config-bloqueo-form">
              <div className="agenda-config-bloqueo-form__row">
                <div className="agenda-config-bloqueo-form__field">
                  <label>Fecha Inicio</label>
                  <input
                    type="date"
                    value={nuevoBloqueo.fechaInicio}
                    onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, fechaInicio: e.target.value })}
                  />
                </div>
                <div className="agenda-config-bloqueo-form__field">
                  <label>Hora Inicio</label>
                  <input
                    type="time"
                    value={nuevoBloqueo.horaInicio}
                    onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, horaInicio: e.target.value })}
                  />
                </div>
                <div className="agenda-config-bloqueo-form__field">
                  <label>Fecha Fin</label>
                  <input
                    type="date"
                    value={nuevoBloqueo.fechaFin}
                    onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, fechaFin: e.target.value })}
                  />
                </div>
                <div className="agenda-config-bloqueo-form__field">
                  <label>Hora Fin</label>
                  <input
                    type="time"
                    value={nuevoBloqueo.horaFin}
                    onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, horaFin: e.target.value })}
                  />
                </div>
              </div>
              <div className="agenda-config-bloqueo-form__row">
                <div className="agenda-config-bloqueo-form__field agenda-config-bloqueo-form__field--full">
                  <label>Motivo (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Reunión, almuerzo, cita personal..."
                    value={nuevoBloqueo.motivo}
                    onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, motivo: e.target.value })}
                  />
                </div>
              </div>
              <div className="agenda-config-bloqueo-form__actions">
                <button className="btn btn--secondary" onClick={() => setShowBloqueoForm(false)}>
                  Cancelar
                </button>
                <button
                  className="btn btn--primary"
                  onClick={handleCreateBloqueo}
                  disabled={saving}
                >
                  {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                  Crear Bloqueo
                </button>
              </div>
            </div>
          )}

          <div className="agenda-config-bloqueos-list">
            {bloqueos.length === 0 ? (
              <div className="agenda-config-page__empty">
                <AlertTriangle size={48} />
                <h3>Sin bloqueos</h3>
                <p>No tienes bloqueos de horario registrados.</p>
              </div>
            ) : (
              bloqueos.map((bloqueo) => (
                <div key={bloqueo.id} className="agenda-config-bloqueo-card">
                  <div
                    className="agenda-config-bloqueo-card__header"
                    onClick={() => setExpandedBloqueo(expandedBloqueo === bloqueo.id ? null : bloqueo.id)}
                  >
                    <div className="agenda-config-bloqueo-card__info">
                      <span className="agenda-config-bloqueo-card__dates">
                        {formatLADate(bloqueo.fechaInicio)}
                        {' '}
                        {formatTime(bloqueo.fechaInicio?.substring(11, 16))}
                        {' - '}
                        {formatTime(bloqueo.fechaFin?.substring(11, 16))}
                      </span>
                      {bloqueo.motivo && (
                        <span className="agenda-config-bloqueo-card__motivo">{bloqueo.motivo}</span>
                      )}
                    </div>
                    <div className="agenda-config-bloqueo-card__actions">
                      <button
                        className="agenda-config-bloqueo-card__delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBloqueo(bloqueo.id);
                        }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                      {expandedBloqueo === bloqueo.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Agenda Doctora (Read-only) */}
      {activeTab === 'doctora' && (
        <div className="agenda-config-section">
          <div className="agenda-config-section__header">
            <h2>Agenda de la Doctora</h2>
            <span className="agenda-config-section__badge">Solo lectura</span>
          </div>
          <div className="agenda-config-page__empty">
            <Eye size={48} />
            <h3>Vista de la agenda de la doctora</h3>
            <p>Próximamente podrás ver la agenda de la doctora aquí.</p>
          </div>
        </div>
      )}
    </div>
  );
}
