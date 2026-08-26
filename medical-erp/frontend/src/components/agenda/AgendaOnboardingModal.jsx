import { useState, useEffect, useRef } from 'react';
import { X, CalendarClock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import agendaService from '../../services/agendaService';

const DIAS = [0, 1, 2, 3, 4, 5, 6];
const DIAS_KEY = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const DEFAULT_DISPO = [
  { diaSemana: 1, horaInicio: '08:00', horaFin: '17:00', activo: true },
  { diaSemana: 2, horaInicio: '08:00', horaFin: '17:00', activo: true },
  { diaSemana: 3, horaInicio: '08:00', horaFin: '17:00', activo: true },
  { diaSemana: 4, horaInicio: '08:00', horaFin: '17:00', activo: true },
  { diaSemana: 5, horaInicio: '08:00', horaFin: '17:00', activo: true },
  { diaSemana: 6, horaInicio: '08:00', horaFin: '14:00', activo: false },
  { diaSemana: 0, horaInicio: '08:00', horaFin: '14:00', activo: false },
];

export default function AgendaOnboardingModal({ open, usuarioId, onSaved, onSkip }) {
  const { t } = useTranslation('agenda');
  const overlayRef = useRef(null);
  const [disponibilidades, setDisponibilidades] = useState(DEFAULT_DISPO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onSkip(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onSkip]);

  if (!open) return null;

  const toggleDia = (dia) => {
    setDisponibilidades(prev =>
      prev.map(d => d.diaSemana === dia ? { ...d, activo: !d.activo } : d)
    );
  };

  const updateHora = (dia, field, value) => {
    setDisponibilidades(prev =>
      prev.map(d => d.diaSemana === dia ? { ...d, [field]: value } : d)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const active = disponibilidades
        .filter(d => d.activo)
        .map(d => ({
          diaSemana: d.diaSemana,
          horaInicio: d.horaInicio,
          horaFin: d.horaFin,
        }));

      if (active.length === 0) {
        setError(t('onboarding_at_least_one'));
        setSaving(false);
        return;
      }

      for (const d of active) {
        if (d.horaInicio >= d.horaFin) {
          setError(`${t('en_dia', { dia: t(`onboarding_${DIAS_KEY[d.diaSemana]}`) })} ${t('hora_fin_posterior', { horaInicio: d.horaInicio, horaFin: d.horaFin })}`);
          setSaving(false);
          return;
        }
      }

      const res = await agendaService.crearAgenda({
        usuarioId,
        nombre: 'Mi Agenda',
        disponibilidades: active,
      });

      if (res.success) {
        onSaved();
      } else {
        setError(res.message || t('error_guardar_slot'));
      }
    } catch {
      setError(t('error_conexion'));
    }
    setSaving(false);
  };

  return (
    <div className="onboarding-modal" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onSkip(); }}>
      <div className="onboarding-modal__box">
        <button className="onboarding-modal__close" onClick={onSkip}>
          <X size={18} />
        </button>

        <div className="onboarding-modal__icon">
          <CalendarClock size={40} />
        </div>

        <h3 className="onboarding-modal__title">{t('onboarding_title')}</h3>
        <p className="onboarding-modal__subtitle">{t('onboarding_subtitle')}</p>

        {error && <div className="onboarding-modal__error">{error}</div>}

        <div className="onboarding-modal__grid">
          {DIAS.map((dia) => {
            const d = disponibilidades.find(x => x.diaSemana === dia);
            return (
              <div key={dia} className={`onboarding-modal__row ${d.activo ? 'onboarding-modal__row--active' : ''}`}>
                <label className="onboarding-modal__toggle">
                  <input
                    type="checkbox"
                    checked={d.activo}
                    onChange={() => toggleDia(dia)}
                  />
                  <span className="onboarding-modal__toggle-slider" />
                  <span className="onboarding-modal__day-label">{t(`onboarding_${DIAS_KEY[dia]}`)}</span>
                </label>
                <div className="onboarding-modal__times">
                  <input
                    type="time"
                    value={d.horaInicio}
                    onChange={(e) => updateHora(dia, 'horaInicio', e.target.value)}
                    disabled={!d.activo}
                    className="onboarding-modal__time-input"
                  />
                  <span className="onboarding-modal__separator">-</span>
                  <input
                    type="time"
                    value={d.horaFin}
                    onChange={(e) => updateHora(dia, 'horaFin', e.target.value)}
                    disabled={!d.activo}
                    className="onboarding-modal__time-input"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="onboarding-modal__actions">
          <button className="onboarding-modal__btn onboarding-modal__btn--skip" onClick={onSkip}>
            {t('onboarding_omitir')}
          </button>
          <button
            className="onboarding-modal__btn onboarding-modal__btn--save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className="spinner" /> : t('onboarding_guardar')}
          </button>
        </div>
      </div>
    </div>
  );
}
