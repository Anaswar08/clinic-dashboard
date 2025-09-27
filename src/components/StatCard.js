const StatCard = ({ title, value, icon, bgColor = '#f3f4f6', textColor = '#000', growth }) => {
  return (
    <div
      style={{
        background: bgColor,
        color: textColor,
        borderRadius: '10px',
        padding: '20px',
        flex: 1,
        minWidth: '200px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '24px', marginRight: '10px' }}>{icon}</span>
        <h4 style={{ margin: 0 }}>{title}</h4>
      </div>
      <h2 style={{ margin: '10px 0' }}>{value}</h2>
      {growth && (
        <p style={{ color: growth.startsWith('+') ? 'green' : 'red', fontSize: '14px' }}>
          {growth.includes('-') ? '↓' : '↑'} {growth.replace(/^[+-]/, '')} from yesterday
        </p>
      )}
    </div>
  );
};

export default StatCard;
