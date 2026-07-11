import { useState, useEffect } from 'react';
import api from '../api';

export default function TransactionForm({ onTransactionAdded, exchangeRates }) {
  const [timestamp, setTimestamp] = useState('');
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState('Compra');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [operatedCurrency, setOperatedCurrency] = useState('ARS');
  const [exchangeRate, setExchangeRate] = useState('');
  const [platform, setPlatform] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setTimestamp(now.toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    if (!exchangeRates || !ticker) {
      setExchangeRate('');
      return;
    }
    let rate = '';
    if (['BTC', 'XRP', 'USDT'].includes(ticker)) rate = exchangeRates.cripto;
    else if (['SPY', 'QQQ', 'GLD'].includes(ticker)) rate = exchangeRates.bolsa;
    else rate = exchangeRates.blue;
    
    if (rate) setExchangeRate(rate);
  }, [ticker, exchangeRates]);

  const TICKERS = ['USD', 'SPY', 'QQQ', 'GLD', 'BTC', 'XRP', 'USDT'];
  const OPERATIONS = ['Compra', 'Intereses', 'Venta', 'Comisión'];

  const getExchangeRateLabel = () => {
    if (!ticker) return 'Cotización del Dólar';
    if (['BTC', 'XRP', 'USDT'].includes(ticker)) return 'Cotización del Dólar Cripto';
    if (['SPY', 'QQQ', 'GLD'].includes(ticker)) return 'Cotización del Dólar Bolsa';
    return 'Cotización del Dólar Blue';
  };

  const getAssetType = (t) => {
    if (['BTC', 'XRP', 'USDT'].includes(t)) return 'Crypto';
    if (['USD'].includes(t)) return 'Fiat';
    return 'Stock';
  };

  // Automatically compute missing values (Quantity, Unit Price, or Total)
  const handleQuantityChange = (e) => {
    let val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
    if ((val.match(/\./g) || []).length > 1) return;
    setQuantity(val);

    const q = parseFloat(val);
    const u = parseFloat(unitPrice);
    const t = parseFloat(totalValue);
    
    if (!isNaN(q) && unitPrice !== '') {
      if (!isNaN(u)) setTotalValue((q * u).toFixed(8).replace(/\.?0+$/, ''));
    } else if (!isNaN(q) && totalValue !== '') {
      if (!isNaN(t) && q !== 0) setUnitPrice((t / q).toFixed(8).replace(/\.?0+$/, ''));
    }
  };

  const handleUnitPriceChange = (e) => {
    let val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
    if ((val.match(/\./g) || []).length > 1) return;
    setUnitPrice(val);
    
    const u = parseFloat(val);
    const q = parseFloat(quantity);
    if (!isNaN(u) && quantity !== '') {
      if (!isNaN(q)) setTotalValue((q * u).toFixed(8).replace(/\.?0+$/, ''));
    }
  };

  const handleTotalValueChange = (e) => {
    let val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
    if ((val.match(/\./g) || []).length > 1) return;
    setTotalValue(val);
    
    const t = parseFloat(val);
    const q = parseFloat(quantity);
    if (!isNaN(t) && quantity !== '') {
      if (!isNaN(q) && q !== 0) setUnitPrice((t / q).toFixed(8).replace(/\.?0+$/, ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let isoTimestamp = null;
    if (timestamp) {
      isoTimestamp = new Date(timestamp).toISOString();
    }

    try {
      await api.post('/transactions/', {
        timestamp: isoTimestamp,
        ticker,
        asset_type: getAssetType(ticker),
        type,
        quantity: parseFloat(quantity),
        price_per_unit: parseFloat(unitPrice),
        total_value: parseFloat(totalValue),
        operated_currency: operatedCurrency,
        exchange_rate: exchangeRate ? parseFloat(exchangeRate) : null,
        platform: platform || null,
        notes: notes || null
      });
      onTransactionAdded();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar la transacción');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '0.75rem', 
    background: 'var(--bg-main)', 
    border: '1px solid var(--border)', 
    color: 'var(--text-main)', 
    borderRadius: '4px',
    width: '100%',
    marginTop: '0.5rem'
  };

  const selectTickerStyle = {
    ...inputStyle,
    color: ticker === '' ? 'var(--text-muted)' : 'var(--text-main)'
  };

  return (
    <div>
      {error && <div className="badge badge-loss" style={{ marginBottom: '1rem', display: 'block', padding: '0.5rem' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="summary-label">Fecha y Hora <span className="text-loss">*</span></label>
          <input 
            type="datetime-local" 
            value={timestamp} 
            onChange={e => setTimestamp(e.target.value)} 
            style={inputStyle} 
            required 
          />
        </div>

        <div>
          <label className="summary-label">Activo <span className="text-loss">*</span></label>
          <select value={ticker} onChange={e => setTicker(e.target.value)} style={selectTickerStyle} required>
            <option value="" disabled hidden>Ticker de la transacción</option>
            {TICKERS.map(t => <option key={t} value={t} style={{color: 'var(--text-main)'}}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="summary-label">Tipo de Operación <span className="text-loss">*</span></label>
          <select value={type} onChange={e => setType(e.target.value)} style={inputStyle} required>
            {OPERATIONS.map(op => <option key={op} value={op}>{op}</option>)}
          </select>
        </div>

        <div>
          <label className="summary-label">Cantidad <span className="text-loss">*</span></label>
          <input 
            type="text" 
            value={quantity} 
            onChange={handleQuantityChange}
            style={inputStyle} 
            required 
            placeholder="Unidades operadas"
          />
        </div>

        <div>
          <label className="summary-label">Precio Unitario <span className="text-loss">*</span></label>
          <input 
            type="text" 
            value={unitPrice} 
            onChange={handleUnitPriceChange}
            style={inputStyle} 
            required 
            placeholder="Monto operado por unidad"
          />
        </div>

        <div>
          <label className="summary-label">Valor Total <span className="text-loss">*</span></label>
          <input 
            type="text" 
            value={totalValue} 
            onChange={handleTotalValueChange}
            style={inputStyle} 
            required 
            placeholder="Monto total operado"
          />
        </div>

        <div>
          <label className="summary-label">Moneda Operada <span className="text-loss">*</span></label>
          <select 
            value={operatedCurrency} 
            onChange={e => setOperatedCurrency(e.target.value)} 
            style={inputStyle} 
            required
          >
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="summary-label">{getExchangeRateLabel()} <span className="text-loss">*</span></label>
          <input 
            type="number" 
            step="any" 
            value={exchangeRate} 
            onChange={e => setExchangeRate(e.target.value)} 
            style={inputStyle} 
            required 
            placeholder="Precio del dólar al momento de la operación"
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="summary-label">Plataforma <span className="text-loss">*</span></label>
          <input 
            type="text" 
            value={platform} 
            onChange={e => setPlatform(e.target.value)} 
            style={inputStyle} 
            placeholder="Broker, exchange o entidad en donde se realizó la transacción" 
            required
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label className="summary-label">Notas</label>
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            style={{...inputStyle, resize: 'vertical', minHeight: '60px'}} 
            placeholder="Comentarios o información útil relacionada a la transacción"
          />
        </div>

        <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Guardando...' : 'Guardar Transacción'}
          </button>
        </div>
      </form>
    </div>
  );
}
