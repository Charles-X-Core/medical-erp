import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, CheckCircle, AlertTriangle, Clock, Shield } from 'lucide-react';
import { pacienteConsentimientoService } from '../../services/pacienteSubServices';

function formatFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ============================================
// ResumenSidebar — Patient overview + consent status
// Shows: consent status, actions taken, stats
// ============================================

export default function ResumenSidebar({ pacienteId, onFirmarContrato, contratoFirmado }) {
  const { t } = useTranslation('patients');
  const [consentimientos, setConsentimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await pacienteConsentimientoService.list(pacienteId);
      if (res?.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        setConsentimientos(list);
      }
    } catch {
      // No consentimientos yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pacienteId]);

  // Re-fetch when contratoFirmado changes (live update after signing)
  useEffect(() => {
    if (contratoFirmado === true) {
      loadData();
    }
  }, [contratoFirmado]);

  // Use contratoFirmado prop as primary source, fallback to local data
  const consentimientoFirmado = contratoFirmado === true || consentimientos.some(
    (c) => c.firmaFecha || c.aceptado === true
  );
  const consentimientosFirmados = consentimientos.filter((c) => c.firmaFecha);
  const consentimientosPendientes = consentimientos.filter((c) => !c.firmaFecha);

  return (
    <div className="resumen-sidebar">
      {/* Consentimiento Status */}
      <div className="resumen-sidebar__section">
        <h3 className="resumen-sidebar__title">
          <FileText size={14} /> {t('consentimiento_admision')}
        </h3>
        {loading && contratoFirmado !== true ? (
          <div className="resumen-sidebar__loading">{t('loading', { ns: 'common' })}</div>
        ) : consentimientoFirmado ? (
          <div className="resumen-sidebar__status resumen-sidebar__status--ok">
            <CheckCircle size={16} />
            <span>{t('consentimiento_firmado')}</span>
          </div>
        ) : (
          <div className="resumen-sidebar__status resumen-sidebar__status--warning">
            <AlertTriangle size={16} />
            <span>{t('sin_consentimiento_firmado')}</span>
          </div>
        )}
        {!consentimientoFirmado && (
          <div className="resumen-sidebar__alert">
            <AlertTriangle size={12} />
            <span>{t('sin_consentimiento_admision_firmado')}</span>
            {onFirmarContrato && (
              <button className="resumen-sidebar__btn-firmar" onClick={onFirmarContrato}>
                <Shield size={12} /> {t('firmar')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Acciones del Paciente */}
      <div className="resumen-sidebar__section">
        <h3 className="resumen-sidebar__title">
          <Clock size={14} /> {t('acciones_recientes')}
        </h3>
        {loading ? (
          <div className="resumen-sidebar__loading">{t('loading', { ns: 'common' })}</div>
        ) : consentimientos.length > 0 ? (
          <div className="resumen-sidebar__list">
            {consentimientos.slice(0, 5).map((c) => (
              <div key={c.id} className="resumen-sidebar__item">
                <div className={`resumen-sidebar__dot ${c.firmaFecha ? 'resumen-sidebar__dot--done' : 'resumen-sidebar__dot--pending'}`} />
                <div className="resumen-sidebar__item-info">
                  <span className="resumen-sidebar__item-label">
                    {c.tipo || c.templateNombre || t('consentimientos')}
                  </span>
                  <span className="resumen-sidebar__item-date">
                    {c.firmaFecha ? formatFecha(c.firmaFecha) : t('pendiente')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="resumen-sidebar__empty">
            <FileText size={16} />
            <p>{t('sin_acciones_registradas')}</p>
          </div>
        )}
      </div>

      {/* Resumen Rápido */}
      <div className="resumen-sidebar__section">
        <h3 className="resumen-sidebar__title">
          <CheckCircle size={14} /> {t('estado')}
        </h3>
        <div className="resumen-sidebar__stats">
          <div className="resumen-sidebar__stat">
            <span className="resumen-sidebar__stat-value">{consentimientoFirmado ? Math.max(consentimientosFirmados.length, 1) : consentimientosFirmados.length}</span>
            <span className="resumen-sidebar__stat-label">{t('firmados')}</span>
          </div>
          <div className="resumen-sidebar__stat">
            <span className="resumen-sidebar__stat-value">{consentimientoFirmado ? 0 : consentimientosPendientes.length}</span>
            <span className="resumen-sidebar__stat-label">{t('pendientes')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
