export default function Timeline({ items, renderItem }) {
  return (
    <div className="timeline">
      {items.map((item, index) => (
        <div key={item.id || index} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            {renderItem(item, index)}
          </div>
        </div>
      ))}
    </div>
  );
}