import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  return (
    <div className="not-found-page">
      <div className="not-found-page__card">
        <div className="not-found-page__icon">
          <span className="not-found-page__code">404</span>
        </div>
        <h1 className="not-found-page__title">{t('page_not_found', 'Page not found')}</h1>
        <p className="not-found-page__desc">
          {t('page_not_found_desc', 'The page you are looking for does not exist or has been moved.')}
        </p>
        <div className="not-found-page__actions">
          <button className="btn btn--primary" onClick={() => navigate('/inicio')}>
            <Home size={16} /> {t('go_home', 'Go to Home')}
          </button>
          <button className="btn btn--secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> {t('go_back', 'Go Back')}
          </button>
        </div>
      </div>
    </div>
  );
}
