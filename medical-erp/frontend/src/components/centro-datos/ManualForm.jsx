import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Save, Loader2, Check, Camera, X, FileText, Stethoscope, ClipboardList, Image, ClipboardCheck, Plus, AlertTriangle, HelpCircle, Ruler, Phone } from 'lucide-react';
import { pacienteService } from '../../services/pacienteService';
import { historiaClinicaService } from '../../services/historiaClinicaService';
import { consultasService } from '../../services/consultasService';
import { tratamientoService } from '../../services/tratamientoService';
import { evidenciaService } from '../../services/evidenciaService';
import { TREATMENT_CATEGORIES, getTreatmentLabel } from '../../config/attentionTypes';
import { formatCurrency } from '../../utils/currency';
import { toLocalDateTime } from '../../utils/laTimezone';
import { useUnitSystem } from '../../context/UnitContext';
import { pesoAMetrico, tallaAMetrico, pesoAUS, tallaAUS } from '../../utils/units';

const ID_PREFIX = 'AUTO';
const ID_LENGTH = 8;

const emptyConsulta = {
  motivoConsulta: '',
  antecedentesPersonales: '',
  alergias: '',
  tipoTratamiento: '',
  sesionesPlaneadas: '',
  sesionesRealizadas: 0,
  estadoManual: '',
  fechaElaboracion: '',
  costoTotal: '',
  evolucion: '',
  observaciones: '',
  sesiones: [],
};

const emptyData = {
  // Paso 1 - Datos personales
  names: '',
  paternalSurname: '',
  licenciaConducir: '',
  fechaNacimiento: '',
  sexo: '',
  peso: '',
  estatura: '',
  telefono: '',
  email: '',
  direccionLinea1: '',
  ciudad: '',
  estadoProvincia: '',
  codigoPostal: '',
  contactoEmergencia: '',
  telefonoEmergencia: '',
  // Paso 2 - Consultas y Tratamientos (array)
  consultas: [{ ...emptyConsulta }],
  // Paso 3 - Registro fotografico
  fotoInicio: null,
  fotoFin: null,
  fotosPorSesion: {},
};

const sexoOptions = ['M', 'F'];
const sexoLabelsKey = { M: 'masculino', F: 'femenino' };

function generarIdAuto() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = ID_PREFIX;
  while (id.length < ID_LENGTH) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const nac = new Date(fechaNacimiento);
  if (isNaN(nac)) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export default function ManualForm() {
  const { t } = useTranslation('patients');
  const { t: tClinical } = useTranslation('clinical');
  const navigate = useNavigate();
  const { system, toggle } = useUnitSystem();
  const fileInputStartRef = useRef(null);
  const fileInputEndRef = useRef(null);
  const fileInputSessionRef = useRef(null);
  const stepperRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({ ...emptyData });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [progressMsg, setProgressMsg] = useState('');
  const [createdPacienteId, setCreatedPacienteId] = useState(null);
  const [showIdModal, setShowIdModal] = useState(false);
  const [idAutoGen, setIdAutoGen] = useState(false);
  const [activeSessionPhoto, setActiveSessionPhoto] = useState(null);

  const steps = [
    { label: t('personal_data'), description: t('personal_data_desc'), icon: FileText },
    { label: t('consultas_tratamientos'), description: t('consultas_tratamientos_desc'), icon: Stethoscope },
    { label: t('photos_section'), description: t('photos_section_desc'), icon: Image },
    { label: t('summary'), description: t('summary_desc'), icon: ClipboardCheck },
  ];

  useEffect(() => {
    const stepper = stepperRef.current;
    if (!stepper) return;
    const active = stepper.querySelector('.manual-form__step--active');
    if (!active) return;
    const targetLeft = active.offsetLeft - (stepper.clientWidth - active.offsetWidth) / 2;
    stepper.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }, [currentStep]);

  const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const edad = calcularEdad(data.fechaNacimiento);

  const updateConsulta = (index, field, value) => {
    setData((prev) => ({
      ...prev,
      consultas: prev.consultas.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  };

  const addConsulta = () => {
    setData((prev) => ({
      ...prev,
      consultas: [...prev.consultas, { ...emptyConsulta }],
    }));
  };

  const removeConsulta = (index) => {
    setData((prev) => ({
      ...prev,
      consultas: prev.consultas.filter((_, i) => i !== index),
    }));
  };

  const updateSesionesRealizadas = (conIdx, value) => {
    const n = Math.max(0, parseInt(value) || 0);
    setData((prev) => ({
      ...prev,
      consultas: prev.consultas.map((c, i) => {
        if (i !== conIdx) return c;
        const sesiones = c.sesiones.slice(0, n);
        while (sesiones.length < n) sesiones.push({ fecha: '', costo: '' });
        return { ...c, sesionesRealizadas: n, sesiones };
      }),
    }));
  };

  const updateSesion = (conIdx, sesIdx, field, value) => {
    setData((prev) => ({
      ...prev,
      consultas: prev.consultas.map((c, i) => {
        if (i !== conIdx) return c;
        return { ...c, sesiones: c.sesiones.map((s, j) => (j === sesIdx ? { ...s, [field]: value } : s)) };
      }),
    }));
  };

  const getEstadoDerivado = (con) => {
    const total = parseInt(con.sesionesPlaneadas) || 0;
    const real = con.sesionesRealizadas || 0;
    if (real === 0) return 'PENDIENTE';
    if (total > 0 && real >= total) return 'FINALIZADO';
    return 'EN_CURSO';
  };

  const getEstadoFinal = (con) => con.estadoManual || getEstadoDerivado(con);

  const sumaCostosSesiones = (con) => con.sesiones.reduce((acc, s) => acc + (parseFloat(s.costo) || 0), 0);

  const getCostoTotalFinal = (con) => parseFloat(con.costoTotal) || sumaCostosSesiones(con);

  const canNext = () => {
    if (currentStep === 0) return data.names.trim() && data.paternalSurname.trim();
    if (currentStep === 1) {
      return data.consultas.some((c) => c.motivoConsulta.trim().length > 0 && c.tipoTratamiento.trim().length > 0);
    }
    return true;
  };

  const canPrev = () => currentStep > 0;

  const handlePesoChange = (v) => {
    if (v === '' || v === null || v === undefined) { update('peso', ''); return; }
    update('peso', system === 'us' ? pesoAMetrico(v, 'us') : v);
  };

  const handleTallaChange = (v) => {
    if (v === '' || v === null || v === undefined) { update('estatura', ''); return; }
    update('estatura', system === 'us' ? tallaAMetrico(v, 'us') : v);
  };

  const handlePhotoAdd = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setData((prev) => ({ ...prev, [target]: { file, preview: URL.createObjectURL(file) } }));
    if (e.target) e.target.value = '';
  };

  const removePhoto = (target) => {
    setData((prev) => {
      if (prev[target]?.preview) URL.revokeObjectURL(prev[target].preview);
      return { ...prev, [target]: null };
    });
  };

  const handleSessionPhotoAdd = (e, key) => {
    const files = Array.from(e.target.files || []);
    const nuevos = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setData((prev) => ({
      ...prev,
      fotosPorSesion: { ...prev.fotosPorSesion, [key]: [...(prev.fotosPorSesion[key] || []), ...nuevos] },
    }));
    if (e.target) e.target.value = '';
  };

  const removeSessionPhoto = (key, fotoIdx) => {
    setData((prev) => {
      const arr = (prev.fotosPorSesion[key] || []).slice();
      if (arr[fotoIdx]?.preview) URL.revokeObjectURL(arr[fotoIdx].preview);
      arr.splice(fotoIdx, 1);
      const next = { ...prev.fotosPorSesion, [key]: arr };
      if (arr.length === 0) delete next[key];
      return { ...prev, fotosPorSesion: next };
    });
  };

  const doSave = async () => {
    try {
      setShowIdModal(false);
      setSaving(true);
      setError('');
      setProgressMsg(t('progress_creating_patient'));

      const licencia = data.licenciaConducir || generarIdAuto();
      const autoId = !data.licenciaConducir.trim();
      if (autoId) setIdAutoGen(true);

      // 1. Paciente
      const pacienteData = {
        nombres: data.names,
        apellidoPaterno: data.paternalSurname,
        licenciaConducir: licencia,
        fechaNacimiento: data.fechaNacimiento || null,
        sexo: data.sexo || null,
        telefono: data.telefono || null,
        email: data.email || null,
        direccionLinea1: data.direccionLinea1 || null,
        ciudad: data.ciudad || null,
        estadoProvincia: data.estadoProvincia || null,
        codigoPostal: data.codigoPostal || null,
        contactoEmergencia: data.contactoEmergencia || null,
        telefonoEmergencia: data.telefonoEmergencia || null,
        alergias: data.consultas[0]?.alergias || null,
        antecedentesPersonales: data.consultas[0]?.antecedentesPersonales || null,
        peso: data.peso !== '' ? parseFloat(data.peso) : null,
        estatura: data.estatura !== '' ? Math.round(parseFloat(data.estatura)) : null,
      };

      const pacienteRes = await pacienteService.create(pacienteData);
      if (!pacienteRes.success) throw new Error(pacienteRes.message || t('error_saving'));
      const pacienteId = pacienteRes.data.id;
      setCreatedPacienteId(pacienteId);

      // 2. Historia clinica
      setProgressMsg(t('progress_creating_history'));
      const historiaRes = await historiaClinicaService.create({
        pacienteId,
        alergiaMedicamentos: data.consultas[0]?.alergias || null,
        observaciones: data.consultas[0]?.antecedentesPersonales || null,
      });
      if (!historiaRes.success) throw new Error(historiaRes.message || t('error_saving'));
      const historiaId = historiaRes.data.id;

      // 3. Por cada consulta: crear Consulta → Tratamiento → Sesiones
      const allTratamientoIds = [];
      for (let ci = 0; ci < data.consultas.length; ci++) {
        const con = data.consultas[ci];
        if (!con.motivoConsulta.trim()) continue;

        setProgressMsg(t('progress_creating_consultation') + ` (${ci + 1}/${data.consultas.length})`);
        const fechaElab = con.fechaElaboracion ? `${con.fechaElaboracion}T12:00:00` : toLocalDateTime();

        // 3a. Consulta
        const consultaRes = await consultasService.create({
          historiaId,
          fecha: fechaElab,
          motivo: con.motivoConsulta,
          notas: con.observaciones || null,
        });
        if (!consultaRes.success) throw new Error(consultaRes.message || t('error_saving'));
        const consultaId = consultaRes.data.id;

        // 3b. Tratamiento
        setProgressMsg(t('progress_creating_treatment') + ` (${ci + 1}/${data.consultas.length})`);
        const costoTotalCon = getCostoTotalFinal(con);
        const objetivo = con.observaciones || t('manual_registration');
        const tratamientoRes = await tratamientoService.create({
          pacienteId,
          historiaClinicaId: historiaId,
          consultaOrigenId: consultaId,
          tipoTratamiento: con.tipoTratamiento,
          diagnosticoInicial: con.motivoConsulta || null,
          objetivo,
          sesionesPlaneadas: parseInt(con.sesionesPlaneadas) || 1,
          costoEstimado: costoTotalCon > 0 ? costoTotalCon : null,
          observaciones: con.observaciones || null,
          iniciarAhora: false,
        });
        if (!tratamientoRes.success) throw new Error(tratamientoRes.message || t('error_saving'));
        const tratamientoId = tratamientoRes.data.id;
        allTratamientoIds.push(tratamientoId);

        await consultasService.update(consultaId, {
          historiaId,
          fecha: fechaElab,
          motivo: con.motivoConsulta,
          notas: con.observaciones || null,
          tratamientoId,
        });

        await tratamientoService.programar(tratamientoId);

        // 3c. Sesiones
        const totalSesiones = con.sesiones.length;
        const sesionIds = [];
        if (totalSesiones > 0) {
          setProgressMsg(t('progress_creating_session'));
          await tratamientoService.iniciar(tratamientoId);
          const costoPorSesion = con.costoTotal && sumaCostosSesiones(con) === 0
            ? parseFloat(con.costoTotal) / totalSesiones
            : null;
          for (let i = 0; i < totalSesiones; i++) {
            const ses = con.sesiones[i];
            const fechaSes = ses.fecha ? `${ses.fecha}T12:00:00` : toLocalDateTime();
            const costoSesion = parseFloat(ses.costo) || (costoPorSesion !== null ? costoPorSesion : null);
            const sesRes = await tratamientoService.createSession(tratamientoId, {
              tipoSesionId: 1,
              fecha: fechaSes,
              motivoVisita: con.motivoConsulta,
              procedimientoRealizado: con.evolucion || null,
              observaciones: ses.observacionesLabel || null,
              costoSesion,
              requiereCita: false,
            });
            if (sesRes?.success) sesionIds.push(sesRes.data.id);
          }
        }

        // 3d. Finalizar si aplica
        const estadoFinalCon = getEstadoFinal(con);
        if (estadoFinalCon === 'FINALIZADO') {
          await tratamientoService.finalizar(tratamientoId, con.evolucion || t('manual_registration'));
        }

        // 3e. Fotos por sesión
        for (let si = 0; si < sesionIds.length; si++) {
          const fotosKey = `${ci}_${si}`;
          const fotos = data.fotosPorSesion[fotosKey] || [];
          for (const foto of fotos) {
            if (foto.file) await evidenciaService.uploadBatch(sesionIds[si], 'FOTO', t('session_number', { number: si + 1 }), [foto.file]).catch(() => {});
          }
        }
      }

      // 4. Fotos globales
      setProgressMsg(t('progress_uploading_photos'));
      const primerTratamientoId = allTratamientoIds[0];
      if (primerTratamientoId) {
        if (data.fotoInicio?.file) {
          await evidenciaService.uploadTratamiento(primerTratamientoId, 'FOTO_INICIO', t('photo_start'), [data.fotoInicio.file]).catch(() => {});
        }
        if (data.fotoFin?.file) {
          await evidenciaService.uploadTratamiento(primerTratamientoId, 'FOTO_FIN', t('photo_end'), [data.fotoFin.file]).catch(() => {});
        }
      }

      setSaved(true);
    } catch (e) {
      setError(e.message || t('error_saving'));
    } finally {
      setSaving(false);
      setProgressMsg('');
    }
  };

  const handleSaveClick = () => {
    if (!data.licenciaConducir.trim()) {
      setShowIdModal(true);
      return;
    }
    doSave();
  };

  const handleIdModalYes = () => {
    update('licenciaConducir', generarIdAuto());
    setIdAutoGen(true);
    doSave();
  };

  const handleReset = () => {
    setData({ ...emptyData });
    setSaved(false);
    setCreatedPacienteId(null);
    setCurrentStep(0);
    setIdAutoGen(false);
  };

  if (saved) {
    return (
      <div className="manual-form__success">
        <div className="manual-form__success-icon">
          <Check size={48} />
        </div>
        <h3>{t('client_created')}</h3>
        {idAutoGen && (
          <div className="manual-form__warning">
            <AlertTriangle size={16} />
            <span>{t('id_auto_warning')}</span>
          </div>
        )}
        <p>{t('doc_number')}: <strong>{data.licenciaConducir || 'N/A'}</strong></p>
        {createdPacienteId && data.consultas.filter((c) => c.motivoConsulta.trim()).length > 0 && (
          <div className="manual-form__success-detail">
            {data.consultas.filter((c) => c.motivoConsulta.trim()).map((con, i) => (
              <p key={i}>
                {t('consultation_number', { number: i + 1 })}: <strong>{getTreatmentLabel(con.tipoTratamiento)}</strong> — {con.sesionesRealizadas} {t('sessions')}
              </p>
            ))}
          </div>
        )}
        <div className="manual-form__success-actions">
          <button className="manual-form__btn manual-form__btn--primary" onClick={handleReset}>
            {t('register_another')}
          </button>
          <button className="manual-form__btn manual-form__btn--secondary" onClick={() => navigate('/inicio')}>
            {t('back_to_home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manual-form">
      <div className="manual-form__stepper" ref={stepperRef}>
        {steps.map((step, i) => {
          const canNavigate = i <= currentStep || i === currentStep + 1;
          const StepIcon = step.icon;
          return (
            <div
              key={i}
              className={`manual-form__step ${i === currentStep ? 'manual-form__step--active' : ''} ${i < currentStep ? 'manual-form__step--completed' : ''}`}
              onClick={() => canNavigate && setCurrentStep(i)}
              style={{ cursor: canNavigate ? 'pointer' : 'default', opacity: i > currentStep + 1 ? 0.45 : 1 }}
            >
              <div className="manual-form__step-number">
                {i < currentStep ? '✓' : <StepIcon size={14} />}
              </div>
              <div className="manual-form__step-info">
                <span className="manual-form__step-label">{step.label}</span>
                <span className="manual-form__step-desc">{step.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="manual-form__body">
        {/* ===== STEP 1: Datos Personales ===== */}
        {currentStep === 0 && (
          <div className="manual-form__sections">
            {/* Personal Info */}
            <div className="manual-form__section">
              <h4 className="manual-form__section-title"><FileText size={14} /> {t('section_personal')}</h4>
              <div className="manual-form__grid manual-form__grid--2">
                <div className="manual-form__field">
                  <label>{t('names')}</label>
                  <input type="text" value={data.names} onChange={(e) => update('names', e.target.value)} placeholder={t('full_names')} />
                </div>
                <div className="manual-form__field">
                  <label>{t('paternal_surname')}</label>
                  <input type="text" value={data.paternalSurname} onChange={(e) => update('paternalSurname', e.target.value)} placeholder={t('paternal_surname_placeholder')} />
                </div>
                <div className="manual-form__field">
                  <label>{t('doc_number')}</label>
                  <input type="text" value={data.licenciaConducir} onChange={(e) => { update('licenciaConducir', e.target.value); setIdAutoGen(false); }} placeholder={t('id_number_placeholder')} maxLength={8} />
                  <span className="manual-form__field-hint">{t('id_optional_hint')}</span>
                </div>
                <div className="manual-form__field">
                  <label>{t('birth_date')}</label>
                  <input type="date" value={data.fechaNacimiento} onChange={(e) => update('fechaNacimiento', e.target.value)} />
                </div>
                {edad !== null && (
                  <div className="manual-form__field">
                    <label>{t('age')}</label>
                    <div className="manual-form__readonly">{edad} {t('years')}</div>
                  </div>
                )}
                <div className="manual-form__field">
                  <label>{t('sex')}</label>
                  <select value={data.sexo} onChange={(e) => update('sexo', e.target.value)}>
                    <option value="">{t('select_option')}</option>
                    {sexoOptions.map((s) => (
                      <option key={s} value={s}>{t(sexoLabelsKey[s])}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Physical Metrics */}
            <div className="manual-form__section">
              <div className="manual-form__section-header">
                <h4 className="manual-form__section-title"><Ruler size={14} /> {t('section_physical')}</h4>
                <div className="unit-toggle">
                  <button className={`unit-toggle__btn ${system === 'metric' ? 'unit-toggle__btn--active' : ''}`}
                    onClick={() => system !== 'metric' && toggle()}>Metric</button>
                  <button className={`unit-toggle__btn ${system === 'us' ? 'unit-toggle__btn--active' : ''}`}
                    onClick={() => system !== 'us' && toggle()}>US</button>
                </div>
              </div>
              <div className="manual-form__grid manual-form__grid--2">
                <div className="manual-form__field">
                  <label>{system === 'us' ? tClinical('peso_lbs') : tClinical('peso_kg')}</label>
                  <input type="number" min="0" step="0.1" value={system === 'us' ? pesoAUS(data.peso) : data.peso} onChange={(e) => handlePesoChange(e.target.value)} placeholder={system === 'us' ? 'lbs' : 'kg'} />
                </div>
                <div className="manual-form__field">
                  <label>{system === 'us' ? tClinical('estatura_in') : tClinical('estatura_cm')}</label>
                  <input type="number" min="0" step="0.1" value={system === 'us' ? tallaAUS(data.estatura) : data.estatura} onChange={(e) => handleTallaChange(e.target.value)} placeholder={system === 'us' ? 'in' : 'cm'} />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="manual-form__section">
              <h4 className="manual-form__section-title"><Phone size={14} /> {t('section_contact')}</h4>
              <div className="manual-form__grid manual-form__grid--2">
                <div className="manual-form__field">
                  <label>{t('phone')}</label>
                  <input type="tel" value={data.telefono} onChange={(e) => update('telefono', e.target.value)} placeholder={t('phone')} />
                </div>
                <div className="manual-form__field">
                  <label>{t('email')}</label>
                  <input type="email" value={data.email} onChange={(e) => update('email', e.target.value)} placeholder={t('email_placeholder')} />
                </div>
                <div className="manual-form__field manual-form__field--full">
                  <label>{t('street')}</label>
                  <input type="text" value={data.direccionLinea1} onChange={(e) => update('direccionLinea1', e.target.value)} placeholder={t('street_placeholder')} />
                </div>
                <div className="manual-form__field">
                  <label>{t('city')}</label>
                  <input type="text" value={data.ciudad} onChange={(e) => update('ciudad', e.target.value)} placeholder={t('city_placeholder')} />
                </div>
                <div className="manual-form__field">
                  <label>{t('state')}</label>
                  <input type="text" value={data.estadoProvincia} onChange={(e) => update('estadoProvincia', e.target.value)} placeholder={t('state_placeholder')} />
                </div>
                <div className="manual-form__field">
                  <label>{t('zip_code')}</label>
                  <input type="text" value={data.codigoPostal} onChange={(e) => update('codigoPostal', e.target.value)} placeholder={t('zip_placeholder')} />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="manual-form__section">
              <h4 className="manual-form__section-title"><AlertTriangle size={14} /> {t('section_emergency')}</h4>
              <div className="manual-form__grid manual-form__grid--2">
                <div className="manual-form__field">
                  <label>{t('emergency_contact')}</label>
                  <input type="text" value={data.contactoEmergencia} onChange={(e) => update('contactoEmergencia', e.target.value)} placeholder={t('emergency_contact_placeholder')} />
                </div>
                <div className="manual-form__field">
                  <label>{t('emergency_phone')}</label>
                  <input type="tel" value={data.telefonoEmergencia} onChange={(e) => update('telefonoEmergencia', e.target.value)} placeholder={t('emergency_phone_placeholder')} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 2: Consultas y Tratamientos ===== */}
        {currentStep === 1 && (
          <div className="manual-form__consultas">
            {data.consultas.map((con, ci) => {
              const estadoCon = getEstadoFinal(con);
              const costoCon = getCostoTotalFinal(con);
              const hayDesbalance = con.costoTotal && sumaCostosSesiones(con) > 0 && Math.abs((parseFloat(con.costoTotal) || 0) - sumaCostosSesiones(con)) > 0.01;
              return (
                <div key={ci} className="manual-form__consulta-card">
                  <div className="manual-form__consulta-header">
                    <h4 className="manual-form__consulta-title">{t('consultation_number', { number: ci + 1 })}</h4>
                    {data.consultas.length > 1 && (
                      <button className="manual-form__btn-icon manual-form__btn-icon--danger" onClick={() => removeConsulta(ci)} title={t('remove_consultation')}>
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Consulta fields */}
                  <div className="manual-form__grid manual-form__grid--2">
                    <div className="manual-form__field manual-form__field--full">
                      <label>{t('consultation_reason_label')}</label>
                      <textarea value={con.motivoConsulta} onChange={(e) => updateConsulta(ci, 'motivoConsulta', e.target.value)} rows={2} placeholder={t('consultation_reason_placeholder')} />
                    </div>
                    <div className="manual-form__field manual-form__field--full">
                      <label>{t('personal_background')}</label>
                      <textarea value={con.antecedentesPersonales} onChange={(e) => updateConsulta(ci, 'antecedentesPersonales', e.target.value)} rows={2} placeholder={t('personal_background_placeholder')} />
                    </div>
                    <div className="manual-form__field manual-form__field--full">
                      <label>{t('allergies_label')}</label>
                      <textarea value={con.alergias} onChange={(e) => updateConsulta(ci, 'alergias', e.target.value)} rows={1} placeholder={t('allergies_placeholder')} />
                    </div>
                  </div>

                  {/* Tratamiento fields */}
                  <div className="manual-form__consulta-divider">
                    <Stethoscope size={14} />
                    <span>{t('treatment')}</span>
                  </div>
                  <div className="manual-form__grid manual-form__grid--2">
                    <div className="manual-form__field manual-form__field--full">
                      <label>{t('treatment_type')} *</label>
                      <select value={con.tipoTratamiento} onChange={(e) => updateConsulta(ci, 'tipoTratamiento', e.target.value)}>
                        <option value="">{t('select_treatment_type')}</option>
                        {TREATMENT_CATEGORIES.map((cat) => (
                          <optgroup key={cat.id} label={cat.label}>
                            {cat.treatments.map((tr) => (
                              <option key={tr.id} value={tr.id}>{tr.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className="manual-form__field">
                      <label>{t('planned_sessions')}</label>
                      <input type="number" min="1" max="100" value={con.sesionesPlaneadas} onChange={(e) => updateConsulta(ci, 'sesionesPlaneadas', e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="0" />
                    </div>
                    <div className="manual-form__field">
                      <label>{t('sessions_done')}</label>
                      <input type="number" min="0" max="100" value={con.sesionesRealizadas} onChange={(e) => updateSesionesRealizadas(ci, e.target.value)} />
                    </div>
                    <div className="manual-form__field manual-form__field--full">
                      <label>{t('session_status')}</label>
                      <div className="manual-form__status">
                        <span className={`manual-form__status-badge manual-form__status-badge--${estadoCon === 'FINALIZADO' ? 'done' : estadoCon === 'EN_CURSO' ? 'active' : 'pending'}`}>
                          {estadoCon === 'PENDIENTE' && t('session_status_pending')}
                          {estadoCon === 'EN_CURSO' && (con.sesionesPlaneadas ? t('session_in_progress_hint', { current: con.sesionesRealizadas, total: con.sesionesPlaneadas }) : t('session_status_active'))}
                          {estadoCon === 'FINALIZADO' && t('session_status_completed')}
                        </span>
                      </div>
                      <div className="manual-form__status-toggle">
                        <button className={`manual-form__pill ${con.estadoManual === 'EN_CURSO' ? 'manual-form__pill--active' : ''}`} onClick={() => updateConsulta(ci, 'estadoManual', con.estadoManual === 'EN_CURSO' ? '' : 'EN_CURSO')}>{t('session_status_active')}</button>
                        <button className={`manual-form__pill ${con.estadoManual === 'FINALIZADO' ? 'manual-form__pill--active' : ''}`} onClick={() => updateConsulta(ci, 'estadoManual', con.estadoManual === 'FINALIZADO' ? '' : 'FINALIZADO')}>{t('session_status_completed')}</button>
                      </div>
                    </div>
                    <div className="manual-form__field">
                      <label>{t('date_elaboration')}</label>
                      <input type="date" value={con.fechaElaboracion} onChange={(e) => updateConsulta(ci, 'fechaElaboracion', e.target.value)} />
                    </div>
                    <div className="manual-form__field">
                      <label>{t('total_cost')}</label>
                      <div className="manual-form__input-with-prefix">
                        <span className="manual-form__input-prefix">$</span>
                        <input type="number" min="0" step="0.01" value={con.costoTotal} onChange={(e) => updateConsulta(ci, 'costoTotal', e.target.value)} placeholder={t('cost_placeholder')} />
                      </div>
                    </div>
                    <div className="manual-form__field manual-form__field--full">
                      <label>{t('evolution')}</label>
                      <textarea value={con.evolucion} onChange={(e) => updateConsulta(ci, 'evolucion', e.target.value)} rows={2} placeholder={t('evolution_placeholder')} />
                    </div>
                    <div className="manual-form__field manual-form__field--full">
                      <label>{t('observations')}</label>
                      <textarea value={con.observaciones} onChange={(e) => updateConsulta(ci, 'observaciones', e.target.value)} rows={2} placeholder={t('observations_placeholder')} />
                    </div>

                    {con.sesionesRealizadas > 0 && (
                      <div className="manual-form__field manual-form__field--full">
                        <label className="manual-form__section-label">{t('sessions_list')}</label>
                        <div className="manual-form__sessions">
                          {con.sesiones.map((ses, si) => (
                            <div className="manual-form__session-row" key={si}>
                              <span className="manual-form__session-num">{t('session_number', { number: si + 1 })}</span>
                              <input type="date" className="manual-form__session-input" value={ses.fecha} onChange={(e) => updateSesion(ci, si, 'fecha', e.target.value)} />
                              <div className="manual-form__input-with-prefix manual-form__session-cost">
                                <span className="manual-form__input-prefix">$</span>
                                <input type="number" min="0" step="0.01" value={ses.costo} onChange={(e) => updateSesion(ci, si, 'costo', e.target.value)} placeholder={t('cost_placeholder')} />
                              </div>
                            </div>
                          ))}
                        </div>
                        {hayDesbalance && (
                          <div className="manual-form__inline-warning">
                            <AlertTriangle size={14} />
                            <span>{t('cost_mismatch')}</span>
                          </div>
                        )}
                        <div className="manual-form__cost-split">
                          <span>{t('sessions_sum')}: {formatCurrency(sumaCostosSesiones(con))}</span>
                          <span>{t('total_cost')}: {formatCurrency(costoCon)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <button className="manual-form__add-consulta" onClick={addConsulta}>
              <Plus size={18} />
              <span>{t('add_consultation')}</span>
            </button>
          </div>
        )}

        {/* ===== STEP 3: Registro Fotografico ===== */}
        {currentStep === 2 && (
          <div className="manual-form__photos">
            <div className="manual-form__photos-header">
              <p className="manual-form__photos-hint">{t('photos_hint')}</p>
            </div>

            <div className="manual-form__photos-span">
              <div className="manual-form__photo-slot">
                <span className="manual-form__photo-slot-label">{t('photo_start')}</span>
                {data.fotoInicio ? (
                  <div className="manual-form__photo-card">
                    <div className="manual-form__photo-preview">
                      <img src={data.fotoInicio.preview} alt={t('photo_start')} />
                      <button className="manual-form__photo-remove" onClick={() => removePhoto('fotoInicio')}><X size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <button className="manual-form__photo-add" onClick={() => fileInputStartRef.current?.click()}>
                    <Camera size={24} />
                    <span>{t('add_photo')}</span>
                  </button>
                )}
              </div>
              <div className="manual-form__photo-slot">
                <span className="manual-form__photo-slot-label">{t('photo_end')}</span>
                {data.fotoFin ? (
                  <div className="manual-form__photo-card">
                    <div className="manual-form__photo-preview">
                      <img src={data.fotoFin.preview} alt={t('photo_end')} />
                      <button className="manual-form__photo-remove" onClick={() => removePhoto('fotoFin')}><X size={16} /></button>
                    </div>
                  </div>
                ) : (
                  <button className="manual-form__photo-add" onClick={() => fileInputEndRef.current?.click()}>
                    <Camera size={24} />
                    <span>{t('add_photo')}</span>
                  </button>
                )}
              </div>
              <input ref={fileInputStartRef} type="file" accept="image/*" hidden onChange={(e) => handlePhotoAdd(e, 'fotoInicio')} />
              <input ref={fileInputEndRef} type="file" accept="image/*" hidden onChange={(e) => handlePhotoAdd(e, 'fotoFin')} />
            </div>

            {data.consultas.some((c) => c.sesionesRealizadas > 0) && (
              <div className="manual-form__photos-sessions">
                <h4 className="manual-form__summary-title">{t('session_photos')}</h4>
                {data.consultas.map((con, ci) => (
                  con.sesionesRealizadas > 0 && (
                    <div key={ci}>
                      <h5 className="manual-form__consulta-photo-label">{t('consultation_number', { number: ci + 1 })}</h5>
                      {con.sesiones.map((_, si) => {
                        const photoKey = `${ci}_${si}`;
                        return (
                          <div key={si} className="manual-form__photo-session-group">
                            <h5>{t('session_number', { number: si + 1 })}</h5>
                            <div className="manual-form__photos-grid">
                              {(data.fotosPorSesion[photoKey] || []).map((foto, fotoIdx) => (
                                <div key={fotoIdx} className="manual-form__photo-card">
                                  <div className="manual-form__photo-preview">
                                    <img src={foto.preview} alt={`C${ci + 1} S${si + 1}`} />
                                    <button className="manual-form__photo-remove" onClick={() => removeSessionPhoto(photoKey, fotoIdx)}><X size={16} /></button>
                                  </div>
                                </div>
                              ))}
                              <button className="manual-form__photo-add manual-form__photo-add--smaller" onClick={() => { setActiveSessionPhoto(photoKey); fileInputSessionRef.current?.click(); }}>
                                <Camera size={20} />
                                <span>{t('add_photo')}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ))}
                <input
                  ref={fileInputSessionRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => activeSessionPhoto !== null && handleSessionPhotoAdd(e, activeSessionPhoto)}
                />
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 4: Resumen ===== */}
        {currentStep === 3 && (
          <div className="manual-form__summary">
            <div className="manual-form__summary-section">
              <h4 className="manual-form__summary-title">{t('personal_data')}</h4>
              <div className="manual-form__summary-grid">
                <div className="manual-form__summary-item">
                  <span className="manual-form__summary-label">{t('full_names')}</span>
                  <span className="manual-form__summary-value">{data.names} {data.paternalSurname}</span>
                </div>
                <div className="manual-form__summary-item">
                  <span className="manual-form__summary-label">{t('doc_number')}</span>
                  <span className="manual-form__summary-value">{data.licenciaConducir || t('auto_generate_pending')}</span>
                </div>
                <div className="manual-form__summary-item">
                  <span className="manual-form__summary-label">{t('birth_date')}</span>
                  <span className="manual-form__summary-value">{data.fechaNacimiento || '-'} {edad !== null ? `(${edad})` : ''}</span>
                </div>
                <div className="manual-form__summary-item">
                  <span className="manual-form__summary-label">{t('phone')}</span>
                  <span className="manual-form__summary-value">{data.telefono || '-'}</span>
                </div>
                <div className="manual-form__summary-item">
                  <span className="manual-form__summary-label">{tClinical(system === 'us' ? 'peso_lbs' : 'peso_kg')}</span>
                  <span className="manual-form__summary-value">{data.peso ? `${system === 'us' ? pesoAUS(data.peso) : data.peso} ${system === 'us' ? 'lbs' : 'kg'}` : '-'}</span>
                </div>
                <div className="manual-form__summary-item">
                  <span className="manual-form__summary-label">{tClinical(system === 'us' ? 'estatura_in' : 'estatura_cm')}</span>
                  <span className="manual-form__summary-value">{data.estatura ? `${system === 'us' ? tallaAUS(data.estatura) : data.estatura} ${system === 'us' ? 'in' : 'cm'}` : '-'}</span>
                </div>
                <div className="manual-form__summary-item">
                  <span className="manual-form__summary-label">{t('zip_code')}</span>
                  <span className="manual-form__summary-value">{data.codigoPostal || '-'}</span>
                </div>
              </div>
            </div>

            <div className="manual-form__summary-section">
              <h4 className="manual-form__summary-title">{t('consultas_tratamientos')}</h4>
              {data.consultas.filter((c) => c.motivoConsulta.trim()).map((con, ci) => {
                const estadoCon = getEstadoFinal(con);
                const costoCon = getCostoTotalFinal(con);
                return (
                  <div key={ci} className="manual-form__summary-consulta">
                    <h5 className="manual-form__summary-consulta-title">{t('consultation_number', { number: ci + 1 })}</h5>
                    <p className="manual-form__summary-text">{con.motivoConsulta}</p>
                    {con.antecedentesPersonales && <p className="manual-form__summary-muted">{t('personal_background')}: {con.antecedentesPersonales}</p>}
                    {con.alergias && <p className="manual-form__summary-muted">{t('allergies_label')}: {con.alergias}</p>}
                    <div className="manual-form__summary-grid">
                      <div className="manual-form__summary-item">
                        <span className="manual-form__summary-label">{t('treatment_type')}</span>
                        <span className="manual-form__summary-value">{getTreatmentLabel(con.tipoTratamiento)}</span>
                      </div>
                      <div className="manual-form__summary-item">
                        <span className="manual-form__summary-label">{t('sessions_done')}</span>
                        <span className="manual-form__summary-value">{con.sesionesRealizadas} / {con.sesionesPlaneadas || '-'}</span>
                      </div>
                      <div className="manual-form__summary-item">
                        <span className="manual-form__summary-label">{t('session_status')}</span>
                        <span className="manual-form__summary-value">
                          {estadoCon === 'PENDIENTE' && t('session_status_pending')}
                          {estadoCon === 'EN_CURSO' && t('session_status_active')}
                          {estadoCon === 'FINALIZADO' && t('session_status_completed')}
                        </span>
                      </div>
                      <div className="manual-form__summary-item">
                        <span className="manual-form__summary-label">{t('total_cost')}</span>
                        <span className="manual-form__summary-value">{costoCon > 0 ? formatCurrency(costoCon) : '-'}</span>
                      </div>
                      {con.evolucion && (
                        <div className="manual-form__summary-item">
                          <span className="manual-form__summary-label">{t('evolution')}</span>
                          <span className="manual-form__summary-value">{con.evolucion}</span>
                        </div>
                      )}
                    </div>
                    {con.sesionesRealizadas > 0 && (
                      <div className="manual-form__summary-sessions">
                        {con.sesiones.map((ses, si) => (
                          <div key={si} className="manual-form__summary-session">
                            <span>{t('session_number', { number: si + 1 })}</span>
                            <span>{ses.fecha || '-'}</span>
                            <span>{ses.costo ? formatCurrency(parseFloat(ses.costo)) : '-'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {(data.fotoInicio || data.fotoFin || Object.keys(data.fotosPorSesion).length > 0) && (
              <div className="manual-form__summary-section">
                <h4 className="manual-form__summary-title">{t('photos_section')}</h4>
                <div className="manual-form__summary-photos">
                  {data.fotoInicio && <div className="manual-form__summary-photo"><img src={data.fotoInicio.preview} alt={t('photo_start')} /><span>{t('photo_start')}</span></div>}
                  {data.fotoFin && <div className="manual-form__summary-photo"><img src={data.fotoFin.preview} alt={t('photo_end')} /><span>{t('photo_end')}</span></div>}
                  {Object.entries(data.fotosPorSesion).map(([idx, fotos]) => (
                    fotos.map((foto, fIdx) => (
                      <div key={`${idx}-${fIdx}`} className="manual-form__summary-photo"><img src={foto.preview} alt={`Sesion ${parseInt(idx) + 1}`} /><span>{t('session_number', { number: parseInt(idx) + 1 })}</span></div>
                    ))
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div className="manual-form__error">{error}</div>}
        {progressMsg && saving && (
          <div className="manual-form__progress">
            <Loader2 size={16} className="manual-form__spinner" /> {progressMsg}
          </div>
        )}
      </div>

      <div className="manual-form__footer">
        <button
          className="manual-form__btn manual-form__btn--secondary"
          disabled={!canPrev() || saving}
          onClick={() => setCurrentStep((s) => s - 1)}
        >
          <ChevronLeft size={18} /> {t('prev')}
        </button>
        <div className="manual-form__footer-right">
          {currentStep < steps.length - 1 ? (
            <button
              className="manual-form__btn manual-form__btn--primary"
              disabled={!canNext()}
              onClick={() => setCurrentStep((s) => s + 1)}
            >
              {t('next')} <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="manual-form__btn manual-form__btn--primary manual-form__btn--save"
              disabled={saving}
              onClick={handleSaveClick}
            >
              {saving ? <Loader2 size={18} className="manual-form__spinner" /> : <Save size={18} />}
              {t('save_client')}
            </button>
          )}
        </div>
      </div>

      {showIdModal && (
        <div className="manual-form__modal-overlay">
          <div className="manual-form__modal">
            <div className="manual-form__modal-icon"><HelpCircle size={32} /></div>
            <h3>{t('id_auto_generate_title')}</h3>
            <p>{t('id_auto_generate_text')}</p>
            <div className="manual-form__modal-actions">
              <button className="manual-form__btn manual-form__btn--primary" onClick={handleIdModalYes}>{t('id_auto_generate_yes')}</button>
              <button className="manual-form__btn manual-form__btn--secondary" onClick={() => setShowIdModal(false)}>{t('id_auto_generate_no')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
