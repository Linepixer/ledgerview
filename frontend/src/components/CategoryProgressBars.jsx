import React from 'react';

export default function CategoryProgressBars({ data, currency }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', padding: '0 1rem' }}>
      {data.map((cat, index) => {
        const color = 'var(--profit)'; 
        // Create a subtle fade effect so not all bars are equally bright
        const opacity = Math.max(0.4, 1 - (index * 0.2));

        return (
          <div key={cat.type}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', color: 'var(--text-main)', fontSize: '0.95rem' }}>{cat.type}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {formatCurrency(cat.value)} <span style={{ marginLeft: '0.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{cat.percentage.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%</span>
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${cat.percentage}%`, 
                  background: color,
                  opacity: opacity,
                  borderRadius: '3px',
                  boxShadow: `0 0 10px ${color}`,
                  transition: 'width 1s ease-in-out'
                }} 
              />
            </div>
          </div>
        )
      })}
    </div>
  );
}
