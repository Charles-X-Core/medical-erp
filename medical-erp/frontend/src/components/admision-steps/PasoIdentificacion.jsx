import { FileText, User } from 'lucide-react';

export default function PasoIdentificacion({ formData, onChange }) {
  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <User size={24} />
        <h3>Identificacion del Cliente</h3>
        <p>Datos basicos de identificacion</p>
      </div>
      <div className="wizard-step__form-grid">
        <div className="wizard-step__field">
          <label>ID *</label>
          <input
            name="licenciaConducir"
            value={formData.licenciaConducir || ''}
            onChange={onChange}
            placeholder="Numero de documento"
            required
          />
        </div>
        <div className="wizard-step__field">
          <label>Apellido Paterno *</label>
          <input name="apellidoPaterno" value={formData.apellidoPaterno || ''} onChange={onChange} required />
        </div>
        <div className="wizard-step__field">
          <label>Apellido Materno</label>
          <input name="apellidoMaterno" value={formData.apellidoMaterno || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field wizard-step__field--full">
          <label>Nombres *</label>
          <input name="nombres" value={formData.nombres || ''} onChange={onChange} required />
        </div>
      </div>
    </div>
  );
}
