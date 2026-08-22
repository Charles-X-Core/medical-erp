import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, FileSpreadsheet, FileUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import ManualForm from '../components/centro-datos/ManualForm';
import CsvImport from '../components/centro-datos/CsvImport';
import ExcelImport from '../components/centro-datos/ExcelImport';
import '../styles/pages/_centro-datos-page.scss';

const TABS = [
  { id: 'manual', label: 'Ingreso Manual', icon: UserPlus },
  { id: 'csv', label: 'Importar CSV', icon: FileUp },
  { id: 'excel', label: 'Importar Excel', icon: FileSpreadsheet },
];

export default function CentroDatosPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manual');
  const [importResult, setImportResult] = useState(null);

  const handleImportSuccess = (result) => {
    setImportResult(result);
  };

  const clearResult = () => setImportResult(null);

  return (
    <div className="centro-datos-page">
      <div className="centro-datos-page__header">
        <button className="centro-datos-page__back" onClick={() => navigate('/inicio')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="centro-datos-page__title">Centro de Datos</h1>
          <p className="centro-datos-page__subtitle">Gestión masiva de clientes y tratamientos</p>
        </div>
      </div>

      <div className="centro-datos-page__tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`centro-datos-page__tab ${activeTab === tab.id ? 'centro-datos-page__tab--active' : ''}`}
              onClick={() => { setActiveTab(tab.id); clearResult(); }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="centro-datos-page__content">
        {activeTab === 'manual' && <ManualForm />}
        {activeTab === 'csv' && <CsvImport onResult={handleImportSuccess} />}
        {activeTab === 'excel' && <ExcelImport onResult={handleImportSuccess} />}
      </div>

      {importResult && (
        <ImportResultModal result={importResult} onClose={clearResult} />
      )}
    </div>
  );
}

function ImportResultModal({ result, onClose }) {
  const hasErrors = result.errores > 0;
  const hasSkipped = result.saltados > 0;

  return (
    <div className="centro-datos-page__modal-overlay" onClick={onClose}>
      <div className="centro-datos-page__modal" onClick={(e) => e.stopPropagation()}>
        <div className="centro-datos-page__modal-header">
          <h3>Resultado de Importación</h3>
          <button className="centro-datos-page__modal-close" onClick={onClose}>×</button>
        </div>
        <div className="centro-datos-page__modal-body">
          <div className="centro-datos-page__stats">
            <div className="centro-datos-page__stat centro-datos-page__stat--success">
              <CheckCircle size={20} />
              <span className="centro-datos-page__stat-value">{result.importados}</span>
              <span className="centro-datos-page__stat-label">Importados</span>
            </div>
            {hasSkipped && (
              <div className="centro-datos-page__stat centro-datos-page__stat--warning">
                <AlertTriangle size={20} />
                <span className="centro-datos-page__stat-value">{result.saltados}</span>
                <span className="centro-datos-page__stat-label">Saltados</span>
              </div>
            )}
            {hasErrors && (
              <div className="centro-datos-page__stat centro-datos-page__stat--error">
                <XCircle size={20} />
                <span className="centro-datos-page__stat-value">{result.errores}</span>
                <span className="centro-datos-page__stat-label">Errores</span>
              </div>
            )}
          </div>

          {result.pacientesImportados?.length > 0 && (
            <div className="centro-datos-page__detail-section">
              <h4>Clientes Importados</h4>
              <ul className="centro-datos-page__detail-list centro-datos-page__detail-list--success">
                {result.pacientesImportados.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </div>
          )}

          {result.pacientesSaltados?.length > 0 && (
            <div className="centro-datos-page__detail-section">
              <h4>Clientes Saltados</h4>
              <ul className="centro-datos-page__detail-list centro-datos-page__detail-list--warning">
                {result.pacientesSaltados.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {result.mensajesError?.length > 0 && (
            <div className="centro-datos-page__detail-section">
              <h4>Errores</h4>
              <ul className="centro-datos-page__detail-list centro-datos-page__detail-list--error">
                {result.mensajesError.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="centro-datos-page__modal-footer">
          <button className="centro-datos-page__btn centro-datos-page__btn--primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
