import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, CalendarDays } from 'lucide-react';
import agendaService from '../../services/agendaService';

function extractList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data) return extractList(data.data);
  return [];
}

function getWeekDates(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const fd = new Date(monday);
    fd.setDate(monday.getDate() + i);
    dates.push(fd);
  }
  return dates;
}

const DIAS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const HORAS_BASE = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

export default function VerDisponibilidadModal({ isOpen, onClose, onAgendar }) {
  const [doctoras, setDoctoras] = useState([]);
  const [doctoraId, setDoctoraId] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [disponibilidad, setDisponibilidad] = useState({});
  const [citas, setCitas] = useState({});
  const [loading, setLoading] = useState(false);

  const weekDates = getWeekDates(new Date(Date.now() + weekOffset * 7 * 24 * 60 * 60 * 1000));

  useEffect(() => {
    if (isOpen) {
      loadDoctoras();
      setWeekOffset(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (doctoraId && isOpen) loadData();
  }, [doctoraId, weekOffset, isOpen]);

  const loadDoctoras = async () => {
    try {
      const res = await agendaService.getDoctores?.() || { data: [] };
      const list = extractList(res);
      setDoctoras(list);
      if (list.length > 0) setDoctoraId(list[0].id?.toString() || '');
    } catch { setDoctoras([]); }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const disp = {};
      const cits = {};
      for (const date of weekDates) {
        const fechaStr = date.toISOString().split('T')[0];
        try {
          const res = await agendaService.getSlots(doctoraId, fechaStr, 30);
          const slots = extractList(res);
          disp[fechaStr] = slots;
        } catch { disp[fechaStr] = []; }
        try {
          const res = await agendaService.getCitasPorFecha(fechaStr);
          const list = extractList(res);
          cits[fechaStr] = list;
        } catch { cits[fechaStr] = []; }
      }
      setDisponibilidad(disp);
      setCitas(cits);
    } finally { setLoading(false); }
  };

  const isSlotAvailable = (fechaStr, hora) => {
    const slots = disponibilidad[fechaStr] || [];
    return slots.some(s => {
      const h = s.horaInicio || s.inicio || s.hora;
      return h === hora && (s.estado === 'DISPONIBLE' || s.disponible === true);
    });
  };

  const isSlotOccupied = (fechaStr, hora) => {
    const slots = disponibilidad[fechaStr] || [];
    return slots.some(s => {
      const h = s.horaInicio || s.inicio || s.hora;
      return h === hora && (s.estado === 'OCUPADO' || s.disponible === false);
    });
  };

  const getSlotStatus = (fechaStr, hora) => {
    if (isSlotAvailable(fechaStr, hora)) return 'disponible';
    if (isSlotOccupied(fechaStr, hora)) return 'ocupado';
    return 'no-configurado';
  };

  const formatDate = (d) => d.toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ver-disp-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><CalendarDays size={20} /> Disponibilidad de la Doctora</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="ver-disp-modal__controls">
            <div className="ver-disp-modal__field">
              <label>Doctora</label>
              <select value={doctoraId} onChange={e => setDoctoraId(e.target.value)}>
                {doctoras.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre || d.usuario?.nombre || `Doctora #${d.id}`}</option>
                ))}
              </select>
            </div>

            <div className="ver-disp-modal__week-nav">
              <button onClick={() => setWeekOffset(w => w - 1)} className="ver-disp-modal__week-btn"><ChevronLeft size={18} /></button>
              <span className="ver-disp-modal__week-label">
                Semana del {weekDates[0].toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} - {weekDates[6].toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <button onClick={() => setWeekOffset(w => w + 1)} className="ver-disp-modal__week-btn"><ChevronRight size={18} /></button>
            </div>
          </div>

          {loading ? (
            <div className="ver-disp-modal__loading"><Loader2 size={24} className="spinner" /> Cargando disponibilidad...</div>
          ) : (
            <div className="ver-disp-modal__table-wrapper">
              <table className="ver-disp-modal__table">
                <thead>
                  <tr>
                    <th className="ver-disp-modal__th-hora">Hora</th>
                    {weekDates.map((d, i) => (
                      <th key={i} className="ver-disp-modal__th-dia">
                        <span className="ver-disp-modal__dia-name">{DIAS[i]}</span>
                        <span className="ver-disp-modal__dia-fecha">{d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HORAS_BASE.map(hora => (
                    <tr key={hora}>
                      <td className="ver-disp-modal__td-hora">{hora}</td>
                      {weekDates.map((d, i) => {
                        const fechaStr = formatDate(d);
                        const status = getSlotStatus(fechaStr, hora);
                        return (
                          <td key={i} className={`ver-disp-modal__td ver-disp-modal__td--${status}`}>
                            {status === 'disponible' && '✅'}
                            {status === 'ocupado' && '❌'}
                            {status === 'no-configurado' && '·'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="ver-disp-modal__legend">
            <span><span className="ver-disp-modal__legend-dot ver-disp-modal__legend-dot--ok" /> Disponible</span>
            <span><span className="ver-disp-modal__legend-dot ver-disp-modal__legend-dot--no" /> Ocupado</span>
            <span><span className="ver-disp-modal__legend-dot ver-disp-modal__legend-dot--none" /> No configurado</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn--ghost" onClick={onClose}>Cerrar</button>
          <button className="btn btn--primary" onClick={() => { onClose(); onAgendar?.(); }}>
            <CalendarDays size={16} /> Agendar Cita
          </button>
        </div>
      </div>
    </div>
  );
}
