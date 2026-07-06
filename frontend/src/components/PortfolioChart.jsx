import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PortfolioChart({ data, isArs }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No hay suficientes datos históricos para mostrar el gráfico.
      </div>
    );
  }

  const dataKey = isArs ? 'total_value_ars' : 'total_value_usd';
  
  // Determine color based on whether the portfolio went up or down
  const firstValue = data[0][dataKey];
  const lastValue = data[data.length - 1][dataKey];
  const isProfit = lastValue >= firstValue;
  const color = isProfit ? 'var(--profit)' : 'var(--loss)';

  return (
    <div style={{ width: '100%', height: 300, marginTop: '2rem' }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
              return `$${value}`;
            }}
            width={80}
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
