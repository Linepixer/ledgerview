import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Calendar, TrendingDown, X, Info } from 'lucide-react';
import api from '../api';

export default function CorporateEventsManager() {
  const [events, setEvents] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formAssetId, setFormAssetId] = useState('');
  const [formType, setFormType] = useState('split');
  const [formNewRatio, setFormNewRatio] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const newRatioInputRef = useRef(null);

  useEffect(() => {
    if (formAssetId && newRatioInputRef.current) {
      setTimeout(() => newRatioInputRef.current.focus(), 50);
    }
  }, [formAssetId]);

  const closeForm = () => {
    setShowForm(false);
    setFormAssetId('');
    setFormNewRatio('');
    setFormDate('');
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, assetsRes] = await Promise.all([
        api.get('/corporate-events/'),
        api.get('/assets')
      ]);
      setEvents(eventsRes.data);
      const filteredAssets = assetsRes.data.filter(a => !['BTC', 'XRP', 'USDT', 'USD'].includes(a.ticker));
      setAssets(filteredAssets.sort((a, b) => a.ticker.localeCompare(b.ticker)));
    } catch (err) {
      setError("Error al cargar eventos corporativos.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedAsset = assets.find(a => a.id === formAssetId);
    if (!selectedAsset || !formNewRatio || !formDate) return;

    setFormSubmitting(true);
    try {
      // Append time to date to ensure proper datetime format (beginning of day UTC)
      const timestamp = new Date(`${formDate}T00:00:00Z`).toISOString();
      const oldRatio = selectedAsset.current_ratio || 1.0;
      const calculatedRatio = parseFloat(formNewRatio) / oldRatio;

      const res = await api.post('/corporate-events/', {
        asset_id: formAssetId,
        type: formType,
        ratio: calculatedRatio,
        timestamp: timestamp
      });

      setEvents([res.data, ...events]);
      closeForm();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al crear el evento");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este evento? Esto afectará los cálculos históricos.")) return;

    try {
      await api.delete(`/corporate-events/${id}`);
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || "Error al eliminar");
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingDown size={32} color="var(--accent)" />
          <h1 style={{ margin: 0 }}>Ratios de conversión</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={16} /> Registrar cambio
        </button>
      </div>

      <div className="card" style={{ padding: '0', marginBottom: '0' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Ajusta las cantidades y precios históricos de un activo de forma retroactiva.
          </p>
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={() => !formSubmitting && closeForm()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ margin: 0 }}>Registrar cambio de ratio</h2>
                <button onClick={closeForm} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    <div>
                      <label className="summary-label">Activo afectado <span className="text-loss">*</span></label>
                      <select
                        value={formAssetId}
                        onChange={e => setFormAssetId(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--border)',
                          color: formAssetId === '' ? 'var(--text-muted)' : 'var(--text-main)',
                          borderRadius: '4px',
                          marginTop: '0.5rem'
                        }}
                      >
                        <option value="" disabled hidden>Seleccionar activo...</option>
                        {assets.map(a => (
                          <option key={a.id} value={a.id} style={{ color: 'var(--text-main)' }}>{a.ticker} - {a.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ opacity: formAssetId ? 1 : 0.4, pointerEvents: formAssetId ? 'auto' : 'none', transition: 'all 0.3s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <label className="summary-label" style={{ marginBottom: 0 }}>Ratio de conversión <span className="text-loss">*</span></label>
                        <div className="tooltip-container">
                          <Info size={14} color="var(--text-muted)" style={{ cursor: 'help' }} />
                          <div className="tooltip-content">
                            Ingresá cuántos CEDEARs equivalían a 1 acción real ANTES del split, y cuántos equivalen AHORA. El sistema calculará el factor multiplicador automáticamente.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'var(--bg-main)', padding: '1rem', border: '1px solid var(--border)', borderRadius: '6px' }}>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', background: 'var(--bg-card)', borderRadius: '4px', border: '1px dashed var(--border)' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 'bold' }}>RATIO ACTUAL VIGENTE:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                              {assets.find(a => a.id === formAssetId)?.current_ratio || 1.0}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              CEDEARs = <span style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 'bold' }}>1</span> {assets.find(a => a.id === formAssetId)?.ticker || 'Acción'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="summary-label" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>NUEVO RATIO A APLICAR</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                            <input
                              ref={newRatioInputRef}
                              type="text"
                              inputMode="numeric"
                              value={formNewRatio}
                              onChange={e => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val)) {
                                  setFormNewRatio(val);
                                }
                              }}
                              placeholder="Cantidad"
                              required={!!formAssetId}
                              style={{ width: '120px', padding: '0.8rem', background: 'var(--bg-card)', border: formNewRatio ? '1px solid var(--accent)' : '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '6px', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold', transition: 'border 0.2s', outline: 'none' }}
                            />
                            <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', fontWeight: '500' }}>
                              CEDEARs = <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>1</span> {assets.find(a => a.id === formAssetId)?.ticker || 'Acción'}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>

                    <div style={{ opacity: formAssetId ? 1 : 0.4, pointerEvents: formAssetId ? 'auto' : 'none', transition: 'all 0.3s' }}>
                      <label className="summary-label">Fecha <span className="text-loss">*</span></label>
                      <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                        <input
                          type="date"
                          value={formDate}
                          onChange={e => setFormDate(e.target.value)}
                          required={!!formAssetId}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border)',
                            color: formDate === '' ? 'transparent' : 'var(--text-main)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        />
                        {!formDate && (
                          <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                            Día de entrada en vigencia
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <button type="submit" disabled={formSubmitting || !formAssetId} style={{ width: '100%', padding: '1rem', background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: '4px', cursor: (formSubmitting || !formAssetId) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                      {formSubmitting ? 'Guardando...' : 'Impactar cambio'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Cargando eventos...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'var(--loss)', padding: '20px' }}>{error}</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
            No hay ratios de conversión registrados en la plataforma.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '12px 15px', color: 'var(--text-muted)', fontWeight: 500 }}>Activo</th>
                  <th style={{ padding: '12px 15px', color: 'var(--text-muted)', fontWeight: 500 }}>Tipo</th>
                  <th style={{ padding: '12px 15px', color: 'var(--text-muted)', fontWeight: 500 }}>Multiplicador</th>
                  <th style={{ padding: '12px 15px', color: 'var(--text-muted)', fontWeight: 500 }}>Fecha Efectiva</th>
                  <th style={{ padding: '12px 15px', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{event.asset_ticker}</td>
                    <td style={{ padding: '12px 15px', textTransform: 'capitalize' }}>{event.type}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ color: event.ratio > 1 ? 'var(--profit)' : 'var(--loss)' }}>
                        x{event.ratio}
                      </span>
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        {new Date(event.timestamp).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(event.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--loss)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          marginLeft: 'auto'
                        }}
                        title="Eliminar Evento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
