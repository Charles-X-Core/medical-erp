import { useState } from 'react';
import { Plus, X, DollarSign, Stethoscope, Search } from 'lucide-react';

const TRATAMIENTOS_CATALOGO = [
  { id: 'stem-cells', nombre: 'Células Madre Pristinas Autólogas', categoria: 'Medicina Regenerativa Celular' },
  { id: 'vicell-stem-cells', nombre: 'Células Madre Vicell', categoria: 'Medicina Regenerativa Celular' },
  { id: 'exosomes', nombre: 'Exosomas', categoria: 'Medicina Regenerativa Celular' },
  { id: 'embryonic-stem-cells', nombre: 'Células Madre Embrionarias', categoria: 'Medicina Regenerativa Celular' },
  { id: 'mesenchymal-stem-cells', nombre: 'Células Madre Mesenquimales', categoria: 'Medicina Regenerativa Celular' },
  { id: 'pluripotent-stem-cells', nombre: 'Células Madre Pluripotentes', categoria: 'Medicina Regenerativa Celular' },
  { id: 'prp', nombre: 'Plasma Rico en Plaquetas (PRP)', categoria: 'Medicina Regenerativa Celular' },
  { id: 'oxygenation-therapy', nombre: 'Oxigenación y Vitaminización', categoria: 'Medicina Regenerativa Celular' },
  { id: 'facial-rejuvenation', nombre: 'Rejuvenecimiento Facial', categoria: 'Medicina Estética Celular' },
  { id: 'hair-regeneration', nombre: 'Regeneración Capilar', categoria: 'Medicina Estética Celular' },
  { id: 'regenerative-orthopedics', nombre: 'Medicina Regenerativa y Ortopedia', categoria: 'Medicina Estética Celular' },
  { id: 'wound-healing', nombre: 'Cicatrización de Heridas y Úlceras', categoria: 'Medicina Estética Celular' },
  { id: 'placental-cell-therapy', nombre: 'Terapia Celular Placentaria', categoria: 'Medicina Estética Celular' },
  { id: 'dermal-fillers', nombre: 'Rellenos Dérmicos con Células', categoria: 'Medicina Estética Celular' },
  { id: 'nad-plus', nombre: 'NAD Plus Celular', categoria: 'Medicina Intravenosa' },
  { id: 'glutathione', nombre: 'Glutatión - Refuerzo Inmunológico', categoria: 'Medicina Intravenosa' },
  { id: 'myers-cocktail', nombre: 'Cóctel de Myers', categoria: 'Medicina Intravenosa' },
  { id: 'detox-iv', nombre: 'Terapia de Desintoxicación', categoria: 'Medicina Intravenosa' },
  { id: 'vitamin-c-iv', nombre: 'Vitamina C - Ácido Ascórbico', categoria: 'Medicina Intravenosa' },
  { id: 'osteopenia-therapy', nombre: 'Osteopenia y Fracturas', categoria: 'Medicina Intravenosa' },
  { id: 'mens-hormone-pellets', nombre: 'Pellet Hormonal Masculino', categoria: 'Medicina Hormonal' },
  { id: 'womens-hormone-pellets', nombre: 'Pellet Hormonal Femenino', categoria: 'Medicina Hormonal' },
];

export default function PasoTratamientos({ formData, updateFormData }) {
  const { tratamientos } = formData;
  const [searchTerm, setSearchTerm] = useState('');
  const [showCatalogo, setShowCatalogo] = useState(false);

  const filteredTratamientos = TRATAMIENTOS_CATALOGO.filter(
    (t) =>
      t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addTratamientoFromCatalog = (tratamiento) => {
    updateFormData('tratamientos', [
      ...tratamientos,
      {
        procedimientoRealizado: tratamiento.nombre,
        categoria: tratamiento.categoria,
        costoTotal: '',
        notas: '',
        estado: 'realizado',
      },
    ]);
    setShowCatalogo(false);
    setSearchTerm('');
  };

  const addTratamientoCustom = () => {
    updateFormData('tratamientos', [
      ...tratamientos,
      {
        procedimientoRealizado: '',
        costoTotal: '',
        notas: '',
        estado: 'realizado',
      },
    ]);
  };

  const updateTratamiento = (index, field, value) => {
    const updated = [...tratamientos];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData('tratamientos', updated);
  };

  const removeTratamiento = (index) => {
    updateFormData('tratamientos', tratamientos.filter((_, i) => i !== index));
  };

  const calcularTotal = () => {
    return tratamientos.reduce((sum, t) => sum + (parseFloat(t.costoTotal) || 0), 0);
  };

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">
        <Stethoscope size={20} />
        Tratamientos
      </h2>

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn--primary" onClick={() => setShowCatalogo(!showCatalogo)}>
          <Plus size={16} />
          Catálogo de Tratamientos
        </button>
        <button className="wizard-btn wizard-btn--secondary" onClick={addTratamientoCustom}>
          <Plus size={16} />
          Tratamiento Personalizado
        </button>
      </div>

      {showCatalogo && (
        <div className="wizard-card wizard-card--highlight">
          <h3 className="wizard-card__subtitle">Seleccionar Tratamiento</h3>
          <div className="wizard-field">
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'rgba(255,255,255,0.4)' }} />
              <input
                className="wizard-input"
                style={{ paddingLeft: 36 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar tratamiento..."
              />
            </div>
          </div>
          <div className="wizard-catalogo-list">
            {filteredTratamientos.map((t) => (
              <button
                key={t.id}
                className="wizard-catalogo-item"
                onClick={() => addTratamientoFromCatalog(t)}
              >
                <div>
                  <span className="wizard-catalogo-item__nombre">{t.nombre}</span>
                  <span className="wizard-catalogo-item__categoria">{t.categoria}</span>
                </div>
                <Plus size={16} />
              </button>
            ))}
            {filteredTratamientos.length === 0 && (
              <p className="wizard-text--muted">No se encontraron tratamientos</p>
            )}
          </div>
        </div>
      )}

      {tratamientos.map((tratamiento, index) => (
        <div key={index} className="wizard-card">
          <div className="wizard-card__header">
            <h3 className="wizard-card__subtitle">
              Tratamiento {index + 1}
            </h3>
            <button className="wizard-btn-icon" onClick={() => removeTratamiento(index)}>
              <X size={16} />
            </button>
          </div>

          <div className="wizard-grid wizard-grid--1">
            <div className="wizard-field">
              <label>Procedimiento Realizado *</label>
              <input
                className="wizard-input"
                value={tratamiento.procedimientoRealizado}
                onChange={(e) => updateTratamiento(index, 'procedimientoRealizado', e.target.value)}
                placeholder="Nombre del tratamiento"
              />
            </div>

            <div className="wizard-grid wizard-grid--3">
              <div className="wizard-field">
                <label><DollarSign size={14} /> Costo Total *</label>
                <input
                  className="wizard-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={tratamiento.costoTotal}
                  onChange={(e) => updateTratamiento(index, 'costoTotal', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="wizard-field">
                <label>Estado</label>
                <select
                  className="wizard-select"
                  value={tratamiento.estado}
                  onChange={(e) => updateTratamiento(index, 'estado', e.target.value)}
                >
                  <option value="realizado">Realizado</option>
                  <option value="planificado">Planificado</option>
                </select>
              </div>
              <div className="wizard-field">
                <label>Notas</label>
                <input
                  className="wizard-input"
                  value={tratamiento.notas}
                  onChange={(e) => updateTratamiento(index, 'notas', e.target.value)}
                  placeholder="Observaciones"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {tratamientos.length > 0 && (
        <div className="wizard-total">
          <span>Costo Total:</span>
          <span className="wizard-total__amount">
            ${calcularTotal().toFixed(2)}
          </span>
        </div>
      )}

      {tratamientos.length === 0 && (
        <div className="wizard-empty">
          <Stethoscope size={32} />
          <p>No se han agregado tratamientos</p>
        </div>
      )}
    </div>
  );
}
