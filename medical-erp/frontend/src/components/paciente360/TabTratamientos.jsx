import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Calendar, Stethoscope, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Activity, Target, TrendingUp, DollarSign, Play, Pause, XCircle } from 'lucide-react';
import { tratamientoService } from '../../services/tratamientoService';
import { getTreatmentLabel } from '../../config/attentionTypes';
import TratamientoTimeline from '../atencion/TratamientoTimeline';

export default function TabTratamientos({ pacienteId, historiaId }) {
  const { t } = useTranslation('patients');
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
    const ESTADO_CONFIG = {
      PENDIENTE: { label: t('pending', { ns: 'common' }), icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
      PROGRAMADO: { label: t('programado'), icon: Calendar, color: '#3B82F6', bg: '#EFF6FF' },
      EN_CURSO: { label: t('active', { ns: 'common' }), icon: Activity, color: '#22C55E', bg: '#F0FDF4' },
      PAUSADO: { label: t('pausado'), icon: Pause, color: '#F59E0B', bg: '#FFFBEB' },
      FINALIZADO: { label: t('finalizado'), icon: CheckCircle, color: '#6B7D95', bg: '#E2E8F0' },
      CANCELADO: { label: t('cancelled', { ns: 'common' }), icon: XCircle, color: '#EF4444', bg: '#FEF2F2' },
    };
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

  const getProgressPercent = (tr) => {
    if (!tr.sesionesPlaneadas || tr.sesionesPlaneadas === 0) return 0;
    return Math.min(100, Math.round(((tr.sesionesRealizadas || 0) / tr.sesionesPlaneadas) * 100));
  };

  const filtered = filterEstado === 'todos'
    ? tratamientos
    : tratamientos.filter(tr => tr.estado === filterEstado);

  const totalCosto = tratamientos.reduce((sum, tr) => sum + (parseFloat(tr.costoTotal) || 0), 0);
  const activos = tratamientos.filter(tr => tr.estado === 'EN_CURSO').length;
  const pendientes = tratamientos.filter(tr => tr.estado === 'PENDIENTE' || tr.estado === 'PROGRAMADO').length;
  const completados = tratamientos.filter(tr => tr.estado === 'FINALIZADO').length;

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="tab-tratamientos">
        <div className="loading">
          <Loader2 size={24} className="spinner" />
          <p>{t('loading', { ns: 'common' })}</p>
        </div>
      </div>
    );
  }

  const FILTERS = [
    { key: 'todos', label: t('all_filter') },
    { key: 'PENDIENTE', label: t('pending', { ns: 'common' }) },
    { key: 'PROGRAMADO', label: t('programado') },
    { key: 'EN_CURSO', label: t('active', { ns: 'common' }) },
    { key: 'FINALIZADO', label: t('finalizado') },
  ];

  return (
    <div className="tab-tratamientos">
      <div className="tab-tratamientos__header">
        <h3>{t('tratamientos_seguimiento')}</h3>
        <div className="tab-tratamientos__filters">
          {FILTERS.map(f => {
            const count = f.key === 'todos'
              ? tratamientos.length
              : tratamientos.filter(tr => tr.estado === f.key).length;
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
            <span>{t('total', { ns: 'common' })}: <strong>{tratamientos.length}</strong></span>
          </div>
          <div className="summary-item">
            <Activity size={16} style={{ color: '#22C55E' }} />
            <span>{t('active', { ns: 'common' })}: <strong>{activos}</strong></span>
          </div>
          <div className="summary-item">
            <Clock size={16} style={{ color: '#F59E0B' }} />
            <span>{t('pending', { ns: 'common' })}: <strong>{pendientes}</strong></span>
          </div>
          <div className="summary-item">
            <CheckCircle size={16} style={{ color: '#6B7D95' }} />
            <span>{t('completed', { ns: 'common' })}: <strong>{completados}</strong></span>
          </div>
          {totalCosto > 0 && (
            <div className="summary-item">
              <DollarSign size={16} />
              <span>{t('total', { ns: 'common' })}: <strong>{formatCurrency(totalCosto)}</strong></span>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Stethoscope size={40} strokeWidth={1.2} />
          <p>{tratamientos.length === 0 ? t('sin_tratamientos_registrados') : t('filtrar_tratamientos')}</p>
        </div>
      ) : (
        <div className="tab-tratamientos__list">
          {filtered.map((tr) => {
            const isExpanded = expandedId === tr.id;
            const progress = getProgressPercent(tr);
            return (
              <div
                key={tr.id}
                className={`tratamiento-card ${isExpanded ? 'tratamiento-card--expanded' : ''}`}
              >
                <div className="tratamiento-card__header" onClick={() => toggleExpand(tr.id)}>
                  <div className="tratamiento-card__title">
                    <Activity size={16} />
                    <span>{getTreatmentLabel(tr.tipoTratamiento)}</span>
                  </div>
                  <div className="tratamiento-card__header-right">
                    <div className="tratamiento-card__badges">
                      {getEstadoBadge(tr.estado)}
                      {tr.costoTotal > 0 && (
                        <span className="tratamiento-badge tratamiento-badge--costo">
                          {formatCurrency(tr.costoTotal)}
                        </span>
                      )}
                    </div>
                    <button className="tratamiento-card__expand">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                <div className="tratamiento-card__body">
                  {tr.objetivo && (
                    <div className="tratamiento-field">
                      <Target size={14} />
                      <span>{tr.objetivo}</span>
                    </div>
                  )}

                  <div className="tratamiento-card__meta">
                    {tr.fechaInicio && (
                      <div className="tratamiento-meta-item">
                        <Calendar size={13} />
                        <span>{t('inicio_label_2')} {formatDate(tr.fechaInicio)}</span>
                      </div>
                    )}
                    {tr.fechaFin && (
                      <div className="tratamiento-meta-item">
                        <CheckCircle size={13} />
                        <span>{t('fecha_fin')}: {formatDate(tr.fechaFin)}</span>
                      </div>
                    )}
                    {tr.sesionesPlaneadas > 0 && (
                      <div className="tratamiento-meta-item">
                        <Activity size={13} />
                        <span>{t('sesion')}: {tr.sesionesRealizadas || 0}/{tr.sesionesPlaneadas}</span>
                      </div>
                    )}
                  </div>

                  {tr.sesionesPlaneadas > 0 && (
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
                    {tr.diagnosticoInicial && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">{t('diagnostico')}</span>
                        <p className="tratamiento-detail-text">{tr.diagnosticoInicial}</p>
                      </div>
                    )}

                    {tr.observaciones && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">{t('observations', { ns: 'common' })}</span>
                        <p className="tratamiento-detail-text">{tr.observaciones}</p>
                      </div>
                    )}

                    {tr.resultadoFinal && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">{t('resultado_final')}</span>
                        <p className="tratamiento-detail-text">{tr.resultadoFinal}</p>
                      </div>
                    )}

                    {tr.motivoPausa && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">{t('motivo_pausa')}</span>
                        <p className="tratamiento-detail-text">{tr.motivoPausa}</p>
                      </div>
                    )}

                    {tr.motivoCancelacion && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">{t('motivo_cancelacion')}</span>
                        <p className="tratamiento-detail-text">{tr.motivoCancelacion}</p>
                      </div>
                    )}

                    {tr.costoEstimado > 0 && (
                      <div className="tratamiento-detail-section">
                        <span className="tratamiento-detail-label">{t('costo_total')}</span>
                        <p className="tratamiento-detail-text">{formatCurrency(tr.costoEstimado)}</p>
                      </div>
                    )}

                    <TratamientoTimeline tratamientoId={tr.id} />
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
