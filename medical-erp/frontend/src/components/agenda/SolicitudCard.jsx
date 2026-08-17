import { useState, useEffect } from 'react';
import { Clock, User, FileText, CheckCircle, XCircle, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import agendaService from '../../services/agendaService';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatFechaDisplay(fechaStr) {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-').map(Number);
  return `${d} de ${MESES[m - 1]}`;
}

export default function SolicitudCard({ solicitud, onConfirm, onReject }) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [rejectionMotivo, setRejectionMotivo] = useState('');
  const [showReject, setShowReject] = useState(false);

  // Availability picker state
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentFecha, setCurrentFecha] = useState(null);

  const hasHora = solicitud.hora && solicitud.hora !== '00:00';
  const fechaMinima = solicitud.fecha;
  const duracion = solicitud.duracionMinutos || 30;

  // Load availability when expanding for scheduling
  useEffect(() => {
    if (!expanded || hasHora) return;
    loadSlots(fechaMinima);
  }, [expanded, hasHora, fechaMinima]);

  const loadSlots = async (fecha) => {
    setLoadingSlots(true);
    setCurrentFecha(fecha);
    setSelectedSlot(null);
    try {
      const usuarioId = solicitud.usuarioId;
      if (!usuarioId) return;
      const res = await agendaService.getDisponibilidadSolicitud(usuarioId, fecha, duracion);
      if (res.success) setSlots(res.data || []);
    } catch { /* */ }
    setLoadingSlots(false);
  };

  const handleConfirm = async () => {
    if (!hasHora && !selectedSlot) return;
    setLoading(true);
    try {
      // If nurse selected a slot, assign the time first
      if (!hasHora && selectedSlot) {
        await agendaService.asignarHorarioCita(solicitud.id, selectedSlot.fecha, selectedSlot.inicio);
      }
      await agendaService.programarCita(solicitud.id);
      onConfirm(solicitud.id);
    } catch { /* */ }
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await agendaService.rechazarCita(solicitud.id, rejectionMotivo);
      onReject(solicitud.id);
    } catch { /* */ }
    setLoading(false);
  };

  // If solicitud already has a specific time
  const horaInicio = hasHora ? solicitud.hora.substring(0, 5) : null;
  const horaFin = hasHora ? (() => {
    const [h, m] = solicitud.hora.split(':').map(Number);
    const finMin = h * 60 + m + duracion;
    return `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;
  })() : null;

  // Group slots by date
  const slotsByDate = {};
  slots.forEach(s => {
    if (!slotsByDate[s.fecha]) slotsByDate[s.fecha] = [];
    slotsByDate[s.fecha].push(s);
  });

  return (
    <div className="solicitud-card">
      <div className="solicitud-card__header" onClick={() => setExpanded(!expanded)}>
        <div className="solicitud-card__icon"><User size={14} /></div>
        <div className="solicitud-card__info">
          <span className="solicitud-card__doctora">{solicitud.solicitadaPorNombre || 'Doctora'}</span>
          <span className="solicitud-card__paciente">→ {solicitud.pacienteNombre}</span>
        </div>
        <button className="solicitud-card__expand">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="solicitud-card__body">
        {hasHora ? (
          <div className="solicitud-card__detail">
            <Clock size={12} />
            <span>{solicitud.fecha} · {horaInicio} - {horaFin}</span>
          </div>
        ) : (
          <div className="solicitud-card__detail solicitud-card__detail--fecha-minima">
            <Calendar size={12} />
            <span>Fecha mínima: <strong>{formatFechaDisplay(fechaMinima)}</strong></span>
          </div>
        )}
        {solicitud.tipoCitaNombre && (
          <div className="solicitud-card__detail">
            <FileText size={12} />
            <span>{solicitud.tipoCitaNombre} · {duracion}min</span>
          </div>
        )}
      </div>

      {expanded && solicitud.motivo && (
        <div className="solicitud-card__motivo">
          <strong>Motivo:</strong> {solicitud.motivo}
        </div>
      )}

      {/* Availability Picker (only when no hora assigned) */}
      {expanded && !hasHora && (
        <div className="solicitud-card__availability">
          {loadingSlots ? (
            <div className="solicitud-card__availability-loading">Cargando disponibilidad...</div>
          ) : Object.keys(slotsByDate).length === 0 ? (
            <div className="solicitud-card__availability-empty">Sin slots disponibles</div>
          ) : (
            <>
              <div className="solicitud-card__availability-label">Selecciona un horario:</div>
              {Object.entries(slotsByDate).map(([fecha, daySlots]) => (
                <div key={fecha} className="solicitud-card__availability-day">
                  <div className="solicitud-card__availability-date">{formatFechaDisplay(fecha)}</div>
                  <div className="solicitud-card__availability-slots">
                    {daySlots.map((slot, i) => (
                      <button
                        key={i}
                        className={`solicitud-card__availability-slot ${slot.estado === 'OCUPADO' ? '--ocupado' : slot.estado === 'BLOQUEADO' ? '--bloqueado' : ''} ${selectedSlot?.fecha === slot.fecha && selectedSlot?.inicio === slot.inicio ? '--selected' : ''}`}
                        disabled={slot.estado !== 'DISPONIBLE'}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot.inicio.substring(0, 5)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {selectedSlot && (
                <div className="solicitud-card__availability-selected">
                  Seleccionado: {formatFechaDisplay(selectedSlot.fecha)} a las {selectedSlot.inicio.substring(0, 5)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="solicitud-card__actions">
        <button
          className="solicitud-card__btn solicitud-card__btn--confirm"
          onClick={handleConfirm}
          disabled={loading || (!hasHora && !selectedSlot)}
        >
          <CheckCircle size={14} /> {loading ? 'Procesando...' : hasHora ? 'Confirmar' : 'Programar'}
        </button>
        {!showReject ? (
          <button
            className="solicitud-card__btn solicitud-card__btn--reject"
            onClick={() => setShowReject(true)}
            disabled={loading}
          >
            <XCircle size={14} /> Rechazar
          </button>
        ) : (
          <div className="solicitud-card__reject-form">
            <input
              type="text"
              placeholder="Motivo de rechazo..."
              value={rejectionMotivo}
              onChange={(e) => setRejectionMotivo(e.target.value)}
              className="solicitud-card__reject-input"
            />
            <div className="solicitud-card__reject-actions">
              <button className="solicitud-card__btn solicitud-card__btn--confirm" onClick={handleReject} disabled={loading}>
                Enviar
              </button>
              <button className="solicitud-card__btn solicitud-card__btn--cancel" onClick={() => { setShowReject(false); setRejectionMotivo(''); }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
