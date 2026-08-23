import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { pacienteService } from '../../services/pacienteService';

export default function ExcelImport({ onResult }) {
  const { t } = useTranslation('patients');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    // Simple preview: show filename and size
    setPreview({ name: f.name, size: (f.size / 1024).toFixed(1) + ' KB', type: f.type });
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const res = await pacienteService.importExcel(file);
      setResult(res);
      onResult?.(res);
    } catch (e) {
      setResult({ errores: 1, mensajesError: [e.message], importados: 0, saltados: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="import-panel">
      <div className="import-panel__upload-zone" onClick={() => inputRef.current?.click()}>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="import-panel__file-input"
        />
        {file ? (
          <div className="import-panel__file-info">
            <FileSpreadsheet size={32} />
            <span className="import-panel__file-name">{file.name}</span>
            <span className="import-panel__file-size">{preview?.size}</span>
          </div>
        ) : (
          <div className="import-panel__upload-placeholder">
            <Upload size={32} />
            <span>{t('excel_upload_text')}</span>
            <span className="import-panel__upload-hint">{t('excel_upload_hint')}</span>
          </div>
        )}
      </div>

      {file && (
        <div className="import-panel__file-detail">
          <FileSpreadsheet size={16} />
          <span>{t('file_ready')} <strong>{file.name}</strong></span>
        </div>
      )}

      {result && (
        <div className={`import-panel__result ${result.errores > 0 ? 'import-panel__result--error' : 'import-panel__result--success'}`}>
          {result.errores > 0 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          <div>
            <strong>{t('import_count', { count: result.importados })}</strong>
            {result.saltados > 0 && <span> · {t('skipped_count', { count: result.saltados })}</span>}
            {result.errores > 0 && <span> · {t('error_count', { count: result.errores })}</span>}
          </div>
        </div>
      )}

      <div className="import-panel__actions">
        {file && (
          <>
            <button className="import-panel__btn import-panel__btn--secondary" onClick={handleReset} disabled={loading}>
              {t('clear')}
            </button>
            <button className="import-panel__btn import-panel__btn--primary" onClick={handleImport} disabled={loading}>
              {loading ? <Loader2 size={18} className="import-panel__spinner" /> : <Upload size={18} />}
              {t('import')}
            </button>
          </>
        )}
      </div>

      <div className="import-panel__format-help">
        <h4>{t('format_expected_excel')}</h4>
        <p>{t('excel_format_desc')}</p>
        <div className="import-panel__columns">
          <span className="import-panel__col import-panel__col--required">{t('col_full_name')}</span>
          <span className="import-panel__col">{t('col_email')}</span>
          <span className="import-panel__col">{t('col_birth_date')}</span>
          <span className="import-panel__col">{t('col_sex')}</span>
          <span className="import-panel__col">{t('col_phone')}</span>
          <span className="import-panel__col">{t('col_address')}</span>
          <span className="import-panel__col">{t('col_city_state')}</span>
          <span className="import-panel__col">{t('col_occupation')}</span>
          <span className="import-panel__col">{t('col_emergency_contact')}</span>
          <span className="import-panel__col">{t('col_allergies')}</span>
          <span className="import-panel__col">{t('col_medical_history')}</span>
          <span className="import-panel__col">{t('col_treatment_type')}</span>
          <span className="import-panel__col">{t('col_sessions')}</span>
          <span className="import-panel__col">{t('col_cost')}</span>
          <span className="import-panel__col">{t('col_observations')}</span>
        </div>
        <p className="import-panel__format-note">
          {t('duplicate_note')}
        </p>
      </div>
    </div>
  );
}
