import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, AlertTriangle, Trash2, X, Search, ArrowDown, ArrowUp, ArrowUpDown, Filter } from 'lucide-react';
import api from '../api';

const formatCurrency = (value, currency) => {
  let validCurrency = currency;
  if (currency === 'AR$') validCurrency = 'ARS';
  if (currency === 'US$') validCurrency = 'USD';

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: validCurrency,
    minimumFractionDigits: validCurrency === 'USD' ? 2 : 0,
    maximumFractionDigits: validCurrency === 'USD' ? 2 : 0,
  }).format(value).replace('US$', 'USD');
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

  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 4 }).format(value);
};

const formatDate = (dateString) => {
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);
}

export default function TransactionsList({ currency, onTransactionDeleted, refreshTrigger, headerActions }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filterTicker, setFilterTicker] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterPlatform, setFilterPlatform] = useState('ALL');

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({ start: '', end: '' });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/transactions/');
      setTransactions(res.data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError('Error al cargar transacciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [refreshTrigger]);

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/transactions/${deletingId}`);
      setTransactions(transactions.filter(t => t.id !== deletingId));
      if (onTransactionDeleted) onTransactionDeleted();
    } catch (err) {
      console.error("Error deleting transaction", err);
      alert("Error al borrar la transacción.");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const uniqueTickers = useMemo(() => [...new Set(transactions.map(t => t.ticker))].sort(), [transactions]);
  const uniqueTypes = useMemo(() => [...new Set(transactions.map(t => t.type))].sort(), [transactions]);
  const uniquePlatforms = useMemo(() => [...new Set(transactions.map(t => t.platform).filter(Boolean))].sort(), [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (filterTicker !== 'ALL' && tx.ticker !== filterTicker) return false;
      if (filterType !== 'ALL' && tx.type !== filterType) return false;
      if (filterPlatform !== 'ALL' && (tx.platform || '') !== filterPlatform) return false;

      if (dateRange.start || dateRange.end) {
        const txDate = new Date(tx.timestamp).getTime();

        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          startDate.setHours(0, 0, 0, 0);
          if (txDate < startDate.getTime()) return false;
        }

        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (txDate > endDate.getTime()) return false;
        }
      }
      return true;
    }).sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'timestamp':
          valA = new Date(a.timestamp).getTime();
          valB = new Date(b.timestamp).getTime();
          break;
        case 'ticker':
          valA = a.ticker;
          valB = b.ticker;
          break;
        case 'type':
          valA = a.type;
          valB = b.type;
          break;
        case 'quantity':
          valA = a.quantity;
          valB = b.quantity;
          break;
        case 'price':
          valA = a.price_per_unit;
          valB = b.price_per_unit;
          break;
        case 'total':
          valA = a.total_value;
          valB = b.total_value;
          break;
        default:
          valA = new Date(a.timestamp).getTime();
          valB = new Date(b.timestamp).getTime();
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, filterTicker, filterType, filterPlatform, dateRange, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} style={{ opacity: 0.3, marginLeft: '4px' }} />;
    return sortDirection === 'asc' ? <ArrowUp size={12} style={{ marginLeft: '4px' }} /> : <ArrowDown size={12} style={{ marginLeft: '4px' }} />;
  };

  if (loading && transactions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '1rem', color: 'var(--accent)' }} />
        <div style={{ fontSize: '1.1rem', fontWeight: 500, letterSpacing: '0.5px' }}>Cargando transacciones...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-loss flex-row" style={{ justifyContent: 'center', marginTop: '100px' }}><AlertTriangle /> {error}</div>;
  }

  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[parseInt(month, 10) - 1]}`;
  };

  const formatRange = () => {
    if (dateRange.start && dateRange.end) return `${formatShortDate(dateRange.start)} al ${formatShortDate(dateRange.end)}`;
    if (dateRange.start) return `Desde ${formatShortDate(dateRange.start)}`;
    if (dateRange.end) return `Hasta ${formatShortDate(dateRange.end)}`;
    return '';
  };

  const openDateModal = () => {
    setTempDateRange(dateRange);
    setIsDateModalOpen(true);
  };

  const filterSelectStyle = {
    width: '100%',
    padding: '0.4rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    background: 'var(--bg-main)',
    color: 'var(--text-main)',
    fontSize: '0.85rem'
  };

  const renderDatePopover = () => {
    if (!isDateModalOpen) return null;
    return (
      <>
        {/* Invisible full-screen overlay to close on click outside */}
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
          onClick={() => setIsDateModalOpen(false)}
        />
        {/* The actual popover */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '320px',
            background: 'var(--bg-main)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            zIndex: 100
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Desde</label>
              <input
                type="date"
                value={tempDateRange.start}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                onChange={(e) => setTempDateRange({ ...tempDateRange, start: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.95rem', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Hasta</label>
              <input
                type="date"
                value={tempDateRange.end}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                onChange={(e) => setTempDateRange({ ...tempDateRange, end: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.95rem', cursor: 'pointer' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: '0.6rem', justifyContent: 'center' }}
                onClick={() => { setTempDateRange({ start: '', end: '' }); setDateRange({ start: '', end: '' }); setIsDateModalOpen(false); }}
              >
                Quitar filtro
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, padding: '0.6rem', justifyContent: 'center', backgroundColor: '#e2e8f0', color: '#0f172a' }}
                onClick={() => { setDateRange(tempDateRange); setIsDateModalOpen(false); }}
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const activeFiltersCount = (filterTicker !== 'ALL' ? 1 : 0) +
    (filterType !== 'ALL' ? 1 : 0) +
    (filterPlatform !== 'ALL' ? 1 : 0) +
    ((dateRange.start || dateRange.end) ? 1 : 0);

  return (
    <>
      {/* Top Action Bar (Filters + Buttons) - Mobile */}
      <div className="mobile-only-filters" style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        {headerActions && headerActions[1]}
        <button
          className="btn-secondary"
          style={{ flex: 1, padding: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          onClick={() => setIsMobileFilterOpen(true)}
        >
          <Filter size={18} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeFiltersCount > 0 ? (activeFiltersCount === 1 ? '1 filtro aplicado' : `${activeFiltersCount} filtros aplicados`) : 'Filtrar transacciones'}</span>
        </button>
        {headerActions && headerActions[0]}
      </div>

      {/* Mobile Bottom Sheet for Filters */}
      {isMobileFilterOpen && (
        <div className="mobile-only-filters" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setIsMobileFilterOpen(false)}>
          <div style={{ background: 'var(--bg-main)', width: '100%', padding: '1.5rem', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', boxShadow: '0 -10px 25px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>Filtros</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Desde</label>
                  <input type="date" value={dateRange.start} onClick={(e) => e.target.showPicker && e.target.showPicker()} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} style={{ ...filterSelectStyle, width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hasta</label>
                  <input type="date" value={dateRange.end} onClick={(e) => e.target.showPicker && e.target.showPicker()} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} style={{ ...filterSelectStyle, width: '100%' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Activo</label>
                <select value={filterTicker} onChange={(e) => setFilterTicker(e.target.value)} style={{ ...filterSelectStyle, width: '100%' }}>
                  <option value="ALL">Todos los activos</option>
                  {uniqueTickers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tipo de Operación</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...filterSelectStyle, width: '100%' }}>
                  <option value="ALL">Todos los tipos</option>
                  {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Plataforma</label>
                <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} style={{ ...filterSelectStyle, width: '100%' }}>
                  <option value="ALL">Todas las plataformas</option>
                  {uniquePlatforms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.75rem', justifyContent: 'center' }}
                  onClick={() => { setDateRange({ start: '', end: '' }); setFilterTicker('ALL'); setFilterType('ALL'); setFilterPlatform('ALL'); setIsMobileFilterOpen(false); }}
                >
                  Quitar filtro
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 2, padding: '0.75rem', justifyContent: 'center', backgroundColor: '#e2e8f0', color: '#0f172a' }}
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Equal-Width Filters */}
      <div className="hide-on-mobile" style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: '1rem',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <input readOnly onClick={openDateModal} placeholder="Filtrar por fechas" value={formatRange()} style={{ ...filterSelectStyle, width: '180px', cursor: 'pointer' }} />
            {renderDatePopover()}
          </div>
          <select value={filterTicker} onChange={(e) => setFilterTicker(e.target.value)} style={{ ...filterSelectStyle, width: '180px', cursor: 'pointer' }}>
            <option value="ALL">Todos los activos</option>
            {uniqueTickers.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...filterSelectStyle, width: '180px', cursor: 'pointer' }}>
            <option value="ALL">Todos los tipos</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} style={{ ...filterSelectStyle, width: '180px', cursor: 'pointer' }}>
            <option value="ALL">Todas las plataformas</option>
            {uniquePlatforms.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Export/Import buttons right-aligned */}
        {headerActions && (
          <div style={{ display: 'flex', gap: '10px' }}>
            {headerActions}
          </div>
        )}
      </div>

      {/* Empty space where the modal overlay used to be */}

      <div className="table-container hide-on-mobile">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('timestamp')} style={{ cursor: 'pointer' }}>Fecha <SortIcon field="timestamp" /></th>
              <th onClick={() => handleSort('ticker')} style={{ cursor: 'pointer' }}>Activo <SortIcon field="ticker" /></th>
              <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>Tipo <SortIcon field="type" /></th>
              <th className="text-right" onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>Cantidad <SortIcon field="quantity" /></th>
              <th className="text-right" onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>Precio Unitario <SortIcon field="price" /></th>
              <th className="text-right" onClick={() => handleSort('total')} style={{ cursor: 'pointer' }}>Total Operación <SortIcon field="total" /></th>
              <th>Plataforma</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="text-muted">No se encontraron transacciones.</div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map(tx => {
                const isCrypto = ['Crypto', 'Criptomoneda'].includes(tx.asset_type) || ['BTC', 'XRP', 'USDT'].includes(tx.ticker);
                let total = tx.total_value;
                let price = tx.price_per_unit;
                const opCurrency = tx.operated_currency || 'USD';

                // Convert transaction values to match selected global currency
                if (currency && opCurrency !== currency) {
                  const rate = tx.exchange_rate || 1;
                  if (currency === 'ARS' && opCurrency === 'USD') {
                    price = price * rate;
                    total = total * rate;
                  } else if (currency === 'USD' && opCurrency === 'ARS') {
                    price = price / rate;
                    total = total / rate;
                  }
                }

                const displayCurrency = currency || opCurrency;
                const isProfit = ['compra', 'intereses'].includes(tx.type.toLowerCase());

                return (
                  <tr key={tx.id}>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{formatDate(tx.timestamp)}</td>
                    <td>
                      <div className="font-semibold">{tx.ticker}</div>
                    </td>
                    <td>
                      <span className={`badge ${isProfit ? 'badge-profit' : 'badge-loss'}`} style={{ background: 'transparent', padding: 0 }}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="text-right font-semibold">
                      {formatQuantity(tx.quantity, tx.ticker)}
                    </td>
                    <td className="text-right text-muted">{formatCurrency(price, displayCurrency)}</td>
                    <td className="text-right">{formatCurrency(total, displayCurrency)}</td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{tx.platform || '-'}</td>
                    <td>
                      <button
                        onClick={() => setDeletingId(tx.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--loss)', cursor: 'pointer', padding: '4px' }}
                        title="Borrar transacción"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View for Transacciones */}
      <div className="hide-on-desktop">
        {filteredTransactions.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
            No se encontraron transacciones.
          </div>
        ) : (
          filteredTransactions.map(tx => {
            const isCrypto = ['Crypto', 'Criptomoneda'].includes(tx.asset_type) || ['BTC', 'XRP', 'USDT'].includes(tx.ticker);
            let total = tx.total_value;
            let price = tx.price_per_unit;
            const opCurrency = tx.operated_currency || 'USD';

            // Convert transaction values to match selected global currency
            if (currency && opCurrency !== currency) {
              const rate = tx.exchange_rate || 1;
              if (currency === 'ARS' && opCurrency === 'USD') {
                price = price * rate;
                total = total * rate;
              } else if (currency === 'USD' && opCurrency === 'ARS') {
                price = price / rate;
                total = total / rate;
              }
            }

            const displayCurrency = currency || opCurrency;
            const isProfit = ['compra', 'intereses'].includes(tx.type.toLowerCase());

            return (
              <div
                key={tx.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  marginBottom: '1rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="font-semibold" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{tx.ticker}</span>
                    <span className={`badge ${isProfit ? 'badge-profit' : 'badge-loss'}`} style={{ background: 'transparent', padding: 0 }}>
                      {tx.type}
                    </span>
                  </div>
                  <button
                    onClick={() => setDeletingId(tx.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--loss)', cursor: 'pointer', padding: '4px' }}
                    title="Borrar transacción"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Cantidad</span>
                  <span className="font-semibold">{formatQuantity(tx.quantity, tx.ticker)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Precio unitario</span>
                  <span className="text-muted">{formatCurrency(price, displayCurrency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Total de la operación</span>
                  <span className="font-semibold">{formatCurrency(total, displayCurrency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>{formatDate(tx.timestamp)}</span>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>{tx.platform || '-'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <AlertTriangle size={48} color="var(--loss)" style={{ marginBottom: '1rem' }} />
              <h3>¿Borrar transacción?</h3>
              <p className="text-muted">Esta acción no se puede deshacer y el activo será descontado de tu portafolio.</p>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setDeletingId(null)}
                  style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  style={{ flex: 1, padding: '0.75rem', background: 'var(--loss)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {isDeleting ? 'Borrando...' : 'Sí, borrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
