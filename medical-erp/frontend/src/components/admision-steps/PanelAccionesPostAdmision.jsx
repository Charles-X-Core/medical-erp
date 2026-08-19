import { Calendar, Send, Eye, Home, CheckCircle } from 'lucide-react';

export default function PanelAccionesPostAdmision({ paciente, onAgendarCita, onEnviarContrato, onVerPaciente, onVolver }) {
  const fullName = `${paciente.apellidoPaterno || ''} ${paciente.apellidoMaterno || ''}, ${paciente.nombres || ''}`.trim();

  return (
    <div className="post-admision">
      <div className="post-admision__header">
        <CheckCircle size={32} className="post-admision__check" />
        <h2>Admision completada</h2>
        <p className="post-admision__patient">{fullName}</p>
        <span className="post-admision__id">{paciente.licenciaConducir || 'Sin ID'}</span>
      </div>

      <p className="post-admision__question">¿Que desea hacer ahora?</p>

      <div className="post-admision__grid">
        <button className="post-admision__card" onClick={onAgendarCita}>
          <div className="post-admision__card-icon post-admision__card-icon--blue">
            <Calendar size={28} />
          </div>
          <span className="post-admision__card-label">Agendar Cita</span>
          <span className="post-admision__card-desc">Ver disponibilidad y programar consulta</span>
        </button>

        <button className="post-admision__card" onClick={onEnviarContrato}>
          <div className="post-admision__card-icon post-admision__card-icon--purple">
            <Send size={28} />
          </div>
          <span className="post-admision__card-label">Enviar Contrato</span>
          <span className="post-admision__card-desc">Enviar enlace de firma al paciente</span>
        </button>

        <button className="post-admision__card" onClick={onVerPaciente}>
          <div className="post-admision__card-icon post-admision__card-icon--orange">
            <Eye size={28} />
          </div>
          <span className="post-admision__card-label">Ver Paciente</span>
          <span className="post-admision__card-desc">Abrir centro del paciente</span>
        </button>
      </div>

      <button className="post-admision__btn-back" onClick={onVolver}>
        <Home size={18} /> Volver a la lista
      </button>
    </div>
  );
}
