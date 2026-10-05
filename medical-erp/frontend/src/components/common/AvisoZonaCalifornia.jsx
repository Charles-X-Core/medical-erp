import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { useZona } from '../../utils/zonaHoraria';

/**
 * Tarjeta de aviso: SOLO se muestra en modo Perú (PE) en las pantallas
 * donde el usuario ESCRIBE una hora (disponibilidad, onboarding, fecha de
 * consulta). Recordatorio visual de que ese valor se guarda en hora de
 * California. No persiste ni modifica nada.
 */
export default function AvisoZonaCalifornia() {
  const { t } = useTranslation('common');
  const zona = useZona();

  if (zona !== 'PE') return null;

  return (
    <div className="aviso-zona" role="note">
      <span className="aviso-zona__badge">CA</span>
      <div className="aviso-zona__body">
        <strong className="aviso-zona__titulo">
          <Clock size={13} />
          {t('tz_aviso_titulo')}
        </strong>
        <p className="aviso-zona__texto">{t('tz_aviso_texto')}</p>
      </div>
    </div>
  );
}
