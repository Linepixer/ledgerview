import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, Plus, X } from 'lucide-react';
import api from '../api';
import TransactionForm from './TransactionForm';
import TransactionsList from './TransactionsList';
import PieChartComponent from './PieChartComponent';
import PortfolioChart from './PortfolioChart';
import AssetDetailView from './AssetDetailView';
import PortfolioAssetDetailView from './PortfolioAssetDetailView';
import CategoryProgressBars from './CategoryProgressBars';

const formatCurrency = (value, currency) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(value);
};

const formatCrypto = (value) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  }).format(value);
};

export default function Dashboard({ currency }) {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState(null);
  const [history, setHistory] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [error, setError] = useState('');

  // 'portfolio', 'transactions', 'cotizaciones', 'cotizacion_detalle', 'portfolio_asset_detalle'
  const [activeTab, setActiveTab] = useState('portfolio'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [refreshTransactions, setRefreshTransactions] = useState(0);

  // Sincronización con el historial del navegador
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname;
      let initialTab = 'portfolio';
      let initialAsset = null;
      
      if (path.startsWith('/market')) initialTab = 'cotizaciones';
      else if (path.startsWith('/transactions')) initialTab = 'transactions';
      else if (path.startsWith('/asset/')) {
        initialTab = 'cotizacion_detalle';
        const ticker = path.split('/')[2];
        if (window.history.state?.asset?.ticker === ticker) {
          initialAsset = window.history.state.asset;
        } else {
          initialAsset = { ticker: ticker, name: '' };
        }
      } else if (path.startsWith('/portfolio/possession/')) {
        initialTab = 'portfolio_asset_detalle';
        const ticker = path.split('/')[3];
        if (window.history.state?.asset?.ticker === ticker) {
          initialAsset = window.history.state.asset;
        } else {
          initialAsset = { ticker: ticker, name: '' };
        }
      }

      setActiveTab(initialTab);
      setSelectedAsset(initialAsset);
      
      const p = path === '/' ? '/portfolio' : path;
      window.history.replaceState({ tab: initialTab, asset: initialAsset }, '', p);
    };

    const handlePopState = (event) => {
      if (event.state) {
        setActiveTab(event.state.tab || 'portfolio');
        setSelectedAsset(event.state.asset || null);
      } else {
        checkPath();
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Initialize base state if entering directly via URL
    if (!window.history.state) {
      checkPath();
    }
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tab, asset = null) => {
    if (activeTab === tab && selectedAsset?.ticker === asset?.ticker) return;
    setActiveTab(tab);
    setSelectedAsset(asset);
    
    let path = `/${tab}`;
    if (tab === 'portfolio') path = '/portfolio';
    if (tab === 'cotizaciones') path = '/market';
    if (tab === 'transactions') path = '/transactions';
    if (tab === 'cotizacion_detalle' && asset) path = `/asset/${asset.ticker}`;
    if (tab === 'portfolio_asset_detalle' && asset) path = `/portfolio/possession/${asset.ticker}`;
    
    window.history.pushState({ tab, asset }, '', path);
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resSummary, resHistory, resAssets] = await Promise.all([
        api.get('/portfolio/summary'),
        api.get('/portfolio/history'),
        api.get('/assets')
      ]);
      setPortfolio(resSummary.data);
      setHistory(resHistory.data.history || []);
      setAllAssets(resAssets.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError('Error al cargar los datos. Intenta iniciar sesión nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransactionAdded = () => {
    fetchData();
    setRefreshTransactions(prev => prev + 1);
    setIsModalOpen(false);
    navigateTo('transactions');
  };

  const handleAssetClick = (asset) => {
    navigateTo('cotizacion_detalle', asset);
  };

  if (loading && !portfolio) {
    return <div className="text-muted flex-row" style={{ justifyContent: 'center', marginTop: '100px' }}><RefreshCw className="animate-spin" /> Cargando portafolio...</div>;
  }

  if (error) {
    return <div className="text-loss flex-row" style={{ justifyContent: 'center', marginTop: '100px' }}><AlertTriangle /> {error}</div>;
  }

  const isArs = currency === 'ARS';
  const totalValue = isArs ? portfolio.total_value_ars : portfolio.total_value_usd;

  const totalProfit = portfolio.assets.reduce((acc, asset) => acc + (isArs ? asset.potential_profit_ars : asset.potential_profit_usd), 0);
  const totalAvgCost = portfolio.assets.reduce((acc, asset) => acc + ((isArs ? asset.average_purchase_price_ars : asset.average_purchase_price_usd) * asset.quantity), 0);
  const totalProfitPct = totalAvgCost > 0 ? (totalProfit / totalAvgCost) * 100 : 0;

  // Calculate category distribution
  const getAssetType = (ticker) => {
    const asset = allAssets.find(a => a.ticker === ticker);
    if (asset) {
      if (asset.type === 'Acción') return 'Acciones';
      if (asset.type === 'Criptomoneda' || asset.type === 'Crypto') return 'Criptomonedas';
      if (asset.type === 'ETF') return 'ETFs';
      if (asset.type === 'Fiat' || asset.type === 'Efectivo') return 'Moneda Fiat';
      return asset.type;
    }
    return 'Otros';
  };

  const categoryDistribution = portfolio.assets.reduce((acc, asset) => {
    const type = getAssetType(asset.ticker);
    const value = isArs ? asset.total_value_ars : asset.total_value_usd;
    if (acc[type] === undefined) acc[type] = 0;
    acc[type] += value;
    return acc;
  }, {
    'Criptomonedas': 0,
    'ETFs': 0,
    'Moneda Fiat': 0,
    'Acciones': 0
  });

  const categoryData = Object.keys(categoryDistribution).map(type => ({
    type,
    value: categoryDistribution[type],
    percentage: totalValue > 0 ? (categoryDistribution[type] / totalValue) * 100 : 0
  })).sort((a, b) => b.value - a.value);

  return (
    <div>
      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => navigateTo('portfolio')}
        >
          Portafolio
        </button>
        <button
          className={`tab ${activeTab === 'cotizaciones' || activeTab === 'cotizacion_detalle' ? 'active' : ''}`}
          onClick={() => navigateTo('cotizaciones')}
        >
          Cotizaciones
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => navigateTo('transactions')}
        >
          Transacciones
        </button>
      </div>

      {activeTab === 'portfolio' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <div className="summary-label" style={{ marginBottom: '0.5rem' }}>Patrimonio Total</div>
              <div className="flex-row">
                <h1 className="summary-value">{formatCurrency(totalValue, currency)}</h1>
                <div className={`badge ${totalProfit >= 0 ? 'badge-profit' : 'badge-loss'}`} style={{ marginLeft: '1rem' }}>
                  {totalProfit >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {formatCurrency(Math.abs(totalProfit), currency)} ({totalProfitPct.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%)
                </div>
              </div>
            </div>

          </div>

          <div style={{ marginBottom: '2rem' }}>
            <PortfolioChart data={history} isArs={isArs} />
          </div>

          <div className="summary-cards">
            <div className="card">
              <div className="summary-label">Dólar Bolsa</div>
              <div className="summary-value" style={{ fontSize: '1.5rem' }}>
                {portfolio.exchange_rates.bolsa ? '$' + Math.round(portfolio.exchange_rates.bolsa).toLocaleString('es-AR') : '-'}
              </div>
            </div>
            <div className="card">
              <div className="summary-label">Dólar Cripto</div>
              <div className="summary-value" style={{ fontSize: '1.5rem' }}>
                {portfolio.exchange_rates.cripto ? '$' + Math.round(portfolio.exchange_rates.cripto).toLocaleString('es-AR') : '-'}
              </div>
            </div>
            <div className="card">
              <div className="summary-label">Dólar Blue</div>
              <div className="summary-value" style={{ fontSize: '1.5rem' }}>
                {portfolio.exchange_rates.blue ? '$' + Math.round(portfolio.exchange_rates.blue).toLocaleString('es-AR') : '-'}
              </div>
            </div>
          </div>

          {portfolio.assets.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="text-muted">Aún no tienes activos en tu portafolio. Agrega tu primera transacción.</div>
            </div>
          ) : (
            <>
              {/* Pie Chart & Categories Section */}
              <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Distribución de Activos</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
                    <PieChartComponent data={portfolio.assets} />
                  </div>
                  <div style={{ flex: '1', minWidth: '300px', maxWidth: '500px' }}>
                    <CategoryProgressBars data={categoryData} currency={currency} />
                  </div>
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Activo</th>
                      <th className="text-right">Cantidad</th>
                      <th className="text-right">Precio Actual</th>
                      <th className="text-right">Promedio Compra</th>
                      <th className="text-right">Valor Total</th>
                      <th className="text-right">Ganancia</th>
                      <th className="text-right">% Ganancia</th>
                      <th className="text-right">% Portafolio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...portfolio.assets].sort((a, b) => {
                      const valA = isArs ? a.total_value_ars : a.total_value_usd;
                      const valB = isArs ? b.total_value_ars : b.total_value_usd;
                      return valB - valA;
                    }).map(asset => {
                      const currentPrice = isArs ? asset.current_price_ars : asset.current_price_usd;
                      const avgPrice = isArs ? asset.average_purchase_price_ars : asset.average_purchase_price_usd;
                      const value = isArs ? asset.total_value_ars : asset.total_value_usd;
                      const profit = isArs ? asset.potential_profit_ars : asset.potential_profit_usd;
                      const profitPct = isArs ? asset.profit_percentage_ars : asset.profit_percentage_usd;
                      const isCrypto = ['BTC', 'XRP'].includes(asset.ticker);

                      return (
                        <tr 
                          key={asset.ticker} 
                          onClick={() => navigateTo('portfolio_asset_detalle', asset)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <div className="font-semibold">{asset.ticker}</div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>{asset.name}</div>
                          </td>
                          <td className="text-right font-semibold">
                            {isCrypto ? formatCrypto(asset.quantity) : asset.quantity}
                          </td>
                          <td className="text-right">{formatCurrency(currentPrice, currency)}</td>
                          <td className="text-right text-muted">{formatCurrency(avgPrice, currency)}</td>
                          <td className="text-right font-semibold">{formatCurrency(value, currency)}</td>
                          <td className={`text-right ${profit >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {profit > 0 ? '+' : ''}{formatCurrency(profit, currency)}
                          </td>
                          <td className="text-right">
                            <span className={`badge ${profitPct >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                              {profitPct > 0 ? '+' : ''}{profitPct.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
                            </span>
                          </td>
                          <td className="text-right text-muted">{asset.portfolio_percentage.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'cotizaciones' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Mercado</h2>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Activo</th>
                  <th>Tipo</th>
                  <th className="text-right">Precio de Mercado</th>
                </tr>
              </thead>
              <tbody>
                {allAssets.map(asset => {
                  const currentPrice = isArs ? asset.current_price_ars : asset.current_price_usd;
                  return (
                    <tr 
                      key={asset.ticker} 
                      onClick={() => handleAssetClick(asset)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="font-semibold">{asset.ticker}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{asset.name}</div>
                      </td>
                      <td className="text-muted">
                        {asset.type}
                      </td>
                      <td className="text-right font-semibold">
                        {formatCurrency(currentPrice, currency)}
                      </td>
                    </tr>
                  )
                })}
                {allAssets.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center text-muted" style={{ padding: '2rem' }}>
                      No hay activos soportados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'cotizacion_detalle' && selectedAsset && (
        <AssetDetailView 
          asset={selectedAsset} 
          currency={currency} 
          onBack={() => {
            if (window.history.state && window.history.state.tab === 'cotizacion_detalle') {
              window.history.back();
            } else {
              const prevTab = selectedAsset.total_value_usd !== undefined ? 'portfolio' : 'cotizaciones';
              navigateTo(prevTab);
            }
          }} 
        />
      )}

      {activeTab === 'portfolio_asset_detalle' && selectedAsset && (
        <PortfolioAssetDetailView 
          asset={selectedAsset} 
          currency={currency} 
          onBack={() => {
            if (window.history.state && window.history.state.tab === 'portfolio_asset_detalle') {
              window.history.back();
            } else {
              navigateTo('portfolio');
            }
          }} 
          onGoToMarket={(a) => navigateTo('cotizacion_detalle', a)}
        />
      )}

      {activeTab === 'transactions' && (
        <TransactionsList currency={currency} onTransactionDeleted={fetchData} refreshTrigger={refreshTransactions} />
      )}

      {/* Floating Action Button (solo visible en tabs principales) */}
      {(activeTab !== 'cotizacion_detalle' && activeTab !== 'portfolio_asset_detalle') && (
        <button className="fab" onClick={() => setIsModalOpen(true)}>
          <Plus size={28} />
        </button>
      )}

      {/* Modal for Transaction Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0 }}>Nueva Transacción</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <TransactionForm onTransactionAdded={handleTransactionAdded} exchangeRates={portfolio?.exchange_rates || {}} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
