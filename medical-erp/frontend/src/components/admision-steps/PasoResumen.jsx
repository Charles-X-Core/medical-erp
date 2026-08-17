import { CheckCircle, User, Ruler, CreditCard, Send, FileText } from 'lucide-react';

export default function PasoResumen({ formData, mediciones, membresias, firmaSent }) {
  const peso = parseFloat(mediciones.peso) || 0;
  const estatura = parseFloat(mediciones.estatura) || 0;
  const imc = peso && estatura ? (peso / ((estatura / 100) ** 2)).toFixed(1) : '--';

  const sections = [
    { icon: User, label: 'Identificacion', done: !!formData.licenciaConducir && !!formData.apellidoPaterno && !!formData.nombres },
    { icon: FileText, label: 'Datos Personales', done: !!formData.fechaNacimiento || !!formData.sexo },
    { icon: FileText, label: 'Contacto', done: !!formData.telefono || !!formData.email },
    { icon: Ruler, label: 'Mediciones', done: peso > 0 && estatura > 0 },
    { icon: CreditCard, label: 'Membresia', done: membresias.length > 0 },
    { icon: Send, label: 'Firma', done: firmaSent },
  ];

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <CheckCircle size={24} />
        <h3>Resumen de Admision</h3>
        <p>Revise los datos antes de confirmar</p>
      </div>

      <div className="wizard-step__resumen">
        <div className="wizard-step__resumen-section">
          <h4><User size={16} /> Identificacion</h4>
          <div className="wizard-step__resumen-grid">
            <span><strong>ID:</strong> {formData.licenciaConducir || '-'}</span>
            <span><strong>Apellido Paterno:</strong> {formData.apellidoPaterno || '-'}</span>
            <span><strong>Apellido Materno:</strong> {formData.apellidoMaterno || '-'}</span>
            <span><strong>Nombres:</strong> {formData.nombres || '-'}</span>
          </div>
        </div>

        <div className="wizard-step__resumen-section">
          <h4><FileText size={16} /> Datos Personales</h4>
          <div className="wizard-step__resumen-grid">
            <span><strong>Fecha Nac:</strong> {formData.fechaNacimiento || '-'}</span>
            <span><strong>Sexo:</strong> {formData.sexo || '-'}</span>
            <span><strong>Estado Civil:</strong> {formData.estadoCivil || '-'}</span>
            <span><strong>Ocupacion:</strong> {formData.ocupacion || '-'}</span>
          </div>
        </div>

        <div className="wizard-step__resumen-section">
          <h4><Ruler size={16} /> Mediciones</h4>
          <div className="wizard-step__resumen-grid">
            <span><strong>Peso:</strong> {peso ? `${peso} kg` : '-'}</span>
            <span><strong>Estatura:</strong> {estatura ? `${estatura} cm` : '-'}</span>
            <span><strong>IMC:</strong> {imc}</span>
          </div>
        </div>

        <div className="wizard-step__resumen-section">
          <h4><CreditCard size={16} /> Membresia</h4>
          {membresias.length > 0 ? (
            <div className="wizard-step__resumen-grid">
              {membresias.map(m => (
                <span key={m.id}><strong>{m.tipo}:</strong> {m.fechaInicio} — {m.fechaFin && m.fechaFin !== '2099-12-31' ? m.fechaFin : 'Por vida'} ({m.vigente ? 'Vigente' : m.estado})</span>
              ))}
            </div>
          ) : (
            <span className="wizard-step__resumen-empty">Sin membresia registrada</span>
          )}
        </div>

        <div className="wizard-step__resumen-section">
          <h4><Send size={16} /> Firma</h4>
          {firmaSent ? (
            <span className="wizard-step__resumen-ok"><CheckCircle size={16} /> Enlace de firma enviado</span>
          ) : (
            <span className="wizard-step__resumen-pending">Pendiente - se enviara el enlace de firma</span>
          )}
        </div>
      </div>
    </div>
  );
}
