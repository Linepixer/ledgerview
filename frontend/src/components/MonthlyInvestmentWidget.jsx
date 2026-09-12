import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, ArrowRight, HelpCircle } from 'lucide-react';
import api from '../api';

export default function MonthlyInvestmentWidget({ currency }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [average, setAverage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currency]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/');
      const transactions = res.data;

      // Agrupar por mes (YYYY-MM)
      const monthlyData = {};

      transactions.forEach(tx => {
        // Ignoramos operaciones que no sean "Compra" (Solo capital inyectado)
        if (tx.type !== 'Compra') return;

        const date = new Date(tx.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });

        let amountInBaseCurrency = Number(tx.total_value) || 0;

        // Convertir a moneda base (currency actual del dashboard)
        if (currency === 'USD' && tx.operated_currency === 'ARS') {
          amountInBaseCurrency = (Number(tx.total_value) || 0) / (Number(tx.exchange_rate) || 1);
        } else if (currency === 'ARS' && tx.operated_currency === 'USD') {
          amountInBaseCurrency = (Number(tx.total_value) || 0) * (Number(tx.exchange_rate) || 1);
        }

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { key: monthKey, label: monthLabel, amount: 0 };
        }
        monthlyData[monthKey].amount += amountInBaseCurrency;
      });

      // Convertir a array y ordenar cronológicamente
      const sortedData = Object.values(monthlyData).sort((a, b) => a.key.localeCompare(b.key));
      setData(sortedData);

      // Calcular promedio
      if (sortedData.length > 0) {
        const total = sortedData.reduce((acc, curr) => acc + curr.amount, 0);
        setAverage(total / sortedData.length);
      } else {
        setAverage(0);
      }

    } catch (err) {
      console.error("Error fetching transactions for widget", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val).replace('US$', 'USD');
  };

  // Últimos 6 meses para la vista resumida (ordenados descendente para la tablita, de más nuevo a más viejo)
  const recentData = [...data].reverse().slice(0, 6);

  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div className="text-muted">Cargando histórico...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return null; // No mostrar nada si no hay inversiones
  }

  // Stats para el modal
  const totalAmount = data.reduce((acc, curr) => acc + curr.amount, 0);
  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  const bestMonth = data.reduce((max, curr) => curr.amount > max.amount ? curr : max, data[0]);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <TrendingUp size={16} color="var(--text-muted)" />
          <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ritmo de Inversión</h3>
          <div className="tooltip-container">
            <HelpCircle size={14} color="var(--text-muted)" style={{ cursor: 'help' }} />
            <div className="tooltip-content" style={{ bottom: '150%', left: '0', transform: 'translateX(-20%)', width: '250px' }}>
              Mide el promedio de capital fresco que inyectás mensualmente a tu portafolio. Es el motor principal de tu riqueza a largo plazo.
            </div>
          </div>
        </div>

        <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Promedio Mensual</div>
          <div className="font-semibold" style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
            {formatCurrency(average)}
          </div>
        </div>

        <div style={{ marginTop: '0.25rem' }}>
          <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Últimos 6 meses</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {recentData.map(item => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={12} className="text-muted" />
                  <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{item.label}</span>
                </div>
                <span className="font-semibold" style={{ fontSize: '0.85rem' }}>{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            marginTop: '0.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-start', 
            gap: '0.5rem',
            padding: '0.5rem 0', 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '0.8rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Ver todo el histórico <ArrowRight size={16} />
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setIsModalOpen(false); }}>
          <div className="modal-content" style={{ maxWidth: '600px', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem' }}>
                <TrendingUp size={24} color="var(--accent)" /> Histórico de Aportes
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Invertido Histórico</div>
                <div className="font-semibold" style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginTop: '0.3rem' }}>{formatCurrency(totalAmount)}</div>
              </div>
              <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mes Récord ({bestMonth.label})</div>
                <div className="font-semibold text-profit" style={{ fontSize: '1.4rem', marginTop: '0.3rem' }}>{formatCurrency(bestMonth.amount)}</div>
              </div>
            </div>
            
            <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[...data].reverse().map(item => (
                <div key={item.key} style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '6px', background: 'var(--bg-hover)' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${(item.amount / maxAmount) * 100}%`, background: 'var(--accent)', opacity: 0.1, borderRadius: '6px', zIndex: 0 }}></div>
                  <span style={{ fontSize: '0.95rem', textTransform: 'capitalize', zIndex: 1 }}>{item.label}</span>
                  <span className="font-semibold" style={{ fontSize: '1.05rem', zIndex: 1 }}>{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
