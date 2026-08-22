import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, Clock } from 'lucide-react';

function formatNombre(nombre) {
  if (!nombre) return 'Cliente';
  return nombre;
}

function formatHora(hora) {
  if (!hora) return '--:--';
  return hora.substring(0, 5);
}

function getEstadoLabel(estado) {
  const labels = {
    pendiente: 'Pendiente',
    programada: 'Programada',
    confirmada: 'Confirmada',
    asistio: 'Llegó',
    llegada: 'Llegó',
    en_atencion: 'En atención',
  };
  return labels[estado] || estado;
}

function getEstadoTone(estado) {
  const tones = {
    pendiente: 'neutral',
    programada: 'info',
    confirmada: 'info',
    asistio: 'success',
    llegada: 'success',
    en_atencion: 'active',
  };
  return tones[estado] || 'neutral';
}

// ============================================
// ColaPacientes — Queue view
// Shows active patients waiting, sorted by priority/time
// ============================================

export default function ColaPacientes({ citas = [], loading = false }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="dashboard-cola">
        <div className="dashboard-cola__header">
          <h3 className="dashboard-cola__title"><Users size={14} /> Clientes en Cola</h3>
        </div>
        <div className="dashboard-cola__loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-cola">
      <div className="dashboard-cola__header">
        <h3 className="dashboard-cola__title">
          <Users size={14} /> Clientes en Cola
          {citas.length > 0 && <span className="dashboard-cola__badge">{citas.length}</span>}
        </h3>
      </div>

      <div className="dashboard-cola__list">
        {citas.length === 0 ? (
          <div className="dashboard-cola__empty">
            <Users size={24} />
            <p>Sin clientes en espera</p>
          </div>
        ) : (
          citas.map((cita) => (
            <button
              key={cita.id}
              className="dashboard-cola__item"
              onClick={() => cita.pacienteId && navigate(`/pacientes/${cita.pacienteId}/workspace`)}
            >
              <div className="dashboard-cola__item-time">
                <Clock size={14} />
                <span>{formatHora(cita.hora)}</span>
              </div>
              <div className="dashboard-cola__item-info">
                <span className="dashboard-cola__item-name">{formatNombre(cita.pacienteNombre)}</span>
                <span className="dashboard-cola__item-detail">
                  {cita.usuarioNombre && <span>{cita.usuarioNombre} · </span>}
                  {cita.tipoCitaNombre || cita.motivo || 'Consulta'}
                </span>
              </div>
              <span className={`dashboard-cola__item-estado dashboard-cola__item-estado--${getEstadoTone(cita.estado)}`}>
                {getEstadoLabel(cita.estado)}
              </span>
              <ChevronRight size={14} className="dashboard-cola__item-arrow" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
