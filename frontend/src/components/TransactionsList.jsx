import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Trash2, X } from 'lucide-react';
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
  }).format(value);
};

const formatCrypto = (value) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  }).format(value);
};

const formatDate = (dateString) => {
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);
}

export default function TransactionsList({ currency, onTransactionDeleted, refreshTrigger }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  if (loading && transactions.length === 0) {
    return <div className="text-muted flex-row" style={{justifyContent: 'center', marginTop: '100px'}}><RefreshCw className="animate-spin" /> Cargando transacciones...</div>;
  }

  if (error) {
    return <div className="text-loss flex-row" style={{justifyContent: 'center', marginTop: '100px'}}><AlertTriangle /> {error}</div>;
  }

  return (
    <>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Activo</th>
              <th>Operación</th>
              <th className="text-right">Cantidad</th>
              <th className="text-right">Precio Unitario</th>
              <th className="text-right">Total Ope.</th>
              <th>Plataforma</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="text-muted">Aún no hay transacciones en tu historial. Utiliza el botón + para agregar una.</div>
                </td>
              </tr>
            ) : (
              transactions.map(tx => {
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
                    <td className="text-muted" style={{fontSize: '0.85rem'}}>{formatDate(tx.timestamp)}</td>
                    <td>
                      <div className="font-semibold">{tx.ticker}</div>
                    </td>
                    <td>
                      <span className={`badge ${isProfit ? 'badge-profit' : 'badge-loss'}`} style={{background: 'transparent', padding: 0}}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="text-right font-semibold">
                      {isCrypto ? formatCrypto(tx.quantity) : tx.quantity}
                    </td>
                    <td className="text-right text-muted">{formatCurrency(price, displayCurrency)}</td>
                    <td className="text-right">{formatCurrency(total, displayCurrency)}</td>
                    <td className="text-muted" style={{fontSize: '0.85rem'}}>{tx.platform || '-'}</td>
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
