import { TrendingUp, TrendingDown } from 'lucide-react';

export default function XirrCard({ portfolio, isArs }) {
  const globalXirr = isArs ? (portfolio.xirr_ars || 0) : (portfolio.xirr_usd || 0);

  // Filter assets that the user currently holds (total_value > 0)
  const assetXirrData = portfolio.assets.map(asset => ({
    ticker: asset.ticker,
    name: asset.name,
    xirr: isArs ? (asset.xirr_ars || 0) : (asset.xirr_usd || 0),
    total_value: isArs ? asset.total_value_ars : asset.total_value_usd
  })).filter(a => a.total_value > 0)
    .sort((a, b) => b.xirr - a.xirr); // Sort highest to lowest

  const maxXirr = Math.max(...assetXirrData.map(a => Math.abs(a.xirr)), 1); // Avoid div by 0

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Rendimiento anualizado</h3>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Tasa efectiva anual calculada
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="summary-value" style={{ margin: 0, fontSize: '2rem', color: globalXirr >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
            {globalXirr >= 0 ? '↗ ' : '↘ '}
            {Math.abs(globalXirr).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Portafolio global</div>
        </div>
      </div>

      {assetXirrData.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span style={{ width: '100px' }}>Activo</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Rendimiento anual</span>
            <span style={{ width: '80px', textAlign: 'right' }}>XIRR %</span>
          </div>

          {assetXirrData.map(asset => {
            const isPositive = asset.xirr >= 0;
            const barWidth = `${(Math.abs(asset.xirr) / maxXirr) * 100}%`;

            return (
              <div key={asset.ticker} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ width: '100px', fontWeight: 600 }}>{asset.ticker}</span>

                {/* Bar Container */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
                  <div style={{ display: 'flex', width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                    {/* Negative side */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', borderRight: '1px solid var(--border)' }}>
                      {!isPositive && (
                        <div style={{ width: barWidth, height: '100%', background: 'var(--loss)', borderRadius: '4px 0 0 4px' }} />
                      )}
                    </div>
                    {/* Positive side */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                      {isPositive && (
                        <div style={{ width: barWidth, height: '100%', background: 'var(--profit)', borderRadius: '0 4px 4px 0' }} />
                      )}
                    </div>
                  </div>
                </div>

                <span style={{ width: '80px', textAlign: 'right', fontWeight: 600, color: isPositive ? 'var(--profit)' : 'var(--loss)' }}>
                  {isPositive ? '+' : ''}{asset.xirr.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-muted" style={{ textAlign: 'center', padding: '1rem' }}>
          No hay suficientes datos para calcular el XIRR por activo.
        </div>
      )}
    </div>
  );
}
