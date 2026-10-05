import { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, AlertTriangle, History, Loader2, Edit2, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { historiaClinicaService } from '../../services/historiaClinicaService';
import { formatNombre } from '../../utils/fullName';
import AntecedentesEditor, { ANTECEDENTES_FIELDS_DISPLAY, getActiveAntecedentes } from '../ui/AntecedentesEditor';

export default function PasoPaciente({ formData, updateFormData, paciente }) {
  const { t } = useTranslation('patients');
  const { t: tC } = useTranslation('clinical');
  const { t: tCommon } = useTranslation('common');
  const [historia, setHistoria] = useState(null);
  const [loadingHistoria, setLoadingHistoria] = useState(false);
  const [editingAntecedentes, setEditingAntecedentes] = useState(false);
  const [antecedentesValues, setAntecedentesValues] = useState({});
  const [savingAntecedentes, setSavingAntecedentes] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (paciente?.id) {
      setLoadingHistoria(true);
      historiaClinicaService.getByPaciente(paciente.id)
        .then((res) => {
          if (res?.success && res.data) {
            setHistoria(res.data);
            if (res.data.id) {
              updateFormData({ historiaId: res.data.id });
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoadingHistoria(false));
    }
  }, [paciente?.id]);

  if (!paciente) {
    return (
      <div className="wizard-step wizard-step--empty">
        <AlertTriangle size={48} />
        <h3>{tC('error_loading_client')}</h3>
        <p>{tC('back_to_reception')}</p>
      </div>
    );
  }

  const fullName = formatNombre(paciente);
  const edad = paciente.fechaNacimiento
    ? Math.floor((Date.now() - new Date(paciente.fechaNacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : '-';

  const activeAntecedentes = getActiveAntecedentes(historia);

  const startEditAntecedentes = () => {
    if (historia) {
      setAntecedentesValues({
        alergiaMedicamentos: historia.alergiaMedicamentos || '',
        propensionHemorragias: historia.propensionHemorragias || '',
        complicacionesAnestesia: historia.complicacionesAnestesia || '',
        presionArterialMedicacion: historia.presionArterialMedicacion || '',
        cardiopatiasPersonales: historia.cardiopatiasPersonales || '',
        cardiopatiasFamiliares: historia.cardiopatiasFamiliares || '',
        diabetesPersonal: historia.diabetesPersonal || '',
        diabetesFamiliar: historia.diabetesFamiliar || '',
        hepatitis: historia.hepatitis || '',
        otrasEnfermedades: historia.otrasEnfermedades || '',
        enfermedadActualMedicacion: historia.enfermedadActualMedicacion || '',
      });
    }
    setEditingAntecedentes(true);
    setSavedMsg('');
  };

  const saveAntecedentes = async () => {
    if (!historia?.id) return;
    setSavingAntecedentes(true);
    try {
      const result = await historiaClinicaService.updateAntecedentes(historia.id, antecedentesValues);
      if (!result.success) throw new Error(result.message || tC('error_guardar'));
      const updated = { ...historia, ...antecedentesValues };
      setHistoria(updated);
      setEditingAntecedentes(false);
      setSavedMsg(tCommon('saved_successfully'));
      setTimeout(() => setSavedMsg(''), 2000);
    } catch {
    } finally {
      setSavingAntecedentes(false);
    }
  };

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">
        <User size={20} />
        {tC('datos_paciente')}
      </h2>

      {/* Patient Info Card */}
      <div className="wizard-card">
        <div className="wizard-card__header">
          <div className="wizard-card__avatar">
            {(paciente.apellidoPaterno || '?')[0]}{(paciente.nombres || '?')[0]}
          </div>
          <div className="wizard-card__title">
            <h3>{fullName}</h3>
            <span>ID: {paciente.licenciaConducir}</span>
          </div>
        </div>

        <div className="wizard-grid wizard-grid--3">
          <div className="wizard-field">
            <label>{t('edad')}</label>
            <span>{edad} anios</span>
          </div>
          <div className="wizard-field">
            <label>{t('sexo')}</label>
            <span>{paciente.sexo || '-'}</span>
          </div>
          <div className="wizard-field">
            <label>{t('estado_civil')}</label>
            <span>{paciente.estadoCivil || '-'}</span>
          </div>
          <div className="wizard-field">
            <label><Phone size={14} /> {t('telefono')}</label>
            <span>{paciente.telefono || '-'}</span>
          </div>
          <div className="wizard-field">
            <label><Mail size={14} /> {tCommon('email')}</label>
            <span>{paciente.email || '-'}</span>
          </div>
          <div className="wizard-field">
            <label><MapPin size={14} /> {t('street')}</label>
            <span>{[paciente.direccionLinea1, paciente.ciudad, paciente.estadoProvincia, paciente.codigoPostal, paciente.direccionPais].filter(Boolean).join(', ') || '-'}</span>
          </div>
        </div>

        {paciente.direccion && (
          <div className="wizard-field wizard-field--full">
            <label>{t('direccion')}</label>
            <span>{paciente.direccion}</span>
          </div>
        )}

        <div className="wizard-grid wizard-grid--3">
          <div className="wizard-field">
            <label>{tC('peso')}</label>
            <span>{paciente.peso ? `${paciente.peso} kg` : '-'}</span>
          </div>
          <div className="wizard-field">
            <label>{tC('estatura')}</label>
            <span>{paciente.estatura ? `${paciente.estatura} cm` : '-'}</span>
          </div>
          <div className="wizard-field">
            <label>{t('contacto_emergencia')}</label>
            <span>{paciente.contactoEmergencia || '-'}</span>
          </div>
        </div>
      </div>

      {/* Antecedentes Medicos - Compact Display */}
      <div className="wizard-card">
        <div className="wizard-antecedentes-header">
          <h3 className="wizard-card__subtitle">
            <AlertTriangle size={16} />
            {t('medical_history_title')}
          </h3>
          <div className="wizard-antecedentes-header__actions">
            {savedMsg && <span className="saved-message">{savedMsg}</span>}
            {!editingAntecedentes ? (
              <button className="btn btn--ghost btn--sm" onClick={startEditAntecedentes} disabled={!historia}>
                <Edit2 size={14} /> {tCommon('edit')}
              </button>
            ) : (
              <>
                <button className="btn btn--ghost btn--sm" onClick={() => setEditingAntecedentes(false)}>
                  <X size={14} /> {tCommon('cancel')}
                </button>
                <button className="btn btn--primary btn--sm" onClick={saveAntecedentes} disabled={savingAntecedentes}>
                  {savingAntecedentes ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
                  {savingAntecedentes ? tCommon('saving') : tCommon('save')}
                </button>
              </>
            )}
          </div>
        </div>

        {loadingHistoria ? (
          <div className="wizard-loading">
            <Loader2 size={20} className="spin" />
            <span>{tCommon('loading_data')}</span>
          </div>
        ) : editingAntecedentes ? (
          <div className="antecedentes-edit">
            <AntecedentesEditor
              values={antecedentesValues}
              onChange={(key, val) => setAntecedentesValues(prev => ({ ...prev, [key]: val }))}
              compact
            />
          </div>
        ) : !historia ? (
          <div className="wizard-empty-inline">
            <p>{tC('no_historia_clinica')}</p>
            <p className="wizard-text--muted">{tC('antecedentes_automaticos')}</p>
          </div>
        ) : activeAntecedentes.length === 0 ? (
          <div className="wizard-empty-inline">
            <p>{t('sin_antecedentes')}</p>
          </div>
        ) : (
          <div className="wizard-antecedentes-compact">
            {activeAntecedentes.map(({ key, label, value }) => (
              <div key={key} className="wizard-antecedente-compact-item">
                <span className="wizard-antecedente-compact-dot" />
                <span className="wizard-antecedente-compact-label">{label}</span>
                {value !== tC('si') && (
                  <span className="wizard-antecedente-compact-detail">{value}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previous Consultations */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">
          <History size={16} />
          {tC('ultimas_consultas')}
        </h3>
        <p className="wizard-text--muted">
          {tC('consultas_previas_disponibles')}
        </p>
      </div>
    </div>
  );
}
