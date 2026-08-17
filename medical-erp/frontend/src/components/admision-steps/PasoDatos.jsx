import { Heart } from 'lucide-react';

export default function PasoDatos({ formData, onChange }) {
  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <Heart size={24} />
        <h3>Datos Personales</h3>
        <p>Informacion personal y demografica</p>
      </div>
      <div className="wizard-step__form-grid">
        <div className="wizard-step__field">
          <label>Fecha de Nacimiento</label>
          <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>Sexo</label>
          <select name="sexo" value={formData.sexo || ''} onChange={onChange}>
            <option value="">Seleccionar...</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMENINO">Femenino</option>
          </select>
        </div>
        <div className="wizard-step__field">
          <label>Estado Civil</label>
          <select name="estadoCivil" value={formData.estadoCivil || ''} onChange={onChange}>
            <option value="">Seleccionar...</option>
            <option value="SOLTERO">Soltero(a)</option>
            <option value="CASADO">Casado(a)</option>
            <option value="DIVORCIADO">Divorciado(a)</option>
            <option value="VIUDO">Viudo(a)</option>
          </select>
        </div>
        <div className="wizard-step__field">
          <label>Ocupacion</label>
          <input name="ocupacion" value={formData.ocupacion || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>Grado de Instruccion</label>
          <select name="gradoInstruccion" value={formData.gradoInstruccion || ''} onChange={onChange}>
            <option value="">Seleccionar...</option>
            <option value="Primaria">Primaria</option>
            <option value="Secundaria">Secundaria</option>
            <option value="Tecnico">Tecnico</option>
            <option value="Universitario">Universitario</option>
            <option value="Postgrado">Postgrado</option>
          </select>
        </div>
        <div className="wizard-step__field">
          <label>Lugar de Nacimiento</label>
          <input name="lugarNacimiento" value={formData.lugarNacimiento || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>Lugar de Procedencia</label>
          <input name="lugarProcedencia" value={formData.lugarProcedencia || ''} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
