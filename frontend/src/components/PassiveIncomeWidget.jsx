import { useState, useEffect } from 'react';
import { DollarSign, Calendar, HelpCircle } from 'lucide-react';
import api from '../api';

export default function PassiveIncomeWidget({ currency }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [totalHistorical, setTotalHistorical] = useState(0);

  useEffect(() => {
    fetchData();
  }, [currency]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/');
      const transactions = res.data;

      // Filtrar y preparar transacciones individuales
      const interestTxs = [];
      let total = 0;

      transactions.forEach(tx => {
        // Ignoramos operaciones que no sean "Intereses"
        if (tx.type !== 'Intereses') return;

        // Lógica inteligente para capturar el valor real de los intereses
        // A veces el usuario carga 0 en cantidad y pone el interés en precio unitario, lo que deja el valor total en 0.
        let rawTxValue = Number(tx.total_value) || 0;
        if (rawTxValue === 0 && Number(tx.quantity) === 0 && Number(tx.price_per_unit) > 0) {
          rawTxValue = Number(tx.price_per_unit);
        }

        let amountInBaseCurrency = rawTxValue;

        // Convertir a moneda base (currency actual del dashboard)
        if (currency === 'USD' && tx.operated_currency === 'ARS') {
          amountInBaseCurrency = rawTxValue / (Number(tx.exchange_rate) || 1);
        } else if (currency === 'ARS' && tx.operated_currency === 'USD') {
          amountInBaseCurrency = rawTxValue * (Number(tx.exchange_rate) || 1);
        }

        interestTxs.push({
          id: tx.id,
          date: new Date(tx.timestamp),
          ticker: tx.ticker || 'Activo',
          amount: amountInBaseCurrency
        });
        total += amountInBaseCurrency;
      });

      // Ordenar cronológicamente (más recientes primero)
      interestTxs.sort((a, b) => b.date - a.date);
      
      setData(interestTxs);
      setTotalHistorical(total);

    } catch (err) {
      console.error("Error fetching transactions for passive income widget", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(value).replace('US$', 'USD');
  };

  if (loading) {
    return null;
  }

  if (data.length === 0) {
    return null; // No mostrar nada si no hay intereses
  }

  // Tomamos las últimas 6 transacciones
  const recentData = data.slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <DollarSign size={16} color="var(--text-muted)" />
        <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Intereses Generados</h3>
        <div className="tooltip-container">
          <HelpCircle size={14} color="var(--text-muted)" style={{ cursor: 'help' }} />
          <div className="tooltip-content" style={{ bottom: '150%', left: '0', transform: 'translateX(-20%)', width: '250px' }}>
            Dinero que tu dinero generó por sí solo. Muestra los dividendos o intereses cobrados históricamente.
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Histórico</div>
        <div className="font-semibold text-profit" style={{ fontSize: '1.25rem' }}>
          +{formatCurrency(totalHistorical)}
        </div>
      </div>

      <div style={{ marginTop: '0.25rem' }}>
        <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Últimos registros</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {recentData.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={12} className="text-muted" />
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 500 }}>{item.ticker}</span>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {item.date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <span className="font-semibold text-profit" style={{ fontSize: '0.85rem' }}>+{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
