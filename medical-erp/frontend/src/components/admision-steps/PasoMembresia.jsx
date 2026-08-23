import { CreditCard, Calendar, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { membresiaService } from '../../services/membresiaService';

const TIPOS = ['BASICA', 'PREMIUM', 'VIP', 'CORPORATIVA'];

export default function PasoMembresia({ pacienteId, membresias, onMembresiasChange }) {
  const { t } = useTranslation('patients');
  const [form, setForm] = useState({ tipo: 'BASICA', fechaInicio: '', fechaFin: '' });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!form.fechaInicio || !form.fechaFin || !pacienteId) return;
    setLoading(true);
    try {
      const nueva = await membresiaService.create({
        pacienteId,
        tipo: form.tipo,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
      });
      onMembresiasChange([nueva, ...membresias]);
      setForm({ tipo: 'BASICA', fechaInicio: '', fechaFin: '' });
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await membresiaService.remove(id);
      onMembresiasChange(membresias.filter(m => m.id !== id));
    } catch { /* */ }
  };

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <CreditCard size={24} />
        <h3>{t('membresia')}</h3>
        <p>{t('registro_membresia_cliente')}</p>
      </div>

      <div className="wizard-step__membresia-form">
        <div className="wizard-step__form-grid wizard-step__form-grid--compact">
          <div className="wizard-step__field">
            <label>{t('tipo')}</label>
            <select value={form.tipo} onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value }))}>
              {TIPOS.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </div>
          <div className="wizard-step__field">
            <label>{t('fecha_inicio')}</label>
            <input type="date" value={form.fechaInicio} onChange={e => setForm(prev => ({ ...prev, fechaInicio: e.target.value }))} />
          </div>
          <div className="wizard-step__field">
            <label>{t('fecha_fin')}</label>
            <input type="date" value={form.fechaFin} onChange={e => setForm(prev => ({ ...prev, fechaFin: e.target.value }))} />
          </div>
          <div className="wizard-step__field wizard-step__field--action">
            <button className="wizard-step__btn-add" onClick={handleAdd} disabled={loading}>
              <Plus size={16} /> {loading ? t('agregando') : t('agregar')}
            </button>
          </div>
        </div>
      </div>

      {membresias.length > 0 && (
        <div className="wizard-step__membresia-list">
          {membresias.map(m => (
            <div key={m.id} className={`wizard-step__membresia-card ${m.vigente ? 'wizard-step__membresia-card--activa' : ''}`}>
              <div className="wizard-step__membresia-info">
                <span className="wizard-step__membresia-tipo">{m.tipo}</span>
                <span className="wizard-step__membresia-fechas">
                  <Calendar size={14} /> {m.fechaInicio} — {m.fechaFin}
                </span>
                <span className={`wizard-step__membresia-estado wizard-step__membresia-estado--${m.estado}`}>
                  {m.vigente ? t('vigente') : m.estado}
                </span>
              </div>
              <button className="wizard-step__btn-delete" onClick={() => handleDelete(m.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {membresias.length === 0 && (
        <div className="wizard-step__empty">
          <CreditCard size={32} />
          <p>{t('sin_membresias_registradas')}</p>
        </div>
      )}
    </div>
  );
}
