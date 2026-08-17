import { Phone } from 'lucide-react';

export default function PasoContacto({ formData, onChange }) {
  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <Phone size={24} />
        <h3>Contacto</h3>
        <p>Informacion de contacto y emergencia</p>
      </div>
      <div className="wizard-step__form-grid">
        <div className="wizard-step__field">
          <label>Telefono</label>
          <input name="telefono" value={formData.telefono || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>Email</label>
          <input type="email" name="email" value={formData.email || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field wizard-step__field--full">
          <label>Direccion</label>
          <input name="direccionLinea1" value={formData.direccionLinea1 || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>Ciudad</label>
          <input name="ciudad" value={formData.ciudad || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>Provincia</label>
          <input name="estadoProvincia" value={formData.estadoProvincia || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field wizard-step__field--separator"><hr /></div>
        <div className="wizard-step__field">
          <label>Contacto Emergencia</label>
          <input name="contactoEmergencia" value={formData.contactoEmergencia || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>Telefono Emergencia</label>
          <input name="telefonoEmergencia" value={formData.telefonoEmergencia || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>Parentesco</label>
          <input name="parentescoEmergencia" value={formData.parentescoEmergencia || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>Acompanante</label>
          <input name="nombreAcompanante" value={formData.nombreAcompanante || ''} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
