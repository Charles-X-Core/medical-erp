import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

// ============================================
// ScheduleModal — Notificar a enfermera
// Doctora indica fecha sugerida y notas
// La enfermera coordina la cita exacta con el paciente
// ============================================

export default function ScheduleModal({ open, onClose, onConfirm, tratamiento }) {
  const [fechaDesde, setFechaDesde] = useState('');
  const [horaPreferida, setHoraPreferida] = useState('');
  const [notas, setNotas] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleConfirm = async () => {
    setScheduling(true);
    setError(null);
    try {
      await onConfirm?.({
        fechaDesde,
        horaPreferida: horaPreferida || null,
        notas: notas || null,
        tratamientoId: tratamiento?.id,
      });
      onClose?.();
    } catch (err) {
      console.error('Schedule error:', err);
      setError(err.message || 'Error al agendar la cita');
    } finally {
      setScheduling(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">
            <Calendar size={18} /> Notificar a Enfermera
          </h3>
          <button className="modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal__body">
          {tratamiento && (
            <div className="schedule-modal__tratamiento-info">
              <span className="schedule-modal__tratamiento-name">
                {tratamiento.tipoTratamiento || 'Tratamiento'}
              </span>
              <span className="schedule-modal__tratamiento-sesiones">
                Sesión {(tratamiento.sesionesRealizadas || 0) + 1} de {tratamiento.sesionesPlaneadas || '?'}
              </span>
            </div>
          )}

          <div className="schedule-modal__fields">
            <div className="schedule-modal__field">
              <label className="schedule-modal__label">
                Fecha sugerida para la próxima sesión *
              </label>
              <input
                type="date"
                className="schedule-modal__input"
                min={today}
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
              <span className="schedule-modal__hint">
                La enfermera contactará al paciente para confirmar esta fecha
              </span>
            </div>

            <div className="schedule-modal__field">
              <label className="schedule-modal__label">
                <Clock size={14} /> Hora preferida (opcional)
              </label>
              <input
                type="time"
                className="schedule-modal__input"
                value={horaPreferida}
                onChange={(e) => setHoraPreferida(e.target.value)}
              />
            </div>

            <div className="schedule-modal__field">
              <label className="schedule-modal__label">Notas para la enfermera</label>
              <textarea
                className="schedule-modal__textarea"
                placeholder="Ej: Traer resultados de laboratorio, ayuno de 8 horas..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="session-form__error">
            {error}
          </div>
        )}

        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose} disabled={scheduling}>
            Cancelar
          </button>
          <button
            className="btn btn--primary"
            onClick={handleConfirm}
            disabled={!fechaDesde || scheduling}
          >
            <Calendar size={16} />
            {scheduling ? 'Enviando...' : 'Notificar a Enfermera'}
          </button>
        </div>
      </div>
    </div>
  );
}
