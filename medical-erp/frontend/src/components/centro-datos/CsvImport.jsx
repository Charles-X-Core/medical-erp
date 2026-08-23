import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { pacienteService } from '../../services/pacienteService';

export default function CsvImport({ onResult }) {
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

    // Preview first 5 rows
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter((l) => l.trim()).slice(0, 6);
      setPreview(lines);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      setLoading(true);
      const res = await pacienteService.importCsv(file);
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
          accept=".csv"
          onChange={handleFile}
          className="import-panel__file-input"
        />
        {file ? (
          <div className="import-panel__file-info">
            <FileText size={32} />
            <span className="import-panel__file-name">{file.name}</span>
            <span className="import-panel__file-size">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        ) : (
          <div className="import-panel__upload-placeholder">
            <Upload size={32} />
            <span>{t('csv_upload_text')}</span>
            <span className="import-panel__upload-hint">{t('csv_upload_hint')}</span>
          </div>
        )}
      </div>

      {preview && (
        <div className="import-panel__preview">
          <h4>{t('preview_rows')}</h4>
          <div className="import-panel__table-wrapper">
            <table className="import-panel__table">
              <thead>
                <tr>
                  {preview[0]?.split(',').map((h, i) => (
                    <th key={i}>{h.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, i) => (
                  <tr key={i}>
                    {row.split(',').map((cell, j) => (
                      <td key={j}>{cell.trim()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <h4>{t('format_expected_csv')}</h4>
        <p>{t('csv_format_desc')}</p>
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
