import { useState, useCallback } from 'react';
import Sidebar from './Sidebar';

export default function ErpLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  return (
    <div className="erp-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onToggleMobile={toggleMobile}
      />
      {mobileOpen && (
        <div className="erp-layout__overlay" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`erp-layout__main ${sidebarCollapsed ? 'erp-layout__main--collapsed' : ''}`}>
        <main className="erp-layout__content">
          {children}
        </main>
      </div>
    </div>
  );
}
