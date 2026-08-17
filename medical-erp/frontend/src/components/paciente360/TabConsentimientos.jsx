import { useState, useEffect } from 'react';
import { Shield, FileText, Check, Clock, X, Eye, Trash2, Edit2, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { pacienteConsentimientoService } from '../../services/pacienteSubServices';

function formatFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFechaHora(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ESTADO_CONFIG = {
  FIRMADO: { label: 'Firmado', icon: Check, color: '#22C55E', bg: '#F0FDF4' },
  BORRADOR: { label: 'Borrador', icon: FileText, color: '#94A3B8', bg: '#F8FAFC' },
  REVISION: { label: 'En Revisión', icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
  ANULADO: { label: 'Anulado', icon: X, color: '#EF4444', bg: '#FEF2F2' },
};

export default function TabConsentimientos({ pacienteId }) {
  const [consentimientos, setConsentimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    loadConsentimientos();
  }, [pacienteId]);

  const loadConsentimientos = async () => {
    try {
      setLoading(true);
      const res = await pacienteConsentimientoService.list(pacienteId);
      if (res.success) {
        const data = res.data;
        setConsentimientos(Array.isArray(data) ? data : data?.content || []);
      }
    } catch (err) {
      console.error('Error loading consentimientos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAceptado = async (consent) => {
    setSaving(true);
    try {
      const res = await pacienteConsentimientoService.update(pacienteId, consent.id, {
        aceptado: !consent.aceptado,
      });
      if (res.success) {
        await loadConsentimientos();
        setEditingId(null);
      }
    } catch (err) {
      console.error('Error updating consentimiento:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (consentId) => {
    setSaving(true);
    try {
      const res = await pacienteConsentimientoService.delete(pacienteId, consentId);
      if (res.success) {
        setConfirmDeleteId(null);
        await loadConsentimientos();
      }
    } catch (err) {
      console.error('Error deleting consentimiento:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="tab-loading">Cargando consentimientos...</div>;
  }

  return (
    <div className="tab-consentimientos">
      <div className="tab-consentimientos__header">
        <h3>Consentimientos</h3>
        <span className="tab-consentimientos__count">{consentimientos.length} registro(s)</span>
      </div>

      {consentimientos.length === 0 ? (
        <div className="tab-empty">
          <Shield size={48} />
          <p>No hay consentimientos registrados</p>
        </div>
      ) : (
        <div className="tab-consentimientos__list">
          {consentimientos.map((consent) => {
            const config = ESTADO_CONFIG[consent.estadoDocumento] || ESTADO_CONFIG[consent.estado] || ESTADO_CONFIG.BORRADOR;
            const Icon = config.icon;
            const isExpanded = expandedId === consent.id;
            const isEditing = editingId === consent.id;
            const isConfirmDelete = confirmDeleteId === consent.id;

            return (
              <div key={consent.id} className={`consent-card ${isExpanded ? 'consent-card--expanded' : ''}`}>
                <div
                  className="consent-card__main"
                  onClick={() => setExpandedId(isExpanded ? null : consent.id)}
                >
                  <div className="consent-card__icon" style={{ background: config.bg }}>
                    <Icon size={20} style={{ color: config.color }} />
                  </div>
                  <div className="consent-card__info">
                    <h4 className="consent-card__nombre">{consent.tipo || consent.templateNombre || 'Consentimiento'}</h4>
                    <span className="consent-card__fecha">{formatFecha(consent.fechaFirma || consent.createdAt)}</span>
                  </div>
                  <div className="consent-card__right">
                    <span className="consent-card__estado" style={{ background: config.bg, color: config.color }}>
                      {config.label}
                    </span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="consent-card__detail">
                    <div className="consent-card__detail-grid">
                      <div className="consent-card__detail-row">
                        <span className="consent-card__detail-label">Tipo</span>
                        <span className="consent-card__detail-value">{consent.tipo || '-'}</span>
                      </div>
                      <div className="consent-card__detail-row">
                        <span className="consent-card__detail-label">Estado Documento</span>
                        <span className="consent-card__detail-value">{consent.estadoDocumento || consent.estado || '-'}</span>
                      </div>
                      <div className="consent-card__detail-row">
                        <span className="consent-card__detail-label">Aceptado</span>
                        <span className="consent-card__detail-value">{consent.aceptado ? 'Sí' : 'No'}</span>
                      </div>
                      <div className="consent-card__detail-row">
                        <span className="consent-card__detail-label">Fecha</span>
                        <span className="consent-card__detail-value">{formatFecha(consent.fecha)}</span>
                      </div>
                      {consent.version && (
                        <div className="consent-card__detail-row">
                          <span className="consent-card__detail-label">Versión</span>
                          <span className="consent-card__detail-value">{consent.version}</span>
                        </div>
                      )}
                      {consent.firmaFecha && (
                        <div className="consent-card__detail-row">
                          <span className="consent-card__detail-label">Fecha Firma</span>
                          <span className="consent-card__detail-value">{formatFechaHora(consent.firmaFecha)}</span>
                        </div>
                      )}
                      {consent.hashDocumento && (
                        <div className="consent-card__detail-row consent-card__detail-row--full">
                          <span className="consent-card__detail-label">Hash</span>
                          <span className="consent-card__detail-value consent-card__detail-value--mono">{consent.hashDocumento}</span>
                        </div>
                      )}
                    </div>

                    <div className="consent-card__actions">
                      {isEditing ? (
                        <>
                          <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                          >
                            Cancelar
                          </button>
                          <button
                            className="btn btn--primary btn--sm"
                            onClick={() => handleToggleAceptado(consent)}
                            disabled={saving}
                          >
                            {saving ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
                            {saving ? 'Guardando...' : consent.aceptado ? 'Marcar como No Aceptado' : 'Marcar como Aceptado'}
                          </button>
                        </>
                      ) : isConfirmDelete ? (
                        <>
                          <span className="consent-card__confirm-text">¿Eliminar este consentimiento?</span>
                          <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={saving}
                          >
                            Cancelar
                          </button>
                          <button
                            className="btn btn--danger btn--sm"
                            onClick={() => handleDelete(consent.id)}
                            disabled={saving}
                          >
                            {saving ? <Loader2 size={14} className="spinner" /> : <Trash2 size={14} />}
                            {saving ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn--ghost btn--sm"
                            onClick={(e) => { e.stopPropagation(); setEditingId(consent.id); }}
                          >
                            <Edit2 size={14} /> Editar
                          </button>
                          <button
                            className="btn btn--ghost btn--sm btn--danger"
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(consent.id); }}
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </>
                      )}
                    </div>
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
