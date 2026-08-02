import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, Plus, X, Bitcoin, DollarSign, LineChart as LineChartIcon, Coins, Landmark, Upload } from 'lucide-react';
import { AreaChart, Area, YAxis } from 'recharts';
import api from '../api';
import TransactionForm from './TransactionForm';
import TransactionsList from './TransactionsList';
import PieChartComponent from './PieChartComponent';
import PortfolioChart from './PortfolioChart';
import AssetDetailView from './AssetDetailView';
import PortfolioAssetDetailView from './PortfolioAssetDetailView';
import CategoryProgressBars from './CategoryProgressBars';
import ImportTransactions from './ImportTransactions';
import XirrCard from './XirrCard';

const formatCurrency = (value, currency) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(value);
};

const formatQuantity = (value, ticker) => {
  const isFiat = ['USD', 'ARS', 'EUR'].includes(ticker);
  const isCrypto = ['BTC', 'ETH', 'USDT', 'USDC', 'XRP', 'BNB', 'ADA', 'SOL'].includes(ticker);

  if (isFiat) {
    if (value % 1 === 0) {
      return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    }
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  if (isCrypto) {
    const maxDigits = (ticker === 'BTC' || ticker === 'ETH') ? 8 : (value > 1 ? 4 : 8);
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: maxDigits }).format(value);
  }

  // Equities / ETFs
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 4 }).format(value);
};

const Sparkline = ({ data, dataKey }) => {
  if (!data || data.length === 0) return <div style={{ width: 140, height: 40 }} />;
  const first = data[0][dataKey];
  const last = data[data.length - 1][dataKey];
  const color = last >= first ? 'var(--profit)' : 'var(--loss)';
  // Use a unique ID for the gradient based on the color to avoid mixing up multiple sparklines
  const gradientId = `colorSpark_${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  let pctChange = 0;
  if (first > 0) {
    pctChange = ((last - first) / first) * 100;
  }
  const pctText = (pctChange > 0 ? '+' : '') + pctChange.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <AreaChart width={90} height={40} data={data} style={{ filter: `drop-shadow(0px 3px 6px ${color}40)` }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.6} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#${gradientId})`} isAnimationActive={true} animationDuration={1500} />
      </AreaChart>
      <span style={{ color: color, fontWeight: 600, fontSize: '0.85rem', width: '55px', textAlign: 'right' }}>{pctText}</span>
    </div>
  );
};

const CUSTOM_ASSET_NAMES = {
  'USD': 'Dólar',
  'SPY': 'SPDR S&P 500 ETF Trust',
  'QQQ': 'Invesco QQQ Trust',
  'GLD': 'SPDR Gold Trust',
  'BTC': 'Bitcoin',
  'USDT': 'Tether',
  'XRP': 'Ripple'
};

const getAssetIcon = (ticker, type) => {
  const cryptoUrl = {
    'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=032',
    'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=032',
    'XRP': 'https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=032',
    'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=032',
  };

  if (cryptoUrl[ticker]) {
    if (ticker === 'XRP') {
      return (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={cryptoUrl[ticker]} alt={ticker} style={{ width: '16px', height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>
      );
    }
    return <img src={cryptoUrl[ticker]} alt={ticker} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />;
  }

  if (ticker === 'USD' || ticker === 'ARS') {
    const symbol = ticker === 'USD' ? '$' : 'AR$';
    const bg = ticker === 'USD' ? '#16a34a' : '#0284c7';
    return (
      <svg viewBox="0 0 512 512" width="28" height="28">
        <circle cx="256" cy="256" r="256" fill={bg} />
        <text x="50%" y="50%" textAnchor="middle" dy=".35em" fill="#fff" fontSize={ticker === 'USD' ? "260" : "180"} fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif" textRendering="optimizeLegibility">{symbol}</text>
      </svg>
    );
  }

  // Generate dynamic SVG logos for equities
  const colors = {
    'SPY': '#c51f33',
    'QQQ': '#1e3a8a',
    'GLD': '#ca8a04',
  };
  const bgColor = colors[ticker] || '#374151';
  let displayTicker = ticker;
  if (displayTicker.length > 3) displayTicker = displayTicker.substring(0, 3);

  return (
    <svg viewBox="0 0 512 512" width="28" height="28">
      <circle cx="256" cy="256" r="256" fill={bgColor} />
      <text x="50%" y="50%" textAnchor="middle" dy=".35em" fill="#fff" fontSize="165" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif" textTransform="uppercase" textRendering="optimizeLegibility">{displayTicker}</text>
    </svg>
  );
};

const getTypeBadge = (type) => {
  let bg = '#374151';
  let color = '#d1d5db';
  if (type === 'Criptomonedas' || type === 'Criptomoneda') { bg = 'rgba(139, 92, 246, 0.15)'; color = '#a78bfa'; }
  if (type === 'ETFs') { bg = 'rgba(59, 130, 246, 0.15)'; color = '#60a5fa'; }
  if (type === 'Moneda Fiat') { bg = 'rgba(16, 185, 129, 0.15)'; color = '#34d399'; }

  return (
    <span style={{
      background: bg, color: color, padding: '0.25rem 0.6rem',
      borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
      whiteSpace: 'nowrap'
    }}>
      {type}
    </span>
  );
};

export default function Dashboard({ currency }) {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState(null);
  const [history, setHistory] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [assetsHistory, setAssetsHistory] = useState({});
  const [error, setError] = useState('');

  // Valid tabs: 'portfolio', 'transactions', 'cotizaciones', 'cotizacion_detalle', 'portfolio_asset_detalle'
  const [activeTab, setActiveTab] = useState('portfolio');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [refreshTransactions, setRefreshTransactions] = useState(0);

  // Browser history synchronization
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname;
      let initialTab = 'portfolio';
      let initialAsset = null;
      let initialImporting = false;

      if (path.startsWith('/market')) initialTab = 'cotizaciones';
      else if (path.startsWith('/transactions')) {
        initialTab = 'transactions';
        if (path === '/transactions/import') initialImporting = true;
      }
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
      setIsImporting(initialImporting);

      const p = path === '/' ? '/portfolio' : path;
      window.history.replaceState({ tab: initialTab, asset: initialAsset, isImporting: initialImporting }, '', p);
    };

    const handlePopState = (event) => {
      if (event.state) {
        setActiveTab(event.state.tab || 'portfolio');
        setSelectedAsset(event.state.asset || null);
        setIsImporting(event.state.isImporting || false);
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

  const navigateTo = (tab, asset = null, importing = false) => {
    if (activeTab === tab && selectedAsset?.ticker === asset?.ticker && isImporting === importing) return;
    setActiveTab(tab);
    setSelectedAsset(asset);
    setIsImporting(importing);

    let path = `/${tab}`;
    if (tab === 'portfolio') path = '/portfolio';
    if (tab === 'cotizaciones') path = '/market';
    if (tab === 'transactions') {
      path = importing ? '/transactions/import' : '/transactions';
    }
    if (tab === 'cotizacion_detalle' && asset) path = `/asset/${asset.ticker}`;
    if (tab === 'portfolio_asset_detalle' && asset) path = `/portfolio/possession/${asset.ticker}`;

    window.history.pushState({ tab, asset, isImporting: importing }, '', path);
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
      const assets = resAssets.data || [];
      setAllAssets(assets);

      if (assets.length > 0) {
        const histories = await Promise.all(assets.map(a => api.get(`/assets/${a.ticker}/history`).catch(() => null)));
        const historyMap = {};
        histories.forEach((res, idx) => {
          if (res && res.data && res.data.history) {
            historyMap[assets[idx].ticker] = res.data.history.slice(-30);
          }
        });
        setAssetsHistory(historyMap);
      }
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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '1rem', color: 'var(--accent)' }} />
        <div style={{ fontSize: '1.1rem', fontWeight: 500, letterSpacing: '0.5px' }}>Cargando portafolio...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-loss flex-row" style={{ justifyContent: 'center', marginTop: '100px' }}><AlertTriangle /> {error}</div>;
  }

  const isArs = currency === 'ARS';
  const totalValue = isArs ? portfolio.total_value_ars : portfolio.total_value_usd;
  const xirr = isArs ? (portfolio.xirr_ars || 0) : (portfolio.xirr_usd || 0);

  const totalProfit = portfolio.assets.reduce((acc, asset) => acc + (isArs ? asset.potential_profit_ars : asset.potential_profit_usd), 0);
  const totalAvgCost = portfolio.assets.reduce((acc, asset) => acc + ((isArs ? asset.average_purchase_price_ars : asset.average_purchase_price_usd) * asset.quantity), 0);
  const totalProfitPct = totalAvgCost > 0 ? (totalProfit / totalAvgCost) * 100 : 0;

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <div className="summary-label" style={{ marginBottom: '0.5rem' }}>Patrimonio Total</div>
              <div className="flex-row" style={{ flexWrap: 'wrap' }}>
                <h1 className="summary-value">{formatCurrency(totalValue, currency)}</h1>
                <div className={`badge ${totalProfit >= 0 ? 'badge-profit' : 'badge-loss'}`} style={{ fontSize: '1rem', padding: '0.2rem 0.6rem' }}>
                  {totalProfit >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {formatCurrency(Math.abs(totalProfit), currency)} ({totalProfitPct.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)
                </div>
              </div>
            </div>

          </div>

          <div style={{ marginBottom: '1rem' }}>
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
              <div className="card" style={{ marginBottom: '1rem' }}>
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

              <XirrCard portfolio={portfolio} isArs={isArs} />

              <div className="table-container hide-on-mobile">
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
                            <div className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{CUSTOM_ASSET_NAMES[asset.ticker] || asset.name}</div>
                          </td>
                          <td className="text-right font-semibold">
                            {formatQuantity(asset.quantity, asset.ticker)}
                          </td>
                          <td className="text-right">{formatCurrency(currentPrice, currency)}</td>
                          <td className="text-right text-muted">{formatCurrency(avgPrice, currency)}</td>
                          <td className="text-right font-semibold">{formatCurrency(value, currency)}</td>
                          <td className={`text-right ${profit >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {profit > 0 ? '+' : ''}{formatCurrency(profit, currency)}
                          </td>
                          <td className="text-right">
                            <span className={`badge ${profitPct >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                              {profitPct > 0 ? '+' : ''}{profitPct.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </span>
                          </td>
                          <td className="text-right text-muted">{asset.portfolio_percentage.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="hide-on-desktop">
                {[...portfolio.assets].sort((a, b) => {
                  const valA = isArs ? a.total_value_ars : a.total_value_usd;
                  const valB = isArs ? b.total_value_ars : b.total_value_usd;
                  return valB - valA;
                }).map(asset => {
                  const value = isArs ? asset.total_value_ars : asset.total_value_usd;
                  const profit = isArs ? asset.potential_profit_ars : asset.potential_profit_usd;
                  const profitPct = isArs ? asset.profit_percentage_ars : asset.profit_percentage_usd;

                  return (
                    <div 
                      key={asset.ticker} 
                      onClick={() => navigateTo('portfolio_asset_detalle', asset)}
                      style={{ 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '1rem',
                        marginBottom: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="font-semibold" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{asset.ticker}</span>
                          <span className="text-muted" style={{ fontSize: '0.85rem', maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{CUSTOM_ASSET_NAMES[asset.ticker] || asset.name}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span className="font-semibold" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{formatCurrency(value, currency)}</span>
                          <span className={`badge ${profitPct >= 0 ? 'badge-profit' : 'badge-loss'}`} style={{ marginTop: '0.3rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                            {profitPct > 0 ? '+' : ''}{profitPct.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cantidad</span>
                          <span className="font-semibold" style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{formatQuantity(asset.quantity, asset.ticker)}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ganancia</span>
                          <span className={`font-semibold ${profit >= 0 ? 'text-profit' : 'text-loss'}`} style={{ fontSize: '0.95rem' }}>
                            {profit > 0 ? '+' : ''}{formatCurrency(profit, currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
          <div className="table-container hide-on-mobile">
            <table>
              <thead>
                <tr>
                  <th>Activo</th>
                  <th>Tipo</th>
                  <th>Variación mensual</th>
                  <th className="text-right">Precio de Mercado</th>
                </tr>
              </thead>
              <tbody>
                {[...allAssets].sort((a, b) => {
                  const TYPE_ORDER = { 'Moneda Fiat': 1, 'ETFs': 2, 'Acciones': 3, 'Criptomonedas': 4 };
                  const orderA = TYPE_ORDER[getAssetType(a.ticker)] || 99;
                  const orderB = TYPE_ORDER[getAssetType(b.ticker)] || 99;
                  if (orderA !== orderB) return orderA - orderB;
                  return a.ticker.localeCompare(b.ticker);
                }).map(asset => {
                  const currentPrice = isArs ? asset.current_price_ars : asset.current_price_usd;
                  return (
                    <tr
                      key={asset.ticker}
                      onClick={() => handleAssetClick(asset)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-hover)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            {getAssetIcon(asset.ticker, getAssetType(asset.ticker))}
                          </div>
                          <div>
                            <div className="font-semibold">{asset.ticker}</div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>{CUSTOM_ASSET_NAMES[asset.ticker] || asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {getTypeBadge(getAssetType(asset.ticker))}
                      </td>
                      <td style={{ width: '180px' }}>
                        <Sparkline data={assetsHistory[asset.ticker]} dataKey={isArs ? 'price_ars' : 'price_usd'} />
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

          {/* Mobile Cards View for Cotizaciones */}
          <div className="hide-on-desktop">
            {[...allAssets].sort((a, b) => {
              const TYPE_ORDER = { 'Moneda Fiat': 1, 'ETFs': 2, 'Acciones': 3, 'Criptomonedas': 4 };
              const orderA = TYPE_ORDER[getAssetType(a.ticker)] || 99;
              const orderB = TYPE_ORDER[getAssetType(b.ticker)] || 99;
              if (orderA !== orderB) return orderA - orderB;
              return a.ticker.localeCompare(b.ticker);
            }).map(asset => {
              const currentPrice = isArs ? asset.current_price_ars : asset.current_price_usd;
              return (
                <div 
                  key={asset.ticker} 
                  onClick={() => handleAssetClick(asset)}
                  style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '1rem',
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-hover)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {getAssetIcon(asset.ticker, getAssetType(asset.ticker))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="font-semibold" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{asset.ticker}</span>
                        <span className="text-muted" style={{ fontSize: '0.85rem', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{CUSTOM_ASSET_NAMES[asset.ticker] || asset.name}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                      <span className="font-semibold" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{formatCurrency(currentPrice, currency)}</span>
                      {getTypeBadge(getAssetType(asset.ticker))}
                    </div>
                  </div>

                  <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', height: '60px' }}>
                     <Sparkline data={assetsHistory[asset.ticker]} dataKey={isArs ? 'price_ars' : 'price_usd'} />
                  </div>
                </div>
              )
            })}
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
        isImporting ? (
          <ImportTransactions
            onCancel={() => navigateTo('transactions', null, false)}
            onImportSuccess={(count) => {
              navigateTo('transactions', null, false);
            }}
            onDataChanged={() => {
              fetchData();
              setRefreshTransactions(prev => prev + 1);
            }}
            assets={allAssets}
          />
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn-secondary" onClick={() => navigateTo('transactions', null, true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} /> Importar CSV
              </button>
            </div>
            <TransactionsList currency={currency} onTransactionDeleted={fetchData} refreshTrigger={refreshTransactions} />
          </>
        )
      )}

      {(activeTab !== 'cotizacion_detalle' && activeTab !== 'portfolio_asset_detalle' && !isImporting) && (
        <button className="fab" onClick={() => setIsModalOpen(true)}>
          <Plus size={24} />
        </button>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0 }}>Nueva transacción</h2>
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
