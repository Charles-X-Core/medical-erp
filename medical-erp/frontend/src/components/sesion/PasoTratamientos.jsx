import { useState } from 'react';
import { Plus, X, DollarSign, Stethoscope, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('patients');
  const { t: tC } = useTranslation('clinical');
  const { t: tCommon } = useTranslation('common');
  const { tratamientos } = formData;
  const [searchTerm, setSearchTerm] = useState('');
  const [showCatalogo, setShowCatalogo] = useState(false);

  const filteredTratamientos = TRATAMIENTOS_CATALOGO.filter(
    (trat) =>
      trat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trat.categoria.toLowerCase().includes(searchTerm.toLowerCase())
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
    return tratamientos.reduce((sum, tr) => sum + (parseFloat(tr.costoTotal) || 0), 0);
  };

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">
        <Stethoscope size={20} />
        {tC('tratamientos')}
      </h2>

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn--primary" onClick={() => setShowCatalogo(!showCatalogo)}>
          <Plus size={16} />
          {tC('catalogo_tratamientos')}
        </button>
        <button className="wizard-btn wizard-btn--secondary" onClick={addTratamientoCustom}>
          <Plus size={16} />
          {t('nuevo_tratamiento')}
        </button>
      </div>

      {showCatalogo && (
        <div className="wizard-card wizard-card--highlight">
          <h3 className="wizard-card__subtitle">{tC('seleccionar_tratamiento')}</h3>
          <div className="wizard-field">
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'rgba(255,255,255,0.4)' }} />
              <input
                className="wizard-input"
                style={{ paddingLeft: 36 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={tCommon('search') + '...'}
              />
            </div>
          </div>
          <div className="wizard-catalogo-list">
            {filteredTratamientos.map((trat) => (
              <button
                key={trat.id}
                className="wizard-catalogo-item"
                onClick={() => addTratamientoFromCatalog(trat)}
              >
                <div>
                  <span className="wizard-catalogo-item__nombre">{trat.nombre}</span>
                  <span className="wizard-catalogo-item__categoria">{trat.categoria}</span>
                </div>
                <Plus size={16} />
              </button>
            ))}
            {filteredTratamientos.length === 0 && (
              <p className="wizard-text--muted">{tC('no_tratamientos')}</p>
            )}
          </div>
        </div>
      )}

      {tratamientos.map((tratamiento, index) => (
        <div key={index} className="wizard-card">
          <div className="wizard-card__header">
            <h3 className="wizard-card__subtitle">
              {tC('tratamiento')} {index + 1}
            </h3>
            <button className="wizard-btn-icon" onClick={() => removeTratamiento(index)}>
              <X size={16} />
            </button>
          </div>

          <div className="wizard-grid wizard-grid--1">
            <div className="wizard-field">
              <label>{tC('procedimiento_realizado')} *</label>
              <input
                className="wizard-input"
                value={tratamiento.procedimientoRealizado}
                onChange={(e) => updateTratamiento(index, 'procedimientoRealizado', e.target.value)}
                placeholder={tC('nombre_tratamiento_placeholder')}
              />
            </div>

            <div className="wizard-grid wizard-grid--3">
              <div className="wizard-field">
                <label><DollarSign size={14} /> {tC('costo_total')} *</label>
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
                <label>{tC('estado')}</label>
                <select
                  className="wizard-select"
                  value={tratamiento.estado}
                  onChange={(e) => updateTratamiento(index, 'estado', e.target.value)}
                >
                  <option value="realizado">{tC('realizado')}</option>
                  <option value="planificado">{tC('planificado')}</option>
                </select>
              </div>
              <div className="wizard-field">
                <label>{tCommon('notes')}</label>
                <input
                  className="wizard-input"
                  value={tratamiento.notas}
                  onChange={(e) => updateTratamiento(index, 'notas', e.target.value)}
                  placeholder={t('observaciones_placeholder')}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {tratamientos.length > 0 && (
        <div className="wizard-total">
          <span>{tC('costo_total')}:</span>
          <span className="wizard-total__amount">
            ${calcularTotal().toFixed(2)}
          </span>
        </div>
      )}

      {tratamientos.length === 0 && (
        <div className="wizard-empty">
          <Stethoscope size={32} />
          <p>{tC('sin_tratamientos')}</p>
        </div>
      )}
    </div>
  );
}
