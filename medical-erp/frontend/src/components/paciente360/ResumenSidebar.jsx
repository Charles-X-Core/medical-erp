import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle, Clock, CheckCircle, FileText } from 'lucide-react';
import { pacienteConsentimientoService } from '../../services/pacienteSubServices';

function formatFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ============================================
// ResumenSidebar — Patient overview + membership status
// Shows: actions taken, membership confirmation, doctor warning
// ============================================

export default function ResumenSidebar({ pacienteId }) {
  const [consentimientos, setConsentimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [pacienteId]);

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

  const membresiaFirmada = consentimientos.some(
    (c) => c.tipo === 'MEMBRESIA' || c.tipoConsentimiento === 'MEMBRESIA'
  );
  const consentimientosFirmados = consentimientos.filter((c) => c.fechaFirma);
  const consentimientosPendientes = consentimientos.filter((c) => !c.fechaFirma);

  return (
    <div className="resumen-sidebar">
      {/* Membresía Status */}
      <div className="resumen-sidebar__section">
        <h3 className="resumen-sidebar__title">
          <Shield size={14} /> Membresía
        </h3>
        {loading ? (
          <div className="resumen-sidebar__loading">Cargando...</div>
        ) : membresiaFirmada ? (
          <div className="resumen-sidebar__status resumen-sidebar__status--ok">
            <ShieldCheck size={16} />
            <span>Membresía firmada</span>
          </div>
        ) : (
          <div className="resumen-sidebar__status resumen-sidebar__status--warning">
            <ShieldAlert size={16} />
            <span>Sin membresía firmada</span>
          </div>
        )}
        {!loading && !membresiaFirmada && (
          <div className="resumen-sidebar__alert">
            <AlertTriangle size={12} />
            <span>Informar a la doctora que el paciente no tiene membresía activa</span>
          </div>
        )}
      </div>

      {/* Acciones del Paciente */}
      <div className="resumen-sidebar__section">
        <h3 className="resumen-sidebar__title">
          <Clock size={14} /> Acciones Recientes
        </h3>
        {loading ? (
          <div className="resumen-sidebar__loading">Cargando...</div>
        ) : consentimientos.length > 0 ? (
          <div className="resumen-sidebar__list">
            {consentimientos.slice(0, 5).map((c) => (
              <div key={c.id} className="resumen-sidebar__item">
                <div className={`resumen-sidebar__dot ${c.fechaFirma ? 'resumen-sidebar__dot--done' : 'resumen-sidebar__dot--pending'}`} />
                <div className="resumen-sidebar__item-info">
                  <span className="resumen-sidebar__item-label">
                    {c.tipo || c.templateNombre || 'Consentimiento'}
                  </span>
                  <span className="resumen-sidebar__item-date">
                    {c.fechaFirma ? formatFecha(c.fechaFirma) : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="resumen-sidebar__empty">
            <FileText size={16} />
            <p>Sin acciones registradas</p>
          </div>
        )}
      </div>

      {/* Resumen Rápido */}
      <div className="resumen-sidebar__section">
        <h3 className="resumen-sidebar__title">
          <CheckCircle size={14} /> Estado
        </h3>
        <div className="resumen-sidebar__stats">
          <div className="resumen-sidebar__stat">
            <span className="resumen-sidebar__stat-value">{consentimientosFirmados.length}</span>
            <span className="resumen-sidebar__stat-label">Firmados</span>
          </div>
          <div className="resumen-sidebar__stat">
            <span className="resumen-sidebar__stat-value">{consentimientosPendientes.length}</span>
            <span className="resumen-sidebar__stat-label">Pendientes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
