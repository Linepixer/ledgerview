import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Dark-mode optimized color palette
const TICKER_COLORS = {
  USD: '#59a14f',
  GLD: '#edc948',
  BTC: '#f28e2c',
  XRP: '#ff9da7',
  USDT: '#e15759',
  QQQ: '#76b7b2',
  SPY: '#4e79a7',
};

const DEFAULT_COLORS = ['#b07aa1', '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#ff9da7'];

export default function PieChartComponent({ data }) {
  const chartData = data
    .filter(asset => asset.portfolio_percentage > 0)
    .map(asset => ({
      name: asset.ticker,
      value: asset.portfolio_percentage,
    }))
    .sort((a, b) => b.value - a.value);

  const isEmpty = chartData.length === 0;
  const dataToRender = isEmpty ? [{ name: 'Sin datos', value: 100 }] : chartData;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <defs>
          <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <Pie
          data={dataToRender}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
          filter="url(#pieGlow)"
        >
          {dataToRender.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={isEmpty ? 'rgba(255,255,255,0.05)' : (TICKER_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length])} />
          ))}
        </Pie>
        {!isEmpty && (
          <Tooltip
            formatter={(value) => `${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fafafa' }}
            itemStyle={{ color: '#fafafa' }}
          />
        )}
        {!isEmpty && (
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
        )}
        {isEmpty && (
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize="14px">
            Sin datos
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
