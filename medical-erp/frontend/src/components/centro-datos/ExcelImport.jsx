import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { pacienteService } from '../../services/pacienteService';

export default function ExcelImport({ onResult }) {
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
            <span>Haz clic o arrastra un archivo Excel aquí</span>
            <span className="import-panel__upload-hint">Formatos: .xlsx, .xls</span>
          </div>
        )}
      </div>

      {file && (
        <div className="import-panel__file-detail">
          <FileSpreadsheet size={16} />
          <span>Archivo listo para importar: <strong>{file.name}</strong></span>
        </div>
      )}

      {result && (
        <div className={`import-panel__result ${result.errores > 0 ? 'import-panel__result--error' : 'import-panel__result--success'}`}>
          {result.errores > 0 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          <div>
            <strong>{result.importados} importados</strong>
            {result.saltados > 0 && <span> · {result.saltados} saltados</span>}
            {result.errores > 0 && <span> · {result.errores} errores</span>}
          </div>
        </div>
      )}

      <div className="import-panel__actions">
        {file && (
          <>
            <button className="import-panel__btn import-panel__btn--secondary" onClick={handleReset} disabled={loading}>
              Limpiar
            </button>
            <button className="import-panel__btn import-panel__btn--primary" onClick={handleImport} disabled={loading}>
              {loading ? <Loader2 size={18} className="import-panel__spinner" /> : <Upload size={18} />}
              Importar
            </button>
          </>
        )}
      </div>

      <div className="import-panel__format-help">
        <h4>Formato esperado del Excel</h4>
        <p>El archivo Excel debe tener la primera fila como encabezados. Hoja 1 será procesada. Columnas disponibles:</p>
        <div className="import-panel__columns">
          <span className="import-panel__col import-panel__col--required">nombre completo*</span>
          <span className="import-panel__col">correo electronico</span>
          <span className="import-panel__col">fecha nacimiento</span>
          <span className="import-panel__col">sexo</span>
          <span className="import-panel__col">telefono</span>
          <span className="import-panel__col">direccion</span>
          <span className="import-panel__col">ciudad/estado</span>
          <span className="import-panel__col">ocupacion</span>
          <span className="import-panel__col">contacto de emergencia</span>
          <span className="import-panel__col">alergias</span>
          <span className="import-panel__col">antecedentes medicos</span>
          <span className="import-panel__col">tipo de tratamiento</span>
          <span className="import-panel__col">sesiones</span>
          <span className="import-panel__col">costo</span>
          <span className="import-panel__col">observaciones</span>
        </div>
        <p className="import-panel__format-note">
          Los clientes duplicados (mismo email) serán saltados. Si no se proporciona licencia de conducir, se generará automáticamente como IMP-XXXX.
        </p>
      </div>
    </div>
  );
}
