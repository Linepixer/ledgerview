import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import api from '../api';

const formatDate = (dateString) => {
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);
};

export default function ImportTransactions({ onImportSuccess, onCancel, onDataChanged, assets = [] }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(null);
  const fileInputRef = useRef(null);

  const EXPECTED_HEADERS = [
    "Fecha",
    "Activo",
    "Tipo",
    "Cantidad",
    "Precio unitario",
    "Divisa operada",
    "Plataforma"
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Por favor, selecciona un archivo CSV válido.');
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'text/csv' && !droppedFile.name.endsWith('.csv')) {
        setError('Por favor, selecciona un archivo CSV válido.');
        return;
      }
      setFile(droppedFile);
      parseCSV(droppedFile);
    }
  };

  const parseCSV = (file) => {
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

      if (lines.length < 2) {
        setError('El archivo está vacío o no contiene datos suficientes.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());

      const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setError(`Formato inválido. Faltan las siguientes columnas: ${missingHeaders.join(', ')}. Asegúrate de usar la plantilla.`);
        return;
      }

      const parsedData = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');

        if (values.length < EXPECTED_HEADERS.length) continue;

        const getValue = (headerName) => {
          const idx = headers.indexOf(headerName);
          return idx !== -1 ? values[idx].trim() : '';
        };

        const fechaRaw = getValue("Fecha");
        const qtyRaw = parseFloat(getValue("Cantidad"));
        const priceRaw = parseFloat(getValue("Precio unitario"));

        if (!fechaRaw) {
          setError(`Falta la fecha en la fila ${i + 1}.`);
          return;
        }
        if (isNaN(qtyRaw) || isNaN(priceRaw) || qtyRaw < 0 || priceRaw < 0) {
          setError(`Cantidad o precio inválido en la fila ${i + 1}. Deben ser valores numéricos positivos.`);
          return;
        }

        if (qtyRaw === 0 && priceRaw === 0) {
          setError(`La cantidad y el precio no pueden ser 0 en la fila ${i + 1}.`);
          return;
        }

        if (qtyRaw * priceRaw > 999999999999999) {
          setError(`El valor total operado en la fila ${i + 1} excede el máximo permitido por el sistema.`);
          return;
        }

        const tickerRaw = getValue("Activo").toUpperCase();

        const tipoRaw = getValue("Tipo").trim().toLowerCase();
        if (!tickerRaw || !tipoRaw || !getValue("Divisa operada")) {
          setError(`Faltan campos obligatorios (Activo, Tipo o Divisa) en la fila ${i + 1}.`);
          return;
        }

        const typeNormalized = tipoRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let finalType = "";
        if (typeNormalized === "compra") {
          finalType = "Compra";
        } else if (typeNormalized === "venta") {
          finalType = "Venta";
        } else if (typeNormalized === "intereses" || typeNormalized === "interes") {
          finalType = "Intereses";
        } else if (typeNormalized === "comision") {
          finalType = "Comisión";
        } else {
          setError(`Tipo de operación inválido en la fila ${i + 1} ("${getValue("Tipo")}"). Debe ser Compra, Venta, Intereses o Comisión.`);
          return;
        }

        const supportedTickers = assets.map(a => a.ticker.toUpperCase());
        if (supportedTickers.length > 0 && !supportedTickers.includes(tickerRaw)) {
          setError(`El activo "${tickerRaw}" en la fila ${i + 1} no es un activo soportado. Activos registrados: ${supportedTickers.join(', ')}`);
          return;
        }

        let timestamp = null;
        const [datePart, timePart] = fechaRaw.trim().split(' ');

        if (!datePart || !datePart.includes('/')) {
          setError(`Formato de fecha inválido en la fila ${i + 1} ("${fechaRaw}"). Usa DD/MM/YYYY HH:MM`);
          return;
        }

        const [day, month, year] = datePart.split('/');
        if (!day || !month || !year || year.length !== 4) {
          setError(`Formato de fecha inválido en la fila ${i + 1} ("${fechaRaw}"). Usa DD/MM/YYYY HH:MM`);
          return;
        }

        const dateObj = new Date(`${year}-${month}-${day}T${timePart || '12:00'}:00Z`);
        if (isNaN(dateObj.getTime())) {
          setError(`Fecha u hora inválida en la fila ${i + 1} ("${fechaRaw}"). Verifica que los valores sean correctos.`);
          return;
        }

        timestamp = dateObj.toISOString();

        parsedData.push({
          timestamp: timestamp,
          ticker: tickerRaw,
          type: finalType,
          quantity: qtyRaw,
          price_per_unit: priceRaw,
          total_value: qtyRaw * priceRaw,
          operated_currency: getValue("Divisa operada"),
          exchange_rate: null, // Will be resolved by the backend
          platform: getValue("Plataforma") || null,
          notes: null,
          asset_type: "Stock"
        });
      }

      if (parsedData.length === 0) {
        setError("No se encontraron transacciones válidas en el archivo.");
      } else {
        parsedData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setPreviewData(parsedData);
      }
    };

    reader.onerror = () => {
      setError('Hubo un error al leer el archivo.');
    };

    reader.readAsText(file);
  };

  const submitImport = async () => {
    setLoading(true);
    try {
      const response = await api.post('/transactions/bulk', previewData);
      setImportedCount(previewData.length);
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error("Error bulk importing:", err);
      setError(err.response?.data?.detail || "Error al importar transacciones. Verifica el formato.");
      setLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (importedCount !== null) {
    return (
      <div className="card" style={{ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '400px' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={48} color="var(--profit)" />
        </div>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem', fontWeight: 600 }}>¡Importación exitosa!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          Se importaron correctamente {importedCount} transacciones a tu portafolio.
        </p>
        <button
          className="btn-primary"
          onClick={() => onImportSuccess(importedCount)}
          style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}
        >
          Volver a transacciones
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Upload size={24} color="var(--accent)" />
          Importar transacciones
        </h2>
        <button
          onClick={onCancel}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>
      </div>

      {!file ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Instructions */}
          <div style={{ background: 'var(--bg-main)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ marginTop: 0, fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Especificaciones de formato
                </h3>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem', maxWidth: '800px', lineHeight: 1.5 }}>
                  El archivo a importar debe ser un CSV válido. La primera fila debe contener las cabeceras exactas de las columnas.
                </p>
              </div>
              <a
                href="/transactions_example.csv"
                download="transactions_example.csv"
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                <FileSpreadsheet size={18} />
                Descargar plantilla
              </a>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', overflowX: 'auto', marginBottom: '1rem' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Columna</th>
                    <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Descripción</th>
                    <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Formato</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "Fecha",
                      desc: "Fecha y hora a la que se realizó la transacción.",
                      format: "Formato requerido: DD/MM/YYYY HH:MM",
                      badges: ["01/07/2026 14:30"]
                    },
                    {
                      name: "Activo",
                      desc: "Ticker del instrumento financiero.",
                      format: "Tickers actualmente registrados en el sistema:",
                      badges: assets.length > 0 ? assets.map(a => a.ticker) : ["SPY", "BTC", "USD"]
                    },
                    {
                      name: "Tipo",
                      desc: "Tipo de operación realizada.",
                      format: "Tipos de operación aceptados:",
                      badges: ["Compra", "Venta", "Intereses", "Comisión"]
                    },
                    {
                      name: "Cantidad",
                      desc: "Cantidad de unidades operadas.",
                      format: "Solo números. Utilizar punto (.) como separador decimal.",
                      badges: ["10", "0.05", "150.5"]
                    },
                    {
                      name: "Precio unitario",
                      desc: "Precio por unidad del activo.",
                      format: "Solo números. Utilizar punto (.) como separador decimal.",
                      badges: ["62000.50", "4500"]
                    },
                    {
                      name: "Divisa operada",
                      desc: "Moneda en la que se realizó la operación.",
                      format: "Divisas disponibles:",
                      badges: ["USD", "ARS"]
                    },
                    {
                      name: "Plataforma",
                      desc: "Entidad financiera, broker o exchange.",
                      format: "Texto libre para identificar la plataforma.",
                      badges: ["Binance", "BullMarket", "Balanz"]
                    }
                  ].map((doc, idx, arr) => (
                    <tr key={idx} style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid var(--border)' }}>
                      <td data-label="Columna" style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{doc.name}</td>
                      <td data-label="Descripción" style={{ padding: '16px 20px' }}>
                        <div style={{ marginBottom: '4px' }}>{doc.desc}</div>
                      </td>
                      <td data-label="Formato" style={{ padding: '16px 20px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}><em>{doc.format}</em></div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {doc.badges.map((b, i) => (
                            <span key={i} style={{
                              background: 'rgba(255,255,255,0.08)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              color: 'var(--text-main)',
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '10px' }}>i</div>
              <span>La cotización histórica del dólar se asignará de forma automática según la fecha de cada operación.</span>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: '8px',
              padding: '4rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              background: 'rgba(0,0,0,0.2)'
            }}
            onClick={() => fileInputRef.current.click()}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <Upload size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Arrastra tu archivo CSV aquí</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>O haz clic para seleccionar un archivo</p>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>

        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="responsive-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet color="var(--accent)" />
              <span className="font-semibold">{file.name}</span>
              <span className="badge" style={{ marginLeft: '10px' }}>{previewData.length} operaciones identificadas</span>
            </div>
            <button className="btn-secondary" onClick={resetState}>Cambiar archivo</button>
          </div>

          {error && (
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--loss)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {!error && previewData.length > 0 && (
            <>
              <h3 style={{ marginBottom: '0.5rem' }}>Vista previa</h3>
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Fecha y hora</th>
                      <th>Activo</th>
                      <th>Tipo</th>
                      <th className="text-right">Cantidad</th>
                      <th className="text-right">Precio Un.</th>
                      <th>Moneda</th>
                      <th>Plataforma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx}>
                        <td data-label="Fecha y hora" className="text-muted">{formatDate(row.timestamp)}</td>
                        <td data-label="Activo" className="font-semibold">{row.ticker}</td>
                        <td data-label="Tipo">{row.type}</td>
                        <td data-label="Cantidad" className="text-right">{row.quantity}</td>
                        <td data-label="Precio Un." className="text-right">{row.price_per_unit}</td>
                        <td data-label="Moneda">{row.operated_currency}</td>
                        <td data-label="Plataforma" className="text-muted">{row.platform || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  className="btn-secondary"
                  onClick={onCancel}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={submitImport}
                  style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Importando...' : (
                    <>
                      <CheckCircle2 size={20} />
                      Importar transacciones
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
