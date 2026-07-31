import Sidebar from './Sidebar';
import Header from './Header';

export default function ErpLayout({ children }) {
  return (
    <div className="erp-layout">
      <Sidebar />
      <div className="erp-layout__main">
        <Header />
        <main className="erp-layout__content">
          {children}
        </main>
      </div>
    </div>
  );
}
