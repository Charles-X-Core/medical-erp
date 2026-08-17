import { useState } from 'react';

export default function ExpandibleCard({ 
  title, 
  children, 
  defaultExpanded = false, 
  badge,
  onToggle 
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    onToggle?.(next);
  };

  return (
    <div className={`expandible-card ${expanded ? 'expanded' : ''}`}>
      <div className="expandible-card__header" onClick={handleToggle}>
        <h4 className="expandible-card__title">{title}</h4>
        {badge && <span className="expandible-card__badge">{badge}</span>}
        <span className="expandible-card__icon">{expanded ? '▼' : '▶'}</span>
      </div>
      <div className={`expandible-card__content ${expanded ? 'visible' : ''}`}>
        {children}
      </div>
    </div>
  );
}