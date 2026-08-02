import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PortfolioChart({ data, isArs }) {
  const [timeRange, setTimeRange] = useState('MAX');

  if (!data || data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No hay suficientes datos históricos para mostrar el gráfico.
      </div>
    );
  }

  const filterData = () => {
    if (timeRange === 'MAX') return data;
    
    const now = new Date();
    let targetDate = new Date();
    if (timeRange === '1S') targetDate.setDate(now.getDate() - 7);
    if (timeRange === '1M') targetDate.setMonth(now.getMonth() - 1);
    if (timeRange === '3M') targetDate.setMonth(now.getMonth() - 3);
    if (timeRange === '6M') targetDate.setMonth(now.getMonth() - 6);
    if (timeRange === '1A') targetDate.setFullYear(now.getFullYear() - 1);
    
    const targetString = targetDate.toISOString().split('T')[0];
    const filtered = data.filter(d => d.date >= targetString);
    
    return filtered.length >= 2 ? filtered : data.slice(-2);
  };

  const filteredData = filterData();
  const dataKey = isArs ? 'total_value_ars' : 'total_value_usd';
  
  // Determine color based on whether the portfolio went up or down in the filtered period
  const firstValue = filteredData[0][dataKey];
  const lastValue = filteredData[filteredData.length - 1][dataKey];
  const isProfit = lastValue >= firstValue;
  const color = isProfit ? 'var(--profit)' : 'var(--loss)';

  return (
    <div style={{ width: '100%', height: 330, marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem', marginBottom: '0.5rem', paddingRight: '10px' }}>
        {['1S', '1M', '3M', '6M', '1A', 'MAX'].map(tr => (
          <button 
            key={tr}
            onClick={() => setTimeRange(tr)}
            style={{
              background: timeRange === tr ? 'var(--border)' : 'transparent',
              color: timeRange === tr ? 'var(--text-main)' : 'var(--text-muted)',
              border: 'none',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: timeRange === tr ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tr}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={filteredData} margin={{ top: 20, right: 0, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-muted)', fontSize: 11, dx: 10, dy: -10, textAnchor: 'start' }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `$${(value / 1000000).toLocaleString('es-AR', {minimumFractionDigits: 1, maximumFractionDigits: 1})}M`;
              if (value >= 1000) return `$${(value / 1000).toLocaleString('es-AR', {minimumFractionDigits: 1, maximumFractionDigits: 1})}k`;
              return `$${value.toLocaleString('es-AR')}`;
            }}
            width={1}
            mirror={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              color: 'var(--text-main)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
            formatter={(value) => [
              new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: isArs ? 'ARS' : 'USD',
                minimumFractionDigits: isArs ? 0 : 2,
                maximumFractionDigits: isArs ? 0 : 2
              }).format(value), 
              'Patrimonio Total'
            ]}
            labelStyle={{ color: 'var(--text-muted)', marginBottom: '5px' }}
          />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorValue)" 
            strokeWidth={3}
            activeDot={{ r: 6, fill: color, stroke: 'var(--bg-main)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
