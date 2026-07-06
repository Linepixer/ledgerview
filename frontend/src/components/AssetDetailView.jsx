import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

export default function AssetDetailView({ asset, currency, onBack }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/assets/${asset.ticker}/history`);
        setData(res.data.history || []);
      } catch (err) {
        console.error("Error fetching asset history:", err);
        setError('No se pudo cargar el historial de precios.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [asset.ticker]);

  const isArs = currency === 'ARS';
  const dataKey = isArs ? 'price_ars' : 'price_usd';
  
  // Formatters
  const formatCurrency = (value) => {
    return new Intl.NumberFormat(isArs ? 'es-AR' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: isArs ? 0 : 2,
      maximumFractionDigits: isArs ? 0 : 2,
    }).format(value);
  };

  let color = 'var(--accent)';
  if (data.length > 1) {
    const firstValue = data[0][dataKey];
    const lastValue = data[data.length - 1][dataKey];
    color = lastValue >= firstValue ? 'var(--profit)' : 'var(--loss)';
  }

  // Determine current price (use from portfolio if available, else from asset endpoint)
  const currentPrice = isArs 
    ? (asset.current_price_ars !== undefined ? asset.current_price_ars : 0)
    : (asset.current_price_usd !== undefined ? asset.current_price_usd : 0);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button 
          onClick={onBack} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            background: 'transparent', border: 'none', 
            color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          <ArrowLeft size={20} /> Volver
        </button>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
              {asset.ticker} <span className="text-muted" style={{ fontSize: '1.25rem', fontWeight: 'normal' }}>{asset.name}</span>
            </h2>
            <div className="summary-label">Precio Actual ({currency})</div>
            <div className="summary-value" style={{ margin: 0, fontSize: '2.5rem' }}>
              {formatCurrency(currentPrice)}
            </div>
          </div>

          {/* Show portfolio specific info ONLY if it's passed (meaning we came from Portfolio) */}
          {asset.total_value_usd !== undefined && (
            <div className="text-right" style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div className="summary-label">Tu Posición ({currency})</div>
              <div className="font-semibold" style={{ fontSize: '1.5rem', margin: '0.25rem 0' }}>
                {formatCurrency(isArs ? asset.total_value_ars : asset.total_value_usd)}
              </div>
              <div className={`badge ${asset.potential_profit_ars >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                {asset.potential_profit_ars >= 0 ? '+' : ''}
                {(isArs ? asset.profit_percentage_ars : asset.profit_percentage_usd).toFixed(2)}%
              </div>
            </div>
          )}
        </div>

        <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Historial de Precios</h3>

        {loading ? (
          <div className="text-muted flex-row" style={{ justifyContent: 'center', height: '400px' }}>
            <RefreshCw className="animate-spin" /> Cargando gráfico...
          </div>
        ) : error ? (
          <div className="text-loss flex-row" style={{ justifyContent: 'center', height: '400px' }}>
            <AlertTriangle /> {error}
          </div>
        ) : data.length === 0 ? (
          <div className="text-muted" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
            No hay datos históricos registrados para este activo.
          </div>
        ) : (
          <div style={{ width: '100%', height: 450 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
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
                  minTickGap={40}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  width={80}
                  domain={['auto', 'auto']}
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
                  formatter={(value) => [formatCurrency(value), 'Precio']}
                  labelStyle={{ color: 'var(--text-muted)', marginBottom: '5px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke={color} 
                  fillOpacity={1} 
                  fill="url(#colorAsset)" 
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: color, stroke: 'var(--bg-main)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
