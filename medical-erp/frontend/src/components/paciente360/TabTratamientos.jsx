import { useState, useEffect } from 'react';
import { Loader2, Calendar, Stethoscope, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Activity, Target, TrendingUp, DollarSign, Play, Pause, XCircle } from 'lucide-react';
import { tratamientoService } from '../../services/tratamientoService';
import { getTreatmentLabel } from '../../config/attentionTypes';
import TratamientoTimeline from '../atencion/TratamientoTimeline';

const ESTADO_CONFIG = {
  PENDIENTE: { label: 'Pendiente', icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
  PROGRAMADO: { label: 'Programado', icon: Calendar, color: '#3B82F6', bg: '#EFF6FF' },
  EN_CURSO: { label: 'En Curso', icon: Activity, color: '#22C55E', bg: '#F0FDF4' },
  PAUSADO: { label: 'Pausado', icon: Pause, color: '#F59E0B', bg: '#FFFBEB' },
  FINALIZADO: { label: 'Finalizado', icon: CheckCircle, color: '#6B7D95', bg: '#E2E8F0' },
  CANCELADO: { label: 'Cancelado', icon: XCircle, color: '#EF4444', bg: '#FEF2F2' },
};

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'PENDIENTE', label: 'Pendientes' },
  { key: 'PROGRAMADO', label: 'Programados' },
  { key: 'EN_CURSO', label: 'En Curso' },
  { key: 'FINALIZADO', label: 'Finalizados' },
];

export default function TabTratamientos({ pacienteId, historiaId }) {
  const [tratamientos, setTratamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadData();
  }, [pacienteId, historiaId]);

  const loadData = async () => {
    if (!pacienteId) return;
    try {
      const tratRes = await tratamientoService.listByPaciente(pacienteId, { size: 100, sort: 'createdAt,desc' }).catch(() => ({ success: false }));
      const tratamientosData = tratRes?.success ? (tratRes.data?.content || tratRes.data || []) : [];
      setTratamientos(tratamientosData);
    } catch (err) {
      console.error('Error loading tratamientos:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return null;
    return `S/ ${parseFloat(amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  const getEstadoBadge = (estado) => {
    const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG.PENDIENTE;
    const Icon = config.icon;
    return (
      <span
        className="tratamiento-badge"
        style={{ color: config.color, background: config.bg }}
      >
        <Icon size={12} /> {config.label}
      </span>
    );
  };

  const getProgressPercent = (t) => {
    if (!t.sesionesPlaneadas || t.sesionesPlaneadas === 0) return 0;
    return Math.min(100, Math.round(((t.sesionesRealizadas || 0) / t.sesionesPlaneadas) * 100));
  };

  const filtered = filterEstado === 'todos'
    ? tratamientos
    : tratamientos.filter(t => t.estado === filterEstado);

  const totalCosto = tratamientos.reduce((sum, t) => sum + (parseFloat(t.costoTotal) || 0), 0);
  const activos = tratamientos.filter(t => t.estado === 'EN_CURSO').length;
  const pendientes = tratamientos.filter(t => t.estado === 'PENDIENTE' || t.estado === 'PROGRAMADO').length;
  const completados = tratamientos.filter(t => t.estado === 'FINALIZADO').length;

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="tab-tratamientos">
        <div className="loading">
          <Loader2 size={24} className="spinner" />
          <p>Cargando tratamientos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-tratamientos">
      <div className="tab-tratamientos__header">
        <h3>Seguimiento de Tratamientos</h3>
        <div className="tab-tratamientos__filters">
          {FILTERS.map(f => {
            const count = f.key === 'todos'
              ? tratamientos.length
              : tratamientos.filter(t => t.estado === f.key).length;
            return (
              <button
                key={f.key}
                className={`btn btn--ghost btn--sm ${filterEstado === f.key ? 'active' : ''}`}
                onClick={() => setFilterEstado(f.key)}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {tratamientos.length > 0 && (
        <div className="tab-tratamientos__summary">
          <div className="summary-item">
            <Stethoscope size={16} />
            <span>Total: <strong>{tratamientos.length}</strong></span>
          </div>
          <div className="summary-item">
            <Activity size={16} style={{ color: '#22C55E' }} />
            <span>Activos: <strong>{activos}</strong></span>
          </div>
          <div className="summary-item">
            <Clock size={16} style={{ color: '#F59E0B' }} />
            <span>Pendientes: <strong>{pendientes}</strong></span>
          </div>
          <div className="summary-item">
            <CheckCircle size={16} style={{ color: '#6B7D95' }} />
            <span>Completados: <strong>{completados}</strong></span>
          </div>
          {totalCosto > 0 && (
            <div className="summary-item">
              <DollarSign size={16} />
              <span>Total: <strong>{formatCurrency(totalCosto)}</strong></span>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Stethoscope size={40} strokeWidth={1.2} />
          <p>{tratamientos.length === 0 ? 'No hay tratamientos registrados' : 'No hay tratamientos con este filtro'}</p>
        </div>
      ) : (
        <div className="tab-tratamientos__list">
          {filtered.map((t) => {
            const isExpanded = expandedId === t.id;
            const progress = getProgressPercent(t);
            return (
              <div
                key={t.id}
                className={`tratamiento-card ${isExpanded ? 'tratamiento-card--expanded' : ''}`}
              >
                <div className="tratamiento-card__header" onClick={() => toggleExpand(t.id)}>
                  <div className="tratamiento-card__title">
                    <Activity size={16} />
                    <span>{getTreatmentLabel(t.tipoTratamiento)}</span>
                  </div>
                  <div className="tratamiento-card__header-right">
                    <div className="tratamiento-card__badges">
                      {getEstadoBadge(t.estado)}
                      {t.costoTotal > 0 && (
                        <span className="tratamiento-badge tratamiento-badge--costo">
                          {formatCurrency(t.costoTotal)}
                        </span>
                      )}
                    </div>
                    <button className="tratamiento-card__expand">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                <div className="tratamiento-card__body">
                  {t.objetivo && (
                    <div className="tratamiento-field">
                      <Target size={14} />
                      <span>{t.objetivo}</span>
                    </div>
                  )}

                  <div className="tratamiento-card__meta">
                    {t.fechaInicio && (
                      <div className="tratamiento-meta-item">
                        <Calendar size={13} />
                        <span>Inicio: {formatDate(t.fechaInicio)}</span>
                      </div>
                    )}
                    {t.fechaFin && (
                      <div className="tratamiento-meta-item">
                        <CheckCircle size={13} />
                        <span>Fin: {formatDate(t.fechaFin)}</span>
                      </div>
                    )}
                    {t.sesionesPlaneadas > 0 && (
                      <div className="tratamiento-meta-item">
                        <Activity size={13} />
                        <span>Sesiones: {t.sesionesRealizadas || 0}/{t.sesionesPlaneadas}</span>
                      </div>
                    )}
                  </div>

                  {t.sesionesPlaneadas > 0 && (
                    <div className="tratamiento-card__progress">
                      <div className="tratamiento-progress-bar">
                        <div
                          className="tratamiento-progress-fill"
                          style={{
                            width: `${progress}%`,
                            background: progress >= 100 ? '#22C55E' : '#3B82F6',
                          }}
                        />
                      </div>
                      <span className="tratamiento-progress-text">{progress}%</span>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="tratamiento-card__detail">
                    {t.diagnosticoInicial && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">Diagnóstico Inicial</span>
                        <p className="tratamiento-detail-text">{t.diagnosticoInicial}</p>
                      </div>
                    )}

                    {t.observaciones && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">Observaciones</span>
                        <p className="tratamiento-detail-text">{t.observaciones}</p>
                      </div>
                    )}

                    {t.resultadoFinal && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">Resultado Final</span>
                        <p className="tratamiento-detail-text">{t.resultadoFinal}</p>
                      </div>
                    )}

                    {t.motivoPausa && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">Motivo de Pausa</span>
                        <p className="tratamiento-detail-text">{t.motivoPausa}</p>
                      </div>
                    )}

                    {t.motivoCancelacion && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">Motivo de Cancelación</span>
                        <p className="tratamiento-detail-text">{t.motivoCancelacion}</p>
                      </div>
                    )}

                    {t.costoEstimado > 0 && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">Costo Estimado</span>
                        <p className="tratamiento-detail-text">{formatCurrency(t.costoEstimado)}</p>
                      </div>
                    )}

                    <TratamientoTimeline tratamientoId={t.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
