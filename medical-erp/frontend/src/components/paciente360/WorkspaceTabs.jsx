export default function WorkspaceTabs({ tabs, active, onChange }) {
  return (
    <div className="workspace__tabs">
      <div className="workspace-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`workspace-tabs__item ${active === tab.id ? 'workspace-tabs__item--active' : ''}`}
              onClick={() => onChange(tab.id)}
            >
              <Icon size={18} className="workspace-tabs__icon" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
