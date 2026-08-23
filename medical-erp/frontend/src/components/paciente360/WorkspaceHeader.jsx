import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

export default function WorkspaceHeader({ paciente, onEdit, onMoreActions, extraActions }) {
  const { t } = useTranslation(['patients', 'common']);
  if (!paciente) return null;

  const fullName = `${paciente.apellidoPaterno || ''} ${paciente.apellidoMaterno || ''}, ${paciente.nombres || ''}`.trim();

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    return edad;
  };

  const edad = calcularEdad(paciente.fechaNacimiento);
  const sexoLabel = paciente.sexo === 'M' ? '\u2642' : paciente.sexo === 'F' ? '\u2640' : '';

  return (
    <div className="workspace__header">
      <div className="workspace__patient-info">
        <h1 className="workspace__patient-name">{fullName}</h1>
        <div className="workspace__patient-meta">
          {sexoLabel && (
            <span className="workspace__patient-badge workspace__patient-badge--gender">
              {sexoLabel} {edad ? `${edad} ${t('years', { ns: 'patients' })}` : ''}
            </span>
          )}
          {!sexoLabel && edad && (
            <span>{edad} {t('years', { ns: 'patients' })}</span>
          )}
          {paciente.licenciaConducir && (
            <span>ID: {paciente.licenciaConducir}</span>
          )}
          {paciente.estado && (
            <span className={`workspace__patient-badge workspace__patient-badge--${paciente.estado === 'activo' ? 'active' : 'inactive'}`}>
              {paciente.estado}
            </span>
          )}
        </div>
      </div>
      <div className="workspace__header-actions">
        {extraActions}
        <button className="btn btn--ghost btn--sm" onClick={onEdit}>
          {t('back_to_clients')}
        </button>
        <button className="btn btn--primary btn--sm" onClick={onMoreActions}>
          {t('edit', { ns: 'common' })}
        </button>
      </div>
    </div>
  );
}
