import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Calendar, Stethoscope, Clock, CheckCircle, ChevronDown, ChevronUp, Activity, Target, TrendingUp, DollarSign, Play, Pause, XCircle, X, ChevronLeft, ChevronRight, FileText, User } from 'lucide-react';
import { tratamientoService } from '../../services/tratamientoService';
import { consultasService } from '../../services/consultasService';
import { getTreatmentLabel } from '../../config/attentionTypes';
import { formatCurrency } from '../../utils/currency';
import { zonaIANA } from '../../utils/zonaHoraria';
import TratamientoTimeline from '../atencion/TratamientoTimeline';
import { formatLADate, parseLADateTime } from '../../utils/laTimezone';
import { evidenciaService } from '../../services/evidenciaService';
import { useUnitSystem } from '../../context/UnitContext';
import { pesoAUS, tallaAUS } from '../../utils/units';
import ImageViewer from '../ui/ImageViewer';

const ESTADO_CONFIG = {
  PENDIENTE: { labelKey: 'pending', icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
  PROGRAMADO: { labelKey: 'programado', icon: Calendar, color: '#3B82F6', bg: '#EFF6FF' },
  EN_CURSO: { labelKey: 'active', icon: Activity, color: '#22C55E', bg: '#F0FDF4' },
  PAUSADO: { labelKey: 'pausado', icon: Pause, color: '#F59E0B', bg: '#FFFBEB' },
  FINALIZADO: { labelKey: 'finalizado', icon: CheckCircle, color: '#6B7D95', bg: '#E2E8F0' },
  CANCELADO: { labelKey: 'cancelled', icon: XCircle, color: '#EF4444', bg: '#FEF2F2' },
};

function formatFecha(value) {
  if (!value) return '-';
  const d = parseLADateTime(value) || new Date(value);
  if (isNaN(d)) return String(value);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: zonaIANA() });
}

function ConsultaOrigenSection({ consulta, t }) {
  if (!consulta) return null;
  const diags = Array.isArray(consulta.diagnosticoLista) ? consulta.diagnosticoLista.map((d) => d.descripcion || d) : (consulta.diagnosticoLista || '');
  const plan = typeof consulta.planTratamiento === 'string' ? consulta.planTratamiento : (consulta.planTratamiento?.indicaciones || '');
  const campos = [
    { label: t('motivo_visita'), valor: consulta.motivo },
    { label: t('diagnostico'), valor: Array.isArray(diags) ? diags.join(', ') : diags },
    { label: t('dolores_sintomas'), valor: consulta.tiempoEnfermedad },
    { label: t('signos_sintomas'), valor: consulta.signosSintomas },
    { label: t('relato_cronologico'), valor: consulta.relatoCronologico },
    { label: t('examen_fisico'), valor: consulta.examenClinicoGeneral },
    { label: t('plan_tratamiento'), valor: plan },
    { label: t('notas'), valor: consulta.notas },
  ].filter((c) => c.valor);
  return (
    <div className="detalle-modal__seccion">
      <h4 className="detalle-modal__titulo"><FileText size={15} /> {t('consulta_origen')}</h4>
      <div className="detalle-modal__grid">
        {campos.map((c) => (
          <div key={c.label} className="detalle-modal__campo">
            <span className="detalle-modal__label">{c.label}</span>
            <div className="detalle-modal__valor">{c.valor}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TratamientoDetailModal({ tratamiento, sesiones, fotosTratamiento, evidenciasPorSesion, consultaOrigen, t, onClose, onOpenSesion, onOpenFoto }) {
  const { system } = useUnitSystem();
  if (!tratamiento) return null;
  const estado = ESTADO_CONFIG[tratamiento.estado] || ESTADO_CONFIG.PENDIENTE;
  const EstadoIcon = estado.icon;
  const progress = tratamiento.sesionesPlaneadas > 0 ? Math.min(100, Math.round(((tratamiento.sesionesRealizadas || 0) / tratamiento.sesionesPlaneadas) * 100)) : 0;

  const fotosGlobales = fotosTratamiento || [];
  const inicio = fotosGlobales.find((f) => f.tipo === 'FOTO_INICIO');
  const fin = fotosGlobales.find((f) => f.tipo === 'FOTO_FIN');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detalle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detalle-modal__header">
          <h3><Stethoscope size={20} /> {getTreatmentLabel(tratamiento.tipoTratamiento)}</h3>
          <button className="detalle-modal__close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="detalle-modal__body">
          <div className="detalle-modal__resumen">
            <div className="detalle-modal__estado" style={{ color: estado.color, background: estado.bg }}><EstadoIcon size={14} /> {t(estado.labelKey, { ns: 'common' })}</div>
            <span className="detalle-modal__meta"><Calendar size={14} /> {tratamiento.fechaInicio ? formatLADate(tratamiento.fechaInicio, 'es-ES') : '-'}</span>
            <span className="detalle-modal__meta"><Activity size={14} /> {tratamiento.sesionesRealizadas || 0}/{tratamiento.sesionesPlaneadas} {t('sesiones')}</span>
            <span className="detalle-modal__meta"><DollarSign size={14} /> {tratamiento.costoTotal > 0 ? formatCurrency(tratamiento.costoTotal) : '-'}</span>
            <div className="detalle-modal__progress">
              <div className="tratamiento-progress-bar"><div className="tratamiento-progress-fill" style={{ width: `${progress}%`, background: progress >= 100 ? '#22C55E' : '#3B82F6' }} /></div>
              <span>{progress}%</span>
            </div>
          </div>

          <ConsultaOrigenSection consulta={consultaOrigen} t={t} />

          <div className="detalle-modal__seccion">
            <h4 className="detalle-modal__titulo"><Stethoscope size={15} /> {t('tratamiento')}</h4>
            <div className="detalle-modal__grid">
              {tratamiento.objetivo && (
                <div className="detalle-modal__campo"><span className="detalle-modal__label">{t('objetivo')}</span><div className="detalle-modal__valor">{tratamiento.objetivo}</div></div>
              )}
              {tratamiento.diagnosticoInicial && (
                <div className="detalle-modal__campo"><span className="detalle-modal__label">{t('diagnostico_inicial')}</span><div className="detalle-modal__valor">{tratamiento.diagnosticoInicial}</div></div>
              )}
              {tratamiento.observaciones && (
                <div className="detalle-modal__campo"><span className="detalle-modal__label">{t('observaciones')}</span><div className="detalle-modal__valor">{tratamiento.observaciones}</div></div>
              )}
              {tratamiento.resultadoFinal && (
                <div className="detalle-modal__campo"><span className="detalle-modal__label">{t('resultado_final')}</span><div className="detalle-modal__valor">{tratamiento.resultadoFinal}</div></div>
              )}
            </div>
          </div>

          <div className="detalle-modal__seccion">
            <h4 className="detalle-modal__titulo"><Activity size={15} /> {t('sesiones_registradas')}</h4>
            {sesiones.length === 0 ? (
              <p className="detalle-modal__vacio">{t('sin_sesiones')}</p>
            ) : (
              <div className="sesiones-list">
                {sesiones.map((s, idx) => {
                  const sv = s.signosVitales || {};
                  const fotosSes = evidenciasPorSesion?.[s.id] || s.evidencias || [];
                  return (
                    <div key={s.id} className="sesiones-list__row" onClick={() => onOpenSesion(idx)}>
                      <div className="sesiones-list__num">{s.numeroSesion}</div>
                      <div className="sesiones-list__info">
                        <span className="sesiones-list__titulo">{t('sesion')} {s.numeroSesion} · {formatFecha(s.fecha)}</span>
                        <span className="sesiones-list__fotos">
                          {s.costoSesion != null && <span className="sesiones-list__costo">{formatCurrency(s.costoSesion)}</span>}
                          {sv.peso != null && <span>{system === 'us' ? pesoAUS(sv.peso) : sv.peso} {system === 'us' ? 'lbs' : 'kg'}</span>}
                          {sv.talla != null && <span>{system === 'us' ? tallaAUS(sv.talla) : sv.talla} {system === 'us' ? 'in' : 'cm'}</span>}
                          {fotosSes.length > 0 && <span><FileText size={12} /> {fotosSes.length} {t('fotos')}</span>}
                        </span>
                      </div>
                      <div className="sesiones-list__derecha"><ChevronRight size={16} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {(inicio || fin || sesiones.length > 0) && (
            <div className="detalle-modal__seccion">
              <h4 className="detalle-modal__titulo"><TrendingUp size={15} /> {t('seguimiento_progreso')}</h4>
              <div className="seguimiento-gallery">
                {inicio && (
                  <div className="seguimiento-gallery__item" onClick={() => onOpenFoto(0)}>
                    <img src={evidenciaService.getFileUrl(inicio.archivoRuta)} alt={t('foto_inicial')} />
                    <span className="progreso-fotos__item-tag">{t('foto_inicial')}</span>
                    {inicio.descripcion && <span className="progreso-fotos__item-desc">{inicio.descripcion}</span>}
                  </div>
                )}
                {sesiones.map((s, idx) => {
                  const fotosSes = evidenciasPorSesion?.[s.id] || s.evidencias || [];
                  return fotosSes.map((ev) => (
                    <div key={ev.id} className="seguimiento-gallery__item" onClick={() => onOpenFoto(ev.id)}>
                      <img src={evidenciaService.getFileUrl(ev.archivoRuta)} alt={ev.descripcion || `${t('sesion')} ${s.numeroSesion}`} />
                      <span className="progreso-fotos__item-tag">S{s.numeroSesion}</span>
                      {ev.descripcion && <span className="progreso-fotos__item-desc">{ev.descripcion}</span>}
                    </div>
                  ));
                })}
                {fin && (
                  <div className="seguimiento-gallery__item" onClick={() => onOpenFoto('fin')}>
                    <img src={evidenciaService.getFileUrl(fin.archivoRuta)} alt={t('foto_actual')} />
                    <span className="progreso-fotos__item-tag">{t('foto_actual')}</span>
                    {fin.descripcion && <span className="progreso-fotos__item-desc">{fin.descripcion}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="tratamiento-historico">
            <TratamientoTimeline tratamientoId={tratamiento.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TabTratamientos({ pacienteId, historiaId }) {
  const { t } = useTranslation('patients');
  const { t: tCommon } = useTranslation('common');
  const [tratamientos, setTratamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [detalle, setDetalle] = useState(null);
  const [sesiones, setSesiones] = useState({});
  const [evidenciasPorSesion, setEvidenciasPorSesion] = useState({});
  const [fotosTratamiento, setFotosTratamiento] = useState({});
  const [consultaOrigen, setConsultaOrigen] = useState({});
  const [enSesion, setEnSesion] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [viewerFotos, setViewerFotos] = useState([]);

  useEffect(() => {
    loadData();
  }, [pacienteId, historiaId]);

  const loadData = async () => {
    if (!pacienteId) return;
    try {
      const tratRes = await tratamientoService.listByPaciente(pacienteId, { size: 100, sort: 'createdAt,desc' }).catch(() => ({ success: false }));
      setTratamientos(tratRes?.success ? (tratRes.data?.content || tratRes.data || []) : []);
    } catch { /* silencio */ } finally {
      setLoading(false);
    }
  };

  const cargarDetalle = async (tr) => {
    setDetalle(tr);
    if (sesiones[tr.id]) return;
    try {
      const [sesRes, evRes, conRes] = await Promise.all([
        tratamientoService.getSesiones(tr.id).catch(() => ({ success: false })),
        evidenciaService.listByPaciente(pacienteId).catch(() => ({ success: false })),
        tr.consultaOrigenId
          ? consultasService.getById(tr.consultaOrigenId).catch(() => ({ success: false }))
          : consultasService.getByPaciente(pacienteId).then((res) => {
              const list = res?.success ? (res.data || []) : [];
              const sorted = [...list].sort((a, b) => (b.fecha || b.createdAt || '').localeCompare(a.fecha || a.createdAt || ''));
              return sorted.length > 0 ? { success: true, data: sorted[0] } : { success: false };
            }).catch(() => ({ success: false })),
      ]);
      const list = sesRes?.success ? (sesRes.data || []) : [];
      setSesiones((prev) => ({ ...prev, [tr.id]: list }));

      const evs = evRes?.success ? (evRes.data || []) : [];
      const trEv = evs.find((x) => x.tratamientoId === tr.id);
      const globales = trEv?.sesiones?.find((s) => s.esTratamiento)?.evidencias || [];
      setFotosTratamiento((prev) => ({ ...prev, [tr.id]: globales }));
      const porSesion = {};
      (trEv?.sesiones || []).forEach((s) => {
        if (s.sesionId) porSesion[s.sesionId] = s.evidencias || [];
      });
      setEvidenciasPorSesion((prev) => ({ ...prev, [tr.id]: porSesion }));

      if (conRes?.success) setConsultaOrigen((prev) => ({ ...prev, [tr.id]: conRes.data }));
    } catch { /* silencio */ }
  };

  const abrirFoto = (tr, key) => {
    const globales = fotosTratamiento[tr.id] || [];
    const fotos = [];
    globales.forEach((f) => fotos.push({ key: f.id, url: evidenciaService.getFileUrl(f.archivoRuta), descripcion: f.descripcion }));
    (sesiones[tr.id] || []).forEach((s) => {
      (evidenciasPorSesion[tr.id]?.[s.id] || s.evidencias || []).forEach((ev) => fotos.push({ key: ev.id, url: evidenciaService.getFileUrl(ev.archivoRuta), descripcion: ev.descripcion }));
    });
    setViewerFotos(fotos);
    const idx = fotos.findIndex((f) => String(f.key) === String(key));
    setViewer({ index: idx >= 0 ? idx : 0 });
  };

  const getEstadoBadge = (estado) => {
    const config = ESTADO_CONFIG[estado] || ESTADO_CONFIG.PENDIENTE;
    const Icon = config.icon;
    return <span className="tratamiento-badge" style={{ color: config.color, background: config.bg }}><Icon size={12} /> {t(config.labelKey, { ns: 'common' })}</span>;
  };

  const getProgressPercent = (tr) => tr.sesionesPlaneadas > 0 ? Math.min(100, Math.round(((tr.sesionesRealizadas || 0) / tr.sesionesPlaneadas) * 100)) : 0;

  const filtered = filterEstado === 'todos' ? tratamientos : tratamientos.filter((tr) => tr.estado === filterEstado);
  const totalCosto = tratamientos.reduce((sum, tr) => sum + (parseFloat(tr.costoTotal) || 0), 0);
  const activos = tratamientos.filter((tr) => tr.estado === 'EN_CURSO').length;
  const pendientes = tratamientos.filter((tr) => tr.estado === 'PENDIENTE' || tr.estado === 'PROGRAMADO').length;
  const completados = tratamientos.filter((tr) => tr.estado === 'FINALIZADO').length;

  if (loading) {
    return <div className="tab-tratamientos"><div className="loading"><Loader2 size={24} className="spinner" /><p>{tCommon('loading')}</p></div></div>;
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
          {FILTERS.map((f) => {
            const count = f.key === 'todos' ? tratamientos.length : tratamientos.filter((tr) => tr.estado === f.key).length;
            return <button key={f.key} className={`btn btn--ghost btn--sm ${filterEstado === f.key ? 'active' : ''}`} onClick={() => setFilterEstado(f.key)}>{f.label} ({count})</button>;
          })}
        </div>
      </div>

      {tratamientos.length > 0 && (
        <div className="tab-tratamientos__summary">
          <div className="summary-item"><Stethoscope size={16} /><span>{tCommon('total')}: <strong>{tratamientos.length}</strong></span></div>
          <div className="summary-item"><Activity size={16} style={{ color: '#22C55E' }} /><span>{t('active', { ns: 'common' })}: <strong>{activos}</strong></span></div>
          <div className="summary-item"><Clock size={16} style={{ color: '#F59E0B' }} /><span>{t('pending', { ns: 'common' })}: <strong>{pendientes}</strong></span></div>
          <div className="summary-item"><CheckCircle size={16} style={{ color: '#6B7D95' }} /><span>{tCommon('completed')}: <strong>{completados}</strong></span></div>
          {totalCosto > 0 && <div className="summary-item"><DollarSign size={16} /><span>{tCommon('total')}: <strong>{formatCurrency(totalCosto)}</strong></span></div>}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state"><Stethoscope size={40} strokeWidth={1.2} /><p>{tratamientos.length === 0 ? t('sin_tratamientos_registrados') : t('filtrar_tratamientos')}</p></div>
      ) : (
        <div className="tab-tratamientos__list">
          {filtered.map((tr) => {
            const progress = getProgressPercent(tr);
            return (
              <div key={tr.id} className="tratamiento-card" onClick={() => cargarDetalle(tr)}>
                <div className="tratamiento-card__header">
                  <div className="tratamiento-card__title"><Activity size={16} /><span>{getTreatmentLabel(tr.tipoTratamiento)}</span></div>
                  <div className="tratamiento-card__header-right">
                    <div className="tratamiento-card__badges">
                      {getEstadoBadge(tr.estado)}
                      {tr.costoTotal > 0 && <span className="tratamiento-badge tratamiento-badge--costo">{formatCurrency(tr.costoTotal)}</span>}
                    </div>
                    <ChevronRight size={18} />
                  </div>
                </div>
                <div className="tratamiento-card__body">
                  {tr.objetivo && <div className="tratamiento-field"><Target size={14} /><span>{tr.objetivo}</span></div>}
                  <div className="tratamiento-card__meta">
                    <div className="tratamiento-meta-item"><Activity size={13} /><span>{t('sesion')}: {tr.sesionesRealizadas || 0}/{tr.sesionesPlaneadas}</span></div>
                  </div>
                  {tr.sesionesPlaneadas > 0 && (
                    <div className="tratamiento-card__progress">
                      <div className="tratamiento-progress-bar"><div className="tratamiento-progress-fill" style={{ width: `${progress}%`, background: progress >= 100 ? '#22C55E' : '#3B82F6' }} /></div>
                      <span className="tratamiento-progress-text">{progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detalle && (
        <TratamientoDetailModal
          tratamiento={detalle}
          sesiones={sesiones[detalle.id] || []}
          fotosTratamiento={fotosTratamiento[detalle.id] || []}
          evidenciasPorSesion={evidenciasPorSesion[detalle.id] || {}}
          consultaOrigen={consultaOrigen[detalle.id] || null}
          t={t}
          onClose={() => setDetalle(null)}
          onOpenSesion={(idx) => setEnSesion({ trId: detalle.id, index: idx })}
          onOpenFoto={(key) => abrirFoto(detalle, key)}
        />
      )}

      {enSesion && (
        <SesionDetailModalTratamiento
          tratamiento={detalle}
          sesiones={sesiones[enSesion.trId] || []}
          index={enSesion.index}
          evidenciasPorSesion={evidenciasPorSesion[enSesion.trId] || {}}
          t={t}
          onClose={() => setEnSesion(null)}
          onNavigate={(idx) => setEnSesion({ ...enSesion, index: idx })}
          onOpenFoto={(key) => abrirFoto(detalle, key)}
        />
      )}

      {viewer && <ImageViewer images={viewerFotos} currentIndex={viewer.index} onClose={() => setViewer(null)} />}
    </div>
  );
}

function SesionDetailModalTratamiento({ tratamiento, sesiones, index, evidenciasPorSesion, t, onClose, onNavigate, onOpenFoto }) {
  const { system } = useUnitSystem();
  const sesion = sesiones[index];
  if (!sesion) return null;
  const sv = sesion.signosVitales || {};
  const peso = sv.peso != null ? (system === 'us' ? pesoAUS(sv.peso) : sv.peso) : null;
  const talla = sv.talla != null ? (system === 'us' ? tallaAUS(sv.talla) : sv.talla) : null;
  const fotos = evidenciasPorSesion?.[sesion.id] || sesion.evidencias || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content sesion-detalle-modal">
        <div className="sesion-detalle-modal__header">
          <h3><Stethoscope size={20} /> {t('sesion_detalle')} — {getTreatmentLabel(tratamiento?.tipoTratamiento)}</h3>
          <div className="sesion-detalle-modal__nav">
            <button className="sesion-detalle-modal__navbtn" disabled={index <= 0} onClick={() => onNavigate(index - 1)}><ChevronLeft size={18} /></button>
            <span className="sesion-detalle-modal__counter">{sesion.numeroSesion} / {sesiones.length}</span>
            <button className="sesion-detalle-modal__navbtn" disabled={index >= sesiones.length - 1} onClick={() => onNavigate(index + 1)}><ChevronRight size={18} /></button>
          </div>
          <button className="sesion-detalle-modal__close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="sesion-detalle-modal__body">
          <div className="sesion-detalle-modal__meta">
            {sesion.fecha && <span className="sesion-detalle-modal__meta-item"><Calendar size={14} /> {formatFecha(sesion.fecha)}</span>}
            {sesion.costoSesion != null && <span className="sesion-detalle-modal__meta-item"><DollarSign size={14} /> {formatCurrency(sesion.costoSesion)}</span>}
            {peso != null && <span className="sesion-detalle-modal__meta-item"><User size={14} /> {peso} {system === 'us' ? 'lbs' : 'kg'}</span>}
            {talla != null && <span className="sesion-detalle-modal__meta-item"><Activity size={14} /> {talla} {system === 'us' ? 'in' : 'cm'}</span>}
          </div>
          {fotos.length > 0 ? (
            <div className="sesion-detalle-modal__galeria">
              <div className="sesion-detalle-modal__carousel">
                {fotos.map((ev, i) => (
                  <div key={ev.id} className="sesion-detalle-modal__foto-card">
                    <img src={evidenciaService.getFileUrl(ev.archivoRuta)} alt={ev.descripcion || `Foto ${i + 1}`} onClick={() => onOpenFoto(ev.id)} />
                    {ev.descripcion && <span className="sesion-detalle-modal__foto-desc">{ev.descripcion}</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="sesion-detalle-modal__empty">{t('sin_fotos_sesion')}</div>}
          <div className="sesion-detalle-modal__campos">
            {sesion.motivoVisita && <div className="sesion-detalle-modal__campo"><span className="sesion-detalle-modal__label">{t('motivo_visita')}</span><p className="sesion-detalle-modal__texto">{sesion.motivoVisita}</p></div>}
            {sesion.procedimientoRealizado && <div className="sesion-detalle-modal__campo"><span className="sesion-detalle-modal__label">{t('procedimiento')}</span><p className="sesion-detalle-modal__texto">{sesion.procedimientoRealizado}</p></div>}
            {sesion.medicamentos && <div className="sesion-detalle-modal__campo"><span className="sesion-detalle-modal__label">{t('medicamentos')}</span><p className="sesion-detalle-modal__texto">{sesion.medicamentos} {sesion.dosis ? `(${sesion.dosis})` : ''}</p></div>}
            {sesion.evolucion && <div className="sesion-detalle-modal__campo"><span className="sesion-detalle-modal__label">{t('evolucion')}</span><p className="sesion-detalle-modal__texto">{sesion.evolucion}</p></div>}
            {sesion.observaciones && <div className="sesion-detalle-modal__campo"><span className="sesion-detalle-modal__label">{t('observaciones')}</span><p className="sesion-detalle-modal__texto">{sesion.observaciones}</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
