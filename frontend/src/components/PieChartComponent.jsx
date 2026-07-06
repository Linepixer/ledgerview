import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Professional, highly distinct palette (inspired by Tableau 10, optimized for dark mode)
const TICKER_COLORS = {
  USD: '#59a14f',  // Muted Green
  GLD: '#edc948',  // Muted Gold
  BTC: '#f28e2c',  // Muted Orange
  XRP: '#ff9da7',  // Muted Pink
  USDT: '#e15759', // Muted Red
  QQQ: '#76b7b2',  // Muted Cyan
  SPY: '#4e79a7',  // Muted Blue (default/remaining)
};

const DEFAULT_COLORS = ['#b07aa1', '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#ff9da7'];

export default function PieChartComponent({ data }) {
  // Filter out assets with 0 value
  const chartData = data
    .filter(asset => asset.portfolio_percentage > 0)
    .map(asset => ({
      name: asset.ticker,
      value: asset.portfolio_percentage,
    }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return <div className="text-muted" style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>Sin datos suficientes</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={TICKER_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => `${value.toFixed(2)}%`}
          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fafafa' }}
          itemStyle={{ color: '#fafafa' }}
        />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
