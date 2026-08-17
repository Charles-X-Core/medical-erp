import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import agendaService from '../../services/agendaService';

function extractList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data) return extractList(data.data);
  return [];
}

const TIPOS_CITA = [
  { value: 'consulta', label: 'Consulta' },
  { value: 'control', label: 'Control' },
  { value: 'urgencia', label: 'Urgencia' },
  { value: 'seguimiento', label: 'Seguimiento' },
];

export default function AgendarCitaModal({ isOpen, onClose, paciente, onCitaCreada }) {
  const [doctoras, setDoctoras] = useState([]);
  const [doctoraId, setDoctoraId] = useState('');
  const [fecha, setFecha] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [tipo, setTipo] = useState('consulta');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDoctoras();
      setFecha(new Date().toISOString().split('T')[0]);
      setSlotSeleccionado(null);
      setTipo('consulta');
      setNotas('');
      setError('');
      setExito(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (doctoraId && fecha) loadSlots();
  }, [doctoraId, fecha]);

  const loadDoctoras = async () => {
    try {
      const res = await agendaService.getDoctores?.() || { data: [] };
      const list = extractList(res);
      if (list.length > 0) {
        setDoctoras(list);
        setDoctoraId(list[0].id?.toString() || '');
      }
    } catch {
      setDoctoras([]);
    }
  };

  const loadSlots = async () => {
    setLoadingSlots(true);
    setSlotSeleccionado(null);
    try {
      const res = await agendaService.getSlots(doctoraId, fecha, 30);
      const list = extractList(res);
      setSlots(list);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmar = async () => {
    if (!slotSeleccionado || !doctoraId || !fecha || !paciente?.id) return;
    setLoading(true);
    setError('');
    try {
      await agendaService.crearCita({
        pacienteId: paciente.id,
        doctoraId: parseInt(doctoraId),
        fecha,
        horaInicio: slotSeleccionado.horaInicio || slotSeleccionado.inicio,
        horaFin: slotSeleccionado.horaFin || slotSeleccionado.fin,
        tipo,
        notas,
        prioridad: 'NORMAL',
      });
      setExito(true);
      setTimeout(() => {
        onCitaCreada?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al crear la cita');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fullName = paciente ? `${paciente.apellidoPaterno || ''} ${paciente.nombres || ''}`.trim() : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content agendar-cita-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Calendar size={20} /> Agendar Cita</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {exito ? (
            <div className="agendar-cita-modal__exito">
              <CheckCircle size={48} />
              <h4>Cita agendada correctamente</h4>
              <p>{fullName} — {fecha}</p>
            </div>
          ) : (
            <>
              <div className="agendar-cita-modal__paciente">
                <User size={18} />
                <span>{fullName}</span>
                <span className="agendar-cita-modal__paciente-id">{paciente?.licenciaConducir || ''}</span>
              </div>

              <div className="agendar-cita-modal__fields">
                <div className="agendar-cita-modal__field">
                  <label>Doctora</label>
                  <select value={doctoraId} onChange={e => setDoctoraId(e.target.value)}>
                    {doctoras.length === 0 && <option value="">Sin doctoras disponibles</option>}
                    {doctoras.map(d => (
                      <option key={d.id} value={d.id}>{d.nombre || d.usuario?.nombre || `Doctora #${d.id}`}</option>
                    ))}
                  </select>
                </div>

                <div className="agendar-cita-modal__field">
                  <label>Fecha</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>

                <div className="agendar-cita-modal__field">
                  <label>Tipo de cita</label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)}>
                    {TIPOS_CITA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="agendar-cita-modal__slots">
                <label><Clock size={16} /> Horarios disponibles</label>
                {loadingSlots ? (
                  <div className="agendar-cita-modal__loading"><Loader2 size={20} className="spinner" /> Cargando horarios...</div>
                ) : slots.length === 0 ? (
                  <div className="agendar-cita-modal__no-slots">No hay horarios disponibles para esta fecha</div>
                ) : (
                  <div className="agendar-cita-modal__slots-grid">
                    {slots.map((s, i) => {
                      const hora = s.horaInicio || s.inicio || s.hora;
                      const disponible = s.estado === 'DISPONIBLE' || s.disponible === true;
                      const seleccionado = slotSeleccionado === s;
                      return (
                        <button
                          key={i}
                          className={`agendar-cita-modal__slot ${disponible ? 'agendar-cita-modal__slot--disponible' : 'agendar-cita-modal__slot--ocupado'} ${seleccionado ? 'agendar-cita-modal__slot--selected' : ''}`}
                          onClick={() => disponible && setSlotSeleccionado(s)}
                          disabled={!disponible}
                        >
                          {hora}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="agendar-cita-modal__field agendar-cita-modal__field--full">
                <label><FileText size={16} /> Notas (opcional)</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Motivo de la consulta..." rows={2} />
              </div>

              {error && (
                <div className="agendar-cita-modal__error"><AlertCircle size={16} /> {error}</div>
              )}
            </>
          )}
        </div>

        {!exito && (
          <div className="modal-footer">
            <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn--primary"
              onClick={handleConfirmar}
              disabled={!slotSeleccionado || loading}
            >
              {loading ? 'Agendando...' : 'Confirmar Cita'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
