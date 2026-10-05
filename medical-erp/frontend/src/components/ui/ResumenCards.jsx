import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/currency';

export default function ResumenCards({ 
  resumen, 
  onTab 
}) {
  const { t } = useTranslation('patients');
  if (!resumen) return null;

  return (
    <div className="resumen-cards">
      <div className="resumen-card" onClick={() => onTab?.('clinico')}>
        <span className="resumen-card__num">{resumen.totalConsultas || 0}</span>
        <span className="resumen-card__label">{t('consultas')}</span>
      </div>
      <div className="resumen-card" onClick={() => onTab?.('clinico')}>
        <span className="resumen-card__num">
          {resumen.tratamientosPendientes || 0} / {resumen.totalTratamientos || 0}
        </span>
        <span className="resumen-card__label">{t('tratamientos')}</span>
      </div>
      <div className="resumen-card" onClick={() => onTab?.('financiero')}>
        <span className="resumen-card__num">{formatCurrency(resumen.costoTotalTratamientos || 0)}</span>
        <span className="resumen-card__label">{t('total_tratamientos')}</span>
      </div>
      <div className="resumen-card" onClick={() => onTab?.('clinico')}>
        <span className="resumen-card__num">{resumen.totalRecetas || 0}</span>
        <span className="resumen-card__label">{t('recetas_medicas')}</span>
      </div>
    </div>
  );
}
