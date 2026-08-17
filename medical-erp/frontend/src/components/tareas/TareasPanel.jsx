import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle, Clock, AlertCircle, User, ChevronRight } from 'lucide-react';
import { tareaService } from '../../services/tareaService';

const TIPO_LABELS = {
  BUSCAR_CITA: { label: 'Buscar Cita', color: '#3B82F6' },
  REGISTRAR_PACIENTE: { label: 'Registrar Paciente', color: '#8B5CF6' },
  FIRMAR_DOCUMENTO: { label: 'Firmar Documento', color: '#F59E0B' },
  OTRO: { label: 'Otro', color: '#6B7280' },
};

export default function TareasPanel({ rol = 'enfermera' }) {
  const navigate = useNavigate();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTareas();
  }, [rol]);

  const loadTareas = async () => {
    try {
      const data = await tareaService.getPendientes(rol);
      setTareas(data);
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const handleComplete = async (id) => {
    try {
      await tareaService.updateEstado(id, 'completada');
      setTareas(prev => prev.filter(t => t.id !== id));
    } catch { /* */ }
  };

  const handleStart = async (id) => {
    try {
      await tareaService.updateEstado(id, 'en_proceso');
      setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: 'en_proceso' } : t));
    } catch { /* */ }
  };

  if (loading) return <div className="tareas-panel__loading">Cargando tareas...</div>;

  return (
    <div className="tareas-panel">
      <div className="tareas-panel__header">
        <ClipboardList size={20} />
        <h3>Tareas Pendientes</h3>
        <span className="tareas-panel__badge">{tareas.length}</span>
      </div>

      {tareas.length === 0 ? (
        <div className="tareas-panel__empty">
          <CheckCircle size={32} />
          <p>No hay tareas pendientes</p>
        </div>
      ) : (
        <div className="tareas-panel__list">
          {tareas.map(t => {
            const tipo = TIPO_LABELS[t.tipo] || TIPO_LABELS.OTRO;
            return (
              <div key={t.id} className={`tareas-panel__card ${t.estado === 'en_proceso' ? 'tareas-panel__card--active' : ''}`}>
                <div className="tareas-panel__card-header">
                  <span className="tareas-panel__card-tipo" style={{ color: tipo.color }}>
                    {tipo.label}
                  </span>
                  <span className="tareas-panel__card-time">
                    <Clock size={12} />
                    {new Date(t.createdAt).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <h4 className="tareas-panel__card-title">{t.titulo}</h4>
                {t.descripcion && <p className="tareas-panel__card-desc">{t.descripcion}</p>}
                {t.pacienteNombre && (
                  <span className="tareas-panel__card-paciente">
                    <User size={14} /> {t.pacienteNombre}
                  </span>
                )}
                <span className="tareas-panel__card-from">
                  De: {t.origenUsuarioNombre}
                </span>
                <div className="tareas-panel__card-actions">
                  {t.estado === 'pendiente' && (
                    <button className="tareas-panel__btn tareas-panel__btn--start" onClick={() => handleStart(t.id)}>
                      <AlertCircle size={14} /> Tomar tarea
                    </button>
                  )}
                  <button className="tareas-panel__btn tareas-panel__btn--complete" onClick={() => handleComplete(t.id)}>
                    <CheckCircle size={14} /> Completar
                  </button>
                  {t.pacienteId && (
                    <button className="tareas-panel__btn tareas-panel__btn--go" onClick={() => navigate(`/admision?pacienteId=${t.pacienteId}`)}>
                      <ChevronRight size={14} /> Ir
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
