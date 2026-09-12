import { useState, useEffect } from 'react';
import { Rocket, Clock, HelpCircle } from 'lucide-react';
import api from '../api';

export default function CompoundInterestWidget({ portfolio, currency }) {
  const [loading, setLoading] = useState(true);
  const [averageInvestment, setAverageInvestment] = useState(0);

  useEffect(() => {
    fetchData();
  }, [currency]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/');
      const transactions = res.data;

      const monthlyData = {};

      transactions.forEach(tx => {
        if (tx.type !== 'Compra') return;
        const date = new Date(tx.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        let amountInBaseCurrency = Number(tx.total_value) || 0;
        if (currency === 'USD' && tx.operated_currency === 'ARS') {
          amountInBaseCurrency = (Number(tx.total_value) || 0) / (Number(tx.exchange_rate) || 1);
        } else if (currency === 'ARS' && tx.operated_currency === 'USD') {
          amountInBaseCurrency = (Number(tx.total_value) || 0) * (Number(tx.exchange_rate) || 1);
        }

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += amountInBaseCurrency;
      });

      const months = Object.keys(monthlyData);
      let avg = 0;
      if (months.length > 0) {
        const total = Object.values(monthlyData).reduce((sum, val) => sum + val, 0);
        avg = total / months.length;
      }
      setAverageInvestment(avg);
    } catch (err) {
      console.error("Error fetching transactions for compound interest widget", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('US$', 'USD');
  };

  if (loading || !portfolio) return null;

  const isArs = currency === 'ARS';
  const currentCapital = isArs ? (portfolio?.total_value_ars || 0) : (portfolio?.total_value_usd || 0);
  let globalXirr = isArs ? (portfolio?.xirr_ars || 0) : (portfolio?.xirr_usd || 0);
  const isEmpty = currentCapital <= 0;
  
  // Asumimos un mínimo rendimiento conservador si el xirr es negativo o no existe, solo para proyectar algo optimista pero realista
  if (globalXirr <= 0) globalXirr = 5; // 5% por defecto para al menos mostrar el concepto
  if (globalXirr > 100) globalXirr = 100; // Cap at 100% just in case of ridiculous peaks

  // Convertir tasa anual nominal a tasa mensual (efectiva)
  const r_monthly = Math.pow(1 + (globalXirr / 100), 1/12) - 1;

  const calculateFutureValue = (months) => {
    const P = currentCapital;
    const PMT = averageInvestment;
    const r = r_monthly;
    const n = months;
    
    // Si r es 0 (ejemplo muy extremo), evitar NaN
    if (r === 0) return P + (PMT * n);

    // FV = P * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
    const fv = P * Math.pow(1 + r, n) + PMT * ((Math.pow(1 + r, n) - 1) / r);
    return fv;
  };

  const milestones = [
    { label: '6 meses', months: 6, value: calculateFutureValue(6) },
    { label: '1 año', months: 12, value: calculateFutureValue(12) },
    { label: '5 años', months: 60, value: calculateFutureValue(60) },
    { label: '20 años', months: 240, value: calculateFutureValue(240) },
  ];

  const tenYearValue = calculateFutureValue(120);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <Rocket size={16} color="var(--text-muted)" />
        <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proyección Futura</h3>
        <div className="tooltip-container">
          <HelpCircle size={14} color="var(--text-muted)" style={{ cursor: 'help' }} />
          <div className="tooltip-content" style={{ bottom: '150%', left: '0', transform: 'translateX(-20%)', width: '250px' }}>
            Calcula matemáticamente cuánto valdrá tu portafolio en el futuro asumiendo que seguís aportando con tu Ritmo de Inversión actual y mantenés tu XIRR histórico.
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Proyección a 10 años</div>
        <div className="font-semibold text-main" style={{ fontSize: '1.4rem' }}>
          {formatCurrency(tenYearValue)}
        </div>
      </div>

      <div style={{ marginTop: '0.25rem' }}>
        {isEmpty ? (
          <div className="text-muted" style={{ fontSize: '0.8rem', textAlign: 'center', padding: '1rem 0' }}>
            Ingresa capital y transacciones para proyectar el crecimiento de tus inversiones a futuro.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {milestones.map((milestone, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={12} className="text-muted" />
                  <span style={{ fontSize: '0.85rem' }}>{milestone.label}</span>
                </div>
                <span className="font-semibold" style={{ fontSize: '0.85rem' }}>{formatCurrency(milestone.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
