import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import api from '../api';
import PortfolioChart from './PortfolioChart';

export default function PortfolioAssetDetailView({ asset, currency, onBack, onGoToMarket }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/portfolio/history/${asset.ticker}`);
        setData(res.data.history || []);
      } catch (err) {
        console.error("Error fetching portfolio asset history:", err);
        setError('No se pudo cargar el historial de tu posesión.');
      } finally {
        setLoading(false);
      }
    };
    
    if (asset?.ticker) {
      fetchHistory();
    }
  }, [asset?.ticker]);

  const isArs = currency === 'ARS';

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: isArs ? 0 : 2,
      maximumFractionDigits: isArs ? 0 : 2,
    }).format(value);
  };

  const formatCrypto = (value) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 8,
    }).format(value);
  };

  if (!asset) return null;

  const currentPrice = isArs ? asset.current_price_ars : asset.current_price_usd;
  const avgPrice = isArs ? asset.average_purchase_price_ars : asset.average_purchase_price_usd;
  const value = isArs ? asset.total_value_ars : asset.total_value_usd;
  const profit = isArs ? asset.potential_profit_ars : asset.potential_profit_usd;
  const profitPct = isArs ? asset.profit_percentage_ars : asset.profit_percentage_usd;
  const isCrypto = ['BTC', 'XRP'].includes(asset.ticker);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
              {asset.ticker} <span className="text-muted" style={{ fontSize: '1.25rem', fontWeight: 'normal' }}>{asset.name}</span>
            </h2>
            <div className="summary-label">Valor Total en tu Portafolio ({currency})</div>
            <div className="summary-value" style={{ margin: 0, fontSize: '2.5rem' }}>
              {formatCurrency(value)}
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Cantidad Posesión</div>
                <div className="font-semibold" style={{ fontSize: '1.2rem' }}>
                  {isCrypto ? formatCrypto(asset.quantity) : asset.quantity}
                </div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Precio de Mercado Actual</div>
                <div className="font-semibold" style={{ fontSize: '1.2rem' }}>
                  {formatCurrency(currentPrice)}
                </div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Precio Promedio de Compra</div>
                <div className="font-semibold" style={{ fontSize: '1.2rem' }}>
                  {formatCurrency(avgPrice)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
            <div className="text-right" style={{ minWidth: '200px' }}>
              <div className="summary-label">Ganancia Neta</div>
              <div className={`font-semibold ${profit >= 0 ? 'text-profit' : 'text-loss'}`} style={{ fontSize: '1.5rem', margin: '0.25rem 0' }}>
                {profit > 0 ? '+' : ''}{formatCurrency(profit)}
              </div>
              <div className={`badge ${profit >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                {profit > 0 ? '+' : ''}{profitPct.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
              </div>
            </div>
            
            <button 
              onClick={() => onGoToMarket(asset)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'transparent', color: 'var(--accent)', 
                border: '1px solid var(--accent)', padding: '0.5rem 1rem', 
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Ver cotización del activo <ExternalLink size={16} />
            </button>
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Evolución de tu Inversión</h3>

        {loading ? (
          <div className="text-muted flex-row" style={{ justifyContent: 'center', height: '300px' }}>
            <RefreshCw className="animate-spin" /> Cargando gráfico...
          </div>
        ) : error ? (
          <div className="text-loss flex-row" style={{ justifyContent: 'center', height: '300px' }}>
            <AlertTriangle /> {error}
          </div>
        ) : data.length === 0 ? (
          <div className="text-muted" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
            No hay datos históricos registrados para tu posesión.
          </div>
        ) : (
          <PortfolioChart data={data} isArs={isArs} />
        )}
      </div>
    </div>
  );
}
